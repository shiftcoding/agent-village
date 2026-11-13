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
  strokeWidth: 1.4,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;
/** Heavier line for the outer silhouette of a building or a roof (T39: storybook weight hierarchy 2.2 / 1.4 / 0.9). */
export const HEAVY = { ...LINE, strokeWidth: 2.3 } as const;

/**
 * T39 round 2: buildings are drawn bigger than their design size, scaled about a point on the ground at the foot of the
 * front wall, so the building grows up and sideways but its front edge, door and the work spots in front stay where they were.
 */
export const BUILDING_SCALE = 1.25;
export function Scaled({ k = BUILDING_SCALE, o, children }: { k?: number; o: Pt; children: ReactNode }): JSX.Element {
  return <g transform={`translate(${o.x} ${o.y}) scale(${k}) translate(${-o.x} ${-o.y})`}>{children}</g>;
}
export const scalePt = (p: Pt, o: Pt, k: number = BUILDING_SCALE): Pt => ({ x: o.x + k * (p.x - o.x), y: o.y + k * (p.y - o.y) });
/** Focus ring for a scaled building: left, right and top follow the scale, the bottom (name tags live below) stays. maxRight clamps to the scene edge. */
export function scaleRing(r: { x: number; y: number; w: number; h: number }, o: Pt, k: number = BUILDING_SCALE, maxRight = Infinity): { x: number; y: number; w: number; h: number } {
  const x = Math.round(o.x + k * (r.x - o.x));
  const right = Math.min(maxRight, Math.round(o.x + k * (r.x + r.w - o.x)));
  const y = Math.round(o.y + k * (r.y - o.y));
  return { x, y, w: right - x, h: r.y + r.h - y };
}

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
      {/* T39 round 2: a clearly lit plane and a clearly dark plane */}
      {side === 'l' ? <rect x={0} y={-h} width={w} height={h} fill="var(--va-highlight)" style={{ fillOpacity: 'calc(var(--va-sheen-opacity) * 0.28)' }} /> : <rect x={0} y={-h} width={w} height={h} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shade-opacity) * 0.55)' }} />}
      <rect x={0} y={-h} width={w} height={h} fill={U('g-ao-base')} />
      <rect x={0} y={-h} width={w} height={Math.min(h, 24)} fill={U('g-ao-top')} />
      {side === 'l' && <rect x={0} y={-h} width={w} height={h} fill={U('g-corner')} />}
      {/* deep contact line where the wall meets the ground, and a dark band under the eave (T39) */}
      <rect x={0} y={-3} width={w} height={3} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-ao-opacity) * 0.55)' }} />
      {h > 18 && <rect x={0} y={-h} width={w} height={3.2} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-ao-opacity) * 0.6)' }} />}
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
      {!dim && h >= 12 && <path d={`M${x + 1.8},${y + 2} L${x + 1.8},${y + h - 2}`} stroke="var(--va-highlight)" strokeWidth={1.6} strokeLinecap="round" fill="none" style={{ strokeOpacity: 'var(--va-rim-opacity)' }} />}
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
      <polygon points={points} fill="none" {...HEAVY} />
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
  /** Height used for the cast shadow when the thing standing on the box is taller than the box (a roof). */
  castH?: number;
  children?: ReactNode;
}

/** Convex hull (monotone chain) of screen points: the outline of a shadow or silhouette. */
export function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2] as Pt, lo[lo.length - 1] as Pt, q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2] as Pt, up[up.length - 1] as Pt, q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/**
 * Cast shadow of a block on the ground: its footprint swept towards the bottom right (the light is top left), so the
 * shadow has the building's own footprint shape. Two stacked layers give a harder core and a softer fringe.
 */
export function CastShadow({ foot, h }: { foot: Pt[]; h: number }): JSX.Element {
  const sweep = (k: number) => hull([...foot, ...foot.map((q) => ({ x: q.x + h * 0.62 * k, y: q.y + h * 0.3 * k }))]);
  return (
    <g pointerEvents="none" fill="var(--va-shadow)" stroke="var(--va-shadow)" strokeLinejoin="round" strokeWidth={4}>
      <polygon points={pts(...sweep(1.12))} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.5)', strokeOpacity: 'calc(var(--va-shadow-opacity) * 0.3)' }} />
      <polygon points={pts(...sweep(0.74))} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.7)', strokeOpacity: 'calc(var(--va-shadow-opacity) * 0.4)' }} />
    </g>
  );
}

/** Isometric box: left (lit), right (shaded) and top faces. Standing on the ground (z = 0) and 14+ tall it casts a shadow. */
export function Box({ cx = 0, cy = 0, A, D, h, z = 0, left, right, top, tex, castH, children }: BoxProps): JSX.Element {
  const B0 = iso(cx, cy, -A, -D, z + h);
  const R0 = iso(cx, cy, A, -D, z + h);
  const L0 = iso(cx, cy, -A, D, z + h);
  const F0 = iso(cx, cy, A, D, z + h);
  const Lg = iso(cx, cy, -A, D, z);
  const Fg = iso(cx, cy, A, D, z);
  const Rg = iso(cx, cy, A, -D, z);
  const Bg = iso(cx, cy, -A, -D, z);
  return (
    <g>
      {z === 0 && (castH ?? h) >= 14 && <CastShadow foot={[Lg, Fg, Rg, Bg]} h={castH ?? h} />}
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
      {h >= 8 && (
        <g pointerEvents="none" fill="none" strokeLinecap="round" stroke="var(--va-highlight)" strokeWidth={1.7} style={{ strokeOpacity: 'var(--va-rim-opacity)' }}>
          {/* warm rim light on the lit edges: the corner, the top edge of the lit face and the back-left roof edge */}
          <path d={`M${L0.x + 1.8},${L0.y + 3} L${Lg.x + 1.8},${Lg.y - 3}`} />
          <path d={`M${L0.x + 3},${L0.y + 2.2} L${F0.x - 3},${F0.y + 2.2}`} />
        </g>
      )}
      <polygon points={pts(Lg, Fg, Rg, R0, B0, L0)} fill="none" {...HEAVY} pointerEvents="none" />
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

/**
 * Ground shadow for things that are not a Box (the frontal town hall, boards, trees, the well): a hard-edged cast shadow
 * blob that falls to the bottom right plus the soft contact shadow at the foot. `cast={false}` keeps only the contact.
 */
export function GroundShadow({ cx = 0, cy = 0, rx, ry, cast = true }: { cx?: number; cy?: number; rx: number; ry: number; cast?: boolean }): JSX.Element {
  return (
    <g pointerEvents="none">
      {cast && (
        <g fill="var(--va-shadow)">
          <ellipse cx={cx + rx * 0.3} cy={cy + ry * 0.62} rx={rx * 1.04} ry={ry * 1.1} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.55)' }} />
          <ellipse cx={cx + rx * 0.2} cy={cy + ry * 0.4} rx={rx * 0.9} ry={ry * 0.82} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.75)' }} />
        </g>
      )}
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
