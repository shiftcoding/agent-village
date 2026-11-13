import { memo } from 'react';
import { ArtDefs } from '../ArtDefs';
import { LANTERN_SPOTS, SCENE, gridToScene } from '../layout';
import { pathNetwork } from '../network';
import { Lantern } from './Lamp';
import { DressPiece, groundDressing } from './Dressing';
import { C, HEAVY, LINE, U } from './iso';


/** One foliage clump: flat token fill, outline, sphere shading, a lit crescent top left and a dark crescent bottom right. */
function Clump({ cx, cy, r, fill, lit = 0.4, dark = 0.5, deep = 0 }: { cx: number; cy: number; r: number; fill: string; lit?: number; dark?: number; deep?: number }): JSX.Element {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} {...LINE} />
      {deep > 0 && <circle cx={cx} cy={cy} r={r - 0.7} fill={C('shadow')} style={{ fillOpacity: `calc(${deep} + var(--va-foliage-deep))` }} />}
      <circle cx={cx} cy={cy} r={r} fill={U('g-sphere')} />
      <path d={`M${cx - r * 0.7},${cy + r * 0.05} A${r * 0.72},${r * 0.72} 0 0 1 ${cx + r * 0.05},${cy - r * 0.72}`} fill="none" stroke={C('highlight')} strokeOpacity={lit} strokeWidth={r * 0.2} strokeLinecap="round" />
      <path d={`M${cx + r * 0.72},${cy - r * 0.05} A${r * 0.72},${r * 0.72} 0 0 1 ${cx - r * 0.05},${cy + r * 0.72}`} fill="none" stroke={C('shadow')} strokeOpacity={dark} strokeWidth={r * 0.26} strokeLinecap="round" />
    </g>
  );
}

/**
 * Tree with layered foliage: a dark back layer, a mid layer and lit clumps on top (light from the top left), a trunk with bark
 * and a root flare, a hard-edged cast shadow falling to the bottom right and a soft contact shadow. (x,y) is the foot of the trunk.
 */
export function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill="var(--va-shadow)">
        <ellipse cx={40} cy={10} rx={60} ry={15} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.55)' }} />
        <ellipse cx={34} cy={7} rx={48} ry={11} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      </g>
      <ellipse cx={2} cy={1} rx={18} ry={5.5} fill={U('g-contact')} />
      {/* trunk: root flare, forked branch, bark, light on the left, shade on the right */}
      <path d="M-10,4 Q-6,-4 -6,-40 L6,-40 Q6,-4 10,4 Q0,7 -10,4 Z" fill={C('wood')} {...LINE} />
      <path d="M-6,-40 L-6,-4 L-9,3 L-3,-4 L-2,-40 Z" fill={C('wood-light')} fillOpacity={0.8} />
      <path d="M2,-40 L6,-40 Q6,-4 10,4 Q4,5 2,3 Z" fill={C('shade')} style={{ fillOpacity: 'var(--va-shade-opacity)' }} />
      <path d="M-3,-46 L-16,-62 M3,-46 L14,-64" stroke={C('outline')} strokeWidth={7} strokeLinecap="round" />
      <path d="M-3,-46 L-16,-62 M3,-46 L14,-64" stroke={C('wood')} strokeWidth={4.4} strokeLinecap="round" />
      <path d="M2,-34 L2.4,-14 M-2,-24 L-1.6,-10" stroke={C('outline')} strokeOpacity={0.4} strokeWidth={1} fill="none" />
      {/* back layer (in shade) */}
      <Clump cx={-28} cy={-60} r={21} fill={C('grass-2')} lit={0.15} dark={0.6} deep={0.42} />
      <Clump cx={28} cy={-62} r={22} fill={C('grass-2')} lit={0.1} dark={0.6} deep={0.45} />
      <Clump cx={0} cy={-92} r={22} fill={C('grass-2')} lit={0.2} dark={0.6} deep={0.38} />
      {/* mid layer */}
      <Clump cx={-17} cy={-68} r={22} fill={C('leaf')} deep={0.22} />
      <Clump cx={20} cy={-72} r={23} fill={C('leaf')} deep={0.22} />
      <Clump cx={-3} cy={-86} r={22} fill={C('leaf')} deep={0.22} />
      {/* lit top clumps */}
      <Clump cx={-15} cy={-88} r={17} fill={C('leaf')} lit={0.45} dark={0.3} deep={0.12} />
      <Clump cx={8} cy={-98} r={16} fill={C('leaf')} lit={0.5} dark={0.35} deep={0.12} />
      <g fill="none" strokeLinecap="round" strokeWidth={2.6} pointerEvents="none">
        <path d="M-26,-76 q4,-4 8,-1 M-6,-60 q4,3 8,0 M14,-84 q4,-3 8,0 M24,-60 q4,3 8,0 M-34,-56 q3,3 7,0" stroke={C('shade')} style={{ strokeOpacity: 'var(--va-shade-opacity)' }} />
        <path d="M-12,-102 q4,-3 8,0 M10,-92 q3,-3 7,0" stroke={C('highlight')} strokeOpacity={0.6} />
      </g>
    </g>
  );
}

