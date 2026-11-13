/** Plain-text helpers shared by the scene, panels, list view and tooltips. No React in here. */
import type { Agent, AgentState, BuildingType, HealthKind, PipelineStopId, Project, SpecialistPlace, Stage, Task, VillageClass } from '../data/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-20 11:30" to "20 Nov 11:30". Anything unparseable is "unknown time". */
export function fmtStamp(ts: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(ts ?? '');
  if (!m) return 'unknown time';
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return 'unknown time';
  return `${Number(m[3])} ${month} ${m[4]}:${m[5]}`;
}

/** Epoch ms to "20 Nov 16:40" in the given timezone. */
export function fmtEpoch(ms: number, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(ms));
    const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? '';
    return `${get('day')} ${get('month')} ${get('hour')}:${get('minute')}`;
  } catch {
    return 'unknown time';
  }
}

export const CLASS_LABEL: Record<VillageClass, string> = {
  'guild-master': 'Guild master',
  'wizard-scholar': 'Wizard scholar',
  cartographer: 'Cartographer',
  illusionist: 'Illusionist',
  artificer: 'Artificer',
  'dwarf-smith': 'Dwarf smith',
  'harbor-master': 'Harbor master',
  paladin: 'Paladin',
  ranger: 'Ranger',
  'bard-troupe': 'Bard troupe',
  enchanter: 'Enchanter',
  'rune-smith': 'Rune-smith',
  tinkerer: 'Tinkerer',
  herald: 'Herald',
  'sign-painter': 'Sign painter',
  jester: 'Jester',
  cleric: 'Cleric',
  warden: 'Warden',
  'elder-counselor': 'Elder counselor',
  healer: 'Healer',
  teacher: 'Teacher',
  stranger: 'Hooded stranger',
};

export const BUILDING_LABEL: Record<BuildingType, string> = {
  'hearth-lodge': 'Hearth Lodge',
  'cartographers-workshop': "Cartographer's Workshop",
  unknown: 'Building plot',
};

export const STAGE_LABEL: Record<Stage, string> = {
  brief: 'Brief',
  research: 'Research',
  product: 'Product',
  design: 'Design',
  architecture: 'Architecture',
  building: 'Building',
  testing: 'Testing',
  released: 'Released',
  unknown: 'Unknown',
};

export const STATE_LABEL: Record<AgentState, string> = {
  doing: 'Doing',
  review: 'In review',
  blocked: 'Blocked',
  todo: 'Todo only',
  idle: 'Idle',
};

export const HEALTH_LABEL: Record<HealthKind, string> = {
  active: 'Active',
  'needs-you': 'Needs you',
  failing: 'Failing',
  friction: 'User friction',
  stale: 'Stale',
  released: 'Released',
};

/** Order signals are shown in: most urgent first. */
export const HEALTH_ORDER: HealthKind[] = ['needs-you', 'failing', 'friction', 'stale', 'released', 'active'];

export function sortHealth<T extends { kind: HealthKind }>(h: T[]): T[] {
  return [...h].sort((a, b) => HEALTH_ORDER.indexOf(a.kind) - HEALTH_ORDER.indexOf(b.kind));
}

export function buildingName(p: Project): string {
  if (p.plot === 'no-folder') return 'Building plot (no folder set)';
  if (p.plot === 'no-progress') return 'Building plot (no progress file yet)';
  return BUILDING_LABEL[p.building];
}

export function the(name: string): string {
  return /^the /i.test(name) ? name : `the ${name}`;
}

/** Short state word shown on the second line of a name tag. */
export function tagStateText(a: Agent): string {
  if (a.villageClass === 'stranger') return a.state === 'idle' ? 'Unknown, idle' : `Unknown, ${a.state}`;
  let s = STATE_LABEL[a.state];
  if (a.state === 'idle' && a.sleepy) s = 'Idle, zzz';
  if (a.hasBlocked && a.state !== 'blocked') s += ', has blocked';
  return s;
}

export function taskKey(t: Pick<Task, 'projectId' | 'id'>): string {
  return `${t.projectId}:${t.id}`;
}

export function initialsOf(name: string): string {
  const words = name.split(/[\s_-]+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  return name.slice(0, 2).toUpperCase();
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1)).trimEnd()}...`;
}

export function pluralise(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export const PLACE_LABEL: Record<SpecialistPlace, string> = {
  chapel: 'Chapel',
  well: 'Village well',
  herbalist: "Herbalist's hut",
  schoolhouse: 'Schoolhouse',
};

export const STOP_LABEL: Record<PipelineStopId, string> = {
  tavern: 'Tavern (drafting)',
  chapel: 'Chapel (safety review)',
  well: 'Village well (advisor review)',
  herbalist: "Herbalist's hut (advisor review)",
  schoolhouse: 'Schoolhouse (advisor review)',
  'town-hall': 'Town hall (human sign-off)',
};

/** ISO time to "12 Nov 2026" in the given timezone; anything unparseable is "an unknown date". */
export function fmtDate(iso: string | null | undefined, timeZone: string): string {
  const ms = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(ms)) return 'an unknown date';
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms));
  } catch {
    return 'an unknown date';
  }
}

/** One line explaining where XP comes from. Never mentions streaks or rankings as features. */
export function xpSourceText(v: { xpSource: 'ledger' | 'snapshot'; xpSince: string | null; timezone: string }): string {
  return v.xpSource === 'ledger' ? `XP counted since ${fmtDate(v.xpSince, v.timezone)}` : 'XP from tasks done now (no history)';
}
