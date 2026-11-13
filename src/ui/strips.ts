/** Signal strip beside each building: one pill per health signal (icon + text), placed away from the village centre. */
import { SCENE, type SignalIconKind } from '../art';
import type { HealthSignal, Project } from '../data/types';
import { sortHealth } from './format';
import { projectOrigin, type Box, type Measure } from './layout';

export interface Pill {
  box: Box;
  icon: SignalIconKind | null;
  label: string;
  /** Plain-text meaning for the tooltip. */
  tip: string;
  signal: HealthSignal | null;
}

const EDGE: Record<string, number> = { 'hearth-lodge': 138, 'cartographers-workshop': 120, unknown: 90 };

export function signalPills(p: Project, font: number, measure: Measure): Pill[] {
  const items: Array<{ icon: SignalIconKind | null; label: string; tip: string; signal: HealthSignal | null }> = [];
  if (p.plot === 'no-folder') items.push({ icon: 'no-folder', label: 'No folder set', tip: 'Stake with an empty tag: no folder is set for this project in village.config.json.', signal: null });
  else if (p.plot === 'no-progress') items.push({ icon: 'no-progress', label: 'No progress file yet', tip: 'Pointing signpost: this project has no docs/progress.md yet.', signal: null });
  else if (p.health.length === 0) items.push({ icon: null, label: 'No signals', tip: 'No health signals: no recent log lines, nothing waiting, nothing failing.', signal: null });
  else for (const s of sortHealth(p.health)) items.push({ icon: s.kind, label: s.label, tip: s.detail, signal: s });

  const o = projectOrigin(p);
  const edge = (p.plot !== 'ok' ? EDGE.unknown : EDGE[p.building]) ?? 100;
  const icon = font + 2;
  const h = Math.max(icon, font) + 10;
  const widths = items.map((i) => Math.ceil(measure(i.label, font, true) + (i.icon ? icon + 6 : 0) + 16));
  const right = o.x >= SCENE.width / 2;
  let y = o.y - 80;
  return items.map((it, i) => {
    const w = widths[i] ?? 100;
    let x = right ? o.x + edge : o.x - edge - w;
    x = Math.max(4, Math.min(SCENE.width - w - 4, x));
    const box = { x, y, w, h };
    y += h + 6;
    return { box, ...it };
  });
}
