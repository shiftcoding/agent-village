import { describe, expect, it } from 'vitest';
import flowbro from '../../fixtures/flowbro/docs/progress.md?raw';
import userTest from '../../fixtures/flowbro/docs/user-tests/2026-11-20-first-open-paper-walkthrough.md?raw';
import review from '../../fixtures/flowbro/docs/reviews/2026-11-20-code-review.md?raw';
import cfg from '../../village.config.json';
import { buildVillage } from '../data/model';
import type { Agent, VillageConfig } from '../data/types';
import { TIP_TITLE_MAX, agentTip, agentTipParts } from './describe';

// Fixture only and a fixed clock (same set-up as layout.test.ts).
const config = cfg as unknown as VillageConfig;
const village = buildVillage({
  config: { ...config, projects: config.projects.filter((p) => p.id === 'flowbro') },
  sources: { flowbro: { progress: flowbro, userTests: [{ file: 'u.md', text: userTest }], reviews: [{ file: 'r.md', text: review }] } },
  wallClock: Date.UTC(2026, 10, 13, 12, 0),
});
const agent = (n: string): Agent => village.agents.find((a) => a.name === n) as Agent;

describe('agentTipParts (T49 short tooltip)', () => {
  it('splits a working agent into name, role, status word, task id and short title, and place', () => {
    const a = agent('typescript-pro');
    const t = agentTipParts(a, village);
    expect(t.name).toBe('typescript-pro');
    expect(t.status).toEqual({ icon: 'doing', label: 'Doing' });
    expect(t.task?.id).toMatch(/^T\d+$/);
    expect(t.task!.title.length).toBeLessThanOrEqual(TIP_TITLE_MAX);
    expect(t.place).not.toMatch(/^the /);
    expect(t.place.charAt(0)).toBe(t.place.charAt(0).toUpperCase());
    expect(t.level).toBeNull();
  });

  it('keeps every fact of the full sentence (the aria-label) except the long task title', () => {
    for (const a of village.agents) {
      const t = agentTipParts(a, village, true);
      const full = agentTip(a, village, true);
      expect(full).toContain(a.name);
      if (t.task) expect(full).toContain(t.task.id);
      expect(full.toLowerCase()).toContain(t.place.toLowerCase().replace(/ \(.*\)$/, ''));
      expect(t.level).toBe(`Lv ${a.level} · ${a.xp} XP`);
    }
  });

  it('shows a blocked task elsewhere and sleep as their own rows', () => {
    for (const a of village.agents) {
      const t = agentTipParts(a, village);
      expect(t.flags.some((f) => f.icon === 'blocked')).toBe(a.hasBlocked && a.state !== 'blocked');
      expect(t.flags.some((f) => f.label.startsWith('Asleep'))).toBe(a.state === 'idle' && a.sleepy);
    }
  });

  it('says resting inside for tavern guests and has no task row', () => {
    const idle = village.agents.find((a) => a.state === 'idle' && a.location.kind === 'tavern') as Agent;
    const t = agentTipParts(idle, village);
    expect(t.status.label).toBe('Resting inside');
    expect(t.task).toBeNull();
    expect(t.place).toBe('Tavern');
  });
});
