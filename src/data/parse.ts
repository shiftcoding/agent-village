/**
 * Tolerant markdown parsers. Pure, never throw. Missing or malformed input
 * yields "unknown"/null/[] plus a human-readable warning.
 */
import type {
  Finding,
  LogEntry,
  Milestone,
  NeedsYouItem,
  ProgressFile,
  Stage,
  Task,
  TaskStatus,
  UserTestReport,
} from './types';
import { parseWallTime } from './time';

export const DEFAULT_TIMEZONE = 'Europe/Amsterdam';

const STAGES: readonly Stage[] = ['brief', 'research', 'product', 'design', 'architecture', 'building', 'testing', 'released'];
const STATUSES: readonly TaskStatus[] = ['todo', 'doing', 'blocked', 'review', 'done'];

function toText(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function lines(md: string): string[] {
  return md.replace(/^﻿/, '').split(/\r?\n/);
}

/** Remove markdown emphasis/backticks around a cell value. */
function clean(s: string): string {
  return s.replace(/[`*_]/g, '').trim();
}

const CHECKBOX = /^\s*[-*+]\s*\[([ xX])\]\s*(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const RAISED_BY = /\s*\(raised by\s+([^)]*?)\s*\)\s*$/i;
const HEADING2 = /^\s{0,3}(#{2,6})\s+(.*?)\s*#*\s*$/;

interface Section {
  title: string;
  lines: string[];
}

function splitSections(all: string[]): { preamble: string[]; sections: Section[] } {
  const preamble: string[] = [];
  const sections: Section[] = [];
  let cur: Section | null = null;
  for (const line of all) {
    const m = HEADING2.exec(line);
    if (m) {
      cur = { title: (m[2] ?? '').trim().toLowerCase(), lines: [] };
      sections.push(cur);
    } else if (cur) cur.lines.push(line);
    else preamble.push(line);
  }
  return { preamble, sections };
}

function findSections(sections: Section[], prefix: string): Section[] {
  return sections.filter((s) => s.title.startsWith(prefix));
}

export function emptyProgress(warning?: string): ProgressFile {
  return {
    name: null,
    stage: 'unknown',
    overall: null,
    overallSource: 'unknown',
    updated: null,
    updatedTime: null,
    needsYou: [],
    milestones: [],
    tasks: [],
    log: [],
    warnings: warning ? [warning] : [],
  };
}

function splitRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim());
}

function normalizeStatus(raw: string): TaskStatus {
  const s = clean(raw).toLowerCase();
  return (STATUSES as readonly string[]).includes(s) ? (s as TaskStatus) : 'unknown';
}

function parseTasks(sectionLines: string[], projectId: string, warnings: string[]): Task[] {
  const rows = sectionLines.filter((l) => l.trim().startsWith('|'));
  if (rows.length === 0) return [];
  const header = splitRow(rows[0] ?? '').map((h) => clean(h).toLowerCase());
  const col = (names: string[]): number => header.findIndex((h) => names.includes(h));
  let idCol = col(['id', '#']);
  let titleCol = col(['task', 'title', 'name']);
  let agentCol = col(['agent', 'owner', 'assignee']);
  let statusCol = col(['status', 'state']);
  let notesCol = col(['notes', 'note', 'comment', 'comments']);
  let body = rows.slice(1);
  if ([idCol, titleCol, agentCol, statusCol].every((i) => i < 0)) {
    warnings.push('Tasks table has no recognizable header; assumed columns ID | Task | Agent | Status | Notes.');
    idCol = 0;
    titleCol = 1;
    agentCol = 2;
    statusCol = 3;
    notesCol = 4;
    body = rows; // first row was data
  }
  const tasks: Task[] = [];
  body.forEach((line, i) => {
    if (/^[\s|:\-]+$/.test(line)) return; // separator row
    const cells = splitRow(line);
    const get = (c: number): string => (c >= 0 ? cells[c] ?? '' : '');
    const id = clean(get(idCol));
    const rawStatus = clean(get(statusCol));
    const status = normalizeStatus(rawStatus);
    let agent = clean(get(agentCol));
    if (/^[-–—?]*$/.test(agent)) agent = '';
    if (!id && !clean(get(titleCol))) return; // empty row
    if (status === 'unknown') {
      warnings.push(
        rawStatus ? `Task ${id || `row ${i + 1}`} has unknown status "${rawStatus}".` : `Task ${id || `row ${i + 1}`} has no status.`,
      );
    }
    tasks.push({
      projectId,
      id: id || `row-${i + 1}`,
      title: get(titleCol),
      agent,
      status,
      rawStatus,
      notes: get(notesCol),
    });
  });
  return tasks;
}

const LOG_RE = /^\s*[-*+]\s+(?:(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})\s+)?(?:([a-z][a-z0-9-]*):\s+)?(.*)$/;

function parseLog(sectionLines: string[], projectId: string, tz: string, warnings: string[]): LogEntry[] {
  const out: LogEntry[] = [];
  for (const line of sectionLines) {
    if (!BULLET.test(line)) continue;
    const m = LOG_RE.exec(line);
    if (!m) continue;
    const timestamp = m[1] && m[2] ? `${m[1]} ${m[2]}` : null;
    const time = parseWallTime(timestamp, tz);
    const text = (m[4] ?? '').trim();
    if (!text) continue;
    if (timestamp && time === null) warnings.push(`Log line has an invalid time "${timestamp}".`);
    out.push({ projectId, timestamp: time === null ? null : timestamp, time, agent: m[3] ?? null, text });
  }
  return out;
}

export function parseProgress(markdown: string | null | undefined, projectId: string, timezone: string = DEFAULT_TIMEZONE): ProgressFile {
  try {
    const text = toText(markdown);
    if (!text.trim()) return emptyProgress('Progress file is empty or missing.');
    const all = lines(text);
    const { preamble, sections } = splitSections(all);
    const warnings: string[] = [];
    const pf = emptyProgress();

    // Title and key lines (preamble, falling back to anywhere in the file).
    const head = preamble.length ? preamble : all;
    const titleLine = all.find((l) => /^\s{0,3}#\s+/.test(l));
    const nameMatch = titleLine ? /^\s{0,3}#\s+(?:Progress\s*:\s*)?(.*)$/i.exec(titleLine) : null;
    pf.name = nameMatch && nameMatch[1]?.trim() ? nameMatch[1].trim() : null;
    if (!pf.name) warnings.push('No "# Progress: <name>" title found.');

    const keyed = (key: string): string | null => {
      const re = new RegExp(`^\\s*(?:[-*]\\s*)?\\**${key}\\**\\s*:\\s*(.*)$`, 'i');
      for (const l of head) {
        const m = re.exec(l);
        if (m) return clean(m[1] ?? '');
      }
      return null;
    };

    const stageRaw = keyed('Stage');
    if (stageRaw === null) warnings.push('No "Stage:" line.');
    else {
      const s = stageRaw.toLowerCase();
      if ((STAGES as readonly string[]).includes(s)) pf.stage = s as Stage;
      else warnings.push(`Unknown stage "${stageRaw}".`);
    }

    const updated = keyed('Updated');
    if (updated === null) warnings.push('No "Updated:" line.');
    else {
      const t = parseWallTime(updated, timezone);
      if (t === null) warnings.push(`Could not read the Updated time "${updated}".`);
      else {
        pf.updated = updated;
        pf.updatedTime = t;
      }
    }

    // Needs you
    let idx = 0;
    for (const sec of findSections(sections, 'needs you')) {
      for (const l of sec.lines) {
        const m = CHECKBOX.exec(l);
        if (!m) continue;
        const myIndex = idx++;
        if ((m[1] ?? ' ') !== ' ') continue; // checked = resolved
        let body = (m[2] ?? '').trim();
        let raisedBy: string | null = null;
        const r = RAISED_BY.exec(body);
        if (r) {
          raisedBy = clean(r[1] ?? '') || null;
          body = body.slice(0, r.index).trim();
        }
        if (!body) continue;
        const item: NeedsYouItem = { projectId, text: body, raisedBy, index: myIndex };
        pf.needsYou.push(item);
      }
    }
    if (findSections(sections, 'needs you').length === 0) warnings.push('No "## Needs you" section.');

    // Milestones
    for (const sec of findSections(sections, 'milestones')) {
      for (const l of sec.lines) {
        const m = CHECKBOX.exec(l);
        if (!m) continue;
        const ms: Milestone = { text: (m[2] ?? '').trim(), done: (m[1] ?? ' ') !== ' ' };
        if (ms.text) pf.milestones.push(ms);
      }
    }

    // Tasks
    const taskSecs = findSections(sections, 'tasks');
    if (taskSecs.length === 0) warnings.push('No "## Tasks" section.');
    for (const sec of taskSecs) pf.tasks.push(...parseTasks(sec.lines, projectId, warnings));

    // Log
    const logSecs = findSections(sections, 'log');
    if (logSecs.length === 0) warnings.push('No "## Log" section.');
    for (const sec of logSecs) pf.log.push(...parseLog(sec.lines, projectId, timezone, warnings));

    // Overall
    const overallRaw = keyed('Overall');
    const num = overallRaw === null ? null : /^(\d+(?:\.\d+)?)\s*%?$/.exec(overallRaw);
    const n = num ? Number(num[1]) : NaN;
    if (num && n >= 0 && n <= 100) {
      pf.overall = Math.round(n);
      pf.overallSource = 'file';
    } else {
      warnings.push(overallRaw === null ? 'No "Overall:" line.' : `Overall "${overallRaw}" is not a number from 0 to 100.`);
      if (pf.tasks.length > 0) {
        pf.overall = Math.round((pf.tasks.filter((t) => t.status === 'done').length / pf.tasks.length) * 100);
        pf.overallSource = 'computed';
        warnings.push('Overall computed as the share of tasks marked done.');
      }
    }

    pf.warnings = warnings;
    return pf;
  } catch (e) {
    return emptyProgress(`Progress file could not be read (${e instanceof Error ? e.message : 'unknown error'}).`);
  }
}

const DATE_IN_NAME = /(\d{4}-\d{2}-\d{2})/;
const NONE_RE = /^(none|n\/a|na|nothing|no blockers?|none found|no issues?|-|—|–)[\s.!]*$/i;

function listItems(sectionLines: string[]): string[] {
  const out: string[] = [];
  for (const l of sectionLines) {
    const cb = CHECKBOX.exec(l);
    const b = cb ? null : BULLET.exec(l);
    const t = clean(cb ? cb[2] ?? '' : b ? b[1] ?? '' : '');
    if (t) out.push(t);
  }
  return out;
}

export function parseUserTest(markdown: string | null | undefined, file: string, projectId: string): UserTestReport {
  const report: UserTestReport = { projectId, file: toText(file), date: null, personas: [], blockers: [] };
  try {
    const text = toText(markdown);
    const all = lines(text);
    const { sections } = splitSections(all);
    for (const l of all) {
      const m = /^\s*(?:[-*]\s*)?\**Date\**\s*:\s*\**\s*(\d{4}-\d{2}-\d{2})/i.exec(l);
      if (m) {
        report.date = m[1] ?? null;
        break;
      }
    }
    if (!report.date) report.date = DATE_IN_NAME.exec(report.file)?.[1] ?? null;
    for (const sec of findSections(sections, 'persona')) {
      for (const item of listItems(sec.lines)) {
        const name = item.split(/\s+[-–—]\s+|:/)[0]?.trim() ?? '';
        if (name) report.personas.push(name);
      }
    }
    for (const sec of findSections(sections, 'blocker')) {
      for (const item of listItems(sec.lines)) {
        if (!NONE_RE.test(item)) report.blockers.push(item);
      }
    }
  } catch {
    /* keep the empty report */
  }
  return report;
}

const FINDING_TASK = /^([A-Za-z]{1,4}-?\d+)\s*:\s*(.*)$/;

export function parseFindings(markdown: string | null | undefined, file: string, projectId: string): Finding[] {
  const out: Finding[] = [];
  try {
    for (const l of lines(toText(markdown))) {
      const m = CHECKBOX.exec(l);
      if (!m) continue;
      let body = (m[2] ?? '').trim();
      let raisedBy: string | null = null;
      const r = RAISED_BY.exec(body);
      if (r) {
        raisedBy = clean(r[1] ?? '') || null;
        body = body.slice(0, r.index).trim();
      }
      let taskId: string | null = null;
      const t = FINDING_TASK.exec(body);
      if (t) {
        taskId = (t[1] ?? '').toUpperCase();
        body = (t[2] ?? '').trim();
      }
      if (!body) continue;
      out.push({ projectId, taskId, text: body, raisedBy, open: (m[1] ?? ' ') === ' ', file: toText(file) });
    }
  } catch {
    /* return what we have */
  }
  return out;
}

const PERSONA_CAP = 12;

/**
 * Persona names from docs/research.md for the user-simulator troupe. Tolerant:
 * under any heading containing "persona", list items ("- Maya: ...", "- **Maya** - ...")
 * and deeper sub-headings ("### Maya, the first-timer") each give one name.
 * Returns [] when nothing is found (callers fall back to DEFAULT_PERSONAS).
 */
export function parsePersonas(markdown: string | null | undefined): string[] {
  const out: string[] = [];
  try {
    let level = 0; // heading level of the active persona section, 0 = none
    for (const l of lines(toText(markdown))) {
      const h = HEADING2.exec(l) ?? /^\s{0,3}(#)\s+(.*?)\s*#*\s*$/.exec(l);
      if (h) {
        const lv = (h[1] ?? '').length;
        const title = clean(h[2] ?? '');
        if (level > 0 && lv > level) {
          pushPersona(out, title.split(/\s+[-–—]\s+|:|,/)[0] ?? '');
        } else {
          level = /persona/i.test(title) ? lv : 0;
        }
        continue;
      }
      if (level === 0) continue;
      const cb = CHECKBOX.exec(l);
      const b = cb ? null : BULLET.exec(l);
      const item = clean(cb ? (cb[2] ?? '') : b ? (b[1] ?? '') : '');
      if (item) pushPersona(out, item.split(/\s+[-–—]\s+|:|,/)[0] ?? '');
    }
  } catch {
    /* return what we have */
  }
  return out.slice(0, PERSONA_CAP);
}

function pushPersona(out: string[], raw: string): void {
  const name = raw.trim().replace(/^persona\s*\d*\s*[:.-]?\s*/i, '').trim();
  if (name && name.length <= 60 && !out.includes(name)) out.push(name);
}
