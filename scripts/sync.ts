/**
 * npm run sync            one-shot: write public/village.json, print one line, exit 0
 *                         (exit 1 only if the config is missing/unparseable or the file cannot be written)
 * npm run sync -- --watch keep public/village.json updated until Ctrl+C
 *
 * Writes ONLY public/village.json in this repo. Never writes into a project folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSyncer, clock, configTarget } from './syncCore';
import { startWatching, type WatchTarget } from './watchCore';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(repoRoot, 'village.config.json');
const outPath = path.join(repoRoot, 'public', 'village.json');
const watchMode = process.argv.slice(2).includes('--watch');

const syncer = createSyncer({ repoRoot, configPath, outPath, log: (l) => console.log(l) });

if (!watchMode) {
  const r = syncer.run(null, false);
  if (!r.ok) {
    console.error(`sync failed: ${r.error}`);
    process.exit(1);
  }
  process.exit(0);
}

const warn = (m: string): void => console.warn(`[${clock(Date.now())}] village.json: ${m}`);
let first = true;
let lastTargets: WatchTarget[] = [configTarget(configPath)];

const watching = startWatching({
  rebuild(reason) {
    const r = syncer.run(first ? 'start' : reason, true);
    first = false;
    if (!r.ok) {
      warn(`${r.error}; waiting for a fix`);
      return lastTargets;
    }
    lastTargets = r.targets;
    return r.targets;
  },
  identify(p) {
    try {
      const st = fs.statSync(p);
      return st.isDirectory() ? `${st.dev}:${st.ino}` : null;
    } catch {
      return null;
    }
  },
  watch(p, onEvent, onError) {
    try {
      if (!fs.statSync(p).isDirectory()) return null;
      const w = fs.watch(p, { persistent: true }, (_ev, filename) => onEvent(filename ? String(filename) : null));
      w.on('error', () => {
        w.close();
        onError();
      });
      return w;
    } catch {
      return null;
    }
  },
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as NodeJS.Timeout),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (h) => clearInterval(h as NodeJS.Timeout),
  warn,
});

const stop = (): void => {
  watching.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
