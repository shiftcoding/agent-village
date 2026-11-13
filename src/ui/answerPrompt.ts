/**
 * "Answer in Claude" prompt text (T32). Pure: no React, no DOM, never throws. The village only copies this
 * text to the clipboard; it never sends or runs anything. Formats are documented in docs/architecture.md.
 */
import type { Agent, NeedsYouItem, Project, Task } from '../data/types';

/** The slice of a project the prompts need. */
export type PromptProject = Pick<Project, 'id' | 'name'> & Partial<Pick<Project, 'path' | 'isFixture'>>;

const MAX_TEXT = 500;
const MAX_NAME = 80;
const MAX_PATH = 300;
const MAX_TASKS = 12;

/** One line of plain text: any whitespace run (newlines, tabs) becomes one space; long text is cut with an ellipsis. */
export function oneLine(value: unknown, max = MAX_TEXT): string {
  let s: string;
  try {
    s = typeof value === 'string' ? value : value == null ? '' : String(value);
  } catch {
    s = '';
  }
  s = s.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  const chars = Array.from(s);
  return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : s;
}

/** "/path", or "not set (sample data)" for fixture projects, or "not set". */
export function folderText(p: PromptProject | undefined): string {
  const path = oneLine(p?.path, MAX_PATH);
  if (path) return path;
  return p?.isFixture ? 'not set (sample data)' : 'not set';
}

function nameOf(projects: readonly PromptProject[], id: string, fallback?: string): PromptProject {
  return projects.find((p) => p.id === id) ?? { id, name: fallback || id, path: null, isFixture: false };
}

/**
 * Template:
 *   Answer for <project> (raised by <agent>): <item text>
 *   Project folder: <path | not set | not set (sample data)>
 *   My decision: 
 */
export function needsYouPrompt(item: Pick<NeedsYouItem, 'projectId' | 'text' | 'raisedBy'> & { projectName?: string }, projects: readonly PromptProject[]): string {
  try {
    const p = nameOf(projects, item.projectId, item.projectName);
    const by = oneLine(item.raisedBy, MAX_NAME);
    const who = by ? `raised by ${by}` : 'raised by an unknown agent';
    const text = oneLine(item.text) || '(no text)';
    return [`Answer for ${oneLine(p.name, MAX_NAME) || 'unknown project'} (${who}): ${text}`, `Project folder: ${folderText(p)}`, 'My decision: '].join('\n');
  } catch {
    return 'My decision: ';
  }
}

/** Short accessible-name suffix for a needs-you item. */
export function needsYouLabel(item: Pick<NeedsYouItem, 'text'>): string {
  return oneLine(item.text, 60) || 'this item';
}

function taskLine(t: Task): string {
  const title = oneLine(t.title, 160) || '(untitled)';
  return `- ${oneLine(t.id, 20) || '?'}: ${title} (${oneLine(t.status, 20) || 'unknown'})`;
}

/**
 * Template:
 *   Message for agent <name>.
 *   Project: <name>            (one block per project with open tasks)
 *   Folder: <path | not set | not set (sample data)>
 *   Tasks:
 *   - <id>: <title> (<status>)
 *   ...and N more tasks         (only past 12 tasks)
 *   My message: 
 * An agent without tasks gets "Open tasks: none" instead of the project blocks.
 */
export function agentPrompt(agent: Pick<Agent, 'name' | 'tasks'>, projects: readonly PromptProject[]): string {
  try {
    const lines: string[] = [`Message for agent ${oneLine(agent.name, MAX_NAME) || 'unknown'}.`];
    const tasks = Array.isArray(agent.tasks) ? agent.tasks : [];
    if (tasks.length === 0) {
      lines.push('Open tasks: none');
    } else {
      const shown = tasks.slice(0, MAX_TASKS);
      const order: string[] = [];
      const by = new Map<string, Task[]>();
      for (const t of shown) {
        if (!by.has(t.projectId)) order.push(t.projectId);
        const list = by.get(t.projectId);
        if (list) list.push(t);
        else by.set(t.projectId, [t]);
      }
      for (const id of order) {
        const p = nameOf(projects, id);
        lines.push(`Project: ${oneLine(p.name, MAX_NAME) || 'unknown project'}`, `Folder: ${folderText(p)}`, 'Tasks:');
        for (const t of by.get(id) ?? []) lines.push(taskLine(t));
      }
      if (tasks.length > shown.length) lines.push(`...and ${tasks.length - shown.length} more tasks`);
    }
    lines.push('My message: ');
    return lines.join('\n');
  } catch {
    return 'My message: ';
  }
}

/** Stable React keys for needs-you items: project id + text, plus an occurrence counter for duplicates (not the file position, which shifts when an earlier item is resolved). */
export function needsYouKeys(items: ReadonlyArray<Pick<NeedsYouItem, 'projectId' | 'text'>>): string[] {
  const seen = new Map<string, number>();
  return items.map((n) => {
    const base = `${n.projectId}:${n.text}`;
    const k = seen.get(base) ?? 0;
    seen.set(base, k + 1);
    return k ? `${base}#${k}` : base;
  });
}
