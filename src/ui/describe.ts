/** Plain-text meanings for tooltips and aria-labels. Same text for hover, focus and screen readers. */
import { pipelineSummary } from '../data/pipeline';
import type { Agent, PipelineStop, Project, SpecialistPlace, Village } from '../data/types';
import { CLASS_LABEL, PLACE_LABEL, STAGE_LABEL, STATE_LABEL, buildingName, fmtStamp, sortHealth, the } from './format';
import { agentOfPlace } from './layout';

export function placeName(a: Agent, village: Village): string {
  switch (a.location.kind) {
    case 'building': {
      const id = a.location.projectId;
      const p = village.projects.find((x) => x.id === id);
      return p ? `${the(buildingName(p).replace(/ \(.*\)$/, ''))} (${p.name})` : 'a project building';
    }
    case 'gatehouse':
      return 'the gatehouse';
    case 'town-hall-steps':
      return 'the town hall steps';
    case 'quest-board':
      return 'the quest board';
    case 'tavern':
      return 'the tavern';
    case 'specialist':
      return ({ chapel: 'the chapel', well: 'the well', herbalist: "the herbalist's hut", schoolhouse: 'the schoolhouse' } as Record<string, string>)[a.location.place] ?? 'a specialist building';
  }
}

/** Tasks that decided where the agent stands (same status, same project), falling back to all open tasks. */
function decidingTasks(a: Agent) {
  const same = a.tasks.filter((t) => t.status === a.state && (a.projectId === null || t.projectId === a.projectId));
  return same.length ? same : a.tasks.filter((t) => t.status === a.state);
}

export function agentTip(a: Agent, village: Village, xp = false): string {
  const base = agentTipBase(a, village);
  return xp ? `${base} Level ${a.level}, ${a.xp} XP.` : base;
}

function agentTipBase(a: Agent, village: Village): string {
  const cls = a.villageClass === 'stranger' ? 'unknown agent, hooded stranger' : CLASS_LABEL[a.villageClass];
  const head = `${a.name}, ${cls}`;
  const where = placeName(a, village);
  const extra = a.hasBlocked && a.state !== 'blocked' ? ' Has a blocked task.' : '';
  const personas = a.personas?.length ? ` Troupe of ${a.personas.length}: ${a.personas.join(', ')}.` : '';
  if (a.state === 'idle') {
    const base = a.location.kind === 'tavern' ? `resting inside ${where}${a.sleepy ? ', asleep (no log line for 24 hours)' : ''}` : `no open tasks, standing at ${where}`;
    const note = a.note && a.location.kind === 'tavern' ? ` ${a.note.replace(/\.$/, '')}.` : '';
    return `${head}: ${base}.${extra}${note}${personas}`;
  }
  const tasks = decidingTasks(a);
  const first = tasks[0];
  const list = first ? `${first.id} ${first.title}${tasks.length > 1 ? ` (+${tasks.length - 1} more)` : ''}` : 'a task';
  const verb: Record<string, string> = { doing: 'doing', review: 'waiting for review of', blocked: 'blocked on', todo: 'studying the todo task' };
  return `${head}: ${verb[a.state] ?? STATE_LABEL[a.state]} ${list} at ${where}.${extra}${personas}`;
}

export function projectTip(p: Project): string {
  const head = `${p.name}, ${buildingName(p)}`;
  if (p.plot === 'no-folder') return `${head}. No folder is set for this project in village.config.json.`;
  if (p.plot === 'no-progress') return `${head}. The project has no docs/progress.md yet.`;
  const pr = p.progress;
  const bits = [`Stage ${STAGE_LABEL[pr?.stage ?? 'unknown'].toLowerCase()}`, pr?.overall != null ? `${pr.overall}% overall` : 'overall unknown'];
  const sig = sortHealth(p.health);
  const signals = sig.length ? ` Signals: ${sig.map((s) => s.detail.replace(/\.$/, '')).join('; ')}.` : ' No health signals right now.';
  return `${head}. ${bits.join(', ')}.${signals}`;
}

export function needsYouTip(village: Village): string {
  const n = village.needsYou.length;
  return n === 0 ? 'Town hall: nothing is waiting on you.' : `Town hall: ${n} open ${n === 1 ? 'item' : 'items'} waiting on you, newest first.`;
}

export function stamp(ts: string | null): string {
  return fmtStamp(ts);
}

/** Tooltip and aria-label of a specialist building: who works there and what they are doing. */
export function specialistTip(place: SpecialistPlace, village: Village): string {
  const label = PLACE_LABEL[place];
  const a = agentOfPlace(village, place);
  if (!a) return `${label}: nobody works here.`;
  const who = `${a.name} (${a.villageClass === 'stranger' ? 'hooded stranger' : CLASS_LABEL[a.villageClass]})`;
  if (a.location.kind === 'specialist' && a.location.place === place) {
    const tasks = decidingTasks(a);
    const first = tasks[0];
    const projectName = first ? (village.projects.find((p) => p.id === first.projectId)?.name ?? first.projectId) : '';
    const doing = first ? ` Doing ${projectName} ${first.id}: ${first.title}${tasks.length > 1 ? ` (+${tasks.length - 1} more)` : ''}.` : ' Doing a task.';
    return `${label}: ${who} works here.${doing}`;
  }
  return `${label}: ${who} works here when doing a task. Right now ${a.state === 'idle' ? 'idle' : STATE_LABEL[a.state].toLowerCase()} at ${placeName(a, village)}.`;
}

/** Tooltip and aria-label of a pipeline cart (one stop). */
export function pipelineStopTip(stop: PipelineStop): string {
  return pipelineSummary([stop]);
}
