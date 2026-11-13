import { describe, expect, it } from 'vitest';
import { PIPELINE_ORDER, buildPipeline, emptyPipeline, pipelineSummary } from './pipeline';
import { buildVillage } from './model';
import type { Task, TaskStatus, VillageConfig } from './types';

const t = (id: string, agent: string, status: TaskStatus): Task => ({ projectId: 'fb', id, title: `Title ${id}`, agent, status, rawStatus: status, notes: '' });
const name = (): string => 'FlowBro';

describe('pipeline', () => {
  it('lists all six stops in order even when empty', () => {
    const p = emptyPipeline();
    expect(p.map((s) => s.stop)).toEqual([...PIPELINE_ORDER]);
    expect(p.every((s) => s.count === 0)).toBe(true);
    expect(pipelineSummary(p)).toBe('Content pipeline: nothing in flight.');
  });
  it('collects open tasks per agent, excludes done, adds human sign-off at the town hall', () => {
    const p = buildPipeline(
      [t('T7', 'bro-writer', 'doing'), t('T6', 'bro-writer', 'done'), t('T8', 'content-safety-reviewer', 'review'), t('T9', 'parenting-advisor', 'todo'), t('T1', 'orchestrator', 'doing')],
      [
        { projectId: 'fb', text: 'Approve batch', raisedBy: 'content-safety-reviewer' },
        { projectId: 'fb', text: 'Other', raisedBy: 'orchestrator' },
        { projectId: 'fb', text: 'No author', raisedBy: null },
      ],
      name,
    );
    const by = Object.fromEntries(p.map((s) => [s.stop, s]));
    expect(by.tavern?.items.map((i) => i.ref)).toEqual(['T7']);
    expect(by.chapel?.items[0]).toMatchObject({ ref: 'T8', status: 'review', projectName: 'FlowBro', text: 'Title T8' });
    expect(by.well?.count).toBe(0);
    expect(by.schoolhouse?.count).toBe(1);
    expect(by['town-hall']?.items).toEqual([{ projectId: 'fb', projectName: 'FlowBro', ref: 'needs-you', text: 'Approve batch', status: 'needs-you' }]);
    expect(pipelineSummary(p)).toBe(
      'Content pipeline: 1 batch in drafting at the tavern (FlowBro T7); 1 batch in safety review at the chapel (FlowBro T8); 1 batch in advisor review at the schoolhouse (FlowBro T9); 1 batch waiting for sign-off at the town hall (FlowBro needs-you).',
    );
  });
  it('specialists work at their building when doing; other states are unchanged', () => {
    const progress = `# Progress: FlowBro

Stage: building
Overall: 10%
Updated: 2026-11-13 10:00

## Needs you
- [ ] Sign off batch 1 (raised by content-safety-reviewer)

## Tasks
| ID | Task | Agent | Status | Notes |
|---|---|---|---|---|
| T1 | Safety check | content-safety-reviewer | doing | |
| T2 | Relationship tone | relationship-advisor | review | |
| T3 | Health facts | womens-health-advisor | blocked | |
| T4 | Teen tone | parenting-advisor | todo | |
| T5 | Jokes | bro-writer | doing | |
`;
    const config: VillageConfig = {
      timezone: 'Europe/Amsterdam',
      xpEnabled: false,
      projects: [{ id: 'fb', name: 'FlowBro', path: '/x', building: 'hearth-lodge', position: { x: 0, y: 0 } }],
    };
    const v = buildVillage({ config, sources: { fb: { progress, userTests: [], reviews: [] } }, wallClock: Date.UTC(2026, 10, 13, 10) });
    const loc = (n: string) => v.agents.find((a) => a.name === n)?.location;
    expect(loc('content-safety-reviewer')).toEqual({ kind: 'specialist', place: 'chapel', projectId: 'fb' });
    expect(loc('relationship-advisor')).toEqual({ kind: 'gatehouse' });
    expect(loc('womens-health-advisor')).toEqual({ kind: 'town-hall-steps' });
    expect(loc('parenting-advisor')).toEqual({ kind: 'quest-board' });
    expect(loc('bro-writer')).toEqual({ kind: 'building', projectId: 'fb' });
    expect(v.pipeline.map((s) => s.count)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(v.xpSource).toBe('snapshot');
  });
});
