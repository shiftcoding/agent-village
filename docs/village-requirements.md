# Agent Village - Requirements

Nov 13, 2026 · Ivan
Source doc: https://claude.ai/artifact/JDmZV7e2dvmHzUEgRzBbrK (this file is a copy; the doc may be newer)

## Purpose and concept

The village is a live progress tracker for Ivan's Claude Code agent team, drawn as a cozy medieval fantasy village in a hand-painted isometric style. Every visual element must encode a real signal; decoration that means nothing is cut.

- **Buildings are projects.** How built-up a building is shows progress; its condition shows health.
- **Characters are agents.** Their class shows their role; where they stand and what they do shows their status.
- **The town square is the control panel.** It holds the quest board (open tasks), the town hall (decisions waiting on Ivan) and the chronicle (activity feed).
- **One glance answers three questions:** what is moving, what is stuck, and what needs me.

## Decisions made

- Runs as a local web app on localhost (Vite + React + TypeScript), with an isometric 2D canvas (PixiJS) or SVG.
- All art is original and drawn in code. Cozy, warm, hand-painted feel inspired by cozy building games; no copied assets, sprites or characters from any existing game. Keep art separate from data so commissioned or licensed art can replace it later.
- XP and levels: off by default, behind a toggle.
- Read-only: the village never edits project files.

## The core party: 10 agents

All 21 agents live in `~/.claude/agents` and are installed by `~/src/claude-agents/install-agents.sh`. The 10 below work on every project; the 11 FlowBro specialists follow in the next section. Each agent appears in the village as one character, identified by the agent name in `docs/progress.md`.

| Agent | Role | Source | Model | Village class | Look | Works at |
| --- | --- | --- | --- | --- | --- | --- |
| orchestrator | Plans, delegates, keeps progress.md | Custom | Inherits | Guild master | Purple robe, ledger, banner staff | Town hall |
| ux-researcher | Research, personas | VoltAgent | Sonnet | Wizard scholar | Blue robe, owl, scrolls | Library |
| product-manager | Scope, PRD, stories | VoltAgent (model raised from Haiku) | Sonnet | Cartographer | Map case, quill, compass | Map room in town hall |
| ui-designer | Flows, screens, design system | VoltAgent | Sonnet | Illusionist | Paint palette, glowing sketches | Artist's studio |
| mobile-developer | iOS and Android app code | VoltAgent | Sonnet | Artificer | Goggles, clockwork tools | Workshop at the project building |
| backend-developer | APIs, data, auth | VoltAgent | Sonnet | Dwarf smith | Beard, hammer, apron | Forge |
| devops-engineer | CI/CD, builds, store releases | VoltAgent | Sonnet | Harbor master | Rope, lantern, ledger | Harbor (shipping) |
| code-reviewer | Code quality review | wshobson (renamed) | Opus | Paladin | Armor, shield, inspection lens | Gatehouse (nothing passes unchecked) |
| qa-expert | Test plans, tests, bug checks | VoltAgent (write access added) | Sonnet | Ranger | Hood, bow, trap kit | Training yard |
| user-simulator | Persona walkthroughs | Custom | Inherits | Bard troupe | Masks, one per persona | Tavern and market (wanders the project) |

**User-simulator personas.** The simulator appears as a small troupe of masked figures, one per persona (first-timer, power user, distracted mobile user, accessibility-dependent user). For a project with personas in `docs/research.md`, the troupe uses those instead.

**Idle behavior.** An agent with no task in any project rests at the tavern. An agent with tasks in several projects stands at the building with its most recent `doing` task.

## FlowBro specialists: 11 agents

These 11 agents are installed by the same script and cover FlowBro's riskiest areas: the React/Capacitor stack, the humor content, strict privacy, WCAG 2.2 AA, and expert guidance. The six custom agents apply to FlowBro only.

| Agent | Role | Source | Village class | Works at |
| --- | --- | --- | --- | --- |
| react-specialist | React + Vite + Capacitor app code | VoltAgent | Enchanter | Workshop at the Hearth Lodge |
| typescript-pro | Core logic: move engine, scoring, date service, notification planner | VoltAgent | Rune-smith | Rune table in the Lodge cellar |
| test-automator | Automated test suites (dates, DST, 60-day notification run, migrations) | VoltAgent | Tinkerer with clockwork automatons | Training yard |
| accessibility-tester | WCAG 2.2 AA, VoiceOver, TalkBack, 200% text | VoltAgent (Haiku raised to Sonnet, write access added) | Herald | Town square |
| ux-microcopy-reviewer | Read-only review of interface text | VoltAgent | Sign painter | Signposts around the Lodge |
| bro-writer | Moves, humor variants, playbooks, scripts in Bro's voice | Custom | Jester | Tavern stage |
| content-safety-reviewer | Safety gate for every user-facing line | Custom | Cleric | Chapel |
| privacy-guardian | No network, no SDKs, encrypted storage, Capacitor security, wipe | Custom (mobile-security checks built in) | Warden | The Lodge's garden wall |
| relationship-advisor | Couples-therapy pre-review of playbooks, scripts, repair moves | Custom | Elder counselor | Village well |
| womens-health-advisor | Women's-health pre-review of claims, Cycle basics, life-stage content | Custom | Healer | Herbalist's hut |
| parenting-advisor | Pre-review of daughter content and Dad's First Period | Custom | Teacher | Schoolhouse |

