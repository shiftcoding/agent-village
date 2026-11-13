/**
 * Merges the installed agents (names read from ~/.claude/agents/*.md) with the spec metadata in roster.ts.
 * Browser-safe and pure. Phase 2 rules:
 *  - Installed agent in the spec table: spec def (class, look, role...) is used.
 *  - Installed agent NOT in the spec table: still appears, with a neutral default def:
 *    role = frontmatter description (first sentence, trimmed), class 'stranger', scope 'core'.
 *  - Spec agent that is not installed: dropped. A progress.md name matching it becomes a hooded stranger.
 *  - installed === null (agents folder missing/unreadable): fall back to the full spec roster plus a warning.
 *  - Model always comes from the installed file's frontmatter; a file with no `model:` line inherits the
 *    session model in Claude Code, so it shows 'Inherits' (never 'unknown').
 */
import type { AgentDef } from './types';
import { findAgentDef, ROSTER } from './roster';

export interface InstalledAgent {
  name: string;
  description?: string;
  model?: string;
}

export function resolveRoster(installed: readonly InstalledAgent[] | null | undefined): { roster: AgentDef[]; warnings: string[] } {
  if (!Array.isArray(installed)) {
    return {
      roster: [...ROSTER],
      warnings: ['Agents folder not found: showing the roster from the spec instead of installed agents.'],
    };
  }
  const roster: AgentDef[] = [];
  const seen = new Set<string>();
  for (const a of installed) {
    const name = typeof a?.name === 'string' ? a.name.trim() : '';
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const model = installedModel(a.model);
    const spec = findAgentDef(name);
    if (spec) {
      roster.push({ ...spec, model });
      continue;
    }
    const desc = typeof a.description === 'string' ? a.description.replace(/\s+/g, ' ').trim() : '';
    const first = desc.split(/(?<=[.!?])\s/)[0] ?? '';
    roster.push({
      name,
      role: (first.length > 160 ? `${first.slice(0, 157)}...` : first) || 'Installed agent (not in the village spec)',
      source: 'Installed',
      model,
      villageClass: 'stranger',
      look: 'Hooded cloak, unknown trade',
      worksAt: 'Tavern',
      scope: 'core',
    });
  }
  return { roster, warnings: [] };
}

/** 'sonnet' -> 'Sonnet'; missing or 'inherit' -> 'Inherits'. */
function installedModel(raw: unknown): string {
  const m = typeof raw === 'string' ? raw.trim() : '';
  if (!m || /^inherit/i.test(m)) return 'Inherits';
  return m.charAt(0).toUpperCase() + m.slice(1);
}
