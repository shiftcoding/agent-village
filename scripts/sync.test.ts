import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expandHome, readInstalledAgents, resolveProjectDir, readConfigFile } from './collect';
import { createSyncer } from './syncCore';
import { writeFileAtomic } from './write';
import { parseVillageFile, villageFromFile } from '../src/data/villageFile';
import { parsePersonas } from '../src/data/parse';
import { DEFAULT_PERSONAS } from '../src/data/model';
import { parseWallTime } from '../src/data/time';

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'village-test-'));
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

const put = (rel: string, text: string): string => {
  const f = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
  return f;
};

const PROGRESS = `# Progress: Demo

Stage: building
Overall: 40%
Updated: 2026-11-13 10:00

## Tasks
| ID | Task | Agent | Status | Notes |
|---|---|---|---|---|
| T1 | Thing | typescript-pro | doing | |
| T2 | Other | ghost-agent | todo | |

## Log
- 2026-11-13 09:50 typescript-pro: started T1
`;

describe('roster from agents folder', () => {
  it('reads *.md only, frontmatter name beats filename, BOM and CRLF tolerated', () => {
    put('agents/a.md', '---\nname: "alpha"\ndescription: Does alpha things. More.\n---\nbody');
    put('agents/a.md.bak', '---\nname: backup\n---\n');
    put('agents/beta.md', 'no frontmatter');
    put('agents/gamma.md', '\uFEFF---\r\nname: gamma-real\r\nmodel: sonnet\r\n---\r\nx');
    put('agents/dup.md', '---\nname: alpha\n---\n');
    put('agents/.hidden.md', '---\nname: hidden\n---\n');
    const got = readInstalledAgents(path.join(tmp, 'agents'), []);
    expect(got?.map((a) => a.name)).toEqual(['alpha', 'beta', 'gamma-real']);
    expect(got?.[0]?.description).toBe('Does alpha things. More.');
    expect(got?.[2]?.model).toBe('sonnet');
  });
  it('missing folder gives null; village falls back to spec roster with a warning', () => {
    expect(readInstalledAgents(path.join(tmp, 'nope'), [])).toBeNull();
    const cfg = put('village.config.json', JSON.stringify({ timezone: 'Europe/Amsterdam', xpEnabled: false, agentsDir: path.join(tmp, 'nope'), projects: [] }));
    const r = createSyncer({ repoRoot: tmp, configPath: cfg, outPath: path.join(tmp, 'public', 'village.json'), home: tmp, log: () => {} }).run(null, false);
    expect(r.ok && r.file.village.agents.length).toBe(21);
    expect(r.ok && r.file.village.warnings.some((w) => /Agents folder not found/.test(w))).toBe(true);
  });
});

