import { C, LINE, iso, pts, type Pt } from './iso';
import type { BuildingAnchors } from '../contract';

const thin = { ...LINE, strokeWidth: 0.9 } as const;

function wrap(text: string): string[] {
  const t = text.length > 34 ? `${text.slice(0, 33)}…` : text;
  if (t.length <= 16) return [t];
  const mid = t.length / 2;
  let best = -1;
  for (let i = 0; i < t.length; i++) if (t[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [t] : [t.slice(0, best), t.slice(best + 1)];
}

/**
 * Wooden signpost with ink text (>= 12 units). (x,y) is the foot of the post.
 * `arrow` shapes the plank like a pointing board (no-progress).
 */
export function SignPost({
  x,
  y,
  text,
  arrow = false,
  tilt = 0,
}: {
  x: number;
  y: number;
  text: string;
  arrow?: boolean;
  tilt?: number;
}): JSX.Element {
  const lines = wrap(text);
  const longest = Math.max(...lines.map((l) => l.length));
  const w = Math.max(64, Math.min(190, longest * 7.6 + 22));
  const h = lines.length * 16 + 10;
  const top = -(h + 26);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={3} cy={1.5} rx={13.0} ry={3.9} fill="url(#va-g-contact)" />
      <rect x={-2.8} y={-34 - h + 10} width={5.6} height={34 + h - 10} rx={1.4} fill={C('wood-dark')} {...thin} />
      <g transform={`rotate(${tilt} 0 ${top + h / 2})`}>
        {arrow ? (
          <path d={`M${-w / 2},${top} L${w / 2 - 8},${top} L${w / 2 + 8},${top + h / 2} L${w / 2 - 8},${top + h} L${-w / 2},${top + h} Z`} fill={C('sign')} {...LINE} />
        ) : (
          <rect x={-w / 2} y={top} width={w} height={h} rx={3} fill={C('sign')} {...LINE} />
        )}
        <path d={`M${-w / 2 + 3},${top + 2.5} L${w / 2 - 6},${top + 2.5}`} stroke={C('highlight')} strokeOpacity={0.6} strokeWidth={1.2} />
        {lines.map((l, i) => (
          <text
            key={i}
            x={arrow ? -4 : 0}
            y={top + 16 + i * 16}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fontFamily="Georgia, 'Times New Roman', serif"
            fill={C('ink')}
          >
            {l}
          </text>
        ))}
      </g>
    </g>
  );
}

/** Four stakes with red ribbons at the corners of a footprint, joined by string lines. */
export function Stakes({ cx = 0, cy = 0, A, D, strings = true }: { cx?: number; cy?: number; A: number; D: number; strings?: boolean }): JSX.Element {
  const corners: Pt[] = [iso(cx, cy, -A, -D), iso(cx, cy, A, -D), iso(cx, cy, A, D), iso(cx, cy, -A, D)];
  return (
    <g>
      {strings && <polygon points={pts(...corners)} fill="none" stroke={C('c-cream')} strokeWidth={1.4} strokeDasharray="5 2" />}
      {corners.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <rect x={-1.6} y={-15} width={3.2} height={15} fill={C('wood')} {...thin} />
          <path d="M1.6,-14 L8,-12 L1.6,-9 Z" fill={C('c-red')} {...thin} />
        </g>
      ))}
    </g>
  );
}

export interface PlotProps {
  kind: 'brief' | 'no-folder' | 'no-progress' | 'unknown';
  signText?: string;
  /** Footprint half extents (default 46 x 30); buildings pass their own so the plot matches. */
  A?: number;
  D?: number;
}

/** Plot anchors (A=46, D=30 footprint). */
export const PLOT_ANCHORS: BuildingAnchors = {
  door: { x: 0, y: 38 },
  roof: { x: 0, y: -60 },
  workSpots: [
    { x: -40, y: 28 },
    { x: -14, y: 40 },
    { x: 14, y: 46 },
    { x: 42, y: 36 },
    { x: -62, y: 8 },
    { x: 66, y: 12 },
  ],
};

/** Staked plot with a signpost: the brief stage, "no folder set", "no progress file yet". */
export function Plot({ kind, signText, A = 46, D = 30 }: PlotProps): JSX.Element {
  const text = signText ?? (kind === 'no-folder' ? 'no folder set' : kind === 'no-progress' ? 'no progress file yet' : kind === 'unknown' ? 'stage unknown' : 'new project');
  const sp = iso(0, 0, -A + 4, D + 14);
  return (
    <g>
      <polygon points={pts(iso(0, 0, -A - 8, -D - 8), iso(0, 0, A + 8, -D - 8), iso(0, 0, A + 8, D + 8), iso(0, 0, -A - 8, D + 8))} fill={C('path')} stroke={C('path-edge')} strokeWidth={1.4} />
      <polygon points={pts(iso(0, 0, -A, -D), iso(0, 0, A, -D), iso(0, 0, A, D), iso(0, 0, -A, D))} fill={C('grass-2')} fillOpacity={0.55} />
      <Stakes A={A} D={D} />
      {kind === 'no-folder' && (
        <g transform={`translate(${iso(0, 0, 4, 0).x} ${iso(0, 0, 4, 0).y})`}>
          <rect x={-1.6} y={-20} width={3.2} height={20} fill={C('wood')} {...thin} />
          <path d="M0,-18 L0,-8" stroke={C('outline')} strokeWidth={1} />
          <rect x={-5} y={-8} width={10} height={8} rx={1} fill={C('sign')} {...thin} transform="rotate(8 0 -8)" />
        </g>
      )}
      <SignPost x={sp.x} y={sp.y} text={text} arrow={kind === 'no-progress' || kind === 'unknown'} tilt={kind === 'no-folder' ? -3 : 0} />
    </g>
  );
}