### Content pipeline

1. bro-writer drafts the base move, then its humor variants (6 per move in FlowBro v1.0; 3 more Chaos variants for v1.1).
2. content-safety-reviewer checks every line: pass, fix or reject.
3. relationship-advisor, womens-health-advisor and parenting-advisor pre-review their areas.
4. Human reviewers sign off; the orchestrator lists each one under "Needs you".

In the village, a batch of moves walks this path as a cart: tavern, chapel, the advisors' buildings, then the town hall for human sign-off.

### Human sign-off (shown at the town hall)

AI pre-review never counts as sign-off. Each pre-review is logged as "AI pre-review", separate from the human reviewer entry the brief requires.

| Content | Human reviewer required |
| --- | --- |
| Every Chaos line | Two reviewers, at least one a woman |
| Health or factual claims | A clinician |
| Playbooks, scripts, repair moves | A couples therapist |
| Daughter content | A teen or parenting expert |
| Launch | Legal and trademark review |

**backend-developer on FlowBro.** FlowBro has no backend, so typescript-pro owns the core logic and backend-developer rests at the tavern for this project.

## Buildings and projects

Each project is one building, and its look follows the `Stage` line in that project's `docs/progress.md`. The first building is FlowBro. The village project itself is the second: a small cartographer's workshop, so the village can track its own build.

**FlowBro: the Hearth Lodge.** A warm timber lodge with a big hearth chimney and a walled garden, because the app is a private, offline companion. The garden wall is the privacy boundary: nothing leaves it. Bro, the app's mascot, is a carved sign above the door, so he never walks the village as an agent.

### Growth by stage

| progress.md stage | Building look |
| --- | --- |
| brief | Staked plot with a signpost showing the project name |
| research | Surveyors' tent and string lines on the plot |
| product | Foundation stones laid |
| design | Timber frame with scaffolding |
| architecture | Ground-floor walls up, blueprints pinned outside |
| building | Walls rise floor by floor in step with Overall % |
| testing | Roof on, banners being hung, inspectors at the door |
| released | Finished, windows lit, flag flying |

### FlowBro milestones as building parts

The steps of the brief's build sequence (section 28, brief v2.1) each add a visible part, so Ivan can read FlowBro's progress from the building alone.

0. Discovery and validation (gates G1-G5): surveyors' flags around the plot, one per gate, raised green when a gate passes.
1. Foundations (tokens, primitives, storage, dates, navigation): stone base and paths.
2. Setup flow, two doors, Help me now: the two front doors and an alarm bell.
3. Content schema, first 60 moves, engine: the hearth is lit.
4. Today tab: a daily notice board by the door.
5. Her tab, Memory Vault, Her side card: the walled garden and a locked chest.
6. Plays, Cycle basics, You, Settings, Assumption Lab: side rooms, plus a hidden door for the Lab.
7. Learning, humor reactions, notifications: a jester's window and a bell tower.
8. Content to 150 moves: shelves filling in the library wing.
9. Privacy hardening, accessibility, devices, legal, store: walls sealed, ramp built, flag raised.

Later projects get their own building type when they are added (forge for backend-heavy work, tower for AI, market for commerce, harbor for integrations).

## Status signals

Every state has one visual and a text label; status is never shown by color alone.

### Agent states (from the Status column of the Tasks table)

| Status | What the character does | Where |
| --- | --- | --- |
| doing | Works with a class animation (hammering, writing, aiming) | At the task's building |
| review | Hands a scroll to the paladin, or waits beside him | Gatehouse |
| blocked | Stands still with a glowing "!" above the head | Town hall steps |
| todo only | Studies the quest board | Town square |
| no tasks | Rests inside the tavern: a board shows how many are inside, a "zzz" drifts from the roof when one has no log line for 24 hours (Ivan, 2026-11-14) | Tavern |

### Project health

