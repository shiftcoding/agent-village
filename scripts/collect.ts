/**
 * Node-only file reading for `npm run sync`. READ-ONLY: nothing in here writes.
 * Imported only by scripts/, never by the browser bundle.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ConfigProject, VillageConfig } from '../src/data/types';
import type { ProjectSources } from '../src/data/model';
import type { InstalledAgent } from '../src/data/rosterMerge';
import { parseFrontmatter } from '../src/data/frontmatter';
import { parsePersonas } from '../src/data/parse';
import { parseLocation } from '../src/data/daylight';
import type { VillageFileInputs } from '../src/data/villageFile';

export const MAX_FILE_BYTES = 1_000_000;
export const DEFAULT_AGENTS_DIR = '~/.claude/agents';

/** Expand a leading "~" or "~/" to the home folder. Other paths are returned unchanged ("~user" is NOT expanded). */
export function expandHome(p: string, home: string = os.homedir()): string {
  if (p === '~') return home;
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(home, p.slice(2));
  return p;
}

/**
 * Folder holding a project's docs/, or null when the plot has no folder.
 * path set: "~" expanded, relative paths resolve against repoRoot.
 * path null: fixturePath (repo-relative), else null ("no folder set").
 */
export function resolveProjectDir(cp: ConfigProject, repoRoot: string, home: string = os.homedir()): string | null {
  if (typeof cp.path === 'string' && cp.path.trim() !== '') return path.resolve(repoRoot, expandHome(cp.path.trim(), home));
  if (cp.path === null && typeof cp.fixturePath === 'string' && cp.fixturePath.trim() !== '') {
    return path.resolve(repoRoot, cp.fixturePath.trim());
  }
  return null;
}

export function resolveAgentsDir(config: VillageConfig, repoRoot: string, home: string = os.homedir()): string {
  const raw = typeof config.agentsDir === 'string' && config.agentsDir.trim() ? config.agentsDir.trim() : DEFAULT_AGENTS_DIR;
  return path.resolve(repoRoot, expandHome(raw, home));
}

/** Read a regular file (not a symlink, not a dotfile target) up to MAX_FILE_BYTES. null + warning otherwise. */
export function readFileCapped(file: string, warnings: string[], label: string, followSymlinks = false): string | null {
  try {
    const st = followSymlinks ? fs.statSync(file) : fs.lstatSync(file);
    if (st.isSymbolicLink()) {
      warnings.push(`${label}: skipped, it is a symbolic link.`);
      return null;
    }
    if (!st.isFile()) return null;
    if (st.size > MAX_FILE_BYTES) {
      warnings.push(`${label}: skipped, larger than 1 MB.`);
      return null;
    }
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code !== 'ENOENT') warnings.push(`${label}: could not be read.`);
    return null;
  }
}

/** Non-recursive list of *.md names (no dotfiles), sorted. Missing folder = []. */
export function listMarkdown(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir)
      .filter((n) => n.endsWith('.md') && !n.startsWith('.'))
      .sort();
  } catch {
    return [];
  }
}

function readMarkdownDir(dir: string, label: string, warnings: string[]): Array<{ file: string; text: string }> {
  const out: Array<{ file: string; text: string }> = [];
  for (const n of listMarkdown(dir)) {
    const text = readFileCapped(path.join(dir, n), warnings, `${label}/${n}`);
    if (text !== null) out.push({ file: n, text });
  }
  return out;
}

export function readProjectSources(cp: ConfigProject, projectDir: string | null, warnings: string[]): ProjectSources {
  if (projectDir === null) return { progress: null, userTests: [], reviews: [], personas: [] };
  const docs = path.join(projectDir, 'docs');
  const research = readFileCapped(path.join(docs, 'research.md'), warnings, `${cp.name}: docs/research.md`);
  return {
    progress: readFileCapped(path.join(docs, 'progress.md'), warnings, `${cp.name}: docs/progress.md`),
    userTests: readMarkdownDir(path.join(docs, 'user-tests'), `${cp.name}: docs/user-tests`, warnings),
    reviews: readMarkdownDir(path.join(docs, 'reviews'), `${cp.name}: docs/reviews`, warnings),
    personas: research === null ? [] : parsePersonas(research),
  };
}

