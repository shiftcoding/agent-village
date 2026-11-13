import { LANTERN_SPOTS, SCENE, gridToScene } from '../layout';
import { pathNetwork } from '../network';
import { Box, C, LINE, U } from './iso';

/**
 * Ground dressing (T39): a few hedges, bushes, rocks, flower beds and fences that frame the village. They are placed by a
 * seeded scatter that keeps clear of every path, the plaza, every building and the town hall card area, so nothing sits where
 * a character walks or a name tag is anchored. Static (no animation), drawn once with the Ground. art.test.ts checks the clearances.
 */
export type DressKind = 'bush' | 'rock' | 'bed' | 'hedge' | 'fence';
export interface Dress {
  kind: DressKind;
  x: number;
  y: number;
  /** Run length for hedges and fences (units along the 2:1 ground axis a), else size multiplier. */
  len?: number;
  s?: number;
  /** Axis for runs: 'a' runs down-right (slope +0.5), 'b' runs down-left (slope -0.5). */
  axis?: 'a' | 'b';
  tone?: number;
}

type Circle = { x: number; y: number; r: number };

/** Keep-out areas (scene coords) for everything that is not ground: buildings with their work spots and tags, boards, the card. */
export function keepOutAreas(projectSpots: Array<{ x: number; y: number }>): Circle[] {
  const S = SCENE;
  const out: Circle[] = [
    { x: S.townHall.x, y: S.townHall.y - 60, r: 250 },
    { x: S.questBoard.x, y: S.questBoard.y, r: 150 },
    { x: S.chronicle.x, y: S.chronicle.y, r: 130 },
    { x: S.tally.x, y: S.tally.y, r: 100 },
    { x: S.gatehouse.x, y: S.gatehouse.y - 20, r: 175 },
    { x: S.tavern.x, y: S.tavern.y - 10, r: 215 },
    { x: S.chapel.x, y: S.chapel.y, r: 145 },
    { x: S.herbalist.x, y: S.herbalist.y, r: 160 },
    { x: S.well.x, y: S.well.y, r: 105 },
    { x: S.schoolhouse.x, y: S.schoolhouse.y, r: 155 },
    { x: 800, y: 170, r: 230 },
  ];
  for (const p of projectSpots) out.push({ x: p.x, y: p.y - 30, r: 250 });
  for (const l of LANTERN_SPOTS) out.push({ x: l.x, y: l.y - 20, r: 40 });
  return out;
}

function distToSeg(px: number, py: number, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

/** Minimum clearance (units) between any dressing piece and a path, the plaza or a building keep-out. */
export const DRESS_PATH_CLEARANCE = 40;

/** Deterministic dressing for the given project building positions. */
export function groundDressing(projectSpots?: Array<{ x: number; y: number; id?: string }>): Dress[] {
  const lodge = gridToScene(3, 2);
  const work = gridToScene(-3, 2);
  const spots = (projectSpots ?? [lodge, work]).map((s, i) => ({ id: (s as { id?: string }).id ?? `p${i}`, x: s.x, y: s.y }));
  const net = pathNetwork(spots);
  const segs = net.edges.flatMap(([a, b]) => {
    const pa = net.nodes[a];
    const pb = net.nodes[b];
    return pa && pb ? [{ a: pa, b: pb }] : [];
  });
  const keep = keepOutAreas(spots);
  const p = SCENE.plaza;
  const clear = (x: number, y: number, extra = 0): boolean => {
    if (x < 26 || x > SCENE.width - 26 || y < 40 || y > SCENE.height - 14) return false;
    if (segs.some((e) => distToSeg(x, y, e.a, e.b) < DRESS_PATH_CLEARANCE + extra)) return false;
    if (Math.abs(x - p.x) / (p.rx + 40) + Math.abs(y - p.y) / (p.ry + 20) < 1) return false;
    return !keep.some((k) => Math.hypot(x - k.x, (y - k.y) * 1.25) < k.r + extra);
  };
  const out: Dress[] = [];
  /* Framing only (T39 round 2): a handful of pieces tucked into the corners and edges next to the framing trees. Each is kept
     only if it clears every path, the plaza and every building keep-out; runs are checked along their whole length. */
  const wanted: Dress[] = [
    { kind: 'hedge', x: 1425, y: 925, len: 100, axis: 'a' },
    { kind: 'fence', x: 70, y: 770, len: 130, axis: 'a' },
    { kind: 'fence', x: 420, y: 270, len: 112, axis: 'a' },
    { kind: 'bush', x: 118, y: 352, s: 1.1, tone: 0 },
    { kind: 'bush', x: 1535, y: 600, s: 1.1, tone: 1 },
    { kind: 'bush', x: 215, y: 962, s: 1, tone: 0 },
    { kind: 'bush', x: 1125, y: 92, s: 1, tone: 2 },
    { kind: 'bush', x: 470, y: 78, s: 0.95, tone: 1 },
    { kind: 'rock', x: 452, y: 150, s: 1, tone: 1 },
    { kind: 'rock', x: 1360, y: 188, s: 1.1, tone: 2 },
    { kind: 'bed', x: 235, y: 868, s: 1, tone: 0 },
    { kind: 'bed', x: 1515, y: 905, s: 1, tone: 1 },
  ];
  for (const r of wanted) {
    const n = r.len ? Math.ceil(r.len / 20) : 0;
    let ok = true;
    for (let i = 0; i <= n; i++) ok = ok && clear(r.x + (i * (r.len ?? 0)) / (n || 1), r.y + (i * (r.len ?? 0)) / (n || 1) / 2, r.len ? 6 : 0);
    if (ok) out.push(r);
  }
  return out;
}

/* ---------------------------------------------------------------- pieces (local origin = foot) */

const soft = { fill: 'var(--va-shadow)' } as const;

function Blob({ cx, cy, r, fill, hi = 0.4, deep = 0.2 }: { cx: number; cy: number; r: number; fill: string; hi?: number; deep?: number }): JSX.Element {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} {...LINE} />
      <circle cx={cx} cy={cy} r={r - 0.7} fill="var(--va-shadow)" style={{ fillOpacity: `calc(${deep} + var(--va-foliage-deep))` }} />
      <circle cx={cx} cy={cy} r={r} fill={U('g-sphere')} />
      <path d={`M${cx - r * 0.62},${cy - r * 0.1} A${r * 0.66},${r * 0.66} 0 0 1 ${cx - r * 0.02},${cy - r * 0.66}`} fill="none" stroke="var(--va-highlight)" strokeOpacity={hi} strokeWidth={Math.max(1.4, r * 0.18)} strokeLinecap="round" />
    </g>
  );
}

