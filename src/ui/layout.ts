/**
 * Pure placement logic: which structure stands where, where each character stands, and where name tags go.
 * No React. Art supplies spots (src/art), data supplies who and what (src/data).
 */
import {
  CHRONICLE_SPOTS,
  GATEHOUSE_SPOTS,
  HEARTH_LODGE_ANCHORS,
  PLOT_ANCHORS,
  PIPELINE_STOPS,
  QUEST_BOARD_SPOTS,
  SCENE,
  SPECIALIST_ANCHORS,
  SPECIALIST_ORIGINS,
  SPECIALIST_PLACES,
  TAVERN_SIT_SPOTS,
  TAVERN_STAND_SPOTS,
  TOWN_HALL_STEP_SPOTS,
  WORKSHOP_ANCHORS,
  gridToScene,
  type Pose,
  type SignalIconKind,
} from '../art';
import { SPECIALIST_PLACE_OF, pipelineOf } from '../data/pipeline';
import type { Agent, PipelineStopId, Project, SpecialistPlace, Village } from '../data/types';
import { tagStateText } from './format';

export type Pt = { x: number; y: number };
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StructureId =
  | 'town-hall'
  | 'quest-board'
  | 'chronicle'
  | 'tally'
  | 'tavern'
  | 'gatehouse'
  | `project:${string}`
  | `specialist:${SpecialistPlace}`
  | `cart:${PipelineStopId}`;

export interface Structure {
  id: StructureId;
  x: number;
  y: number;
}

export function projectOrigin(p: Project): Pt {
  return gridToScene(p.position.x, p.position.y);
}

/** Project origins with ids, for Ground (paths and door nodes) and the path network. */
export function projectSpotsOf(village: Village): Array<Pt & { id: string }> {
  return village.projects.map((p) => ({ id: p.id, ...projectOrigin(p) }));
}

/** A specialist building is drawn when its agent is in the village (the roster), or someone stands there. */
export function specialistPlaces(village: Village): SpecialistPlace[] {
  return SPECIALIST_PLACES.filter((place) =>
    village.agents.some((a) => SPECIALIST_PLACE_OF[a.name] === place || (a.location.kind === 'specialist' && a.location.place === place)),
  );
}

/** The agent who works at a specialist place (by name), if present. */
export function agentOfPlace(village: Village, place: SpecialistPlace): Agent | undefined {
  return village.agents.find((a) => SPECIALIST_PLACE_OF[a.name] === place) ?? village.agents.find((a) => a.location.kind === 'specialist' && a.location.place === place);
}

/**
 * Everything that is not a character, sorted back to front (y, then x). DOM order = draw order = Tab order.
 * Includes the specialist buildings (when their agent is in the roster) and a pipeline cart at every stop that
 * holds open work (carts are sorted by the y of their wheels).
 */
export function structures(village: Village): Structure[] {
  const list: Structure[] = [
    { id: 'town-hall', ...SCENE.townHall },
    { id: 'quest-board', ...SCENE.questBoard },
    { id: 'chronicle', ...SCENE.chronicle },
    { id: 'tally', ...SCENE.tally },
    { id: 'tavern', ...SCENE.tavern },
    { id: 'gatehouse', ...SCENE.gatehouse },
    ...village.projects.map((p): Structure => ({ id: `project:${p.id}`, ...projectOrigin(p) })),
    ...specialistPlaces(village).map((place): Structure => ({ id: `specialist:${place}`, ...SPECIALIST_ORIGINS[place] })),
    ...pipelineOf(village)
      .filter((st) => st.count > 0 && st.stop in PIPELINE_STOPS)
      .map((st): Structure => ({ id: `cart:${st.stop}`, ...PIPELINE_STOPS[st.stop] })),
  ];
  return list.sort((a, b) => a.y - b.y || a.x - b.x);
}

export interface PlacedChar {
  key: string;
  agent: Agent;
  group: StructureId;
  x: number;
  y: number;
  pose: Pose;
  mug: boolean;
  alert: boolean;
  sleepy: boolean;
  /** Body width in scene units (troupe is wider). */
  width: number;
}

interface Spot extends Pt {
  sit?: boolean;
}

const CHAR_W = 34;
const TROUPE_GAP = 24;

function spotsOf(group: StructureId, village: Village): Spot[] {
  const at = (o: Pt, list: Pt[], sit?: boolean): Spot[] => list.map((s) => ({ x: o.x + s.x, y: o.y + s.y, sit }));
  switch (group) {
    case 'town-hall':
      return at(SCENE.townHall, TOWN_HALL_STEP_SPOTS);
    case 'quest-board':
      return at(SCENE.questBoard, QUEST_BOARD_SPOTS);
    case 'chronicle':
      return at(SCENE.chronicle, CHRONICLE_SPOTS);
    case 'gatehouse':
      return at(SCENE.gatehouse, GATEHOUSE_SPOTS);
    case 'tavern':
      return [...at(SCENE.tavern, TAVERN_SIT_SPOTS, true), ...at(SCENE.tavern, TAVERN_STAND_SPOTS)];
    case 'tally':
      return [];
    default: {
      if (group.startsWith('specialist:')) {
        const place = group.slice('specialist:'.length) as SpecialistPlace;
        return SPECIALIST_ANCHORS[place] ? at(SPECIALIST_ORIGINS[place], SPECIALIST_ANCHORS[place].workSpots) : [];
      }
      if (group.startsWith('cart:')) return [];
      const p = village.projects.find((x) => `project:${x.id}` === group);
      if (!p) return [];
      const o = projectOrigin(p);
      const anchors = p.plot !== 'ok' ? PLOT_ANCHORS : p.building === 'hearth-lodge' ? HEARTH_LODGE_ANCHORS : p.building === 'cartographers-workshop' ? WORKSHOP_ANCHORS : PLOT_ANCHORS;
      return at(o, anchors.workSpots);
    }
  }
}

