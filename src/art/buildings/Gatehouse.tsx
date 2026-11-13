import type { BuildingAnchors } from '../contract';
import { LitPane } from './Lamp';
import { C, FlatFx, GroundShadow, LINE, SHADE_OPACITY } from './iso';

const thin = { ...LINE, strokeWidth: 0.9 } as const;

/**
 * Standing spots (local coords, anchor = bottom centre of the gate opening). Index 0 is the paladin at his
 * post beside the left tower; the others are for agents handing over or waiting on a review.
 */
export const GATEHOUSE_SPOTS: Array<{ x: number; y: number }> = [
  { x: -68, y: 16 },
  { x: -30, y: 28 },
  { x: 8, y: 34 },
  { x: 46, y: 28 },
  { x: 84, y: 20 },
  { x: -104, y: 30 },
  { x: 118, y: 32 },
];

export const GATEHOUSE_ANCHORS: BuildingAnchors = {
  door: { x: 0, y: 0 },
  roof: { x: 0, y: -150 },
  workSpots: GATEHOUSE_SPOTS,
};

function Tower({ x, shaded }: { x: number; shaded?: boolean }): JSX.Element {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={-28} y={-124} width={56} height={124} fill={C('stone-light')} {...LINE} />
      <FlatFx x={-28} y={-124} w={56} h={124} tex="stone" dim={shaded} />
      {shaded && <rect x={-28} y={-124} width={56} height={124} fill={C('shade')} style={SHADE_OPACITY} />}
      <g fill={C('stone')} {...thin}>
        {[-28, -14, 0, 14].map((mx) => (
          <rect key={mx} x={mx} y={-136} width={13} height={14} />
        ))}
      </g>
      <path d="M-28,-30 L28,-30 M-28,-60 L28,-60 M-28,-92 L28,-92" stroke={C('outline')} strokeOpacity={0.3} strokeWidth={1} />
      <rect x={-3.5} y={-100} width={7} height={18} rx={3} fill={C('outline')} />
      <rect x={-3.5} y={-58} width={7} height={18} rx={3} fill={C('outline')} />
      <LitPane x={0} y={-91} w={4.4} h={14} />
      <LitPane x={0} y={-49} w={4.4} h={14} />
      <rect x={-28} y={-10} width={56} height={10} fill={C('stone-dark')} fillOpacity={0.5} />
    </g>
  );
}

/**
 * The paladin's post at the village entrance. Two crenellated towers, a gate arch with a striped check-bar
 * ("nothing passes unchecked") and a "Review" plank. About 190 wide, 150 tall; faces the viewer.
 */
export function Gatehouse(): JSX.Element {
  return (
    <g>
      <GroundShadow cx={12} cy={8} rx={120} ry={16} />
      <Tower x={-70} />
      <Tower x={70} shaded />
      {/* lintel wall */}
      <rect x={-44} y={-112} width={88} height={52} fill={C('stone-light')} {...LINE} />
      <FlatFx x={-44} y={-112} w={88} h={52} tex="stone" />
      <g fill={C('stone')} {...thin}>
        {[-44, -30, -16, -2, 12, 26].map((mx) => (
          <rect key={mx} x={mx} y={-124} width={13} height={13} />
        ))}
      </g>
      {/* arch opening with the path running through */}
      <path d="M-40,0 L-40,-48 Q0,-84 40,-48 L40,0 Z" fill={C('outline')} fillOpacity={0.85} {...LINE} />
      <path d="M-36,0 L-36,-46 Q0,-78 36,-46 L36,0 Z" fill={C('path')} fillOpacity={0.55} />
      {/* open gate leaves */}
      <path d="M-40,0 L-40,-48 L-30,-52 L-30,-4 Z" fill={C('wood')} {...thin} />
      <path d="M40,0 L40,-48 L30,-52 L30,-4 Z" fill={C('wood-dark')} {...thin} />
      {/* check-bar */}
      <g {...thin}>
        <rect x={-36} y={-26} width={72} height={6} rx={2} fill={C('c-cream')} />
        {[-30, -18, -6, 6, 18, 28].map((bx) => (
          <path key={bx} d={`M${bx},-26 L${bx + 6},-26 L${bx + 2},-20 L${bx - 4},-20 Z`} fill={C('c-red')} stroke="none" />
        ))}
        <rect x={-38} y={-30} width={4} height={30} fill={C('wood-dark')} />
        <rect x={34} y={-30} width={4} height={30} fill={C('wood-dark')} />
      </g>
      {/* review plank */}
      <g>
        <rect x={-30} y={-112} width={60} height={22} rx={3} fill={C('sign')} {...LINE} />
        <text x={0} y={-96} textAnchor="middle" fontSize={14} fontWeight={800} fontFamily="Georgia, serif" fill={C('ink')}>
          Review
        </text>
      </g>
      {/* banners on the towers */}
      {[-70, 70].map((x) => (
        <g key={x} transform={`translate(${x} -136)`}>
          <line x1={0} y1={0} x2={0} y2={-26} stroke={C('outline')} strokeWidth={2} />
          <path d="M0,-26 L20,-21 L0,-15 Z" fill={C('c-steel')} {...thin} />
        </g>
      ))}
    </g>
  );
}
