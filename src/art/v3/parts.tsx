import type { ReactNode } from 'react';
import { C, HEAVY, LINE, RoofFx, SHADE_OPACITY, U, iso, pts, rightFaceTf, type FaceTex, type Pt } from '../buildings/iso';
import { LAMP_STYLE } from '../buildings/Lamp';

/**
 * Art pass 3 (T46): shared detail parts for the richer, more detailed buildings. Same contract as the rest of src/art:
 * pure drawing, token colours only, light from the top left, anchor (0,0) at the centre of the footprint.
 * Face parts (windows, doors, timber framing, stones) draw in flat face coordinates (x right, y up is negative) and
 * are placed with leftFaceTf / rightFaceTf by the building.
 */

export const thin = { ...LINE, strokeWidth: 0.95 } as const;
export const hair = { ...LINE, strokeWidth: 0.7 } as const;
const SHADE = { fill: 'var(--va-shade)', style: SHADE_OPACITY } as const;

/** Tiny deterministic PRNG so scattered details are the same on every render. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const lerp = (p: Pt, q: Pt, t: number): Pt => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });

/* ------------------------------------------------------------ roofs */

/** A gable roof whose ridge runs along `a`: wall top at H, ridge at H + rise, eaves overhang by `over`. */
export interface RoofGeo {
  A: number;
  D: number;
  H: number;
  rise: number;
  over: number;
  /** Ground offset of the whole roof (screen units), for roofs that do not sit on the origin. */
  cx?: number;
  cy?: number;
}

/** Height of the roof surface at depth |b| (eave at b = D + over, ridge at b = 0). */
export const roofZ = (g: RoofGeo, b: number): number => g.H - 2 + (g.rise + 2) * (1 - Math.abs(b) / (g.D + g.over));
/** Depth on the front slope where the roof surface is at height z. */
export const roofB = (g: RoofGeo, z: number): number => (g.D + g.over) * (1 - (z - (g.H - 2)) / (g.rise + 2));
const gp = (g: RoofGeo, a: number, b: number, z: number): Pt => iso(g.cx ?? 0, g.cy ?? 0, a, b, z);

/** Point on the front slope: u along the ridge (0 left .. 1 right), t up the slope (0 eave .. 1 ridge). */
export function slopePt(g: RoofGeo, u: number, t: number): Pt {
  const a = -g.A - g.over + (2 * (g.A + g.over)) * u;
  const b = (g.D + g.over) * (1 - t);
  return gp(g, a, b, roofZ(g, b));
}

export type RoofKind = 'tiles' | 'slate' | 'thatch';

export interface GableRoofProps {
  g: RoofGeo;
  kind: RoofKind;
  /** Token names (without --va-). */
  fill: string;
  edge: string;
  gable: string;
  gableTex?: FaceTex;
  /** Details on the right gable end, in gable coordinates: x 0..2D towards the back, y up (apex at x = D, y = -rise * 0.9). */
  gableDetail?: ReactNode;
  /** Weathering seed: a few darker patches and moss on the roof. */
  seed?: number;
}