function groupOf(a: Agent, village: Village): StructureId {
  switch (a.location.kind) {
    case 'specialist':
      return `specialist:${a.location.place}`;
    case 'building': {
      const id = a.location.projectId;
      return village.projects.some((p) => p.id === id) ? `project:${id}` : 'tavern';
    }
    case 'gatehouse':
      return 'gatehouse';
    case 'town-hall-steps':
      return 'town-hall';
    case 'quest-board':
      return 'quest-board';
    case 'tavern':
      return 'tavern';
  }
}

function widthOf(a: Agent): number {
  return a.personas?.length ? TROUPE_GAP * a.personas.length + 12 : CHAR_W;
}

function poseOf(a: Agent, sit: boolean): Pose {
  switch (a.state) {
    case 'doing':
      return 'work';
    case 'review':
      return 'wait';
    case 'blocked':
      return 'stand';
    case 'todo':
      return 'study';
    case 'idle':
      return sit ? 'rest' : 'stand';
  }
}

/** Reserved first spot: orchestrator on the steps, the paladin at his post. */
function reservedIndex(a: Agent, group: StructureId): number | null {
  if (group === 'town-hall' && a.name === 'orchestrator') return 0;
  if (group === 'gatehouse' && a.name === 'code-reviewer') return 0;
  return null;
}

/**
 * Put every agent on a spot from the art lists. Order of allocation: reserved spots, wide groups (the
 * troupe), sleepers (they get the tavern seats), then roster order. When spots run out, extra characters
 * are offset deterministically in steps from the first spots, never stacked on the same point.
 * The result is sorted for drawing: structure order first (so Tab follows the scene), then y, then x.
 */
export function placeCharacters(village: Village): PlacedChar[] {
  const order = structures(village).map((s) => s.id);
  const groups = new Map<StructureId, Agent[]>();
  for (const a of village.agents) {
    const g = groupOf(a, village);
    groups.set(g, [...(groups.get(g) ?? []), a]);
  }
  const out: PlacedChar[] = [];
  for (const id of order) {
    const members = groups.get(id);
    if (!members?.length) continue;
    const spots = spotsOf(id, village);
    if (!spots.length) continue;
    const taken = spots.map(() => false);
    const placed: PlacedChar[] = [];
    const rank = (a: Agent): number => (reservedIndex(a, id) !== null ? 0 : a.personas?.length ? 1 : a.sleepy ? 2 : 3);
    const queue = members.map((a, i) => ({ a, i })).sort((p, q) => rank(p.a) - rank(q.a) || p.i - q.i);
    let overflow = 0;
    // spot 0 stays free for the orchestrator / paladin even when they are not here
    if (id === 'town-hall' || id === 'gatehouse') taken[0] = true;
    for (const { a } of queue) {
      let idx = reservedIndex(a, id);
      const w = widthOf(a);
      if (idx === null) {
        idx = taken.findIndex((t) => !t);
        if (idx < 0) idx = -1;
      }
      let spot: Spot;
      if (idx >= 0) {
        spot = spots[idx] as Spot;
        taken[idx] = true;
        if (w > CHAR_W) {
          spots.forEach((s, j) => {
            if (Math.abs(s.x - spot.x) < w / 2 + CHAR_W / 2 && Math.abs(s.y - spot.y) < 14) taken[j] = true;
          });
        }
      } else {
        const k = overflow++;
        const base = spots[k % spots.length] as Spot;
        const ring = Math.floor(k / spots.length) + 1;
        spot = { x: base.x + 18 * ring, y: base.y + 26 * ring, sit: false };
      }
      const sit = spot.sit === true;
      placed.push({
        key: a.name,
        agent: a,
        group: id,
        x: spot.x,
        y: spot.y,
        pose: a.name === 'orchestrator' && a.state === 'idle' ? 'stand' : poseOf(a, sit),
        mug: a.state === 'idle' && id === 'tavern',
        alert: a.state === 'blocked' || a.hasBlocked,
        sleepy: a.sleepy && id === 'tavern',
        width: w,
      });
    }
    out.push(...placed.sort((p, q) => p.y - q.y || p.x - q.x));
  }
  return out;
}

/* ------------------------------------------------------------------ name tags */

