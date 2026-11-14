import { Box, C, GroundShadow, LINE, SHADE_OPACITY, U, iso, leftFaceTf, pts, rightFaceTf } from '../buildings/iso';
import { Bush, Door, FootTufts, GableRoof, GardenBed, SlabBox, Stones, Window, thin, type RoofGeo } from './parts';

const A = 44;
const D = 24;
const H = 46;
const ROOF: RoofGeo = { A, D, H, rise: 34, over: 4 };
/** Square bell tower at the left (west) end. */
const T = 14;
const TA = -A - T;
const TH = 84;

function Belfry({ w }: { w: number }): JSX.Element {
  return (
    <g>
      <path d={`M${w / 2 - 6},${-TH + 22} L${w / 2 - 6},${-TH + 10} A6,6 0 0 1 ${w / 2 + 6},${-TH + 10} L${w / 2 + 6},${-TH + 22} Z`} fill={C('stone-light')} {...thin} />
      <path d={`M${w / 2 - 4.4},${-TH + 22} L${w / 2 - 4.4},${-TH + 10.5} A4.4,4.4 0 0 1 ${w / 2 + 4.4},${-TH + 10.5} L${w / 2 + 4.4},${-TH + 22} Z`} fill="var(--va-outline)" fillOpacity={0.9} />
      <path d={`M${w / 2 - 3},${-TH + 15} Q${w / 2},${-TH + 10} ${w / 2 + 3},${-TH + 15} L${w / 2 + 3.8},${-TH + 20} L${w / 2 - 3.8},${-TH + 20} Z`} fill={C('gold')} {...thin} />
      <rect x={w / 2 - 7} y={-TH + 22} width={14} height={2} fill={C('stone-light')} {...thin} />
    </g>
  );
}

/**
 * Art pass 3 preview (T46): a stone chapel. Long nave with buttresses and tall pointed windows, a slate roof, a
 * square bell tower with a belfry and a slate spire, a rose window in the gable, a low churchyard wall and a yew.
 */
