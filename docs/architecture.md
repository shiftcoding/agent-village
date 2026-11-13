# Agent Village: architecture (v1)

## Stack

Vite + React 18 + TypeScript (strict). `npm run dev` serves on localhost. No backend in v1.

## Renderer: SVG (decided by Ivan)

Every building and character is a real DOM element, so Tab focus, Enter-to-open,
aria-labels, tooltips and the screen-reader story come for free. About 21 characters
plus a handful of buildings is far below where SVG performance matters. CSS custom
properties give light and dark theming, and CSS animations honour
`prefers-reduced-motion`. Art stays as swappable React components. PixiJS would
need a parallel accessibility layer (hidden DOM mirror) for all of that.

## Layers (art is separate from data)

| Folder | Owns | May import |
| --- | --- | --- |
| `src/data/` | Types (`types.ts`), roster from the spec, tolerant markdown parser, village model (placement, health, tally), v1 fixture loader | nothing from art/ui |
| `src/art/` | Palette tokens (`tokens.css`), SVG characters, buildings, signal icons and overlays (`contract.ts`) | type-only names from `src/data/types.ts` |
| `src/ui/` | React app: scene layout, panels, list view, tooltips, legend, toggles, keyboard | data + art |

The `Village` type in `src/data/types.ts` is the single interface. In v1 it is
built in the browser from markdown imported with Vite `?raw` / `import.meta.glob`.
In phase 2 `npm run sync` writes the same shape to `public/village.json`, and only
the loader changes.

## v1 data sources

- FlowBro (`path: null`): `fixtures/flowbro/docs/progress.md`, plus added fixtures
  `fixtures/flowbro/docs/user-tests/*.md` and `fixtures/flowbro/docs/reviews/*.md`.
- Agent Village: this repo's own `docs/progress.md`.
- Roster: the spec tables, hard-coded in `src/data/roster.ts` (phase 2 reads
  `~/.claude/agents/*.md`).

## Reference time (important)

"Active" (log line within 24 h), "stale" (no log line for 7 days), "zzz" (idle 24 h)
and "this week" are computed against a per-project reference time, not the wall clock:

- Fixture projects use their progress file's `Updated:` time (FlowBro's fixture is
  dated 2026-11-20, a week in the future, so wall clock would make it look odd).
- Real projects use the wall clock.
- `?now=YYYY-MM-DDTHH:MM` in the URL overrides both, for reviewing stale/active states.

Times are read as Europe/Amsterdam wall time (from `village.config.json` timezone).

## Read-only

The app only imports files at build/dev time. It never writes to any project folder.

## Phase 3 data (polish)

### Specialist locations

`Location` has a fourth working spot: `{ kind: 'specialist'; place: SpecialistPlace; projectId }`.
`SPECIALIST_PLACE_OF` (`src/data/pipeline.ts`): content-safety-reviewer -> chapel, relationship-advisor -> well,
womens-health-advisor -> herbalist, parenting-advisor -> schoolhouse. Only the `doing` state moves them
there (projectId is kept); review (gatehouse), blocked (town hall steps), todo (quest board) and idle (tavern) are unchanged.

### Content pipeline

`Village.pipeline` is always six stops in route order: `tavern`, `chapel`, `well`, `herbalist`, `schoolhouse`,
`town-hall`. Derived only from real data, never invented. Done tasks are excluded.

- tavern: bro-writer's tasks that are not `done` (todo, doing, review, blocked, unknown).
- chapel / well / herbalist / schoolhouse: the same for content-safety-reviewer, relationship-advisor,
  womens-health-advisor, parenting-advisor.
- town-hall: open Needs-you items raised by any of those five agents (`ref: 'needs-you'`), meaning human sign-off is waiting.

A stop with `count` 0 stays listed so the UI knows the route; draw carts only where `count > 0`.
`pipelineSummary()` gives the tooltip text, e.g. "Content pipeline: 1 batch in safety review at the chapel (FlowBro T8)."
Old village.json files without `pipeline` load with an all-zero pipeline.

### XP ledger

XP is off by default (`xpEnabled`). progress.md has no done-dates, so sync derives XP from status changes it sees between
runs and stores them in `.village-state/xp-ledger.json` at THIS repo's root (gitignored; never in public/, dist/ or a
project folder; written atomically and only when it changed).

- One award per projectId + task id + agent, the first time sync sees the task as `done`, ever. Back to doing and done again
  awards nothing; leaving done never removes XP. No streaks, rankings, decay or penalties.
