import { describe, expect, it } from 'vitest';
import { PIPELINE_ORDER, pathNetwork } from '../art';
import { emptyPipeline } from '../data/pipeline';
import { villageChanges } from '../data/changes';
import { currentDayPart, msToNextMinute } from './daypart';
import { BURST_MS, FADE_MS, GrowthController, REDUCED_FADE_MS, TWEEN_MS, shouldFireworks } from './growth';
import { STOP_NODE, activeStops, pipelineTrackPoints } from './pipelineRoute';
import { stableOrder } from './stableOrder';

describe('stableOrder', () => {
  it('keeps old order, drops gone keys, appends new ones in desired order', () => {
    expect(stableOrder(['a', 'b', 'c'], ['c', 'x', 'a', 'y'])).toEqual(['a', 'c', 'x', 'y']);
    expect(stableOrder([], ['b', 'a'])).toEqual(['b', 'a']);
  });
  it('is idempotent', () => {
    const o = stableOrder(['a'], ['b', 'a']);
    expect(stableOrder(o, ['b', 'a'])).toEqual(o);
  });
});

describe('pipeline track', () => {
  const net = pathNetwork([]);
  const withCounts = (counts: Partial<Record<(typeof PIPELINE_ORDER)[number], number>>) =>
    emptyPipeline().map((s) => ({ ...s, count: counts[s.stop] ?? 0 }));

  it('every consecutive pair of stops is connected on the network', () => {
    for (let i = 0; i < PIPELINE_ORDER.length - 1; i++) {
      const pts = pipelineTrackPoints(net, withCounts({ [PIPELINE_ORDER[i] as string]: 1, [PIPELINE_ORDER[i + 1] as string]: 1 }));
      expect(pts.length).toBeGreaterThanOrEqual(2);
      expect(pts[0]).toEqual(net.nodes[STOP_NODE[PIPELINE_ORDER[i] as keyof typeof STOP_NODE]]);
      expect(pts[pts.length - 1]).toEqual(net.nodes[STOP_NODE[PIPELINE_ORDER[i + 1] as keyof typeof STOP_NODE]]);
    }
  });
  it('no active stop, or just one, means no track', () => {
    expect(pipelineTrackPoints(net, withCounts({}))).toEqual([]);
    expect(pipelineTrackPoints(net, withCounts({ chapel: 2 }))).toEqual([]);
  });
  it('runs through the stops in between (first to last active) in order', () => {
    const pts = pipelineTrackPoints(net, withCounts({ tavern: 1, 'town-hall': 1 }));
    for (const id of ['chapel', 'well', 'herbalist', 'schoolhouse'] as const) {
      expect(pts.some((p) => p.x === net.nodes[STOP_NODE[id]]?.x && p.y === net.nodes[STOP_NODE[id]]?.y)).toBe(true);
    }
    const iChapel = pts.findIndex((p) => p.x === net.nodes.chapel?.x && p.y === net.nodes.chapel?.y);
    const iSchool = pts.findIndex((p) => p.x === net.nodes.schoolhouse?.x && p.y === net.nodes.schoolhouse?.y);
    expect(iChapel).toBeLessThan(iSchool);
  });
  it('only counts stops with open work as active', () => {
    expect(activeStops(withCounts({ well: 3, tavern: 0 })).map((s) => s.stop)).toEqual(['well']);
  });
});

describe('GrowthController', () => {
  const mk = (stage: 'building' | 'testing', overall: number | null, t = { v: 0 }) => ({ t, c: new GrowthController(stage, overall, 'ok', () => t.v) });

  it('does nothing for identical props (a poll with unchanged data)', () => {
    const { c } = mk('building', 40);
    const v = c.version;
    expect(c.observe('building', 40, 'ok', false)).toBeNull();
    expect(c.version).toBe(v);
    expect(c.busy).toBe(false);
  });
  it('tweens overall within the building stage and plays a burst', () => {
    const { c, t } = mk('building', 40);
    t.v = 1000;
    expect(c.observe('building', 60, 'ok', false)).toBe('overall');
    expect(c.overallAt()).toBe(40);
    expect(c.burst).toBe(true);
    c.tick(1000 + TWEEN_MS / 2);
    expect(c.overallAt()).toBe(50);
    expect(c.tick(1000 + BURST_MS - 10)).toBe(true); // tween and burst still running
    expect(c.tick(1000 + TWEEN_MS + 10)).toBe(false);
    expect(c.overallAt()).toBe(60);
  });
  it('is idempotent when observed twice with the same new values (StrictMode double render)', () => {
    const { c, t } = mk('building', 40);
    t.v = 10;
    c.observe('building', 60, 'ok', false);
    const v = c.version;
    expect(c.observe('building', 60, 'ok', false)).toBeNull();
    expect(c.version).toBe(v);
    expect(c.overallAt()).toBe(40);
  });
  it('cross-fades on a stage change', () => {
    const { c, t } = mk('building', 90);
    t.v = 0;
    expect(c.observe('testing', 90, 'ok', false)).toBe('stage');
    expect(c.fadeInfo()).toMatchObject({ fromStage: 'building', fromOverall: 90, p: 0 });
    c.tick(FADE_MS / 2);
    expect(c.fadeInfo()?.p).toBeCloseTo(0.5);
    c.tick(FADE_MS);
    expect(c.fadeInfo()).toBeNull();
  });
  it('reduced motion: overall jumps without burst, stage change is a short cross-fade without burst', () => {
    const a = mk('building', 40);
    expect(a.c.observe('building', 60, 'ok', true)).toBeNull();
    expect(a.c.overallAt()).toBe(60);
    expect(a.c.burst).toBe(false);
    expect(a.c.busy).toBe(false);
    const b = mk('building', 40);
    b.c.observe('testing', 40, 'ok', true);
    expect(b.c.burst).toBe(false);
    b.c.tick(REDUCED_FADE_MS + 1);
    expect(b.c.busy).toBe(false);
  });
  it('a plot state change resets without animation', () => {
    const { c } = mk('building', 40);
    expect(c.observe('unknown', null, 'no-progress', false)).toBeNull();
    expect(c.busy).toBe(false);
  });
});

