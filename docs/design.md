# Agent Village: design (v1, phases 1 to 3)

Owner: ui-designer. Code: `src/art/**`. Tokens: `src/art/tokens.css`. Motion: `src/art/motion.css`.
Rule of the village: every visual encodes a signal. Ground, paths and a few edge trees for framing are the only decoration.

## 1. Art direction

- **Mood.** Cozy, warm, hand-painted. Daylight is honey-gold; the dark theme is a warm night village (lamp-lit windows, deep green grass, amber glow), not an inverted filter.
- **Light.** One light source, top-left, always. Left-front faces are lit, right-front faces get a shade overlay (`--va-shade` at `--va-shade-opacity`), cast shadows are soft ellipses falling to the bottom-right.
- **Outline and shading.** Every shape has a warm brown outline (`--va-outline`, 1.1 units, round joins; near-black brown in dark). Flat fills plus three painted cues: a highlight sliver on the lit side, a shade overlay on the far side, and a thin wood-light core on beams. No blur filters. Since T31 the gradients and patterns are shared defs with stable ids (section 12); components keep flat token fills and add painted overlays on top.
- **Isometric rules.** 2:1 projection. Ground axes: `a` runs down-right (slope +0.5), `b` runs down-left (slope -0.5), `z` is up. Screen = `(cx + a - b, cy + (a+b)/2 - z)` (see `buildings/iso.tsx`). Face details are drawn flat and skewed onto the face with `matrix(1 ±0.5 0 1 ...)`. Characters, signs, banners, flags and the town hall facade are drawn frontal (flat) so text stays readable.
- **Scale.** Characters ~64 units tall (feet at 0,0, head at y -50, hats to -75, "!" at -88). Buildings are 2-3 character heights. Text inside SVG is never below 12 units and is always `--va-ink` on parchment/sign planks.
- **Colour use.** Colour is never the only cue: every signal has a distinct shape and a text label supplied by the UI (see section 7).

## 2. Palette and tokens

All colours are CSS custom properties with the `--va-` prefix. Light is the default on `:root`. Dark is `:root[data-theme="dark"]` and, when no explicit `data-theme="light"` is set, `@media (prefers-color-scheme: dark)`.

| Group | Tokens |
| --- | --- |
| UI | `--va-bg`, `--va-surface`, `--va-surface-2`, `--va-text`, `--va-text-muted`, `--va-border`, `--va-focus`, `--va-accent`, `--va-on-accent`, `--va-alert`, `--va-on-alert`, `--va-alert-glow`, `--va-ok` |
| Paper | `--va-parchment` (notes, scrolls, notice board), `--va-ink` (text on parchment and signs, same dark brown in both themes), `--va-sign` (signpost planks) |
| Signal icons | `--va-sig-active`, `-needs`, `-failing`, `-friction`, `-stale`, `-released`, `-doing`, `-review`, `-blocked`, `-todo`, `-idle`, `-stranger`, `-nofolder`, `-noprogress` |
| Ground | `--va-grass`, `-grass-2`, `-grass-3`, `--va-path`, `-path-edge`, `--va-plaza`, `-plaza-2`, `--va-water`, `--va-shadow`, `--va-shadow-opacity`, `--va-sky-glow` |
| Materials | `--va-outline`, `--va-shade`, `--va-shade-opacity`, `--va-highlight`, `--va-wood(-dark/-light)`, `--va-plaster(-shade)`, `--va-stone(-dark/-light)`, `--va-roof(-dark/-light)`, `--va-slate(-dark)`, `--va-thatch(-dark)`, `--va-gold(-dark)`, `--va-canvas(-stripe)`, `--va-blueprint(-line)` |
| Weather and overlays | `--va-window`, `--va-window-lit`, `--va-glow`, `--va-smoke`, `--va-cloud(-dark)`, `--va-lightning`, `--va-rain`, `--va-vine(-dark)`, `--va-leaf`, `--va-flag`, `--va-firework-1..3` |
| People | `--va-skin-1..3`, `--va-hair-*`, `--va-mask`, `--va-c-*` (cloth: purple, blue, teal, magenta, copper, navy, steel, forest, cyan, slate, orange, red, olive, cream, moss, brown, sage, burgundy, grey, yellow) |

Key values (light / dark):

| Token | Light | Dark |
| --- | --- | --- |
| `--va-bg` | #f5ead2 | #1d1610 |
| `--va-surface` | #fffaf0 | #2a2017 |
| `--va-surface-2` | #efe2c3 | #382b20 |
| `--va-text` | #35261a | #f3e6cc |
| `--va-text-muted` | #67523c | #c9b593 |
| `--va-border` | #8c7150 | #98825f |
| `--va-focus` | #1c5db5 | #7db4ff |
| `--va-accent` | #9c4220 | #f0a060 |
| `--va-alert` | #b3261e | #ff8a7a |
| `--va-parchment` | #f2e0b4 | #dcc794 |
| `--va-ink` | #2b1c10 | #2b1c10 |
| `--va-grass` | #9bbf5e | #35502f |
| `--va-wood` | #a66f3e | #8d5c34 |
| `--va-roof` | #b4553a | #8a4331 |
| `--va-window-lit` | #ffd27a | #ffd27a (glows against the night) |

Focus ring: 2 px `--va-focus`, 2 px offset (UI owns the CSS; the colour is verified below).

## 3. Contrast (computed, WCAG relative luminance)

Targets: text >= 4.5:1, signal icons / borders / focus ring >= 3:1. Generated from `tokens.css` by a script, so it matches the file. Every pair passes in both themes (re-verified after the T31 art pass: all 70 rows below unchanged, new T31 pairs in section 12.6) and, since phase 3, at night in both themes: the Light/Dark columns use the base tokens (no `data-daypart`), the Night columns use the night palette. UI, paper, ink and signal tokens do not change by day part, so those rows have the same ratio in every column; only the scene-dependent rows (focus ring on grass, light grass, path and plaza) move. The full day-part matrix is in section 11. Icons are additionally outlined with `--va-text`, so their shape holds even if a fill is close to the background.

