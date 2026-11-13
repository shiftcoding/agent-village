import { useEffect, useState } from 'react';
import type { Village } from '../data/types';
import { currentDayPart, msToNextMinute, sameDayPart, type SceneDayPart } from './daypart';

function search(): string {
  try {
    return window.location.search;
  } catch {
    return '';
  }
}

/**
 * The day part for the scene. Re-evaluated by a timer once a minute (aligned to the minute), never per render;
 * state only changes when the label changes. ?time=HH:MM pins it (no timer).
 */
export function useDayPart(village: Pick<Village, 'timezone' | 'location'>): SceneDayPart {
  const lat = village.location?.latitude;
  const lon = village.location?.longitude;
  const tz = village.timezone;
  const [dp, setDp] = useState<SceneDayPart>(() => currentDayPart(village, search(), Date.now()));
  useEffect(() => {
    const evaluate = (): SceneDayPart => currentDayPart({ timezone: tz, location: lat !== undefined && lon !== undefined ? { latitude: lat, longitude: lon } : undefined }, search(), Date.now());
    const update = (): SceneDayPart => {
      const next = evaluate();
      setDp((prev) => (sameDayPart(prev, next) ? prev : next));
      return next;
    };
    const first = update();
    if (first.pinned) return undefined;
    let timer: number | undefined;
    const loop = (): void => {
      timer = window.setTimeout(() => {
        update();
        loop();
      }, msToNextMinute(Date.now()));
    };
    loop();
    return () => window.clearTimeout(timer);
  }, [tz, lat, lon]);
  return dp;
}
