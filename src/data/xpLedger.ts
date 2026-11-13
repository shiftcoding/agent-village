/**
 * XP ledger: pure logic (no Node imports; file IO lives in scripts/xpStore.ts).
 *
 * Rules (documented in docs/architecture.md):
 * - One award per projectId + task id + agent, the first time sync sees that task as `done`. Ever.
 * - Leaving done never removes XP; returning to done never awards again. No streaks, rankings, decay.
 * - First run (no ledger): tasks already done get baseline awards with seenDoneAt null.
 * - 10 XP per award; level = 1 + floor(xp / 30).
 */
import type { Task } from './types';

export const XP_PER_TASK = 10;
export const XP_PER_LEVEL = 30;
export const LEDGER_FORMAT = 'agent-village-xp/1' as const;

export function levelForXp(xp: number): number {
  return 1 + Math.floor(Math.max(0, Number.isFinite(xp) ? xp : 0) / XP_PER_LEVEL);
}

export interface XpAward {
  projectId: string;
  taskId: string;
  agent: string;
  /** ISO time of the sync run that first saw the task done; null = already done when tracking began. */
  seenDoneAt: string | null;
}

export interface XpLedger {
  format: typeof LEDGER_FORMAT;
  /** ISO time the ledger was created ("XP counted since"). */
  createdAt: string;
  awards: XpAward[];
}

export interface XpSummary {
  source: 'ledger' | 'snapshot';
  since: string | null;
  byAgent: Record<string, { xp: number; tasksDone: number }>;
}

const keyOf = (a: { projectId: string; taskId: string; agent: string }): string => JSON.stringify([a.projectId, a.taskId, a.agent]);

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Parse the stored ledger. null only when the top level (format, createdAt, awards list) is malformed;
 * unreadable single entries are skipped and counted in `ignored`.
 */
export function parseLedger(json: unknown): { ledger: XpLedger; ignored: number } | null {
  if (!isObj(json) || json.format !== LEDGER_FORMAT || typeof json.createdAt !== 'string' || !Array.isArray(json.awards)) return null;
  if (!Number.isFinite(Date.parse(json.createdAt))) return null;
  const seen = new Set<string>();
  const awards: XpAward[] = [];
  let ignored = 0;
  for (const a of json.awards) {
    if (!isObj(a) || typeof a.projectId !== 'string' || typeof a.taskId !== 'string' || typeof a.agent !== 'string' || (a.seenDoneAt !== null && typeof a.seenDoneAt !== 'string')) {
      ignored++;
      continue;
    }
    const award: XpAward = { projectId: a.projectId, taskId: a.taskId, agent: a.agent, seenDoneAt: a.seenDoneAt };
    if (seen.has(keyOf(award))) continue;
    seen.add(keyOf(award));
    awards.push(award);
  }
  return { ledger: { format: LEDGER_FORMAT, createdAt: json.createdAt, awards }, ignored };
}

/** Tasks that can earn XP: done, with an id and an agent. */
export function awardableTasks(tasks: readonly Task[]): Task[] {
  return tasks.filter((t) => t.status === 'done' && t.id.trim() !== '' && t.agent.trim() !== '');
}

/** Pure update. `prev` null = first run. Returns the same object when nothing changed. */
export function updateLedger(
  prev: XpLedger | null,
  tasks: readonly Task[],
  nowIso: string,
  /** Fixture-backed projects: their awards are pruned (sample data never earns XP). The only case where XP is removed. */
  excludeProjects: ReadonlySet<string> = new Set(),
): { ledger: XpLedger; changed: boolean } {
  const kept = prev === null ? null : prev.awards.filter((a) => !excludeProjects.has(a.projectId));
  const pruned = prev !== null && kept !== null && kept.length !== prev.awards.length;
  if (prev !== null && pruned) prev = { ...prev, awards: kept ?? [] };
  const base: XpLedger = prev ?? { format: LEDGER_FORMAT, createdAt: nowIso, awards: [] };
  const have = new Set(base.awards.map(keyOf));
  const added: XpAward[] = [];
  for (const t of awardableTasks(tasks)) {
    if (excludeProjects.has(t.projectId)) continue;
    const a: XpAward = { projectId: t.projectId, taskId: t.id, agent: t.agent, seenDoneAt: prev === null ? null : nowIso };
    if (have.has(keyOf(a))) continue;
    have.add(keyOf(a));
    added.push(a);
  }
  if (prev !== null && added.length === 0) return { ledger: prev, changed: pruned };
  return { ledger: { ...base, awards: [...base.awards, ...added] }, changed: true };
}

export function summarizeLedger(ledger: XpLedger): XpSummary {
  const byAgent: XpSummary['byAgent'] = Object.create(null) as XpSummary['byAgent'];
  for (const a of ledger.awards) {
    const e = (byAgent[a.agent] ??= { xp: 0, tasksDone: 0 });
    e.tasksDone += 1;
    e.xp += XP_PER_TASK;
  }
  return { source: 'ledger', since: ledger.createdAt, byAgent };
}

/** Stateless fallback: done tasks right now. */
export function snapshotXp(tasks: readonly Task[]): XpSummary {
  const byAgent: XpSummary['byAgent'] = Object.create(null) as XpSummary['byAgent'];
  for (const t of awardableTasks(tasks)) {
    const e = (byAgent[t.agent] ??= { xp: 0, tasksDone: 0 });
    e.tasksDone += 1;
    e.xp += XP_PER_TASK;
  }
  return { source: 'snapshot', since: null, byAgent };
}

/** Validate an XpSummary read from village.json inputs. */
export function parseXpSummary(v: unknown): XpSummary | null {
  if (!isObj(v) || (v.source !== 'ledger' && v.source !== 'snapshot') || !isObj(v.byAgent)) return null;
  const byAgent: XpSummary['byAgent'] = Object.create(null) as XpSummary['byAgent'];
  for (const [k, e] of Object.entries(v.byAgent)) {
    if (!isObj(e) || !Number.isFinite(e.xp) || !Number.isFinite(e.tasksDone)) continue;
    byAgent[k] = { xp: Math.max(0, Number(e.xp)), tasksDone: Math.max(0, Number(e.tasksDone)) };
  }
  return { source: v.source, since: typeof v.since === 'string' ? v.since : null, byAgent };
}
