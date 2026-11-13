/** Route of the content-pipeline track along the visible paths. Pure. */
import { PIPELINE_ORDER, routeAlongPaths, type PathNetwork } from '../art';
import type { PipelineStop, PipelineStopId } from '../data/types';
import type { Pt } from './walk';

/** Path node at each pipeline stop (the point in front of the door; the town hall stop is the foot of the steps). */
export const STOP_NODE: Record<PipelineStopId, string> = {
  tavern: 'tavern',
  chapel: 'chapel',
  well: 'well',
  herbalist: 'herbalist',
  schoolhouse: 'schoolhouse',
  'town-hall': 'hall',
};

export function activeStops(pipeline: readonly PipelineStop[]): PipelineStop[] {
  return pipeline.filter((s) => s.count > 0 && (PIPELINE_ORDER as readonly string[]).includes(s.stop));
}

/**
 * Points of the track: the whole ordered route from the first to the last active stop, built with routeAlongPaths
 * between consecutive stops of PIPELINE_ORDER (stops in between are passed even when empty).
 * Fewer than two points (one active stop, or nothing) means no track.
 */
export function pipelineTrackPoints(net: PathNetwork, pipeline: readonly PipelineStop[]): Pt[] {
  const active = new Set(activeStops(pipeline).map((s) => s.stop));
  const idx = PIPELINE_ORDER.map((id, i) => (active.has(id) ? i : -1)).filter((i) => i >= 0);
  if (idx.length === 0) return [];
  const first = idx[0] as number;
  const last = idx[idx.length - 1] as number;
  const out: Pt[] = [];
  for (let i = first; i < last; i++) {
    const a = STOP_NODE[PIPELINE_ORDER[i] as PipelineStopId];
    const b = STOP_NODE[PIPELINE_ORDER[i + 1] as PipelineStopId];
    const seg = routeAlongPaths(net, a, b);
    seg.forEach((p, j) => {
      const prev = out[out.length - 1];
      if (j === 0 && prev && prev.x === p.x && prev.y === p.y) return;
      out.push({ x: p.x, y: p.y });
    });
  }
  return out.length >= 2 ? out : [];
}
