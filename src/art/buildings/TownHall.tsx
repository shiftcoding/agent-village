import type { BuildingAnchors } from '../contract';
import { LAMP_STYLE, LitPane } from './Lamp';
import { C, FlatFx, GroundShadow, LINE, SHADE_OPACITY, U } from './iso';

const thin = { ...LINE, strokeWidth: 0.9 } as const;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Free rectangle on the facade (local coords, anchor = bottom centre of the facade) where the UI places the
 * HTML "Needs you" notice board. The art draws only a wooden frame and parchment behind it.
 */
export const TOWN_HALL_NOTICE_RECT: Rect = { x: -112, y: -176, width: 224, height: 108 };

/**
 * Standing spots on the wide steps (local coords). Index 0 is the orchestrator (top step, centred);
 * the rest are for blocked characters, front rows last. Characters stand with feet at these points.
 */
export const TOWN_HALL_STEP_SPOTS: Array<{ x: number; y: number }> = [
  { x: 0, y: 8 },
  { x: -90, y: 21 },
  { x: -60, y: 21 },
  { x: -30, y: 21 },
  { x: 30, y: 21 },
  { x: 60, y: 21 },
  { x: 90, y: 21 },
  { x: -105, y: 35 },
  { x: -70, y: 35 },
  { x: -35, y: 35 },
  { x: 0, y: 35 },
  { x: 35, y: 35 },
  { x: 70, y: 35 },
  { x: 105, y: 35 },
];

export const TOWN_HALL_ANCHORS: BuildingAnchors = {
  door: { x: 0, y: 0 },
  roof: { x: 0, y: -340 },
  workSpots: TOWN_HALL_STEP_SPOTS,
};

/**
 * Town hall: a wide, front-facing hall (it must be readable without clicking) with a side wing in
 * isometric depth, a belfry, and three broad steps. About 260 wide, 340 tall, steps reach y +40.
 */