export interface TagLayout {
  key: string;
  box: Box;
  line1: string;
  line2: string;
  icon: SignalIconKind;
  /** Where the character stands (feet). */
  feet: Pt;
  /** True when the tag had to move away from the feet, so a leader line is drawn. */
  moved: boolean;
  /** "Lv 2" badge text when XP is shown, else null. It is part of the measured width. */
  level: string | null;
  /** Measured widths of the name (bold) and of the level badge (including its padding), 0 without a badge. */
  nameW: number;
  badgeW: number;
}

export const LEVEL_GAP = 6;
export const LEVEL_PAD = 10;

export function levelText(a: Agent): string {
  return `Lv ${a.level}`;
}

/** Width of a name tag: the wider of (name + level badge) and (icon + state line), plus padding. Exported for tests. */
export function tagWidth(name: string, state: string, level: string | null, font: number, measure: Measure): { w: number; nameW: number; badgeW: number } {
  const f2 = Math.round(font * 0.94);
  const f3 = Math.round(font * 0.82);
  const nameW = measure(name, font, true);
  const badgeW = level === null ? 0 : Math.ceil(measure(level, f3, true)) + LEVEL_PAD;
  const line1 = nameW + (level === null ? 0 : LEVEL_GAP + badgeW);
  const line2 = f2 + 2 + 4 + 7 + measure(state, f2, false);
  return { w: Math.ceil(Math.max(line1, line2) + 14), nameW, badgeW };
}

export type Measure = (text: string, px: number, bold: boolean) => number;

/** Rough text width when no canvas is available (tests, very old browsers). */
export const estimateMeasure: Measure = (text, px, bold) => text.length * px * (bold ? 0.6 : 0.56);

function iconOf(a: Agent): SignalIconKind {
  if (a.villageClass === 'stranger') return 'stranger';
  return a.state;
}

function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

const DIRS: Array<[number, number]> = [
  [0, 1],
  [1, 1],
  [-1, 1],
  [1, 0],
  [-1, 0],
  [1, -1],
  [-1, -1],
  [0, -1],
];

/**
 * Greedy label placement. Each tag prefers the spot right under the feet; if that overlaps another tag,
 * a character body or a fixed obstacle (signal strips, notice card), it tries wider rings in a fixed
 * direction order and takes the cheapest. Deterministic for the same input.
 */
export function layoutTags(chars: PlacedChar[], font: number, measure: Measure, obstacles: Box[], bounds = { w: SCENE.width, h: SCENE.height }, showLevel = false): TagLayout[] {
  const f2 = Math.round(font * 0.94);
  const h = font + f2 + 12;
  const bodies: Array<{ key: string; box: Box }> = chars.map((c) => ({ key: c.key, box: { x: c.x - c.width / 2, y: c.y - 74, w: c.width, h: 78 } }));
  const sized = chars.map((c) => {
    const line1 = c.agent.name;
    const line2 = tagStateText(c.agent);
    const level = showLevel ? levelText(c.agent) : null;
    const m = tagWidth(line1, line2, level, font, measure);
    return { c, line1, line2, w: m.w, level, nameW: m.nameW, badgeW: m.badgeW };
  });
  const order = [...sized].sort((a, b) => b.c.y - a.c.y || a.c.x - b.c.x);
  const placed: Box[] = [];
  const result = new Map<string, TagLayout>();
  for (const s of order) {
    let best: { box: Box; cost: number; moved: boolean } | null = null;
    for (let k = 0; k <= 12; k++) {
      const d = k * 13;
      const dirs = k === 0 ? [DIRS[0] as [number, number]] : DIRS;
      for (const [dx, dy] of dirs) {
        const box: Box = { x: Math.round(s.c.x - s.w / 2 + dx * d * 1.4), y: Math.round(s.c.y + 5 + dy * d), w: s.w, h };
        let cost = d * 0.4;
        for (const p of placed) cost += overlap(box, p) * 6;
        for (const o of obstacles) cost += overlap(box, o) * 6;
        for (const b of bodies) if (b.key !== s.c.key) cost += overlap(box, b.box) * 2;
        if (box.x < 2) cost += (2 - box.x) * 400;
        if (box.y < 2) cost += (2 - box.y) * 400;
        if (box.x + box.w > bounds.w - 2) cost += (box.x + box.w - bounds.w + 2) * 400;
        if (box.y + box.h > bounds.h - 2) cost += (box.y + box.h - bounds.h + 2) * 400;
        if (best === null || cost < best.cost) best = { box, cost, moved: k > 0 };
        if (cost === d * 0.4 && k === 0) break;
      }
      if (best && best.cost < 1) break;
    }
    const chosen = best as { box: Box; cost: number; moved: boolean };
    placed.push(chosen.box);
    result.set(s.c.key, { key: s.c.key, box: chosen.box, line1: s.line1, line2: s.line2, icon: iconOf(s.c.agent), feet: { x: s.c.x, y: s.c.y }, moved: chosen.moved, level: s.level, nameW: s.nameW, badgeW: s.badgeW });
  }
  // keep DOM order equal to character order
  return chars.map((c) => result.get(c.key) as TagLayout);
}