describe('project folders', () => {
  it('expands ~ and ~/ and resolves relative paths against the repo root', () => {
    expect(expandHome('~', '/h')).toBe('/h');
    expect(expandHome('~/src/x', '/h')).toBe('/h/src/x');
    expect(expandHome('/abs/~x', '/h')).toBe('/abs/~x');
    const base = { id: 'p', name: 'P', building: 'hearth-lodge', position: { x: 0, y: 0 } };
    expect(resolveProjectDir({ ...base, path: '~/src/x' }, '/repo', '/h')).toBe('/h/src/x');
    expect(resolveProjectDir({ ...base, path: 'sub/x' }, '/repo', '/h')).toBe('/repo/sub/x');
    expect(resolveProjectDir({ ...base, path: null, fixturePath: 'fixtures/f' }, '/repo', '/h')).toBe('/repo/fixtures/f');
    expect(resolveProjectDir({ ...base, path: null }, '/repo', '/h')).toBeNull();
  });

  it('end to end: fixture, missing folder, no folder, garbled progress, personas, atomic write', () => {
    put('home/agents/typescript-pro.md', '---\nname: typescript-pro\n---\n');
    put('home/agents/newbie.md', '---\nname: newbie\ndescription: A new helper. Extra.\n---\n');
    put('repo/fixtures/f/docs/progress.md', PROGRESS);
    put('repo/fixtures/f/docs/research.md', '# Research\n\n## Personas\n- **Maya** - first-timer\n- Omar: power user\n');
    put('home/real/docs/progress.md', '| | | |\n## Tasks\n|||\n\u0000\u0001 garbage [[[ ');
    fs.mkdirSync(path.join(tmp, 'home/empty'), { recursive: true });
    const base = { building: 'hearth-lodge', position: { x: 0, y: 0 } };
    const config = {
      agentsDir: '~/agents',
      timezone: 'Europe/Amsterdam',
      xpEnabled: false,
      projects: [
        { id: 'fx', name: 'Fx', path: null, fixturePath: 'fixtures/f', ...base },
        { id: 'gone', name: 'Gone', path: '~/missing', ...base },
        { id: 'nofolder', name: 'None', path: null, ...base },
        { id: 'real', name: 'Real', path: '~/real', ...base },
        { id: 'empty', name: 'Empty', path: '~/empty', ...base },
      ],
    };
    const cfg = put('repo/village.config.json', JSON.stringify(config));
    const out = path.join(tmp, 'repo/public/village.json');
    const lines: string[] = [];
    const r = createSyncer({ repoRoot: path.join(tmp, 'repo'), configPath: cfg, outPath: out, home: path.join(tmp, 'home'), now: () => parseWallTime('2026-11-13T12:00', 'Europe/Amsterdam') ?? 0, log: (l) => lines.push(l) }).run('test', false);
    expect(r.ok).toBe(true);
    const json: unknown = JSON.parse(fs.readFileSync(out, 'utf8'));
    const parsed = parseVillageFile(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const v = parsed.file.village;
    const plot = (id: string) => v.projects.find((p) => p.id === id)?.plot;
    expect(plot('fx')).toBe('ok');
    expect(plot('gone')).toBe('no-progress');
    expect(plot('nofolder')).toBe('no-folder');
    expect(plot('empty')).toBe('no-progress');
    expect(plot('real')).toBeTruthy(); // garbled: parsed tolerantly, no throw
    // roster: installed only (2) + stranger from progress.md
    expect(v.agents.map((a) => a.name).sort()).toEqual(['ghost-agent', 'newbie', 'typescript-pro']);
    expect(v.agents.find((a) => a.name === 'ghost-agent')?.def).toBeNull();
    expect(v.agents.find((a) => a.name === 'newbie')?.def?.role).toBe('A new helper.');
    expect(parsed.file.inputs.sources.fx?.personas).toEqual(['Maya', 'Omar']);
    expect(lines[0]).toMatch(/^\[\d\d:\d\d:\d\d\] village\.json: 5 projects, 3 agents, \d+ warnings \(test\)$/);
    expect(fs.readdirSync(path.dirname(out))).toEqual(['village.json']);
    // the project folders were never written to
    expect(fs.readdirSync(path.join(tmp, 'home/empty'))).toEqual([]);
  });

  it('one-shot with a missing or broken config fails; watch mode keeps the last good config', () => {
    const out = path.join(tmp, 'public/village.json');
    const cfg = path.join(tmp, 'village.config.json');
    const s = createSyncer({ repoRoot: tmp, configPath: cfg, outPath: out, home: tmp, log: () => {} });
    expect(s.run(null, false).ok).toBe(false);
    fs.writeFileSync(cfg, JSON.stringify({ timezone: 'Europe/Amsterdam', xpEnabled: false, projects: [] }));
    expect(s.run(null, true).ok).toBe(true);
    fs.writeFileSync(cfg, '{ "projects": [ half writ');
    expect(readConfigFile(cfg).ok).toBe(false);
    const kept = s.run('x', true);
    expect(kept.ok && kept.file.village.warnings.some((w) => /last good config/.test(w))).toBe(true);
    expect(s.run(null, false).ok).toBe(false);
  });
});

describe('personas', () => {
  it('reads list items and sub-headings under a Personas section, falls back to []', () => {
    expect(parsePersonas('## User personas\n- Ada: dev\n- Bo, tester\n\n## Other\n- nope')).toEqual(['Ada', 'Bo']);
    expect(parsePersonas('## Personas\n### Cy - the cook\n### Di\ntext')).toEqual(['Cy', 'Di']);
    expect(parsePersonas('nothing here')).toEqual([]);
    expect(parsePersonas(null)).toEqual([]);
    expect(DEFAULT_PERSONAS.length).toBeGreaterThan(0);
  });
});

describe('atomic write', () => {
  it('writes valid JSON and leaves no temp file', () => {
    const f = path.join(tmp, 'public', 'village.json');
    writeFileAtomic(f, '{"a":1}\n');
    writeFileAtomic(f, '{"a":2}\n');
    expect(JSON.parse(fs.readFileSync(f, 'utf8'))).toEqual({ a: 2 });
    expect(fs.readdirSync(path.dirname(f))).toEqual(['village.json']);
  });
  it('cleans up the temp file if the rename fails', () => {
    const f = path.join(tmp, 'public', 'village.json');
    fs.mkdirSync(f, { recursive: true }); // target is a directory: rename fails
    expect(() => writeFileAtomic(f, 'x')).toThrow();
    expect(fs.readdirSync(path.dirname(f))).toEqual(['village.json']);
  });
});

describe('review fixes', () => {
  it('relative agentsDir resolves against the repo root; duplicate project ids are skipped', () => {
    put('repo/ag/a.md', '---\nname: a\ndescription: |\n  Block text.\n---\n');
    const p = { name: 'P', path: null, building: 'hearth-lodge', position: { x: 0, y: 0 } };
    const cfg = put('repo/village.config.json', JSON.stringify({ timezone: 'Europe/Amsterdam', xpEnabled: false, agentsDir: 'ag', projects: [{ id: 'x', ...p }, { id: 'x', ...p }] }));
    const r = createSyncer({ repoRoot: path.join(tmp, 'repo'), configPath: cfg, outPath: path.join(tmp, 'repo/public/village.json'), home: tmp, log: () => {} }).run(null, false);
    if (!r.ok) throw new Error(r.error);
    expect(r.file.village.agents.map((a) => a.name)).toEqual(['a']);
    expect(r.file.village.agents[0]?.def?.role).toBe('Block text.');
    expect(r.file.village.projects).toHaveLength(1);
    expect(r.file.village.warnings.some((w) => /Duplicate project id/.test(w))).toBe(true);
  });
  it('follows symlinked agent files', () => {
    put('real/z.md', '---\nname: zed\n---\n');
    fs.mkdirSync(path.join(tmp, 'agents'));
    fs.symlinkSync(path.join(tmp, 'real/z.md'), path.join(tmp, 'agents/z.md'));
    expect(readInstalledAgents(path.join(tmp, 'agents'), [])?.map((a) => a.name)).toEqual(['zed']);
  });
  it('parseVillageFile rebuilds the village so junk items cannot get through', () => {
    const cfg = put('village.config.json', JSON.stringify({ timezone: 'Europe/Amsterdam', xpEnabled: false, agentsDir: path.join(tmp, 'x'), projects: [] }));
    const r = createSyncer({ repoRoot: tmp, configPath: cfg, outPath: path.join(tmp, 'public/village.json'), home: tmp, log: () => {} }).run(null, false);
    if (!r.ok) throw new Error(r.error);
    const j = JSON.parse(JSON.stringify(r.file));
    j.village.projects = [null];
    const parsed = parseVillageFile(j);
    expect(parsed.ok && parsed.file.village.projects).toEqual([]);
  });
});

describe('villageFile', () => {
  it('rejects garbage with a reason and never throws', () => {
    for (const bad of [null, 5, 'x', [], {}, { format: 'agent-village/1' }, { format: 'agent-village/1', village: {}, inputs: {} }]) {
      const r = parseVillageFile(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.length).toBeGreaterThan(5);
    }
  });
  it('villageFromFile returns the prebuilt village, or rebuilds with ?now', () => {
    const cfg = put('village.config.json', JSON.stringify({ timezone: 'Europe/Amsterdam', xpEnabled: false, agentsDir: path.join(tmp, 'x'), projects: [{ id: 'p', name: 'P', path: null, fixturePath: 'f', building: 'hearth-lodge', position: { x: 0, y: 0 } }] }));
    put('f/docs/progress.md', PROGRESS);
    const r = createSyncer({ repoRoot: tmp, configPath: cfg, outPath: path.join(tmp, 'public/village.json'), home: tmp, log: () => {} }).run(null, false);
    if (!r.ok) throw new Error('sync failed');
    const parsed = parseVillageFile(JSON.parse(JSON.stringify(r.file)));
    if (!parsed.ok) throw new Error(parsed.reason);
    expect(villageFromFile(parsed.file)).toBe(parsed.file.village);
    const later = parseWallTime('2026-12-30T12:00', 'Europe/Amsterdam');
    const rebuilt = villageFromFile(parsed.file, { nowOverride: later, wallClock: 1 });
    expect(rebuilt.projects[0]?.referenceSource).toBe('override');
    expect(rebuilt.projects[0]?.health.some((h) => h.kind === 'stale')).toBe(true);
    expect(rebuilt.agents.length).toBe(22); // 21 spec roster + ghost-agent stranger
  });
});

describe('xp ledger in sync', () => {
  const setup = (progress: string) => {
    put('p/docs/progress.md', progress);
    const cfg = put('village.config.json', JSON.stringify({ timezone: 'Europe/Amsterdam', xpEnabled: false, agentsDir: path.join(tmp, 'nope'), projects: [{ id: 'p', name: 'P', path: path.join(tmp, 'p'), building: 'hearth-lodge', position: { x: 0, y: 0 } }] }));
    const ledgerPath = path.join(tmp, 'state', 'xp-ledger.json');
    let clock = Date.UTC(2026, 10, 13, 10);
    const syncer = createSyncer({ repoRoot: tmp, configPath: cfg, outPath: path.join(tmp, 'public', 'village.json'), home: tmp, ledgerPath, now: () => (clock += 60_000), log: () => {} });
    return { syncer, ledgerPath };
  };
  const doc = (s1: string, s2: string): string =>
    `# Progress: P\n\nStage: building\nOverall: 40%\nUpdated: 2026-11-13 10:00\n\n## Tasks\n| ID | Task | Agent | Status | Notes |\n|---|---|---|---|---|\n| T1 | A | typescript-pro | ${s1} | |\n| T2 | B | typescript-pro | ${s2} | |\n`;
  const xpOf = (r: ReturnType<ReturnType<typeof createSyncer>['run']>) => (r.ok ? r.file.village.agents.find((a) => a.name === 'typescript-pro') : undefined);

  it('baseline, one-time award, no penalty, written only to the injected path', () => {
    const { syncer, ledgerPath } = setup(doc('done', 'doing'));
    const r1 = syncer.run(null, false);
    expect(xpOf(r1)).toMatchObject({ xp: 10, level: 1, tasksDone: 1 });
    expect(r1.ok && r1.file.village.xpSource).toBe('ledger');
    const saved = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    expect(saved.awards).toEqual([{ projectId: 'p', taskId: 'T1', agent: 'typescript-pro', seenDoneAt: null }]);
    const mtime = fs.statSync(ledgerPath).mtimeMs;
    syncer.run(null, false);
    expect(fs.statSync(ledgerPath).mtimeMs).toBe(mtime); // unchanged: not rewritten
    put('p/docs/progress.md', doc('doing', 'done'));
    const r3 = syncer.run(null, false);
    expect(xpOf(r3)).toMatchObject({ xp: 20, tasksDone: 2 }); // T1 left done, XP stays
    expect(JSON.parse(fs.readFileSync(ledgerPath, 'utf8')).awards[1].seenDoneAt).toMatch(/^2026-11-13T/);
    put('p/docs/progress.md', doc('done', 'done'));
    expect(xpOf(syncer.run(null, false))).toMatchObject({ xp: 20 }); // T1 back to done: no double award
    expect(fs.readdirSync(tmp).sort()).not.toContain('.village-state');
  });
  it('a malformed ledger is backed up and replaced, sync still succeeds', () => {
    const { syncer, ledgerPath } = setup(doc('done', 'todo'));
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    fs.writeFileSync(ledgerPath, '{not json');
    const r = syncer.run(null, false);
    expect(r.ok).toBe(true);
    expect(xpOf(r)).toMatchObject({ xp: 10 });
    expect(fs.readdirSync(path.dirname(ledgerPath)).some((f) => f.startsWith('xp-ledger.json.bak-'))).toBe(true);
    expect(r.ok && r.file.village.warnings.some((w) => w.includes('XP ledger'))).toBe(true);
  });
  it('fixture-backed projects earn no ledger XP and old fixture awards are pruned', () => {
    const fx = put('fx/docs/progress.md', doc('done', 'done'));
    expect(fx).toBeTruthy();
    put('p/docs/progress.md', doc('done', 'todo'));
    const cfg = put('village.config.json', JSON.stringify({ timezone: 'Europe/Amsterdam', xpEnabled: false, agentsDir: path.join(tmp, 'nope'), projects: [
      { id: 'p', name: 'P', path: path.join(tmp, 'p'), building: 'hearth-lodge', position: { x: 0, y: 0 } },
      { id: 'flowbro', name: 'F', path: null, fixturePath: 'fx', building: 'hearth-lodge', position: { x: 1, y: 1 } },
    ] }));
    const ledgerPath = path.join(tmp, 'state', 'xp-ledger.json');
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    fs.writeFileSync(ledgerPath, JSON.stringify({ format: 'agent-village-xp/1', createdAt: '2026-11-13T09:00:00.000Z', awards: [
      { projectId: 'flowbro', taskId: 'T1', agent: 'typescript-pro', seenDoneAt: null },
      { projectId: 'p', taskId: 'T1', agent: 'typescript-pro', seenDoneAt: null },
      { bad: true },
    ] }));
    const r = createSyncer({ repoRoot: tmp, configPath: cfg, outPath: path.join(tmp, 'public', 'village.json'), home: tmp, ledgerPath, log: () => {} }).run(null, false);
    expect(xpOf(r)).toMatchObject({ xp: 10, tasksDone: 1 });
    expect(JSON.parse(fs.readFileSync(ledgerPath, 'utf8')).awards.map((a: { projectId: string }) => a.projectId)).toEqual(['p']);
    expect(r.ok && r.file.village.warnings.some((w) => w.includes('ignored 1 unreadable XP entry'))).toBe(true);
  });
  it('old village.json without pipeline or xp fields still loads', () => {
    const { syncer } = setup(doc('done', 'todo'));
    const r = syncer.run(null, false);
    if (!r.ok) throw new Error('sync failed');
    const old = JSON.parse(JSON.stringify(r.file));
    delete old.village.pipeline;
    delete old.village.xpSource;
    delete old.inputs.xp;
    const parsed = parseVillageFile(old);
    expect(parsed.ok && parsed.file.village.pipeline).toHaveLength(6);
    expect(parsed.ok && parsed.file.village.xpSource).toBe('snapshot');
  });
});
