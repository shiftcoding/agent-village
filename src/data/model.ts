/**
 * Builds the Village from parsed sources. Pure; never throws for bad input.
 */
import type {
  Agent,
  AgentDef,
  AgentState,
  BuildingType,
  Finding,
  HealthSignal,
  Location,
  LogEntry,
  Project,
  ProgressFile,
  Task,
  UserTestReport,
  Village,
  VillageClass,
  VillageConfig,
} from './types';
import { ROSTER } from './roster';
import { parseFindings, parseProgress, parseUserTest } from './parse';
import { isoWeekStart } from './time';
import { SPECIALIST_PLACE_OF, buildPipeline } from './pipeline';
import { levelForXp, snapshotXp, type XpSummary } from './xpLedger';
import { parseLocation } from './daylight';

export interface ProjectSources {
  progress?: string | null;
  userTests: Array<{ file: string; text: string }>;
  reviews: Array<{ file: string; text: string }>;
  /** Persona names from docs/research.md (phase 2). Empty/missing = fall back to DEFAULT_PERSONAS. */
  personas?: string[];
}

export interface BuildInput {
  config: VillageConfig;
  /** Keyed by project id. Missing key = no sources. */
  sources: Record<string, ProjectSources | undefined>;
  nowOverride?: number | null;
  /** Date.now(), passed in to keep this function pure. */
  wallClock: number;
  /**
   * Agent definitions that count as "installed" (see resolveRoster). Default: the spec ROSTER.
   * An agent name in progress.md that matches none of these is a hooded stranger.
   */
  roster?: readonly AgentDef[];
  /** Load-time warnings (missing agents folder, oversized files...) appended to village.warnings. */
  extraWarnings?: string[];
  /** XP per agent from the sync ledger. Absent = stateless snapshot of tasks done right now. */
  xp?: XpSummary | null;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const DEFAULT_PERSONAS = ['First-timer', 'Power user', 'Distracted mobile user', 'Accessibility-dependent user'];
const STATE_PRIORITY: AgentState[] = ['doing', 'blocked', 'review', 'todo'];
const BACKEND_NOTE = 'FlowBro has no backend; typescript-pro owns the core logic, so the smith rests at the tavern.';
const ORCHESTRATOR_NOTE = 'Stands on the town hall steps';

function asBuilding(s: string): BuildingType {
  return s === 'hearth-lodge' || s === 'cartographers-workshop' ? s : 'unknown';
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function sameId(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

/**
 * doneThisWeek heuristic. progress.md has no per-task done dates, so a done
 * task counts in the current ISO week (Monday 00:00 in the configured
 * timezone, relative to the project's reference time) if a log line in that
 * week mentions its ID; otherwise it counts if the task's agent has a log line
 * in that week not already used. One log line credits at most one task, so an
 * agent with one log line cannot claim all of its done tasks. Phase 2 sync can
 * track status transitions and make this exact.
 */
function doneTasksThisWeek(progress: ProgressFile, reference: number, tz: string): Task[] {
  const start = isoWeekStart(reference, tz);
  const weekLog = progress.log.filter((l) => l.time !== null && l.time >= start && l.time <= reference);
  if (weekLog.length === 0) return [];
  const used = new Set<number>();
  const done = progress.tasks.filter((t) => t.status === 'done');
  const counted = new Set<Task>();
  for (const t of done) {
    const idRe = new RegExp(`(^|[^A-Za-z0-9])${t.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^A-Za-z0-9])`, 'i');
    const i = weekLog.findIndex((l) => idRe.test(l.text));
    if (i >= 0) {
      counted.add(t);
      used.add(i);
    }
  }
  for (const t of done) {
    if (counted.has(t) || t.agent === '') continue;
    const i = weekLog.findIndex((l, j) => !used.has(j) && l.agent === t.agent);
    if (i >= 0) {
      counted.add(t);
      used.add(i);
    }
  }
  return done.filter((t) => counted.has(t));
}

function computeHealth(
  progress: ProgressFile,
  findings: Finding[],
  userTests: UserTestReport[],
  reference: number,
): HealthSignal[] {
  const out: HealthSignal[] = [];
  if (progress.stage === 'released') {
    out.push({ kind: 'released', label: 'Released', detail: 'Flag flying: the stage is released.' });
  }
  const open = progress.needsYou.length;
  if (open > 0) {
    out.push({
      kind: 'needs-you',
      label: `Needs you (${open})`,
      detail: `Banner with "!": ${plural(open, 'open item', 'open items')} waiting on Ivan.`,
    });
  }

  const doneTasks = progress.tasks.filter((t) => t.status === 'done');
  const failingFindings = findings.filter((f) => f.open && f.taskId && doneTasks.some((t) => sameId(t.id, f.taskId ?? '')));
  if (failingFindings.length > 0) {
    const ids = [...new Set(failingFindings.map((f) => f.taskId ?? ''))].join(', ');
    out.push({
      kind: 'failing',
      label: `Failing (${failingFindings.length})`,
      detail: `Storm cloud: ${plural(failingFindings.length, 'open review finding', 'open review findings')} on ${
        ids.includes(',') ? 'tasks' : 'a task'
      } marked done (${ids}).`,
    });
  } else {
    const ci = doneTasks.filter((t) => /failing/i.test(t.notes) && !/\b(no|0|zero|not)\s+failing/i.test(t.notes));
    if (ci.length > 0) {
      out.push({
        kind: 'failing',
        label: 'Failing',
        detail: `Storm cloud: notes on a done task mention failing checks (${ci.map((t) => t.id).join(', ')}).`,
      });
    }
  }

  const latest = [...userTests].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.file.localeCompare(a.file))[0];
  if (latest && latest.blockers.length > 0) {
    out.push({
      kind: 'friction',
      label: `User friction (${latest.blockers.length})`,
      detail: `Masked figure on the doorstep: ${plural(latest.blockers.length, 'blocker', 'blockers')} in the latest user-simulator report (${
        latest.date ?? latest.file
      }).`,
    });
  }

  const times = progress.log.map((l) => l.time).filter((t): t is number => t !== null && t <= reference);
  const newest = times.length ? Math.max(...times) : null;
  if (newest !== null && reference - newest <= DAY) {
    const n = times.filter((t) => reference - t <= DAY).length;
    out.push({ kind: 'active', label: 'Active', detail: `Chimney smoke: ${plural(n, 'log line', 'log lines')} in the last 24 hours.` });
  } else if (newest === null || reference - newest > 7 * DAY) {
    out.push({
      kind: 'stale',
      label: 'Stale',
      detail: newest === null ? 'Vines on the walls: no log lines yet.' : 'Vines on the walls: no log line for 7 days.',
    });
  }
  return out;
}

interface ProjectBuild {
  project: Project;
  doneWeek: Task[];
}

export function buildVillage(input: BuildInput): Village {
  const warnings: string[] = [...(input.extraWarnings ?? [])];
  const roster = input.roster ?? ROSTER;
  const defByName = new Map(roster.map((a) => [a.name, a]));
  const findAgentDef = (name: string | null | undefined): AgentDef | null =>
    typeof name === 'string' ? (defByName.get(name.trim()) ?? null) : null;
  const config = input.config;
  const tz = config.timezone || 'Europe/Amsterdam';
  const wall = Number.isFinite(input.wallClock) ? input.wallClock : 0;
  const builds: ProjectBuild[] = [];

  for (const cp of config.projects ?? []) {
    const src = input.sources[cp.id];
    const isFixture = cp.path === null && !!cp.fixturePath;
    const progressText = typeof src?.progress === 'string' && src.progress.trim() ? src.progress : null;
    const plot: Project['plot'] = cp.path === null && !cp.fixturePath ? 'no-folder' : progressText === null ? 'no-progress' : 'ok';
    const progress = plot === 'ok' ? parseProgress(progressText, cp.id, tz) : null;
    const findings = plot === 'ok' ? (src?.reviews ?? []).flatMap((r) => parseFindings(r.text, r.file, cp.id)) : [];
    const userTests = plot === 'ok' ? (src?.userTests ?? []).map((u) => parseUserTest(u.text, u.file, cp.id)) : [];

    let referenceTime = wall;
    let referenceSource: Project['referenceSource'] = 'wall-clock';
    if (input.nowOverride != null && Number.isFinite(input.nowOverride)) {
      referenceTime = input.nowOverride;
      referenceSource = 'override';
    } else if (isFixture && progress?.updatedTime != null) {
      referenceTime = progress.updatedTime;
      referenceSource = 'file-updated';
    }

    const health = progress ? computeHealth(progress, findings, userTests, referenceTime) : [];
    const doneWeek = progress ? doneTasksThisWeek(progress, referenceTime, tz) : [];
    if (progress) for (const w of progress.warnings) warnings.push(`${cp.name}: ${w}`);

    builds.push({
      doneWeek,
      project: {
        id: cp.id,
        name: cp.name,
        building: asBuilding(cp.building),
        position: cp.position,
        plot,
        isFixture,
        path: typeof cp.path === 'string' && cp.path.trim() !== '' ? cp.path.trim() : null,
        progress,
        findings,
        userTests,
        health,
        referenceTime,
        referenceSource,
        doneThisWeek: doneWeek.length,
      },
    });
  }

  const projects = builds.map((b) => b.project);
  const withProgress = projects.filter((p): p is Project & { progress: ProgressFile } => p.progress !== null);
  const nameOf = (id: string): string => projects.find((p) => p.id === id)?.name ?? id;

  // ---- Agents -------------------------------------------------------------
  const allTasks = withProgress.flatMap((p) => p.progress.tasks);
  const allLog = withProgress.flatMap((p) => p.progress.log);
  const names: string[] = roster.map((a) => a.name);
  const seen = new Set(names);
  const addStranger = (n: string | null | undefined): void => {
    const name = (n ?? '').trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  };
  for (const t of allTasks) addStranger(t.agent);
  for (const p of withProgress) for (const n of p.progress.needsYou) addStranger(n.raisedBy);
  for (const l of allLog) addStranger(l.agent);

  const refOf = new Map(projects.map((p) => [p.id, p.referenceTime]));
  const doneWeekByAgent = new Map<string, number>();
  for (const b of builds) for (const t of b.doneWeek) doneWeekByAgent.set(t.agent, (doneWeekByAgent.get(t.agent) ?? 0) + 1);

  const latestLogBy = (agent: string, projectId?: string): number => {
    let best = Number.NEGATIVE_INFINITY;
    for (const l of allLog) {
      if (l.agent === agent && l.time !== null && (!projectId || l.projectId === projectId) && l.time > best) best = l.time;
    }
    return best;
  };

  const researched = [
    ...new Set(
      (config.projects ?? [])
        .flatMap((cp) => input.sources[cp.id]?.personas ?? [])
        .filter((n): n is string => typeof n === 'string' && n.trim() !== ''),
    ),
  ];
  const personas = researched.length > 0 ? researched : [...DEFAULT_PERSONAS];

  const xpSummary: XpSummary = input.xp ?? snapshotXp(allTasks);
  const agents: Agent[] = names.map((name) => {
    const def = findAgentDef(name);
    const villageClass: VillageClass = def ? def.villageClass : 'stranger';
    const mine = allTasks.filter((t) => t.agent === name);
    const open = mine.filter((t) => t.status !== 'done');
    const state: AgentState = STATE_PRIORITY.find((s) => open.some((t) => t.status === s)) ?? 'idle';
    const hasBlocked = open.some((t) => t.status === 'blocked');

    let location: Location = { kind: 'tavern' };
    let projectId: string | null = null;
    let note: string | null = null;
    if (state !== 'idle') {
      const decider = open.filter((t) => t.status === state);
      let chosen = decider[0];
      if (state === 'doing') {
        let best = Number.NEGATIVE_INFINITY;
        for (const t of decider) {
          const when = latestLogBy(name, t.projectId);
          if (when > best || chosen === undefined) {
            best = when;
            chosen = t;
          }
        }
      }
      projectId = chosen?.projectId ?? null;
      const specialist = SPECIALIST_PLACE_OF[name];
      if (state === 'doing' && projectId && specialist) location = { kind: 'specialist', place: specialist, projectId };
      else if (state === 'doing' && projectId) location = { kind: 'building', projectId };
      else if (state === 'blocked') location = { kind: 'town-hall-steps' };
      else if (state === 'review') location = { kind: 'gatehouse' };
      else if (state === 'todo') location = { kind: 'quest-board' };
    }
    if (name === 'orchestrator') {
      location = { kind: 'town-hall-steps' };
      if (state === 'idle') note = ORCHESTRATOR_NOTE;
    }
    if (name === 'backend-developer' && open.length === 0) note = BACKEND_NOTE;

    const recent = allLog.some((l) => {
      const ref = refOf.get(l.projectId);
      return l.agent === name && l.time !== null && ref !== undefined && l.time >= ref - DAY && l.time <= ref;
    });
    const earned = Object.prototype.hasOwnProperty.call(xpSummary.byAgent, name) ? xpSummary.byAgent[name] : undefined;
    const xp = earned?.xp ?? 0;
    const agent: Agent = {
      name,
      def,
      villageClass,
      state,
      location,
      projectId,
      hasBlocked,
      tasks: open,
      doneThisWeek: doneWeekByAgent.get(name) ?? 0,
      sleepy: state === 'idle' && location.kind === 'tavern' && !recent,
      note,
      xp,
      level: levelForXp(xp),
      tasksDone: earned?.tasksDone ?? 0,
    };
    if (name === 'user-simulator') agent.personas = personas;
    return agent;
  });

  // ---- Town square --------------------------------------------------------
  const byUpdated = [...withProgress].sort(
    (a, b) => (b.progress.updatedTime ?? Number.NEGATIVE_INFINITY) - (a.progress.updatedTime ?? Number.NEGATIVE_INFINITY),
  );
  const needsYou: Village['needsYou'] = byUpdated.flatMap((p) =>
    [...p.progress.needsYou].reverse().map((n) => ({ ...n, projectName: p.name })),
  );

  const questBoard: Village['questBoard'] = withProgress.flatMap((p) =>
    p.progress.tasks
      .filter((t) => t.status === 'todo')
      .map((task) => ({ task, projectName: p.name, villageClass: findAgentDef(task.agent)?.villageClass ?? ('stranger' as VillageClass) })),
  );

  const logWithName: Array<LogEntry & { projectName: string }> = withProgress.flatMap((p) =>
    p.progress.log.map((l) => ({ ...l, projectName: p.name })),
  );
  const chronicle = logWithName
    .map((l, i) => ({ l, i }))
    .sort((a, b) => {
      if (a.l.time === null && b.l.time === null) return a.i - b.i;
      if (a.l.time === null) return 1;
      if (b.l.time === null) return -1;
      return b.l.time - a.l.time || a.i - b.i;
    })
    .slice(0, 20)
    .map((x) => x.l);

  const weeklyTally = projects.map((p) => ({ projectId: p.id, projectName: nameOf(p.id), done: p.doneThisWeek }));

  const pipeline = buildPipeline(allTasks, needsYou, nameOf);
  const location = parseLocation(config.location);

  return {
    generatedAt: new Date(wall).toISOString(),
    xpEnabled: !!config.xpEnabled,
    timezone: tz,
    ...(location ? { location } : {}),
    xpSource: xpSummary.source,
    xpSince: xpSummary.since,
    pipeline,
    projects,
    agents,
    needsYou,
    questBoard,
    chronicle,
    weeklyTally,
    warnings,
  };
}
