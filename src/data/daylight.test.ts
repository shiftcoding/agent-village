import { describe, expect, it } from 'vitest';
import { dayPart, parseTimeParam, sunTimes, timeParamToEpoch } from './daylight';
import { parseWallTime } from './time';

const AMS = 'Europe/Amsterdam';
const at = (s: string): number => parseWallTime(s, AMS) as number;
const mins = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

describe('sunrise and sunset in Amsterdam', () => {
  it('13 Nov 2026 is about 07:59 / 16:49 CET', () => {
    const d = dayPart(at('2026-11-13 12:00'), AMS);
    expect(Math.abs(mins(d.sunrise) - mins('07:59'))).toBeLessThanOrEqual(10);
    expect(Math.abs(mins(d.sunset) - mins('16:49'))).toBeLessThanOrEqual(10);
  });
  it('21 Jun 2026 is about 05:18 / 22:06 CEST', () => {
    const d = dayPart(at('2026-06-21 12:00'), AMS);
    expect(Math.abs(mins(d.sunrise) - mins('05:18'))).toBeLessThanOrEqual(10);
    expect(Math.abs(mins(d.sunset) - mins('22:06'))).toBeLessThanOrEqual(10);
  });
  it('DST change days stay sensible (clocks jump, sun does not)', () => {
    const spring = dayPart(at('2026-03-29 12:00'), AMS); // 29 Mar 2026: CET -> CEST
    expect(Math.abs(mins(spring.sunrise) - mins('07:21'))).toBeLessThanOrEqual(12);
    expect(Math.abs(mins(spring.sunset) - mins('20:09'))).toBeLessThanOrEqual(12);
    const autumn = dayPart(at('2026-10-25 12:00'), AMS); // 25 Oct 2026: CEST -> CET
    expect(Math.abs(mins(autumn.sunrise) - mins('07:23'))).toBeLessThanOrEqual(12);
    expect(Math.abs(mins(autumn.sunset) - mins('17:25'))).toBeLessThanOrEqual(12);
  });
});

describe('day parts', () => {
  it('walks night, dawn, day, dusk, night on a November day', () => {
    const parts = ['2026-11-13 03:00', '2026-11-13 08:00', '2026-11-13 12:00', '2026-11-13 16:50', '2026-11-13 21:40'].map((t) => dayPart(at(t), AMS).part);
    expect(parts).toEqual(['night', 'dawn', 'day', 'dusk', 'night']);
  });
  it('label and localTime', () => {
    const d = dayPart(at('2026-11-13 21:40'), AMS);
    expect(d.label).toBe('Night, 21:40 in Amsterdam');
    expect(d.localTime).toBe('21:40');
  });
  it('window edges: dawn starts 45 minutes before sunrise', () => {
    const { sunrise } = sunTimes(2026, 11, 13);
    expect(dayPart(sunrise - 46 * 60_000, AMS).part).toBe('night');
    expect(dayPart(sunrise - 44 * 60_000, AMS).part).toBe('dawn');
    expect(dayPart(sunrise + 46 * 60_000, AMS).part).toBe('day');
  });
  it('does not depend on the process timezone', () => {
    const before = dayPart(at('2026-06-21 05:00'), AMS);
    const saved = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      expect(dayPart(at('2026-06-21 05:00'), AMS)).toEqual(before);
      expect(dayPart(at('2026-11-13 12:00'), 'America/Los_Angeles').localTime).toBe('03:00');
    } finally {
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    }
    expect(before.part).toBe('dawn'); // 05:00 CEST, sunrise ~05:18
  });
  it('polar edges are clamped, never NaN', () => {
    const arctic = { latitude: 78, longitude: 15 };
    const winter = dayPart(Date.UTC(2026, 11, 21, 12), 'Arctic/Longyearbyen', arctic);
    expect(winter.part).toBe('night');
    const summer = dayPart(Date.UTC(2026, 5, 21, 0), 'Arctic/Longyearbyen', arctic);
    expect(summer.part).toBe('day');
    expect(summer.sunrise).toBe('00:00');
    for (const d of [winter, summer, dayPart(NaN, AMS, { latitude: NaN, longitude: 4 })]) {
      expect(d.label).not.toMatch(/NaN/);
      expect(d.sunrise).toMatch(/^\d\d:\d\d$/);
    }
  });
  it('a custom location moves the sun', () => {
    const ams = dayPart(at('2026-11-13 12:00'), AMS);
    const east = dayPart(at('2026-11-13 12:00'), AMS, { latitude: 52.37, longitude: 14.9 });
    expect(mins(ams.sunrise) - mins(east.sunrise)).toBeGreaterThan(30);
  });
});

describe('?time parameter', () => {
  it('parses HH:MM and H:MM', () => {
    expect(parseTimeParam('?time=21:40')).toBe(21 * 60 + 40);
    expect(parseTimeParam('?time=7:05')).toBe(7 * 60 + 5);
    expect(parseTimeParam('?time=00:00')).toBe(0);
    expect(parseTimeParam('?x=1&time=23:59')).toBe(23 * 60 + 59);
    expect(parseTimeParam('?time=21%3A40')).toBe(21 * 60 + 40);
  });
  it('rejects 24:00, 7:5, junk and missing', () => {
    for (const s of ['?time=24:00', '?time=7:5', '?time=abc', '?time=', '', '?time=12:60', '?time=-1:00', '?time=1200', '?time=12:00:00']) {
      expect(parseTimeParam(s)).toBeNull();
    }
    expect(parseTimeParam(undefined as unknown as string)).toBeNull();
  });
  it('turns minutes into an instant on the ?now date, else today, in the zone', () => {
    const now = at('2026-11-20 10:00');
    expect(timeParamToEpoch(21 * 60 + 40, AMS, at('2026-11-13 12:00'), now)).toBe(at('2026-11-20 21:40'));
    expect(timeParamToEpoch(30, AMS, at('2026-11-13 12:00'))).toBe(at('2026-11-13 00:30'));
    expect(timeParamToEpoch(null, AMS, now)).toBeNull();
    expect(timeParamToEpoch(1440, AMS, now)).toBeNull();
  });
});
