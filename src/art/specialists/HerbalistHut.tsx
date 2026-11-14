import type { BuildingAnchors, RingBox } from '../contract';
import { Box, C, LINE, iso, Scaled, scalePt } from '../buildings/iso';
import { Bush, Door, SlabBox, Window, slopePt, thin } from '../v3/parts';
import { Shell, roofOf } from '../v3/Shell';

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

/** Scale origin: the ground at the foot of the front wall (T39 round 2: drawn 1.2x). */
const O = iso(0, 0, 0, D);
const K = 1.2;
const RAW_ANCHORS: BuildingAnchors = {
  door: iso(0, 0, 0, D + 3),
  roof: iso(0, 0, 0, 0, H + RISE + 4),
  workSpots: HERBALIST_SPOTS,
};
export const HERBALIST_ANCHORS: BuildingAnchors = { door: scalePt(RAW_ANCHORS.door, O, K), roof: scalePt(RAW_ANCHORS.roof, O, K), workSpots: RAW_ANCHORS.workSpots };

/** Focus ring box in local coords, measured from the art (T47): chimney to the characters in front, bush to the herb beds. */
export const HERBALIST_RING: RingBox = { x: -106, y: -146, w: 206, h: 240 };

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
 * Herbalist hut (womens-health-advisor, the healer). Art pass 3 (T47): a stone-plinth, plaster and timber cottage
 * under a deep thatch with a small roof chimney, herbs hung to dry along the eave, a half door, a leaf sign, a
 * shuttered window with a flower box and a herb garden of three raised beds on the right. Footprint centre (0,0).
 * No smoke and no lit windows (those mean an "active project").
 */
function HerbalistHutArt(): JSX.Element {
  const shell = { A, D, P: 8, W: H - 8, rise: RISE, over: OVER };
  const g = roofOf(shell);
  const bundles = [0.1, 0.22, 0.34, 0.66, 0.78, 0.9].map((u, i) => ({ ...slopePt(g, u, 0), i }));
  const door = iso(0, 0, 0, D);
  return (
    <g>
      {/* garden beds sit behind the hut's right side and in front of it; drawn first so the hut stands over them */}
      <Bed a={A + 30} b={-20} kind={2} />
      <Shell
        {...shell}
        seed={4}
        roof={{ kind: 'thatch', fill: 'thatch', edge: 'thatch-dark', seed: 9 }}
        frameLeft={{ posts: [], braces: [[0, 5, 'up']] }}
        frameRight={{ posts: [], braces: [[0, 10, 'up'], [2 * D - 10, 2 * D, 'down']] }}
        chimney={{ a: -A + 10, b: 1, w: 4.5, d: 5, above: 11 }}
        left={
          <g>
            {/* half door */}
            <Door x={A} w={15} h={29} />
            <path d={`M${A - 7.5},-13 L${A + 7.5},-13`} stroke="var(--va-outline)" strokeWidth={1.4} />
            <Window x={A * 1.62} y={-H * 0.52} w={10} h={12} shutters="vine" box />
            {/* leaf sign */}
            <g transform={`translate(${A * 0.3} ${-H * 0.5})`}>
              <line x1={-7} y1={-9} x2={7} y2={-9} stroke={C('outline')} strokeWidth={1.6} />
              <rect x={-8} y={-8} width={16} height={14} rx={2.4} fill={C('sign')} {...LINE} />
              <path d="M0,4 Q-6,-1 0,-6 Q6,-1 0,4 Z" fill={C('leaf')} {...thin} />
              <path d="M0,4 L0,-3.5" stroke={C('vine-dark')} strokeWidth={0.9} />
            </g>
          </g>
        }
        right={<Window x={D} y={-H * 0.52} w={9} h={11} shutters="vine" />}
        gable={{ fill: 'plaster', tex: 'plaster', detail: <Window x={D} y={-10} w={6} h={7} shape="round" /> }}
        above={
          <g>
            {bundles.map((b) => (
              <Bundle key={b.i} x={b.x} y={b.y + 4} i={b.i} />
            ))}
            {/* doorstep */}
            <SlabBox cx={door.x} cy={door.y + 3} A={10} D={3} h={3} />
          </g>
        }
      />
      <Bed a={A + 30} b={0} kind={1} />
      <Bed a={A + 30} b={20} kind={0} />
      <g transform={`translate(${iso(0, 0, -A - 8, D + 2).x} ${iso(0, 0, -A - 8, D + 2).y})`}>
        <Bush s={0.8} flowers={2} />
      </g>
    </g>
  );
}

export function HerbalistHut(): JSX.Element {
  return (
    <Scaled k={K} o={O}>
      <HerbalistHutArt />
    </Scaled>
  );
}
