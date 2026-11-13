import type { ReactNode } from 'react';
import { Box, C, GroundShadow, LINE, RoofFx, SHADE_OPACITY, U, iso, leftFaceTf, pts, rightFaceTf, type FaceTex, type Pt } from '../buildings/iso';

export const thin = { ...LINE, strokeWidth: 0.9 } as const;

export interface HouseProps {
  /** Half extents of the footprint along a (long, lit face) and b. */
  A: number;
  D: number;
  /** Wall height and roof rise above the wall tops. */
  H: number;
  rise: number;
  /** Roof overhang. */
  over?: number;
  /** Token names (without --va-). */
  wallLeft: string;
  wallRight: string;
  wallTop: string;
  gable: string;
  roof: string;
  roofEdge: string;
  roofKind: 'thatch' | 'slate' | 'tile';
  /** Wall material texture (painted overlay). */
  tex?: FaceTex;
  /** Details on the lit left-front face (face coords: x 0..2A to the right, y up is negative). */
  left?: ReactNode;
  /** Details on the shaded right face (x 0..2D). A shade overlay is added on top. */
  right?: ReactNode;
  /** Drawn after the roof (screen coords): turrets, bundles, signs. */
  above?: ReactNode;
}

/** Point on the front roof slope: u along the ridge (0 left .. 1 right), t up the slope (0 eave .. 1 ridge). */
export function roofPoint(p: { A: number; D: number; H: number; rise: number; over: number }, u: number, t: number): Pt {
  const { A, D, H, rise, over } = p;
  const eaveL = iso(0, 0, -A - over, D + over, H - 2);
  const eaveR = iso(0, 0, A + over, D + over, H - 2);
  const ridgeL = iso(0, 0, -A - over, 0, H + rise);
  const ridgeR = iso(0, 0, A + over, 0, H + rise);
  const e = { x: eaveL.x + (eaveR.x - eaveL.x) * u, y: eaveL.y + (eaveR.y - eaveL.y) * u };
  const r = { x: ridgeL.x + (ridgeR.x - ridgeL.x) * u, y: ridgeL.y + (ridgeR.y - ridgeL.y) * u };
  return { x: e.x + (r.x - e.x) * t, y: e.y + (r.y - e.y) * t };
}