/** Framing trees (foot of the trunk, scale). Exported for the clearance test. */
export const TREES: Array<{ x: number; y: number; s: number }> = [
  { x: 70, y: 300, s: 1.25 },
  { x: 150, y: 190, s: 1.05 },
  { x: 50, y: 620, s: 1.3 },
  { x: 150, y: 900, s: 1.15 },
  { x: 420, y: 965, s: 1 },
  { x: 1400, y: 150, s: 1.05 },
  { x: 1565, y: 545, s: 1.25 },
  { x: 1380, y: 975, s: 1.05 },
  { x: 400, y: 120, s: 0.95 },
  { x: 1180, y: 120, s: 1 },
];

const TUFTS: Array<[number, number]> = [
  [90, 140], [240, 90], [420, 160], [560, 110], [700, 70], [900, 90], [1060, 140], [1190, 100], [1400, 150], [1520, 90],
  [150, 330], [60, 520], [200, 640], [90, 780], [260, 880], [470, 840], [620, 900], [1000, 880], [1180, 900], [1420, 760],
  [1530, 600], [1480, 420], [1380, 330], [1100, 300], [500, 300], [420, 700], [1000, 700], [1330, 640], [180, 460], [1560, 860],
];

/**
 * Kerb stones as one path of tiny round dabs, a few units outside each path edge. Dabs that fall near a junction
 * or on top of another path are skipped, so crossings stay open. Deterministic.
 */