| Signal | Trigger | Visual |
| --- | --- | --- |
| Active | A log line in the last 24 hours | Chimney smoke, lit windows |
| Needs you | One or more open items under "Needs you" | Banner with "!" on the roof, count badge |
| Failing | A QA or code-review finding still open on a done-claimed task, or failing CI if available | Storm cloud over the building |
| User friction | A blocker in the latest user-simulator report | Masked figure sitting on the doorstep |
| Stale | No log line for 7 days | Vines creeping over the walls |
| Released | Stage is released | Flag flying, fireworks once |

### Rewards (optional, off by default)

- Each agent earns XP for tasks moved to done; level shown as a small number on the name tag.
- No streaks and no penalties, in line with how FlowBro itself treats progress.

## Town square

The square sits in the middle of the village and gathers everything across all projects in one place.

- **Town hall (needs you).** It shows every open "Needs you" item from every project, newest first, with the project and the agent that raised it. The orchestrator stands on the steps. This is the most important element: it should be readable without clicking.
- **Quest board.** Parchment notes for tasks with status todo, grouped by project, each tagged with the assigned agent's class icon. Clicking a note shows the task row.
- **Chronicle.** A scroll with the latest 20 log lines across projects, for example "typescript-pro finished T12 at the Hearth Lodge".
- **Weekly tally.** A small signboard showing tasks done this week per project; no rankings between agents.

## Data source

The village reads only files the agents already write, so tracking costs no extra effort. The orchestrator keeps `docs/progress.md` in this exact format in every project:

```markdown
# Progress: <project name>

Stage: brief | research | product | design | architecture | building | testing | released
Overall: <0-100>%
Updated: <YYYY-MM-DD HH:MM>

## Needs you
- [ ] <decision or blocker for the human> (raised by <agent>)

## Milestones
- [x] <milestone>
- [ ] <milestone>

## Tasks
| ID | Task | Agent | Status | Notes |
|---|---|---|---|---|
| T1 | <task> | <agent> | todo / doing / blocked / review / done | <short note> |

## Log
- <YYYY-MM-DD HH:MM> <agent>: <what happened, one line>
```

### Files read per project

| File | Feeds |
| --- | --- |
| docs/progress.md | Building stage and %, agent positions and states, quest board, town hall, chronicle |
| docs/user-tests/*.md | User friction signal and the masked troupe |
| docs/research.md | Persona names for the user-simulator troupe |
| ~/.claude/agents/*.md | The roster of installed agents (name field of each file) |

### Project registry

`village.config.json` lists each project: name, folder path, building type, and position in the village. A project whose path is null shows as a staked plot with the sign "no folder set".

### Parsing rules

- Be tolerant: a missing file or section means "unknown", never a crash, and the building shows a signpost reading "no progress file yet".
- An agent name that matches no installed agent appears as a hooded stranger, so typos are visible.
- Overall % comes from the file; if it is missing, compute it as the share of tasks marked done.
- Expand `~` in paths to the user's home folder.

## Interactions, art and accessibility

### Interactions

- Click a building: panel with stage, Overall %, milestones, open tasks by agent, "Needs you" items, and the last 5 log lines.
- Click a character: panel with role, source repo, current task per project, tasks done this week, and level (if XP is on).
- Hover any element: tooltip with its plain-text meaning (for example "Storm cloud: 2 open QA findings").
- A list view toggle shows the same data as plain tables, for quick scanning and screen readers.
- Read-only: the village never edits project files.

### Art direction

- Original, cozy, hand-painted-looking isometric art in the spirit of cozy building games, not a copy of any game's assets.
- Warm daylight palette; optional day/night cycle tied to Ivan's local time (Europe/Amsterdam).
- Gentle ambient motion: walking between buildings when a task changes, idle loops, smoke and flags.
- One readable scale: name tags and "!" markers stay legible at laptop size.

### Accessibility

- Every signal has a text label and an icon, never color alone.
- Reduced motion turns animations into still poses and cross-fades.
- Keyboard: Tab moves between buildings and characters, Enter opens the panel.
- Light and dark themes, both checked for contrast.

## Delivery phases

1. **v1: static village.** All 21 agents, the FlowBro Hearth Lodge and the village's own workshop, driven by the sample in `fixtures/flowbro/docs/progress.md`. Goal: agree on the look and the signals.
2. **v2: real data.** `npm run sync` reads `village.config.json`, each project's files and the agent roster, and writes `public/village.json`; watch mode updates the village live.
3. **v3: polish.** Walking animations when a task changes, day/night cycle, building growth stages, the FlowBro specialists' buildings (chapel, well, herbalist's hut, schoolhouse), XP toggle.

## Open questions

- [ ] Where does the FlowBro project live? Set its path in village.config.json.
- [ ] Which other projects get buildings, and what is each one's folder?
