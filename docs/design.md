# Agent Village: design (v1, phases 1 to 3)

Owner: ui-designer. Code: `src/art/**`. Tokens: `src/art/tokens.css`. Motion: `src/art/motion.css`.
Rule of the village: every visual encodes a signal. Ground, paths, framing trees and (since T39) a few hedges, bushes, rocks, flower beds and fences kept clear of every path and building are the only decoration (sections 12 and 13).

## 1. Art direction

- **Mood.** Cozy, warm, hand-painted. Daylight is honey-gold; the dark theme is a warm night village (lamp-lit windows, deep green grass, amber glow), not an inverted filter.
- **Light.** One light source, top-left, always. Left-front faces are lit, right-front faces get a shade overlay (`--va-shade` at `--va-shade-opacity`). Since T39 cast shadows are the building's own footprint swept to the bottom-right (section 13.1); before that they were soft ellipses.
- **Outline and shading.** Every shape has a warm brown outline (`--va-outline`, 1.1 units, round joins; near-black brown in dark). Flat fills plus three painted cues: a highlight sliver on the lit side, a shade overlay on the far side, and a thin wood-light core on beams. No blur filters. Since T31 the gradients and patterns are shared defs with stable ids (section 12); components keep flat token fills and add painted overlays on top. Since T39 the outline has three weights (section 13.3).
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
| `--va-focus` | #0c2f6e | #7db4ff |
| `--va-accent` | #9c4220 | #f0a060 |
| `--va-alert` | #b3261e | #ff8a7a |
| `--va-parchment` | #f2e0b4 | #dcc794 |
| `--va-ink` | #2b1c10 | #2b1c10 |
| `--va-grass` | #6d9434 | #32512b |
| `--va-wood` | #a56329 | #995b28 |
| `--va-roof` | #b74429 | #963c25 |
| `--va-window-lit` | #ffd27a | #ffd27a (glows against the night) |

Focus ring: 2 px `--va-focus`, 2 px offset (UI owns the CSS; the colour is verified below).

## 3. Contrast (computed, WCAG relative luminance)

Targets: text >= 4.5:1, signal icons / borders / focus ring >= 3:1. Generated from `tokens.css` by a script, so it matches the file. Every pair passes in both themes (re-verified after the T31 art pass: all 70 rows unchanged, new T31 pairs in section 12.6; re-verified after the T39 art pass: all rows unchanged except the seven focus-ring rows, which rise in the light theme because `--va-focus` is now a darker navy, see section 13.5) and, since phase 3, at night in both themes: the Light/Dark columns use the base tokens (no `data-daypart`), the Night columns use the night palette. UI, paper, ink and signal tokens do not change by day part, so those rows have the same ratio in every column; only the scene-dependent rows (focus ring on grass, light grass, path and plaza) move. The full day-part matrix is in section 11. Icons are additionally outlined with `--va-text`, so their shape holds even if a fill is close to the background.

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
| focus on bg | focus ring | 3:1 | 10.67 | 8.38 | 10.67 | 8.38 | pass |
| focus on surface | focus ring (also the halo under the ring) | 3:1 | 12.25 | 7.47 | 12.25 | 7.47 | pass |
| focus on surface-2 | focus ring | 3:1 | 9.92 | 6.42 | 9.92 | 6.42 | pass |
| focus on grass | focus ring on grass | 3:1 | 3.60 | 4.19 | 6.42 | 5.59 | pass |
| focus on grass-3 | focus ring on light grass | 3:1 | 5.04 | 3.23 | 7.54 | 4.73 | pass |
| focus on path | focus ring on path | 3:1 | 6.58 | 3.28 | 7.99 | 4.54 | pass |
| focus on plaza | focus ring on plaza | 3:1 | 7.33 | 3.56 | 8.34 | 4.40 | pass |
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

