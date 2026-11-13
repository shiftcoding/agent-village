import { describe, expect, it } from 'vitest';
import { levelForXp, parseLedger, parseXpSummary, snapshotXp, summarizeLedger, updateLedger } from './xpLedger';
import type { Task, TaskStatus } from './types';

const t = (id: string, agent: string, status: TaskStatus, projectId = 'p'): Task => ({ projectId, id, title: id, agent, status, rawStatus: status, notes: '' });
const T0 = '2026-11-13T10:00:00.000Z';
const T1 = '2026-11-13T11:00:00.000Z';

describe('xp ledger', () => {
  it('first run records baseline awards with null date', () => {
    const { ledger, changed } = updateLedger(null, [t('T1', 'a', 'done'), t('T2', 'a', 'doing')], T0);
    expect(changed).toBe(true);
    expect(ledger.createdAt).toBe(T0);
    expect(ledger.awards).toEqual([{ projectId: 'p', taskId: 'T1', agent: 'a', seenDoneAt: null }]);
  });
  it('awards once, dates later transitions, never removes, never double-awards', () => {
    let l = updateLedger(null, [t('T1', 'a', 'doing')], T0).ledger;
    expect(l.awards).toEqual([]);
    l = updateLedger(l, [t('T1', 'a', 'done')], T1).ledger;
    expect(l.awards[0]?.seenDoneAt).toBe(T1);
    const back = updateLedger(l, [t('T1', 'a', 'doing')], T1);
    expect(back.changed).toBe(false);
    const again = updateLedger(back.ledger, [t('T1', 'a', 'done')], '2026-11-14T00:00:00.000Z');
    expect(again.changed).toBe(false);
    expect(summarizeLedger(again.ledger).byAgent['a']).toEqual({ xp: 10, tasksDone: 1 });
    // task deleted from progress.md keeps its XP
    expect(summarizeLedger(updateLedger(l, [], T1).ledger).byAgent['a']?.xp).toBe(10);
  });
  it('keys by project, task and agent', () => {
    const l = updateLedger(null, [t('T1', 'a', 'done', 'p1'), t('T1', 'a', 'done', 'p2'), t('T1', 'b', 'done', 'p1')], T0).ledger;
    expect(l.awards).toHaveLength(3);
    expect(updateLedger(l, [t('T1', 'b', 'done', 'p1')], T1).changed).toBe(false);
  });
  it('ignores tasks without id or agent', () => {
    expect(updateLedger(null, [t('', 'a', 'done'), t('T1', '', 'done')], T0).ledger.awards).toEqual([]);
  });
  it('level curve and snapshot', () => {
    expect([0, 29, 30, 59, 60].map(levelForXp)).toEqual([1, 1, 2, 2, 3]);
    expect(levelForXp(NaN)).toBe(1);
    expect(snapshotXp([t('T1', 'a', 'done')])).toMatchObject({ source: 'snapshot', since: null, byAgent: { a: { xp: 10, tasksDone: 1 } } });
  });
  it('parseLedger rejects only a malformed top level; bad entries are skipped and counted', () => {
    expect(parseLedger(null)).toBeNull();
    expect(parseLedger({ format: 'x' })).toBeNull();
    expect(parseLedger({ format: 'agent-village-xp/1', createdAt: T0, awards: 'no' })).toBeNull();
    const good = { projectId: 'p', taskId: 'T1', agent: 'a', seenDoneAt: null };
    const r = parseLedger({ format: 'agent-village-xp/1', createdAt: T0, awards: [good, { projectId: 1 }, 7, null] });
    expect(r?.ignored).toBe(3);
    expect(r?.ledger.awards).toEqual([good]);
    expect(parseLedger({ format: 'agent-village-xp/1', createdAt: T0, awards: [] })?.ledger.awards).toEqual([]);
  });
  it('an agent named __proto__ is safe', () => {
    const sum = summarizeLedger(updateLedger(null, [t('T1', '__proto__', 'done'), t('T2', 'constructor', 'done')], T0).ledger);
    expect(sum.byAgent['__proto__']).toEqual({ xp: 10, tasksDone: 1 });
    expect(sum.byAgent['constructor']).toEqual({ xp: 10, tasksDone: 1 });
    const parsed = parseXpSummary(JSON.parse('{"source":"ledger","since":null,"byAgent":{"__proto__":{"xp":20,"tasksDone":2}}}'));
    expect(parsed?.byAgent['__proto__']).toEqual({ xp: 20, tasksDone: 2 });
    expect(({} as Record<string, unknown>)['xp']).toBeUndefined();
    expect(snapshotXp([t('T1', '__proto__', 'done')]).byAgent['__proto__']?.xp).toBe(10);
  });
  it('fixture projects earn nothing and their old awards are pruned', () => {
    const prev = updateLedger(null, [t('T1', 'a', 'done', 'flowbro'), t('T1', 'a', 'done', 'real')], T0).ledger;
    const r = updateLedger(prev, [t('T1', 'a', 'done', 'flowbro'), t('T1', 'a', 'done', 'real')], T1, new Set(['flowbro']));
    expect(r.changed).toBe(true);
    expect(r.ledger.awards.map((a) => a.projectId)).toEqual(['real']);
    expect(updateLedger(r.ledger, [], T1, new Set(['flowbro'])).changed).toBe(false);
  });
});
