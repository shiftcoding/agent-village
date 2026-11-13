import type { HealthKind } from '../../data/types';
import { C, LINE, type Geo, type Pt } from './iso';

const thin = { ...LINE, strokeWidth: 0.95 } as const;

/** Chimney smoke (or brazier smoke). Animated puffs + a static stack for reduced motion. */
export function Smoke({ at }: { at: Pt }): JSX.Element {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <g className="va-smoke-static" fill={C('smoke')} stroke="var(--va-outline)" strokeOpacity={0.35} strokeWidth={0.8}>
        <circle cx={0} cy={-6} r={5} opacity={0.85} />
        <circle cx={4} cy={-17} r={6.4} opacity={0.7} />
        <circle cx={8} cy={-30} r={8} opacity={0.55} />
        <circle cx={13} cy={-45} r={9.5} opacity={0.38} />
      </g>
      <g className="va-smoke-anim">
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            className="va-smoke-puff"
            cx={0}
            cy={0}
            r={7}
            fill={C('smoke')}
            stroke="var(--va-outline)"
            strokeOpacity={0.35}
            strokeWidth={0.8}
            style={{ animationDelay: `${-i * 1.15}s` }}
          />
        ))}
      </g>
    </g>
  );
}

/** Iron fire basket on a tripod: the smoke source before a chimney exists. */
export function Brazier({ at }: { at: Pt }): JSX.Element {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <ellipse cx={4} cy={2} rx={14} ry={4.4} fill="url(#va-g-contact)" />
      <path d="M-8,0 L-3,-10 M8,0 L3,-10 M0,0 L0,-10" stroke={C('outline')} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M-8,-10 L8,-10 L5,-16 L-5,-16 Z" fill={C('stone-dark')} {...thin} />
      <path d="M-5,-15 Q-6,-23 -1,-27 Q-1,-22 2,-24 Q6,-20 5,-15 Z" fill="url(#va-g-flame)" {...thin} />
      <Smoke at={{ x: 0, y: -28 }} />
    </g>
  );
}