Since T39 every figure is drawn 14 % bigger than the 64 unit design height (section 13.4). Source: `src/art/characters/` (`Character.tsx` shell, `looks.tsx` per-class data, `parts.tsx` shared body parts). Each class is a body type (robe, tunic, armor) in its own colour, a distinct head silhouette, and one held item. Held items carry the class work animation (`va-w-*`, motion.css) in pose `work`.

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

**Palette rationale.** Light and dark are each a full set, not one filter. Day (light) is the phase 1 palette. Dark/day is a dim daylight (the phase 1 dark palette is the "night village" you get when no day part is set). The ground colours are tuned so the focus ring keeps 3:1 against them in every part: the light focus ring (`#1c5db5` in phases 1 to 3, `#0c2f6e` since T39) needs a light ground, so **light-theme night is a pale moonlit meadow** (silver blue-green ground, darker blue-grey buildings, lit lamps); the dark focus ring (`#7db4ff`) needs a dark ground, so dark-theme dawn/day/dusk are dim. A palette script checks this (`npm test`, `src/art/art.test.ts`).

Key tokens per palette:

| Theme | Part | grass | path | plaza | water | sky glow | wood | roof | plaster | stone | thatch | slate | shadow / shade opacity | sky glow opacity | lamp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light | dawn | `#81973e` | `#e3b382` | `#ddc0a0` | `#8fb0c8` | `#ffb0a0` | `#b06a37` | `#c54d33` | `#f1bf8d` | `#bf8d75` | `#e7aa45` | `#5b6a8e` | 0.42 / 0.42 | 0.3 | 0 |
| light | day | `#6d9434` | `#dbb56d` | `#d5c395` | `#6fb3c9` | `#fff0c0` | `#a56329` | `#b74429` | `#f1ce91` | `#af9679` | `#e4ac36` | `#3e6491` | 0.36 / 0.42 | 0.35 | 0 |
| light | dusk | `#8c9738` | `#e6b36f` | `#e1c28c` | `#86a8b4` | `#ff9a4a` | `#aa6224` | `#b94a27` | `#edaf6a` | `#c48050` | `#dd9b30` | `#616371` | 0.42 / 0.46 | 0.35 | 0.8 |
| light | night | `#9fbebd` | `#d6ccb4` | `#d7d0c8` | `#8cb0cc` | `#cfe0ff` | `#5e4642` | `#693c46` | `#767681` | `#556179` | `#7d6d4d` | `#29457a` | 0.25 / 0.5 | 0.3 | 1 |
| dark | dawn | `#2e4a35` | `#604d37` | `#574847` | `#35657f` | `#ff9a8a` | `#9d5e35` | `#9a4232` | `#bf9f7c` | `#88766f` | `#b88435` | `#495978` | 0.54 / 0.5 | 0.1 | 0 |
| dark | day | `#2f4a28` | `#5a492a` | `#534739` | `#3a7089` | `#fff0c0` | `#ae6c34` | `#ab4d31` | `#d5bb8b` | `#958b7a` | `#ce9a36` | `#496884` | 0.54 / 0.5 | 0.08 | 0 |
| dark | dusk | `#314926` | `#644b2a` | `#574536` | `#335c70` | `#ff9a4a` | `#9b5825` | `#994123` | `#bb9667` | `#89715a` | `#b57c25` | `#4e5563` | 0.55 / 0.5 | 0.1 | 0.8 |
| dark | night | `#203c36` | `#4a4434` | `#464553` | `#223c58` | `#a8c0f0` | `#553e35` | `#532f34` | `#69675d` | `#454d5a` | `#655536` | `#233c5c` | 0.54 / 0.5 | 0.1 | 1 |

