/**
 * v1 loader (browser/Vite). Reads markdown bundled with ?raw; phase 2 sync replaces this.
 * Read-only: nothing is ever written.
 */
import rawConfig from '../../village.config.json';
import type { Village, VillageConfig } from './types';
import { buildVillage, type ProjectSources } from './model';
import { parseWallTime } from './time';
import { emptyPipeline } from './pipeline';

const progressFiles = import.meta.glob<string>(
  ['../../fixtures/*/docs/progress.md', '../../docs/progress.md'],
  { query: '?raw', import: 'default', eager: true },
);
const userTestFiles = import.meta.glob<string>(
  ['../../fixtures/*/docs/user-tests/*.md', '../../docs/user-tests/*.md'],
  { query: '?raw', import: 'default', eager: true },
);
const reviewFiles = import.meta.glob<string>(['../../fixtures/*/docs/reviews/*.md', '../../docs/reviews/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const config = rawConfig as unknown as VillageConfig;

function under(files: Record<string, string>, prefix: string): Array<{ file: string; text: string }> {
  return Object.entries(files)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, text]) => ({ file: k.slice(prefix.length), text: typeof text === 'string' ? text : '' }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

/** Folder (relative to this file) holding docs/ for a project, or null if v1 cannot read it. */
function docsPrefix(p: VillageConfig['projects'][number]): string | null {
  if (p.path === null && p.fixturePath) return `../../${p.fixturePath.replace(/^\/+|\/+$/g, '')}/docs/`;
  // v1 only: phase 2 sync reads real project folders and replaces this hard-coded mapping.
  if (p.id === 'agent-village') return '../../docs/';
  return null;
}

export function loadSources(cfg: VillageConfig = config): Record<string, ProjectSources> {
  const out: Record<string, ProjectSources> = {};
  for (const p of cfg.projects) {
    const prefix = docsPrefix(p);
    if (prefix === null) {
      out[p.id] = { progress: null, userTests: [], reviews: [] };
      continue;
    }
    out[p.id] = {
      progress: progressFiles[`${prefix}progress.md`] ?? null,
      userTests: under(userTestFiles, `${prefix}user-tests/`),
      reviews: under(reviewFiles, `${prefix}reviews/`),
    };
  }
  return out;
}

/** "?now=YYYY-MM-DDTHH:MM" to epoch ms in the given timezone, or null. */
export function parseNowParam(search: string, timezone: string): number | null {
  try {
    const v = new URLSearchParams(typeof search === 'string' ? search : '').get('now');
    if (!v || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v.trim())) return null;
    return parseWallTime(v.trim(), timezone);
  } catch {
    return null;
  }
}

export function loadVillage(options?: { nowOverride?: number | null }): Village {
  const wallClock = Date.now();
  try {
    return buildVillage({ config, sources: loadSources(), nowOverride: options?.nowOverride ?? null, wallClock });
  } catch (e) {
    return {
      generatedAt: new Date(wallClock).toISOString(),
      xpEnabled: false,
      timezone: config?.timezone ?? 'Europe/Amsterdam',
      xpSource: 'snapshot',
      xpSince: null,
      pipeline: emptyPipeline(),
      projects: [],
      agents: [],
      needsYou: [],
      questBoard: [],
      chronicle: [],
      weeklyTally: [],
      warnings: [`The village could not be built (${e instanceof Error ? e.message : 'unknown error'}).`],
    };
  }
}