export function Bush({ s = 1, tone = 0 }: { s?: number; tone?: number }): JSX.Element {
  const base = tone === 1 ? C('leaf') : C('grass-2');
  const lit = C('leaf');
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={11} cy={3} rx={26} ry={7} {...soft} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      <Blob cx={-9} cy={-9} r={11} fill={base} />
      <Blob cx={10} cy={-8} r={12} fill={base} />
      <Blob cx={0} cy={-17} r={12.5} fill={lit} hi={0.45} />
      {tone === 2 && (
        <g>
          <circle cx={-5} cy={-19} r={1.8} fill={C('flower-2')} />
          <circle cx={4} cy={-12} r={1.8} fill={C('flower-3')} />
          <circle cx={9} cy={-19} r={1.8} fill={C('flower-1')} />
        </g>
      )}
    </g>
  );
}

export function Rock({ s = 1, tone = 0 }: { s?: number; tone?: number }): JSX.Element {
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={9} cy={2} rx={20} ry={5.5} {...soft} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.85)' }} />
      <path d="M-13,0 Q-15,-9 -6,-13 Q2,-17 9,-12 Q16,-8 14,0 Z" fill={C('stone')} {...LINE} />
      <path d="M-13,0 Q-15,-9 -6,-13 Q-3,-9 -4,0 Z" fill={C('stone-light')} />
      <path d="M5,-14 Q16,-8 14,0 L2,0 Q8,-7 5,-14 Z" fill={C('stone-dark')} />
      <path d="M-13,0 Q-15,-9 -6,-13 Q2,-17 9,-12 Q16,-8 14,0 Z" fill="none" {...LINE} />
      {tone === 1 && <path d="M-9,-3 q3,-5 6,-1 M-6,-1 q3,-3 7,-1" fill="none" stroke={C('grass-2')} strokeWidth={2.2} strokeLinecap="round" />}
      {tone === 2 && (
        <g>
          <path d="M16,0 Q15,-5 20,-6 Q25,-5 24,0 Z" fill={C('stone')} {...LINE} strokeWidth={1.1} />
          <path d="M16,0 Q15,-5 20,-6 L19,0 Z" fill={C('stone-light')} />
        </g>
      )}
    </g>
  );
}

