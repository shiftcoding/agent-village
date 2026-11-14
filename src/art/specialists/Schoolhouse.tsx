import type { BuildingAnchors, RingBox } from '../contract';
import { C, LINE, iso, Scaled, scalePt } from '../buildings/iso';
import { Bush, Door, SlabBox, Window, thin } from '../v3/parts';
import { Shell } from '../v3/Shell';
import { BellTurret } from './House';

const A = 36;
const D = 26;
const H = 46;
const RISE = 30;

/** Spots in front of the schoolhouse (local coords). The slate board stands on the left, so the spots lean right. */
export const SCHOOLHOUSE_SPOTS: Array<{ x: number; y: number }> = [
  ...[-12, 12, 36].map((a) => iso(0, 0, a, D + 16)),
  ...[0, 24].map((a) => iso(0, 0, a, D + 34)),
];

/** Scale origin: the ground at the foot of the front wall (T39 round 2: drawn 1.25x). */
const O = iso(0, 0, 0, D);
const K = 1.25;
const RAW_ANCHORS: BuildingAnchors = {
  door: iso(0, 0, 12, D + 3),
  roof: iso(0, 0, 0, 0, H + RISE + 30),
  workSpots: SCHOOLHOUSE_SPOTS,
};
export const SCHOOLHOUSE_ANCHORS: BuildingAnchors = { door: scalePt(RAW_ANCHORS.door, O, K), roof: scalePt(RAW_ANCHORS.roof, O, K), workSpots: RAW_ANCHORS.workSpots };

/** Focus ring box in local coords, measured from the art (T47): bell and chimney to the characters in front, slate board to the bush. */
export const SCHOOLHOUSE_RING: RingBox = { x: -168, y: -146, w: 275, h: 246 };

/** Slate board on two legs with chalk drawings (tally strokes, a sum made of dots, a small tree). Frontal, no text. */
function SlateBoard({ x, y }: { x: number; y: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={5} cy={2} rx={28.6} ry={6.5} fill="url(#va-g-contact)" />
      <path d="M-14,0 L-10,-26 M14,0 L10,-26" stroke={C('wood-dark')} strokeWidth={3} strokeLinecap="round" />
      <rect x={-22} y={-62} width={44} height={36} rx={2.6} fill={C('wood')} {...LINE} />
      <rect x={-19} y={-59} width={38} height={30} fill={C('slate-dark')} {...thin} />
      <g stroke={C('c-cream')} strokeWidth={1.4} strokeLinecap="round" fill="none" strokeOpacity={0.9}>
        <path d="M-15,-53 L-15,-45 M-11,-53 L-11,-45 M-7,-53 L-7,-45 M-3,-53 L-3,-45 M-16,-47 L-2,-51" />
        <path d="M5,-47 L5,-41 M2,-44 L8,-44" />
        <path d="M9,-33 L14,-40 L17,-33 M11,-36 L16,-36" />
        <path d="M-15,-35 Q-9,-39 -3,-35" />
      </g>
      <rect x={-18} y={-27} width={36} height={3.4} rx={1} fill={C('wood-light')} {...thin} />
      <rect x={-6} y={-28.4} width={5} height={2} rx={0.8} fill={C('c-cream')} />
    </g>
  );
}

/**
 * Schoolhouse (parenting-advisor, the teacher). Art pass 3 (T47): a plank schoolhouse on a stone plinth with timber
 * corner framing, a red tile roof with a bell turret on the ridge and a chimney, tall arched windows, a double door
 * under a small hood and a slate board on legs beside it. Footprint centre (0,0).
 * No smoke and no lit windows (those mean an "active project").
 */
function SchoolhouseArt(): JSX.Element {
  const doorA = 12;
  const fx = A + doorA; // door centre on the face
  const shell = { A, D, P: 8, W: H - 8, rise: RISE, over: 6 };
  return (
    <g>
      <SlateBoard x={iso(0, 0, -A - 20, D + 12).x} y={iso(0, 0, -A - 20, D + 12).y + 4} />
      <Shell
        {...shell}
        seed={6}
        wall={{ left: 'wood-light', right: 'wood', tex: 'planks' }}
        roof={{ kind: 'tiles', fill: 'roof', edge: 'roof-dark', seed: 4 }}
        frameLeft={{ posts: [], rails: [] }}
        frameRight={{ posts: [D], braces: [[0, 12, 'up'], [2 * D - 12, 2 * D, 'down']] }}
        chimney={{ a: -A + 10, b: 2, w: 4.5, d: 4.5, above: 10 }}
        left={
          <g>
            <g stroke={C('wood-dark')} strokeWidth={0.8} strokeOpacity={0.5}>
              {Array.from({ length: Math.round((A * 2) / 6) - 1 }, (_, i) => (
                <line key={i} x1={(i + 1) * 6} y1={-8} x2={(i + 1) * 6} y2={-H} />
              ))}
            </g>
            <Window x={12} y={-H * 0.54} w={10} h={17} shape="arch" />
            <Window x={29} y={-H * 0.54} w={10} h={17} shape="arch" />
            <Window x={A * 2 - 8} y={-H * 0.54} w={8} h={17} shape="arch" />
            {/* double door under a little hood */}
            <Door x={fx} w={18} h={30} arch={false} surround="wood-dark" />
            <path d={`M${fx},-1 L${fx},-29`} stroke="var(--va-outline)" strokeWidth={1.1} />
            <circle cx={fx - 2.6} cy={-14} r={1.1} fill={C('gold')} />
            <path d={`M${fx - 14},-35 L${fx + 14},-35 L${fx},-44 Z`} fill={C('roof')} stroke="var(--va-outline)" strokeWidth={1.2} strokeLinejoin="round" />
            <path d={`M${fx - 14},-35 L${fx + 14},-35 L${fx + 14},-33 L${fx - 14},-33 Z`} fill={C('roof-dark')} {...thin} />
          </g>
        }
        right={<Window x={D} y={-H * 0.56} w={10} h={17} shape="arch" />}
        gable={{ fill: 'wood', tex: 'planks', detail: <Window x={D} y={-10} w={7} h={7} shape="round" /> }}
        above={
          <g>
            <BellTurret a={A - 12} D={D} H={H} rise={RISE} over={6} capFill="roof-dark" capEdge="roof" size={6.4} height={18} />
            <SlabBox cx={iso(0, 0, doorA, D + 4).x} cy={iso(0, 0, doorA, D + 4).y} A={13} D={3.4} h={3.4} />
          </g>
        }
      />
      <g transform={`translate(${iso(0, 0, A + 10, D - 4).x} ${iso(0, 0, A + 10, D - 4).y})`}>
        <Bush s={0.85} flowers={1} />
      </g>
    </g>
  );
}

export function Schoolhouse(): JSX.Element {
  return (
    <Scaled k={K} o={O}>
      <SchoolhouseArt />
    </Scaled>
  );
}
