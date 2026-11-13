import type { BuildingAnchors } from '../contract';
import { C, FlatFx, GroundShadow, LINE, U } from './iso';
import type { Rect } from './TownHall';

const thin = { ...LINE, strokeWidth: 0.9 } as const;

/** Area (local coords, anchor = bottom centre of the posts) where the UI places parchment notes. */
export const QUEST_BOARD_NOTE_RECT: Rect = { x: -84, y: -122, width: 168, height: 80 };

/** Standing spots in front of the board for agents who are studying it (todo only). */
export const QUEST_BOARD_SPOTS: Array<{ x: number; y: number }> = [
  { x: -60, y: 16 },
  { x: -20, y: 16 },
  { x: 20, y: 16 },
  { x: 60, y: 16 },
  { x: -40, y: 36 },
  { x: 0, y: 38 },
  { x: 40, y: 36 },
];

export const QUEST_BOARD_ANCHORS: BuildingAnchors = {
  door: { x: 0, y: 16 },
  roof: { x: 0, y: -160 },
  workSpots: QUEST_BOARD_SPOTS,
};

/** Quest board: two posts, a shingled cap, a "Quest board" plank, and a dark wood field for the notes. Frame only. */
export function QuestBoard(): JSX.Element {
  const n = QUEST_BOARD_NOTE_RECT;
  return (
    <g>
      <GroundShadow cx={10} cy={6} rx={110} ry={13} />
      <rect x={-100} y={-128} width={9} height={128} fill={C('wood-dark')} {...thin} />
      <rect x={91} y={-128} width={9} height={128} fill={C('wood-dark')} {...thin} />
      <FlatFx x={-100} y={-128} w={9} h={128} tex="planks" />
      <FlatFx x={91} y={-128} w={9} h={128} tex="planks" dim />
      <rect x={n.x - 8} y={n.y - 8} width={n.width + 16} height={n.height + 16} rx={3} fill={C('wood-light')} {...LINE} />
      <rect x={n.x} y={n.y} width={n.width} height={n.height} fill={C('wood')} {...thin} />
      <rect x={n.x} y={n.y} width={n.width} height={n.height} fill={U('p-planks')} />
      <rect x={n.x} y={n.y} width={n.width} height={n.height} fill={U('g-ao-top')} />
      <path d={`M${n.x},${n.y + 26} L${n.x + n.width},${n.y + 26} M${n.x},${n.y + 52} L${n.x + n.width},${n.y + 52}`} stroke={C('wood-dark')} strokeOpacity={0.4} strokeWidth={1} />
      <polygon points="-112,-130 112,-130 98,-150 -98,-150" fill={C('roof')} {...LINE} />
      <polygon points="-112,-130 112,-130 98,-150 -98,-150" fill={U('g-lit')} />
      <polygon points="-112,-130 112,-130 112,-124 -112,-124" fill={C('roof-dark')} {...thin} />
      <rect x={-48} y={-176} width={96} height={22} rx={3} fill={C('sign')} {...LINE} />
      <text x={0} y={-160} textAnchor="middle" fontSize={14} fontWeight={800} fontFamily="Georgia, serif" fill={C('ink')}>
        Quest board
      </text>
      <path d="M-38,-154 L-38,-150 M38,-154 L38,-150" stroke={C('outline')} strokeWidth={1.4} />
    </g>
  );
}
