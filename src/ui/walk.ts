/**
 * Walking: pure route building, interpolation and a small framework-free runner (injected clock and frame
 * scheduler, so it is testable). No React in here. The runner writes positions through `apply` (the UI sets the
 * `transform` attribute of the character's group) and reports state changes only when they really change
 * (start, a change of facing at a bend, arrival), never once per frame.
 */
import { routeAlongPaths, type PathNetwork } from '../art';

export type Pt = { x: number; y: number };

/** Scene units per second. */
export const WALK_SPEED = 110;
/** A walk never takes longer than this; longer routes simply go faster. */
export const WALK_MAX_MS = 4500;
/** Moves shorter than this just happen (no walk). */
export const MIN_WALK = 6;
const SAME = 0.5;

export function samePoint(a: Pt, b: Pt, eps = SAME): boolean {
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;
}

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Id of the network node closest to `p` (ties: first in key order), or null for an empty network. */
export function nearestNode(net: PathNetwork, p: Pt): string | null {
  let best: string | null = null;
  let bd = Infinity;
  for (const [id, n] of Object.entries(net.nodes)) {
    const d = dist(n, p);
    if (d < bd) {
      bd = d;
      best = id;
    }
  }
  return best;
}

function dedupe(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || !samePoint(last, p, 0.01)) out.push({ x: p.x, y: p.y });
  }
  return out;
}

/**
 * Route for a walker: old spot, nearest path node, along the paths, node nearest to the new spot, new spot.
 * Falls back to a straight line when the network has no route, or when both spots are nearest to the same node.
 */
export function buildRoute(net: PathNetwork, from: Pt, to: Pt): Pt[] {
  const a = nearestNode(net, from);
  const b = nearestNode(net, to);
  if (a === null || b === null) return dedupe([from, to]);
  // Same nearest node at both ends: no path travel is needed, walk straight (no detour out to the node and back).
  if (a === b) return dedupe([from, to]);
  const along = routeAlongPaths(net, a, b);
  if (along.length === 0) return dedupe([from, to]);
  return dedupe([from, ...along, to]);
}

export interface Timeline {
  pts: Pt[];
  /** Cumulative length at each point. */
  cum: number[];
  length: number;
  /** Milliseconds, at most `maxMs`. */
  duration: number;
}

export function makeTimeline(pts: Pt[], speed = WALK_SPEED, maxMs = WALK_MAX_MS): Timeline {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push((cum[i - 1] as number) + dist(pts[i - 1] as Pt, pts[i] as Pt));
  const length = cum[cum.length - 1] ?? 0;
  const duration = length <= 0 ? 0 : Math.min(maxMs, (length / speed) * 1000);
  return { pts, cum, length, duration };
}

export interface Sample extends Pt {
  /** Facing: true when the current segment heads left (the art faces right by default). */
  flip: boolean;
  done: boolean;
}

/** Position after `elapsedMs` at constant speed along the route. `prevFlip` is kept on (almost) vertical segments. */
export function sampleTimeline(tl: Timeline, elapsedMs: number, prevFlip = false): Sample {
  const last = tl.pts[tl.pts.length - 1] ?? { x: 0, y: 0 };
  if (tl.duration <= 0 || elapsedMs >= tl.duration) return { x: last.x, y: last.y, flip: prevFlip, done: true };
  const d = Math.max(0, elapsedMs / tl.duration) * tl.length;
  let i = 1;
  while (i < tl.cum.length - 1 && (tl.cum[i] as number) < d) i++;
  const a = tl.pts[i - 1] as Pt;
  const b = tl.pts[i] as Pt;
  const segLen = (tl.cum[i] as number) - (tl.cum[i - 1] as number);
  const k = segLen <= 0 ? 1 : (d - (tl.cum[i - 1] as number)) / segLen;
  const dx = b.x - a.x;
  const flip = Math.abs(dx) < 2 ? prevFlip : dx < 0;
  return { x: a.x + dx * k, y: a.y + (b.y - a.y) * k, flip, done: false };
}

/** Would a data change from `from` to `to` start a walk? (Used by the name tag to hide itself in the same render.) */
export function willWalk(from: Pt | undefined, to: Pt, reduced: boolean): boolean {
  return !reduced && from !== undefined && dist(from, to) >= MIN_WALK;
}

/* ------------------------------------------------------------------ runner */

export interface RunnerEnv {
  now(): number;
  request(cb: (t: number) => void): number;
  cancel(id: number): void;
}

export interface WalkView {
  flip: boolean;
}

export interface RunnerIO {
  /** Write the position (the UI sets the transform attribute). */
  apply(p: Pt): void;
  /** Walking state: `{flip}` while walking (called at the start and when the facing changes), null when arrived. */
  onState(view: WalkView | null): void;
  /** The character stands still at `p` (arrival, or an instant move). */
  onSettle(p: Pt): void;
}

export type MoveResult = 'none' | 'walk' | 'jump';

export class WalkRunner {
  pos: Pt;
  private dest: Pt;
  private anim: { tl: Timeline; start: number; id: number } | null = null;
  /** True while the UI has been told "walking" and not yet "arrived". */
  private shown = false;
  private flip = false;

  constructor(start: Pt, private readonly io: RunnerIO, private readonly env: RunnerEnv) {
    this.pos = { ...start };
    this.dest = { ...start };
  }

  get walking(): boolean {
    return this.anim !== null;
  }

  /**
   * New destination. Same destination: nothing happens ('none'). Reduced motion or a very short move: the character
   * is at the destination at once ('jump'). Otherwise a walk starts from wherever the character is right now
   * (also in the middle of an earlier walk).
   */
  moveTo(dest: Pt, net: PathNetwork, reduced: boolean): MoveResult {
    if (samePoint(dest, this.dest)) return 'none';
    const from = { ...this.pos };
    this.stopAnim();
    this.dest = { ...dest };
    const tl = reduced || dist(from, dest) < MIN_WALK ? null : makeTimeline(buildRoute(net, from, dest));
    if (!tl || tl.length < MIN_WALK || tl.duration <= 0) {
      this.arrive();
      return 'jump';
    }
    this.io.apply(from);
    const anim = { tl, start: this.env.now(), id: 0 };
    this.anim = anim;
    anim.id = this.env.request((t) => this.frame(t));
    return 'walk';
  }

  /** Snap to the destination now (reduced motion switched on mid-walk). */
  finish(): void {
    if (!this.anim) return;
    this.stopAnim();
    this.arrive();
  }

  cancel(): void {
    this.stopAnim();
  }

  private stopAnim(): void {
    if (this.anim) {
      this.env.cancel(this.anim.id);
      this.anim = null;
    }
  }

  private arrive(): void {
    this.pos = { ...this.dest };
    this.io.apply(this.pos);
    this.io.onSettle(this.pos);
    if (this.shown) {
      this.shown = false;
      this.flip = false;
      this.io.onState(null);
    }
  }

  private frame(t: number): void {
    const a = this.anim;
    if (!a) return;
    const s = sampleTimeline(a.tl, Math.max(0, t - a.start), this.flip);
    if (s.done) {
      this.anim = null;
      this.arrive();
      return;
    }
    this.pos = { x: s.x, y: s.y };
    this.io.apply(this.pos);
    if (!this.shown || s.flip !== this.flip) {
      this.shown = true;
      this.flip = s.flip;
      this.io.onState({ flip: s.flip });
    }
    a.id = this.env.request((tt) => this.frame(tt));
  }
}
