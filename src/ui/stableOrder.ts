/**
 * Keep an existing order and only append new keys (in `desired` order); drop keys that are gone.
 * The scene renders characters in this order so React never moves a DOM node (a moved node loses keyboard
 * focus). Pure and idempotent: the same inputs give the same result.
 */
export function stableOrder(prev: readonly string[], desired: readonly string[]): string[] {
  const want = new Set(desired);
  const kept = prev.filter((k) => want.has(k));
  const have = new Set(kept);
  return [...kept, ...desired.filter((k) => !have.has(k))];
}
