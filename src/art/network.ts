/**
 * The village path network, in scene coordinates (viewBox 1600 x 1000). Pure geometry: `Ground` draws its dirt paths
 * from these edges and the UI's walking code routes along the same edges, so walkers follow visible paths.
 *
 * Project buildings are positioned from village.config.json (gridToScene), so their door nodes come from
 * `pathNetwork(projectSpots)`, which returns the static network plus one `door:<id>` node per project.
 * Edges are straight segments; bends are junction nodes. The plaza nodes lie on the cobbles (the plaza is
 * drawn over the paths). Boards stand on the plaza (quest board, chronicle, tally), so routes pass in front of them
 * (y 655+) or through the gaps above the tally board; the plaza centre node is lifted above the tally so walkers are never hidden behind a board.
 */
import { SCENE } from './layout';

export interface PathPt {
  x: number;
  y: number;
}

const S = SCENE;

export const PATH_NODES: Record<string, PathPt> = {
  /** Gate opening of the gatehouse. */
  gate: { x: S.gatehouse.x, y: S.gatehouse.y },
  /** Junction on the gate path, where the well branch leaves. */
  'junction-gate': { x: S.gatehouse.x, y: 850 },
  /** Plaza centre (lifted above the tally board, which covers y 598..690 at x 736..864). */
  plaza: { x: S.plaza.x, y: 560 },
  'plaza-n': { x: S.plaza.x, y: 470 },
  /** Right of the quest board and left of the chronicle, above the tally board: clear of all three. */
  'plaza-ne': { x: S.plaza.x + 84, y: 578 },
  'plaza-e': { x: S.plaza.x + 275, y: S.plaza.y + 10 },
  'plaza-se': { x: S.plaza.x + 132, y: 666 },
  'plaza-s': { x: S.plaza.x, y: 732 },
  'plaza-sw': { x: S.plaza.x - 132, y: 666 },
  'plaza-w': { x: S.plaza.x - 275, y: S.plaza.y + 10 },
  'plaza-nw': { x: S.plaza.x - 84, y: 578 },
  /** Foot of the town hall steps. */
  hall: { x: S.townHall.x, y: S.townHall.y + 50 },
  'quest-board': { x: S.questBoard.x, y: S.questBoard.y + 65 },
  chronicle: { x: S.chronicle.x, y: S.chronicle.y + 65 },
  /** In front of the tavern, right of the benches. */
  tavern: { x: S.tavern.x - 12, y: S.tavern.y + 58 },
  'junction-tavern': { x: 1090, y: 775 },
  'junction-east': { x: 1150, y: 612 },
  'junction-chapel': { x: 1400, y: 585 },
  'junction-west': { x: 440, y: 610 },
  'junction-school': { x: 420, y: 790 },
  /** Specialist buildings: a point just in front of each door. */
  chapel: { x: S.chapel.x - 32, y: S.chapel.y + 41 },
  well: { x: S.well.x + 15, y: S.well.y + 48 },
  herbalist: { x: S.herbalist.x - 32, y: S.herbalist.y + 40 },
  schoolhouse: { x: S.schoolhouse.x - 28, y: S.schoolhouse.y + 36 },
  'junction-herbalist': { x: 1395, y: 740 },
};

