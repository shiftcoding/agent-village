/** Differences between two Villages, for walking animations and banners. Pure. */
import type { Location, Stage, Village } from './types';

export interface VillageChanges {
  moved: Array<{ name: string; from: Location; to: Location }>;
  stageChanged: Array<{ projectId: string; fromStage: Stage; toStage: Stage; fromOverall: number | null; toOverall: number | null }>;
  /** Project ids that became released. */
  released: string[];
}

export function sameLocation(a: Location, b: Location): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'building' && b.kind === 'building') return a.projectId === b.projectId;
  if (a.kind === 'specialist' && b.kind === 'specialist') return a.place === b.place && a.projectId === b.projectId;
  return true;
}

export function villageChanges(prev: Village | null, next: Village): VillageChanges {
  const out: VillageChanges = { moved: [], stageChanged: [], released: [] };
  if (!prev) return out;
  const prevAgents = new Map((prev.agents ?? []).map((a) => [a.name, a]));
  for (const a of next.agents ?? []) {
    const p = prevAgents.get(a.name);
    if (p && !sameLocation(p.location, a.location)) out.moved.push({ name: a.name, from: p.location, to: a.location });
  }
  const prevProjects = new Map((prev.projects ?? []).map((p) => [p.id, p]));
  for (const p of next.projects ?? []) {
    const q = prevProjects.get(p.id);
    if (!q) continue;
    const fromStage = q.progress?.stage ?? 'unknown';
    const toStage = p.progress?.stage ?? 'unknown';
    const fromOverall = q.progress?.overall ?? null;
    const toOverall = p.progress?.overall ?? null;
    if (fromStage !== toStage || fromOverall !== toOverall) {
      out.stageChanged.push({ projectId: p.id, fromStage, toStage, fromOverall, toOverall });
    }
    if (toStage === 'released' && fromStage !== 'released') out.released.push(p.id);
  }
  return out;
}