/**
 * Installed agents: only `*.md` files directly in the folder (so *.md.bak is ignored).
 * Name = frontmatter name, else the file name without ".md". Deduped by name.
 * null = folder missing or unreadable.
 */
export function readInstalledAgents(dir: string, warnings: string[]): InstalledAgent[] | null {
  try {
    if (!fs.statSync(dir).isDirectory()) return null;
  } catch {
    return null;
  }
  const out: InstalledAgent[] = [];
  const seen = new Set<string>();
  for (const n of listMarkdown(dir)) {
    const text = readFileCapped(path.join(dir, n), warnings, `agent ${n}`, true);
    if (text === null) continue;
    const fm = parseFrontmatter(text);
    const name = fm.name ?? n.slice(0, -3);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const a: InstalledAgent = { name };
    if (fm.description) a.description = fm.description;
    if (fm.model) a.model = fm.model;
    out.push(a);
  }
  return out;
}

/** Parse a config object tolerantly. Returns null with a reason when it cannot be used. */
export function normalizeConfig(raw: unknown): { ok: true; config: VillageConfig } | { ok: false; reason: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, reason: 'config is not a JSON object' };
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.projects)) return { ok: false, reason: 'config has no projects list' };
  const projects = r.projects.filter(
    (p): p is ConfigProject => typeof p === 'object' && p !== null && typeof (p as { id?: unknown }).id === 'string' && typeof (p as { name?: unknown }).name === 'string',
  );
  const config: VillageConfig = {
    timezone: typeof r.timezone === 'string' && r.timezone ? r.timezone : 'Europe/Amsterdam',
    xpEnabled: r.xpEnabled === true,
    projects: projects.map((p) => ({
      ...p,
      path: typeof p.path === 'string' ? p.path : null,
      building: typeof p.building === 'string' ? p.building : 'unknown',
      position:
        typeof p.position === 'object' && p.position !== null && Number.isFinite(p.position.x) && Number.isFinite(p.position.y)
          ? p.position
          : { x: 0, y: 0 },
    })),
  };
  if (typeof r.version === 'number') config.version = r.version;
  if (typeof r.agentsDir === 'string') config.agentsDir = r.agentsDir;
  const location = parseLocation(r.location);
  if (location) config.location = location;
  return { ok: true, config };
}

export function readConfigFile(configPath: string): { ok: true; config: VillageConfig } | { ok: false; reason: string } {
  let text: string;
  try {
    text = fs.readFileSync(configPath, 'utf8');
  } catch {
    return { ok: false, reason: `${path.basename(configPath)} could not be read` };
  }
  try {
    return normalizeConfig(JSON.parse(text.replace(/^﻿/, '')));
  } catch {
    return { ok: false, reason: `${path.basename(configPath)} is not valid JSON` };
  }
}

export interface Collected {
  inputs: VillageFileInputs;
  agentsDir: string;
  /** Resolved project folders by project id (null = no folder). */
  projectDirs: Record<string, string | null>;
  /** Projects without a real `path` (fixture or no folder): they never earn ledger XP. */
  fixtureProjectIds: string[];
}

export function collectInputs(config: VillageConfig, repoRoot: string, home: string = os.homedir()): Collected {
  const loadWarnings: string[] = [];
  const seenIds = new Set<string>();
  const projectsUnique = config.projects.filter((p) => {
    if (seenIds.has(p.id)) {
      loadWarnings.push(`Duplicate project id "${p.id}" in the config: the later entry is skipped.`);
      return false;
    }
    seenIds.add(p.id);
    return true;
  });
  config = { ...config, projects: projectsUnique };
  const agentsDir = resolveAgentsDir(config, repoRoot, home);
  const installedAgents = readInstalledAgents(agentsDir, loadWarnings);
  const sources: Record<string, ProjectSources> = {};
  const projectDirs: Record<string, string | null> = {};
  const fixtureProjectIds: string[] = [];
  for (const cp of config.projects) {
    if (!(typeof cp.path === 'string' && cp.path.trim() !== '')) fixtureProjectIds.push(cp.id);
    const dir = resolveProjectDir(cp, repoRoot, home);
    projectDirs[cp.id] = dir;
    sources[cp.id] = readProjectSources(cp, dir, loadWarnings);
  }
  return { inputs: { config, installedAgents, sources, loadWarnings }, agentsDir, projectDirs, fixtureProjectIds };
}
