# Progress: Agent Village

Stage: building
Overall: 97%
Updated: 2026-11-14 15:13

## Needs you
- [x] Review phase 1 (v1 static village) before phase 2 starts (raised by orchestrator)
- [x] Review phase 2 (live data from npm run sync) before phase 3 starts (raised by orchestrator)
- [x] Review phase 3 (polish) before the art pass and Answer in Claude button start (raised by orchestrator)
- [x] Review the art pass (docs/screenshots before-*/after-*) and the Answer in Claude button (raised by orchestrator)
- [ ] Review bold art pass 2 (docs/screenshots after-* vs after2-*) (raised by orchestrator)
- [x] Approve the new building designs in the preview (docs/screenshots/buildings-v3-*) before they replace the village art (raised by orchestrator)
- [ ] Review art pass 3 in the village (docs/screenshots/after3-*) and decide whether to merge feat/settlers-style-buildings (raised by orchestrator)
- [ ] Confirm the v1 fixture extensions docs/reviews/*.md (failing signal) and ?now override as conventions for phase 2 (raised by typescript-pro)

## Milestones
- [x] Requirements doc and fixture ready
- [x] Stack and renderer decided (Vite + React + TypeScript, SVG)
- [x] Phase 1: static village from fixtures
- [x] Phase 2: npm run sync writes public/village.json
- [x] Phase 2: watch mode updates the village live
- [x] Phase 2: reviewed (accessibility and code review)
- [x] Phase 3: walking animations when a task changes
- [x] Phase 3: day/night cycle (Europe/Amsterdam)
- [x] Phase 3: building growth stage animation
- [x] Phase 3: FlowBro specialists' buildings (chapel, well, herbalist's hut, schoolhouse)
- [x] Phase 3: finish the XP toggle (level on name tags; stays off by default)
- [x] Phase 3: reviewed (accessibility and code review)
- [x] Art pass: richer hand-painted look in code (shading, texture, lighting, character detail)
- [x] "Answer in Claude" button (copies a prompt per Needs-you item and agent; read-only)
- [x] Bold art pass 2: village reads as a richer painted scene at 1280 px
- [x] Art pass 3: richer, more detailed buildings (preview approved, then in the village)

## Tasks
| ID | Task | Agent | Status | Notes |
|---|---|---|---|---|
| T1 | Scaffold, data contract, art contract, architecture doc | orchestrator | done | src/data/types.ts, src/art/contract.ts |
| T2 | Art direction, palette tokens, characters, buildings, signal icons | ui-designer | done | 68 contrast pairs pass in both themes |
| T3 | Tolerant progress.md parser, roster and village model | typescript-pro | done | 35 vitest tests pass |
| T4 | Village scene, panels, list view, keyboard, themes | react-specialist | done | Build, typecheck, 41 tests pass |
| T5 | Accessibility audit of v1 | accessibility-tester | done | 3 serious, 4 moderate, 3 minor; contrast passes |
| T6 | Code review of v1 | code-reviewer | done | 1 must-fix, 4 should-fix, 3 nits |
| T7 | Fix UI review findings | react-specialist | done | Reflow, narrow Needs you, tooltip, keys |
| T9 | Fix tooltip crash found in browser check | orchestrator | done | Infinite re-render on hover then click; tip now positioned on the DOM node |
| T8 | Fix data review findings | typescript-pro | done | 39 data tests pass |
| T10 | Sync script: shared parser, roster from ~/.claude/agents, research personas, public/village.json | typescript-pro | done | 59 tests pass; 2 projects, 21 agents |
| T11 | Watch mode: debounce, minute refresh, clean exit | typescript-pro | done | 59 tests pass; 2 projects, 21 agents |
| T12 | App loads village.json, live updates, missing-file fallback | react-specialist | done | Polls every 2.5 s; fixture fallback with notice; 69 tests pass |
| T13 | Accessibility check of status and live-update messages | accessibility-tester | done | 0 must-fix, 4 should-fix, 4 nits |
| T14 | Code review of sync, watch and loader | code-reviewer | done | 0 must-fix, 6 should-fix, 5 nits; read-only guarantee holds |
| T15 | Fix data review findings (agentsDir, watcher inode, one-shot errors, village validation, backoff) | typescript-pro | done | 74 tests pass |
| T16 | Fix UI findings (status region outside inert shell, notice icons, stable keys, keep village.json out of dist) | react-specialist | done | No village.json in dist |
| T17 | Real browser check of live updates | orchestrator | done | Edit showed in open page within 5 s, no reload; missing file shows Out of date notice |
| T18 | Agent model from installed file, Inherits when unset | orchestrator | done | Specialists showed unknown; 76 tests pass |
| T19 | Art: day/dawn/dusk/night palettes, lanterns, lit windows, night contrast re-check | ui-designer | done | 4 day parts x 2 themes via data-daypart and @property; night contrast passes |
| T20 | Art: chapel, village well, herbalist's hut, schoolhouse, paths, pipeline cart | ui-designer | done | 4 buildings, path network, PipelineCart and track |
| T21 | Art: walking pose, build transition, fireworks still burst | ui-designer | done | walk pose, BuildBurst, standalone Fireworks; 116 tests pass |
| T22 | Data: specialist work spots and content pipeline from real tasks | typescript-pro | done | Specialist location kind; 6-stop pipeline from open tasks and Needs you |
| T23 | Data: XP ledger kept by sync (gitignored, read-only to projects), levels | typescript-pro | done | .village-state/xp-ledger.json (gitignored); 10 XP per task, level every 30 XP |
| T24 | Data: day part from Europe/Amsterdam time via Intl, ?time=HH:MM | typescript-pro | done | NOAA sunrise/sunset at Amsterdam via Intl; ?time=HH:MM; villageChanges() |
| T25 | UI: walking along paths on location change, focus kept, no restart on poll | react-specialist | done | rAF along path network, stable DOM order keeps focus, 5 s cap |
| T26 | UI: day/night transitions, growth transitions, fireworks once | react-specialist | done | data-daypart from Intl time, overall tween, stage cross-fade, fireworks once per viewer |
| T27 | UI: specialist buildings, pipeline carts, XP level on tags and panels | react-specialist | done | 4 places, carts only where count > 0, Lv badge; 150 tests pass |
| T28 | Accessibility check of phase 3 (reduced motion, night contrast, focus while moving) | accessibility-tester | done | 0 must-fix, 2 should-fix (stale tooltip on move, silent moves for screen readers), 6 nits; reduced motion and contrast pass |
| T29 | Code review of phase 3 | code-reviewer | done | 0 must-fix, 5 should-fix, 9 nits; read-only holds |
| T30 | Real browser check of phase 3 | orchestrator | done | ?time day/night both themes, walk with focus kept, Reduce = instant, hover then click OK, no console errors |
| T33 | Fix phase 3 data findings (fixture XP, partial ledger, proto keys, docs) | typescript-pro | done | Fixture projects earn no ledger XP; bad entries skipped; 153 tests pass |
| T34 | Fix phase 3 UI findings (tooltip on move, draw order, memo, tags, announcements) | react-specialist | done | Tooltip follows walker, sprite/hit layers, memo, announcer, focus tip no longer blocks clicks, no first-load fade; 158 tests |
| T31 | Art pass: richer hand-painted look in code (shading, texture, lighting, character detail) | ui-designer | done | Shared va-g-*/va-p-* defs, textures, AO, faces and cloth; bundle with T32: 386.60 -> 415.95 kB JS (117.72 -> 124.85 gzip), CSS 37.14 -> 38.91 kB; shots in docs/screenshots |
| T32 | "Answer in Claude" button: copy a ready-made prompt for each Needs-you item and agent panel | react-specialist | done | Clipboard only, read-only; manual-copy fallback; scene card 1-3 columns, block when it does not fit |
| T35 | Accessibility check of art pass and Answer in Claude button | accessibility-tester | done | 1 must-fix (dark focus ring on parchment card), 3 should-fix, 2 nits |
| T36 | Code review of art pass and Answer in Claude button | code-reviewer | done | 0 must-fix, 3 should-fix (ghost leg overlay, ArtDefs export, unstable item keys), 5 nits; read-only holds |
| T37 | Fix art review findings (walk-pose leg overlay, ArtDefs export, dark sky glow) | ui-designer | done | 182 tests pass |
| T38 | Fix UI review findings (focus ring on parchment, fallback keys, touch target, stable keys, defs in list view, memo) | react-specialist | done | Also fixed card estimate and fallback flipping card to block, found in browser check |
| T39 | Bold art pass 2: strong light and shadow, warmer palette, characterful buildings, bigger characters, varied ground | ui-designer | done | Buildings 1.2-1.25x with lit and shadow faces, 9 edge pieces; 434 kB JS (130 gzip) |
| T40 | Wire scaled building rings into the scene | react-specialist | done | BUILDING_RINGS, TAVERN_RING, GATEHOUSE_RING |
| T41 | Code review of bold art pass 2 | code-reviewer | done | 1 must-fix (workshop and lodge rings too tall), 5 should-fix |
| T42 | Accessibility review of bold art pass 2 | accessibility-tester | done | 0 must-fix; ring thickness on small screens, ring sizes |
| T43 | Fix art review findings (ring sizes, barrel, Ground memo, ring tests) | ui-designer | done | 188 tests pass |
| T44 | Fix scene review findings (3 px non-scaling ring, character ring height) | react-specialist | done | 186 tests pass at the time |
| T46 | Art pass 3: preview of detailed, warm medieval building designs (inn, cottage, chapel), light and dark | orchestrator | done | src/art/v3 (inn, cottage, stone chapel, shared parts); /preview.html dev page; shots docs/screenshots/buildings-v3-*; village untouched |
| T47 | Art pass 3: replace village building art with the approved designs | orchestrator | review | Tavern is the inn, chapel is the stone chapel, herbalist hut and schoolhouse rebuilt on the v3 shell with their props; rings re-fitted; 188 tests pass; JS 436 -> 456 kB (131 -> 136 gzip) |

