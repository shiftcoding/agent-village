import { ArtDefs } from '../ArtDefs';
import { LANTERN_SPOTS, SCENE, gridToScene } from '../layout';
import { pathNetwork } from '../network';
import { Lantern } from './Lamp';
import { C, LINE, U } from './iso';

const thin = { ...LINE, strokeWidth: 0.9 } as const;

/** Small round-crowned tree used only to frame the scene edges. (x,y) is the foot of the trunk. */
export function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={12} cy={3} rx={40} ry={11} fill={U('g-contact')} />
      <ellipse cx={2} cy={1} rx={16} ry={5} fill={U('g-contact')} />
      {/* trunk: root flare, bark, light on the left */}
      <path d="M-8,3 Q-5,-4 -5,-34 L5,-34 Q5,-4 8,3 Q0,6 -8,3 Z" fill={C('wood-dark')} {...thin} />
      <path d="M-5,-34 L-5,-4 L-2,-4 L-1.5,-34 Z" fill={C('highlight')} fillOpacity={0.22} />
      <path d="M2,-30 L2.4,-12 M-2,-20 L-1.6,-8" stroke={C('outline')} strokeOpacity={0.35} strokeWidth={0.9} fill="none" />
      {/* crown: three lobes, each a flat token fill plus a soft sphere overlay and leaf dabs */}
      <circle cx={-16} cy={-48} r={20} fill={C('grass-2')} {...LINE} />
      <circle cx={-16} cy={-48} r={20} fill={U('g-sphere')} />
      <circle cx={16} cy={-50} r={22} fill={C('grass-2')} {...LINE} />
      <circle cx={16} cy={-50} r={22} fill={U('g-sphere')} />
      <circle cx={0} cy={-68} r={25} fill={C('leaf')} {...LINE} />
      <circle cx={0} cy={-68} r={25} fill={U('g-sphere')} />
      <g fill="none" strokeLinecap="round" strokeWidth={2.4} pointerEvents="none">
        <path d="M-12,-76 q4,-4 8,-1 M-24,-52 q4,-4 8,-1 M6,-82 q4,-2 7,1 M8,-56 q4,-4 8,-1" stroke={C('highlight')} strokeOpacity={0.4} />
        <path d="M-6,-60 q4,3 8,0 M12,-44 q4,3 8,0 M-22,-42 q4,3 8,0 M14,-70 q3,3 7,1" stroke={C('shade')} style={{ strokeOpacity: 'var(--va-shade-opacity)' }} />
      </g>
      <path d="M10,-60 Q22,-52 14,-40" fill="none" stroke={C('shade')} style={{ strokeOpacity: 'var(--va-shade-opacity)' }} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
}

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
export function Ground({ projectSpots, lanterns = true }: { projectSpots?: Array<{ x: number; y: number; id?: string }>; lanterns?: boolean }): JSX.Element {
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
        <path d={d.join(' ')} stroke={C('path-edge')} strokeWidth={34} />
        {junctions.map(([k, n]) => (
          <circle key={k} cx={n.x} cy={n.y} r={17} fill={C('path-edge')} />
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
      <polygon points={`${p.x},${p.y - p.ry - 8} ${p.x + p.rx + 16},${p.y} ${p.x},${p.y + p.ry + 8} ${p.x - p.rx - 16},${p.y}`} fill={C('path-edge')} />
      <polygon points={plazaDiamond} fill={C('plaza')} {...LINE} />
      <polygon points={plazaDiamond} fill={U('p-cobble')} />
      <polygon points={`${p.x},${p.y - p.ry + 5} ${p.x + p.rx - 11},${p.y} ${p.x},${p.y + p.ry - 5} ${p.x - p.rx + 11},${p.y}`} fill="none" stroke={C('plaza-2')} strokeOpacity={0.7} strokeWidth={1.2} strokeDasharray="9 3" />
      <rect x={0} y={0} width={W} height={Hh} fill={U('g-vignette')} />
      {/* framing trees at the edges */}
      <Tree x={70} y={300} s={1.1} />
      <Tree x={150} y={190} s={0.9} />
      <Tree x={50} y={620} s={1.15} />
      <Tree x={150} y={900} s={1} />
      <Tree x={420} y={965} s={0.85} />
      <Tree x={1400} y={150} s={0.9} />
      <Tree x={1565} y={545} s={1.1} />
      <Tree x={1380} y={975} s={0.9} />
      <Tree x={400} y={120} s={0.8} />
      <Tree x={1180} y={120} s={0.85} />
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
