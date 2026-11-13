import type { BuildingAnchors, RingBox } from '../contract';
import { Box, C, LINE, iso } from '../buildings/iso';
import { GabledHouse, roofPoint, thin } from './House';

const A = 28;
const D = 22;
const H = 46;
const RISE = 38;
const OVER = 8;

/** Spots in front of the hut (local coords); the herb beds are on the right, so the spots lean left. */
export const HERBALIST_SPOTS: Array<{ x: number; y: number }> = [
  ...[-30, -6, 18].map((a) => iso(0, 0, a, D + 16)),
  ...[-18, 6].map((a) => iso(0, 0, a, D + 34)),
];

export const HERBALIST_ANCHORS: BuildingAnchors = {
  door: iso(0, 0, 0, D + 3),
  roof: iso(0, 0, 0, 0, H + RISE + 4),
  workSpots: HERBALIST_SPOTS,
};

/** Focus ring box in local coords (hut, hanging herbs, garden beds and the characters in front). */
export const HERBALIST_RING: RingBox = { x: -92, y: -112, w: 196, h: 206 };

const HERB = ['leaf', 'vine', 'c-sage', 'c-yellow', 'c-magenta', 'vine-dark'] as const;

/** One drying bundle: a tie string, a tied neck and a bushy head hanging down. */
function Bundle({ x, y, i }: { x: number; y: number; i: number }): JSX.Element {
  const col = HERB[i % HERB.length] ?? 'leaf';
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={0} x2={0} y2={4} stroke={C('wood-dark')} strokeWidth={1} />
      <path d="M-1.6,4 L1.6,4 L4.6,16 Q0,19.4 -4.6,16 Z" fill={C(col)} {...thin} />
      <path d="M-1,6 L-1.6,15 M1.2,6 L1.8,15" stroke={C('outline')} strokeOpacity={0.4} strokeWidth={0.8} />
      <rect x={-2} y={3.6} width={4} height={1.8} fill={C('wood')} />
    </g>
  );
}

function Bed({ a, b, kind }: { a: number; b: number; kind: number }): JSX.Element {
  const c = iso(0, 0, a, b);
  const plant = (da: number, db: number, k: number): JSX.Element => {
    const p = iso(c.x, c.y, da, db, 5);
    if (kind === 0) {
      // lavender spikes
      return (
        <g key={k} transform={`translate(${p.x} ${p.y})`}>
          <path d="M0,0 L0,-7" stroke={C('vine-dark')} strokeWidth={1.2} />
          <ellipse cx={0} cy={-9} rx={1.8} ry={4} fill={C('c-magenta')} {...thin} />
        </g>
      );
    }
    if (kind === 1) {
      // sage and mint bushes
      return <ellipse key={k} cx={p.x} cy={p.y - 3} rx={4.6} ry={3.6} fill={C(k % 2 ? 'leaf' : 'c-sage')} {...thin} />;
    }
    // little yellow flowers on stalks
    return (
      <g key={k} transform={`translate(${p.x} ${p.y})`}>
        <path d="M0,0 L0,-6" stroke={C('vine-dark')} strokeWidth={1.2} />
        <circle cx={0} cy={-7.6} r={2.4} fill={C('c-yellow')} {...thin} />
        <circle cx={0} cy={-7.6} r={0.9} fill={C('wood-dark')} />
      </g>
    );
  };
  return (
    <g>
      <Box cx={c.x} cy={c.y} A={13} D={8} h={5} left={C('wood-light')} right={C('wood')} top={C('c-brown')} />
      {[
        [-7, -3],
        [0, 3],
        [7, -3],
        [-3, 4],
        [4, -4],
      ].map(([da, db], k) => plant(da ?? 0, db ?? 0, k))}
    </g>
  );
}

/**
 * Herbalist hut (womens-health-advisor, the healer): a small thatched hut with herbs hung to dry along the eaves,
 * a half door, a leaf sign and a herb garden of three raised beds on the right. Footprint centre (0,0); about
 * 170 wide, 140 tall. No smoke and no lit windows (those mean an "active project").
 */
