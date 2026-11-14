import { describe, expect, it } from 'vitest';
import flowbro from '../../fixtures/flowbro/docs/progress.md?raw';
import userTest from '../../fixtures/flowbro/docs/user-tests/2026-11-20-first-open-paper-walkthrough.md?raw';
import review from '../../fixtures/flowbro/docs/reviews/2026-11-20-code-review.md?raw';
import cfg from '../../village.config.json';
import { buildVillage } from '../data/model';
import type { VillageConfig } from '../data/types';
import { SCENE, TAVERN_ANCHORS } from '../art';
import { estimateMeasure, layoutTags, placeCharacters, structures, tagWidth, tavernGuests } from './layout';

// Fixture only and a fixed clock, so the live docs/progress.md and today's date cannot change the result.
const config = cfg as unknown as VillageConfig;
const village = buildVillage({
  config: { ...config, projects: config.projects.filter((p) => p.id === 'flowbro') },
  sources: { flowbro: { progress: flowbro, userTests: [{ file: 'u.md', text: userTest }], reviews: [{ file: 'r.md', text: review }] } },
  wallClock: Date.UTC(2026, 10, 13, 12, 0),
});

describe('placeCharacters', () => {
  const chars = placeCharacters(village);

  it('places every agent exactly once', () => {
    expect(chars.map((c) => c.key).sort()).toEqual(village.agents.map((a) => a.name).sort());
  });

  it('keeps the orchestrator and the paladin on their reserved first spots', () => {
    const orch = chars.find((c) => c.key === 'orchestrator');
    expect(orch?.group).toBe('town-hall');
    const others = chars.filter((c) => c.group === 'town-hall' && c.key !== 'orchestrator');
    expect(others.every((c) => c.y > (orch?.y ?? 0))).toBe(true);
  });

  it('never puts two characters on the same point (tavern guests are inside, at the door)', () => {
    const out = chars.filter((c) => !c.inside);
    const seen = new Set(out.map((c) => `${Math.round(c.x)},${Math.round(c.y)}`));
    expect(seen.size).toBe(out.length);
  });

  it('puts every tavern agent inside, at the tavern door, and nobody else', () => {
    const inside = chars.filter((c) => c.inside);
    expect(inside.map((c) => c.key).sort()).toEqual(tavernGuests(village).map((a) => a.name).sort());
    expect(inside.length).toBeGreaterThan(0);
    const door = { x: SCENE.tavern.x + TAVERN_ANCHORS.door.x, y: SCENE.tavern.y + TAVERN_ANCHORS.door.y };
    for (const c of inside) {
      expect({ x: c.x, y: c.y, group: c.group, mug: c.mug, sleepy: c.sleepy }).toEqual({ ...door, group: 'tavern', mug: false, sleepy: false });
    }
    for (const c of chars.filter((x) => !x.inside)) expect(c.group).not.toBe('tavern');
  });

  it('maps states to poses', () => {
    const pose = (n: string) => chars.find((c) => c.key === n);
    expect(pose('typescript-pro')?.pose).toBe('work');
    expect(pose('relationship-advisor')?.pose).toBe('wait');
    expect(pose('ui-designer')).toMatchObject({ pose: 'stand', alert: true });
    expect(pose('accessibility-tester')?.pose).toBe('study');
    expect(pose('bro-writer')).toMatchObject({ inside: true });
  });

  it('draws structures back to front', () => {
    const ys = structures(village).map((s) => s.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });
});

describe('layoutTags', () => {
  it('does not overlap name tags in the fixture village', () => {
    const chars = placeCharacters(village);
    const tags = layoutTags(chars, 16, estimateMeasure, []);
    let overlaps = 0;
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const a = tags[i]!.box;
        const b = tags[j]!.box;
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) overlaps++;
      }
    }
    expect(overlaps).toBe(0);
  });
});

describe('specialists, pipeline carts and levels', () => {
  const place = (name: string, p: 'chapel' | 'well' | 'herbalist' | 'schoolhouse') => ({
    ...village,
    agents: village.agents.map((a) => (a.name === name ? { ...a, state: 'doing' as const, location: { kind: 'specialist' as const, place: p, projectId: 'flowbro' } } : a)),
  });

  it('draws the specialist buildings when their agents are in the roster, sorted with the rest', () => {
    const ids = structures(village).map((s) => s.id);
    for (const id of ['specialist:chapel', 'specialist:well', 'specialist:herbalist', 'specialist:schoolhouse']) expect(ids).toContain(id);
    const ys = structures(village).map((s) => s.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    const without = { ...village, agents: village.agents.filter((a) => a.name !== 'content-safety-reviewer') };
    expect(structures(without).map((s) => s.id)).not.toContain('specialist:chapel');
  });

  it('stands specialists on the work spots of their building', () => {
    const v = place('content-safety-reviewer', 'chapel');
    const c = placeCharacters(v).find((x) => x.key === 'content-safety-reviewer');
    expect(c?.group).toBe('specialist:chapel');
    expect(Math.abs((c?.x ?? 0) - SCENE.chapel.x)).toBeLessThan(120);
    expect(Math.abs((c?.y ?? 0) - SCENE.chapel.y)).toBeLessThan(120);
    expect(placeCharacters(v).length).toBe(v.agents.length);
  });

  it('draws a cart only at stops with open work', () => {
    const v = { ...village, pipeline: village.pipeline.map((s) => ({ ...s, count: s.stop === 'chapel' ? 1 : 0, items: s.stop === 'chapel' ? [{ projectId: 'flowbro', projectName: 'FlowBro', ref: 'T8', text: 'x', status: 'doing' as const }] : [] })) };
    expect(structures(v).filter((s) => s.id.startsWith('cart:')).map((s) => s.id)).toEqual(['cart:chapel']);
    expect(structures({ ...v, pipeline: undefined } as never).filter((s) => s.id.startsWith('cart:'))).toEqual([]);
  });

  it('includes the level badge in the tag width so tags still do not overlap', () => {
    const chars = placeCharacters(village);
    const plain = layoutTags(chars, 16, estimateMeasure, []);
    const lv = layoutTags(chars, 16, estimateMeasure, [], undefined, true);
    expect(lv.every((t) => t.level !== null && t.badgeW > 0)).toBe(true);
    expect(plain.every((t) => t.level === null)).toBe(true);
    for (const t of lv) expect(t.box.w).toBeGreaterThanOrEqual(7 + t.nameW + 6 + t.badgeW + 7);
    let overlaps = 0;
    for (let i = 0; i < lv.length; i++)
      for (let j = i + 1; j < lv.length; j++) {
        const a = lv[i]!.box;
        const b = lv[j]!.box;
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) overlaps++;
      }
    expect(overlaps).toBe(0);
    expect(tagWidth('x', 'y', 'Lv 2', 16, estimateMeasure).w).toBeGreaterThan(tagWidth('x', 'y', null, 16, estimateMeasure).w - 1);
  });
});