- First run (no ledger): tasks already done are baseline awards with `seenDoneAt: null`; later awards store the sync time.
- 10 XP per award; level = 1 + floor(xp / 30) (so level 2 at 3 tasks). `Agent.xp`, `Agent.level`, `Agent.tasksDone`.
- `Village.xpSource` is `'ledger'` (sync) or `'snapshot'` (browser fixture fallback: done tasks right now, no memory);
  `Village.xpSince` is the ledger creation time ("XP counted since ..."), null for a snapshot.
- The XP summary is stored in `village.json` `inputs.xp`, so a `?now` rebuild in the browser keeps ledger XP.
- An unreadable or malformed ledger is renamed to `xp-ledger.json.bak-<stamp>`, a new one starts, a warning is added;
  sync never fails for XP reasons.
- Fixture projects (`path: null`, sample data) earn no ledger XP, and any awards already stored for them are pruned on the
  next sync (the one case where XP is removed). Agents therefore show XP only for real project folders.
- A single unreadable entry is skipped with a warning ("ignored N unreadable XP entries"); only a malformed top level
  (format, createdAt, awards list) starts a new ledger.
- Limits: running `sync --watch` and a manual `sync` at the same time can lose an award (both read, one write wins); the task
  is then awarded on a later run with a later date. A task marked done while sync was not running is dated at the next run; renamed task IDs count again; a task
  deleted from progress.md keeps its XP; renaming an agent splits its XP (the old name keeps it but is no longer shown).

This repo lists itself as a project, so `public/village.json` and `.village-state/` live inside a configured project folder
by design; both are gitignored and are the only files sync writes.

### Daylight

`src/data/daylight.ts` (pure, Intl via `time.ts`, never the machine zone). Sunrise and sunset use the NOAA solar formulas for
the local date at `Village.location` (optional `location: { latitude, longitude }` in village.config.json; default Amsterdam
52.37, 4.90). Day parts: dawn = sunrise -45 to +45 min, day, dusk = sunset -45 to +45 min, night otherwise. Polar night is
all `night`, midnight sun all `day`; coordinates are clamped, no NaN.
`dayPart(epochMs, timeZone, location?)` returns `{ part, localTime, sunrise, sunset, label }`.
`?time=HH:MM` (or H:MM; 24:00, 7:5 and junk are ignored) is read by `parseTimeParam(search)`; `timeParamToEpoch(minutes,
timeZone, wallClock, nowOverride)` places it on the `?now` date, else today, in the configured zone.

### Changes

`villageChanges(prev, next)` (`src/data/changes.ts`) lists moved agents, stage/overall changes and newly released projects
for animations; identical villages (or `prev` null) give empty lists.

## Answer in Claude (T32)

Every Needs-you item (town hall card, narrow-screen block, town hall panel, project panel, list view) and every agent (agent panel, list view) has a "Copy answer prompt" / "Copy prompt" button. It copies plain text to the clipboard so Ivan can paste it into Claude Code. Builders are pure functions in `src/ui/answerPrompt.ts`; the button is `src/ui/CopyPromptButton.tsx`. `Project.path` (optional, from village.config.json, `~` not expanded, null when unset) exists only to fill the "folder" lines.

Needs-you item:

```
Answer for <project> (raised by <agent | an unknown agent>): <item text>
Project folder: <path | not set | not set (sample data)>
My decision: 
```

Agent (one Project/Folder/Tasks block per project with open tasks; at most 12 tasks, then "...and N more tasks"):

```
Message for agent <name>.
Project: <project>
Folder: <path | not set | not set (sample data)>
Tasks:
- <id>: <title> (<status>)
My message: 
```

An agent with no open tasks gets `Open tasks: none` in place of the project blocks. Every field is flattened to one line (whitespace and control characters become one space), long fields are cut with an ellipsis, and the builders never throw.

Behaviour: on success the button shows a check and "Copied" for 2.5 s and the shared polite status region says "Copied. Paste it into Claude Code." If `navigator.clipboard` is missing or refuses, a read-only textarea with the prompt appears, focused and selected, with "Copy this prompt manually (Cmd+C)" and a polite announcement; "Hide prompt" closes it. The button stops click propagation (the card behind it does not open) and is a normal sibling control, not an overlay. State lives in the button, so a no-change poll (same village) does not reset "Copied" or the fallback text; the timer is cleared on unmount.

Read-only guarantee: the only side effect is `navigator.clipboard.writeText`. No network calls, no file writes, nothing is launched or sent to Claude Code.

Paths are pasted exactly as written in village.config.json, so prefer `~/...` paths: an absolute path would put the user name into the prompt. Fallback text: "Copy this prompt manually: press Ctrl+C, or Command+C on Mac. Esc closes it." Item keys are project id + item text (plus a counter for duplicates), not file position, so resolving an earlier item does not move "Copied" state to another item.
