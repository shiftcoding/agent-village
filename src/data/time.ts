/**
 * Wall-time helpers using Intl only (no dependencies).
 * "YYYY-MM-DD HH:MM" is read as local time in an IANA timezone, DST-correct.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      });
    } catch {
      // Invalid timezone name: fall back to UTC rather than crash.
      f = getFormatter('UTC');
    }
    formatters.set(timeZone, f);
  }
  return f;
}

export interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Local wall-clock parts of an instant in a timezone. */
export function localParts(epochMs: number, timeZone: string): LocalParts {
  const out: Record<string, number> = {};
  for (const p of getFormatter(timeZone).formatToParts(new Date(epochMs))) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return {
    year: out.year ?? 1970,
    month: out.month ?? 1,
    day: out.day ?? 1,
    hour: (out.hour ?? 0) % 24,
    minute: out.minute ?? 0,
    second: out.second ?? 0,
  };
}

/** Offset (local minus UTC) in ms at an instant. */
function offsetAt(epochMs: number, timeZone: string): number {
  const t = Math.floor(epochMs / 1000) * 1000;
  const p = localParts(t, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - t;
}

/** Local wall time (as if UTC fields) to epoch ms, resolving DST. */
export function wallToEpoch(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number | null {
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(asUtc);
  if (check.getUTCMonth() !== month - 1) return null; // e.g. Feb 30
  const off1 = offsetAt(asUtc, timeZone);
  let t = asUtc - off1;
  const off2 = offsetAt(t, timeZone);
  if (off2 !== off1) t = asUtc - off2;
  return t;
}

const WALL_RE = /^\s*(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})\s*$/;

/** Parse "YYYY-MM-DD HH:MM" (also with "T") as wall time in timeZone. Null on garbage. */
export function parseWallTime(text: string | null | undefined, timeZone: string): number | null {
  if (typeof text !== 'string') return null;
  const m = WALL_RE.exec(text);
  if (!m) return null;
  return wallToEpoch(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), timeZone);
}

/** Monday 00:00 local (ISO week start) of the week containing the instant. */
export function isoWeekStart(epochMs: number, timeZone: string): number {
  const p = localParts(epochMs, timeZone);
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(); // 0 = Sunday
  const back = (dow + 6) % 7;
  const monday = new Date(Date.UTC(p.year, p.month - 1, p.day - back));
  return (
    wallToEpoch(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), 0, 0, timeZone) ??
    epochMs - back * 86_400_000
  );
}