export function HerbalistHut(): JSX.Element {
  const geo = { A, D, H, rise: RISE, over: OVER };
  const eave = (u: number): { x: number; y: number } => roofPoint(geo, u, 0);
  const bundles = [0.1, 0.24, 0.38, 0.62, 0.76, 0.9].map((u, i) => ({ ...eave(u), i }));
  const door = iso(0, 0, 0, D);
  return (
    <g>
      {/* garden beds sit behind the hut's right side and in front of it; drawn first so the hut stands over them */}
      <Bed a={A + 30} b={-20} kind={2} />
      <GabledHouse
        A={A}
        D={D}
        H={H}
        rise={RISE}
        over={OVER}
        tex="plaster"
        wallLeft="plaster"
        wallRight="plaster-shade"
        wallTop="wood"
        gable="plaster-shade"
        roof="thatch"
        roofEdge="thatch-dark"
        roofKind="thatch"
        left={
          <g>
            <path d={`M0,0 L0,${-H} M${A * 2},0 L${A * 2},${-H} M${A * 0.9},0 L${A * 0.9},${-H}`} stroke={C('wood')} strokeWidth={3.4} />
            <path d={`M0,-3 L${A * 2},-3`} stroke={C('wood')} strokeWidth={3} />
            {/* half door */}
            <path d={`M${A - 9},0 L${A - 9},-27 Q${A},-33 ${A + 9},-27 L${A + 9},0 Z`} fill={C('wood-dark')} {...thin} />
            <path d={`M${A - 7},0 L${A - 7},-26 Q${A},-30.6 ${A + 7},-26 L${A + 7},0 Z`} fill={C('wood')} />
            <path d={`M${A - 7},-12 L${A + 7},-12`} stroke={C('wood-dark')} strokeWidth={1.6} />
            <circle cx={A + 4} cy={-7} r={1.2} fill={C('gold')} />
            {/* window with shutters */}
            <g transform={`translate(${A * 1.6} ${-H * 0.52})`}>
              <rect x={-6} y={-7} width={12} height={14} fill={C('wood-dark')} {...thin} />
              <rect x={-4.4} y={-5.4} width={8.8} height={10.8} fill={C('window')} />
              <path d="M0,-5.4 L0,5.4 M-4.4,0 L4.4,0" stroke={C('wood-dark')} strokeWidth={1.1} />
              <rect x={-11} y={-7} width={4.6} height={14} fill={C('vine')} {...thin} />
              <rect x={6.4} y={-7} width={4.6} height={14} fill={C('vine')} {...thin} />
            </g>
            {/* leaf sign */}
            <g transform={`translate(${A * 0.28} ${-H * 0.5})`}>
              <line x1={-7} y1={-9} x2={7} y2={-9} stroke={C('outline')} strokeWidth={1.6} />
              <rect x={-8} y={-8} width={16} height={14} rx={2.4} fill={C('sign')} {...LINE} />
              <path d="M0,4 Q-6,-1 0,-6 Q6,-1 0,4 Z" fill={C('leaf')} {...thin} />
              <path d="M0,4 L0,-3.5" stroke={C('vine-dark')} strokeWidth={0.9} />
            </g>
          </g>
        }
        right={
          <g>
            <path d={`M0,0 L0,${-H} M${D * 2},0 L${D * 2},${-H}`} stroke={C('wood')} strokeWidth={3.4} />
            <rect x={D - 6} y={-H * 0.52 - 7} width={12} height={14} fill={C('wood-dark')} {...thin} />
            <rect x={D - 4.4} y={-H * 0.52 - 5.4} width={8.8} height={10.8} fill={C('window')} />
          </g>
        }
        above={
          <g>
            {bundles.map((b) => (
              <Bundle key={b.i} x={b.x} y={b.y} i={b.i} />
            ))}
            {/* doorstep */}
            <Box cx={door.x} cy={door.y + 3} A={10} D={3} h={3} left={C('stone-light')} right={C('stone')} top={C('stone-light')} />
          </g>
        }
      />
      <Bed a={A + 30} b={0} kind={1} />
      <Bed a={A + 30} b={20} kind={0} />
    </g>
  );
}
