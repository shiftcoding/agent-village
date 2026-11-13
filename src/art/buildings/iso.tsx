import type { ReactNode } from 'react';

/** 2:1 isometric helpers. Light comes from the top-left: the left-front face is lit, the right-front face is shaded. */
export interface Pt {
  x: number;
  y: number;
}

/**
 * Ground axes: `a` runs down-right along the long (left-front) face, `b` runs down-left
 * towards the viewer's left. `z` is height above the ground. Screen = cx + a - b, cy + (a+b)/2 - z.
 */
export const iso = (cx: number, cy: number, a: number, b: number, z = 0): Pt => ({
  x: cx + a - b,
  y: cy + (a + b) / 2 - z,
});

export const pts = (...p: Pt[]): string => p.map((q) => `${q.x},${q.y}`).join(' ');

export const C = (name: string): string => `var(--va-${name})`;
/** Reference to a shared def from ArtDefs (design.md section 12): U('g-lit') -> 'url(#va-g-lit)'. */
export const U = (id: string): string => `url(#va-${id})`;

export const LINE = {
  stroke: 'var(--va-outline)',
  strokeWidth: 1.1,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

export const SHADE_OPACITY = { fillOpacity: 'var(--va-shade-opacity)' } as const;

export type FaceTex = 'stone' | 'plaster' | 'logs' | 'planks';

/**
 * Painted overlay for one flat wall face (local coords: x 0..w, y -h..0). Material texture, sheen on the lit side
 * (or a dimming gradient on the shaded side), ambient occlusion at the foot, under the eave and in the corner.
 * All of it is low-contrast, and it is drawn BEFORE windows, doors and signs, so details stay on top.
 */
export function FaceFx({ w, h, side, tex }: { w: number; h: number; side: 'l' | 'r'; tex?: FaceTex }): JSX.Element {
  return (
    <g pointerEvents="none">
      {tex && <rect x={0} y={-h} width={w} height={h} fill={U(`p-${tex}`)} />}
      <rect x={0} y={-h} width={w} height={h} fill={side === 'l' ? U('g-lit') : U('g-dim')} />
      <rect x={0} y={-h} width={w} height={h} fill={U('g-ao-base')} />
      <rect x={0} y={-h} width={w} height={Math.min(h, 24)} fill={U('g-ao-top')} />
      {side === 'l' && <rect x={0} y={-h} width={w} height={h} fill={U('g-corner')} />}
    </g>
  );
}

/** Painted overlay for a flat, frontal rectangle (posts, planks, tower and facade walls). Never put it over text. */
export function FlatFx({ x, y, w, h, tex, dim }: { x: number; y: number; w: number; h: number; tex?: FaceTex; dim?: boolean }): JSX.Element {
  return (
    <g pointerEvents="none">
      {tex && <rect x={x} y={y} width={w} height={h} fill={U(`p-${tex}`)} />}
      <rect x={x} y={y} width={w} height={h} fill={dim ? U('g-dim') : U('g-lit')} />
      <rect x={x} y={y} width={w} height={h} fill={U('g-ao-base')} />
    </g>
  );
}

/** Painted overlay for a roof plane given by its polygon (screen coords): pattern, sheen, eave shade. */
export function RoofFx({ points, tex, eave }: { points: string; tex: 'thatch' | 'tiles' | 'slate'; eave?: string }): JSX.Element {
  return (
    <g pointerEvents="none">
      <polygon points={points} fill={U(`p-${tex}`)} />
      <polygon points={points} fill={U('g-lit')} />
      {eave && <polygon points={eave} fill={U('g-ao-top')} />}
    </g>
  );
}

export interface BoxProps {
  cx?: number;
  cy?: number;
  /** Half extents along a and b. */
  A: number;
  D: number;
  h: number;
  z?: number;
  left: string;
  right: string;
  top: string;
  topOpacity?: number;
  /** Material texture drawn over both vertical faces. */
  tex?: FaceTex;
  children?: ReactNode;
}

/** Isometric box: left (lit), right (shaded) and top faces. */
export function Box({ cx = 0, cy = 0, A, D, h, z = 0, left, right, top, tex, children }: BoxProps): JSX.Element {
  const B0 = iso(cx, cy, -A, -D, z + h);
  const R0 = iso(cx, cy, A, -D, z + h);
  const L0 = iso(cx, cy, -A, D, z + h);
  const F0 = iso(cx, cy, A, D, z + h);
  const Lg = iso(cx, cy, -A, D, z);
  const Fg = iso(cx, cy, A, D, z);
  const Rg = iso(cx, cy, A, -D, z);
  return (
    <g>
      <polygon points={pts(Lg, Fg, F0, L0)} fill={left} {...LINE} />
      <polygon points={pts(Fg, Rg, R0, F0)} fill={right} {...LINE} />
      <polygon points={pts(B0, R0, F0, L0)} fill={top} {...LINE} />
      {h >= 5 && (
        <g pointerEvents="none">
          <g transform={leftFaceTf(cx, cy, A, D, z)}>
            <FaceFx w={2 * A} h={h} side="l" tex={tex} />
          </g>
          <g transform={rightFaceTf(cx, cy, A, D, z)}>
            <FaceFx w={2 * D} h={h} side="r" tex={tex} />
          </g>
          {top !== 'none' && <polygon points={pts(B0, R0, F0, L0)} fill={U('g-lit')} />}
        </g>
      )}
      {children}
    </g>
  );
}

/** Transform that maps a flat face drawing (x right, y up = negative) onto the left-front face. */
export const leftFaceTf = (cx: number, cy: number, A: number, D: number, z = 0): string => {
  const o = iso(cx, cy, -A, D, z);
  return `matrix(1 0.5 0 1 ${o.x} ${o.y})`;
};
/** Same for the right-front face (origin at the front corner, x runs towards the back-right). */
export const rightFaceTf = (cx: number, cy: number, A: number, D: number, z = 0): string => {
  const o = iso(cx, cy, A, D, z);
  return `matrix(1 -0.5 0 1 ${o.x} ${o.y})`;
};

/** A timber beam between two points: dark under-stroke then a lighter core, so it reads as a round log. */
export function Beam({ p, q, w = 3.6 }: { p: Pt; q: Pt; w?: number }): JSX.Element {
  return (
    <g strokeLinecap="round">
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--va-outline)" strokeWidth={w + 1.6} />
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--va-wood)" strokeWidth={w} />
      <line x1={p.x - 0.6} y1={p.y} x2={q.x - 0.6} y2={q.y} stroke="var(--va-wood-light)" strokeWidth={w * 0.28} />
      <line x1={p.x + w * 0.22} y1={p.y} x2={q.x + w * 0.22} y2={q.y} stroke="var(--va-wood-dark)" strokeWidth={0.7} strokeOpacity={0.5} />
    </g>
  );
}

