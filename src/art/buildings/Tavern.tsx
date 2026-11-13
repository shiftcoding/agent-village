import type { BuildingAnchors } from '../contract';
import { LitPane } from './Lamp';
import { Box, C, GroundShadow, LINE, RoofFx, SHADE_OPACITY, U, iso, leftFaceTf, pts, rightFaceTf } from './iso';

const thin = { ...LINE, strokeWidth: 0.9 } as const;

const A = 48;
const D = 34;
const H = 52;
const RISE = 30;

/** Sitting spots on the benches (feet at bench height) and standing spots around the tables (local coords). */
export const TAVERN_SIT_SPOTS: Array<{ x: number; y: number }> = [-20, 0, 20].flatMap((a) => [iso(0, 0, a, D + 12, 4), iso(0, 0, a, D + 38, 4)]);
export const TAVERN_STAND_SPOTS: Array<{ x: number; y: number }> = [iso(0, 0, -56, D + 14), iso(0, 0, 56, D + 14), iso(0, 0, -50, D + 44), iso(0, 0, 50, D + 44)];

export const TAVERN_ANCHORS: BuildingAnchors = {
  door: iso(0, 0, 0, D + 3),
  roof: iso(0, 0, 0, 0, H + RISE),
  workSpots: [...TAVERN_SIT_SPOTS, ...TAVERN_STAND_SPOTS],
};

function Bench({ b }: { b: number }): JSX.Element {
  const c = iso(0, 0, 0, b);
  return (
    <g>
      {[-26, 26].map((a) => (
        <Box key={a} cx={iso(0, 0, a, b).x} cy={iso(0, 0, a, b).y} A={2} D={3} h={4} left={C('wood-dark')} right={C('wood-dark')} top={C('wood-dark')} />
      ))}
      <Box cx={c.x} cy={c.y} A={30} D={3.4} h={3} z={4} left={C('wood-light')} right={C('wood')} top={C('wood-light')} />
    </g>
  );
}

/**
 * The tavern: a timber-and-plaster inn with a thatched roof, a hanging mug sign, dim (unlit) windows,
 * a long table and two benches outside. No chimney smoke on purpose: smoke and lit windows mean "active
 * project" in this village. At dusk and night its windows are lamp-lit (token --va-lamp): the tavern is a civic
 * place, not a project, so this is time of day, never the Active signal. Footprint centre at (0,0).
 */