## Log
- 2026-11-13 13:20 orchestrator: Scaffolded Vite + React + TypeScript, wrote data and art contracts
- 2026-11-13 13:20 orchestrator: Delegated T2 to ui-designer and T3 to typescript-pro in parallel
- 2026-11-13 13:40 typescript-pro: Finished T3, parser and model with friction and failing fixtures, 35 tests pass
- 2026-11-13 13:42 ui-designer: Finished T2, palette, 22 characters, both buildings at every stage, signal overlays
- 2026-11-13 13:44 orchestrator: Recorded phase 3 scope from Ivan (specialist buildings, XP toggle finish)
- 2026-11-13 13:45 orchestrator: Delegated T4 to react-specialist
- 2026-11-13 13:53 react-specialist: Finished T4, scene, panels, list view, legend, toggles, keyboard
- 2026-11-13 13:55 orchestrator: Delegated T5 to accessibility-tester and T6 to code-reviewer in parallel
- 2026-11-13 13:58 code-reviewer: Review done; flaky tests and zzz reference-time bug to fix first
- 2026-11-13 14:00 accessibility-tester: Audit done; contrast, keyboard and dialog pass; reflow and tooltip hover need fixes
- 2026-11-13 14:02 orchestrator: Sent UI findings to react-specialist (T7) and data findings to typescript-pro (T8)
- 2026-11-13 14:03 react-specialist: Finished T7, reflow, narrow Needs you block, hoverable tooltip, radios, status region (time approximate; was logged as 13:59, before T7 started)
- 2026-11-13 14:03 typescript-pro: Finished T8, per-project zzz, stricter log agent names, tally fallback (time approximate; was logged as 14:10, a future time)
- 2026-11-13 14:03 orchestrator: Verified typecheck, 45 tests and build pass; dev server served and was stopped (time approximate; was logged as 14:15, a future time)
- 2026-11-13 14:04 orchestrator: Browser check found a crash on hover then click (T9); fixed in Tooltip.tsx, build and 45 tests pass, phase 1 ready for Ivan's review
- 2026-11-13 14:35 orchestrator: Ivan approved phase 1; corrected invented phase 1 log times above; started phase 2
- 2026-11-13 14:35 orchestrator: Delegated T10 and T11 to typescript-pro
- 2026-11-13 14:40 typescript-pro: Finished T10 and T11, sync and watch share src/data parser, 59 tests pass, village.json has 2 projects and 21 agents
- 2026-11-13 14:40 orchestrator: Delegated T12 to react-specialist
- 2026-11-13 14:42 react-specialist: Finished T12, app polls village.json, falls back to fixtures with a notice, 69 tests pass
- 2026-11-13 14:42 orchestrator: Delegated T13 to accessibility-tester and T14 to code-reviewer in parallel
- 2026-11-13 14:44 accessibility-tester: Finished T13, no must-fix; status region is inert while a dialog is open, notices need icons
- 2026-11-13 14:44 code-reviewer: Finished T14, no must-fix; only write is atomic public/village.json; should-fix on watcher re-creation and validation
- 2026-11-13 14:44 orchestrator: Sent findings to typescript-pro (T15) and react-specialist (T16) in parallel
- 2026-11-13 15:33 orchestrator: Phase 2 checks started: typecheck, 74 tests, build and one-shot sync pass; testing watch mode
- 2026-11-13 15:34 orchestrator: Watch mode rebuilt on edit and stopped cleanly; live browser check running
- 2026-11-13 15:35 orchestrator: T15 to T18 done; typecheck, 76 tests, build, sync and watch pass; live browser check passed; phase 2 ready for Ivan's review
- 2026-11-13 15:36 orchestrator: Ivan approved phase 2; started phase 3 (polish)
- 2026-11-13 15:36 orchestrator: Delegated T19 to T21 to ui-designer and T22 to T24 to typescript-pro in parallel
- 2026-11-13 15:59 orchestrator: Recorded two items Ivan approved for after phase 3: art pass (T31) and Answer in Claude button (T32)
- 2026-11-13 15:59 typescript-pro: Finished T22 to T24, pipeline, XP ledger, daylight and villageChanges
- 2026-11-13 15:59 ui-designer: Finished T19 to T21, day-part palettes, specialist buildings, path network, walk pose, build burst
- 2026-11-13 15:59 orchestrator: Typecheck and 116 tests pass; delegated T25 to T27 to react-specialist
- 2026-11-13 16:14 react-specialist: Finished T25 to T27; typecheck, 150 tests and build pass; small art fix lets the UI own fireworks
- 2026-11-13 16:14 orchestrator: Delegated T28 to accessibility-tester and T29 to code-reviewer in parallel
- 2026-11-13 16:22 code-reviewer: Finished T29, no must-fix; fixture tasks earn XP and one bad ledger entry drops the ledger
- 2026-11-13 16:22 accessibility-tester: Finished T28, no must-fix; tooltip goes stale while a character moves
- 2026-11-13 16:22 orchestrator: Sent data findings to typescript-pro (T33) and UI findings to react-specialist (T34) in parallel
- 2026-11-13 16:23 typescript-pro: Finished T33, fixture XP removed from the ledger, partial ledger kept, proto-safe maps, docs updated
- 2026-11-13 16:29 react-specialist: Finished T34 fixes; 156 tests pass
- 2026-11-13 16:29 orchestrator: Browser check: ?time day and night in both themes, walk on T34 status edit with focus kept, instant move with Motion Reduce, XP badges; T34 status restored
- 2026-11-13 16:29 orchestrator: Found a focus tooltip blocking clicks on neighbouring buildings and a palette fade on first load; sent to react-specialist
- 2026-11-13 16:31 react-specialist: Fixed focus tooltip blocking clicks and first-load palette fade; 158 tests pass
- 2026-11-13 16:31 orchestrator: Re-checked in the browser: close panel then hover and click the chapel opens it; night shows at once on load; no console errors
- 2026-11-13 16:33 orchestrator: Coordinator check of phase 3: typecheck, 158 tests, build and sync pass; day/night, walk on a T32 status change, instant move with Motion Reduce, specialist buildings and hover-then-click all fine in the browser; T32 restored
- 2026-11-13 16:36 orchestrator: Ivan approved the art pass and Answer in Claude button; saved before screenshots (day/night, both themes) and baseline bundle size
- 2026-11-13 16:36 orchestrator: Delegated T31 to ui-designer and T32 to react-specialist in parallel
- 2026-11-13 16:54 ui-designer: Finished T31 art pass; shared va-g-*/va-p-* defs in Ground, textures, AO, face and cloth detail; 182 tests pass
- 2026-11-13 16:54 react-specialist: Finished T32; copy buttons on every Needs-you item and agent, clipboard fallback; then fixed scene card clipping found in orchestrator screenshots
- 2026-11-13 16:54 orchestrator: Bundle after art pass and button: 411.83 kB JS (123.59 gzip), 38.38 kB CSS (8.11 gzip)
- 2026-11-13 16:54 accessibility-tester: Finished T35; dark-theme focus ring on the parchment Needs-you card is 1.28:1
- 2026-11-13 16:54 code-reviewer: Finished T36, no must-fix; ghost leg overlay in walk pose, unstable Needs-you keys
- 2026-11-13 16:54 orchestrator: Sent art findings to ui-designer (T37) and UI findings to react-specialist (T38) in parallel
- 2026-11-13 16:59 ui-designer: Finished T37; leg overlays swing with the walk, ArtDefs exported, dark sky glow set
- 2026-11-13 16:59 orchestrator: Browser check found the scene card falling back to the block at 1280 and the copy fallback flipping card to block; sent to react-specialist
- 2026-11-13 16:59 react-specialist: Finished T38 and both browser findings; 182 tests pass
- 2026-11-13 16:59 orchestrator: Re-checked in the browser: copy on a Needs-you item (fallback, Esc returns focus) and an agent panel (clipboard text and status message), hover then click chapel, agent and FlowBro lodge; T31 and T32 done
- 2026-11-13 17:02 orchestrator: Walk check in headless Chrome on a real status edit (restored): 60 fps, worst frame 16.8 ms, no console errors
- 2026-11-13 17:02 orchestrator: Final checks: typecheck, 182 tests, build and sync pass; bundle 415.95 kB JS (124.85 gzip), 38.91 kB CSS; after screenshots saved
- 2026-11-13 17:06 orchestrator: Ivan asked for a bolder second art pass (T31 too subtle at 1280 px); baseline bundle 416.29 kB JS (124.97 gzip), 38.91 kB CSS; delegated T39 to ui-designer
- 2026-11-13 17:26 ui-designer: First T39 round: deeper meadow, three outline weights, cast shadows, characters 14 % bigger, light focus ring darkened to #0c2f6e; 186 tests pass
- 2026-11-13 17:26 orchestrator: Judged round 1 not obvious enough on buildings and characters, and too much scattered dressing (41 pieces); sent back for bigger, bolder buildings and at most about 12 framing pieces
- 2026-11-13 17:30 orchestrator: Ivan approved phase 3 and the first art pass with the Answer in Claude button in chat; both review items checked off
- 2026-11-13 17:42 ui-designer: Finished T39 round 2: buildings 1.2-1.25x with clear lit and shadow faces, dressing cut to 9 edge pieces
- 2026-11-13 17:42 orchestrator: Reviews done (T41, T42); fixes T43 and T44 done; typecheck, 188 tests, build and sync pass; focus rings checked in the browser at 3 px and fitted to each building
- 2026-11-13 18:05 orchestrator: FlowBro restarted in ~/src/flowbro from brief v2.0; village.config.json now points at it; browser fallback and tests keep using the FlowBro fixture
- 2026-11-14 14:28 orchestrator: Ivan asked for higher quality buildings in a richly detailed city-builder feel; started T46 (preview first) on branch feat/settlers-style-buildings
- 2026-11-14 14:37 orchestrator: Finished the T46 preview: inn, cottage and stone chapel in src/art/v3, shown next to today's art at /preview.html; light and dark, day and night screenshots saved; typecheck, tests and build pass; waiting for Ivan's approval before T47
- 2026-11-14 15:13 orchestrator: Ivan approved the T46 designs in chat; started T47
- 2026-11-14 15:13 orchestrator: Finished T47: new tavern, chapel, herbalist hut and schoolhouse art in the village, focus rings re-fitted from measured art, old house shell removed; typecheck, 188 tests and build pass; checked day and night in both themes (docs/screenshots/after3-*)
