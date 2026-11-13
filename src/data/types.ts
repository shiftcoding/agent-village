/**
 * Agent Village data contract (v1).
 *
 * This is the ONE interface between data and art/UI. In v1 it is built from
 * markdown imported at dev/build time; in phase 2 the same `Village` shape is
 * produced by `npm run sync` into public/village.json. Nothing in this folder
 * may import from src/art or src/ui.
 *
 * Owner: typescript-pro (may extend, must not break names below without
 * telling the orchestrator).
 */

export type Stage =
  | 'brief'
  | 'research'
  | 'product'
  | 'design'
  | 'architecture'
  | 'building'
  | 'testing'
  | 'released'
  | 'unknown';

export type TaskStatus = 'todo' | 'doing' | 'blocked' | 'review' | 'done' | 'unknown';

/** Village classes from the spec tables, plus the hooded stranger for unknown names. */
export type VillageClass =
  // core party
  | 'guild-master' // orchestrator
  | 'wizard-scholar' // ux-researcher
  | 'cartographer' // product-manager
  | 'illusionist' // ui-designer
  | 'artificer' // mobile-developer
  | 'dwarf-smith' // backend-developer
  | 'harbor-master' // devops-engineer
  | 'paladin' // code-reviewer
  | 'ranger' // qa-expert
  | 'bard-troupe' // user-simulator
  // FlowBro specialists
  | 'enchanter' // react-specialist
  | 'rune-smith' // typescript-pro
  | 'tinkerer' // test-automator
  | 'herald' // accessibility-tester
  | 'sign-painter' // ux-microcopy-reviewer
  | 'jester' // bro-writer
  | 'cleric' // content-safety-reviewer
  | 'warden' // privacy-guardian
  | 'elder-counselor' // relationship-advisor
  | 'healer' // womens-health-advisor
  | 'teacher' // parenting-advisor
  // unknown agent name
  | 'stranger';

export type BuildingType = 'hearth-lodge' | 'cartographers-workshop' | 'unknown';

/** Roster entry, from the spec tables in v1 (from ~/.claude/agents/*.md in phase 2). */
export interface AgentDef {
  name: string;
  role: string;
  source: string;
  model: string;
  villageClass: VillageClass;
  /** Plain-text look description from the spec, e.g. "Purple robe, ledger, banner staff". */
  look: string;
  worksAt: string;
  scope: 'core' | 'flowbro';
}

export interface Task {
  projectId: string;
  id: string;
  title: string;
  /** Raw agent name as written in progress.md ('' if missing). */
  agent: string;
  status: TaskStatus;
  /** Raw status text, kept so "unknown" can show what was actually written. */
  rawStatus: string;
  notes: string;
}

export interface NeedsYouItem {
  projectId: string;
  text: string;
  raisedBy: string | null;
  /** Position in the file (0 = first). Spec: newest first; files list newest last unless dated. */
  index: number;
}

export interface Milestone {
  text: string;
  done: boolean;
}

export interface LogEntry {
  projectId: string;
  /** Raw "YYYY-MM-DD HH:MM" or null if unparseable. */
  timestamp: string | null;
  /** Epoch ms (interpreted in the configured timezone), null if unknown. */
  time: number | null;
  agent: string | null;
  text: string;
}

export interface ProgressFile {
  name: string | null;
  stage: Stage;
  /** 0-100, null when unknown. */
  overall: number | null;
  overallSource: 'file' | 'computed' | 'unknown';
  updated: string | null;
  updatedTime: number | null;
  needsYou: NeedsYouItem[];
  milestones: Milestone[];
  tasks: Task[];
  log: LogEntry[];
  /** Human-readable parse problems, shown in panels, never thrown. */
  warnings: string[];
}

export interface Finding {
  projectId: string;
  /** Task the finding is about, e.g. "T1". */
  taskId: string | null;
  text: string;
  raisedBy: string | null;
  open: boolean;
  file: string;
}

export interface UserTestReport {
  projectId: string;
  file: string;
  date: string | null;
  personas: string[];
  blockers: string[];
}

export type HealthKind = 'active' | 'needs-you' | 'failing' | 'friction' | 'stale' | 'released';

export interface HealthSignal {
  kind: HealthKind;
  /** Short label, e.g. "Needs you (3)". */
  label: string;
  /** Plain-text meaning for tooltip, e.g. "3 open items waiting on Ivan". */
  detail: string;
}

/** Placeholder state for a building that has no data to draw. */
export type PlotState = 'ok' | 'no-folder' | 'no-progress';