/** The roof plus its right gable end: courses, eave fascia, barge boards, ridge cap and a little weathering. */
export function GableRoof({ g, kind, fill, edge, gable, gableTex, gableDetail, seed = 1 }: GableRoofProps): JSX.Element {
  const { A, D, H, rise, over } = g;
  const Lt = slopePt(g, 0, 0);
  const Ft = slopePt(g, 1, 0);
  const M1 = slopePt(g, 0, 1);
  const M2 = slopePt(g, 1, 1);
  const Rt = gp(g, A + over, -D - over, H - 2);
  const tri = pts(gp(g, A, D, H), gp(g, A, -D, H), gp(g, A, 0, H + rise * 0.9));
  const plane = pts(Lt, Ft, M2, M1);
  const courses = kind === 'thatch' ? 5 : kind === 'slate' ? 9 : 7;
  const ticks = Math.max(6, Math.round((A + over) / (kind === 'slate' ? 4.5 : 5.5)));
  const r = rng(seed);
  const patches = Array.from({ length: kind === 'thatch' ? 4 : 5 }, () => ({ u: 0.12 + r() * 0.76, t: 0.15 + r() * 0.6, s: 0.6 + r() * 0.7 }));
  const gx = gp(g, A, D, H);
  return (
    <g>
      {/* gable end */}
      <polygon points={tri} fill={C(gable)} {...LINE} />
      {gableTex && <polygon points={tri} fill={U(`p-${gableTex}`)} />}
      {gableDetail && <g transform={rightFaceTf(g.cx ?? 0, g.cy ?? 0, A, D, H)}>{gableDetail}</g>}
      <polygon points={tri} {...SHADE} />
      <polygon points={tri} fill={U('g-dim')} />
      {/* soffit shadow: the overhang darkens the top of the gable */}
      <polygon points={pts(gp(g, A, D, H), gp(g, A, 0, H + rise * 0.9), gp(g, A, -D, H), gp(g, A, -D + 6, H + 3), gp(g, A, 0, H + rise * 0.9 - 6), gp(g, A, D - 6, H + 3))} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-ao-opacity) * 0.7)' }} />
      {/* front slope */}
      <polygon points={plane} fill={C(fill)} {...LINE} />
      <RoofFx points={plane} tex={kind === 'tiles' ? 'tiles' : kind} />
      {/* courses: a dark shadow line under each course and staggered joints (tiles, slate) or combed straw (thatch) */}
      {Array.from({ length: courses }, (_, j) => {
        const t0 = j / courses;
        const t1 = (j + 1) / courses;
        const a0 = slopePt(g, 0, t0);
        const b0 = slopePt(g, 1, t0);
        const band = pts(a0, b0, slopePt(g, 1, t0 + 0.035), slopePt(g, 0, t0 + 0.035));
        return (
          <g key={j}>
            {j > 0 && <polygon points={band} fill="var(--va-shadow)" style={{ fillOpacity: kind === 'thatch' ? 'calc(var(--va-ao-opacity) * 0.45)' : 'calc(var(--va-ao-opacity) * 0.6)' }} />}
            {j > 0 && <line x1={a0.x} y1={a0.y} x2={b0.x} y2={b0.y} stroke={C(edge)} strokeWidth={kind === 'thatch' ? 1.2 : 1} strokeOpacity={0.8} />}
            {kind !== 'thatch' &&
              Array.from({ length: ticks }, (_, k) => {
                const u = (k + 0.5 + (j % 2 ? 0.5 : 0)) / (ticks + 0.5);
                const p = slopePt(g, u, t0);
                const q = slopePt(g, u, t1);
                return <line key={k} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C(edge)} strokeWidth={0.8} strokeOpacity={0.7} />;
              })}
            {kind === 'thatch' &&
              Array.from({ length: ticks * 2 }, (_, k) => {
                const u = (k + 0.3 + r() * 0.4) / (ticks * 2);
                const p = slopePt(g, u, t0 + 0.02);
                const q = slopePt(g, u + 0.004, t0 + 0.02 + (t1 - t0) * 0.55);
                return <line key={k} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C(edge)} strokeWidth={0.7} strokeOpacity={0.55} strokeLinecap="round" />;
              })}
          </g>
        );
      })}
      {/* weathering: soft darker patches and a little moss */}
      {patches.map((p, i) => {
        const c = slopePt(g, p.u, p.t);
        return <ellipse key={i} cx={c.x} cy={c.y} rx={9 * p.s} ry={4 * p.s} fill={i % 2 ? C('vine') : C(edge)} style={{ fillOpacity: kind === 'thatch' ? 0.18 : 0.22 }} />;
      })}
      {/* eave fascia: the thickness of the roof edge */}
      <polygon points={pts(Lt, Ft, { x: Ft.x, y: Ft.y + (kind === 'thatch' ? 6 : 3.6) }, { x: Lt.x, y: Lt.y + (kind === 'thatch' ? 6 : 3.6) })} fill={C(edge)} {...LINE} />
      {kind === 'thatch' && <path d={`M${Lt.x},${Lt.y + 5} ${Array.from({ length: 22 }, (_, k) => { const p = lerp(Lt, Ft, (k + 0.5) / 22); return `L${p.x},${p.y + 7.5} L${lerp(Lt, Ft, (k + 1) / 22).x},${lerp(Lt, Ft, (k + 1) / 22).y + 5}`; }).join(' ')}`} fill={C(edge)} stroke="var(--va-outline)" strokeWidth={0.7} strokeLinejoin="round" />}
      {/* barge boards on the gable edges */}
      <path d={`M${Ft.x},${Ft.y} L${M2.x},${M2.y} L${Rt.x},${Rt.y}`} fill="none" stroke="var(--va-outline)" strokeWidth={kind === 'thatch' ? 7.4 : 5.6} strokeLinejoin="round" strokeLinecap="round" />
      <path d={`M${Ft.x},${Ft.y} L${M2.x},${M2.y} L${Rt.x},${Rt.y}`} fill="none" stroke={C(kind === 'thatch' ? edge : 'wood-dark')} strokeWidth={kind === 'thatch' ? 5.4 : 3.6} strokeLinejoin="round" strokeLinecap="round" />
      <path d={`M${Ft.x - 0.8},${Ft.y - 1.4} L${M2.x - 0.8},${M2.y - 1.4}`} fill="none" stroke="var(--va-highlight)" strokeWidth={1.1} style={{ strokeOpacity: 'var(--va-rim-opacity)' }} />
      {/* ridge cap */}
      <line x1={M1.x} y1={M1.y} x2={M2.x} y2={M2.y} stroke="var(--va-outline)" strokeWidth={kind === 'thatch' ? 8 : 5.6} strokeLinecap="round" />
      <line x1={M1.x} y1={M1.y} x2={M2.x} y2={M2.y} stroke={C(kind === 'slate' ? 'slate-dark' : edge)} strokeWidth={kind === 'thatch' ? 6 : 3.8} strokeLinecap="round" />
      {kind === 'thatch' &&
        Array.from({ length: 9 }, (_, k) => {
          const p = lerp(M1, M2, (k + 0.5) / 9);
          return <path key={k} d={`M${p.x - 5},${p.y + 2} L${p.x},${p.y + 7} L${p.x + 5},${p.y + 2}`} fill="none" stroke={C('wood-dark')} strokeWidth={1} strokeOpacity={0.7} />;
        })}
      <line x1={M1.x + 2} y1={M1.y - 1.6} x2={M2.x - 2} y2={M2.y - 1.6} stroke="var(--va-highlight)" strokeWidth={1.2} strokeLinecap="round" style={{ strokeOpacity: 'var(--va-rim-opacity)' }} />
      {/* deep shadow cast by the eave onto the wall below */}
      <polygon points={pts(gp(g, -A, D, H), gp(g, A, D, H), gp(g, A, D, H - 7), gp(g, -A, D, H - 7))} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-ao-opacity) * 0.55)' }} />
      <polygon points={pts(gx, gp(g, A, -D, H), gp(g, A, -D, H - 6), gp(g, A, D, H - 6))} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-ao-opacity) * 0.5)' }} />
    </g>
  );
}

