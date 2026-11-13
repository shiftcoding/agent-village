# Agent Village

A local web dashboard that shows Ivan's Claude Code agents and projects as a cozy medieval village. The full spec is `docs/village-requirements.md`; read it before any work.

## Rules

- Start every multi-step task with the orchestrator agent, and keep this project's own `docs/progress.md` up to date in the format from the spec.
- Stack: Vite + React + TypeScript; isometric 2D rendering with PixiJS or SVG.
- All art is original and drawn in code. Never copy assets, sprites, characters or layouts from existing games.
- Keep art (renderers, sprites, palettes) separate from data (parser, village.json), so art can be swapped later.
- The village is read-only: never write to any project folder listed in `village.config.json`.
- Parsing must be tolerant: missing or malformed files show "unknown", never crash.
- Accessibility: text label and icon for every signal, keyboard navigation, reduced motion, light and dark themes.
- Use `fixtures/` for sample data while a project's `path` is null.

## Commands (to be created)

- `npm run dev`: start the village on localhost
- `npm run sync`: read projects and agents, write `public/village.json`
- `npm run sync -- --watch`: keep `public/village.json` updated live
