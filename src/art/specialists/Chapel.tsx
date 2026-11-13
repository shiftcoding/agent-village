import type { BuildingAnchors, RingBox } from '../contract';
import { Box, C, Scaled, iso, scalePt, scaleRing } from '../buildings/iso';
import { BellTurret, GabledHouse, thin } from './House';

const A = 30;
const D = 26;
const H = 76;
const RISE = 32;

/** Spots in front of the chapel door (local coords): three on the front row, two behind them. */
export const CHAPEL_SPOTS: Array<{ x: number; y: number }> = [
  ...[-30, 0, 30].map((a) => iso(0, 0, a, D + 16)),
  ...[-15, 15].map((a) => iso(0, 0, a, D + 34)),
];

/** Scale origin: the ground at the foot of the front wall (T39 round 2: drawn 1.25x). */
const O = iso(0, 0, 0, D);
const K = 1.25;
const RAW_ANCHORS: BuildingAnchors = {
  door: iso(0, 0, 0, D + 4),
  roof: iso(0, 0, 0, 0, H + RISE + 34),
  workSpots: CHAPEL_SPOTS,
};
export const CHAPEL_ANCHORS: BuildingAnchors = { door: scalePt(RAW_ANCHORS.door, O, K), roof: scalePt(RAW_ANCHORS.roof, O, K), workSpots: RAW_ANCHORS.workSpots };

/** Focus ring box in local coords (bell turret to the steps, with the characters in front). */
export const CHAPEL_RING: RingBox = scaleRing({ x: -96, y: -143, w: 176, h: 267 }, O, K, 100);

function Lancet({ x }: { x: number }): JSX.Element {
  return (
    <g>
      <path d={`M${x - 4.6},-20 L${x - 4.6},-38 Q${x},-47 ${x + 4.6},-38 L${x + 4.6},-20 Z`} fill={C('stone-dark')} {...thin} />
      <path d={`M${x - 3},-21 L${x - 3},-37 Q${x},-43 ${x + 3},-37 L${x + 3},-21 Z`} fill={C('window')} />
      <path d={`M${x},-42 L${x},-21`} stroke={C('stone-dark')} strokeWidth={1} />
    </g>
  );
}

/** Round "sun window": a gold disc with eight rays in a stone ring. */
function SunWindow({ x, y, r }: { x: number; y: number; r: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r + 2.4} fill={C('stone-dark')} {...thin} />
      <circle r={r} fill={C('gold')} {...thin} />
      <g stroke={C('gold-dark')} strokeWidth={1.1} strokeLinecap="round">
        {Array.from({ length: 8 }, (_, k) => {
          const g = (k / 8) * Math.PI * 2;
          return <line key={k} x1={Math.cos(g) * r * 0.42} y1={Math.sin(g) * r * 0.42} x2={Math.cos(g) * r * 0.92} y2={Math.sin(g) * r * 0.92} />;
        })}
      </g>
      <circle r={r * 0.32} fill={C('highlight')} fillOpacity={0.8} />
    </g>
  );
}

/**
 * Chapel (content-safety-reviewer, the cleric): a small stone chapel with a slate roof, a bellcote on the ridge
 * (gold bell), an arched door and a gold sun window above it. Footprint centre at (0,0); about 135 wide, 150 tall.
 * No smoke and no lit windows (those mean an "active project"); it is a place, not a project.
 */
function ChapelArt(): JSX.Element {
  return (
    <g>
      <GabledHouse
        A={A}
        D={D}
        H={H}
        rise={RISE}
        tex="stone"
        wallLeft="stone-light"
        wallRight="stone"
        wallTop="stone"
        gable="stone"
        roof="slate"
        roofEdge="slate-dark"
        roofKind="slate"
        left={
          <g>
            <path d={`M0,0 L0,${-H} M${A * 2},0 L${A * 2},${-H}`} stroke={C('stone-dark')} strokeWidth={5} />
            <path d={`M0,-3 L${A * 2},-3`} stroke={C('stone-dark')} strokeWidth={4} />
            <Lancet x={10} />
            <Lancet x={A * 2 - 10} />
            <path d={`M${A - 10},0 L${A - 10},-30 Q${A},-44 ${A + 10},-30 L${A + 10},0 Z`} fill={C('stone-dark')} {...thin} />
            <path d={`M${A - 7.4},0 L${A - 7.4},-27 Q${A},-38 ${A + 7.4},-27 L${A + 7.4},0 Z`} fill={C('wood')} {...thin} />
            <path d={`M${A},-38 L${A},0 M${A - 7.4},-14 L${A + 7.4},-14`} stroke={C('wood-dark')} strokeWidth={1.1} />
            <circle cx={A + 4} cy={-15} r={1.3} fill={C('gold')} />
            <SunWindow x={A} y={-61} r={6.4} />
          </g>
        }
        right={
          <g>
            <Lancet x={D} />
            <path d={`M0,0 L0,${-H} M${D * 2},0 L${D * 2},${-H}`} stroke={C('stone-dark')} strokeWidth={5} />
          </g>
        }
        above={
          <g>
            <BellTurret a={A - 10} D={D} H={H} rise={RISE} capFill="slate-dark" capEdge="slate" />
            <Box cx={iso(0, 0, 0, D + 4).x} cy={iso(0, 0, 0, D + 4).y} A={12} D={3.4} h={3.4} left={C('stone-light')} right={C('stone')} top={C('stone-light')} />
          </g>
        }
      />
    </g>
  );
}

export function Chapel(): JSX.Element {
  return (
    <Scaled k={K} o={O}>
      <ChapelArt />
    </Scaled>
  );
}