/** A dormer on the front slope: small gabled front wall with a window, two little roof planes and a cheek. */
export function Dormer({ g, a, w, bd, hd, gr, roof, edge, wall, children }: { g: RoofGeo; a: number; w: number; bd: number; hd: number; gr: number; roof: string; edge: string; wall: string; children?: ReactNode }): JSX.Element {
  const z0 = roofZ(g, bd);
  const zE = z0 + hd;
  const zA = zE + gr;
  const bE = roofB(g, zE - 1);
  const bA = roofB(g, zA);
  const front = pts(gp(g, a - w, bd, z0), gp(g, a + w, bd, z0), gp(g, a + w, bd, zE), gp(g, a, bd, zA), gp(g, a - w, bd, zE));
  const P1 = gp(g, a, bd + 2.5, zA + 0.6);
  const P4 = gp(g, a, bA, zA);
  const left = pts(P1, gp(g, a - w - 2.5, bd + 2.5, zE - 1), gp(g, a - w - 2.5, bE, zE - 1), P4);
  const right = pts(P1, gp(g, a + w + 2.5, bd + 2.5, zE - 1), gp(g, a + w + 2.5, bE, zE - 1), P4);
  const cheek = pts(gp(g, a + w, bd, z0), gp(g, a + w, bE, zE - 1), gp(g, a + w, bd, zE));
  const o = gp(g, a, bd, z0);
  return (
    <g>
      <polygon points={cheek} fill={C(wall)} {...LINE} />
      <polygon points={cheek} {...SHADE} />
      <polygon points={front} fill={C(wall)} {...LINE} />
      <polygon points={front} fill={U('p-plaster')} />
      <g transform={`matrix(1 0.5 0 1 ${o.x} ${o.y})`}>{children}</g>
      <polygon points={left} fill={C(roof)} {...LINE} />
      <polygon points={left} fill={U('g-lit')} />
      <polygon points={right} fill={C(roof)} {...LINE} />
      <polygon points={right} {...SHADE} />
      <line x1={P1.x} y1={P1.y} x2={P4.x} y2={P4.y} stroke={C(edge)} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${gp(g, a - w - 2.5, bd + 2.5, zE - 1).x},${gp(g, a - w - 2.5, bd + 2.5, zE - 1).y} L${P1.x},${P1.y} L${gp(g, a + w + 2.5, bd + 2.5, zE - 1).x},${gp(g, a + w + 2.5, bd + 2.5, zE - 1).y}`} fill="none" stroke={C('wood-dark')} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** A stone chimney standing on the roof (b may cross the ridge), with a cap slab and a clay pot. */
export function RoofChimney({ g, a, b, w = 5, d = 5, above = 14, pot = true }: { g: RoofGeo; a: number; b: number; w?: number; d?: number; above?: number; pot?: boolean }): JSX.Element {
  const b1 = b + d;
  const b0 = b - d;
  const z = (bb: number) => roofZ(g, bb);
  const zt = Math.max(z(b0), z(b1), b0 < 0 && b1 > 0 ? z(0) : -Infinity) + above;
  const leftF = pts(gp(g, a - w, b1, z(b1)), gp(g, a + w, b1, z(b1)), gp(g, a + w, b1, zt), gp(g, a - w, b1, zt));
  const rightBase = b0 < 0 && b1 > 0 ? [gp(g, a + w, b1, z(b1)), gp(g, a + w, 0, z(0)), gp(g, a + w, b0, z(b0))] : [gp(g, a + w, b1, z(b1)), gp(g, a + w, b0, z(b0))];
  const rightF = pts(...rightBase, gp(g, a + w, b0, zt), gp(g, a + w, b1, zt));
  const c = gp(g, a, b, 0);
  const potTop = gp(g, a - 1, b, zt + 3 + 7);
  return (
    <g>
      <polygon points={leftF} fill={C('stone')} {...LINE} />
      <polygon points={leftF} fill={U('p-stone')} />
      <polygon points={leftF} fill={U('g-lit')} />
      <polygon points={rightF} fill={C('stone')} {...LINE} />
      <polygon points={rightF} fill={U('p-stone')} />
      <polygon points={rightF} {...SHADE} />
      {/* soot and a mortar course */}
      <polygon points={pts(gp(g, a - w, b1, zt - 3), gp(g, a + w, b1, zt - 3), gp(g, a + w, b1, zt), gp(g, a - w, b1, zt))} fill={C('outline')} fillOpacity={0.25} />
      <SlabBox cx={c.x} cy={c.y} A={w + 1.6} D={d + 1.6} h={3} z={zt} />
      {pot && (
        <g>
          <rect x={potTop.x - 3} y={potTop.y} width={6} height={7.5} fill={C('roof')} {...thin} />
          <rect x={potTop.x + 0.6} y={potTop.y} width={2.4} height={7.5} {...SHADE} />
          <ellipse cx={potTop.x} cy={potTop.y} rx={3.4} ry={1.4} fill={C('outline')} />
        </g>
      )}
    </g>
  );
}

/** A plain small iso slab (chimney caps, steps, sills): three faces with the light and shade cues, no texture. */
export function SlabBox({ cx = 0, cy = 0, A, D, h, z = 0, fill = 'stone-light', side = 'stone' }: { cx?: number; cy?: number; A: number; D: number; h: number; z?: number; fill?: string; side?: string }): JSX.Element {
  const L0 = iso(cx, cy, -A, D, z + h);
  const F0 = iso(cx, cy, A, D, z + h);
  const R0 = iso(cx, cy, A, -D, z + h);
  const B0 = iso(cx, cy, -A, -D, z + h);
  const Lg = iso(cx, cy, -A, D, z);
  const Fg = iso(cx, cy, A, D, z);
  const Rg = iso(cx, cy, A, -D, z);
  return (
    <g>
      <polygon points={pts(Lg, Fg, F0, L0)} fill={C(side)} {...thin} />
      <polygon points={pts(Fg, Rg, R0, F0)} fill={C(side)} {...thin} />
      <polygon points={pts(Fg, Rg, R0, F0)} {...SHADE} />
      <polygon points={pts(B0, R0, F0, L0)} fill={C(fill)} {...thin} />
      <polygon points={pts(B0, R0, F0, L0)} fill={U('g-lit')} />
    </g>
  );
}

/* ------------------------------------------------------------ face parts (flat face coordinates) */

/** Half-timbering: posts, rails and braces in dark oak with an outline under them so they read as real beams. */
export function TimberFrame({ w, h, posts, rails = [], braces = [] }: { w: number; h: number; posts: number[]; rails?: number[]; braces?: Array<[number, number, 'up' | 'down']> }): JSX.Element {
  const lines: Array<[number, number, number, number]> = [
    [0, -1.5, w, -1.5],
    [0, -h + 1.5, w, -h + 1.5],
    ...posts.map((x): [number, number, number, number] => [x, 0, x, -h]),
    ...rails.map((y): [number, number, number, number] => [0, y, w, y]),
    ...braces.map(([x0, x1, dir]): [number, number, number, number] => (dir === 'up' ? [x0, -2, x1, -h + 2] : [x0, -h + 2, x1, -2])),
  ];
  return (
    <g strokeLinecap="square">
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={`o${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--va-outline)" strokeWidth={4.6} />
      ))}
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={`w${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C('wood-dark')} strokeWidth={3.2} />
      ))}
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={`h${i}`} x1={x1 - 0.7} y1={y1 - 0.7} x2={x2 - 0.7} y2={y2 - 0.7} stroke={C('wood')} strokeWidth={0.9} strokeOpacity={0.8} />
      ))}
    </g>
  );
}

/** Scattered hand-laid stones over a stone face, plus corner quoins. */
export function Stones({ w, h, seed = 3, quoins = true }: { w: number; h: number; seed?: number; quoins?: boolean }): JSX.Element {
  const r = rng(seed);
  const n = Math.round((w * h) / 140);
  const stones = Array.from({ length: n }, () => ({ x: 3 + r() * (w - 14), y: -h + 3 + r() * (h - 9), sw: 6 + r() * 7, sh: 3.4 + r() * 2.4, light: r() > 0.45 }));
  const qs = quoins ? Array.from({ length: Math.floor(h / 7) }, (_, k) => k) : [];
  return (
    <g>
      {stones.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.sw} height={s.sh} rx={1.4} fill={C(s.light ? 'stone-light' : 'stone-dark')} fillOpacity={s.light ? 0.55 : 0.4} stroke="var(--va-outline)" strokeWidth={0.5} strokeOpacity={0.45} />
      ))}
      {qs.map((k) => (
        <g key={k} fill={C('stone-light')} stroke="var(--va-outline)" strokeWidth={0.7}>
          <rect x={0} y={-7 * (k + 1)} width={k % 2 ? 6 : 10} height={6.4} />
          <rect x={w - (k % 2 ? 10 : 6)} y={-7 * (k + 1)} width={k % 2 ? 10 : 6} height={6.4} />
        </g>
      ))}
    </g>
  );
}

export type WindowShape = 'square' | 'arch' | 'lancet' | 'round';

function glassPath(shape: WindowShape, w: number, h: number): string {
  const x0 = -w / 2;
  const y0 = -h / 2;
  if (shape === 'round') return `M${-w / 2},0 A${w / 2},${h / 2} 0 1 1 ${w / 2},0 A${w / 2},${h / 2} 0 1 1 ${-w / 2},0 Z`;
  if (shape === 'arch') return `M${x0},${h / 2} L${x0},${y0 + w / 2} A${w / 2},${w / 2} 0 0 1 ${w / 2},${y0 + w / 2} L${w / 2},${h / 2} Z`;
  if (shape === 'lancet') return `M${x0},${h / 2} L${x0},${y0 + w * 0.7} Q${x0},${y0 + w * 0.15} 0,${y0} Q${w / 2},${y0 + w * 0.15} ${w / 2},${y0 + w * 0.7} L${w / 2},${h / 2} Z`;
  return `M${x0},${y0} L${w / 2},${y0} L${w / 2},${h / 2} L${x0},${h / 2} Z`;
}

/**
 * A window centred at (x, y): frame, glass with a sheen, mullions, a stone sill; optional painted shutters and a
 * flower box. `lit` lays the lamp-lit glass over it at dusk and night (civic buildings only, like LitPane).
 */
export function Window({ x, y, w = 12, h = 15, shape = 'square', frame = 'wood-dark', shutters, box, lit = false }: { x: number; y: number; w?: number; h?: number; shape?: WindowShape; frame?: string; shutters?: string; box?: boolean; lit?: boolean }): JSX.Element {
  const glass = glassPath(shape, w, h);
  const outer = glassPath(shape, w + 4.4, h + 4.4);
  return (
    <g transform={`translate(${x} ${y})`}>
      {shutters && shape !== 'round' && (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <rect x={s < 0 ? -w / 2 - 2.2 - w * 0.52 : w / 2 + 2.2} y={-h / 2 - 1} width={w * 0.52} height={h + 2} fill={C(shutters)} {...thin} />
              <path d={`M${s < 0 ? -w / 2 - 2.2 - w * 0.26 : w / 2 + 2.2 + w * 0.26},${-h / 2} L${s < 0 ? -w / 2 - 2.2 - w * 0.26 : w / 2 + 2.2 + w * 0.26},${h / 2}`} stroke="var(--va-outline)" strokeWidth={0.5} strokeOpacity={0.6} />
              <path d={`M${s < 0 ? -w / 2 - 2.2 - w * 0.52 : w / 2 + 2.2},${h * 0.32} L${s < 0 ? -w / 2 - 2.2 : w / 2 + 2.2 + w * 0.52},${-h * 0.32}`} stroke="var(--va-outline)" strokeWidth={0.8} strokeOpacity={0.55} />
              <rect x={s < 0 ? -w / 2 - 2.2 - w * 0.52 : w / 2 + 2.2} y={-h / 2 - 1} width={w * 0.52} height={h + 2} fill={U('g-lit')} />
            </g>
          ))}
        </g>
      )}
      <path d={outer} fill={C(frame)} {...thin} />
      <path d={glass} fill={C('window')} />
      <path d={glass} fill={U('g-glass')} />
      {lit && <path d={glass} fill={C('glow')} fillOpacity={0.35} transform="scale(1.35)" style={LAMP_STYLE} />}
      {lit && <path d={glass} className="va-window-lit" fill={C('window-lit')} style={LAMP_STYLE} />}
      {shape === 'round' ? (
        <path d={`M${-w / 2},0 L${w / 2},0 M0,${-h / 2} L0,${h / 2} M${-w * 0.35},${-h * 0.35} L${w * 0.35},${h * 0.35} M${w * 0.35},${-h * 0.35} L${-w * 0.35},${h * 0.35}`} stroke={C(frame)} strokeWidth={1.1} />
      ) : (
        <path d={`M0,${-h / 2 + (shape === 'square' ? 0 : w * 0.25)} L0,${h / 2} M${-w / 2},${h * 0.05} L${w / 2},${h * 0.05}`} stroke={C(frame)} strokeWidth={1.2} />
      )}
      {/* glint */}
      <path d={`M${-w / 2 + 2},${h / 2 - 3} L${-w / 2 + 2},${-h / 2 + (shape === 'square' ? 2.5 : w * 0.5)}`} stroke="var(--va-highlight)" strokeWidth={1.1} strokeOpacity={0.55} strokeLinecap="round" />
      {shape !== 'round' && <rect x={-w / 2 - 3.4} y={h / 2 + 1.6} width={w + 6.8} height={2.8} rx={0.8} fill={C('stone-light')} {...thin} />}
      {box && <FlowerBox w={w + 6} y={h / 2 + 4.4} />}
    </g>
  );
}

/** A planter under a window: a little wooden trough, leaves and three colours of flowers spilling over. */
export function FlowerBox({ w, y }: { w: number; y: number }): JSX.Element {
  const r = rng(Math.round(w * 13 + y));
  const flowers = Array.from({ length: Math.round(w / 3) }, (_, k) => ({ x: -w / 2 + 1.5 + (k + r() * 0.6) * (w - 3) / Math.round(w / 3), y: y - 1.5 - r() * 3, c: 1 + (k % 3) }));
  return (
    <g>
      <rect x={-w / 2} y={y} width={w} height={4.6} rx={0.8} fill={C('wood')} {...thin} />
      <rect x={-w / 2} y={y + 3} width={w} height={1.6} fill={C('wood-dark')} />
      {flowers.map((f, i) => (
        <ellipse key={`l${i}`} cx={f.x} cy={f.y + 1.6} rx={2.2} ry={1.6} fill={C('leaf')} stroke="var(--va-outline)" strokeWidth={0.4} />
      ))}
      <path d={`M${-w / 2 + 2},${y + 2} q-1.5,4 0.5,6 M${w / 2 - 3},${y + 2} q1.5,3 -0.5,5`} fill="none" stroke={C('vine')} strokeWidth={1.2} strokeLinecap="round" />
      {flowers.map((f, i) => (
        <circle key={`f${i}`} cx={f.x} cy={f.y} r={1.3} fill={C(`flower-${f.c}`)} stroke="var(--va-outline)" strokeWidth={0.35} />
      ))}
    </g>
  );
}

/** A plank door centred on x, standing on y = 0: arched or square, iron straps, a ring handle and a stone surround. */
export function Door({ x, w = 16, h = 24, arch = true, surround = 'stone-light', fill = 'wood' }: { x: number; w?: number; h?: number; arch?: boolean; surround?: string; fill?: string }): JSX.Element {
  const shape = (ww: number, hh: number): string => (arch ? `M${-ww / 2},0 L${-ww / 2},${-hh + ww / 2} A${ww / 2},${ww / 2} 0 0 1 ${ww / 2},${-hh + ww / 2} L${ww / 2},0 Z` : `M${-ww / 2},0 L${-ww / 2},${-hh} L${ww / 2},${-hh} L${ww / 2},0 Z`);
  return (
    <g transform={`translate(${x} 0)`}>
      <path d={shape(w + 6, h + 3)} fill={C(surround)} {...thin} />
      {arch && Array.from({ length: 5 }, (_, k) => {
        const t = Math.PI * (k + 0.5) / 5;
        const R = (w + 6) / 2;
        const cy = -h - 3 + R;
        return <line key={k} x1={-Math.cos(t) * (R - 3)} y1={cy - Math.sin(t) * (R - 3)} x2={-Math.cos(t) * R} y2={cy - Math.sin(t) * R} stroke="var(--va-outline)" strokeWidth={0.6} />;
      })}
      <path d={shape(w, h)} fill={C(fill)} {...thin} />
      {Array.from({ length: 3 }, (_, k) => (
        <line key={k} x1={-w / 2 + (w / 4) * (k + 1)} y1={-1} x2={-w / 2 + (w / 4) * (k + 1)} y2={-h + (arch ? 3 : 1)} stroke={C('wood-dark')} strokeWidth={0.8} />
      ))}
      <path d={`M${-w / 2},${-h * 0.25} L${w / 2 - 2},${-h * 0.25} M${-w / 2},${-h * 0.62} L${w / 2 - 2},${-h * 0.62}`} stroke="var(--va-outline)" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={w / 2 - 3.4} cy={-h * 0.44} r={1.5} fill="none" stroke={C('gold-dark')} strokeWidth={1} />
      <path d={shape(w, h)} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-ao-opacity) * 0.35)' }} />
    </g>
  );
}

/* ------------------------------------------------------------ ground props (screen coordinates, origin at the foot) */

/** A picket fence from ground point p to q (both {a, b}); posts every ~10 units, two rails, pointed pickets. */
export function Fence({ p, q, h = 11 }: { p: { a: number; b: number }; q: { a: number; b: number }; h?: number }): JSX.Element {
  const len = Math.hypot(q.a - p.a, q.b - p.b);
  const n = Math.max(2, Math.round(len / 5));
  const at = (t: number, z: number): Pt => iso(0, 0, p.a + (q.a - p.a) * t, p.b + (q.b - p.b) * t, z);
  return (
    <g>
      {Array.from({ length: n + 1 }, (_, k) => {
        const g0 = at(k / n, 0);
        return <ellipse key={`s${k}`} cx={g0.x + 3} cy={g0.y + 1} rx={3} ry={1.2} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.6)' }} />;
      })}
      {[h * 0.35, h * 0.72].map((z) => (
        <line key={z} x1={at(0, z).x} y1={at(0, z).y} x2={at(1, z).x} y2={at(1, z).y} stroke="var(--va-outline)" strokeWidth={2.6} strokeLinecap="round" />
      ))}
      {[h * 0.35, h * 0.72].map((z) => (
        <line key={`c${z}`} x1={at(0, z).x} y1={at(0, z).y} x2={at(1, z).x} y2={at(1, z).y} stroke={C('wood')} strokeWidth={1.4} strokeLinecap="round" />
      ))}
      {Array.from({ length: n + 1 }, (_, k) => {
        const b0 = at(k / n, 0);
        const big = k % 4 === 0 || k === n;
        const t = at(k / n, big ? h + 2 : h);
        return (
          <g key={k}>
            <path d={`M${b0.x - 1.3},${b0.y} L${t.x - 1.3},${t.y + 1.6} L${t.x},${t.y - 0.6} L${t.x + 1.3},${t.y + 1.6} L${b0.x + 1.3},${b0.y} Z`} fill={C(big ? 'wood' : 'wood-light')} stroke="var(--va-outline)" strokeWidth={0.6} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
}

/** A tilled garden bed (centre a, b; half extents A, D) with rows of greens and a few flowers. */
export function GardenBed({ a, b, A, D, seed = 5, flowers = true }: { a: number; b: number; A: number; D: number; seed?: number; flowers?: boolean }): JSX.Element {
  const c = iso(0, 0, a, b);
  const r = rng(seed);
  const rows = Math.max(2, Math.round(D / 5));
  const per = Math.max(3, Math.round(A / 5));
  return (
    <g>
      <polygon points={pts(iso(c.x, c.y, -A, -D), iso(c.x, c.y, A, -D), iso(c.x, c.y, A, D), iso(c.x, c.y, -A, D))} fill={C('wood-dark')} fillOpacity={0.85} stroke="var(--va-outline)" strokeWidth={0.9} strokeLinejoin="round" />
      <polygon points={pts(iso(c.x, c.y, -A, -D), iso(c.x, c.y, A, -D), iso(c.x, c.y, A, D), iso(c.x, c.y, -A, D))} fill={U('p-dirt')} />
      {Array.from({ length: rows }, (_, j) => {
        const bb = -D + (2 * D * (j + 0.5)) / rows;
        const s = iso(c.x, c.y, -A + 1, bb);
        const e = iso(c.x, c.y, A - 1, bb);
        return <line key={`r${j}`} x1={s.x} y1={s.y + 0.8} x2={e.x} y2={e.y + 0.8} stroke="var(--va-outline)" strokeOpacity={0.35} strokeWidth={1} />;
      })}
      {Array.from({ length: rows }, (_, j) =>
        Array.from({ length: per }, (_, k) => {
          const p = iso(c.x, c.y, -A + (2 * A * (k + 0.5)) / per, -D + (2 * D * (j + 0.5)) / rows);
          const flower = flowers && r() > 0.8;
          return (
            <g key={`${j}-${k}`}>
              <ellipse cx={p.x} cy={p.y - 1.6} rx={2.8} ry={2.1} fill={C('leaf')} stroke="var(--va-outline)" strokeWidth={0.5} />
              <ellipse cx={p.x - 0.8} cy={p.y - 2.3} rx={1.2} ry={0.8} fill="var(--va-highlight)" fillOpacity={0.35} />
              {flower && <circle cx={p.x + 0.6} cy={p.y - 3.4} r={1.3} fill={C(`flower-${1 + Math.floor(r() * 3)}`)} stroke="var(--va-outline)" strokeWidth={0.35} />}
            </g>
          );
        }),
      )}
    </g>
  );
}

/** A leafy bush (origin at its foot): stacked clumps, lit on the upper left, shaded lower right, cast shadow. */
export function Bush({ s = 1, flowers }: { s?: number; flowers?: number }): JSX.Element {
  const clumps = [
    { x: -7, y: -7, r: 7.5, f: 'grass-2' },
    { x: 7, y: -7, r: 7.5, f: 'grass-2' },
    { x: -3, y: -12, r: 8, f: 'leaf' },
    { x: 5, y: -13, r: 7, f: 'leaf' },
  ];
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={8} cy={1.5} rx={16} ry={4.4} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      {clumps.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={C(c.f)} stroke="var(--va-outline)" strokeWidth={1} />
      ))}
      <circle cx={-5} cy={-15} r={4.2} fill="var(--va-highlight)" fillOpacity={0.3} />
      <path d="M6,-3 q5,-3 7,-9" fill="none" stroke="var(--va-shade)" strokeWidth={3} style={{ strokeOpacity: 'var(--va-shade-opacity)' }} />
      {flowers &&
        [[-6, -12], [2, -16], [8, -9], [-1, -7]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.5} fill={C(`flower-${flowers}`)} stroke="var(--va-outline)" strokeWidth={0.4} />)}
    </g>
  );
}

/** A stacked woodpile against a wall (origin at its front foot): log ends in rows, a little lean-to plank roof. */
export function WoodPile({ n = 4 }: { n?: number }): JSX.Element {
  const logs: Pt[] = [];
  for (let row = 0; row < 3; row++) for (let k = 0; k < n - (row === 2 ? 1 : 0); k++) logs.push({ x: k * 6.2 + (row % 2 ? 3 : 0), y: -3.2 - row * 5.6 });
  return (
    <g>
      <ellipse cx={n * 3 + 6} cy={1.4} rx={n * 3 + 8} ry={3.6} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      <path d={`M-3,0 L-3,-18 L${n * 6.2 + 3},-21 L${n * 6.2 + 3},0 Z`} fill={C('wood-dark')} {...thin} />
      {logs.map((l, i) => (
        <g key={i}>
          <circle cx={l.x} cy={l.y} r={3} fill={C('wood-light')} stroke="var(--va-outline)" strokeWidth={0.7} />
          <circle cx={l.x} cy={l.y} r={1.3} fill="none" stroke={C('wood')} strokeWidth={0.6} />
        </g>
      ))}
      <path d={`M-5,-19 L${n * 6.2 + 5},-23 L${n * 6.2 + 5},-20 L-5,-16 Z`} fill={C('wood')} {...thin} />
    </g>
  );
}

/** A two-wheeled hand cart loaded with hay (origin at the middle of the axle on the ground). */
export function HayCart(): JSX.Element {
  const wheel = (x: number): JSX.Element => (
    <g transform={`translate(${x} -7)`}>
      <ellipse cx={0} cy={0} rx={6} ry={7} fill={C('wood-dark')} stroke="var(--va-outline)" strokeWidth={1} />
      <ellipse cx={0} cy={0} rx={4.2} ry={5} fill="none" stroke={C('wood')} strokeWidth={1.2} />
      <path d="M0,-5 L0,5 M-4.2,0 L4.2,0 M-3,-3.5 L3,3.5 M3,-3.5 L-3,3.5" stroke={C('wood')} strokeWidth={0.8} />
      <circle cx={0} cy={0} r={1.4} fill={C('stone-dark')} />
    </g>
  );
  return (
    <g>
      <ellipse cx={8} cy={2} rx={26} ry={6} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      <path d="M14,-9 L36,2" stroke="var(--va-outline)" strokeWidth={3} strokeLinecap="round" />
      <path d="M14,-9 L36,2" stroke={C('wood')} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-18,-10 L14,-10 L18,-20 L-14,-20 Z" fill={C('wood')} {...thin} />
      <path d="M-18,-10 L14,-10 L14,-14 L-18,-14 Z" fill={C('wood-light')} {...thin} />
      <path d="M-16,-19 Q-14,-34 0,-33 Q16,-34 17,-19 Z" fill={C('thatch')} {...thin} />
      <path d="M-12,-23 q4,-5 8,-2 M0,-27 q4,-4 8,-1 M6,-21 q3,-3 7,-1" fill="none" stroke={C('thatch-dark')} strokeWidth={0.9} />
      <path d="M-6,-31 Q2,-36 10,-30" fill="none" stroke="var(--va-highlight)" strokeWidth={1.2} strokeOpacity={0.5} />
      {wheel(-6)}
    </g>
  );
}

/** A plank bench (origin at its centre on the ground), drawn along the a axis. */
export function Bench({ len = 22 }: { len?: number }): JSX.Element {
  return (
    <g>
      <ellipse cx={4} cy={2} rx={len * 0.6} ry={3.4} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.7)' }} />
      {[-len * 0.35, len * 0.35].map((a) => {
        const p = iso(0, 0, a, 0);
        return <rect key={a} x={p.x - 1.2} y={p.y - 6} width={2.4} height={6} fill={C('wood-dark')} {...hair} />;
      })}
      <polygon points={pts(iso(0, 0, -len / 2, -2.5, 6), iso(0, 0, len / 2, -2.5, 6), iso(0, 0, len / 2, 2.5, 6), iso(0, 0, -len / 2, 2.5, 6))} fill={C('wood-light')} {...thin} />
      <polygon points={pts(iso(0, 0, -len / 2, 2.5, 6), iso(0, 0, len / 2, 2.5, 6), iso(0, 0, len / 2, 2.5, 4), iso(0, 0, -len / 2, 2.5, 4))} fill={C('wood')} {...hair} />
    </g>
  );
}

/** A hanging trade sign on an iron bracket (origin at the wall fixing). `icon` is drawn on the board (no text). */
export function HangingSign({ icon, reach = 22 }: { icon: ReactNode; reach?: number }): JSX.Element {
  return (
    <g>
      <path d={`M0,0 L${reach},-3 M0,-9 Q${reach * 0.5},-9 ${reach},-3`} fill="none" stroke="var(--va-outline)" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={reach * 0.45} cy={-6} r={2.2} fill="none" stroke="var(--va-outline)" strokeWidth={1} />
      <path d={`M${reach - 9},-3 L${reach - 9},4 M${reach + 5},-3 L${reach + 5},4`} stroke="var(--va-outline)" strokeWidth={0.9} />
      <g transform={`translate(${reach - 2} 15)`}>
        <rect x={-15} y={-11} width={30} height={24} rx={3} fill={C('sign')} stroke="var(--va-outline)" strokeWidth={1.4} />
        <rect x={-12.5} y={-8.5} width={25} height={19} rx={2} fill="none" stroke={C('gold-dark')} strokeWidth={1} />
        <rect x={-15} y={-11} width={30} height={24} rx={3} fill={U('g-lit')} />
        {icon}
      </g>
    </g>
  );
}

/** Soft contact shadow and grass tufts around a building's foot (screen coords, footprint half extents). */
export function FootTufts({ A, D, seed = 9 }: { A: number; D: number; seed?: number }): JSX.Element {
  const r = rng(seed);
  const tufts = Array.from({ length: 10 }, () => {
    const side = r() > 0.5;
    const t = r();
    return side ? iso(0, 0, -A + 2 * A * t, D + 2) : iso(0, 0, A + 2, D - 2 * D * t);
  });
  return (
    <g pointerEvents="none">
      {tufts.map((p, i) => (
        <path key={i} d={`M${p.x - 3},${p.y} q1,-5 2,-6 M${p.x},${p.y} q0,-6 1,-7 M${p.x + 3},${p.y} q-1,-4 -1,-5`} fill="none" stroke={C('grass-2')} strokeWidth={1.3} strokeLinecap="round" />
      ))}
    </g>
  );
}

/** Heavy outline helper for silhouettes drawn by hand. */
export const OUTLINE = HEAVY;