export function Tavern(): JSX.Element {
  const Lt = iso(0, 0, -A - 6, D + 6, H - 2);
  const Ft = iso(0, 0, A + 6, D + 6, H - 2);
  const Rt = iso(0, 0, A + 6, -D - 6, H - 2);
  const M1 = iso(0, 0, -A - 6, 0, H + RISE);
  const M2 = iso(0, 0, A + 6, 0, H + RISE);
  const sg = iso(0, 0, A - 8, D, 0);
  return (
    <g>
      <GroundShadow rx={A + D + 14} ry={(A + D) / 2 + 10} />
      <Box A={A} D={D} h={H} left={C('plaster')} right={C('plaster-shade')} top={C('wood')} tex="plaster" />
      <g transform={leftFaceTf(0, 0, A, D)}>
        <path d={`M0,0 L0,${-H} M${A * 2},0 L${A * 2},${-H} M${A},0 L${A},${-H}`} stroke={C('wood')} strokeWidth={3.4} />
        <path d={`M0,${-H / 2} L${A * 2},${-H / 2}`} stroke={C('wood')} strokeWidth={3} />
        {[A * 0.4, A * 1.6].map((x) => (
          <g key={x} transform={`translate(${x} ${-H * 0.7})`}>
            <rect x={-8} y={-9} width={16} height={18} fill={C('wood-dark')} {...thin} />
            <rect x={-6} y={-7} width={12} height={14} fill={C('window')} />
            <path d="M0,-7 L0,7 M-6,0 L6,0" stroke={C('wood-dark')} strokeWidth={1.3} />
            <LitPane x={0} y={0} w={12} h={14} />
            <path d="M0,-7 L0,7 M-6,0 L6,0" stroke={C('wood-dark')} strokeWidth={1.3} style={{ opacity: 'var(--va-lamp)' }} />
          </g>
        ))}
        <path d={`M${A - 13},0 L${A - 13},-30 Q${A},-44 ${A + 13},-30 L${A + 13},0 Z`} fill={C('wood-dark')} {...thin} />
        <path d={`M${A - 10},0 L${A - 10},-29 Q${A},-40 ${A + 10},-29 L${A + 10},0 Z`} fill={C('wood')} />
        <circle cx={A + 6} cy={-16} r={1.6} fill={C('gold')} />
      </g>
      <g transform={rightFaceTf(0, 0, A, D)}>
        <path d={`M0,0 L0,${-H} M${D * 2},0 L${D * 2},${-H}`} stroke={C('wood')} strokeWidth={3.4} />
        <rect x={D - 8} y={-H * 0.7 - 9} width={16} height={18} fill={C('wood-dark')} {...thin} />
        <rect x={D - 6} y={-H * 0.7 - 7} width={12} height={14} fill={C('window')} />
        <rect x={0} y={-H} width={D * 2} height={H} fill={C('shade')} style={SHADE_OPACITY} />
        <LitPane x={D} y={-H * 0.7} w={12} h={14} />
      </g>
      <polygon points={pts(iso(0, 0, A, D, H), iso(0, 0, A, -D, H), iso(0, 0, A, 0, H + RISE * 0.9))} fill={C('plaster-shade')} {...LINE} />
      <polygon points={pts(iso(0, 0, A, D, H), iso(0, 0, A, -D, H), iso(0, 0, A, 0, H + RISE * 0.9))} fill={U('p-plaster')} />
      <polygon points={pts(iso(0, 0, A, D, H), iso(0, 0, A, -D, H), iso(0, 0, A, 0, H + RISE * 0.9))} fill={U('g-dim')} />
      <polygon points={pts(Lt, Ft, M2, M1)} fill={C('thatch')} {...LINE} />
      <RoofFx points={pts(Lt, Ft, M2, M1)} tex="thatch" />
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={Lt.x + (M1.x - Lt.x) * t} y1={Lt.y + (M1.y - Lt.y) * t} x2={Ft.x + (M2.x - Ft.x) * t} y2={Ft.y + (M2.y - Ft.y) * t} stroke={C('thatch-dark')} strokeWidth={1.4} strokeOpacity={0.7} />
      ))}
      <line x1={Ft.x} y1={Ft.y} x2={M2.x} y2={M2.y} stroke={C('thatch-dark')} strokeWidth={3.4} strokeLinecap="round" />
      <line x1={Rt.x} y1={Rt.y} x2={M2.x} y2={M2.y} stroke={C('thatch-dark')} strokeWidth={3.4} strokeLinecap="round" />
      <line x1={M1.x} y1={M1.y} x2={M2.x} y2={M2.y} stroke={C('thatch-dark')} strokeWidth={3} strokeLinecap="round" />
      {/* hanging mug sign */}
      <g transform={`translate(${sg.x + 6} ${sg.y - 40})`}>
        <path d="M-10,-20 L10,-20" stroke={C('outline')} strokeWidth={2} />
        <path d="M-8,-20 L-8,-12 M8,-20 L8,-12" stroke={C('outline')} strokeWidth={1.1} />
        <rect x={-14} y={-12} width={28} height={24} rx={4} fill={C('sign')} {...LINE} />
        <rect x={-6} y={-6} width={11} height={13} rx={2} fill={C('c-cream')} {...thin} />
        <path d="M5,-3 Q11,-3 10,3 Q9,7 5,6" fill="none" stroke={C('outline')} strokeWidth={1.4} />
        <rect x={-5} y={-5} width={9} height={3.4} fill={C('c-yellow')} />
      </g>
      {/* long table + two benches */}
      <Bench b={D + 12} />
      <Box cx={iso(0, 0, 0, D + 24).x} cy={iso(0, 0, 0, D + 24).y} A={30} D={6} h={13} left={C('wood-light')} right={C('wood')} top={C('wood-light')} tex="planks" />
      <Bench b={D + 38} />
    </g>
  );
}
