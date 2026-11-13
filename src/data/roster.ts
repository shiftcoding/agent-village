import type { AgentDef } from './types';

type Row = [name: string, role: string, source: string, model: string, villageClass: AgentDef['villageClass'], look: string, worksAt: string, scope: AgentDef['scope']];

const rows: Row[] = [
  ['orchestrator', 'Plans, delegates, keeps progress.md', 'Custom', 'Inherits', 'guild-master', 'Purple robe, ledger, banner staff', 'Town hall', 'core'],
  ['ux-researcher', 'Research, personas', 'VoltAgent', 'Sonnet', 'wizard-scholar', 'Blue robe, owl, scrolls', 'Library', 'core'],
  ['product-manager', 'Scope, PRD, stories', 'VoltAgent (model raised from Haiku)', 'Sonnet', 'cartographer', 'Map case, quill, compass', 'Map room in town hall', 'core'],
  ['ui-designer', 'Flows, screens, design system', 'VoltAgent', 'Sonnet', 'illusionist', 'Paint palette, glowing sketches', "Artist's studio", 'core'],
  ['mobile-developer', 'iOS and Android app code', 'VoltAgent', 'Sonnet', 'artificer', 'Goggles, clockwork tools', 'Workshop at the project building', 'core'],
  ['backend-developer', 'APIs, data, auth', 'VoltAgent', 'Sonnet', 'dwarf-smith', 'Beard, hammer, apron', 'Forge', 'core'],
  ['devops-engineer', 'CI/CD, builds, store releases', 'VoltAgent', 'Sonnet', 'harbor-master', 'Rope, lantern, ledger', 'Harbor (shipping)', 'core'],
  ['code-reviewer', 'Code quality review', 'wshobson (renamed)', 'Opus', 'paladin', 'Armor, shield, inspection lens', 'Gatehouse (nothing passes unchecked)', 'core'],
  ['qa-expert', 'Test plans, tests, bug checks', 'VoltAgent (write access added)', 'Sonnet', 'ranger', 'Hood, bow, trap kit', 'Training yard', 'core'],
  ['user-simulator', 'Persona walkthroughs', 'Custom', 'Inherits', 'bard-troupe', 'Masks, one per persona', 'Tavern and market (wanders the project)', 'core'],
  ['react-specialist', 'React + Vite + Capacitor app code', 'VoltAgent', 'unknown', 'enchanter', 'Starry cloak, glowing orb, spell tome', 'Workshop at the Hearth Lodge', 'flowbro'],
  ['typescript-pro', 'Core logic: move engine, scoring, date service, notification planner', 'VoltAgent', 'unknown', 'rune-smith', 'Leather apron, chisel, glowing rune stones', 'Rune table in the Lodge cellar', 'flowbro'],
  ['test-automator', 'Automated test suites (dates, DST, 60-day notification run, migrations)', 'VoltAgent', 'unknown', 'tinkerer', 'Tool belt, little clockwork automatons', 'Training yard', 'flowbro'],
  ['accessibility-tester', 'WCAG 2.2 AA, VoiceOver, TalkBack, 200% text', 'VoltAgent (Haiku raised to Sonnet, write access added)', 'Sonnet', 'herald', 'Tabard, horn, proclamation scroll', 'Town square', 'flowbro'],
  ['ux-microcopy-reviewer', 'Read-only review of interface text', 'VoltAgent', 'unknown', 'sign-painter', 'Smock, fine brush, small signboard', 'Signposts around the Lodge', 'flowbro'],
  ['bro-writer', "Moves, humor variants, playbooks, scripts in Bro's voice", 'Custom', 'Inherits', 'jester', 'Cap with bells, motley coat, quill', 'Tavern stage', 'flowbro'],
  ['content-safety-reviewer', 'Safety gate for every user-facing line', 'Custom', 'Inherits', 'cleric', 'White vestments, holy symbol, stamp', 'Chapel', 'flowbro'],
  ['privacy-guardian', 'No network, no SDKs, encrypted storage, Capacitor security, wipe', 'Custom (mobile-security checks built in)', 'Inherits', 'warden', 'Hooded cloak, ring of keys, lantern', "The Lodge's garden wall", 'flowbro'],
  ['relationship-advisor', 'Couples-therapy pre-review of playbooks, scripts, repair moves', 'Custom', 'Inherits', 'elder-counselor', 'Long shawl, walking stick, kind eyes', 'Village well', 'flowbro'],
  ['womens-health-advisor', "Women's-health pre-review of claims, Cycle basics, life-stage content", 'Custom', 'Inherits', 'healer', 'Green robe, herb satchel, small mortar', "Herbalist's hut", 'flowbro'],
  ['parenting-advisor', 'Pre-review of daughter content and Dad\'s First Period', 'Custom', 'Inherits', 'teacher', 'Spectacles, picture book, pointer', 'Schoolhouse', 'flowbro'],
];

export const ROSTER: readonly AgentDef[] = rows.map(
  ([name, role, source, model, villageClass, look, worksAt, scope]) => ({ name, role, source, model, villageClass, look, worksAt, scope }),
);

const byName = new Map(ROSTER.map((a) => [a.name, a]));

/** Exact (trimmed) name lookup, so typos stay visible as strangers. */
export function findAgentDef(name: string | null | undefined): AgentDef | null {
  if (typeof name !== 'string') return null;
  return byName.get(name.trim()) ?? null;
}
