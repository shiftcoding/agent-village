import type { BuildingAnchors, RingBox } from '../contract';
import { Box, C, LINE, iso } from '../buildings/iso';
import { BellTurret, GabledHouse, thin } from './House';

const A = 36;
const D = 26;
const H = 46;
const RISE = 30;

/** Spots in front of the schoolhouse (local coords). The slate board stands on the left, so the spots lean right. */
export const SCHOOLHOUSE_SPOTS: Array<{ x: number; y: number }> = [
  ...[-12, 12, 36].map((a) => iso(0, 0, a, D + 16)),
  ...[0, 24].map((a) => iso(0, 0, a, D + 34)),
];

export const SCHOOLHOUSE_ANCHORS: BuildingAnchors = {
  door: iso(0, 0, 12, D + 3),
  roof: iso(0, 0, 0, 0, H + RISE + 30),
  workSpots: SCHOOLHOUSE_SPOTS,
};

/** Focus ring box in local coords (bell, slate board, building and the characters in front). */
export const SCHOOLHOUSE_RING: RingBox = { x: -140, y: -140, w: 220, h: 240 };

function Window({ x, y }: { x: number; y: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-7} y={-11} width={14} height={22} fill={C('wood-dark')} {...thin} />
      <rect x={-5.2} y={-9.2} width={10.4} height={18.4} fill={C('window')} />
      <path d="M0,-9.2 L0,9.2 M-5.2,-2 L5.2,-2" stroke={C('wood-dark')} strokeWidth={1.2} />
      <path d="M-5.2,-9.2 L-1.4,-9.2 L-5.2,-4.6 Z" fill={C('highlight')} fillOpacity={0.4} />
    </g>
  );
}

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
 * Schoolhouse (parenting-advisor, the teacher): a small timber schoolhouse with plank walls, a red tile roof,
 * a bell turret on the ridge and a slate board on legs beside it. Footprint centre (0,0); about 190 wide, 170 tall.
 * No smoke and no lit windows (those mean an "active project").
 */
export function Schoolhouse(): JSX.Element {
  const doorA = 12;
  const fx = A + doorA; // door centre on the face
  return (
    <g>
      <SlateBoard x={iso(0, 0, -A - 20, D + 12).x} y={iso(0, 0, -A - 20, D + 12).y + 4} />
      <GabledHouse
        A={A}
        D={D}
        H={H}
        rise={RISE}
        tex="planks"
        wallLeft="wood-light"
        wallRight="wood"
        wallTop="wood-dark"
        gable="wood"
        roof="roof"
        roofEdge="roof-dark"
        roofKind="tile"
        left={
          <g>
            <g stroke={C('wood-dark')} strokeWidth={0.9} strokeOpacity={0.55}>
              {Array.from({ length: Math.round(A * 2 / 6) - 1 }, (_, i) => (
                <line key={i} x1={(i + 1) * 6} y1={0} x2={(i + 1) * 6} y2={-H} />
              ))}
            </g>
            <path d={`M0,0 L0,${-H} M${A * 2},0 L${A * 2},${-H}`} stroke={C('wood-dark')} strokeWidth={3.6} />
            <path d={`M0,-3 L${A * 2},-3`} stroke={C('wood-dark')} strokeWidth={3} />
            <Window x={14} y={-H * 0.56} />
            <Window x={A - 14} y={-H * 0.56} />
            <Window x={A * 2 - 12} y={-H * 0.56} />
            {/* double door with a transom */}
            <rect x={fx - 11} y={-32} width={22} height={32} fill={C('wood-dark')} {...thin} />
            <rect x={fx - 9} y={-30} width={8.4} height={30} fill={C('wood')} />
            <rect x={fx + 0.6} y={-30} width={8.4} height={30} fill={C('wood')} />
            <path d={`M${fx - 9},-24 L${fx + 9},-24`} stroke={C('wood-dark')} strokeWidth={1} />
            <circle cx={fx - 2.6} cy={-14} r={1.1} fill={C('gold')} />
            <circle cx={fx + 2.6} cy={-14} r={1.1} fill={C('gold')} />
          </g>
        }
        right={
          <g>
            <path d={`M0,0 L0,${-H} M${D * 2},0 L${D * 2},${-H}`} stroke={C('wood-dark')} strokeWidth={3.6} />
            <Window x={D} y={-H * 0.56} />
          </g>
        }
        above={
          <g>
            <BellTurret a={A - 12} D={D} H={H} rise={RISE} capFill="roof-dark" capEdge="roof" size={6.4} height={18} />
            <Box cx={iso(0, 0, doorA, D + 4).x} cy={iso(0, 0, doorA, D + 4).y} A={13} D={3.4} h={3.4} left={C('stone-light')} right={C('stone')} top={C('stone-light')} />
          </g>
        }
      />
    </g>
  );
}