describe('shouldFireworks', () => {
  it('fires when a project becomes released, or on first sight when not yet seen', () => {
    expect(shouldFireworks('testing', 'released', true)).toBe(true);
    expect(shouldFireworks(null, 'released', false)).toBe(true);
    expect(shouldFireworks(null, 'released', true)).toBe(false);
    expect(shouldFireworks('released', 'released', false)).toBe(false);
    expect(shouldFireworks('testing', 'building', false)).toBe(false);
  });
  it('agrees with villageChanges().released', () => {
    const mkV = (stage: string) => ({ agents: [], projects: [{ id: 'p', progress: { stage, overall: 90 } }] }) as never;
    expect(villageChanges(mkV('testing'), mkV('released')).released).toEqual(['p']);
    expect(shouldFireworks('testing', 'released', true)).toBe(true);
  });
});

describe('currentDayPart', () => {
  const v = { timezone: 'Europe/Amsterdam' };
  const noon = Date.UTC(2026, 5, 21, 10, 0); // 12:00 local
  it('uses the wall clock by default', () => {
    const d = currentDayPart(v, '', noon);
    expect(d.part).toBe('day');
    expect(d.pinned).toBe(false);
  });
  it('?time=HH:MM pins the time of day', () => {
    const d = currentDayPart(v, '?time=23:30', noon);
    expect(d).toMatchObject({ part: 'night', pinned: true, localTime: '23:30' });
    expect(d.label).toContain('Amsterdam');
  });
  it('ignores junk and finds the next minute', () => {
    expect(currentDayPart(v, '?time=25:00', noon).pinned).toBe(false);
    expect(msToNextMinute(120_000)).toBe(60_050);
  });
});

import { MoveAnnouncer, moveMessage } from './announce';
import { sameVillage } from './sameVillage';

describe('MoveAnnouncer', () => {
  function setup() {
    let t = 0;
    const timers: Array<{ at: number; fn: () => void; id: number }> = [];
    const out: string[] = [];
    const a = new MoveAnnouncer((m) => out.push(m), {
      now: () => t,
      set: (fn, ms) => (timers.push({ at: t + ms, fn, id: timers.length + 1 }), timers.length),
      clear: () => undefined,
    });
    const advance = (ms: number) => {
      t += ms;
      for (const x of timers.splice(0).filter((x) => x.at <= t)) x.fn();
    };
    return { a, out, advance };
  }
  it('formats one and many moves', () => {
    expect(moveMessage(new Map([['ui-designer', 'the gatehouse']]))).toBe('ui-designer moved to the gatehouse');
    expect(moveMessage(new Map([['a', 'x'], ['b', 'y'], ['c', 'z']]))).toBe('3 agents changed place');
    expect(moveMessage(new Map())).toBeNull();
  });
  it('says nothing for no moves, at most one message per 10 s, merging the rest', () => {
    const { a, out, advance } = setup();
    a.push(new Map());
    expect(out).toEqual([]);
    a.push(new Map([['a', 'x']]));
    expect(out).toEqual(['a moved to x']);
    a.push(new Map([['b', 'y']]));
    a.push(new Map([['c', 'z']]));
    expect(out).toHaveLength(1);
    advance(10_001);
    expect(out).toEqual(['a moved to x', '2 agents changed place']);
  });
});

describe('sameVillage', () => {
  it('ignores generatedAt only', () => {
    const a = { generatedAt: '1', agents: [1] } as never;
    expect(sameVillage(a, { generatedAt: '2', agents: [1] } as never)).toBe(true);
    expect(sameVillage(a, { generatedAt: '1', agents: [2] } as never)).toBe(false);
  });
});