export const PATH_EDGES: Array<[string, string]> = [
  // entrance and plaza ring
  ['gate', 'junction-gate'],
  ['junction-gate', 'plaza-s'],
  ['plaza-s', 'plaza-sw'],
  ['plaza-s', 'plaza-se'],
  ['plaza-sw', 'plaza-w'],
  ['plaza-se', 'plaza-e'],
  // through the plaza, above the tally board and between the quest board and the chronicle
  ['plaza', 'plaza-n'],
  ['plaza', 'plaza-nw'],
  ['plaza', 'plaza-ne'],
  ['plaza-nw', 'plaza-sw'],
  ['plaza-ne', 'plaza-se'],
  // town square pieces
  ['hall', 'plaza-n'],
  ['quest-board', 'plaza-w'],
  ['quest-board', 'plaza-sw'],
  ['chronicle', 'plaza-e'],
  ['chronicle', 'plaza-se'],
  // tavern
  ['plaza-se', 'junction-tavern'],
  ['junction-tavern', 'tavern'],
  // east: chapel and herbalist
  ['plaza-e', 'junction-east'],
  ['junction-east', 'junction-chapel'],
  ['junction-chapel', 'chapel'],
  ['junction-chapel', 'junction-herbalist'],
  ['junction-herbalist', 'herbalist'],
  // west: schoolhouse
  ['plaza-w', 'junction-west'],
  ['junction-west', 'junction-school'],
  ['junction-school', 'schoolhouse'],
  // well
  ['junction-gate', 'well'],
];

export interface ProjectSpot {
  id: string;
  x: number;
  y: number;
  /** Door point relative to the building origin. Default (-96, 50): just in front of the Hearth Lodge garden gate (a workshop door is close by). */
  door?: { x: number; y: number };
}

const RING_FOR_DOORS = ['plaza-w', 'plaza-e', 'plaza-sw', 'plaza-se'] as const;

export interface PathNetwork {
  nodes: Record<string, PathPt>;
  edges: Array<[string, string]>;
}

/** Static network plus one `door:<id>` node per project, joined to the nearest plaza edge node. */
export function pathNetwork(projectSpots: ProjectSpot[]): PathNetwork {
  const nodes: Record<string, PathPt> = { ...PATH_NODES };
  const edges: Array<[string, string]> = PATH_EDGES.map(([a, b]) => [a, b]);
  for (const p of projectSpots) {
    const d = p.door ?? { x: -96, y: 50 };
    const id = `door:${p.id}`;
    const at = { x: p.x + d.x, y: p.y + d.y };
    nodes[id] = at;
    let best: string = RING_FOR_DOORS[0];
    let bd = Infinity;
    for (const r of RING_FOR_DOORS) {
      const n = PATH_NODES[r];
      if (!n) continue;
      const dist = Math.hypot(n.x - at.x, n.y - at.y);
      if (dist < bd) {
        bd = dist;
        best = r;
      }
    }
    edges.push([id, best]);
  }
  return { nodes, edges };
}

/**
 * Shortest route along the network (Dijkstra, Euclidean edge lengths) as a list of points, or [] when either id
 * is unknown or the nodes are not connected. Handy for walkers and for the pipeline track.
 */
export function routeAlongPaths(net: PathNetwork, from: string, to: string): PathPt[] {
  if (!net.nodes[from] || !net.nodes[to]) return [];
  const adj = new Map<string, Array<[string, number]>>();
  for (const [a, b] of net.edges) {
    const pa = net.nodes[a];
    const pb = net.nodes[b];
    if (!pa || !pb) continue;
    const w = Math.hypot(pa.x - pb.x, pa.y - pb.y);
    (adj.get(a) ?? adj.set(a, []).get(a))?.push([b, w]);
    (adj.get(b) ?? adj.set(b, []).get(b))?.push([a, w]);
  }
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const todo = new Set<string>([from]);
  while (todo.size > 0) {
    let u = '';
    let ud = Infinity;
    for (const k of todo) {
      const d = dist.get(k) ?? Infinity;
      if (d < ud) {
        ud = d;
        u = k;
      }
    }
    todo.delete(u);
    if (u === to) break;
    for (const [v, w] of adj.get(u) ?? []) {
      const nd = ud + w;
      if (nd < (dist.get(v) ?? Infinity)) {
        dist.set(v, nd);
        prev.set(v, u);
        todo.add(v);
      }
    }
  }
  if (!dist.has(to)) return [];
  const ids: string[] = [to];
  while (ids[0] !== from) {
    const p = prev.get(ids[0] as string);
    if (!p) return [];
    ids.unshift(p);
  }
  return ids.map((id) => net.nodes[id] as PathPt);
}
