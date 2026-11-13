import { describe, expect, it } from 'vitest';
import { nextTip } from './Tooltip';

describe('nextTip', () => {
  it('returns the same object for a repeated focus or hover (no re-render loop)', () => {
    const a = nextTip(null, 'x', 1, 2, false);
    expect(nextTip(a, 'x', 1, 2, false)).toBe(a);
    const h = nextTip(null, 'x', 1, 2, true);
    expect(nextTip(h, 'x', 50, 60, true)).toBe(h); // hover keeps its place so the pointer can reach the tip
  });
  it('marks focus-only tips so they can ignore the pointer, and hover tips replace them', () => {
    const f = nextTip(null, 'x', 1, 2, false);
    expect(f.src).toBe('focus');
    const h = nextTip(f, 'x', 1, 2, true);
    expect(h).not.toBe(f);
    expect(h.src).toBe('pointer');
    expect(nextTip(h, 'y', 1, 2, true).text).toBe('y');
  });
});
