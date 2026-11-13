import { estimateMeasure, type Measure } from './layout';

export const UI_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

let ctx: CanvasRenderingContext2D | null | undefined;
const cache = new Map<string, number>();

/** Text width in px for UI_FONT via a canvas, with a rough estimate as fallback. Cached. */
export const measureText: Measure = (text, px, bold) => {
  const key = `${bold ? 'b' : 'n'}${px}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let w: number;
  try {
    if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.font = `${bold ? 700 : 400} ${px}px ${UI_FONT}`;
    w = ctx.measureText(text).width;
    if (!Number.isFinite(w) || w <= 0) w = estimateMeasure(text, px, bold);
  } catch {
    w = estimateMeasure(text, px, bold);
  }
  cache.set(key, w);
  return w;
};