export function StoneChapel(): JSX.Element {
  const tc = iso(0, 0, TA, 0);
  const zt = TH + 4;
  const s = T + 3;
  const apex = iso(tc.x, tc.y, 0, 0, zt + 46);
  const L = iso(tc.x, tc.y, -s, s, zt);
  const F = iso(tc.x, tc.y, s, s, zt);
  const R = iso(tc.x, tc.y, s, -s, zt);
  return (
    <g>
      <GroundShadow rx={A + D + 30} ry={(A + D) / 2 + 14} cast={false} />
      {/* bell tower */}
      <Box cx={tc.x} cy={tc.y} A={T} D={T} h={TH} castH={TH + 30} left={C('stone')} right={C('stone')} top={C('stone-dark')} tex="stone" />
      <g transform={leftFaceTf(tc.x, tc.y, T, T)}>
        <Stones w={2 * T} h={TH} seed={31} />
        <Door x={T} w={13} h={22} />
        <Window x={T} y={-46} w={6} h={14} shape="lancet" frame="stone-light" />
        <Belfry w={2 * T} />
        <rect x={0} y={-TH + 26} width={2 * T} height={2.6} fill={C('stone-light')} {...thin} />
      </g>
      <g transform={rightFaceTf(tc.x, tc.y, T, T)}>
        <Stones w={2 * T} h={TH} seed={32} />
        <Belfry w={2 * T} />
        <rect x={0} y={-TH + 26} width={2 * T} height={2.6} fill={C('stone-light')} {...thin} />
        <rect x={0} y={-TH} width={2 * T} height={TH} fill="var(--va-shade)" style={SHADE_OPACITY} />
      </g>
      <SlabBox cx={tc.x} cy={tc.y} A={T + 2} D={T + 2} h={4} z={TH} />
      {/* spire */}
      <polygon points={pts(L, F, apex)} fill={C('slate')} {...LINE} />
      <polygon points={pts(L, F, apex)} fill={U('p-slate')} />
      <polygon points={pts(L, F, apex)} fill={U('g-lit')} />
      <polygon points={pts(F, R, apex)} fill={C('slate')} {...LINE} />
      <polygon points={pts(F, R, apex)} fill={U('p-slate-r')} />
      <polygon points={pts(F, R, apex)} fill="var(--va-shade)" style={SHADE_OPACITY} />
      {[0.25, 0.5, 0.75].map((t) => (
        <path key={t} d={`M${L.x + (apex.x - L.x) * t},${L.y + (apex.y - L.y) * t} L${F.x + (apex.x - F.x) * t},${F.y + (apex.y - F.y) * t} L${R.x + (apex.x - R.x) * t},${R.y + (apex.y - R.y) * t}`} fill="none" stroke={C('slate-dark')} strokeWidth={1} />
      ))}
      <path d={`M${L.x},${L.y} L${F.x},${F.y} L${R.x},${R.y}`} fill="none" stroke={C('slate-dark')} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${F.x},${F.y} L${apex.x},${apex.y}`} stroke="var(--va-highlight)" strokeWidth={1} style={{ strokeOpacity: 'var(--va-rim-opacity)' }} />
      <line x1={apex.x} y1={apex.y} x2={apex.x} y2={apex.y - 12} stroke="var(--va-outline)" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={apex.x} cy={apex.y - 13} r={2.6} fill={C('gold')} {...thin} />
      {/* nave */}
      <Box A={A} D={D} h={H} castH={H + ROOF.rise * 0.8} left={C('stone')} right={C('stone')} top={C('stone-dark')} tex="stone" />
      <g transform={leftFaceTf(0, 0, A, D)}>
        <Stones w={2 * A} h={H} seed={33} />
        {[11, 33, 55, 77].map((x) => (
          <Window key={x} x={x} y={-24} w={8} h={20} shape="lancet" frame="stone-light" />
        ))}
        <rect x={0} y={-8} width={2 * A} height={2.4} fill={C('stone-light')} {...thin} />
      </g>
      <g transform={rightFaceTf(0, 0, A, D)}>
        <Stones w={2 * D} h={H} seed={34} />
        <Window x={D} y={-22} w={10} h={24} shape="lancet" frame="stone-light" />
        <rect x={0} y={-8} width={2 * D} height={2.4} fill={C('stone-light')} {...thin} />
        <rect x={0} y={-H} width={2 * D} height={H} fill="var(--va-shade)" style={SHADE_OPACITY} />
      </g>
      <GableRoof
        g={ROOF}
        kind="slate"
        fill="slate"
        edge="slate-dark"
        gable="stone"
        gableTex="stone"
        seed={5}
        gableDetail={<Window x={D} y={-13} w={13} h={13} shape="round" frame="stone-light" />}
      />
      {/* buttresses between the windows */}
      {[-22, 0, 22].map((a) => {
        const p = iso(0, 0, a, D + 3);
        return (
          <g key={a}>
            <Box cx={p.x} cy={p.y} A={3.4} D={3} h={30} left={C('stone')} right={C('stone')} top={C('stone')} tex="stone" />
            <SlabBox cx={p.x} cy={p.y} A={3.8} D={3.4} h={3} z={30} fill="stone" side="stone-dark" />
            <SlabBox cx={p.x} cy={p.y} A={4.2} D={3.8} h={2} z={0} />
          </g>
        );
      })}
      <FootTufts A={A} D={D} seed={12} />
      {/* churchyard: low wall, flower bed and a yew */}
      <GardenBed a={22} b={D + 12} A={18} D={4} seed={14} />
      <SlabBox cx={iso(0, 0, 32, D + 22).x} cy={iso(0, 0, 32, D + 22).y} A={26} D={2.4} h={7} fill="stone-light" side="stone" />
      <g transform={`translate(${iso(0, 0, A + 14, 6).x} ${iso(0, 0, A + 14, 6).y})`}>
        <Bush s={1.3} />
      </g>
      <g transform={`translate(${iso(0, 0, TA - 6, T + 10).x} ${iso(0, 0, TA - 6, T + 10).y})`}>
        <Bush s={0.9} flowers={1} />
      </g>
    </g>
  );
}
