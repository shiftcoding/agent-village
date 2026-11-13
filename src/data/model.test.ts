import { describe, expect, it } from 'vitest';
import flowbro from '../../fixtures/flowbro/docs/progress.md?raw';
import userTest from '../../fixtures/flowbro/docs/user-tests/2026-11-20-first-open-paper-walkthrough.md?raw';
import review from '../../fixtures/flowbro/docs/reviews/2026-11-20-code-review.md?raw';
import cfg from '../../village.config.json';
import { buildVillage } from './model';
import { ROSTER } from './roster';
import { parseWallTime } from './time';
import type { Agent, VillageConfig } from './types';

const config = cfg as unknown as VillageConfig;
const fixtureOnly: VillageConfig = { ...config, projects: config.projects.filter((p) => p.id === 'flowbro') };
// A frozen copy of the shape docs/progress.md had when this test was written. The live file changes
// with every task, so the test must not import it.
const villageDocs = `# Progress: Agent Village

Stage: building
Overall: 20%
Updated: 2026-11-13 11:45

## Needs you
- [ ] Review phase 1 (raised by orchestrator)

## Tasks
| ID | Task | Agent | Status | Notes |
|---|---|---|---|---|
| T1 | Scaffold | orchestrator | done | |
| T2 | Art direction | ui-designer | doing | |
| T3 | Parser | typescript-pro | doing | |

## Log
- 2026-11-13 11:40 ui-designer: Started T2
`;
const sources = {
  flowbro: { progress: flowbro, userTests: [{ file: 'u.md', text: userTest }], reviews: [{ file: 'r.md', text: review }] },
  'agent-village': { progress: villageDocs, userTests: [], reviews: [] },
};
const WALL = Date.UTC(2026, 10, 13, 12, 0);

describe('roster', () => {
  it('has 21 agents', () => {
    expect(ROSTER).toHaveLength(21);
    expect(new Set(ROSTER.map((a) => a.name)).size).toBe(21);
  });
});

describe('FlowBro fixture village', () => {
  const v = buildVillage({ config: fixtureOnly, sources, wallClock: WALL });
  const agent = (n: string): Agent => {
    const a = v.agents.find((x) => x.name === n);
    if (!a) throw new Error(`missing ${n}`);
    return a;
  };
  const project = v.projects[0];

  it('uses the file Updated time as reference for fixtures', () => {
    expect(project?.isFixture).toBe(true);
    expect(project?.referenceSource).toBe('file-updated');
    expect(project?.referenceTime).toBe(parseWallTime('2026-11-20 16:40', 'Europe/Amsterdam'));
  });

  it('places agents', () => {
    expect(v.agents).toHaveLength(21);
    expect(agent('react-specialist').location).toEqual({ kind: 'gatehouse' });
    expect(agent('typescript-pro').location).toEqual({ kind: 'building', projectId: 'flowbro' });
    expect(agent('ui-designer').location).toEqual({ kind: 'town-hall-steps' });
    expect(agent('ui-designer').hasBlocked).toBe(true);
    expect(agent('womens-health-advisor').location).toEqual({ kind: 'quest-board' });
    const smith = agent('backend-developer');
    expect(smith.location).toEqual({ kind: 'tavern' });
    expect(smith.note).toMatch(/FlowBro has no backend/);
    const orch = agent('orchestrator');
    expect(orch.location).toEqual({ kind: 'town-hall-steps' });
    expect(orch.state).toBe('idle');
    expect(orch.note).toBe('Stands on the town hall steps');
    expect(agent('code-reviewer')).toMatchObject({ state: 'idle', location: { kind: 'tavern' } });
    expect(agent('user-simulator').personas).toHaveLength(4);
  });

  it('computes sleepy relative to each project reference time', () => {
    expect(agent('devops-engineer').sleepy).toBe(true); // last log 2026-11-19 10:15
    expect(agent('code-reviewer').sleepy).toBe(true); // never logged
  });

  it('computes health at the Updated time', () => {
    const kinds = project?.health.map((h) => h.kind);
    expect(kinds).toEqual(expect.arrayContaining(['active', 'needs-you', 'failing', 'friction']));
    expect(kinds).not.toContain('stale');
    expect(project?.health.find((h) => h.kind === 'needs-you')?.label).toBe('Needs you (3)');
    expect(project?.health.find((h) => h.kind === 'failing')?.detail).toBe(
      'Storm cloud: 1 open review finding on a task marked done (T1).',
    );
  });

  it('turns stale 8 days later', () => {
    const later = (parseWallTime('2026-11-20 16:40', 'Europe/Amsterdam') ?? 0) + 8 * 86_400_000;
    const s = buildVillage({ config: fixtureOnly, sources, wallClock: WALL, nowOverride: later });
    const kinds = s.projects[0]?.health.map((h) => h.kind);
    expect(kinds).toContain('stale');
    expect(kinds).not.toContain('active');
    expect(s.projects[0]?.referenceSource).toBe('override');
  });

  it('builds the town square', () => {
    expect(v.needsYou.map((n) => n.raisedBy)).toEqual(['ui-designer', 'relationship-advisor', 'product-manager']);
    expect(v.needsYou[0]?.projectName).toBe('FlowBro');
    expect(v.questBoard.map((q) => q.task.id)).toEqual(['T9', 'T11', 'T12', 'T14']);
    expect(v.questBoard[0]?.villageClass).toBe('healer');
    expect(v.chronicle).toHaveLength(8);
    expect(v.chronicle[0]?.agent).toBe('orchestrator');
    expect(v.weeklyTally).toEqual([{ projectId: 'flowbro', projectName: 'FlowBro', done: 3 }]);
  });

  it('computes XP', () => {
    expect(agent('react-specialist')).toMatchObject({ xp: 10, level: 1 });
    expect(v.xpEnabled).toBe(false);
  });
});