| Pair (foreground on background) | Use | Target | Light | Dark | Night light | Night dark | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| text on bg | text | 4.5:1 | 12.18 | 14.48 | 12.18 | 14.48 | pass |
| text-muted on bg | text | 4.5:1 | 6.17 | 8.95 | 6.17 | 8.95 | pass |
| text on surface | text | 4.5:1 | 13.98 | 12.91 | 13.98 | 12.91 | pass |
| text-muted on surface | text | 4.5:1 | 7.09 | 7.98 | 7.09 | 7.98 | pass |
| text on surface-2 | text | 4.5:1 | 11.32 | 11.08 | 11.32 | 11.08 | pass |
| text-muted on surface-2 | text | 4.5:1 | 5.73 | 6.85 | 5.73 | 6.85 | pass |
| accent on bg | text | 4.5:1 | 5.47 | 8.43 | 5.47 | 8.43 | pass |
| accent on surface | text | 4.5:1 | 6.28 | 7.52 | 6.28 | 7.52 | pass |
| accent on surface-2 | text | 4.5:1 | 5.08 | 6.45 | 5.08 | 6.45 | pass |
| on-accent on accent | text | 4.5:1 | 6.28 | 8.43 | 6.28 | 8.43 | pass |
| on-alert on alert | text (banner/badge) | 4.5:1 | 6.28 | 7.18 | 6.28 | 7.18 | pass |
| alert on bg | text | 4.5:1 | 5.47 | 7.81 | 5.47 | 7.81 | pass |
| ok on bg | text | 4.5:1 | 5.44 | 9.56 | 5.44 | 9.56 | pass |
| alert on surface | text | 4.5:1 | 6.28 | 6.96 | 6.28 | 6.96 | pass |
| ok on surface | text | 4.5:1 | 6.24 | 8.52 | 6.24 | 8.52 | pass |
| ink on parchment | text (quest notes, scrolls, parchment) | 4.5:1 | 12.61 | 9.90 | 12.61 | 9.90 | pass |
| ink on sign | text (signposts, signs) | 4.5:1 | 10.33 | 7.32 | 10.33 | 7.32 | pass |
| ink on alert-glow | text ("!" on glow) | 4.5:1 | 11.65 | 11.65 | 11.65 | 11.65 | pass |
| border on bg | UI border | 3:1 | 3.83 | 4.85 | 3.83 | 4.85 | pass |
| border on surface | UI border | 3:1 | 4.39 | 4.32 | 4.39 | 4.32 | pass |
| border on surface-2 | UI border | 3:1 | 3.56 | 3.71 | 3.56 | 3.71 | pass |
| focus on bg | focus ring | 3:1 | 5.36 | 8.38 | 5.36 | 8.38 | pass |
| focus on surface | focus ring (also the halo under the ring) | 3:1 | 6.15 | 7.47 | 6.15 | 7.47 | pass |
| focus on surface-2 | focus ring | 3:1 | 4.98 | 6.42 | 4.98 | 6.42 | pass |
| focus on grass | focus ring on grass | 3:1 | 3.05 | 4.21 | 3.22 | 5.62 | pass |
| focus on grass-3 | focus ring on light grass | 3:1 | 3.68 | 3.23 | 3.78 | 4.71 | pass |
| focus on path | focus ring on path | 3:1 | 3.64 | 3.27 | 4.01 | 4.53 | pass |
| focus on plaza | focus ring on plaza | 3:1 | 4.14 | 3.54 | 4.18 | 4.42 | pass |
| sig-active on bg | signal icon | 3:1 | 3.91 | 8.49 | 3.91 | 8.49 | pass |
| sig-active on surface | signal icon | 3:1 | 4.49 | 7.57 | 4.49 | 7.57 | pass |
| sig-active on surface-2 | signal icon | 3:1 | 3.63 | 6.50 | 3.63 | 6.50 | pass |
| sig-needs on bg | signal icon | 3:1 | 5.47 | 7.81 | 5.47 | 7.81 | pass |
| sig-needs on surface | signal icon | 3:1 | 6.28 | 6.96 | 6.28 | 6.96 | pass |
| sig-needs on surface-2 | signal icon | 3:1 | 5.08 | 5.97 | 5.08 | 5.97 | pass |
| sig-failing on bg | signal icon | 3:1 | 6.03 | 8.57 | 6.03 | 8.57 | pass |
| sig-failing on surface | signal icon | 3:1 | 6.92 | 7.64 | 6.92 | 7.64 | pass |
| sig-failing on surface-2 | signal icon | 3:1 | 5.60 | 6.56 | 5.60 | 6.56 | pass |
| sig-friction on bg | signal icon | 3:1 | 5.74 | 8.62 | 5.74 | 8.62 | pass |
| sig-friction on surface | signal icon | 3:1 | 6.59 | 7.69 | 6.59 | 7.69 | pass |
| sig-friction on surface-2 | signal icon | 3:1 | 5.33 | 6.60 | 5.33 | 6.60 | pass |
| sig-stale on bg | signal icon | 3:1 | 4.30 | 9.78 | 4.30 | 9.78 | pass |
| sig-stale on surface | signal icon | 3:1 | 4.94 | 8.72 | 4.94 | 8.72 | pass |
| sig-stale on surface-2 | signal icon | 3:1 | 4.00 | 7.48 | 4.00 | 7.48 | pass |
| sig-released on bg | signal icon | 3:1 | 4.54 | 9.58 | 4.54 | 9.58 | pass |
| sig-released on surface | signal icon | 3:1 | 5.21 | 8.54 | 5.21 | 8.54 | pass |
| sig-released on surface-2 | signal icon | 3:1 | 4.22 | 7.33 | 4.22 | 7.33 | pass |
| sig-doing on bg | signal icon | 3:1 | 4.91 | 8.12 | 4.91 | 8.12 | pass |
| sig-doing on surface | signal icon | 3:1 | 5.64 | 7.24 | 5.64 | 7.24 | pass |
| sig-doing on surface-2 | signal icon | 3:1 | 4.57 | 6.22 | 4.57 | 6.22 | pass |
| sig-review on bg | signal icon | 3:1 | 4.82 | 8.32 | 4.82 | 8.32 | pass |
| sig-review on surface | signal icon | 3:1 | 5.54 | 7.42 | 5.54 | 7.42 | pass |
| sig-review on surface-2 | signal icon | 3:1 | 4.48 | 6.37 | 4.48 | 6.37 | pass |
| sig-blocked on bg | signal icon | 3:1 | 5.47 | 7.81 | 5.47 | 7.81 | pass |
| sig-blocked on surface | signal icon | 3:1 | 6.28 | 6.96 | 6.28 | 6.96 | pass |
| sig-blocked on surface-2 | signal icon | 3:1 | 5.08 | 5.97 | 5.08 | 5.97 | pass |
| sig-todo on bg | signal icon | 3:1 | 4.45 | 10.28 | 4.45 | 10.28 | pass |
| sig-todo on surface | signal icon | 3:1 | 5.11 | 9.16 | 5.11 | 9.16 | pass |
| sig-todo on surface-2 | signal icon | 3:1 | 4.13 | 7.87 | 4.13 | 7.87 | pass |
| sig-idle on bg | signal icon | 3:1 | 4.91 | 8.12 | 4.91 | 8.12 | pass |
| sig-idle on surface | signal icon | 3:1 | 5.64 | 7.24 | 5.64 | 7.24 | pass |
| sig-idle on surface-2 | signal icon | 3:1 | 4.57 | 6.22 | 4.57 | 6.22 | pass |
| sig-stranger on bg | signal icon | 3:1 | 5.65 | 9.36 | 5.65 | 9.36 | pass |
| sig-stranger on surface | signal icon | 3:1 | 6.49 | 8.35 | 6.49 | 8.35 | pass |
| sig-stranger on surface-2 | signal icon | 3:1 | 5.25 | 7.17 | 5.25 | 7.17 | pass |
| sig-nofolder on bg | signal icon | 3:1 | 4.91 | 8.12 | 4.91 | 8.12 | pass |
| sig-nofolder on surface | signal icon | 3:1 | 5.64 | 7.24 | 5.64 | 7.24 | pass |
| sig-nofolder on surface-2 | signal icon | 3:1 | 4.57 | 6.22 | 4.57 | 6.22 | pass |
| sig-noprogress on bg | signal icon | 3:1 | 5.04 | 8.79 | 5.04 | 8.79 | pass |
| sig-noprogress on surface | signal icon | 3:1 | 5.78 | 7.84 | 5.78 | 7.84 | pass |
| sig-noprogress on surface-2 | signal icon | 3:1 | 4.68 | 6.73 | 4.68 | 6.73 | pass |
Notes: the dark `--va-ink` is deliberately the same dark brown, because dark-mode parchment, signs and banners are still light paper in a night scene. Plaster is not a text background anywhere in the art (all scene text sits on parchment or sign planks; the carved Bro plank was moved from wood-light to sign in phase 3 so no text depends on a day-part material colour). The focus ring is drawn with a 4 px `--va-surface` halo under it (UI), so it also stands on the halo, not only on the ground. Correction from the phase 3 accessibility check: the raw ring against some secondary ground tones is below 3:1 (light theme grass-2 2.47 day, 2.80 dawn, 2.66 night; path-edge about 2.6 to 2.9; dark theme water 2.55 to 2.97). This is not a failure, because the ring is measured against its halo (6.15 light, 7.47 dark), but do not rely on "ring >= 3:1 on every ground token"; the halo is what carries WCAG 1.4.11.