export function FlowerBed({ s = 1, tone = 0 }: { s?: number; tone?: number }): JSX.Element {
  const ks = [1, 2, 3, 2, 1, 3, 2];
  const k0 = tone % 3;
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={8} cy={3} rx={32} ry={9} {...soft} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.7)' }} />
      <ellipse cx={0} cy={0} rx={30} ry={9.5} fill={C('wood-dark')} {...LINE} />
      <ellipse cx={0} cy={-1.4} rx={26} ry={7} fill={C('path-edge')} />
      {[-18, -9, 0, 10, 18, -4, 5].map((x, i) => {
        const y = (i % 3) * 2.2 - 5;
        const k = ((((ks[i] ?? 1) + k0 - 1) % 3) + 1) as 1 | 2 | 3;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0,0 L0,-6" stroke={C('grass-2')} strokeWidth={1.6} strokeLinecap="round" />
            <circle cx={0} cy={-8} r={3.6} fill={C(`flower-${k}`)} {...LINE} strokeWidth={1} />
            <circle cx={0} cy={-8} r={1.3} fill={C('flower-3')} />
          </g>
        );
      })}
    </g>
  );
}

/** A clipped hedge run along the a axis (down-right, slope 0.5): a leafy block with a scalloped top and its own cast shadow. */
export function Hedge({ len = 100 }: { len?: number }): JSX.Element {
  const A = len / 2;
  const c = { x: A, y: A / 2 };
  const n = Math.max(3, Math.round(len / 16));
  return (
    <g>
      <Box cx={c.x} cy={c.y} A={A} D={6} h={20} left={C('grass-3')} right={C('grass-2')} top={C('grass-3')} />
      <g pointerEvents="none">
        {Array.from({ length: n }, (_, i) => {
          const t = (i + 0.5) / n;
          return <circle key={i} cx={t * len - 4} cy={(t * len) / 2 - 22 + 5} r={5.2} fill={C('grass-3')} stroke="var(--va-outline)" strokeWidth={1} />;
        })}
        <g fill="none" stroke="var(--va-grass-2)" strokeWidth={1.6} strokeLinecap="round" strokeOpacity={0.9}>
          {Array.from({ length: n }, (_, i) => {
            const t = (i + 0.3) / n;
            return <path key={i} d={`M${t * len},${(t * len) / 2 + 3 - 7} q3,-3 6,0 M${t * len + 6},${(t * len) / 2 + 3 - 14} q3,-3 6,0`} />;
          })}
        </g>
      </g>
    </g>
  );
}

/** A picket fence run along the a axis: posts, two rails, pointed pickets on the lit side. */
export function Fence({ len = 100 }: { len?: number }): JSX.Element {
  const n = Math.max(3, Math.round(len / 16));
  const at = (t: number, z = 0) => ({ x: t * len, y: (t * len) / 2 - z });
  const rail = (z: number) => {
    const a = at(0, z);
    const b = at(1, z);
    return `M${a.x},${a.y} L${b.x},${b.y}`;
  };
  return (
    <g>
      <polygon points={`0,1 ${len},${len / 2 + 1} ${len + 18},${len / 2 + 10} 18,11`} {...soft} style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      <path d={rail(7)} stroke="var(--va-outline)" strokeWidth={4.8} strokeLinecap="round" />
      <path d={rail(16)} stroke="var(--va-outline)" strokeWidth={4.8} strokeLinecap="round" />
      <path d={rail(7)} stroke={C('wood-light')} strokeWidth={2.6} strokeLinecap="round" />
      <path d={rail(16)} stroke={C('wood-light')} strokeWidth={2.6} strokeLinecap="round" />
      {Array.from({ length: n + 1 }, (_, i) => {
        const p = at(i / n);
        const big = i % 3 === 0;
        return (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <path d={`M-3,0 L-3,${big ? -26 : -21} L0,${big ? -31 : -25} L3,${big ? -26 : -21} L3,0 Z`} fill={C('wood')} {...LINE} strokeWidth={1.2} />
            <path d={`M-3,0 L-3,${big ? -26 : -21} L0,${big ? -31 : -25} L0,0 Z`} fill={C('wood-light')} fillOpacity={0.8} />
            <path d="M3,0 L3,-21 L0,-25 L0,0 Z" fill="var(--va-shade)" style={{ fillOpacity: 'var(--va-shade-opacity)' }} />
          </g>
        );
      })}
    </g>
  );
}

export function DressPiece({ d }: { d: Dress }): JSX.Element {
  return (
    <g transform={`translate(${d.x.toFixed(1)} ${d.y.toFixed(1)})`}>
      {d.kind === 'bush' && <Bush s={d.s} tone={d.tone} />}
      {d.kind === 'rock' && <Rock s={d.s} tone={d.tone} />}
      {d.kind === 'bed' && <FlowerBed s={d.s} tone={d.tone} />}
      {d.kind === 'hedge' && <Hedge len={d.len} />}
      {d.kind === 'fence' && <Fence len={d.len} />}
    </g>
  );
}