**Night, lamps and project windows (decision).** `--va-lamp` (0 at day and dawn, 0.8 at dusk, 1 at night) drives `LitPane` (lit glass plus a soft halo) on the town hall (two wing windows and the round window), the tavern (three windows) and the gatehouse (four arrow slits), and the glow of every `Lantern`. These are civic buildings, so lamps on them mean "evening". **Project buildings do not light their windows because it is night.** Their rule from phase 1 stays exactly as it was: lit windows plus chimney smoke mean the signal Active (or the released building). Lighting them by the clock would fake that signal and make a dark, idle project at night look busy. At night a project that is not Active simply stays dark among the lit civic buildings, which makes Active easier to spot, not harder. The specialist buildings (11.2) have no lamps for the same reason: no smoke, no lit windows.

**Contrast at night.** Ratios for the scene-dependent pairs (focus ring against ground, raw and with the sky glow laid over it at its maximum opacity; lowest of the four ground tokens shown for the glow column):

| Theme | Part | focus on grass | on grass-3 | on path | on plaza | lowest with sky glow | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | dawn | 3.90 | 5.16 | 6.70 | 7.36 | 4.68 | pass |
| light | day | 3.60 | 5.04 | 6.58 | 7.33 | 5.60 | pass |
| light | dusk | 4.01 | 5.40 | 6.70 | 7.46 | 4.56 | pass |
| light | night | 6.42 | 7.54 | 7.99 | 8.34 | 7.28 | pass |
| dark | dawn | 4.59 | 3.80 | 3.77 | 4.06 | 3.23 | pass |
| dark | day | 4.62 | 4.00 | 4.07 | 4.23 | 3.28 | pass |
| dark | dusk | 4.66 | 3.88 | 3.81 | 4.26 | 3.27 | pass |
| dark | night | 5.59 | 4.73 | 4.54 | 4.40 | 3.64 | pass |

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

**Polarity rule (why the ground texture differs per theme).** The focus ring is dark blue in the light theme (it needs a light ground) and pale blue in the dark theme (it needs a dark ground). Light-theme day grass is only 3.05:1 against the ring, so adding dark marks to it would break the rule. In the light theme the ground marks are therefore only lighter than the ground (sun-bleached blades, light pebbles, light flagstones, no vignette); in the dark theme they are mostly darker (dark blades and specks, vignette, a few pale flowers at 35 %). Net effect: the average ground colour never moves towards the ring colour. T39 note: the light-theme ring is now a darker navy (`#0c2f6e`), which has room for a deeper meadow and for dark marks at 0.75 (`--va-tex-dark`) and a 0.45 vignette in the light theme; the dark theme keeps its rule (dark ground, pale ring).

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

New pairs introduced by T31 (the table below is the T39 re-run with the T39 tokens and the T39 ground marks; the ring on the textured ground, area-averaged: blades 14 to 20 %, specks 3 %, flowers 0.6 %, grit 10 to 14 %, joints 20 %, flagstones 25 to 30 %, then the large mottle patches and the vignette applied at full coverage as a local worst case; target 3:1; also enforced by `art.test.ts`):

| Theme | Part | grass | grass-3 | path | plaza | Result |
| --- | --- | --- | --- | --- | --- | --- |
| light | dawn | 3.27 | 3.94 | 5.33 | 5.44 | pass |
| light | day | 3.02 | 3.78 | 5.22 | 5.37 | pass |
| light | dusk | 3.32 | 4.06 | 5.23 | 5.43 | pass |
| light | night | 4.97 | 5.56 | 5.72 | 5.76 | pass |
| dark | dawn | 4.55 | 3.96 | 3.28 | 4.15 | pass |
| dark | day | 4.61 | 4.14 | 3.40 | 4.29 | pass |
| dark | dusk | 4.64 | 4.05 | 3.35 | 4.36 | pass |
| dark | night | 5.57 | 4.92 | 4.20 | 4.57 | pass |

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

## 13. Art pass 2 (T39): bold storybook look

