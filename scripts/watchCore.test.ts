import { describe, expect, it } from 'vitest';
import { startWatching, type Closable, type WatchTarget } from './watchCore';

function harness(targetsFor: (n: number) => WatchTarget[]) {
  let now = 0;
  let id = 0;
  const timers = new Map<number, { at: number; fn: () => void; every?: number }>();
  const opened: string[] = [];
  const closed: string[] = [];
  const listeners = new Map<string, { onEvent: (f: string | null) => void; onError: () => void }>();
  const reasons: string[] = [];
  const warns: string[] = [];
  let failNext = false;
  const ids = new Map<string, string>();
  for (const t of targetsFor(1)) ids.set(t.path, 'i1');
  for (const t of targetsFor(2)) ids.set(t.path, 'i1');
  const w = startWatching({
    rebuild(reason) {
      reasons.push(reason);
      if (failNext) {
        failNext = false;
        throw new Error('boom');
      }
      return targetsFor(reasons.length);
    },
    watch(p, onEvent, onError): Closable | null {
      if (p.includes('missing')) return null;
      opened.push(p);
      listeners.set(p, { onEvent, onError });
      return { close: () => void closed.push(p) };
    },
    setTimeout: (fn, ms) => (timers.set(++id, { at: now + ms, fn }), id),
    clearTimeout: (h) => void timers.delete(h as number),
    setInterval: (fn, ms) => (timers.set(++id, { at: now + ms, fn, every: ms }), id),
    clearInterval: (h) => void timers.delete(h as number),
    warn: (m) => warns.push(m),
    identify: (p) => ids.get(p) ?? null,
  });
  const advance = (ms: number): void => {
    const end = now + ms;
    for (;;) {
      const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [k, t] = next;
      now = t.at;
      if (t.every) t.at += t.every;
      else timers.delete(k);
      t.fn();
    }
    now = end;
  };
  return { w, ids, advance, opened, closed, listeners, reasons, warns, fail: () => (failNext = true), timers };
}

const T = (p: string, accept: WatchTarget['accept'] = () => true): WatchTarget => ({ path: p, accept, label: p });

describe('watch orchestration', () => {
  it('debounces bursts into one rebuild and ignores filtered events', () => {
    const h = harness(() => [T('/a', (f) => f === 'progress.md')]);
    expect(h.reasons).toEqual(['start']);
    const l = h.listeners.get('/a');
    l?.onEvent('other.txt');
    h.advance(1000);
    expect(h.reasons).toHaveLength(1);
    l?.onEvent('progress.md');
    h.advance(100);
    l?.onEvent('progress.md');
    h.advance(200);
    expect(h.reasons).toHaveLength(1);
    h.advance(200);
    expect(h.reasons).toHaveLength(2);
    expect(h.reasons[1]).toMatch(/progress\.md changed/);
  });

  it('refreshes every 60 s without events', () => {
    const h = harness(() => []);
    h.advance(60_000);
    h.advance(60_000);
    expect(h.reasons).toEqual(['start', 'periodic refresh', 'periodic refresh']);
  });

  it('re-resolves targets after each rebuild: opens new, closes gone, skips unwatchable', () => {
    const h = harness((n) => (n === 1 ? [T('/a'), T('/missing/x')] : [T('/b'), T('/missing/x')]));
    expect(h.opened).toEqual(['/a']);
    h.listeners.get('/a')?.onEvent(null);
    h.advance(300);
    expect(h.opened).toEqual(['/a', '/b']);
    expect(h.closed).toEqual(['/a']);
  });

  it('survives a throwing rebuild and a dying watcher, then stops cleanly', () => {
    const h = harness(() => [T('/a')]);
    h.fail();
    h.listeners.get('/a')?.onEvent('x');
    h.advance(300);
    expect(h.warns[0]).toMatch(/rebuild failed/);
    h.listeners.get('/a')?.onError();
    h.advance(300);
    expect(h.opened).toEqual(['/a', '/a']);
    h.w.stop();
    expect(h.timers.size).toBe(0);
    expect(h.closed).toContain('/a');
    h.listeners.get('/a')?.onEvent('x');
    expect(h.timers.size).toBe(0);
  });

  it('reopens a watcher when the folder was deleted and recreated (new identity)', () => {
    const h = harness(() => [T('/a')]);
    expect(h.opened).toEqual(['/a']);
    h.ids.set('/a', 'i2');
    h.advance(60_000);
    expect(h.opened).toEqual(['/a', '/a']);
    expect(h.closed).toEqual(['/a']);
    h.ids.delete('/a'); // gone
    h.advance(60_000);
    expect(h.closed).toEqual(['/a', '/a']);
  });

  it('drops a watcher that keeps erroring until the next periodic refresh', () => {
    const h = harness(() => [T('/a')]);
    for (let i = 0; i < 3; i++) {
      h.listeners.get('/a')?.onError();
      h.advance(300);
    }
    const rebuilds = h.reasons.length;
    expect(h.opened).toHaveLength(3);
    expect(h.warns.some((w) => /keeps failing/.test(w))).toBe(true);
    h.advance(10_000);
    expect(h.reasons).toHaveLength(rebuilds);
    h.advance(60_000);
    expect(h.opened).toHaveLength(4);
  });
});
