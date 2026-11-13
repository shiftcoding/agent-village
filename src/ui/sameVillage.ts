import type { Village } from '../data/types';

/** Same village for drawing purposes: identical, or equal except for `generatedAt` (watch-mode rewrites). Cheap: runs only when the object changed. */
export function sameVillage(a: Village, b: Village): boolean {
  if (a === b) return true;
  try {
    return JSON.stringify({ ...a, generatedAt: '' }) === JSON.stringify({ ...b, generatedAt: '' });
  } catch {
    return false;
  }
}