export function TownHall(): JSX.Element {
  const n = TOWN_HALL_NOTICE_RECT;
  return (
    <g>
      <GroundShadow cx={20} cy={14} rx={170} ry={26} />
      {/* side wing (shaded) and its roof */}
      <polygon points="130,0 190,-30 190,-182 130,-190" fill={C('plaster-shade')} {...LINE} />
      <polygon points="130,0 190,-30 190,-182 130,-190" fill={U('p-plaster')} />
      <polygon points="130,0 190,-30 190,-182 130,-190" fill={C('shade')} style={SHADE_OPACITY} />
      <polygon points="130,0 190,-30 190,-182 130,-190" fill={U('g-dim')} />
      <polygon points="142,-190 202,-220 62,-276 0,-246" fill={C('slate-dark')} {...LINE} />
      <polygon points="142,-190 202,-220 62,-276 0,-246" fill={U('p-slate-r')} />
      <polygon points="142,-190 202,-220 62,-276 0,-246" fill={U('g-lit')} />
      <path d="M150,-60 L176,-73 L176,-100 L150,-87 Z" fill={C('window')} {...thin} />
      <path d="M150,-125 L176,-138 L176,-160 L150,-147 Z" fill={C('window')} {...thin} />
      <g style={LAMP_STYLE}>
        <path d="M150,-60 L176,-73 L176,-100 L150,-87 Z" fill={C('window-lit')} {...thin} />
        <path d="M150,-125 L176,-138 L176,-160 L150,-147 Z" fill={C('window-lit')} {...thin} />
      </g>
      {/* facade */}
      <rect x={-130} y={-190} width={260} height={190} fill={C('plaster')} {...LINE} />
      <FlatFx x={-130} y={-190} w={260} h={190} tex="plaster" />
      <rect x={-130} y={-18} width={260} height={18} fill={C('stone')} {...LINE} />
      <FlatFx x={-130} y={-18} w={260} h={18} tex="stone" />
      <path d="M-130,-190 L-130,0 M130,-190 L130,0" stroke={C('wood-dark')} strokeWidth={5} />
      <path d="M-130,-186 L130,-186" stroke={C('wood-dark')} strokeWidth={5} />
      {/* pediment + roof */}
      <polygon points="-142,-190 142,-190 0,-246" fill={C('slate')} {...LINE} />
      <polygon points="-142,-190 142,-190 0,-246" fill={U('g-lit')} />
      <polygon points="-120,-194 120,-194 0,-240" fill={C('plaster')} {...thin} />
      <circle cx={0} cy={-214} r={9} fill={C('window')} stroke={C('wood-dark')} strokeWidth={3} />
      <LitPane x={0} y={-214} w={12} h={12} glow={false} />
      <path d="M0,-221 L0,-207 M-7,-214 L7,-214" stroke={C('wood-dark')} strokeWidth={1.4} />
      <polygon points="-142,-190 142,-190 142,-184 -142,-184" fill={C('slate-dark')} {...thin} />
      {/* belfry */}
      <rect x={-24} y={-296} width={48} height={52} fill={C('plaster')} {...LINE} />
      <path d="M-14,-246 L-14,-282 Q0,-296 14,-282 L14,-246 Z" fill={C('outline')} />
      <path d="M-7,-266 Q0,-262 7,-266 L9,-252 L-9,-252 Z" fill={C('gold')} {...thin} />
      <circle cx={0} cy={-251} r={2} fill={C('gold-dark')} />
      <polygon points="-30,-296 30,-296 0,-336" fill={C('slate')} {...LINE} />
      <polygon points="-30,-296 30,-296 0,-336" fill={U('g-lit')} />
      <line x1={0} y1={-336} x2={0} y2={-352} stroke={C('outline')} strokeWidth={2} />
      <path d="M0,-352 L18,-346 L0,-340 Z" fill={C('alert')} {...thin} />
      {/* notice board frame (HTML goes over the inner rect) */}
      <rect x={n.x - 8} y={n.y - 8} width={n.width + 16} height={n.height + 16} rx={4} fill={C('wood')} {...LINE} />
      <rect x={n.x} y={n.y} width={n.width} height={n.height} fill={C('parchment')} {...thin} />
      <circle cx={n.x - 3} cy={n.y - 3} r={2.4} fill={C('gold-dark')} />
      <circle cx={n.x + n.width + 3} cy={n.y - 3} r={2.4} fill={C('gold-dark')} />
      {/* columns and door */}
      {[-84, -56, 56, 84].map((x) => (
        <g key={x}>
          <rect x={x - 5} y={-62} width={10} height={44} rx={2} fill={C('stone-light')} {...thin} />
          <rect x={x - 7} y={-66} width={14} height={5} fill={C('stone')} {...thin} />
          <rect x={x - 7} y={-20} width={14} height={4} fill={C('stone')} {...thin} />
        </g>
      ))}
      <path d="M-22,-18 L-22,-44 Q0,-66 22,-44 L22,-18 Z" fill={C('wood-dark')} {...LINE} />
      <path d="M-18,-18 L-18,-42 Q0,-60 18,-42 L18,-18 Z" fill={C('wood')} {...thin} />
      <path d="M0,-60 L0,-18" stroke={C('wood-dark')} strokeWidth={1.2} />
      <circle cx={6} cy={-34} r={1.8} fill={C('gold')} />
      {/* steps */}
      {[
        { y: 0, x: 108 },
        { y: 12, x: 120 },
        { y: 24, x: 132 },
      ].map((s) => (
        <g key={s.y}>
          <rect x={-s.x} y={s.y} width={s.x * 2} height={12} fill={C('stone-light')} {...LINE} />
          <rect x={-s.x} y={s.y + 7} width={s.x * 2} height={5} fill={C('stone-dark')} fillOpacity={0.55} />
          <rect x={-s.x} y={s.y} width={s.x * 2} height={12} fill={U('p-stone')} />
          <rect x={-s.x} y={s.y} width={s.x * 2} height={3} fill={C('highlight')} fillOpacity={0.35} />
        </g>
      ))}
    </g>
  );
}
