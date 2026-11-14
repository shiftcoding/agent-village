import { Box, C, LINE, iso, leftFaceTf, pts } from '../buildings/iso';

export const thin = { ...LINE, strokeWidth: 0.95 } as const;

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
