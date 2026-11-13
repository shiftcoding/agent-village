/**
 * public/village.json: the file `npm run sync` writes and the browser reads.
 * Browser-safe (no Node imports). The file holds the built Village plus the raw
 * inputs, so the browser can rebuild with a `?now` override using the SAME model.
 */
import type { Village, VillageConfig } from './types';
import { buildVillage, type ProjectSources } from './model';
import { emptyPipeline } from './pipeline';
import { parseXpSummary, type XpSummary } from './xpLedger';
import { resolveRoster, type InstalledAgent } from './rosterMerge';

export const VILLAGE_FILE_FORMAT = 'agent-village/1' as const;

export interface VillageFileInputs {
  config: VillageConfig;
  /** Agents found in agentsDir (*.md). null = folder missing: the spec roster is used with a warning. */
  installedAgents: InstalledAgent[] | null;
  /** Keyed by project id: progress.md, user-tests, reviews and research personas as read from disk. */
  sources: Record<string, ProjectSources>;
  /** Load-time warnings from sync (oversized or unreadable files...). */
  loadWarnings: string[];
  /** XP per agent as counted by sync (ledger). Absent in old files: XP is then a snapshot of done tasks. */
  xp?: XpSummary | null;
}

export interface VillageFile {
  format: typeof VILLAGE_FILE_FORMAT;
  /** ISO time of the sync run. */
  generatedAt: string;
  village: Village;
  inputs: VillageFileInputs;
}

/** Build a Village from raw inputs (used by sync and by the browser rebuild). */
export function buildFromInputs(inputs: VillageFileInputs, wallClock: number, nowOverride: number | null = null): Village {
  const { roster, warnings } = resolveRoster(inputs.installedAgents);
  return buildVillage({
    config: inputs.config,
    sources: inputs.sources,
    roster,
    wallClock,
    nowOverride,
    extraWarnings: [...(inputs.loadWarnings ?? []), ...warnings],
    xp: inputs.xp ?? null,
  });
}

/** Used by sync: build the whole file. */
export function makeVillageFile(inputs: VillageFileInputs, wallClock: number): VillageFile {
  return {
    format: VILLAGE_FILE_FORMAT,
    generatedAt: new Date(wallClock).toISOString(),
    village: buildFromInputs(inputs, wallClock),
    inputs,
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function fileList(v: unknown): Array<{ file: string; text: string }> {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isObj)
    .map((x) => ({ file: typeof x.file === 'string' ? x.file : '', text: typeof x.text === 'string' ? x.text : '' }));
}

/** Tolerant structural validation. Never throws; `reason` is a short human sentence. */
export function parseVillageFile(json: unknown): { ok: true; file: VillageFile } | { ok: false; reason: string } {
  try {
    if (!isObj(json)) return { ok: false, reason: 'village.json is not a JSON object.' };
    if (json.format !== VILLAGE_FILE_FORMAT) {
      return { ok: false, reason: `village.json has an unknown format (expected ${VILLAGE_FILE_FORMAT}).` };
    }
    const v = json.village;
    if (!isObj(v)) return { ok: false, reason: 'village.json has no village section.' };
    for (const k of ['projects', 'agents', 'needsYou', 'questBoard', 'chronicle', 'weeklyTally', 'warnings'] as const) {
      if (!Array.isArray(v[k])) return { ok: false, reason: `village.json village.${k} is missing or not a list.` };
    }
    if (typeof v.generatedAt !== 'string' || typeof v.timezone !== 'string') {
      return { ok: false, reason: 'village.json village is missing generatedAt or timezone.' };
    }
    const inp = json.inputs;
    if (!isObj(inp) || !isObj(inp.config) || !Array.isArray(inp.config.projects) || !isObj(inp.sources)) {
      return { ok: false, reason: 'village.json inputs are missing or incomplete.' };
    }
    const sources: Record<string, ProjectSources> = {};
    for (const [id, s] of Object.entries(inp.sources)) {
      if (!isObj(s)) continue;
      sources[id] = {
        progress: typeof s.progress === 'string' ? s.progress : null,
        userTests: fileList(s.userTests),
        reviews: fileList(s.reviews),
        personas: strArray(s.personas),
      };
    }
    const installed = Array.isArray(inp.installedAgents)
      ? inp.installedAgents
          .filter(isObj)
          .filter((a) => typeof a.name === 'string')
          .map((a): InstalledAgent => {
            const out: InstalledAgent = { name: a.name as string };
            if (typeof a.description === 'string') out.description = a.description;
            if (typeof a.model === 'string') out.model = a.model;
            return out;
          })
      : null;
    const inputs: VillageFileInputs = {
      config: inp.config as unknown as VillageConfig,
      installedAgents: installed,
      sources,
      loadWarnings: strArray(inp.loadWarnings),
      xp: parseXpSummary(inp.xp),
    };
    const generatedAt = typeof json.generatedAt === 'string' ? json.generatedAt : v.generatedAt;
    // Rebuild from the validated inputs at the time sync ran, so item shapes are trustworthy and the
    // result matches what sync computed. Fall back to the stored village only if the rebuild throws.
    let village = v as unknown as Village;
    // Old files (pre phase 3) lack these fields: default them so the UI never sees undefined.
    if (!Array.isArray(village.pipeline)) village = { ...village, pipeline: emptyPipeline() };
    if (village.xpSource !== 'ledger') village = { ...village, xpSource: 'snapshot', xpSince: null };
    village = {
      ...village,
      agents: village.agents.map((a) => ({
        ...a,
        xp: Number.isFinite(a.xp) ? a.xp : 0,
        level: Number.isFinite(a.level) ? a.level : 1,
        tasksDone: Number.isFinite(a.tasksDone) ? a.tasksDone : Math.round((Number.isFinite(a.xp) ? a.xp : 0) / 10),
      })),
    };
    const at = Date.parse(generatedAt);
    if (Number.isFinite(at)) {
      try {
        village = buildFromInputs(inputs, at);
      } catch {
        /* keep the stored village */
      }
    }
    const file: VillageFile = { format: VILLAGE_FILE_FORMAT, generatedAt, village, inputs };
    return { ok: true, file };
  } catch {
    return { ok: false, reason: 'village.json could not be read.' };
  }
}

/**
 * The Village to show. Without a `?now` override this is the file's prebuilt village.
 * With one it is rebuilt from the inputs with the shared model (wallClock defaults to Date.now()).
 * Never throws: if the rebuild fails the prebuilt village is returned.
 */
export function villageFromFile(file: VillageFile, opts?: { nowOverride?: number | null; wallClock?: number }): Village {
  const override = opts?.nowOverride;
  if (override == null || !Number.isFinite(override)) return file.village;
  try {
    return buildFromInputs(file.inputs, opts?.wallClock ?? Date.now(), override);
  } catch {
    return file.village;
  }
}
