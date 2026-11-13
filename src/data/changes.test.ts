import { describe, expect, it } from 'vitest';
import { villageChanges } from './changes';
import { emptyPipeline } from './pipeline';
import type { Agent, Location, Project, Stage, Village } from './types';

const agent = (name: string, location: Location): Agent =>
  ({ name, def: null, villageClass: 'stranger', state: 'idle', location, projectId: null, hasBlocked: false, tasks: [], doneThisWeek: 0, sleepy: false, note: null, xp: 0, level: 1, tasksDone: 0 }) as Agent;
const project = (id: string, stage: Stage, overall: number | null): Project =>
  ({ id, progress: { stage, overall } }) as unknown as Project;
const village = (agents: Agent[], projects: Project[]): Village =>
  ({ generatedAt: '', xpEnabled: false, timezone: 'UTC', xpSource: 'snapshot', xpSince: null, pipeline: emptyPipeline(), projects, agents, needsYou: [], questBoard: [], chronicle: [], weeklyTally: [], warnings: [] }) as Village;

describe('villageChanges', () => {
  it('is empty for identical or first villages', () => {
    const v = village([agent('a', { kind: 'tavern' })], [project('p', 'building', 40)]);
    const empty = { moved: [], stageChanged: [], released: [] };
    expect(villageChanges(v, village([agent('a', { kind: 'tavern' })], [project('p', 'building', 40)]))).toEqual(empty);
    expect(villageChanges(null, v)).toEqual(empty);
  });
  it('reports moves, including specialist place changes; ignores new agents', () => {
    const prev = village([agent('a', { kind: 'building', projectId: 'p' }), agent('c', { kind: 'specialist', place: 'chapel', projectId: 'p' })], []);
    const next = village(
      [agent('a', { kind: 'tavern' }), agent('b', { kind: 'tavern' }), agent('c', { kind: 'specialist', place: 'well', projectId: 'p' })],
      [],
    );
    const ch = villageChanges(prev, next);
    expect(ch.moved.map((m) => m.name)).toEqual(['a', 'c']);
    expect(ch.moved[0]).toMatchObject({ from: { kind: 'building', projectId: 'p' }, to: { kind: 'tavern' } });
  });
  it('reports stage/overall changes and releases', () => {
    const ch = villageChanges(village([], [project('p', 'testing', 90), project('q', 'building', 10)]), village([], [project('p', 'released', 100), project('q', 'building', 20)]));
    expect(ch.stageChanged).toEqual([
      { projectId: 'p', fromStage: 'testing', toStage: 'released', fromOverall: 90, toOverall: 100 },
      { projectId: 'q', fromStage: 'building', toStage: 'building', fromOverall: 10, toOverall: 20 },
    ]);
    expect(ch.released).toEqual(['p']);
  });
});
