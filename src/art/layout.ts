/**
 * Recommended scene layout: one SVG viewBox 0 0 1600 1000. Positions are the local origin of each art
 * component (see each component's header for where that origin sits). The UI may use these as defaults.
 * Draw order, back to front: Ground, then everything sorted by y (town hall first), then characters, overlays.
 */
export const SCENE = {
  width: 1600,
  height: 1000,
  /** Bottom centre of the facade; steps reach y+40. */
  townHall: { x: 800, y: 390 },
  /** Bottom centre of the posts. */
  questBoard: { x: 610, y: 590 },
  chronicle: { x: 990, y: 590 },
  tally: { x: 800, y: 690 },
  /** Gate opening, bottom centre; the village entrance. */
  gatehouse: { x: 800, y: 930 },
  /** Footprint centre. */
  tavern: { x: 1240, y: 800 },
  /** Plaza diamond (cobbles) centre and half sizes. */
  plaza: { x: 800, y: 600, rx: 310, ry: 155 },
  /** Specialist buildings (footprint centres). Chapel: right of the Hearth Lodge; herbalist: right, below the lodge. */
  chapel: { x: 1490, y: 335 },
  herbalist: { x: 1490, y: 760 },
  /** Well: bottom left of the plaza, beside the gate path. Schoolhouse: left, below the workshop. */
  well: { x: 575, y: 820 },
  schoolhouse: { x: 300, y: 735 },
  /** Default grid -> scene mapping for village.config.json positions (x 3, y 2 = Hearth Lodge). */
  grid: { originX: 800, stepX: 153.3, originY: 410, stepY: 30 },
} as const;

/** Map a village.config.json grid position to scene coordinates (footprint centre of the building). */
export function gridToScene(gx: number, gy: number): { x: number; y: number } {
  return { x: SCENE.grid.originX + gx * SCENE.grid.stepX, y: SCENE.grid.originY + gy * SCENE.grid.stepY };
}

/**
 * Where a pipeline cart stands at each stop of the content pipeline (scene coords, the cart's wheel contact centre).
 * Each point is beside the building, clear of the work spots and of the name-tag zone under the characters.
 * Order = pipeline order: bro-writer drafts at the tavern, review at the chapel, advice at the well, the herbalist
 * and the schoolhouse, human sign-off at the town hall.
 */
export const PIPELINE_STOPS = {
  tavern: { x: 1306, y: 858 },
  chapel: { x: 1546, y: 392 },
  well: { x: 664, y: 858 },
  herbalist: { x: 1546, y: 846 },
  schoolhouse: { x: 350, y: 792 },
  'town-hall': { x: 952, y: 458 },
} as const satisfies Record<string, { x: number; y: number }>;

/** Order of the stops along the content pipeline. */
export const PIPELINE_ORDER = ['tavern', 'chapel', 'well', 'herbalist', 'schoolhouse', 'town-hall'] as const;

/**
 * Lantern posts (scene coords of the foot), each beside a path junction. They glow at dusk and night only
 * (tokens --va-lamp, see tokens.css); by day they are plain unlit posts. Ground draws them.
 */
export const LANTERN_SPOTS: Array<{ x: number; y: number }> = [
  { x: 646, y: 400 },
  { x: 826, y: 846 },
  { x: 612, y: 706 },
  { x: 1070, y: 646 },
  { x: 1112, y: 758 },
  { x: 1418, y: 604 },
  { x: 1262, y: 884 },
  { x: 440, y: 650 },
];
