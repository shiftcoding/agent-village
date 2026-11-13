import { describe, expect, it } from 'vitest';
import { pathNetwork } from '../art';
import { MIN_WALK, WALK_MAX_MS, WalkRunner, buildRoute, makeTimeline, nearestNode, sampleTimeline, willWalk, type Pt, type RunnerEnv, type WalkView } from './walk';

const net = pathNetwork([{ id: 'flowbro', x: 800 + 3 * 153.3, y: 470 }]);

function fakeEnv() {
  let t = 0;
  let nextId = 1;
  const queue = new Map<number, (t: number) => void>();
  const env: RunnerEnv = {
    now: () => t,
    request: (cb) => {
      const id = nextId++;
      queue.set(id, cb);
      return id;
    },
    cancel: (id) => void queue.delete(id),
  };
  const advance = (ms: number): void => {
    t += ms;
    const cbs = [...queue.entries()];
    queue.clear();
    for (const [, cb] of cbs) cb(t);
  };
  return { env, advance, pending: () => queue.size };
}

describe('buildRoute', () => {
  it('goes spot -> nearest node -> along the paths -> nearest node -> spot', () => {
    const from = { x: 1240 + 20, y: 800 + 30 };
    const to = { x: 575 + 10, y: 820 + 40 };
    const r = buildRoute(net, from, to);
    expect(r[0]).toEqual(from);
    expect(r[r.length - 1]).toEqual(to);
    expect(r.length).toBeGreaterThan(3);
    const a = nearestNode(net, from) as string;
    expect(r[1]).toEqual(net.nodes[a]);
  });

  it('falls back to a straight line when the network is empty', () => {
    expect(buildRoute({ nodes: {}, edges: [] }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
  });

  it('handles both ends next to the same node', () => {
    const n = net.nodes['plaza'] as Pt;
    const r = buildRoute(net, { x: n.x + 5, y: n.y }, { x: n.x - 5, y: n.y });
    expect(r.length).toBe(2);
  });
});

describe('timeline', () => {
  const pts = [{ x: 0, y: 0 }, { x: 110, y: 0 }, { x: 110, y: 110 }];
  it('walks at about 110 units per second', () => {
    const tl = makeTimeline(pts);
    expect(tl.length).toBe(220);
    expect(Math.round(tl.duration)).toBe(2000);
    const mid = sampleTimeline(tl, 500);
    expect(mid.x).toBeCloseTo(55);
    expect(mid.flip).toBe(false);
    const turn = sampleTimeline(tl, 1500);
    expect(turn).toMatchObject({ x: 110, done: false });
    expect(turn.y).toBeCloseTo(55);
  });
  it('caps the total at 4.5 s by walking faster', () => {
    const tl = makeTimeline([{ x: 0, y: 0 }, { x: 2000, y: 0 }]);
    expect(tl.duration).toBe(WALK_MAX_MS);
    expect(sampleTimeline(tl, WALK_MAX_MS).done).toBe(true);
  });
  it('flips when heading left and keeps the facing on vertical segments', () => {
    const tl = makeTimeline([{ x: 100, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 100 }]);
    expect(sampleTimeline(tl, 200).flip).toBe(true);
    expect(sampleTimeline(tl, 1500, true).flip).toBe(true);
  });
});

describe('willWalk', () => {
  it('is false for reduced motion, unknown origin and tiny moves', () => {
    expect(willWalk({ x: 0, y: 0 }, { x: 100, y: 0 }, true)).toBe(false);
    expect(willWalk(undefined, { x: 100, y: 0 }, false)).toBe(false);
    expect(willWalk({ x: 0, y: 0 }, { x: MIN_WALK - 1, y: 0 }, false)).toBe(false);
    expect(willWalk({ x: 0, y: 0 }, { x: 100, y: 0 }, false)).toBe(true);
  });
});

describe('WalkRunner', () => {
  function setup(start: Pt) {
    const f = fakeEnv();
    const applied: Pt[] = [];
    const states: Array<WalkView | null> = [];
    const settled: Pt[] = [];
    const runner = new WalkRunner(start, { apply: (p) => applied.push(p), onState: (v) => states.push(v), onSettle: (p) => settled.push(p) }, f.env);
    return { ...f, runner, applied, states, settled };
  }

  it('does nothing when the destination is unchanged (polls do not restart walks)', () => {
    const s = setup({ x: 100, y: 100 });
    expect(s.runner.moveTo({ x: 100.2, y: 100 }, net, false)).toBe('none');
    expect(s.pending()).toBe(0);
    expect(s.applied).toHaveLength(0);
  });

  it('walks, reports state only at start and arrival, and settles on the destination', () => {
    const s = setup({ x: 1260, y: 830 });
    const dest = { x: 585, y: 860 };
    expect(s.runner.moveTo(dest, net, false)).toBe('walk');
    expect(s.runner.walking).toBe(true);
    let frames = 0;
    while (s.runner.walking && frames < 400) {
      s.advance(16);
      frames++;
    }
    expect(frames).toBeGreaterThan(10);
    expect(s.runner.pos).toEqual(dest);
    expect(s.settled).toEqual([dest]);
    expect(s.states[0]).toMatchObject({ flip: expect.any(Boolean) });
    expect(s.states[s.states.length - 1]).toBeNull();
    // far fewer state changes than frames
    expect(s.states.length).toBeLessThan(frames / 4);
    expect(s.pending()).toBe(0);
  });

  it('takes at most about 4.5 s even for a long route', () => {
    const s = setup({ x: 1260, y: 830 });
    s.runner.moveTo({ x: 330, y: 770 }, net, false);
    s.advance(WALK_MAX_MS + 20);
    expect(s.runner.walking).toBe(false);
  });

  it('starts a new walk from the current interpolated point when data arrives mid-walk', () => {
    const s = setup({ x: 1260, y: 830 });
    s.runner.moveTo({ x: 585, y: 860 }, net, false);
    s.advance(16);
    s.advance(800);
    const mid = { ...s.runner.pos };
    expect(mid.x).toBeLessThan(1260);
    expect(mid.x).toBeGreaterThan(585);
    s.applied.length = 0;
    s.runner.moveTo({ x: 1490, y: 800 }, net, false);
    expect(s.applied[0]).toEqual(mid);
    expect(s.runner.walking).toBe(true);
    s.advance(10000);
    expect(s.runner.pos).toEqual({ x: 1490, y: 800 });
  });

  it('jumps with reduced motion and for tiny moves', () => {
    const s = setup({ x: 100, y: 100 });
    expect(s.runner.moveTo({ x: 900, y: 500 }, net, true)).toBe('jump');
    expect(s.runner.pos).toEqual({ x: 900, y: 500 });
    expect(s.pending()).toBe(0);
    expect(s.runner.moveTo({ x: 903, y: 500 }, net, false)).toBe('jump');
  });

  it('finish() snaps a running walk to the destination, cancel() stops the frame loop', () => {
    const s = setup({ x: 1260, y: 830 });
    s.runner.moveTo({ x: 585, y: 860 }, net, false);
    s.advance(100);
    s.runner.finish();
    expect(s.runner.pos).toEqual({ x: 585, y: 860 });
    expect(s.states[s.states.length - 1]).toBeNull();
    const t = setup({ x: 1260, y: 830 });
    t.runner.moveTo({ x: 585, y: 860 }, net, false);
    t.runner.cancel();
    expect(t.pending()).toBe(0);
  });
});