function pathKerbStones(segs: Array<{ a: { x: number; y: number }; b: { x: number; y: number } }>, nodes: Array<{ x: number; y: number }>): string {
  const distToSeg = (px: number, py: number, s: { a: { x: number; y: number }; b: { x: number; y: number } }): number => {
    const dx = s.b.x - s.a.x;
    const dy = s.b.y - s.a.y;
    const t = Math.max(0, Math.min(1, ((px - s.a.x) * dx + (py - s.a.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - (s.a.x + t * dx), py - (s.a.y + t * dy));
  };
  let out = '';
  segs.forEach((e, si) => {
    const len = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
    if (len < 40) return;
    const nx = -(e.b.y - e.a.y) / len;
    const ny = (e.b.x - e.a.x) / len;
    for (let t = 20 + (si % 3) * 5; t < len - 20; t += 26 + ((si * 7 + Math.floor(t)) % 3) * 5) {
      for (const side of [-1, 1]) {
        const px = e.a.x + ((e.b.x - e.a.x) * t) / len + nx * side * 18.5;
        const py = e.a.y + ((e.b.y - e.a.y) * t) / len + ny * side * 18.5;
        if (segs.some((o, oi) => oi !== si && distToSeg(px, py, o) < 21)) continue;
        if (nodes.some((n) => Math.hypot(px - n.x, py - n.y) < 24)) continue;
        out += `M${px.toFixed(1)},${py.toFixed(1)} h0.1`;
      }
    }
  });
  return out;
}

/**
 * Backdrop: grass, a cobbled town square, and dirt paths drawn from the shared path network (src/art/network.ts:
 * the gatehouse, the plaza, every project door, the town hall steps, the quest board, the chronicle, the tavern and the
 * four specialist buildings), so walkers that follow the network stay on visible paths. Lantern posts stand at
 * LANTERN_SPOTS (lit at dusk and night only). Fill the whole viewBox. `projectSpots` are the scene positions of the
 * project buildings (gridToScene of their config position); the `id` is optional.
 */
type GroundProps = { projectSpots?: Array<{ x: number; y: number; id?: string }>; lanterns?: boolean };
function GroundImpl({ projectSpots, lanterns = true }: GroundProps): JSX.Element {
  const { width: W, height: Hh, plaza: p } = SCENE;
  const lodge = gridToScene(3, 2);
  const work = gridToScene(-3, 2);
  const spots = (projectSpots ?? [lodge, work]).map((s, i) => ({ id: (s as { id?: string }).id ?? `p${i}`, x: s.x, y: s.y }));
  const net = pathNetwork(spots);
  const segs = net.edges.flatMap(([a, b]) => {
    const pa = net.nodes[a];
    const pb = net.nodes[b];
    return pa && pb ? [{ a: pa, b: pb }] : [];
  });
  const d = segs.map((e) => `M${e.a.x},${e.a.y} L${e.b.x},${e.b.y}`);
  const junctions = Object.entries(net.nodes).filter(([k]) => k.startsWith('junction-') || k.startsWith('door:') || k === 'gate');
  const kerb = pathKerbStones(segs, Object.values(net.nodes));
  const plazaDiamond = `${p.x},${p.y - p.ry} ${p.x + p.rx},${p.y} ${p.x},${p.y + p.ry} ${p.x - p.rx},${p.y}`;
  return (
    <g aria-hidden="true">
      <ArtDefs />
      <rect x={0} y={0} width={W} height={Hh} fill={U('g-grass')} />
      <rect x={0} y={0} width={W} height={Hh} fill={U('p-mottle')} />
      <rect x={0} y={0} width={W} height={Hh} fill={U('p-grass')} />
      <rect x={0} y={0} width={W} height={Hh} fill={U('p-flowers')} />
      <rect x={0} y={0} width={W} height={Hh} fill={U('g-sky')} />
      {TUFTS.map(([x, y], i) => (
        <g key={i} fill="none" strokeLinecap="round">
          <path d={`M${x - 5},${y} L${x - 3},${y - 7} M${x},${y} L${x},${y - 9} M${x + 5},${y} L${x + 3},${y - 7}`} stroke={C('grass-2')} strokeWidth={2} />
          <path d={`M${x - 2},${y} L${x - 1},${y - 6} M${x + 2},${y} L${x + 1.6},${y - 5}`} stroke={C('grass-3')} strokeWidth={1.4} />
          <ellipse cx={x + 2} cy={y + 1} rx={7} ry={2} fill={C('shadow')} style={{ fillOpacity: 'calc(0.12 * var(--va-tex-dark))' }} stroke="none" />
        </g>
      ))}
      {/* paths: all edges as edge-coloured strokes first, then the path colour on top, so crossings merge */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d.join(' ')} stroke={C('outline')} strokeOpacity={0.5} strokeWidth={39} />
        {junctions.map(([k, n]) => (
          <circle key={k} cx={n.x} cy={n.y} r={19.5} fill={C('outline')} fillOpacity={0.5} />
        ))}
        <path d={d.join(' ')} stroke={C('path-edge')} strokeWidth={35} />
        {junctions.map(([k, n]) => (
          <circle key={k} cx={n.x} cy={n.y} r={17.5} fill={C('path-edge')} />
        ))}
        <path d={d.join(' ')} stroke={C('path')} strokeWidth={26} />
        {junctions.map(([k, n]) => (
          <circle key={k} cx={n.x} cy={n.y} r={13} fill={C('path')} />
        ))}
        {/* worn dirt: pebbles and grit on top of the path colour (low contrast) */}
        <path d={d.join(' ')} stroke={U('p-dirt')} strokeWidth={26} />
        {junctions.map(([k, n]) => (
          <circle key={k} cx={n.x} cy={n.y} r={13} fill={U('p-dirt')} />
        ))}
      </g>
      {/* kerb stones along the path edges: a soft shadow below, a pale cap above */}
      <path d={kerb} transform="translate(1 1.6)" stroke={C('shadow')} strokeOpacity={0.22} strokeWidth={5.4} strokeLinecap="round" fill="none" />
      <path d={kerb} stroke={C('stone-light')} strokeOpacity={0.75} strokeWidth={4.2} strokeLinecap="round" fill="none" />
      <path d={kerb} transform="translate(-0.6 -0.7)" stroke={C('highlight')} strokeOpacity={0.5} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      {/* plaza: rim, paving, bevel */}
      <polygon points={`${p.x},${p.y - p.ry - 10} ${p.x + p.rx + 20},${p.y} ${p.x},${p.y + p.ry + 10} ${p.x - p.rx - 20},${p.y}`} fill={C('plaza-2')} {...HEAVY} />
      <polygon points={plazaDiamond} fill={C('plaza')} {...LINE} />
      <polygon points={plazaDiamond} fill={U('p-cobble')} />
      <polygon points={`${p.x},${p.y - p.ry + 5} ${p.x + p.rx - 11},${p.y} ${p.x},${p.y + p.ry - 5} ${p.x - p.rx + 11},${p.y}`} fill="none" stroke={C('plaza-2')} strokeOpacity={0.7} strokeWidth={1.2} strokeDasharray="9 3" />
      <rect x={0} y={0} width={W} height={Hh} fill={U('g-vignette')} />
      {/* framing trees, hedges, bushes, rocks, flower beds and fences, back to front */}
      {[
        ...TREES.map((t) => ({ y: t.y, el: <Tree key={`t${t.x},${t.y}`} x={t.x} y={t.y} s={t.s} /> })),
        ...groundDressing(spots).map((d, i) => ({ y: d.y + (d.kind === 'hedge' || d.kind === 'fence' ? (d.len ?? 0) / 2 : 0), el: <DressPiece key={`d${i}`} d={d} /> })),
      ]
        .sort((m, n) => m.y - n.y)
        .map((o) => o.el)}
      {lanterns &&
        [...LANTERN_SPOTS]
          .sort((a, b) => a.y - b.y)
          .map((l) => (
            <g key={`${l.x},${l.y}`} transform={`translate(${l.x} ${l.y})`}>
              <Lantern />
            </g>
          ))}
    </g>
  );
}

const sameSpots = (a: GroundProps['projectSpots'], b: GroundProps['projectSpots']): boolean =>
  a === b || (!!a && !!b && a.length === b.length && a.every((s, i) => s.x === b[i]?.x && s.y === b[i]?.y && s.id === b[i]?.id));

/** Memoized by value: groundDressing and the path network are only rebuilt when the project spots (or lanterns) change, not on every Scene render. */
export const Ground = memo(GroundImpl, (p, n) => p.lanterns === n.lanterns && sameSpots(p.projectSpots, n.projectSpots));