Why: at 1280 px the T31 pass (section 12) was too subtle; `before-day-light.png` and `after-day-light.png` look nearly identical. T39 keeps every contract, prop, anchor and token name, and pushes light, value range, colour, outlines and ground much harder. The check is `docs/screenshots/after2-*.png` against `after-*.png`. All art is original and drawn in code; nothing is copied or traced from any game.

### 13.1 Light and shadow

- **Form shading.** Right faces now sit at `--va-shade-opacity` 0.42 (was 0.2) plus the `va-g-dim` gradient, so a lit and a shaded face differ by a full value step. Lit faces and roof planes carry `va-g-lit` at `--va-sheen-opacity` 0.62 (was 0.4; dark 0.36, was 0.22) with a warmer, stronger fall-off.
- **Cast shadows.** `Box` (in `buildings/iso.tsx`) now draws a `CastShadow` on the ground whenever it stands on the ground and is 14+ tall: the footprint swept by (0.62 h, 0.3 h) towards the bottom right and hulled with the footprint, in two layers (a harder core and a softer fringe), so the shadow has the building's own footprint shape and a length that follows its height. `Box` takes an optional `castH` when the thing on top is taller than the box (a roof). Project buildings, the specialists and the tavern pass the roof height; the town hall, gatehouse, quest board, chronicle and tally board draw a swept shadow from their ground footprint; trees, the well, characters and props keep a hard-edged blob plus the soft contact shadow (`GroundShadow cast`). Shadow colour in the light theme is a cool violet (`--va-shadow` `#33204a`, was `#3a2a10`) against the warm light; opacity is `--va-shadow-opacity` 0.36 (dark 0.55).
- **Rim light.** A warm line (`--va-highlight` at the new `--va-rim-opacity`, light 0.95, dark 0.5) runs down the lit corner and along the top edge of every lit face of every box of 8+ units and down the lit edge of frontal faces (`FlatFx`).
- **Ambient occlusion.** `va-g-ao-base`, `-ao-top` and `-corner` are about twice as strong (`--va-ao-opacity` 0.6, dark 0.66), and every wall face gets a dark contact band at the foot and a dark band under the eave.
- **Materials read at 1280 px.** Roof rows (thatch, tile, slate) carry a shadow band under every row and heavier row lines, so the courses are visible at 0.78 scale; window glass has a warm reflection (`va-g-glass`).

### 13.2 Palette

Tokens that changed (light = `:root`, the day palette; dark = `:root[data-theme="dark"]`; dawn, dusk and night palettes got the same relative change, see `tokens.css`). Method: ground tokens keep their relative luminance in the dark theme and in light-theme night (so the dark-theme and night ring numbers do not move) and gain saturation (about x1.12); light-theme dawn, day and dusk ground is deliberately darker and richer (luminance x0.55 to x0.76), which the darker focus ring makes possible (13.5); materials are more saturated with a wider value range (dark variants darker, light variants lighter).

