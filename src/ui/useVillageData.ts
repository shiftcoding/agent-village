import { useEffect, useState } from 'react';
import { loadVillage, parseNowParam } from '../data/loader';
import { fixturesState, nextDataState, type DataEnv, type DataState, type FetchResult } from './dataSource';

/** Poll interval. Watch mode rewrites the file at least every 60 s, so 2.5 s feels live and costs nothing. */
export const POLL_MS = 2500;

function search(): string {
  try {
    return window.location.search;
  } catch {
    return '';
  }
}

export const browserEnv: DataEnv = {
  nowFor: (tz) => parseNowParam(search(), tz),
  fixtures: () => {
    const first = loadVillage();
    const now = parseNowParam(search(), first.timezone);
    return now === null ? first : loadVillage({ nowOverride: now });
  },
};

export function forcedFixtures(): boolean {
  try {
    return new URLSearchParams(search()).get('data') === 'fixtures';
  } catch {
    return false;
  }
}

async function fetchVillageFile(signal: AbortSignal): Promise<FetchResult> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}village.json`, { cache: 'no-store', signal });
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error', message: `the server answered ${res.status}` };
    return { kind: 'ok', text: await res.text() };
  } catch (e) {
    if (signal.aborted) return { kind: 'error', message: 'cancelled' };
    return { kind: 'error', message: e instanceof Error && e.message ? e.message : 'network error' };
  }
}

/**
 * Data for the app. null until the first read finishes. State only changes when the file content changed
 * (nextDataState returns the same object otherwise). Polling pauses while the tab is hidden.
 * The effect depends on nothing, so it runs once; it never sets state on a render.
 */
export function useVillageData(): DataState | null {
  const [state, setState] = useState<DataState | null>(null);

  useEffect(() => {
    if (forcedFixtures()) {
      setState((prev) => prev ?? fixturesState(browserEnv, null));
      return undefined;
    }
    let stopped = false;
    let timer: number | undefined;
    let controller: AbortController | null = null;
    let inFlight = false;

    const tick = async (): Promise<void> => {
      window.clearTimeout(timer);
      if (stopped) return;
      if (inFlight) return;
      if (!document.hidden) {
        inFlight = true;
        controller = new AbortController();
        const result = await fetchVillageFile(controller.signal);
        inFlight = false;
        if (stopped) return;
        setState((prev) => nextDataState(prev, result, browserEnv));
      }
      timer = window.setTimeout(() => void tick(), POLL_MS);
    };
    const onVisible = (): void => {
      if (!document.hidden) void tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    void tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return state;
}
