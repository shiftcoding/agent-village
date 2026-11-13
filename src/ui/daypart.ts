/** Time of day for the scene: pure computation, plus the ms until the next minute (re-evaluated by a timer, not per render). */
import { dayPart, parseTimeParam, timeParamToEpoch, type DayPart } from '../data/daylight';
import { parseNowParam } from '../data/loader';
import type { Village } from '../data/types';

export interface SceneDayPart extends DayPart {
  /** True when ?time=HH:MM pins the time of day (a preview): no timer needed. */
  pinned: boolean;
}

export function currentDayPart(village: Pick<Village, 'timezone' | 'location'>, search: string, wallClock: number): SceneDayPart {
  const tz = village.timezone || 'Europe/Amsterdam';
  const mins = parseTimeParam(search);
  const pinnedAt = timeParamToEpoch(mins, tz, wallClock, parseNowParam(search, tz));
  return { ...dayPart(pinnedAt ?? wallClock, tz, village.location), pinned: pinnedAt !== null };
}

export function msToNextMinute(wallClock: number): number {
  return 60_000 - (wallClock % 60_000) + 50;
}

export function sameDayPart(a: SceneDayPart, b: SceneDayPart): boolean {
  return a.part === b.part && a.label === b.label && a.pinned === b.pinned;
}
