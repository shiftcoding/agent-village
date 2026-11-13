/**
 * Pure "next state" logic for the data source: live public/village.json, or bundled fixtures as fallback.
 * No React and no fetching in here, so it is unit-tested. See useVillageData.ts for the polling hook.
 */
import { parseVillageFile, villageFromFile } from '../data/villageFile';
import type { Village } from '../data/types';

export type FetchResult = { kind: 'ok'; text: string } | { kind: 'missing' } | { kind: 'error'; message: string };

export interface Notice {
  /** fallback: showing fixtures. stale: showing the last good live data. */
  kind: 'fallback' | 'stale';
  text: string;
}

export interface DataState {
  source: 'live' | 'fixtures';
  village: Village;
  /** Raw text of the village.json that produced `village` (live only). Used for change detection. */
  raw: string | null;
  /** The sync run time (ISO) of the live file. */
  generatedAt: string | null;
  notice: Notice | null;
}

export interface DataEnv {
  /** ?now override in epoch ms for a timezone, or null. */
  nowFor: (timezone: string) => number | null;
  /** Build the bundled fixture village (honouring the override itself). */
  fixtures: () => Village;
}

export const MISSING_TEXT =
  'Showing bundled sample data: public/village.json was not found. Run npm run sync (or npm run sync -- --watch for live updates).';

function fallbackText(reason: string): string {
  return `Showing bundled sample data: public/village.json could not be used (${reason}). Run npm run sync to write it again.`;
}

function staleText(reason: string, updated: string): string {
  return `Live data may be out of date: the latest read of public/village.json failed (${reason}). Showing the last good data from ${updated}. Retrying automatically.`;
}

export function fixturesState(env: DataEnv, notice: Notice | null): DataState {
  return { source: 'fixtures', village: env.fixtures(), raw: null, generatedAt: null, notice };
}

/** "HH:MM" of an ISO time in a timezone; "unknown time" if it cannot be read. */
export function fmtClock(iso: string | null, timeZone: string): string {
  if (!iso) return 'unknown time';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return 'unknown time';
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms));
  } catch {
    return 'unknown time';
  }
}

/** One short line for the UI: where the data comes from. */
export function sourceLine(s: DataState): string {
  if (s.source === 'fixtures') return 'Bundled sample data (fixtures)';
  const t = fmtClock(s.generatedAt, s.village.timezone);
  return s.notice ? `Live data from npm run sync, last good update ${t}` : `Live data from npm run sync, updated ${t}`;
}

/** Coarse state used to announce transitions only. */
export type SourceKey = 'live' | 'stale' | 'fixtures';
export function sourceKey(s: DataState): SourceKey {
  return s.source === 'fixtures' ? 'fixtures' : s.notice ? 'stale' : 'live';
}

/** Message for a transition, or null when nothing should be announced. */
export function transitionMessage(from: SourceKey | null, to: SourceKey): string | null {
  if (from === null || from === to) return null;
  if (to === 'fixtures') return 'Switched to bundled sample data. public/village.json is not available.';
  if (to === 'stale') return 'Live data source lost. Showing the last good data.';
  return from === 'fixtures' ? 'Live data now available.' : 'Live data restored.';
}

function failure(prev: DataState | null, env: DataEnv, reason: string, missing: boolean): DataState {
  if (prev && prev.source === 'live') {
    const text = staleText(reason, fmtClock(prev.generatedAt, prev.village.timezone));
    if (prev.notice?.kind === 'stale' && prev.notice.text === text) return prev;
    return { ...prev, notice: { kind: 'stale', text } };
  }
  const text = missing ? MISSING_TEXT : fallbackText(reason);
  if (prev && prev.source === 'fixtures' && prev.notice?.text === text) return prev;
  return fixturesState(env, { kind: 'fallback', text });
}

/**
 * Next state given the latest fetch result. Returns `prev` (same object) when nothing visible changed,
 * so React does not re-render. Never throws.
 */
export function nextDataState(prev: DataState | null, result: FetchResult, env: DataEnv): DataState {
  try {
    if (result.kind === 'missing') return failure(prev, env, 'not found', true);
    if (result.kind === 'error') return failure(prev, env, result.message, false);
    const text = result.text;
    if (prev && prev.source === 'live' && prev.raw === text) {
      return prev.notice ? { ...prev, notice: null } : prev;
    }
    // The Vite dev server answers a missing file with index.html.
    if (/^\s*</.test(text)) return failure(prev, env, 'not found', true);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return failure(prev, env, 'it is not valid JSON', false);
    }
    const parsed = parseVillageFile(json);
    if (!parsed.ok) return failure(prev, env, parsed.reason.replace(/\.$/, ''), false);
    const file = parsed.file;
    const village = villageFromFile(file, { nowOverride: env.nowFor(file.village.timezone) });
    return { source: 'live', village, raw: text, generatedAt: file.generatedAt, notice: null };
  } catch (e) {
    return failure(prev, env, e instanceof Error ? e.message : 'unknown error', false);
  }
}
