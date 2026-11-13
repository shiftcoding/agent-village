/**
 * Specialist work spots and the content pipeline. Pure, browser-safe, derived ONLY from real data.
 *
 * Route (spec "Content pipeline"): bro-writer drafts (tavern), content-safety-reviewer checks (chapel),
 * the three advisors pre-review (well, herbalist, schoolhouse), humans sign off (town hall).
 * Done tasks are excluded everywhere: a cart only exists while work is still open.
 */
import type { PipelineItem, PipelineStop, PipelineStopId, SpecialistPlace, Task, Village } from './types';

/** Agent name -> specialist building used while its placing state is `doing`. */
export const SPECIALIST_PLACE_OF: Readonly<Record<string, SpecialistPlace>> = {
  'content-safety-reviewer': 'chapel',
  'relationship-advisor': 'well',
  'womens-health-advisor': 'herbalist',
  'parenting-advisor': 'schoolhouse',
};

export const PIPELINE_ORDER: readonly PipelineStopId[] = ['tavern', 'chapel', 'well', 'herbalist', 'schoolhouse', 'town-hall'];

/** Agents whose open tasks sit at each task stop. */
export const PIPELINE_AGENTS: Readonly<Record<Exclude<PipelineStopId, 'town-hall'>, string>> = {
  tavern: 'bro-writer',
  chapel: 'content-safety-reviewer',
  well: 'relationship-advisor',
  herbalist: 'womens-health-advisor',
  schoolhouse: 'parenting-advisor',
};

const PIPELINE_AGENT_NAMES: readonly string[] = Object.values(PIPELINE_AGENTS);

export function emptyPipeline(): PipelineStop[] {
  return PIPELINE_ORDER.map((stop) => ({
    stop,
    agents: stop === 'town-hall' ? [...PIPELINE_AGENT_NAMES] : [PIPELINE_AGENTS[stop]],
    items: [],
    count: 0,
  }));
}

/**
 * Task stops: that agent's tasks with any status except `done` (todo, doing, review, blocked, unknown).
 * Town hall: open Needs-you items whose "raised by" is one of the five pipeline agents.
 */
export function buildPipeline(
  tasks: readonly Task[],
  needsYou: ReadonlyArray<{ projectId: string; text: string; raisedBy: string | null }>,
  projectName: (projectId: string) => string,
): PipelineStop[] {
  const stops = emptyPipeline();
  for (const s of stops) {
    const items: PipelineItem[] = [];
    if (s.stop === 'town-hall') {
      for (const n of needsYou) {
        if (n.raisedBy !== null && PIPELINE_AGENT_NAMES.includes(n.raisedBy)) {
          items.push({ projectId: n.projectId, projectName: projectName(n.projectId), ref: 'needs-you', text: n.text, status: 'needs-you' });
        }
      }
    } else {
      const agent = PIPELINE_AGENTS[s.stop];
      for (const t of tasks) {
        if (t.agent === agent && t.status !== 'done') {
          items.push({ projectId: t.projectId, projectName: projectName(t.projectId), ref: t.id, text: t.title, status: t.status });
        }
      }
    }
    s.items = items;
    s.count = items.length;
  }
  return stops;
}

const STOP_PHRASE: Record<PipelineStopId, string> = {
  tavern: 'in drafting at the tavern',
  chapel: 'in safety review at the chapel',
  well: 'in advisor review at the well',
  herbalist: 'in advisor review at the herbalist',
  schoolhouse: 'in advisor review at the schoolhouse',
  'town-hall': 'waiting for sign-off at the town hall',
};

/** Plain-text summary for tooltips and the list view. Tolerates a missing pipeline (old data). */
export function pipelineSummary(pipeline: readonly PipelineStop[] | null | undefined): string {
  const parts: string[] = [];
  for (const s of pipeline ?? []) {
    if (!s || s.count <= 0) continue;
    const refs = s.items.map((i) => `${i.projectName} ${i.ref}`).join(', ');
    parts.push(`${s.count} ${s.count === 1 ? 'batch' : 'batches'} ${STOP_PHRASE[s.stop] ?? s.stop} (${refs})`);
  }
  return parts.length === 0 ? 'Content pipeline: nothing in flight.' : `Content pipeline: ${parts.join('; ')}.`;
}

export function pipelineOf(village: Pick<Village, 'pipeline'>): PipelineStop[] {
  return Array.isArray(village.pipeline) ? village.pipeline : emptyPipeline();
}
