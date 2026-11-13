import type { Pt } from './iso';
import { C, LINE } from './iso';

const thin = { ...LINE, strokeWidth: 0.95 } as const;

/**
 * Content-pipeline cart: a small two-wheeled hand cart with a crate of scrolls. Local origin = the wheel contact
 * centre (ground, between the wheels); about 40 wide, 30 tall. It means "open work is waiting at this stop"; the UI
 * draws it only at stops that hold real open items and supplies the count label itself (text stays in HTML/UI).
 */
export function PipelineCart(): JSX.Element {
  return (
    <g aria-hidden="true">
      <ellipse cx={4} cy={1} rx={28.6} ry={6.5} fill="url(#va-g-contact)" />
      {/* handles, resting on the ground on the left */}
      <path d="M-8,-12 L-24,-2 M-4,-10 L-21,0" stroke={C('wood-dark')} strokeWidth={2.4} strokeLinecap="round" />
      {/* far wheel */}
      <ellipse cx={4} cy={-6.4} rx={5.6} ry={6.8} fill="none" stroke={C('wood-dark')} strokeWidth={2.2} />
      {/* tray */}
      <path d="M-14,-14 L14,-14 L11,-5 L-11,-5 Z" fill={C('wood')} {...LINE} />
      <path d="M-14,-14 L14,-14" stroke={C('wood-light')} strokeWidth={1.2} />
      {/* crate of scrolls */}
      <path d="M-11,-14 L-11,-23 L11,-23 L11,-14 Z" fill={C('wood-light')} {...LINE} />
      <path d="M-11,-19 L11,-19" stroke={C('wood-dark')} strokeWidth={1} strokeOpacity={0.7} />
      {[-8, -3, 2, 7].map((x, i) => (
        <g key={x}>
          <rect x={x - 2.2} y={-30 + (i % 2) * 2} width={4.4} height={11} rx={2.2} fill={C('parchment')} {...thin} />
          <ellipse cx={x} cy={-30 + (i % 2) * 2} rx={2.2} ry={1.2} fill={C('plaster-shade')} {...thin} />
          <rect x={x - 2.2} y={-25 + (i % 2) * 2} width={4.4} height={1.6} fill={C('c-red')} />
        </g>
      ))}
      {/* near wheel with spokes */}
      <g transform="translate(-4 -7.4)">
        <ellipse rx={6.2} ry={7.4} fill={C('wood-light')} {...LINE} />
        <ellipse rx={3.4} ry={4.2} fill="none" stroke={C('wood-dark')} strokeWidth={0.9} />
        <path d="M0,-7 L0,7 M-5.6,-3 L5.6,3 M-5.6,3 L5.6,-3" stroke={C('wood-dark')} strokeWidth={0.9} />
        <circle r={1.3} fill={C('wood-dark')} />
      </g>
    </g>
  );
}

/**
 * Faint cart-rut track along the route of the pipeline: two dashed wheel lines through the given points (scene
 * coords, in route order). Draw it only while at least one stop has open work; it means "this is the route work takes".
 */
export function PipelineTrack({ points }: { points: Pt[] }): JSX.Element | null {
  if (points.length < 2) return null;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return (
    <g aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
      {[-2.6, 2.6].map((o) => (
        <path key={o} d={d} transform={`translate(0 ${o})`} stroke={C('wood-dark')} strokeWidth={1.8} strokeDasharray="7 6" strokeOpacity={0.42} />
      ))}
    </g>
  );
}