## 4. Characters (22 art classes, plus the masked troupe)

Source: `src/art/characters/` (`Character.tsx` shell, `looks.tsx` per-class data, `parts.tsx` shared body parts). Each class is a body type (robe, tunic, armor) in its own colour, a distinct head silhouette, and one held item. Held items carry the class work animation (`va-w-*`, motion.css) in pose `work`.

| Class (agent) | Colour | Head silhouette | Props (spec look) | Work animation |
| --- | --- | --- | --- | --- |
| guild-master (orchestrator) | purple robe, gold sash | gold crown, white beard | ledger under arm, tall banner staff (tallest figure) | wave |
| wizard-scholar (ux-researcher) | blue robe | tall pointed star hat, white beard | owl on shoulder, scrolls | bob |
| cartographer (product-manager) | teal tunic | brown feathered cap | map case on back, quill, compass at belt | scribble |
| illusionist (ui-designer) | magenta robe | tilted beret | paint palette, brush, glowing sketch floating beside | paint |
| artificer (mobile-developer) | copper tunic | red hair, brass goggles | cog on back, wrench | swing |
| dwarf-smith (backend-developer) | red tunic, leather apron | short and wide (scale 1.15 x 0.88), huge red beard | big hammer | swing |
| harbor-master (devops-engineer) | navy coat | captain's cap, grey beard | rope coil, lantern, ledger | wave |
| paladin (code-reviewer) | steel armor | plumed helm | kite shield with gold cross, inspection lens | bob |
| ranger (qa-expert) | forest green | pointed hood | bow, quiver, trap kit | aim |
| bard-troupe (user-simulator) | red tunic | domino mask, feather cap | lute (single-figure fallback; the troupe uses `Troupe.tsx`) | wave |
| enchanter (react-specialist) | cyan robe | glowing circlet | atom emblem on chest, star wand | wave |
| rune-smith (typescript-pro) | slate tunic | gold headband, braid | glowing rune slab, chisel | scribble |
| tinkerer (test-automator) | orange tunic | spiky hair, brass top hat | clockwork automaton beside, wind-up key | tick |
| herald (accessibility-tester) | red tabard, yellow front | plumed cap | long gold trumpet | toot |
| sign-painter (ux-microcopy-reviewer) | olive smock | flat red cap | signboard with lines of text, brush | scribble |
| jester (bro-writer) | split red / yellow motley | two-pronged belled hat | marotte (stick with a puppet head) | wave |
| cleric (content-safety-reviewer) | cream robe, gold | gold halo ring | sun staff, sun emblem | wave |
| warden (privacy-guardian) | dark green plate, stone cloak | boxy visored helm | great key, padlock emblem | bob |
| elder-counselor (relationship-advisor) | brown robe | white hair, long white beard | cane, cream shawl; leans slightly | bob |
| healer (womens-health-advisor) | sage robe, white apron | white head-wrap with leaf | herb basket, sprig | bob |
| teacher (parenting-advisor) | burgundy dress | hair bun, round spectacles | book stack, pointer | wave |
| stranger (unknown name) | grey cloak | hood, faceless dark void | "?" stitched (dashed) on the cloak | bob |

**Troupe** (`Troupe.tsx`): one small figure (~52 tall) per persona, 24 units apart in a shallow arc, each with a different coat colour, a different mask (domino, comedy, tragedy, beak, cat, star, half mask, visor) and a different small instrument. Mask kind repeats after eight personas.

**Poses.** `stand`: arms at the sides, item held. `work`: item raised and animated. `study`: head tilted, item in front (quest board). `rest`: seated, body lowered 6 units, optional mug in the left hand, optional "zzz" (three z letters drifting up). `wait`: arms in. `walk`: legs alternate and the body bobs (phase 3, section 11). `alert`: glowing yellow disc with a bold "!" 88 units above the feet, pulsing. All characters breathe slowly when idle.

## 5. Buildings

Source: `src/art/buildings/`. Local origin is the centre of the footprint on the ground (`iso(0,0,0,0)`); anchors below are in these local coordinates. `ProjectBuilding.tsx` renders both project buildings from a spec, so growth, overlays and anchors behave identically; `HearthLodge.tsx` and `CartographersWorkshop.tsx` are thin wrappers.

### Growth by stage (both project buildings)

| Stage | Look |
| --- | --- |
| brief | Staked plot: four red-ribboned stakes joined by string, signpost with the name (`signText`) |
| research | Plot plus a red/cream surveyors' tent, a brass theodolite on a tripod, cross string lines, the signpost |
| product | Foundation stones: a low stone plinth with an empty earthen core, string lines, stakes, signpost |
| design | Timber frame (corner posts, floor beams, braces) on the plinth, scaffolding with planked platforms and a ladder |
| architecture | Ground-floor walls (85 % of a floor), open top showing the earthen floor and inner walls, door opening, first stone courses of the chimney, blueprint board (pinned blue sheets) beside the door, the carved sign leaning by the door |
| building | Walls rise continuously with Overall %: height = floor + (overall/100) x (full - floor); floor beams show where one floor ends; a timber frame stub and scaffold sit on top of the current wall while it grows; the stack rises with the wall; windows appear as each floor is reached; the carved sign hangs above the door once the wall is high enough. `overall` null is drawn as 50 % |
| testing | Roof on, bunting along the eave, red banners flanking the door (one still half hung, with a ladder), an inspectors' table with a ticked checklist at the door |
| released | Everything finished, all banners up, all windows lit, hearth glowing |
| unknown | Plot with a pointing signpost (`signText`, default "stage unknown") |

**Hearth Lodge (FlowBro).** Log-walled timber lodge, two floors, terracotta roof, big stone hearth chimney on the gable end (rises above the ridge, fireplace glows when active), a closed low stone garden wall around the yard (the privacy boundary; the only gate is shut and padlocked, in front of the door), and the carved Bro sign (a round-eared face and the word "Bro") above the door. Garden drawn from research stage on.

**Cartographer's Workshop (the village itself).** Small plaster-and-timber cottage, slate roof, compass weathervane on the ridge, compass-rose plaque over the door, map table outside (from architecture on).

### Town square pieces

