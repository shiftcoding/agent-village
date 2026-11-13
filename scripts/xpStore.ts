/**
 * XP ledger file IO. Writes ONLY the ledger path (default `<repo>/.village-state/xp-ledger.json`,
 * gitignored, never in public/, dist/ or a project folder). Never throws: XP problems must not stop sync.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Task } from '../src/data/types';
import { parseLedger, summarizeLedger, updateLedger, type XpLedger, type XpSummary } from '../src/data/xpLedger';
import { writeFileAtomic } from './write';

export const LEDGER_DIR = '.village-state';
export const LEDGER_FILE = 'xp-ledger.json';

export function defaultLedgerPath(repoRoot: string): string {
  return path.join(repoRoot, LEDGER_DIR, LEDGER_FILE);
}

export function readLedger(file: string, nowMs: number, warnings: string[]): XpLedger | null {
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
    return quarantine(file, nowMs, warnings, 'could not be read');
  }
  try {
    const parsed = parseLedger(JSON.parse(text.replace(/^﻿/, '')));
    if (parsed) {
      if (parsed.ignored > 0) warnings.push(`XP ledger: ignored ${parsed.ignored} unreadable XP ${parsed.ignored === 1 ? 'entry' : 'entries'}.`);
      return parsed.ledger;
    }
  } catch {
    /* fall through */
  }
  return quarantine(file, nowMs, warnings, 'was malformed');
}

function quarantine(file: string, nowMs: number, warnings: string[], why: string): null {
  const backup = `${file}.bak-${nowMs.toString(36)}`;
  try {
    fs.renameSync(file, backup);
    warnings.push(`XP ledger ${why}; kept a copy as ${path.basename(backup)} and started a new ledger.`);
  } catch {
    warnings.push(`XP ledger ${why}; XP restarts from the current done tasks.`);
  }
  return null;
}

/** Read the ledger, record newly-done tasks, write only if it changed, and return the XP summary. */
export function updateXp(
  ledgerPath: string,
  tasks: readonly Task[],
  nowMs: number,
  warnings: string[],
  fixtureProjectIds: ReadonlySet<string> = new Set(),
): XpSummary {
  const prev = readLedger(ledgerPath, nowMs, warnings);
  const { ledger, changed } = updateLedger(prev, tasks, new Date(nowMs).toISOString(), fixtureProjectIds);
  if (changed) {
    try {
      writeFileAtomic(ledgerPath, `${JSON.stringify(ledger, null, 1)}\n`);
    } catch {
      warnings.push('XP ledger could not be saved; XP is shown for this run only.');
    }
  }
  return summarizeLedger(ledger);
}