/** A small gabled house: box walls, front roof slope, right gable end. The specialist buildings share this shell. */
export function GabledHouse(p: HouseProps): JSX.Element {
  const { A, D, H, rise, over = 6, roofKind } = p;
  const geo = { A, D, H, rise, over };
  const Lt = roofPoint(geo, 0, 0);
  const Ft = roofPoint(geo, 1, 0);
  const M1 = roofPoint(geo, 0, 1);
  const M2 = roofPoint(geo, 1, 1);
  const Rt = iso(0, 0, A + over, -D - over, H - 2);
  const rows = roofKind === 'thatch' ? [0.28, 0.56, 0.8] : [0.2, 0.4, 0.6, 0.8];
  const bounds = [0, ...rows, 1];
  const nTicks = Math.max(4, Math.round(A / 5));
  return (
    <g>
      <GroundShadow rx={A + D + 14} ry={(A + D) / 2 + 10} />
      <Box A={A} D={D} h={H} left={C(p.wallLeft)} right={C(p.wallRight)} top={C(p.wallTop)} tex={p.tex} />
      {p.left && <g transform={leftFaceTf(0, 0, A, D)}>{p.left}</g>}
      <g transform={rightFaceTf(0, 0, A, D)}>
        {p.right}
        <rect x={0} y={-H} width={D * 2} height={H} fill={C('shade')} style={SHADE_OPACITY} />
      </g>
      <polygon points={pts(iso(0, 0, A, D, H), iso(0, 0, A, -D, H), iso(0, 0, A, 0, H + rise * 0.9))} fill={C(p.gable)} {...LINE} />
      {p.tex && <polygon points={pts(iso(0, 0, A, D, H), iso(0, 0, A, -D, H), iso(0, 0, A, 0, H + rise * 0.9))} fill={U(`p-${p.tex}`)} />}
      <polygon points={pts(iso(0, 0, A, D, H), iso(0, 0, A, -D, H), iso(0, 0, A, 0, H + rise * 0.9))} fill={C('shade')} style={SHADE_OPACITY} />
      <polygon points={pts(iso(0, 0, A, D, H), iso(0, 0, A, -D, H), iso(0, 0, A, 0, H + rise * 0.9))} fill={U('g-dim')} />
      <polygon points={pts(Lt, Ft, M2, M1)} fill={C(p.roof)} {...LINE} />
      <RoofFx points={pts(Lt, Ft, M2, M1)} tex={roofKind === 'tile' ? 'tiles' : roofKind} />
      {roofKind === 'thatch'
        ? rows.map((t) => {
            const a = roofPoint(geo, 0, t);
            const b = roofPoint(geo, 1, t);
            return <line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C(p.roofEdge)} strokeWidth={1.4} strokeOpacity={0.7} />;
          })
        : bounds.slice(0, -1).map((t0, j) => {
            const t1 = bounds[j + 1] ?? 1;
            return (
              <g key={j} stroke={C(p.roofEdge)} strokeWidth={1.1} strokeOpacity={0.75}>
                {j > 0 && <line x1={roofPoint(geo, 0, t0).x} y1={roofPoint(geo, 0, t0).y} x2={roofPoint(geo, 1, t0).x} y2={roofPoint(geo, 1, t0).y} />}
                {Array.from({ length: nTicks }, (_, k) => {
                  const u = (k + 0.5 + (j % 2 ? 0.5 : 0)) / (nTicks + 0.5);
                  const a = roofPoint(geo, u, t0);
                  const b = roofPoint(geo, u, t1);
                  return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
                })}
              </g>
            );
          })}
      <line x1={Ft.x} y1={Ft.y} x2={M2.x} y2={M2.y} stroke={C(p.roofEdge)} strokeWidth={3.4} strokeLinecap="round" />
      <line x1={Rt.x} y1={Rt.y} x2={M2.x} y2={M2.y} stroke={C(p.roofEdge)} strokeWidth={3.4} strokeLinecap="round" />
      <line x1={M1.x} y1={M1.y} x2={M2.x} y2={M2.y} stroke={C(p.roofEdge)} strokeWidth={3} strokeLinecap="round" />
      {roofKind === 'thatch' && <line x1={Lt.x} y1={Lt.y} x2={Ft.x} y2={Ft.y} stroke={C(p.roofEdge)} strokeWidth={3.2} strokeDasharray="5 3" strokeLinecap="round" />}
      {p.above}
    </g>
  );
}

/** A small turret on the ridge (bell chamber): open arch on the lit face showing a bell, and a pyramid cap. */
export function BellTurret({ a, D, H, rise, over = 6, capFill, capEdge, size = 7, height = 20 }: { a: number; D: number; H: number; rise: number; over?: number; capFill: string; capEdge: string; size?: number; height?: number }): JSX.Element {
  // base sits on the front roof slope just below the ridge
  const zb = H + rise * (1 - (size + 1) / (D + over)) - 1;
  const c = iso(0, 0, a, 0);
  const s = size;
  const faceTf = leftFaceTf(c.x, c.y, s, s, zb);
  const top = zb + height;
  const apex = iso(c.x, c.y, 0, 0, top + 15);
  const L = iso(c.x, c.y, -s, s, top);
  const F = iso(c.x, c.y, s, s, top);
  const R = iso(c.x, c.y, s, -s, top);
  return (
    <g>
      <Box cx={c.x} cy={c.y} A={s} D={s} h={height} z={zb} left={C('plaster')} right={C('plaster-shade')} top={C('wood-dark')} tex="plaster" />
      <g transform={faceTf}>
        <path d={`M${s - 4.4},0 L${s - 4.4},${-height + 9} Q${s},${-height + 3} ${s + 4.4},${-height + 9} L${s + 4.4},0 Z`} fill={C('outline')} fillOpacity={0.85} />
        <path d={`M${s - 3.2},${-height + 8} Q${s},${-height + 4} ${s + 3.2},${-height + 8} L${s + 4},${-height + 14} L${s - 4},${-height + 14} Z`} fill={C('gold')} {...thin} />
        <circle cx={s} cy={-height + 15} r={1.2} fill={C('gold-dark')} />
      </g>
      <polygon points={pts(L, F, apex)} fill={C(capFill)} {...LINE} />
      <polygon points={pts(F, R, apex)} fill={C(capEdge)} {...LINE} />
      <line x1={apex.x} y1={apex.y} x2={apex.x} y2={apex.y - 8} stroke={C('outline')} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}
