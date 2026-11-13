/** Screen reader parity for walking: one debounced polite message when agents changed place. Pure except for the injected timers. */
import { villageChanges } from '../data/changes';
import type { Village } from '../data/types';
import { placeName } from './describe';

/** Messages for the agents that moved between two villages (empty on first load or when nothing moved). */
export function movedAgents(prev: Village | null, next: Village): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of villageChanges(prev, next).moved) {
    const a = next.agents.find((x) => x.name === m.name);
    if (a) out.set(m.name, placeName(a, next));
  }
  return out;
}

export function moveMessage(moved: ReadonlyMap<string, string>): string | null {
  if (moved.size === 0) return null;
  if (moved.size === 1) {
    const [name, place] = [...moved.entries()][0] as [string, string];
    return `${name} moved to ${place}`;
  }
  return `${moved.size} agents changed place`;
}

export interface Timers {
  now(): number;
  set(fn: () => void, ms: number): number;
  clear(id: number): void;
}

/** At most one message per `gapMs`; moves that arrive in between are merged into the next one. */
export class MoveAnnouncer {
  private pending = new Map<string, string>();
  private last = -Infinity;
  private timer: number | null = null;

  constructor(private readonly emit: (msg: string) => void, private readonly t: Timers, private readonly gapMs = 10_000) {}

  push(moved: ReadonlyMap<string, string>): void {
    if (moved.size === 0) return;
    for (const [k, v] of moved) this.pending.set(k, v);
    if (this.timer !== null) return;
    const wait = Math.max(0, this.last + this.gapMs - this.t.now());
    if (wait === 0) this.flush();
    else this.timer = this.t.set(() => this.flush(), wait);
  }

  private flush(): void {
    this.timer = null;
    const msg = moveMessage(this.pending);
    this.pending = new Map();
    if (msg) {
      this.last = this.t.now();
      this.emit(msg);
    }
  }

  dispose(): void {
    if (this.timer !== null) this.t.clear(this.timer);
    this.timer = null;
  }
}