/** Roof banner with a bold "!" and a count badge. Pole base at `base`. */
export function NeedsYouBanner({ base, count }: { base: Pt; count?: number }): JSX.Element {
  const label = count === undefined ? null : count > 9 ? '9+' : String(count);
  return (
    <g transform={`translate(${base.x} ${base.y})`}>
      <line x1={0} y1={0} x2={0} y2={-58} stroke="var(--va-outline)" strokeWidth={3.4} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={-58} stroke={C('wood-light')} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={0} cy={-59} r={2.6} fill={C('gold')} {...thin} />
      <line x1={0} y1={-54} x2={34} y2={-54} stroke="var(--va-outline)" strokeWidth={2.4} strokeLinecap="round" />
      <g transform="translate(0 -54)">
        <g className="va-banner-wave">
          <path d="M0,0 L34,0 L34,32 L17,25 L0,32 Z" fill={C('alert')} {...LINE} />
          <path d="M3,3 L31,3" stroke={C('on-alert')} strokeWidth={1.2} strokeOpacity={0.7} />
          <text x={17} y={22} textAnchor="middle" fontSize={22} fontWeight={800} fontFamily="Georgia, serif" fill={C('on-alert')}>
            !
          </text>
        </g>
      </g>
      {label !== null && (
        <g transform="translate(36 -52)">
          <circle r={10} fill={C('ink')} stroke={C('parchment')} strokeWidth={1.4} />
          <text x={0} y={4.3} textAnchor="middle" fontSize={12} fontWeight={800} fontFamily="Georgia, serif" fill={C('parchment')}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/** Dark storm cloud with rain and a lightning bolt, hovering above `top`. */
export function StormCloud({ top, width }: { top: Pt; width: number }): JSX.Element {
  const s = Math.max(0.8, Math.min(1.5, width / 190));
  return (
    <g transform={`translate(${top.x} ${top.y - 52}) scale(${s})`}>
      <g className="va-cloud-drift">
        <ellipse cx={4} cy={6} rx={78.0} ry={10.4} fill="url(#va-g-contact)" />
        <path
          d="M-52,4 Q-66,4 -62,-10 Q-58,-22 -42,-18 Q-38,-36 -16,-34 Q-2,-46 16,-34 Q36,-40 42,-22 Q64,-22 62,-6 Q62,6 48,4 Z"
          fill={C('cloud')}
          {...LINE}
        />
        <path d="M-46,-6 Q-30,-14 -16,-8 Q-4,-20 12,-10" fill="none" stroke={C('cloud-dark')} strokeWidth={4} strokeLinecap="round" strokeOpacity={0.7} />
        <path d="M-40,-22 Q-34,-30 -22,-28" fill="none" stroke={C('highlight')} strokeWidth={2} strokeLinecap="round" strokeOpacity={0.35} />
        <g className="va-lightning">
          <path d="M6,4 L-6,24 L2,24 L-6,44 L14,18 L5,18 L12,4 Z" fill={C('lightning')} {...thin} />
        </g>
        <g stroke={C('rain')} strokeWidth={2} strokeLinecap="round">
          {[-40, -26, -12, 20, 34, 48].map((x, i) => (
            <line key={x} className="va-rain" x1={x} y1={10 + (i % 2) * 5} x2={x - 3} y2={20 + (i % 2) * 5} style={{ animationDelay: `${-i * 0.15}s` }} />
          ))}
        </g>
      </g>
    </g>
  );
}

/** Small masked figure sitting on the doorstep (user friction). */
export function MaskedSitter({ at }: { at: Pt }): JSX.Element {
  return (
    <g transform={`translate(${at.x} ${at.y}) scale(1.25)`}>
      <ellipse cx={1} cy={1} rx={15.6} ry={4.4} fill="url(#va-g-contact)" />
      <path d="M-9,0 L-8,-12 Q0,-18 8,-12 L9,0 Z" fill={C('c-purple-dark')} {...LINE} />
      <path d="M-9,0 L-15,0 M9,0 L15,0" stroke={C('c-purple-dark')} strokeWidth={4} strokeLinecap="round" />
      <circle cx={0} cy={-20} r={7} fill={C('mask')} {...LINE} />
      <path d="M-5,-21.5 Q-3.4,-23 -1.8,-21.5 M1.8,-21.5 Q3.4,-23 5,-21.5" fill="none" stroke={C('outline')} strokeWidth={1.2} />
      <path d="M-3,-15.5 Q0,-18.2 3,-15.5" fill="none" stroke={C('outline')} strokeWidth={1.2} strokeLinecap="round" />
      <path d="M-7,-26 Q0,-33 7,-26 Q0,-28 -7,-26 Z" fill={C('c-purple-dark')} {...thin} />
      <path d="M7,-24 Q8,-14 5,-9" fill="none" stroke={C('rain')} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

/** One creeping vine: a wavy stem with alternating leaves. */
export function Vine({ x, y, h, lean, seed }: { x: number; y: number; h: number; lean: number; seed: number }): JSX.Element {
  const n = Math.max(2, Math.round(h / 9));
  const step = h / n;
  const p: Pt[] = Array.from({ length: n + 1 }, (_, i) => ({
    x: x + Math.sin(i * 1.4 + seed) * 4 + lean * i * step,
    y: y - i * step,
  }));
  const d = p.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  return (
    <g className="va-vine-sway" style={{ transformOrigin: `${x}px ${y}px` }}>
      <path d={d} fill="none" stroke={C('vine-dark')} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      {p.slice(1).map((q, i) => (
        <ellipse
          key={i}
          cx={q.x + (i % 2 === 0 ? 4 : -4)}
          cy={q.y}
          rx={4.6}
          ry={2.4}
          transform={`rotate(${i % 2 === 0 ? -30 : 30} ${q.x + (i % 2 === 0 ? 4 : -4)} ${q.y})`}
          fill={i % 3 === 0 ? C('vine') : C('leaf')}
          {...thin}
        />
      ))}
    </g>
  );
}

/** Vines creeping over walls, signposts or stones (stale). */
export function Vines({ geo }: { geo: Geo }): JSX.Element {
  return (
    <g>
      {geo.vines.map((v, i) => (
        <Vine key={i} x={v.x} y={v.y} h={v.h} lean={v.lean} seed={i * 1.7} />
      ))}
    </g>
  );
}

/** Flag on a pole (released). Pole base at `base`. */
export function Flag({ base, height = 56 }: { base: Pt; height?: number }): JSX.Element {
  return (
    <g transform={`translate(${base.x} ${base.y})`}>
      <line x1={0} y1={0} x2={0} y2={-height} stroke="var(--va-outline)" strokeWidth={3.4} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={-height} stroke={C('wood-light')} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={0} cy={-height - 1} r={2.8} fill={C('gold')} {...thin} />
      <g transform={`translate(0 ${-height + 2})`}>
        <g className="va-flag-wave">
          <path d="M0,0 Q14,-5 28,0 T52,0 L46,13 L52,26 Q40,31 28,26 T0,26 Z" fill={C('flag')} {...LINE} />
          <circle cx={16} cy={13} r={5.5} fill={C('parchment')} {...thin} />
          <path d="M16,8.5 L17.5,12 L21,12.4 L18.4,14.6 L19.2,18 L16,16.2 L12.8,18 L13.6,14.6 L11,12.4 L14.5,12 Z" fill={C('gold')} />
        </g>
      </g>
    </g>
  );
}

/**
 * Fireworks: three bursts that play ONCE (animation-iteration-count 1, ~3 s) and then vanish; under reduced motion
 * they stay as static sparks (the UI decides how long to keep them mounted, e.g. once on reaching `released`).
 * `at` is either the three burst centres, or ONE point (scene or local coordinates, whatever the parent group uses):
 * then the bursts are spread around it (left, right, high), so `<g transform="translate(x y)"><Fireworks at={{x:0,y:-190}} /></g>` works standalone.
 */
export function Fireworks({ at }: { at: Pt | Pt[] }): JSX.Element {
  const colours = ['firework-1', 'firework-2', 'firework-3'];
  const centres: Pt[] = Array.isArray(at)
    ? at.slice(0, 3)
    : [
        { x: at.x - 36, y: at.y + 4 },
        { x: at.x + 34, y: at.y - 14 },
        { x: at.x, y: at.y - 44 },
      ];
  return (
    <g aria-hidden="true">
      {centres.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <g className={`va-fw va-fw-${i + 1}`}>
            {Array.from({ length: 10 }, (_, k) => {
              const ang = (k / 10) * Math.PI * 2;
              const r1 = 7;
              const r2 = 18 + (k % 2) * 5;
              return (
                <line
                  key={k}
                  x1={Math.cos(ang) * r1}
                  y1={Math.sin(ang) * r1}
                  x2={Math.cos(ang) * r2}
                  y2={Math.sin(ang) * r2}
                  stroke={C(colours[(i + k) % 3] ?? 'firework-1')}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              );
            })}
            <circle r={2.6} fill={C('firework-2')} />
          </g>
        </g>
      ))}
    </g>
  );
}

const PUFFS: Array<{ x: number; dx: number; dy: number; r: number; d: number }> = [
  { x: -46, dx: -22, dy: -10, r: 9, d: 0 },
  { x: -26, dx: -12, dy: -18, r: 11, d: 0.08 },
  { x: -6, dx: -2, dy: -22, r: 12, d: 0.02 },
  { x: 14, dx: 8, dy: -18, r: 11, d: 0.12 },
  { x: 34, dx: 16, dy: -12, r: 10, d: 0.05 },
  { x: 52, dx: 26, dy: -8, r: 8, d: 0.14 },
];
const CHIPS: Array<{ x: number; dx: number; dy: number; rot: number; d: number }> = [
  { x: -34, dx: -26, dy: -52, rot: -200, d: 0.02 },
  { x: -14, dx: -10, dy: -64, rot: 150, d: 0.1 },
  { x: 6, dx: 6, dy: -58, rot: -120, d: 0 },
  { x: 24, dx: 18, dy: -66, rot: 220, d: 0.14 },
  { x: 42, dx: 30, dy: -50, rot: 170, d: 0.06 },
];

/**
 * Build burst for a growth-stage change: dust puffs and a few wood chips rise from the base of the building,
 * once (about 1.2 s, iteration-count 1), then vanish. `at` is the building's footprint centre; `width` its
 * rough width (default 110). Motion-only: with reduced motion (OS setting or data-motion="reduce") the
 * whole element is display:none, i.e. no output, and the UI cross-fades the stages instead.
 */
export function BuildBurst({ at, width = 110 }: { at: Pt; width?: number }): JSX.Element {
  const k = Math.max(0.6, Math.min(1.6, width / 110));
  return (
    <g className="va-burst" aria-hidden="true" transform={`translate(${at.x} ${at.y}) scale(${k})`}>
      {PUFFS.map((p, i) => (
        <circle
          key={i}
          className="va-burst-puff"
          cx={p.x}
          cy={0}
          r={p.r}
          fill={C('smoke')}
          stroke="var(--va-outline)"
          strokeOpacity={0.35}
          strokeWidth={0.8}
          style={{ animationDelay: `${p.d}s`, ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px` }}
        />
      ))}
      {CHIPS.map((c, i) => (
        <g key={i} transform={`translate(${c.x} -4)`}>
          <rect
            className="va-burst-chip"
            x={-3.4}
            y={-1.6}
            width={6.8}
            height={3.2}
            rx={0.8}
            fill={C(i % 2 ? 'wood-light' : 'wood')}
            {...thin}
            style={{ animationDelay: `${c.d}s`, ['--dx' as string]: `${c.dx}px`, ['--dy' as string]: `${c.dy}px`, ['--rot' as string]: `${c.rot}deg` }}
          />
        </g>
      ))}
    </g>
  );
}

export interface OverlayProps {
  geo: Geo;
  signals: HealthKind[];
  /** Stage has a roof/walls with windows: true when it makes sense to show the "released" flag at roof height. */
  needsYouCount?: number;
  /** Built-in fireworks with the released signal (default true). */
  fireworks?: boolean;
}

/** All signal overlays, in drawing order (back to front). Smoke belongs to `active` (and released lamp-lit chimneys). */
export function BackOverlays({ geo, signals, fireworks = true }: OverlayProps): JSX.Element {
  const has = (k: HealthKind): boolean => signals.includes(k);
  return (
    <g>
      {fireworks && has('released') && <Fireworks at={geo.sky} />}
      {has('active') && (geo.chimney ? <Smoke at={geo.chimney} /> : <Brazier at={geo.fire} />)}
    </g>
  );
}

export function FrontOverlays({ geo, signals, needsYouCount }: OverlayProps): JSX.Element {
  const has = (k: HealthKind): boolean => signals.includes(k);
  return (
    <g>
      {has('stale') && <Vines geo={geo} />}
      {has('friction') && <MaskedSitter at={geo.doorstep} />}
      {has('released') && <Flag base={geo.flagBase} />}
      {has('needs-you') && <NeedsYouBanner base={geo.bannerBase} count={needsYouCount} />}
      {has('failing') && <StormCloud top={geo.top} width={geo.width} />}
    </g>
  );
}