- **Town hall** (`TownHall.tsx`): wide front-facing hall, pediment, belfry with a bell, an isometric side wing, three broad steps. A framed parchment board is drawn on the facade; `TOWN_HALL_NOTICE_RECT = {x:-112, y:-176, width:224, height:108}` (local, origin = bottom centre of the facade) is the rectangle for the HTML notice board. `TOWN_HALL_STEP_SPOTS` (14 spots): index 0 is the orchestrator (0, 8) on the top step; the rest are rows at y 21 and y 35 for blocked agents.
- **Gatehouse** (`Gatehouse.tsx`): two crenellated towers, an arch with a red/cream check-bar ("nothing passes unchecked") and a "Review" plank. `GATEHOUSE_SPOTS` (7): index 0 is the paladin at his post (-68, 16); the others wait or hand over scrolls.
- **Tavern** (`Tavern.tsx`): thatched inn with dim windows (lamp-lit only at dusk and night; no chimney smoke on purpose: smoke and lit windows mean "active project"), hanging mug sign, a long table with two benches. `TAVERN_SIT_SPOTS` (6, on the benches), `TAVERN_STAND_SPOTS` (4).
- **Quest board** (`QuestBoard.tsx`): frame, red cap, "Quest board" plank, dark wood field. `QUEST_BOARD_NOTE_RECT = {x:-84, y:-122, width:168, height:80}`; `QUEST_BOARD_SPOTS` (7) in front.
- **Chronicle** (`ChronicleScroll.tsx`): large scroll between two posts. `CHRONICLE_TEXT_RECT = {x:-68, y:-150, width:136, height:92}`; `CHRONICLE_SPOTS` (4).
- **Weekly tally** (`TallySign.tsx`): "This week" plank over an empty board. `TALLY_TEXT_RECT = {x:-64, y:-92, width:128, height:52}`.
- **Plot** (`Plot.tsx`): staked plot with signpost for `brief`, `no-folder` ("no folder set", with a stake and an empty tag), `no-progress` ("no progress file yet", pointing sign) and `unknown`.
- **Ground** (`Ground.tsx`): grass with tufts, a cobbled 2:1 plaza, dirt paths drawn from the shared network in `network.ts` (section 11.3), lantern posts, ten framing trees.

### Anchors exported