export interface Project {
  id: string;
  name: string;
  building: BuildingType;
  position: { x: number; y: number };
  plot: PlotState;
  /** True when data came from fixtures/ (path null). */
  isFixture: boolean;
  /** Folder path as written in village.config.json ("~" not expanded), null when not set (sample data or no folder). Used only to build copyable prompts. */
  path?: string | null;
  progress: ProgressFile | null;
  findings: Finding[];
  userTests: UserTestReport[];
  health: HealthSignal[];
  /** Reference time used for active/stale/this-week for THIS project (epoch ms). */
  referenceTime: number;
  referenceSource: 'file-updated' | 'wall-clock' | 'override';
  doneThisWeek: number;
}

export type AgentState = 'doing' | 'review' | 'blocked' | 'todo' | 'idle';

/** Where a character stands in the village. */
export type Location =
  | { kind: 'building'; projectId: string }
  | { kind: 'gatehouse' }
  | { kind: 'town-hall-steps' }
  | { kind: 'quest-board' }
  | { kind: 'tavern' }
  | { kind: 'specialist'; place: SpecialistPlace; projectId: string };

/** Specialist buildings (FlowBro): where the four advisors-and-reviewer agents work when their state is `doing`. */
export type SpecialistPlace = 'chapel' | 'well' | 'herbalist' | 'schoolhouse';

/** Stops on the content-pipeline route, in walking order. */
export type PipelineStopId = 'tavern' | 'chapel' | 'well' | 'herbalist' | 'schoolhouse' | 'town-hall';

export interface PipelineItem {
  projectId: string;
  projectName: string;
  /** Task id (e.g. "T8"), or 'needs-you' for a human sign-off item. */
  ref: string;
  text: string;
  status: TaskStatus | 'needs-you';
}

export interface PipelineStop {
  stop: PipelineStopId;
  /** Agents whose open work is collected at this stop. */
  agents: string[];
  items: PipelineItem[];
  /** Always items.length. 0 = the stop is on the route but no cart is drawn there. */
  count: number;
}

export interface Agent {
  name: string;
  /** null = not in roster: drawn as a hooded stranger. */
  def: AgentDef | null;
  villageClass: VillageClass;
  state: AgentState;
  location: Location;
  /** Project of the task that decided the location (null at tavern / no task). */
  projectId: string | null;
  /** Has any blocked task (shows "!" even if another state wins placement). */
  hasBlocked: boolean;
  /** Open (non-done) tasks across all projects. */
  tasks: Task[];
  doneThisWeek: number;
  /** "zzz": idle and no log line by this agent for 24h (relative to reference time). */
  sleepy: boolean;
  /** Free-text reason for placement, e.g. "FlowBro has no backend; rests at the tavern." */
  note: string | null;
  /** XP (10 per task ever seen done, see docs/architecture.md). Always set; only shown when xpEnabled. */
  xp: number;
  /** 1 + floor(xp / 30). */
  level: number;
  /** Tasks counted for XP (same ledger as xp). */
  tasksDone: number;
  /** user-simulator only: persona names for the masked troupe. */
  personas?: string[];
}

export interface QuestNote {
  task: Task;
  projectName: string;
  villageClass: VillageClass;
}

export interface Village {
  generatedAt: string;
  xpEnabled: boolean;
  timezone: string;
  /** Where sunrise/sunset are computed. Absent = Amsterdam default (see daylight.ts). */
  location?: GeoLocation;
  /** 'ledger' = counted by sync between runs; 'snapshot' = done tasks right now (browser fixture fallback). */
  xpSource: 'ledger' | 'snapshot';
  /** ISO time the XP ledger began ("XP counted since ..."); null for a snapshot. */
  xpSince: string | null;
  /** Content pipeline route, always 6 stops in order (some may have count 0). */
  pipeline: PipelineStop[];
  projects: Project[];
  agents: Agent[];
  /** All open Needs-you items across projects, newest first. */
  needsYou: Array<NeedsYouItem & { projectName: string }>;
  questBoard: QuestNote[];
  /** Latest 20 log lines across projects, newest first. */
  chronicle: Array<LogEntry & { projectName: string }>;
  weeklyTally: Array<{ projectId: string; projectName: string; done: number }>;
  /** Parse and load problems from all projects, human-readable ("FlowBro: ..."). */
  warnings: string[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/** One entry of village.config.json "projects". */
export interface ConfigProject {
  id: string;
  name: string;
  /** Folder path (may start with "~"), or null. */
  path: string | null;
  /** v1 only: repo-relative folder holding sample docs, used when path is null. */
  fixturePath?: string | null;
  building: string;
  position: { x: number; y: number };
}

/** Shape of village.config.json. */
export interface VillageConfig {
  version?: number;
  agentsDir?: string;
  timezone: string;
  xpEnabled: boolean;
  /** Optional place for sunrise/sunset. Default Amsterdam. */
  location?: GeoLocation;
  projects: ConfigProject[];
}
