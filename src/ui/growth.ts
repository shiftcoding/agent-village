/**
 * Growth animation state for one project building. Pure and clock-injected.
 *
 * Same `building` stage, new overall: the displayed overall tweens old -> new (TWEEN_MS) and a build burst plays.
 * Stage change: old art cross-fades into the new art (FADE_MS) and a build burst plays.
 * Reduced motion: overall jumps, no burst, stage changes cross-fade quickly (REDUCED_FADE_MS).
 * `observe` is idempotent for the same inputs (safe to call in render, also under StrictMode double render).
 */
import type { Stage } from '../data/types';

export const TWEEN_MS = 1500;
export const FADE_MS = 800;
export const REDUCED_FADE_MS = 200;
export const BURST_MS = 1300;
export const FIREWORKS_MS = 3000;

export type GrowthKind = 'overall' | 'stage' | null;

export interface FadeInfo {
  fromStage: Stage;
  fromOverall: number | null;
  /** 0..1, progress of the cross-fade: opacity of the new art; the old art uses 1 - p. */
  p: number;
}

function ease(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

export class GrowthController {
  /** Bumps on every observed change (drives the effect that runs the frame loop, and the burst key). */
  version = 0;
  now: number;
  private stage: Stage;
  private overall: number | null;
  private key: string;
  private tween: { from: number; to: number; start: number } | null = null;
  private fade: { fromStage: Stage; fromOverall: number | null; start: number; ms: number } | null = null;
  private burstUntil = 0;

  constructor(stage: Stage, overall: number | null, key: string, private readonly clock: () => number) {
    this.stage = stage;
    this.overall = overall;
    this.key = key;
    this.now = clock();
  }

  /** Feed the current props. `key` is anything that should reset the animation (e.g. the plot state). */
  observe(stage: Stage, overall: number | null, key: string, reduced: boolean): GrowthKind {
    if (key !== this.key) {
      this.key = key;
      this.stage = stage;
      this.overall = overall;
      this.tween = null;
      this.fade = null;
      this.burstUntil = 0;
      this.version++;
      return null;
    }
    if (stage === this.stage && overall === this.overall) return null;
    this.now = this.clock();
    const shown = this.overallAt();
    let kind: GrowthKind = null;
    if (stage !== this.stage) {
      this.tween = null;
      this.fade = { fromStage: this.stage, fromOverall: shown, start: this.now, ms: reduced ? REDUCED_FADE_MS : FADE_MS };
      this.burstUntil = reduced ? 0 : this.now + BURST_MS;
      kind = 'stage';
    } else if (stage === 'building' && !reduced && shown !== null && overall !== null) {
      this.tween = { from: shown, to: overall, start: this.now };
      this.burstUntil = this.now + BURST_MS;
      kind = 'overall';
    } else {
      this.tween = null;
    }
    this.stage = stage;
    this.overall = overall;
    this.version++;
    return kind;
  }

  /** The overall to draw right now. */
  overallAt(): number | null {
    const t = this.tween;
    if (!t) return this.overall;
    const p = Math.max(0, Math.min(1, (this.now - t.start) / TWEEN_MS));
    return Math.round(t.from + (t.to - t.from) * ease(p));
  }

  fadeInfo(): FadeInfo | null {
    const f = this.fade;
    if (!f) return null;
    return { fromStage: f.fromStage, fromOverall: f.fromOverall, p: Math.max(0, Math.min(1, (this.now - f.start) / f.ms)) };
  }

  get burst(): boolean {
    return this.now < this.burstUntil;
  }

  /** Advance to `now`; finished parts are cleared. Returns true while something still animates. */
  tick(now: number): boolean {
    this.now = now;
    if (this.tween && now - this.tween.start >= TWEEN_MS) this.tween = null;
    if (this.fade && now - this.fade.start >= this.fade.ms) this.fade = null;
    return this.busy;
  }

  get busy(): boolean {
    return this.tween !== null || this.fade !== null || this.now < this.burstUntil;
  }
}

/** Fireworks decision. `prev` is null on the first sight of the project in this page; `seen` = remembered earlier. */
export function shouldFireworks(prev: Stage | null, next: Stage, seenBefore: boolean): boolean {
  if (next !== 'released') return false;
  if (prev === null) return !seenBefore;
  return prev !== 'released';
}

export const releasedKey = (projectId: string): string => `va.released.${projectId}`;
