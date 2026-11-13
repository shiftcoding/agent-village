import { describe, expect, it } from 'vitest';
import { isoWeekStart, parseWallTime } from './time';

const AMS = 'Europe/Amsterdam';

describe('parseWallTime', () => {
  it('reads winter time as UTC+1', () => {
    expect(parseWallTime('2026-11-20 16:40', AMS)).toBe(Date.UTC(2026, 10, 20, 15, 40));
  });
  it('reads summer time as UTC+2', () => {
    expect(parseWallTime('2026-07-01 12:00', AMS)).toBe(Date.UTC(2026, 6, 1, 10, 0));
  });
  it('is DST-correct around the changes', () => {
    // 2026-03-29 02:00 -> 03:00 (spring forward); 2026-10-25 03:00 -> 02:00 (fall back)
    expect(parseWallTime('2026-03-29 01:30', AMS)).toBe(Date.UTC(2026, 2, 29, 0, 30));
    expect(parseWallTime('2026-03-29 03:30', AMS)).toBe(Date.UTC(2026, 2, 29, 1, 30));
    expect(parseWallTime('2026-10-25 01:30', AMS)).toBe(Date.UTC(2026, 9, 24, 23, 30));
    expect(parseWallTime('2026-10-25 03:30', AMS)).toBe(Date.UTC(2026, 9, 25, 2, 30));
  });
  it('returns null on garbage', () => {
    for (const g of ['', 'nope', '2026-13-01 10:00', '2026-02-30 10:00', '2026-11-20 25:00', null, undefined]) {
      expect(parseWallTime(g as string, AMS)).toBeNull();
    }
  });
  it('does not throw on an invalid timezone', () => {
    expect(parseWallTime('2026-11-20 16:40', 'Not/AZone')).toBe(Date.UTC(2026, 10, 20, 16, 40));
  });
});

describe('isoWeekStart', () => {
  it('is Monday 00:00 local', () => {
    const fri = parseWallTime('2026-11-20 16:40', AMS) ?? 0;
    expect(isoWeekStart(fri, AMS)).toBe(parseWallTime('2026-11-16 00:00', AMS));
  });
  it('treats Sunday as the end of the week', () => {
    const sun = parseWallTime('2026-11-22 23:59', AMS) ?? 0;
    expect(isoWeekStart(sun, AMS)).toBe(parseWallTime('2026-11-16 00:00', AMS));
  });
  it('handles a week that contains a DST change', () => {
    const t = parseWallTime('2026-03-31 10:00', AMS) ?? 0;
    expect(isoWeekStart(t, AMS)).toBe(parseWallTime('2026-03-30 00:00', AMS));
    const u = parseWallTime('2026-03-29 12:00', AMS) ?? 0; // Sunday
    expect(isoWeekStart(u, AMS)).toBe(parseWallTime('2026-03-23 00:00', AMS));
  });
});
