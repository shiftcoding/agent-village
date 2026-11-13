import type { BuildingAnchors } from '../contract';
import { C, CastShadow, FlatFx, GroundShadow, HEAVY, LINE } from './iso';
import type { Rect } from './TownHall';

const thin = { ...LINE, strokeWidth: 0.95 } as const;

/** Area for the per-project weekly counts (local coords, anchor = foot of the post). */
export const TALLY_TEXT_RECT: Rect = { x: -64, y: -92, width: 128, height: 52 };

export const TALLY_ANCHORS: BuildingAnchors = { door: { x: 0, y: 14 }, roof: { x: 0, y: -120 }, workSpots: [{ x: -40, y: 20 }, { x: 40, y: 20 }] };

/** Weekly tally: a signboard on a post with a "This week" plank and an empty board for counts. No rankings. */
export function TallySign(): JSX.Element {
  const r = TALLY_TEXT_RECT;
  return (
    <g>
      <CastShadow foot={[{ x: -54, y: 2 }, { x: 54, y: 2 }, { x: 54, y: -3 }, { x: -54, y: -3 }]} h={70} />
      <GroundShadow cx={6} cy={4} rx={56} ry={8} cast={false} />
      <rect x={-4} y={-110} width={8} height={110} fill={C('wood-dark')} {...thin} />
      <FlatFx x={-4} y={-110} w={8} h={110} tex="planks" />
      <rect x={-48} y={-124} width={96} height={20} rx={3} fill={C('sign')} {...LINE} />
      <text x={0} y={-109} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily="Georgia, serif" fill={C('ink')}>
        This week
      </text>
      <rect x={r.x - 6} y={r.y - 6} width={r.width + 12} height={r.height + 12} rx={3} fill={C('wood-light')} {...HEAVY} />
      <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={C('parchment')} {...thin} />
    </g>
  );
}
