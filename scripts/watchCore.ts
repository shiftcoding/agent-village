/**
 * Watch orchestration: debounce, periodic refresh, re-resolving watch targets after every rebuild.
 * All side effects are injected so it can be tested with fake timers and a fake fs.
 */
export interface WatchTarget {
  path: string;
  /** Does an event with this file name (null = unknown) matter for this target? */
  accept(filename: string | null): boolean;
  label: string;
}

export interface Closable {
  close(): void;
}

export interface WatchDeps {
  /** Rebuild, write and log one line. Returns the watch targets for the next round. May throw. */
  rebuild(reason: string): WatchTarget[];
  /** Start watching a folder; null when it cannot be watched (missing). onError means the watcher died. */
  watch(path: string, onEvent: (filename: string | null) => void, onError: () => void): Closable | null;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(h: unknown): void;
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(h: unknown): void;
  warn(message: string): void;
  /** Identity of a folder (e.g. dev:ino), or null if gone. Lets sync() notice a deleted and recreated folder. */
  identify?(path: string): string | null;
  debounceMs?: number;
  refreshMs?: number;
}

export interface Watching {
  stop(): void;
}

const MAX_ERRORS = 3;

interface Handle {
  h: Closable;
  /** Identity of the folder when the watcher was opened (inode); a change means it was recreated. */
  token: string | null;
}

export function startWatching(deps: WatchDeps): Watching {
  const debounceMs = deps.debounceMs ?? 300;
  const refreshMs = deps.refreshMs ?? 60_000;
  const handles = new Map<string, Handle>();
  const current = new Map<string, WatchTarget>();
  const errors = new Map<string, number>();
  /** Targets whose watcher keeps failing: not reopened until the next periodic refresh. */
  const dropped = new Set<string>();
  let debounce: unknown = null;
  let reason = '';
  let stopped = false;
  const identify = (p: string): string | null => (deps.identify ? deps.identify(p) : 'n/a');

  const closeHandle = (p: string): void => {
    const cur = handles.get(p);
    if (cur) safeClose(cur.h);
    handles.delete(p);
  };

  const sync = (targets: WatchTarget[]): void => {
    current.clear();
    for (const t of targets) current.set(t.path, t);
    for (const p of [...handles.keys()]) {
      if (!current.has(p) || identify(p) !== handles.get(p)?.token) closeHandle(p);
    }
    for (const t of current.values()) {
      if (handles.has(t.path) || dropped.has(t.path)) continue;
      const token = identify(t.path);
      let h: Closable | null = null;
      try {
        h = deps.watch(
          t.path,
          (filename) => {
            const live = current.get(t.path);
            if (stopped || !live || !live.accept(filename)) return;
            schedule(`${live.label}${filename ? ` ${filename}` : ''} changed`);
          },
          () => {
            closeHandle(t.path);
            const n = (errors.get(t.path) ?? 0) + 1;
            errors.set(t.path, n);
            if (n >= MAX_ERRORS) {
              dropped.add(t.path);
              deps.warn(`watcher for ${t.path} keeps failing; retrying on the next periodic refresh`);
              return;
            }
            schedule(`${t.label} watcher restarted`);
          },
        );
      } catch {
        h = null;
      }
      if (h) handles.set(t.path, { h, token });
    }
  };

  const run = (why: string): void => {
    if (stopped) return;
    if (why === 'periodic refresh') {
      dropped.clear();
      errors.clear();
    }
    try {
      sync(deps.rebuild(why));
    } catch (e) {
      deps.warn(`rebuild failed (${e instanceof Error ? e.message : 'unknown error'}); keeping the last village.json`);
    }
  };

  function schedule(why: string): void {
    if (stopped) return;
    reason = reason ? reason : why;
    if (debounce !== null) deps.clearTimeout(debounce);
    debounce = deps.setTimeout(() => {
      debounce = null;
      const r = reason;
      reason = '';
      run(r);
    }, debounceMs);
  }

  run('start');
  const tick = deps.setInterval(() => run('periodic refresh'), refreshMs);

  return {
    stop(): void {
      stopped = true;
      if (debounce !== null) deps.clearTimeout(debounce);
      deps.clearInterval(tick);
      for (const p of [...handles.keys()]) closeHandle(p);
    },
  };
}

function safeClose(h: Closable): void {
  try {
    h.close();
  } catch {
    /* ignore */
  }
}