/** Soft ground shadow ellipse, cast towards the bottom-right. */
export function GroundShadow({ cx = 0, cy = 0, rx, ry }: { cx?: number; cy?: number; rx: number; ry: number }): JSX.Element {
  /* a wide soft cast shadow (falls to the bottom right) plus a tighter, darker contact shadow at the foot */
  return (
    <g pointerEvents="none">
      <ellipse cx={cx + 8} cy={cy + 4} rx={rx * 1.1} ry={ry * 1.12} fill={U('g-contact')} />
      <ellipse cx={cx + 1} cy={cy + 1} rx={rx * 0.84} ry={ry * 0.8} fill={U('g-contact')} />
    </g>
  );
}

/** Geometry a building reports so overlays (smoke, banner, cloud, vines, flag) can attach to it. */
export interface Geo {
  /** Where chimney smoke starts, or null when there is no chimney yet. */
  chimney: Pt | null;
  /** Highest point of the building (roof ridge or wall top), for the storm cloud. */
  top: Pt;
  /** Base of the needs-you banner pole. */
  bannerBase: Pt;
  /** Base of the released flag pole. */
  flagBase: Pt;
  /** Ground point at the door. */
  door: Pt;
  /** Where the masked friction figure sits. */
  doorstep: Pt;
  /** Brazier / campfire spot for stages without a chimney. */
  fire: Pt;
  /** Starting points and heights for creeping vines. */
  vines: Array<{ x: number; y: number; h: number; lean: number }>;
  /** Fireworks burst centres. */
  sky: Pt[];
  /** Horizontal extent used to size the storm cloud. */
  width: number;
}
