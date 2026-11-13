import type { BuildingAnchors } from '../contract';
import { C, CastShadow, FlatFx, GroundShadow, HEAVY, LINE } from './iso';
import type { Rect } from './TownHall';

const thin = { ...LINE, strokeWidth: 0.95 } as const;

/** Text area on the unrolled scroll (local coords, anchor = foot of the stand). */
export const CHRONICLE_TEXT_RECT: Rect = { x: -68, y: -150, width: 136, height: 92 };

/** Spots for agents reading the chronicle (the herald stands here). */
export const CHRONICLE_SPOTS: Array<{ x: number; y: number }> = [
  { x: -50, y: 22 },
  { x: -16, y: 30 },
  { x: 18, y: 30 },
  { x: 52, y: 22 },
];

export const CHRONICLE_ANCHORS: BuildingAnchors = { door: { x: 0, y: 20 }, roof: { x: 0, y: -176 }, workSpots: CHRONICLE_SPOTS };

/** The chronicle: a large scroll unrolled between two posts on a stone footing, with a "Chronicle" plank. */
export function ChronicleScroll(): JSX.Element {
  const r = CHRONICLE_TEXT_RECT;
  return (
    <g>
      <CastShadow foot={[{ x: -88, y: 3 }, { x: 88, y: 3 }, { x: 88, y: -5 }, { x: -88, y: -5 }]} h={110} />
      <GroundShadow cx={8} cy={6} rx={92} ry={12} cast={false} />
      <rect x={-84} y={-4} width={168} height={8} rx={3} fill={C('stone')} {...thin} />
      <rect x={-80} y={-170} width={7} height={170} fill={C('wood-dark')} {...thin} />
      <rect x={73} y={-170} width={7} height={170} fill={C('wood-dark')} {...thin} />
      <FlatFx x={-80} y={-170} w={7} h={170} tex="planks" />
      <FlatFx x={73} y={-170} w={7} h={170} tex="planks" dim />
      <FlatFx x={-84} y={-4} w={168} h={8} tex="stone" />
      <rect x={r.x - 8} y={r.y - 8} width={r.width + 16} height={r.height + 16} fill={C('parchment')} {...HEAVY} />
      <rect x={r.x - 12} y={r.y - 14} width={r.width + 24} height={10} rx={5} fill={C('wood-light')} {...LINE} />
      <rect x={r.x - 12} y={r.y + r.height + 4} width={r.width + 24} height={10} rx={5} fill={C('wood-light')} {...LINE} />
      <rect x={-40} y={-184} width={80} height={22} rx={3} fill={C('sign')} {...LINE} />
      <text x={0} y={-168} textAnchor="middle" fontSize={14} fontWeight={800} fontFamily="Georgia, serif" fill={C('ink')}>
        Chronicle
      </text>
    </g>
  );
}
