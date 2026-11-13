/** One sync run: read config + docs + agents, build the village, write public/village.json. */
import path from 'node:path';
import os from 'node:os';
import type { VillageConfig } from '../src/data/types';
import { makeVillageFile, type VillageFile } from '../src/data/villageFile';
import { collectInputs, readConfigFile } from './collect';
import { writeVillageFile } from './write';
import { localParts } from '../src/data/time';
import type { WatchTarget } from './watchCore';
import { defaultLedgerPath, updateXp } from './xpStore';

export interface SyncOptions {
  repoRoot: string;
  configPath: string;
  outPath: string;
  home?: string;
  /** XP ledger file. Default `<repoRoot>/.village-state/xp-ledger.json`; null = no ledger (snapshot XP). */
  ledgerPath?: string | null;
  now?: () => number;
  log: (line: string) => void;
}

export type SyncResult =
  | { ok: true; file: VillageFile; targets: WatchTarget[]; line: string }
  | { ok: false; error: string; fatal: boolean };

const isMd = (f: string | null): boolean => f === null || f.endsWith('.md');

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** HH:MM:SS in the configured timezone (never the machine's). */
export function clock(ms: number, timeZone = 'Europe/Amsterdam'): string {
  const p = localParts(ms, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

export function configTarget(configPath: string): WatchTarget {
  const base = path.basename(configPath);
  // Watch the config's folder (editors replace files via rename), filtered to the config file name.
  return { path: path.dirname(configPath), label: 'config', accept: (f) => f === null || f === base };
}

export function watchTargets(configPath: string, c: ReturnType<typeof collectInputs>): WatchTarget[] {
  const out: WatchTarget[] = [
    configTarget(configPath),
    { path: c.agentsDir, label: 'agents', accept: isMd },
  ];
  for (const [id, dir] of Object.entries(c.projectDirs)) {
    if (dir === null) continue;
    const docs = path.join(dir, 'docs');
    out.push(
      // The project folder itself, so a docs folder appearing later is noticed.
      { path: dir, label: id, accept: (f) => f === null || f === 'docs' },
      { path: docs, label: id, accept: (f) => f === null || ['progress.md', 'research.md', 'user-tests', 'reviews'].includes(f) },
      { path: path.join(docs, 'user-tests'), label: id, accept: isMd },
      { path: path.join(docs, 'reviews'), label: id, accept: isMd },
    );
  }
  // De-duplicate by path (project folder may equal the config folder): merge accept functions.
  const merged = new Map<string, WatchTarget>();
  for (const t of out) {
    const prev = merged.get(t.path);
    merged.set(
      t.path,
      prev ? { path: t.path, label: `${prev.label}`, accept: (f) => prev.accept(f) || t.accept(f) } : t,
    );
  }
  return [...merged.values()];
}

export function createSyncer(opts: SyncOptions) {
  const now = opts.now ?? Date.now;
  const home = opts.home ?? os.homedir();
  let lastGood: VillageConfig | null = null;

  return {
    /** keepLastConfig: in watch mode a broken config keeps the previous good one. */
    run(reason: string | null, keepLastConfig: boolean): SyncResult {
      const cfg = readConfigFile(opts.configPath);
      const warnings: string[] = [];
      let config: VillageConfig;
      if (cfg.ok) {
        config = cfg.config;
        lastGood = config;
      } else if (keepLastConfig && lastGood) {
        config = lastGood;
        warnings.push(`${cfg.reason}; keeping the last good config.`);
      } else {
        return { ok: false, error: cfg.reason, fatal: true };
      }
      const wall = now();
      let collected: ReturnType<typeof collectInputs>;
      let file: VillageFile;
      try {
        collected = collectInputs(config, opts.repoRoot, home);
        collected.inputs.loadWarnings.push(...warnings);
        file = makeVillageFile(collected.inputs, wall);
        const ledgerPath = opts.ledgerPath === undefined ? defaultLedgerPath(opts.repoRoot) : opts.ledgerPath;
        if (ledgerPath !== null) {
          try {
            const fixtureIds = new Set(collected.fixtureProjectIds);
            const tasks = file.village.projects.filter((p) => !fixtureIds.has(p.id)).flatMap((p) => p.progress?.tasks ?? []);
            collected.inputs.xp = updateXp(ledgerPath, tasks, wall, collected.inputs.loadWarnings, fixtureIds);
            file = makeVillageFile(collected.inputs, wall);
          } catch {
            collected.inputs.loadWarnings.push('XP ledger failed; XP is shown as a snapshot.');
            collected.inputs.xp = null;
            file = makeVillageFile(collected.inputs, wall);
          }
        }
      } catch (e) {
        return { ok: false, error: `could not build the village (${e instanceof Error ? e.message : 'unknown error'})`, fatal: true };
      }
      try {
        writeVillageFile(opts.outPath, file);
      } catch (e) {
        return { ok: false, error: `could not write ${opts.outPath} (${e instanceof Error ? e.message : 'unknown error'})`, fatal: true };
      }
      const v = file.village;
      const line = `[${clock(wall, v.timezone)}] village.json: ${v.projects.length} projects, ${v.agents.length} agents, ${v.warnings.length} warnings${
        reason ? ` (${reason})` : ''
      }`;
      opts.log(line);
      return { ok: true, file, targets: watchTargets(opts.configPath, collected), line };
    },
  };
}