describe('per-project sleepy and weekly credit', () => {
  it('does not mark an agent sleepy for logging today in another project', () => {
    const v = buildVillage({ config, sources, wallClock: Date.UTC(2026, 10, 13, 13, 30) });
    expect(v.agents.find((a) => a.name === 'orchestrator')?.sleepy).toBe(false);
  });
  it('credits one done task per log line', () => {
    const md = '# Progress: X\n## Tasks\n| ID | Task | Agent | Status |\n|---|---|---|---|\n| T1 | a | x-a | done |\n| T2 | b | x-a | done |\n## Log\n- 2026-11-20 10:00 x-a: did something\n';
    const v = buildVillage({ config: fixtureOnly, sources: { flowbro: { progress: md.replace('# Progress: X', '# Progress: X\nUpdated: 2026-11-20 12:00'), userTests: [], reviews: [] } }, wallClock: WALL });
    expect(v.projects[0]?.doneThisWeek).toBe(1);
  });
});

describe('both projects, strangers and bad input', () => {
  it('lets doing beat blocked across projects', () => {
    const v = buildVillage({ config, sources, wallClock: WALL });
    const ui = v.agents.find((a) => a.name === 'ui-designer');
    expect(ui?.state).toBe('doing');
    expect(ui?.location).toEqual({ kind: 'building', projectId: 'agent-village' });
    expect(ui?.hasBlocked).toBe(true);
    expect(v.projects[1]?.referenceSource).toBe('wall-clock');
  });

  it('shows typos as hooded strangers', () => {
    const md = '# Progress: X\n## Needs you\n- [ ] q (raised by ghost-a)\n## Tasks\n| ID | Task | Agent | Status |\n|---|---|---|---|\n| T1 | a | typscript-pro | todo |\n## Log\n- 2026-11-20 10:00 ghost-b: hi\n';
    const v = buildVillage({ config: fixtureOnly, sources: { flowbro: { progress: md, userTests: [], reviews: [] } }, wallClock: WALL });
    expect(v.agents).toHaveLength(24);
    const s = v.agents.find((a) => a.name === 'typscript-pro');
    expect(s).toMatchObject({ def: null, villageClass: 'stranger', state: 'todo' });
    expect(v.agents.find((a) => a.name === 'ghost-a')?.villageClass).toBe('stranger');
    expect(v.questBoard[0]?.villageClass).toBe('stranger');
  });

  it('marks plots', () => {
    const c: VillageConfig = {
      ...config,
      projects: [
        { id: 'a', name: 'A', path: null, building: 'unknown', position: { x: 0, y: 0 } },
        { id: 'b', name: 'B', path: '~/b', building: 'hearth-lodge', position: { x: 1, y: 0 } },
      ],
    };
    const v = buildVillage({ config: c, sources: {}, wallClock: WALL });
    expect(v.projects.map((p) => p.plot)).toEqual(['no-folder', 'no-progress']);
    expect(v.agents).toHaveLength(21);
    expect(v.agents.every((a) => a.state === 'idle')).toBe(true);
  });

  it('does not throw on garbage sources', () => {
    const v = buildVillage({
      config: fixtureOnly,
      sources: { flowbro: { progress: '\u0000|||## Tasks', userTests: [{ file: 'x', text: '' }], reviews: [{ file: 'y', text: '- [ ]' }] } },
      wallClock: WALL,
    });
    expect(v.projects[0]?.plot).toBe('ok');
    expect(v.warnings.length).toBeGreaterThan(0);
  });
});
