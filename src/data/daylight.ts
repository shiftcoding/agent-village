/**
 * Day parts from the sun, in the CONFIGURED timezone (Intl only, never the machine's zone).
 * Pure: the process TZ never matters because every wall-clock conversion goes through time.ts.
 *
 * Sunrise/sunset: NOAA solar calculator formulas (equation of time + declination, zenith 90.833 deg,
 * i.e. sun centre 50' below the horizon, which includes refraction and the solar disc). Accurate to
 * about a minute at Amsterdam's latitude.
 *
 * Windows (all relative to the day's sunrise / sunset):
 *   dawn  = sunrise - 45 min .. sunrise + 45 min
 *   day   = sunrise + 45 min .. sunset - 45 min
 *   dusk  = sunset - 45 min .. sunset + 45 min
 *   night = everything else
 * Polar edge cases: when the sun never rises (polar night) the whole day is `night`; when it never
 * sets (midnight sun) the whole day is `day`. Reported sunrise/sunset are then clamped (solar noon for
 * polar night, 00:00 and 23:59 for midnight sun). Out-of-range coordinates are clamped; never NaN.
 */
import type { GeoLocation } from './types';
import { localParts, wallToEpoch } from './time';

export type DayPartName = 'dawn' | 'day' | 'dusk' | 'night';

export interface DayPart {
  part: DayPartName;
  localTime: string;
  sunrise: string;
  sunset: string;
  /** e.g. "Night, 21:40 in Amsterdam" */
  label: string;
}

export const DEFAULT_LOCATION: GeoLocation = { latitude: 52.37, longitude: 4.9 };
export const TWILIGHT_MINUTES = 45;

const MIN = 60_000;
const rad = (d: number): number => (d * Math.PI) / 180;
const deg = (r: number): number => (r * 180) / Math.PI;
const pad2 = (n: number): string => String(n).padStart(2, '0');

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function normalizeLocation(loc: Partial<GeoLocation> | null | undefined): GeoLocation {
  const lat = Number(loc?.latitude);
  const lon = Number(loc?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return DEFAULT_LOCATION;
  return { latitude: clamp(lat, -89.9, 89.9), longitude: clamp(lon, -180, 180) };
}

/** Tolerant parse of a `location` value from JSON. undefined when absent or unusable. */
export function parseLocation(v: unknown): GeoLocation | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const o = v as Record<string, unknown>;
  const lat = o.latitude;
  const lon = o.longitude;
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return undefined;
  return { latitude: lat, longitude: lon };
}

function julianDay(utcMs: number): number {
  return utcMs / 86_400_000 + 2440587.5;
}

function sunParams(jd: number): { eqTime: number; decl: number } {
  const t = (jd - 2451545) / 36525;
  const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const mr = rad(m);
  const c =
    Math.sin(mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * mr) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * mr) * 0.000289;
  const trueLong = l0 + c;
  const omega = 125.04 - 1934.136 * t;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  const eps0 = 23 + (26 + seconds / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(omega));
  const y = Math.tan(rad(eps / 2)) ** 2;
  const l0r = rad(l0);
  const eqTime =
    4 *
    deg(y * Math.sin(2 * l0r) - 2 * e * Math.sin(mr) + 4 * e * y * Math.sin(mr) * Math.cos(2 * l0r) - 0.5 * y * y * Math.sin(4 * l0r) - 1.25 * e * e * Math.sin(2 * mr));
  const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
  return { eqTime, decl };
}

export interface SunTimes {
  /** Epoch ms. */
  sunrise: number;
  sunset: number;
  polar: 'day' | 'night' | null;
}