| Token | Light before | Light now | Dark before | Dark now |
| --- | --- | --- | --- | --- |
| `--va-focus` | #1c5db5 | #0c2f6e | #7db4ff | #7db4ff |
| `--va-grass` / `-2` / `-3` | #9bbf5e / #86ad4f / #b3cf72 | #6d9434 / #687d32 / #78b335 | #35502f / #2b4327 / #43623a | #32512b / #2c4323 / #396436 |
| `--va-path` / `-edge` | #dcc08a / #bf9f68 | #dbb56d / #bc944e | #6b5638 / #53432c | #6b5632 / #534327 |
| `--va-plaza` / `-2` | #dccfae / #c8b48d | #d5c395 / #c3a977 | #5f5247 / #4f443b | #615144 / #514439 |
| `--va-wood` / `-dark` / `-light` | #a66f3e / #6e4423 / #c98d55 | #a56329 / #5b2f11 / #d58e44 | #8d5c34 / #55341c / #aa7444 | #995b28 / #502a0f / #cb894f |
| `--va-plaster` / `-shade` | #f0e0bd / #d8c397 | #f1ce91 / #c99f5d | #b8a583 / #8f7e63 | #c0a77b / #8c7755 |
| `--va-stone` / `-dark` / `-light` | #aaa294 / #7d766b / #c9c2b3 | #af9679 / #625445 / #d5c3a7 | #7d786f / #5c574f / #948e83 | #81796b / #514a3f / #a9a193 |
| `--va-roof` / `-dark` / `-light` | #b4553a / #8a3d29 / #cf7352 | #b74429 / #6d2014 / #da7b53 | #8a4331 / #6a2f21 / #a35a44 | #963c25 / #642111 / #c7694d |
| `--va-slate` / `-dark` | #55708c / #3d5369 | #3e6491 / #233a55 | #3f566e / #2d4054 | #385675 / #1f364d |
| `--va-thatch` / `-dark` | #d6a94a / #a97d2c | #e4ac36 / #8e5f14 | #a98238 / #7e5e22 | #b88729 / #77530f |
| `--va-shadow` | #3a2a10 | #33204a | #05030a | #05030a |
| `--va-shadow-opacity` | 0.22 | 0.36 | 0.3 | 0.55 |
| `--va-shade-opacity` | 0.2 | 0.42 | 0.26 | 0.5 |
| `--va-sheen-opacity` | 0.4 | 0.62 | 0.22 | 0.36 |
| `--va-ao-opacity` | 0.38 | 0.6 | 0.5 | 0.66 |
| `--va-tex-opacity` | 0.9 | 1 | 0.75 | 0.85 |
| `--va-tex-dark` / `-light` | 0 / 0.75 | 0.75 / 0.85 | 1 / 0.35 | 1 / 0.35 |
| `--va-vignette` | 0 | 0.45 | 1 | 1 |
| `--va-rim-opacity` (new) | n/a | 0.95 | n/a | 0.5 |
| `--va-foliage-deep` (new, extra darkness on tree and bush crowns) | n/a | 0 | n/a | 0.42 |
| `--va-c-*` cloth colours | n/a | saturation x1.25 at the same lightness (purple #6f4aa8 to #6c3cb6, red #c0392b to #d52816, teal #2f8c84 to #22998f, orange #d9822b to #ec8218, magenta #b8458f to #c93494) | n/a | same rule (dark red #d9503f to #ee402a) |

Signals stay louder than decoration: no signal colour changed (`--va-sig-*`, `--va-alert*`, `--va-flag`, `--va-vine`, `--va-lightning`, `--va-rain` are untouched), and decoration saturation is capped below them (ground and foliage about 0.5 to 0.7, flags, banners and the Review plank are the strongest reds and teals in the scene). The vines (a signal) keep their own tokens; hedges and bushes use the ground greens so a vine on a wall never matches a hedge.

Ground variety: the meadow now has a light, a shade and a warm straw family of large soft patches (`va-p-mottle`, repeated across tile edges so there is no straight cut), longer two-tone blades (`va-p-grass`), and clustered flower patches (`va-p-flowers`, five clusters of four to six flowers per tile).

### 13.3 Buildings, materials and outline weights

Outline hierarchy, drawn as an illustrated storybook: **2.3** (`HEAVY`, the outer silhouette: the hull of every `Box`, every roof plane via `RoofFx`, the town hall facade, wing, pediment and belfry roof, gatehouse towers and lintel, board frames, the plaza rim), **1.4** (`LINE`, was 1.1: face edges and main shapes) and **0.95** (`thin` in each file, was 0.9: windows, doors, small detail).

| Building | Materials and detail at 1280 px |
| --- | --- |
| Project buildings, every stage (plot, research, product, design, architecture, building, testing, released, unknown) | Timber framing and scaffold beams, log or plaster courses, stone plinth courses, terracotta tiles (lodge) with a shadow under each row, slate rows (workshop), window frames with shutters, sills and warm glass, door, chimney with stone courses, steeper roofs (lodge rise 44, workshop 34, was 34 and 26), a cast shadow of the whole growing volume, banners, bunting and the plot stakes unchanged |
| Hearth Lodge / workshop | as above; garden wall segments cast their own small shadows |
| Town hall | swept cast shadow from the wing and facade, heavy silhouette, rim-lit facade edge, slate rows |
| Tavern | thatch rows with row shadows, timber framing, warm glass, new role props: two ale barrels and a crate at the left corner (`buildings/Props.tsx`) |
| Gatehouse | heavy tower and lintel silhouettes, stone courses, swept cast shadow, check-bar unchanged |
| Quest board, chronicle, tally | heavy frames, swept cast shadows |
| Chapel, well, herbalist hut, schoolhouse | through `GabledHouse`: slate, thatch and tile rows with shadow bands, cast shadow with the roof height, rim light; well keeps a hard blob shadow |
| Plot, pipeline cart | unchanged shapes, heavier line, cast blob |

### 13.4 Characters

Same silhouettes, props, anchors, poses and animation classes. Changes: figures are drawn **14 % bigger** (`CHAR_SCALE` 1.14 in `characters/Character.tsx`; the feet stay at (0,0), so name tags (HTML, under the feet), XP badges (inside the tag) and spots are unaffected); the "!" marker moved from y -88 to y -98 so it still clears the taller head and hats (the troupe keeps -72, its figures are not scaled); the "zzz" moved up 10; outlines are 1.35 (was 1.1); cloth colours are more saturated (13.2); shading comes from the stronger `--va-shade-opacity`, `--va-sheen-opacity` and `va-g-cloth`, giving a clear two-tone (lit left, shaded right) on every garment; a hard cast shadow falls to the bottom right under each figure. Element count per character is unchanged except one extra ellipse. Crowded spots (tavern group, quest board troupe) were checked in the 1280 px screenshots: figures overlap about as much as before.

### 13.5 Contrast re-check (light and dark, dawn, day, dusk, night)

Computed from `tokens.css` by a script (the same one as T31, extended): all 70 section 3 rows, the day-part matrix of section 11 and the ring-on-ground model of section 12.6 (which `art.test.ts` still enforces for every theme and day part, now with the T39 tokens).

- **Section 3:** every row passes. Only the seven focus-ring rows moved: in the light theme `--va-focus` became a darker navy (`#0c2f6e`), so focus on bg 5.36 to 10.67, on surface (the halo) 6.15 to 12.25, on surface-2 4.98 to 9.92, on grass 3.05 to 3.60, on grass-3 3.68 to 5.04, on path 3.64 to 6.58, on plaza 4.14 to 7.33 (night light 3.22 to 6.42, 3.78 to 7.54, 4.01 to 7.99, 4.18 to 8.34). Dark theme columns moved by at most 0.03 (focus on grass 4.21 to 4.19, night 5.62 to 5.59): ground luminance is preserved, the last digit comes from rounding the hex. Why the ring is darker: the light-theme ring is the thing that limits how dark and rich the meadow can be. With the old ring the meadow had to stay a pale lime; with the darker ring the day grass can be a deeper green and the pairs still hold. Nothing else uses `--va-focus` in the art; the UI's focus outlines and the Needs-you outline use the same token and only gain contrast.
- **Tightest pairs now:** focus on textured light-day grass 3.02 (T31: 3.14, target 3); light dawn 3.27; light dusk 3.32; dark dawn on path 3.28 (unchanged); dark dawn / dusk with the sky glow laid over 3.23 and 3.27 (unchanged); dark day grass-3 with glow 3.28 (unchanged). Signal icons, name tags, the Needs-you card, "!" ink on glow, parchment and sign text are on tokens that did not change: lowest 4.49 (sig-active on surface, light) and 12.91 (name tag text on surface, dark) as before.
- **Section 11 matrix** (focus ring raw and with the sky glow): all 32 numbers pass; the light rows rose (day 3.60 / 5.04 / 6.58 / 7.33, lowest with glow 5.60), the dark rows moved by at most 0.01.

Ring-on-ground, textured (area-averaged, polarity per theme): now with T39 marks (light theme `--va-tex-dark` 0.75, vignette 0.45), see the updated table in 12.6. **New T39 case, the ring on ground inside a building's cast shadow** (two stacked shadow layers, 0.5 and 0.7 of `--va-shadow-opacity`; informational, the ring is carried by its 4 px `--va-surface` halo as in section 3, and each cell is at or above the T31 value for the same case):

| Theme | Part | shadow alpha | grass | grass-3 | path | plaza |
| --- | --- | --- | --- | --- | --- | --- |
| light | dawn | 0.44 | 2.10 | 2.53 | 3.09 | 3.31 |
| light | day | 0.39 | 2.07 | 2.63 | 3.27 | 3.57 |
| light | dusk | 0.44 | 2.07 | 2.53 | 3.00 | 3.24 |
| light | night | 0.28 | 3.89 | 4.47 | 4.69 | 4.88 |
| dark | dawn | 0.55 | 7.58 | 7.08 | 7.05 | 7.24 |
| dark | day | 0.55 | 7.60 | 7.23 | 7.26 | 7.35 |
| dark | dusk | 0.55 | 7.67 | 7.20 | 7.15 | 7.42 |
| dark | night | 0.55 | 8.08 | 7.65 | 7.54 | 7.45 |

Light-theme raw numbers under a shadow are below 3 for grass (about 2.1) exactly as they were in T31 (2.0 to 2.05); the shadow opacity was lowered 10 % in the light dawn, day and dusk palettes after the first measurement so that every cell is at or above T31. This is the "ring on shaded ground" case the halo exists for; do not read it as a ring failure.

### 13.6 Environment additions (each one, and why it is allowed)

The spec cuts decoration that means nothing, so round 2 cut the scatter hard: 9 pieces plus the 10 framing trees (was 41). Everything is static (no animation), tucked into corners and edges next to the framing trees, at least 40 units from every path, outside the plaza, outside every building keep-out (building, work spots, name tags), outside the lantern posts and the Needs-you card area. `groundDressing` takes a fixed wish list and drops any piece that fails those clearances; `art.test.ts` enforces the clearances and a maximum of 12 pieces. No ambient motion was added. There are no free-floating flower beds or rocks in the open meadow.

| Added | Count (default layout) | Where | Reason it is allowed |
| --- | --- | --- | --- |
| Layered trees (dark back clumps, mid layer, lit top clumps, bark, cast shadow) | 10 (existing framing trees, redrawn, about 20 % bigger) | scene edges, as before | framing, was already allowed |
| Bushes | 4 | beside edge trees and corners | framing |
| Rocks | 2 | beside edge trees | the "stones" of the brief |
| Flower beds | 2 | bottom corners, beside edge trees | the flower patches of the brief, kept to the edge |
| Hedge | 1 | bottom right edge | frames the village edge |
| Fences | 0 by default (two are tried at the left and top-left edges and rejected by the clearances; they appear if the layout leaves room) | outer edges | framing |
| Path outlines, kerb stones, darker plaza rim | n/a | all paths and the plaza | worn dirt with edges |
| Tavern barrels and crate | 3 | tavern, left corner | role props for the inn |

Code: `buildings/Dressing.tsx` (`groundDressing`, `keepOutAreas`, `DRESS_PATH_CLEARANCE`, `Bush`, `Rock`, `FlowerBed`, `Hedge`, `Fence`, `DressPiece`); barrels and crate in `buildings/Props.tsx` (`LogPile` was removed).

### 13.7 Performance

- Still no SVG filters, no per-instance gradients and no `useId` (checked by `art.test.ts`). One new shared def, `va-g-glass`; the T39 file has 14 gradients and 13 patterns, all static and mounted once in `Ground`.
- Bundle (build): JS 433.67 kB, gzip 129.69 kB (T31 baseline 416.29 / 124.97, +15.4 kB raw); CSS 39.06 kB, gzip 8.28 kB (baseline 38.91 / 8.21).
- Static scene cost: about 150 new circles and paths in trees and about 130 in the ground dressing, drawn once and never re-rendered (they are in `Ground`, which has no props that change per frame). Cast shadows add two polygons per box.
- Walking characters re-render every frame: each figure has one more ellipse (the hard shadow) and the extra scale group; no new gradients or filters.

### 13.8 How to swap or tone it down

The UI still only imports from `src/art/index.ts`. To tone the look down without touching a component, edit tokens only: `--va-shade-opacity` and `--va-shadow-opacity` (form shading and cast shadows), `--va-rim-opacity` (rim light), `--va-sheen-opacity`, `--va-ao-opacity`, `--va-tex-opacity` (set these to 0 to get back the flat look), `--va-vignette`, `--va-foliage-deep`. To remove the dressing, make `groundDressing` return `[]` or pass nothing from it in `Ground`. To scale the figures, change `CHAR_SCALE` (and move the "!" `y` default in `Character` by the same factor). To replace the art with commissioned art, swap the components in `src/art`; the contract (`contract.ts`, anchors, `index.ts` exports) did not change. Needs from the UI: none. Known follow-up for the UI owner (not caused by T39): at 1280 px the Needs-you card falls back to a block above the scene when it has six or more items, so the scene sits below the first screen in the screenshots.

### 13.9 Round 2: bigger, bolder buildings

- **Scale.** Project buildings (every stage including the plot stages, lodge and workshop), the tavern, the chapel, the schoolhouse and the herbalist hut are drawn **1.25x**, the gatehouse and well **1.2x** (`Scaled`, `BUILDING_SCALE`, `scalePt`, `scaleRing` in `buildings/iso.tsx`). The scale origin is the ground at the foot of the front wall (gatehouse and well: the local origin), so the building grows up and sideways, while its front edge, the door and every work spot in front stay exactly where they were; characters are never covered, only the ground behind the building is. The lodge garden and the tavern benches and table are not scaled (the sitting spots are on the benches). Not scaled: town hall (the HTML notice card and the belfry at y 50 leave no room), quest board, chronicle, tally (HTML text rectangles), standalone Plot, carts.
- **Anchors.** `door` and `roof` anchors are scaled with the art, `workSpots` and all `*_SPOTS` are unchanged.
- **Rings.** `BUILDING_RINGS` (exported from `src/art/index.ts`, same shape as RingBox) replaces the RING record in `src/ui/Scene.tsx`: keys `hearth-lodge`, `cartographers-workshop`, `plot`; plus `TAVERN_RING` and `GATEHOUSE_RING`. `SPECIALIST_RINGS` is already scaled.
- **Value contrast.** `--va-shade-opacity` rose to 0.52 to 0.56 (dark 0.56), right faces get an extra dark layer (`--va-shadow` at 0.55 of shade), lit faces an extra warm highlight layer, so each wall shows a clearly lit and a clearly dark plane; roof row shadow bands are about 40 % stronger (thatch 0.72, tile 0.6, slate 0.62); window glass has a warm reflection from `--va-glow`.
- **Characters.** Held props are drawn 1.2x, cloth colours another 12 % more saturated; figure scale unchanged (1.14) so the crowded tavern cluster is no denser.
- **Contrast re-run.** Identical to 13.5: no ring-on-ground, cast-shadow or section 3 cell changed (shadow opacity untouched; the new layers are on building faces, not ground). The light-theme ring-in-cast-shadow case is unchanged (2.07 / 2.63 / 3.27 day).