`HEARTH_LODGE_ANCHORS`, `WORKSHOP_ANCHORS`, `TOWN_HALL_ANCHORS`, `GATEHOUSE_ANCHORS`, `TAVERN_ANCHORS`, `QUEST_BOARD_ANCHORS`, `CHRONICLE_ANCHORS`, `TALLY_ANCHORS`, `PLOT_ANCHORS` (all `BuildingAnchors`: `door`, `roof`, `workSpots`). Project buildings have 8 work spots (two rows in front of the lit face; the lodge's lie inside the garden). Extra named exports: `TOWN_HALL_STEP_SPOTS`, `TOWN_HALL_NOTICE_RECT`, `GATEHOUSE_SPOTS`, `TAVERN_SIT_SPOTS`, `TAVERN_STAND_SPOTS`, `QUEST_BOARD_NOTE_RECT`, `QUEST_BOARD_SPOTS`, `CHRONICLE_TEXT_RECT`, `CHRONICLE_SPOTS`, `TALLY_TEXT_RECT`, `Rect`.

## 6. Recommended scene layout (viewBox 0 0 1600 1000)

Defined in `src/art/layout.ts` (`SCENE`, `gridToScene`). Origins are each component's local origin. Draw order: `Ground`, then buildings and square pieces sorted by y, then characters sorted by y, then HTML overlays.

| Element | Scene position | Notes |
| --- | --- | --- |
| Town hall | (800, 390) | top-centre; belfry reaches y ~50; steps to y ~430 |
| Quest board | (610, 590) | left of the square |
| Chronicle scroll | (990, 590) | right of the square |
| Weekly tally | (800, 690) | centre of the square, front |
| Gatehouse | (800, 930) | village entrance, bottom-centre; path runs up to the plaza |
| Tavern | (1240, 800) | bottom-right |
| Plaza | centre (800, 600), half-size 310 x 155 | cobbles, 2:1 |
| Hearth Lodge | `gridToScene(3, 2)` = (1260, 470) | right; garden spans about x -172..+120, y -60..+86 around it |
| Cartographer's Workshop | `gridToScene(-3, 2)` = (340, 470) | left |
| Chapel / Well / Herbalist hut / Schoolhouse | (1490, 335) / (575, 820) / (1490, 760) / (300, 735) | specialists, phase 3 (section 11.2) |

`gridToScene(gx, gy) = (800 + 153.3 gx, 410 + 30 gy)`. Where characters stand (add the component position to the local spot):

| Location kind | Spots |
| --- | --- |
| `building` | the building's `workSpots` (first free one in order) |
| `gatehouse` | `GATEHOUSE_SPOTS`; the paladin takes index 0, reviewers wait on the rest |
| `town-hall-steps` | `TOWN_HALL_STEP_SPOTS`; orchestrator index 0, blocked agents (with "!") from index 1; the orchestrator is on the steps even when not blocked |
| `quest-board` | `QUEST_BOARD_SPOTS`, pose `study` |
| `tavern` | `TAVERN_SIT_SPOTS` (pose `rest`, `mug`, `sleepy` after 24 h), overflow on `TAVERN_STAND_SPOTS` |

The bard troupe is one `<Troupe>` placed at one spot (width = 24 x personas). The herald may use `CHRONICLE_SPOTS`.

## 7. Signals

Text labels come from the UI (`HealthSignal.label`); icons are `SignalIcon`.

| Signal | Scene visual | Icon shape (`SignalIcon kind`) | Token |
| --- | --- | --- | --- |
| Active | Chimney smoke (brazier on a tripod before there is a chimney), lit windows | chimney with smoke wisps (`active`) | `--va-sig-active` |
| Needs you | Roof banner with a bold "!" and a count badge (pole on the plot before there is a roof) | flag banner with "!" (`needs-you`) | `--va-sig-needs` |
| Failing | Dark storm cloud with rain and lightning over the building | storm cloud with bolt (`failing`) | `--va-sig-failing` |
| User friction | Masked figure with a frown sitting on the doorstep | frowning mask (`friction`) | `--va-sig-friction` |
| Stale | Vines creeping up the walls (or up stakes and sign on a plot) | vine with leaves (`stale`) | `--va-sig-stale` |
| Released | Teal flag with a star on the roof; fireworks play once | flag on pole (`released`) | `--va-sig-released` |
| doing | worker animation at the building | hammer (`doing`) | `--va-sig-doing` |
| review | scroll to the paladin | rolled scroll (`review`) | `--va-sig-review` |
| blocked | glowing "!" over the head | octagon with "!" (`blocked`) | `--va-sig-blocked` |
| todo | studies the quest board | pinned note (`todo`) | `--va-sig-todo` |
| idle | mug at the tavern, "zzz" after 24 h | steaming mug (`idle`) | `--va-sig-idle` |
| unknown agent | hooded stranger | hooded figure with "?" (`stranger`) | `--va-sig-stranger` |
| no folder | stake with an empty tag | stake and tag (`no-folder`) | `--va-sig-nofolder` |
| no progress file | pointing signpost | two-arm signpost (`no-progress`) | `--va-sig-noprogress` |

Overlays on a building come from `BuildingArtProps.signals`; they combine freely (needs-you banner on the left of the ridge, released flag on the right).

## 8. Motion

`motion.css`: all animation lives inside `@media (prefers-reduced-motion: no-preference)`. With reduced motion the art is a still pose, smoke is a static stack of puffs, fireworks stay as static sparks, flags and banners hang flat. Manual override: any ancestor with `data-motion="reduce"` disables every art animation, regardless of the OS setting. Loops: breathing, walking legs and body bob, smoke rising, flag and banner waving, window flicker, cloud drift, rain, lightning, vine sway, "!" pulse, "zzz". Work (pose `work` only): swing, scribble, aim, wave, bob, paint, toot, tick. Fireworks and the build burst: `animation-iteration-count: 1` (fireworks: three bursts staggered 0.6 s; the burst has no output at all under reduced motion). Day-part colour changes are CSS transitions of registered custom properties (section 11.1). Transform origins are the local origin (0,0); art draws tools and flags around (0,0) in translated groups, so no `transform-box` is needed.

## 9. Accessibility

- All character, building and overlay art is `aria-hidden`; the UI supplies names, roles, statuses and tooltips as text and puts the buildings' and characters' focusable wrappers around them.
- Icons are `aria-hidden` unless a `title` prop is given (then `role="img"` with `aria-label`).
- No signal relies on colour alone (shape + text). Contrast verified in section 3.
- All art colours are tokens, so a high-contrast or commissioned theme only replaces `tokens.css`.

## 10. Contract changes

- `contract.ts` is unchanged in types. The header comment's "buildings fit within y -230..20" is superseded: building origins are the footprint centre and buildings extend roughly x -105..105, y -190..+75 (the lodge with garden x -172..+120).
- Phase 3: `Pose` gained `'walk'`; `DayPart`, `DayPartIconProps`, `RingBox` and a re-export of `SpecialistPlace` (from `src/data/types`) were added; `Ground` takes optional `id`s in `projectSpots` and `lanterns`; `Fireworks` takes a single point or three. Everything else is additive (section 11).
- Added (non-breaking): `src/art/layout.ts` (`SCENE`, `gridToScene`), `Rect` type, per-component anchor/rect/spot exports (section 5), `ChronicleScroll` and `TallySign`, `Tree`, `SignPost`, `Plot`.

## 11. Phase 3 (polish)

### 11.1 Day parts

Four scene palettes (`dawn`, `day`, `dusk`, `night`) for both UI themes. Only scene tokens change: ground (grass x3, path x2, plaza x2, water, sky glow), materials (wood, plaster, stone, roof, slate, thatch, window, smoke, cloud, vine, leaf, canvas, highlight), the shadow colour and the numbers `--va-shadow-opacity`, `--va-shade-opacity`, `--va-sky-glow-opacity` and `--va-lamp`. UI, paper, ink, signal, outline, gold and character colours never change, so UI contrast keeps passing.

**Attribute contract (what the UI must set).** Put `data-daypart="dawn|day|dusk|night"` on the scene wrapper element (the div around the scene SVG, or the SVG element itself), not on `<html>`. The palette is picked from the theme on `:root` (`data-theme="light|dark"`, or the OS preference when `data-theme` is not set) combined with that attribute. Without the attribute nothing changes from phase 1. For a smooth change set only the attribute; no JS animation is needed.

**Smooth transition without JS.** The changing tokens are registered with `@property` (`<color>` or `<number>`, `inherits: true`), and `[data-daypart]` carries `transition-property` for all of them, 2.5 s ease-in-out. The rule sits inside `@media (prefers-reduced-motion: no-preference)` and is switched off by `[data-motion="reduce"]` on the wrapper or any ancestor, so with reduced motion the palette snaps. Needs a browser with `@property` (Chrome 85+, Safari 16.4+, Firefox 128+); elsewhere the palette snaps. The whole subtree repaints for 2.5 s once per change; only do it when the day part really changes.

**Palette rationale.** Light and dark are each a full set, not one filter. Day (light) is the phase 1 palette. Dark/day is a dim daylight (the phase 1 dark palette is the "night village" you get when no day part is set). The ground colours are tuned so the focus ring keeps 3:1 against them in every part: the light focus ring (`#1c5db5`) needs a light ground, so **light-theme night is a pale moonlit meadow** (silver blue-green ground, darker blue-grey buildings, lit lamps); the dark focus ring (`#7db4ff`) needs a dark ground, so dark-theme dawn/day/dusk are dim. A palette script checks this (`npm test`, `src/art/art.test.ts`).

Key tokens per palette:

| Theme | Part | grass | path | plaza | water | sky glow | wood | roof | plaster | stone | thatch | slate | shadow / shade opacity | sky glow opacity | lamp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light | dawn | `#b2c27a` | `#e3bf9a` | `#e2cdb6` | `#8fb0c8` | `#ffb0a0` | `#b2784e` | `#be624a` | `#f0d7b8` | `#b5a396` | `#daa958` | `#6e798f` | 0.26 / 0.2 | 0.3 | 0 |
| light | day | `#9bbf5e` | `#dcc08a` | `#dccfae` | `#6fb3c9` | `#fff0c0` | `#a66f3e` | `#b4553a` | `#f0e0bd` | `#aaa294` | `#d6a94a` | `#55708c` | 0.22 / 0.2 | 0.35 | 0 |
| light | dusk | `#bcc370` | `#e9be84` | `#e5cfa9` | `#86a8b4` | `#ff9a4a` | `#ab6e3a` | `#b65b38` | `#e3c49a` | `#ae957b` | `#cf9a44` | `#6e6f76` | 0.26 / 0.22 | 0.35 | 0.8 |
| light | night | `#a4bdbc` | `#d5ccba` | `#d6d0ca` | `#8cb0cc` | `#cfe0ff` | `#64514e` | `#6a454c` | `#87878b` | `#666a77` | `#7a6d54` | `#3d5274` | 0.14 / 0.26 | 0.3 | 1 |
| dark | dawn | `#314937` | `#5f4d3c` | `#554948` | `#35657f` | `#ff9a8a` | `#926040` | `#8f4a3d` | `#b79f84` | `#847873` | `#aa8143` | `#4f5b72` | 0.3 / 0.3 | 0.1 | 0 |
| dark | day | `#32492c` | `#5a492f` | `#51473c` | `#3a7089` | `#fff0c0` | `#a16d41` | `#9e543e` | `#cdb993` | `#918a7e` | `#be9546` | `#50687d` | 0.3 / 0.26 | 0.08 | 0 |
| dark | dusk | `#33482a` | `#644b30` | `#554639` | `#335c70` | `#ff9a4a` | `#8f5a31` | `#8d472f` | `#b29570` | `#837160` | `#a67934` | `#515660` | 0.34 / 0.3 | 0.1 | 0.8 |
| dark | night | `#233b36` | `#4a4437` | `#464550` | `#223c58` | `#a8c0f0` | `#514039` | `#4f3337` | `#666560` | `#484e57` | `#5f533b` | `#293d56` | 0.3 / 0.34 | 0.1 | 1 |

**Night, lamps and project windows (decision).** `--va-lamp` (0 at day and dawn, 0.8 at dusk, 1 at night) drives `LitPane` (lit glass plus a soft halo) on the town hall (two wing windows and the round window), the tavern (three windows) and the gatehouse (four arrow slits), and the glow of every `Lantern`. These are civic buildings, so lamps on them mean "evening". **Project buildings do not light their windows because it is night.** Their rule from phase 1 stays exactly as it was: lit windows plus chimney smoke mean the signal Active (or the released building). Lighting them by the clock would fake that signal and make a dark, idle project at night look busy. At night a project that is not Active simply stays dark among the lit civic buildings, which makes Active easier to spot, not harder. The specialist buildings (11.2) have no lamps for the same reason: no smoke, no lit windows.

**Contrast at night.** Ratios for the scene-dependent pairs (focus ring against ground, raw and with the sky glow laid over it at its maximum opacity; lowest of the four ground tokens shown for the glow column):

| Theme | Part | focus on grass | on grass-3 | on path | on plaza | lowest with sky glow | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | dawn | 3.32 | 3.76 | 3.71 | 4.16 | 3.37 | pass |
| light | day | 3.05 | 3.68 | 3.64 | 4.14 | 3.82 | pass |
| light | dusk | 3.41 | 3.93 | 3.71 | 4.21 | 3.21 | pass |
| light | night | 3.22 | 3.78 | 4.01 | 4.18 | 3.65 | pass |
| dark | dawn | 4.60 | 3.81 | 3.77 | 4.05 | 3.23 | pass |
| dark | day | 4.63 | 4.02 | 4.05 | 4.25 | 3.28 | pass |
| dark | dusk | 4.69 | 3.89 | 3.80 | 4.24 | 3.26 | pass |
| dark | night | 5.62 | 4.71 | 4.53 | 4.42 | 3.65 | pass |

All UI pairs (name tag text and border on the tag background `--va-surface`, "!" ink on alert-glow, the Needs-you card text and alert/accent text on surface, signal pill text and the 14 signal icons on the pill background `--va-surface`, parchment text) are untouched by the day part and are listed in section 3 with a Night column; every one passes. Lowest ratios at night (light / dark): name tag text on the tag background (text on surface) 13.98 / 12.91 and the tag state line (text-muted on surface) 7.09 / 7.98; tag border 4.39 / 4.32 (target 3); "!" ink on alert-glow 11.65 / 11.65; Needs-you card text on surface 13.98 / 12.91, alert on surface 6.28 / 6.96, accent on surface 6.28 / 7.52; signal pill text on surface 13.98 / 12.91 and the weakest pill icon (sig-active on surface) 4.49 / 7.57; parchment text (ink on parchment) 12.61 / 9.90; sign text (ink on sign) 10.33 / 7.32; focus ring on night grass 3.22 / 5.62 and on night path 4.01 / 4.53 (target 3).

`DayPartIcon kind="dawn|day|dusk|night"` (24 px, outline `--va-text`, aria-hidden unless `title`): sun low on the horizon with an up arrow, a full sun with eight rays, a half sun on the horizon with a down arrow and a base line, a crescent moon with a small star. Always pair it with the part's name as text.

### 11.2 Specialist buildings

Same style as the village (isometric boxes, warm outline, one light from the top left). Each is a component, an anchors export and a focus ring box; all four use the shared `GabledHouse` shell (`src/art/specialists/House.tsx`). None draws smoke or lit windows: they are places, not projects. Characters stand on the `workSpots` (3 in the front row, 2 behind); leave about 40 units under each character for the name tag.

| Place (SpecialistPlace) | Agent / class | Component | Look | Scene position |
| --- | --- | --- | --- | --- |
| `chapel` | content-safety-reviewer, cleric | `Chapel` | small stone chapel, slate roof, bell turret on the ridge with a gold bell, arched door, lancet windows, gold sun window above the door | (1490, 335): right of the Hearth Lodge, clear of the lodge ring (which ends at x 1394) |
| `well` | relationship-advisor, elder-counselor | `VillageWell` | round stone well with wooden roof on two posts, windlass, hanging bucket, water, a bench | (575, 820): bottom left of the plaza beside the gate path |
| `herbalist` | womens-health-advisor, healer | `HerbalistHut` | thatched hut, herbs drying in bundles along the eave, half door, leaf sign, three raised herb beds (lavender, sage, flowers) | (1490, 760): right, below the lodge, right of the tavern |
| `schoolhouse` | parenting-advisor, teacher | `Schoolhouse` | plank-walled schoolhouse, red tile roof, bell turret, double door, slate board on legs with chalk drawings (no text) | (300, 735): left, below the workshop |

Exports: `Chapel`, `VillageWell`, `HerbalistHut`, `Schoolhouse`; `CHAPEL_ANCHORS`, `WELL_ANCHORS`, `HERBALIST_ANCHORS`, `SCHOOLHOUSE_ANCHORS` (`BuildingAnchors`); `SPECIALIST_ANCHORS`, `SPECIALIST_RINGS` (`Record<SpecialistPlace, RingBox>`, `{x, y, w, h}` in local coordinates, like the UI's RING boxes), `SPECIALIST_ORIGINS`, `SPECIALIST_PLACES`; per-place `*_SPOTS` and `*_RING`. The positions are in `SCENE` (keys `chapel`, `well`, `herbalist`, `schoolhouse`). Space: none overlaps an existing building, the Needs-you card area (x 600..1000, y 40..300), the town square boards or a path (tested in `art.test.ts`). Four framing trees moved to make room.

### 11.3 Path network

`src/art/network.ts` exports `PATH_NODES: Record<string, {x,y}>` and `PATH_EDGES: Array<[string, string]>` (scene coordinates, straight segments, bends are junction nodes), `pathNetwork(projectSpots)` and `routeAlongPaths(net, fromId, toId)` (Dijkstra, returns the points to walk, `[]` when unknown or unconnected). `Ground` draws every edge from the same network, so a walker that follows the edges stays on a visible path.

- Static nodes: `gate`, `junction-gate`, `plaza` (centre, lifted to y 560 so walkers are not hidden behind the tally board, which covers y 598..690), `plaza-n`, `plaza-ne`, `plaza-e`, `plaza-se`, `plaza-s`, `plaza-sw`, `plaza-w`, `plaza-nw`, `hall` (foot of the steps), `quest-board`, `chronicle`, `tavern`, `chapel`, `well`, `herbalist`, `schoolhouse` (each a point just in front of the door) and the junctions `junction-tavern`, `junction-east`, `junction-chapel`, `junction-herbalist`, `junction-west`, `junction-school`.
- `pathNetwork(spots)` adds `door:<projectId>` at the spot plus an offset (default (-96, 50): in front of the Hearth Lodge garden gate; pass `door` per spot to change it) and joins it to the nearest plaza edge node (`plaza-w`, `plaza-e`, `plaza-sw`, `plaza-se`).
- Boards stand on the plaza, so routes pass in front of them (y 655 and below) or through the gaps above the tally board; no node sits behind a board.
- Lanterns: `LANTERN_SPOTS` (8 posts beside junctions, scene coordinates of the foot). `Ground` draws them by default (`lanterns={false}` to skip and place `Lantern` yourself).

### 11.4 Content pipeline cart and track

`PipelineCart` (local origin = wheel contact centre, about 40 wide, 30 tall): a two-wheeled hand cart with a crate of scrolls. **Meaning: open work is waiting at this stop of the content pipeline.** The UI draws it only at stops that hold real open items and supplies the count label as text; nothing is drawn for empty stops. `PIPELINE_STOPS` (scene points, one per `PipelineStopId`): tavern (1306, 858), chapel (1546, 392), well (664, 858), herbalist (1546, 846), schoolhouse (350, 792), town-hall (952, 458); `PIPELINE_ORDER` is the walking order tavern, chapel, well, herbalist, schoolhouse, town-hall.

`PipelineTrack points={Pt[]}`: two dashed cart ruts (wood-dark at 42 % opacity) through the ordered points; nothing for fewer than 2 points. **Meaning: the route work takes between stops; draw it only while at least one stop is active.** Build the points with `routeAlongPaths` between consecutive active stops so the ruts lie on the visible paths (straight lines between stops cut across the grass).

### 11.5 Walk pose

`Pose` gained `'walk'` (Character and Troupe). Each leg is a group pivoting about the hip; `.va-pose-walk .va-leg-a|b` rotate +-26 degrees, alternating (0.7 s per half stride), and `.va-walk-bob` lifts the body 2 px every step (0.35 s). Both loops are in the no-preference block and off under `[data-motion="reduce"]`; with reduced motion the figure stands, with its legs straight. The held item is not animated while walking.

**Facing.** `flip` mirrors only the figure (a `scale(-1 1)` group inside the character): held items swap sides with it, which reads as facing the other way; the "?" on the stranger counter-mirrors itself (`Unflip`), and the "zzz" and the "!" alert sit outside the mirror, so no glyph ever reads backwards. No other class draws text. Painted shade and highlight mirror with the figure (the light on a flipped figure comes from the top right); at figure size this is not visible.

### 11.6 Build burst and fireworks

`BuildBurst at={pt} width?`: six dust puffs (smoke colour) and five wood chips rise from the base and fade, **once** (1.2 s, `animation-iteration-count: 1`, `fill-mode: both`), for a growth-stage change. `at` is the footprint centre, `width` the rough building width (scales the effect, default 110). Under reduced motion (OS setting or `data-motion="reduce"`) the element is `display: none`: no output at all, so the UI cross-fades the stages instead. Remount it (change its `key`) to play it again.

`Fireworks at={Pt | Pt[]}`: three bursts that run **once** (2.4 s each, staggered 0.6 s, iteration-count 1, then gone). A single `Pt` gives three bursts around that point, so it works standalone: `<g transform="translate(x y)"><Fireworks at={{ x: 0, y: -190 }} /></g>`. Under reduced motion the sparks stay as a still sparkle for as long as the UI keeps it mounted; the UI should mount it once on reaching `released`.

### 11.7 Layers for the scene (draw order)

1. `Ground` (grass, paths, plaza, trees, lantern posts and their light pools).
2. Structures sorted by y, as before (now including the four specialist buildings), then the pipeline carts (they sit beside buildings; sort them with the structures by their y).
3. Characters sorted by y, then name tags and pills, then the Needs-you card.
4. `PipelineTrack` goes right after `Ground` (under everything), `BuildBurst` and `Fireworks` go above the building they belong to (after the structures, before characters).
Day-part tint needs no overlay: the tokens already recolour the art, and lamps are part of the art (`Lantern` in `Ground`, `LitPane` in the buildings). Do not put a full-scene colour overlay over the characters or tags: it would break the name-tag and "!" contrast.

## 12. Art pass (T31): the painted look

Goal: from flat vector shapes to a cozy, hand-painted look, still drawn entirely in code. All art is original. Nothing in `src/ui`, `contract.ts` types or component props changed; `src/art` only (plus the additive `ArtDefs` export).

### 12.1 Light and shading

One light, top left, everywhere (unchanged from section 1), now with more cues:

- **Lit faces** (left-front walls, left roof planes, tower sides): `va-g-lit`, a diagonal sheen from the top left (`--va-highlight` at `--va-sheen-opacity`). **Shaded faces** (right walls, gables): the old `--va-shade` overlay plus `va-g-dim`, darker towards the bottom.
- **Ambient occlusion** on every wall face: `va-g-ao-base` (foot of the wall), `va-g-ao-top` (under the eave) and `va-g-corner` (inner corner of the lit face). Strength `--va-ao-opacity`.
- **Contact shadows**: `GroundShadow` is now a wide soft cast shadow falling to the bottom right plus a tighter contact ellipse, both `va-g-contact` (a radial fade of `--va-shadow`). Characters, lanterns, carts, trees, braziers and the plot stakes use the same gradient instead of flat ellipses.
- **Volume** on round things (tree crowns, heads, hands): `va-g-sphere`, highlight top left, shade bottom right. Clothing uses `va-g-cloth` (lit left, shaded right) plus fold strokes.

### 12.2 Materials and textures

Every texture is an overlay drawn on top of the flat token fill (`FaceFx`, `RoofFx`, `FlatFx` in `buildings/iso.tsx`; `Box` takes an optional `tex`). Patterns live in user space, so on a wall face they skew with the face (drawn inside `leftFaceTf` / `rightFaceTf`), and roof patterns carry a `skewY(26.565)` so rows follow the roof plane.

| Material | Pattern id | Used on |
| --- | --- | --- |
| Meadow | `va-p-mottle`, `va-p-grass`, `va-p-flowers` | ground: soft patches, grass blades, tiny flowers (160 / 400 / 320 unit tiles) |
| Dirt | `va-p-dirt` | paths: grit and pebbles, plus kerb stones drawn as one dab path along the edges (skipped near junctions) |
| Paving | `va-p-cobble` | plaza: running-bond flagstones laid on the ground plane (2:1 matrix), light and dark stones, joints in `--va-plaza-2` |
| Stone | `va-p-stone` | plinths, chimney, chapel, gatehouse towers and lintel, town hall base and steps, well ring |
| Logs | `va-p-logs` | Hearth Lodge walls and gable (rows aligned to the old 7 unit log courses) |
| Planks | `va-p-planks` | doors, window shutters, schoolhouse, tavern table, quest board and sign posts, well roof |
| Plaster | `va-p-plaster` | workshop, tavern, hut, town hall facade, wing and gables |
| Thatch | `va-p-thatch` | tavern and herbalist roofs |
| Roof tiles | `va-p-tiles` | lodge and schoolhouse roofs |
| Slate | `va-p-slate`, `va-p-slate-r` | workshop, chapel, town hall (the wing rises to the right, so it uses the mirrored one) |

Small additions that are plain shapes, not patterns: window shutters and sills on the project buildings (not on the narrow workshop lit face), bark and root flare on trees, kerb stones, tuft shadows, a dashed inner bevel on the plaza.

### 12.3 Shared defs

`src/art/ArtDefs.tsx` exports `ArtDefs` (one `<defs>`) and `ART_DEF_IDS`. It is mounted **once**, inside `Ground`, which the scene already mounts once, so no `src/ui` change is needed. Ids are stable: gradients `va-g-grass`, `-sky`, `-vignette`, `-lit`, `-dim`, `-ao-base`, `-ao-top`, `-corner`, `-contact`, `-sphere`, `-cloth`, `-lampglow`, `-flame`; patterns `va-p-grass`, `-mottle`, `-flowers`, `-dirt`, `-cobble`, `-stone`, `-logs`, `-planks`, `-plaster`, `-thatch`, `-tiles`, `-slate`, `-slate-r`. All per-instance `useId` gradients (ground, lanterns, brazier flame, project building walls) are gone; `art.test.ts` checks that ids are unique, that every `url(#va-...)` the components use is defined, and that no `useId` is left.

Fallback: because the base fill stays flat and every painted layer is a separate overlay, a component rendered where the defs are not mounted (for example a legend swatch while the list view is showing and `Ground` is not in the document) simply shows the flat fill without texture and without the soft shadow. Nothing disappears. `ArtDefs` and `ART_DEF_IDS` are exported from `src/art/index.ts`; the UI mounts `<ArtDefs />` once in a hidden 0x0 svg for the list view and legend. To get the painted look anywhere else, render `<svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><ArtDefs /></svg>` once (not `display:none`: browsers drop gradient references inside a hidden svg).

### 12.4 New tokens

All in `tokens.css`, in `:root`, `:root[data-theme="dark"]` and the OS-dark `@media` block. They do not change by day part: the colours the layers use (`--va-highlight`, `--va-shade`, `--va-shadow`, grass, path, plaza, stone, wood, roof tokens) already do, so textures follow dawn, day, dusk and night.

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `--va-tex-opacity` | 0.9 | 0.75 | overall strength of texture patterns |
| `--va-sheen-opacity` | 0.4 | 0.22 | lit-side sheen |
| `--va-ao-opacity` | 0.38 | 0.5 | ambient occlusion and vignette strength |
| `--va-tex-dark`, `--va-tex-light` | 0, 0.75 | 1, 0.35 | polarity of ground marks, see below |
| `--va-vignette` | 0 | 1 | darkening towards the scene edges (dark theme only) |
| `--va-blush` | #e8806a | #d9735f | cheeks |
| `--va-flower-1..3` | #f6f0e0, #e9a0bc, #f0c64a | #cfc8b4, #b97a92, #c9a23a | meadow flowers |

**Polarity rule (why the ground texture differs per theme).** The focus ring is dark blue in the light theme (it needs a light ground) and pale blue in the dark theme (it needs a dark ground). Light-theme day grass is only 3.05:1 against the ring, so adding dark marks to it would break the rule. In the light theme the ground marks are therefore only lighter than the ground (sun-bleached blades, light pebbles, light flagstones, no vignette); in the dark theme they are mostly darker (dark blades and specks, vignette, a few pale flowers at 35 %). Net effect: the average ground colour never moves towards the ring colour.

### 12.5 Characters

Same silhouettes, props and animation classes; the poses (including walk) are untouched because only fills were added inside the existing groups. No filters.

- **Faces** (`Face`): ears, a soft sphere gradient, blush cheeks, eyes with a white, a pupil and a catch-light, brows, a hint of nose, the small mouth. Hair gets highlight and shade strands. Classes with a beard, mask, goggles or spectacles draw those over the face exactly as before.
- **Clothing**: a `va-g-cloth` overlay on robes, tunics and legs, fold strokes (shade colour, 0.3 opacity), a collar line in the trim colour, plate lines on armour. Arms get a highlight stroke, hands a sphere overlay. The troupe gets the same cloth overlay and folds.
- **Contact shadow** under every figure (`va-g-contact`, two ellipses).
- Class props are unchanged (section 4); they gained no new detail because at ~64 units tall the face and clothing changes are what read on screen.

### 12.6 What stays highest-contrast

Detail never competes with signals. Draw order is unchanged (section 11.7): ground, structures (with their overlays inside each building: AO, texture, sheen, then windows, doors and signs on top), then signal overlays (banner, smoke, cloud, vines, flags, friction figure), characters, the "!" marker, then HTML name tags, XP badges and the Needs-you card. Specifically:

- Texture, sheen and AO are low-opacity overlays (pattern groups at `--va-tex-opacity`, marks at 0.1 to 0.6 of that), never full-colour shapes.
- No texture sits on any text plank (Review, Quest board, Chronicle, This week, Bro, signposts), on the parchment boards the UI writes on, or on the Needs-you banner. The "!" marker and glow, the signal icons and the HTML tags are drawn after everything painted.
- The ground is the only layer that is wide, so its marks are the faintest and follow the polarity rule above.

**Contrast re-check.** A script computed from `tokens.css` re-ran every pair in section 3 (70 rows, both themes, base and night columns) and the day-part matrix in section 11 (both themes, four times of day, raw and with the sky glow). All unchanged and all pass; the only edits are the last decimal of seven "lowest with sky glow" cells in 11.1, now computed rather than copied. Tightest existing pairs: light-day focus on grass 3.05, light-dusk with sky glow 3.21, dark-dawn with sky glow 3.23.

New pairs introduced by T31 (the ring on the textured ground, area-averaged: blades 14 to 20 %, specks 3 %, flowers 0.6 %, grit 10 to 14 %, joints 20 %, flagstones 25 to 30 %, then the large mottle patches and the vignette applied at full coverage as a local worst case; target 3:1; also enforced by `art.test.ts`):

| Theme | Part | grass | grass-3 | path | plaza | Result |
| --- | --- | --- | --- | --- | --- | --- |
| light | dawn | 3.38 | 3.77 | 3.69 | 3.96 | pass |
| light | day | 3.14 | 3.69 | 3.63 | 3.93 | pass |
| light | dusk | 3.48 | 3.94 | 3.62 | 4.02 | pass |
| light | night | 3.30 | 3.78 | 3.64 | 3.89 | pass |
| dark | dawn | 4.58 | 3.95 | 3.38 | 4.12 | pass |
| dark | day | 4.62 | 4.14 | 3.48 | 4.30 | pass |
| dark | dusk | 4.66 | 4.04 | 3.46 | 4.33 | pass |
| dark | night | 5.60 | 4.88 | 4.38 | 4.57 | pass |

| Pair | Use | Target | Light | Dark | Result |
| --- | --- | --- | --- | --- | --- |
| outline on mask | pupil on the eye white | 3:1 | 10.26 | 12.79 | pass |
| outline on skin-1 | brows, mouth | decorative | 7.32 | 9.19 | n/a |
| outline on skin-2 | brows, mouth | decorative | 4.08 | 5.08 | n/a |
| outline on skin-3 | brows, mouth | decorative | 1.92 | 2.61 | n/a |

The eyes carry the face (white and pupil pass everywhere); brows and mouth are decorative detail, not signal, so they have no target. On the darkest skin tone (skin-3) they are faint, which is acceptable because no information depends on them. As before, the ring is also drawn with its 4 px `--va-surface` halo, which is what carries WCAG 1.4.11.

### 12.7 Performance

No SVG filters anywhere. Gradients and patterns are defined once (about 13 gradients and 13 patterns, all static); characters use only gradient-filled shapes, so the walking sprites stay cheap (each figure gained roughly 12 small elements, no new resources). The ground is five full-size static layers (gradient, mottle, grass, flowers, sky glow) plus the vignette, all rasterised pattern tiles. Day-part transitions already repaint the scene for 2.5 s; the new tokens used inside the defs (`--va-grass-2`, `--va-highlight`, ...) are the registered ones, so they interpolate like before.

### 12.8 Replacing it with commissioned art

The contract is unchanged: components take the same props and export the same anchors, and all colours are tokens. To replace the look wholesale, swap the components in `src/art` (the UI only imports from `src/art/index.ts`). To tone it down or retheme without touching components: set `--va-tex-opacity`, `--va-sheen-opacity` and `--va-ao-opacity` to 0 and every painted layer disappears, leaving the flat phase 1 to 3 look; or edit the patterns in `ArtDefs.tsx` (one file). Commissioned raster or SVG art can reference its own defs; nothing else depends on the ids above except `art.test.ts`.