/** Sunrise/sunset for the calendar date (y, m, d) at a place. Instants, so any zone can format them. */
export function sunTimes(year: number, month: number, day: number, location?: GeoLocation | null): SunTimes {
  const { latitude, longitude } = normalizeLocation(location);
  const midnightUtc = Date.UTC(year, month - 1, day);
  const solve = (rising: boolean): { ms: number; polar: 'day' | 'night' | null } => {
    let minutes = 720 - 4 * longitude; // first guess: solar noon
    let polar: 'day' | 'night' | null = null;
    for (let pass = 0; pass < 2; pass++) {
      const { eqTime, decl } = sunParams(julianDay(midnightUtc + minutes * MIN));
      const latR = rad(latitude);
      const decR = rad(decl);
      const cosH = Math.cos(rad(90.833)) / (Math.cos(latR) * Math.cos(decR)) - Math.tan(latR) * Math.tan(decR);
      polar = cosH > 1 ? 'night' : cosH < -1 ? 'day' : null;
      const h = deg(Math.acos(clamp(Number.isFinite(cosH) ? cosH : 1, -1, 1)));
      const delta = rising ? h : -h;
      minutes = 720 - 4 * (longitude + delta) - eqTime;
    }
    return { ms: midnightUtc + minutes * MIN, polar };
  };
  const rise = solve(true);
  const set = solve(false);
  const polar = rise.polar ?? set.polar;
  return { sunrise: rise.ms, sunset: set.ms, polar };
}

function hhmm(epochMs: number, tz: string): string {
  const p = localParts(epochMs, tz);
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

function placeName(timeZone: string): string {
  const last = (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ');
  return last || 'local time';
}

export function dayPart(epochMs: number, timeZone: string, location?: GeoLocation | null): DayPart {
  const ms = Number.isFinite(epochMs) ? epochMs : 0;
  const tz = timeZone || 'Europe/Amsterdam';
  const p = localParts(ms, tz);
  const { sunrise, sunset, polar } = sunTimes(p.year, p.month, p.day, location);
  const w = TWILIGHT_MINUTES * MIN;
  let part: DayPartName;
  let riseTxt = hhmm(sunrise, tz);
  let setTxt = hhmm(sunset, tz);
  if (polar === 'night') {
    part = 'night';
    riseTxt = setTxt = hhmm((sunrise + sunset) / 2, tz);
  } else if (polar === 'day') {
    part = 'day';
    riseTxt = '00:00';
    setTxt = '23:59';
  } else if (ms >= sunrise - w && ms < sunrise + w) part = 'dawn';
  else if (ms >= sunrise + w && ms < sunset - w) part = 'day';
  else if (ms >= sunset - w && ms < sunset + w) part = 'dusk';
  else part = 'night';
  const localTime = `${pad2(p.hour)}:${pad2(p.minute)}`;
  const name = part.charAt(0).toUpperCase() + part.slice(1);
  return { part, localTime, sunrise: riseTxt, sunset: setTxt, label: `${name}, ${localTime} in ${placeName(tz)}` };
}

/** "?time=HH:MM" (or H:MM) to minutes since local midnight, or null when missing or invalid (24:00, 7:5, junk). */
export function parseTimeParam(search: string): number | null {
  try {
    const v = new URLSearchParams(typeof search === 'string' ? search : '').get('time');
    const m = v === null ? null : /^(\d{1,2}):(\d{2})$/.exec(v.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    return h <= 23 && min <= 59 ? h * 60 + min : null;
  } catch {
    return null;
  }
}

/**
 * Epoch ms for `minutes` since local midnight on the reference date in `timeZone`: the date of
 * `nowOverride` when given (?now), else of `wallClock`. null if minutes is not valid.
 */
export function timeParamToEpoch(
  minutes: number | null,
  timeZone: string,
  wallClock: number,
  nowOverride: number | null = null,
): number | null {
  if (minutes === null || !Number.isFinite(minutes) || minutes < 0 || minutes >= 1440) return null;
  const ref = nowOverride !== null && Number.isFinite(nowOverride) ? nowOverride : wallClock;
  const p = localParts(ref, timeZone);
  return wallToEpoch(p.year, p.month, p.day, Math.floor(minutes / 60), minutes % 60, timeZone);
}
