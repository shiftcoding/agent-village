import type { ReactNode } from 'react';
import type { Stage } from '../../data/types';
import type { BuildingAnchors, BuildingArtProps } from '../contract';
import { BackOverlays, FrontOverlays } from './Overlays';
import { Plot, SignPost, Stakes } from './Plot';
import { Beam, Box, C, CastShadow, Scaled, scalePt, GroundShadow, LINE, RoofFx, SHADE_OPACITY, U, iso, leftFaceTf, pts, rightFaceTf, type Geo, type Pt } from './iso';

export type BuildingVariant = 'lodge' | 'workshop';

interface Spec {
  A: number;
  D: number;
  floorH: number;
  floors: number;
  rise: number;
  doorH: number;
  /** Chimney stack half extents. */
  sa: number;
  sd: number;
}

export const SPECS: Record<BuildingVariant, Spec> = {
  lodge: { A: 58, D: 34, floorH: 42, floors: 2, rise: 44, doorH: 34, sa: 8, sd: 10 },
  workshop: { A: 34, D: 24, floorH: 34, floors: 2, rise: 34, doorH: 28, sa: 5.5, sd: 7 },
};

const PLINTH = 6;
const OVER = 6;
const thin = { ...LINE, strokeWidth: 0.95 } as const;

/** Scale origin (T39 round 2): ground at the foot of the front wall. The building is drawn BUILDING_SCALE x; garden, work spots and door steps' front edge stay. */
export function scaleOrigin(variant: BuildingVariant): Pt {
  return iso(0, 0, 0, SPECS[variant].D);
}

/**
 * Focus rings for the project buildings, keyed like the UI's RING record (src/ui/Scene.tsx). The top, left and right follow
 * the scaled art, the bottom is unchanged (name tags sit below). `plot` is the standalone Plot (no folder / no progress file), not scaled.
 */
export const BUILDING_RINGS = {
  'hearth-lodge': { x: -190, y: -291, w: 300, h: 386 },
  'cartographers-workshop': { x: -140, y: -242, w: 280, h: 322 },
  plot: { x: -90, y: -115, w: 180, h: 180 },
} as const;

/** Anchors for a building variant (local coordinates, footprint centre at 0,0). */
export function anchorsFor(variant: BuildingVariant): BuildingAnchors {
  const { A, D, floorH, floors, rise } = SPECS[variant];
  const r1 = D + (variant === 'lodge' ? 14 : 12);
  const r2 = D + (variant === 'lodge' ? 34 : 30);
  const a1 = variant === 'lodge' ? [-52, -30, 30, 52] : [-40, -24, 24, 40];
  const a2 = variant === 'lodge' ? [-42, -14, 14, 42] : [-30, -10, 10, 30];
  const o = scaleOrigin(variant);
  return {
    door: scalePt(iso(0, 0, 0, D + 4), o),
    roof: scalePt(iso(0, 0, 0, 0, PLINTH + floors * floorH + rise + (A > 0 ? 0 : 0)), o),
    workSpots: [...a1.map((a) => iso(0, 0, a, r1)), ...a2.map((a) => iso(0, 0, a, r2))],
  };
}

const ORDER: Record<Stage, number> = { brief: 0, research: 1, product: 2, design: 3, architecture: 4, building: 5, testing: 6, released: 7, unknown: -1 };

/* ------------------------------------------------------------------ details */

function Win({ x, y, lit, w = 14, h = 17, shut = true }: { x: number; y: number; lit: boolean; w?: number; h?: number; shut?: boolean }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      {lit && <rect x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} rx={4} fill={C('glow')} fillOpacity={0.4} />}
      {shut && (
        <g>
        <rect x={-w / 2 - 8.4} y={-h / 2 - 1} width={5.4} height={h + 2} fill={C('wood')} {...thin} />
        <rect x={w / 2 + 3} y={-h / 2 - 1} width={5.4} height={h + 2} fill={C('wood')} {...thin} />
        <rect x={-w / 2 - 8.4} y={-h / 2 - 1} width={5.4} height={h + 2} fill={U('p-planks')} />
        <rect x={w / 2 + 3} y={-h / 2 - 1} width={5.4} height={h + 2} fill={U('p-planks')} />
        </g>
      )}
      <rect x={-w / 2 - 2.2} y={-h / 2 - 2.2} width={w + 4.4} height={h + 4.4} rx={1.5} fill={C('wood-dark')} {...thin} />
      <rect x={-w / 2 - 3.6} y={h / 2 + 2} width={w + 7.2} height={2.8} rx={0.8} fill={C('wood-light')} {...thin} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={lit ? C('window-lit') : C('window')} className={lit ? 'va-window-lit' : undefined} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={U('g-glass')} />
      <path d={`M0,${-h / 2} L0,${h / 2} M${-w / 2},0 L${w / 2},0`} stroke={C('wood-dark')} strokeWidth={1.4} />
      {!lit && <path d={`M${-w / 2},${-h / 2} L${-w / 2 + 4},${-h / 2} L${-w / 2},${-h / 2 + 5} Z`} fill={C('highlight')} fillOpacity={0.4} />}
    </g>
  );
}

function Door({ cx, h, open }: { cx: number; h: number; open: boolean }): JSX.Element {
  const w = 24;
  return (
    <g transform={`translate(${cx} 0)`}>
      <path d={`M${-w / 2 - 2.4},0 L${-w / 2 - 2.4},${-h + 8} Q0,${-h - 8} ${w / 2 + 2.4},${-h + 8} L${w / 2 + 2.4},0 Z`} fill={C('wood-dark')} {...thin} />
      <path d={`M${-w / 2},0 L${-w / 2},${-h + 8} Q0,${-h - 5} ${w / 2},${-h + 8} L${w / 2},0 Z`} fill={open ? C('outline') : C('wood')} {...thin} />
      {!open && (
        <g>
          <path d={`M${-w / 2},0 L${-w / 2},${-h + 8} Q0,${-h - 5} ${w / 2},${-h + 8} L${w / 2},0 Z`} fill={U('p-planks')} />
          <path d={`M${-w / 2},0 L${-w / 2},${-h + 8} Q0,${-h - 5} ${w / 2},${-h + 8} L${w / 2},0 Z`} fill={U('g-lit')} />
          <path d={`M-4,0 L-4,${-h + 2} M4,0 L4,${-h + 2}`} stroke={C('wood-dark')} strokeWidth={1} strokeOpacity={0.7} />
          <circle cx={7} cy={-h / 2} r={1.6} fill={C('gold')} />
        </g>
      )}
    </g>
  );
}

/** Carved sign, front-facing. Lodge: Bro, a round-eared face over the text. Workshop: a compass rose. */
function CarvedSign({ variant, x, y, scale = 1 }: { variant: BuildingVariant; x: number; y: number; scale?: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {variant === 'lodge' ? (
        <g>
          <rect x={-18} y={-17} width={36} height={34} rx={5} fill={C('sign')} {...LINE} />
          <rect x={-15.5} y={-14.5} width={31} height={29} rx={3} fill="none" stroke={C('wood-dark')} strokeWidth={1} />
          <circle cx={-8.5} cy={-8} r={3.6} fill={C('wood')} {...thin} />
          <circle cx={8.5} cy={-8} r={3.6} fill={C('wood')} {...thin} />
          <circle cx={0} cy={-3} r={8.2} fill={C('wood')} {...thin} />
          <circle cx={-3} cy={-4.5} r={1.1} fill={C('ink')} />
          <circle cx={3} cy={-4.5} r={1.1} fill={C('ink')} />
          <ellipse cx={0} cy={-0.4} rx={3} ry={2.2} fill={C('wood-light')} {...thin} />
          <path d="M-1.4,-1.4 L1.4,-1.4 L0,0.2 Z" fill={C('ink')} />
          <text x={0} y={14} textAnchor="middle" fontSize={12} fontWeight={800} fontFamily="Georgia, serif" fill={C('ink')}>
            Bro
          </text>
        </g>
      ) : (
        <g>
          <circle r={15} fill={C('wood-light')} {...LINE} />
          <circle r={11} fill={C('parchment')} {...thin} />
          <path d="M0,-11 L2.6,-2.6 L11,0 L2.6,2.6 L0,11 L-2.6,2.6 L-11,0 L-2.6,-2.6 Z" fill={C('c-teal')} {...thin} />
          <path d="M0,-11 L1.6,-1.6 L-1.6,-1.6 Z" fill={C('c-red')} />
        </g>
      )}
    </g>
  );
}

/** Weathervane compass at the ridge (workshop, roofed stages). */
function Vane({ at }: { at: Pt }): JSX.Element {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <line x1={0} y1={0} x2={0} y2={-20} stroke={C('outline')} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M-9,-14 L9,-14 M0,-23 L0,-5" stroke={C('gold-dark')} strokeWidth={1.6} />
      <path d="M-12,-20 L0,-17 L12,-20 L0,-23 Z" fill={C('gold')} {...thin} />
    </g>
  );
}

function Plank({ x, y, w, rot = 0 }: { x: number; y: number; w: number; rot?: number }): JSX.Element {
  return <rect x={x} y={y} width={w} height={4} fill={C('wood-light')} {...thin} transform={`rotate(${rot} ${x} ${y})`} />;
}

/* ---------------------------------------------------------------- the build */

export interface ProjectBuildingProps extends BuildingArtProps {
  variant: BuildingVariant;
}

export function ProjectBuilding({ variant, stage, overall, signals, needsYouCount, signText, fireworks }: ProjectBuildingProps): JSX.Element {
  const sp = SPECS[variant];
  const so = scaleOrigin(variant);
  const { A, D, floorH, floors, rise, doorH, sa, sd } = sp;
  const H = floorH * floors;
  const si = ORDER[stage];
  const lit = signals.includes('active') || stage === 'released';
  const label = variant === 'lodge' ? 'Hearth Lodge' : "Cartographer's Workshop";

  if (si < 0) return <PlotWithShadow variant={variant} kind="unknown" text={signText ?? 'stage unknown'} signals={signals} needsYouCount={needsYouCount} />;
  if (si === 0) return <PlotWithShadow variant={variant} kind="brief" text={signText ?? label} signals={signals} needsYouCount={needsYouCount} />;

  const pct = Math.max(0, Math.min(100, overall ?? 50));
  const hasPlinth = si >= 2;
  const z0 = hasPlinth ? PLINTH : 0;
  const hasRoof = si >= 6;
  const framed = si === 3;
  const h = framed ? H : si === 4 ? Math.round(floorH * 0.85) : si === 5 ? Math.round(floorH + (pct / 100) * (H - floorH)) : si >= 6 ? H : 0;
  const zt = z0 + h;
  const ridgeZ = z0 + H + rise;
  const hasWalls = si >= 4;
  const chimneyTop = si >= 6 ? ridgeZ + 14 : si === 5 ? zt + 10 : si === 4 ? z0 + h * 0.7 : 0;
  const hasChimney = si >= 4;

  const geo: Geo = {
    chimney: hasChimney && si >= 5 ? iso(0, 0, A + 7, 0, chimneyTop + 4) : null,
    top: { x: 0, y: iso(0, 0, 0, 0, hasRoof ? ridgeZ + (variant === 'workshop' ? 24 : 0) : z0 + (framed ? H : h) + 24).y - (hasChimney && si >= 6 ? 4 : 0) },
    bannerBase: hasRoof ? iso(0, 0, -A + 6, 0, ridgeZ - 4) : iso(0, 0, -A - 12, D + 14),
    flagBase: hasRoof ? iso(0, 0, A - 14, 0, ridgeZ - 4) : iso(0, 0, A - 14, 0, z0 + h),
    door: iso(0, 0, 0, D + 4),
    doorstep: iso(0, 0, 24, D + 12),
    fire: iso(0, 0, -A + 6, D + 28),
    vines: [],
    sky: [iso(0, 0, -A - 26, 0, ridgeZ + 36), iso(0, 0, A + 30, 0, ridgeZ + 50), iso(0, 0, 0, -D - 20, ridgeZ + 70)],
    width: 2 * (A + D),
  };
  // vines creep over the walls (or over stakes and sign when there are no walls yet)
  if (hasWalls || framed) {
    const lg = iso(0, 0, -A, D);
    const fg = iso(0, 0, A, D);
    const vh = Math.max(28, (h || H) * 0.7);
    geo.vines = [
      { x: lg.x + 6, y: lg.y + 3 - z0, h: vh, lean: 0.03 },
      { x: lg.x + A * 0.55, y: lg.y + A * 0.275 - z0, h: vh * 0.75, lean: -0.02 },
      { x: lg.x + A * 1.5, y: lg.y + A * 0.75 - z0, h: vh * 0.9, lean: 0.02 },
      { x: fg.x + D * 0.5, y: fg.y - D * 0.25 - z0, h: vh * 0.65, lean: 0.03 },
    ];
  } else {
    const c1 = iso(0, 0, -A, D);
    const c2 = iso(0, 0, A, D);
    geo.vines = [
      { x: c1.x, y: c1.y, h: 24, lean: 0.03 },
      { x: c2.x, y: c2.y, h: 24, lean: -0.03 },
      { x: iso(0, 0, -A, -D).x, y: iso(0, 0, -A, -D).y, h: 20, lean: 0.02 },
    ];
  }

  const log = variant === 'lodge';
  const leftFill = log ? C('wood-light') : C('plaster');
  const rightFill = log ? C('wood') : C('plaster-shade');

  /* ----- pieces ----- */
  const plinth = hasPlinth && (
    <g>
      <Box A={A + 3} D={D + 3} h={PLINTH} left={C('stone')} right={C('stone-dark')} top={C('path-edge')} tex="stone">
        <g transform={leftFaceTf(0, 0, A + 3, D + 3, 0)} stroke={C('outline')} strokeOpacity={0.45} strokeWidth={0.8}>
          {Array.from({ length: Math.round(A / 6) }, (_, i) => (
            <path key={i} d={`M${i * 12 + (i % 2) * 4},0 L${i * 12 + (i % 2) * 4},-${PLINTH}`} />
          ))}
        </g>
      </Box>
      {si === 2 && <polygon points={pts(iso(0, 0, -A + 3, -D + 3, PLINTH), iso(0, 0, A - 3, -D + 3, PLINTH), iso(0, 0, A - 3, D - 3, PLINTH), iso(0, 0, -A + 3, D - 3, PLINTH))} fill={C('path-edge')} stroke={C('outline')} strokeWidth={0.8} strokeOpacity={0.5} />}
    </g>
  );

  const stack = hasChimney && (
    <g>
      <Box cx={iso(0, 0, A + 7, 0).x} cy={iso(0, 0, A + 7, 0).y} A={sa} D={sd} h={Math.max(8, chimneyTop)} left={C('stone-light')} right={C('stone-dark')} top={C('stone')} tex="stone">
        <g transform={leftFaceTf(iso(0, 0, A + 7, 0).x, iso(0, 0, A + 7, 0).y, sa, sd, 0)} stroke={C('outline')} strokeOpacity={0.4} strokeWidth={0.8} fill="none">
          {Array.from({ length: Math.floor(chimneyTop / 8) }, (_, i) => (
            <path key={i} d={`M0,${-(i + 1) * 8} L${sa * 2},${-(i + 1) * 8}`} />
          ))}
        </g>
      </Box>
      {si >= 5 && (
        <Box cx={iso(0, 0, A + 7, 0).x} cy={iso(0, 0, A + 7, 0).y} A={sa + 1.8} D={sd + 1.8} h={4} z={chimneyTop} left={C('stone-light')} right={C('stone-dark')} top={C('stone')} />
      )}
      {si >= 5 && (
        <g transform={leftFaceTf(iso(0, 0, A + 7, 0).x, iso(0, 0, A + 7, 0).y, sa, sd, 0)}>
          <path d={`M${sa - 4.5},0 L${sa - 4.5},-7 Q${sa},-13 ${sa + 4.5},-7 L${sa + 4.5},0 Z`} fill={lit ? C('glow') : C('outline')} />
        </g>
      )}
    </g>
  );

  const walls = hasWalls && (
    <g>
      {!hasRoof && (
        <g>
          {/* open top: earthen floor and the inner faces of the back walls show while the roof is missing */}
          <polygon points={pts(iso(0, 0, -A, -D, z0), iso(0, 0, A, -D, z0), iso(0, 0, A, D, z0), iso(0, 0, -A, D, z0))} fill={C('path-edge')} />
          <polygon points={pts(iso(0, 0, -A, -D, z0), iso(0, 0, A, -D, z0), iso(0, 0, A, -D, zt), iso(0, 0, -A, -D, zt))} fill={C('wood')} {...LINE} />
          <polygon points={pts(iso(0, 0, -A, -D, z0), iso(0, 0, -A, D, z0), iso(0, 0, -A, D, zt), iso(0, 0, -A, -D, zt))} fill={C('wood-dark')} {...LINE} />
        </g>
      )}
      <Box z={z0} A={A} D={D} h={h} left={leftFill} right={rightFill} top={hasRoof ? C('wood') : 'none'} tex={log ? 'logs' : 'plaster'} />
      {/* left face */}
      <g transform={leftFaceTf(0, 0, A, D, z0)}>
        <WallDetail w={2 * A} h={h} floorH={floorH} log={log} lit={lit} variant={variant} doorH={doorH} open={si === 4} first />
        {si >= 4 && <Door cx={A} h={doorH} open={si === 4} />}
      </g>
      {/* right face */}
      <g transform={rightFaceTf(0, 0, A, D, z0)}>
        <WallDetail w={2 * D} h={h} floorH={floorH} log={log} lit={lit} variant={variant} doorH={doorH} open={false} first={false} shadeFace />
      </g>
      {/* door step */}
      <Box cx={iso(0, 0, 0, D + 5).x} cy={iso(0, 0, 0, D + 5).y - z0} A={15} D={5} h={3} left={C('stone-light')} right={C('stone-dark')} top={C('stone')} />
    </g>
  );

  const gable = hasRoof && (
    <g>
      <polygon points={pts(iso(0, 0, A, D, zt), iso(0, 0, A, -D, zt), iso(0, 0, A, 0, zt + rise * 0.92))} fill={rightFill} {...LINE} />
      <polygon points={pts(iso(0, 0, A, D, zt), iso(0, 0, A, -D, zt), iso(0, 0, A, 0, zt + rise * 0.92))} fill={U(log ? 'p-logs' : 'p-plaster')} />
      <polygon points={pts(iso(0, 0, A, D, zt), iso(0, 0, A, -D, zt), iso(0, 0, A, 0, zt + rise * 0.92))} fill={C('shade')} style={SHADE_OPACITY} />
      <polygon points={pts(iso(0, 0, A, D, zt), iso(0, 0, A, -D, zt), iso(0, 0, A, 0, zt + rise * 0.92))} fill={U('g-dim')} />
      <g transform={rightFaceTf(0, 0, A, D, zt)}>
        <circle cx={D * 0.55} cy={-rise * 0.4} r={5} fill={lit ? C('window-lit') : C('window')} stroke={C('wood-dark')} strokeWidth={2} />
      </g>
    </g>
  );

  const roof = hasRoof && (
    <g>
      {(() => {
        const Lt = iso(0, 0, -A - OVER, D + OVER, zt - 2);
        const Ft = iso(0, 0, A + OVER, D + OVER, zt - 2);
        const Rt = iso(0, 0, A + OVER, -D - OVER, zt - 2);
        const M1 = iso(0, 0, -A - OVER, 0, ridgeZ);
        const M2 = iso(0, 0, A + OVER, 0, ridgeZ);
        const rows = [0.2, 0.4, 0.6, 0.8].map((t) => ({
          p: { x: Lt.x + (M1.x - Lt.x) * t, y: Lt.y + (M1.y - Lt.y) * t },
          q: { x: Ft.x + (M2.x - Ft.x) * t, y: Ft.y + (M2.y - Ft.y) * t },
        }));
        return (
          <g>
            <polygon points={pts(Lt, Ft, M2, M1)} fill={variant === 'lodge' ? C('roof') : C('slate')} {...LINE} />
            <RoofFx points={pts(Lt, Ft, M2, M1)} tex={variant === 'lodge' ? 'tiles' : 'slate'} />
            {rows.map((r, i) => (
              <line key={i} x1={r.p.x} y1={r.p.y} x2={r.q.x} y2={r.q.y} stroke={variant === 'lodge' ? C('roof-dark') : C('slate-dark')} strokeWidth={1.2} strokeOpacity={0.6} />
            ))}
            <polygon points={pts(Lt, { x: Lt.x + (M1.x - Lt.x) * 0.16, y: Lt.y + (M1.y - Lt.y) * 0.16 }, { x: Ft.x + (M2.x - Ft.x) * 0.16, y: Ft.y + (M2.y - Ft.y) * 0.16 }, Ft)} fill={C('shade')} style={SHADE_OPACITY} />
            <path d={`M${Lt.x},${Lt.y} L${M1.x},${M1.y} L${M2.x},${M2.y} L${Ft.x},${Ft.y}`} fill="none" stroke={variant === 'lodge' ? C('roof-light') : C('c-steel')} strokeWidth={1.8} strokeOpacity={0.7} />
            <line x1={Ft.x} y1={Ft.y} x2={M2.x} y2={M2.y} stroke={C('wood-dark')} strokeWidth={3.4} strokeLinecap="round" />
            <line x1={Rt.x} y1={Rt.y} x2={M2.x} y2={M2.y} stroke={C('wood-dark')} strokeWidth={3.4} strokeLinecap="round" />
            <line x1={M1.x} y1={M1.y} x2={M2.x} y2={M2.y} stroke={C('wood-dark')} strokeWidth={3} strokeLinecap="round" />
          </g>
        );
      })()}
    </g>
  );

  // bunting along the eave (testing: banners being hung; released: all up)
  const eaveL = iso(0, 0, -A - OVER, D + OVER, zt - 8);
  const eaveF = iso(0, 0, A + OVER, D + OVER, zt - 8);
  const bunting = hasRoof && (
    <g>
      <path d={`M${eaveL.x},${eaveL.y} Q${(eaveL.x + eaveF.x) / 2},${(eaveL.y + eaveF.y) / 2 + 12} ${eaveF.x},${eaveF.y}`} fill="none" stroke={C('outline')} strokeWidth={1.2} />
      {Array.from({ length: stage === 'released' ? 9 : 5 }, (_, i) => {
        const count = stage === 'released' ? 9 : 5;
        const t = (i + 1) / (count + 1);
        const x = eaveL.x + (eaveF.x - eaveL.x) * t;
        const y = eaveL.y + (eaveF.y - eaveL.y) * t + 12 * 2 * t * (1 - t);
        const cols = ['c-red', 'c-yellow', 'c-teal', 'c-magenta'];
        return <path key={i} className="va-pennant" style={{ transformOrigin: `${x}px ${y}px` }} d={`M${x - 4},${y} L${x + 4},${y} L${x},${y + 10} Z`} fill={C(cols[i % 4] ?? 'c-red')} {...thin} />;
      })}
    </g>
  );

  // vertical banners flanking the door; in testing one is still being hung
  const bannerBase = iso(0, 0, 0, D, z0);
  const doorBanners = hasRoof && (
    <g>
      {[-1, 1].map((s) => {
        const hung = stage === 'released' || s === -1;
        const bx = bannerBase.x + s * (variant === 'lodge' ? 30 : 22);
        const by = bannerBase.y + (s * (variant === 'lodge' ? 30 : 22)) / 2 - (doorH + 10);
        return (
          <g key={s} transform={`translate(${bx} ${by})`}>
            <line x1={-7} y1={-3} x2={7} y2={-3} stroke={C('wood-dark')} strokeWidth={2.2} strokeLinecap="round" />
            {hung ? (
              <path d="M-6,-2 L6,-2 L6,22 L0,17 L-6,22 Z" fill={C('c-red')} {...thin} />
            ) : (
              <path d="M-6,-2 L6,-2 L6,10 L-6,10 Z" fill={C('c-red')} {...thin} transform="rotate(-8)" />
            )}
            {hung && <circle cx={0} cy={7} r={2.8} fill={C('gold')} />}
          </g>
        );
      })}
      {stage === 'testing' && <LadderAt at={iso(0, 0, 30 + (variant === 'lodge' ? 4 : -2), D + 3, z0)} h={doorH + 12} />}
    </g>
  );

  const inspectors = si === 6 && (
    <g transform={`translate(${iso(0, 0, 22, D + 18).x} ${iso(0, 0, 22, D + 18).y})`}>
      <Box A={11} D={6} h={11} left={C('wood-light')} right={C('wood')} top={C('wood-light')} />
      <g transform="translate(-2 -12)">
        <rect x={-6} y={-8} width={12} height={9} fill={C('parchment')} {...thin} transform="rotate(-8)" />
        <path d="M-3.6,-4.5 L-2.2,-3 L0.4,-6.6 M-3.6,-1 L-2.2,0.5 L0.4,-3" fill="none" stroke={C('ink')} strokeWidth={1.2} transform="rotate(-8)" />
        <rect x={-2.2} y={-10} width={4.4} height={2.4} rx={1} fill={C('c-steel-dark')} transform="rotate(-8)" />
      </g>
    </g>
  );

  const blueprint = si === 4 && (
    <g transform={`translate(${iso(0, 0, A - 12, D + 24).x} ${iso(0, 0, A - 12, D + 24).y})`}>
      <path d="M-14,0 L-14,-14 M14,0 L14,-14" stroke={C('wood-dark')} strokeWidth={2.6} strokeLinecap="round" />
      <rect x={-20} y={-40} width={40} height={30} rx={2} fill={C('wood-light')} {...LINE} />
      <rect x={-17} y={-37} width={20} height={24} fill={C('blueprint')} {...thin} transform="rotate(-3 -17 -37)" />
      <path d="M-14,-31 L-1,-31 M-14,-26 L-6,-26 M-14,-21 L-3,-21 M-4,-24 L0,-18" stroke={C('blueprint-line')} strokeWidth={1.1} fill="none" transform="rotate(-3 -17 -37)" />
      <rect x={1} y={-33} width={17} height={21} fill={C('blueprint')} {...thin} transform="rotate(4 1 -33)" />
      <rect x={5} y={-28} width={9} height={9} fill="none" stroke={C('blueprint-line')} strokeWidth={1.1} transform="rotate(4 1 -33)" />
      <circle cx={-16} cy={-36} r={1.6} fill={C('c-red')} />
      <circle cx={16} cy={-30} r={1.6} fill={C('c-red')} />
    </g>
  );

  /* ----- stage-specific pre-wall content ----- */
  const earth = (
    <polygon
      points={pts(iso(0, 0, -A - 10, -D - 10), iso(0, 0, A + 10, -D - 10), iso(0, 0, A + 10, D + 10), iso(0, 0, -A - 10, D + 10))}
      fill={C('path')}
      stroke={C('path-edge')}
      strokeWidth={1.4}
    />
  );

  const survey = si === 1 && <SurveyorsTent A={A} D={D} />;
  const strings = si <= 2 && (
    <g stroke={C('c-cream')} strokeWidth={1.3} strokeDasharray="5 2" fill="none">
      <line x1={iso(0, 0, 0, -D).x} y1={iso(0, 0, 0, -D).y - z0} x2={iso(0, 0, 0, D).x} y2={iso(0, 0, 0, D).y - z0} />
      <line x1={iso(0, 0, -A, 0).x} y1={iso(0, 0, -A, 0).y - z0} x2={iso(0, 0, A, 0).x} y2={iso(0, 0, A, 0).y - z0} />
    </g>
  );
  const frame = (framed || si === 5) && <TimberFrame A={A} D={D} z0={z0} h={si === 5 ? Math.min(H, Math.ceil((h + 1) / floorH) * floorH) : H} wallH={si === 5 ? h : 0} floorH={floorH} />;
  const scaffold = (framed || si === 5) && <Scaffold A={A} D={D} z0={z0} top={framed ? H : h} floorH={floorH} done={framed} />;

  const preSign = si >= 1 && si <= 2 && (() => {
    const p = iso(0, 0, -A - 8, D + 18);
    return <SignPost x={p.x} y={p.y} text={signText ?? label} />;
  })();

  const sign = hasWalls && (() => {
    const dp = iso(0, 0, 0, D, z0);
    const doorScreen = { x: dp.x, y: dp.y };
    const hung = h >= doorH + 34;
    const s = variant === 'lodge' ? 1 : 0.8;
    return hung ? (
      <g>
        <path d={`M${doorScreen.x - 12 * s},${doorScreen.y - doorH - 18 * s} L${doorScreen.x - 12 * s},${doorScreen.y - doorH - 30 * s}`} stroke={C('outline')} strokeWidth={1.2} />
        <path d={`M${doorScreen.x + 12 * s},${doorScreen.y - doorH - 18 * s} L${doorScreen.x + 12 * s},${doorScreen.y - doorH - 30 * s}`} stroke={C('outline')} strokeWidth={1.2} />
        <CarvedSign variant={variant} x={doorScreen.x} y={doorScreen.y - doorH - 14 * s - 2} scale={s} />
      </g>
    ) : (
      <g transform={`rotate(-6 ${doorScreen.x - 26} ${doorScreen.y + 14})`}>
        <CarvedSign variant={variant} x={doorScreen.x - 26} y={doorScreen.y + 12 - 14 * s} scale={s * 0.9} />
      </g>
    );
  })();

  const garden = variant === 'lodge';
  const mapTable = variant === 'workshop' && si >= 4 && (
    <g transform={`translate(${iso(0, 0, A - 6, D + 26).x} ${iso(0, 0, A - 6, D + 26).y})`}>
      <path d="M-16,0 L-14,-12 M16,0 L14,-12" stroke={C('wood-dark')} strokeWidth={2.6} strokeLinecap="round" />
      <polygon points="-20,-12 0,-22 20,-12 0,-2" fill={C('wood-light')} {...LINE} />
      <polygon points="-12,-12 0,-18 12,-12 0,-6" fill={C('parchment')} {...thin} />
      <path d="M-6,-12 L0,-14 L5,-11 M-3,-9 L3,-11" fill="none" stroke={C('c-teal')} strokeWidth={1.1} />
    </g>
  );
  const vane = variant === 'workshop' && hasRoof && <Vane at={iso(0, 0, -A + 12, 0, ridgeZ)} />;

  return (
    <g data-stage={stage}>
      <Scaled o={so}>
      <GroundShadow rx={A + D + 10} ry={(A + D) / 2 + 6} cy={0} cast={false} />
      <CastShadow foot={[iso(0, 0, -A - 3, D + 3), iso(0, 0, A + 3, D + 3), iso(0, 0, A + 3, -D - 3), iso(0, 0, -A - 3, -D - 3)]} h={Math.max(14, hasRoof ? ridgeZ * 0.9 : zt + 4)} />
      {earth}
      <BackOverlays geo={geo} signals={signals} fireworks={fireworks} />
      </Scaled>
      {garden && <GardenBack />}
      <Scaled o={so}>
      {plinth}
      {strings}
      {survey}
      {si >= 2 && si <= 3 && <Stakes A={A} D={D} strings={false} />}
      {frame}
      {walls}
      {stack}
      {gable}
      {roof}
      {bunting}
      {doorBanners}
      {vane}
      {scaffold}
      {blueprint}
      {inspectors}
      {mapTable}
      {sign}
      {preSign}
      </Scaled>
      {garden && <GardenFront />}
      <Scaled o={so}>
        <FrontOverlays geo={geo} signals={signals} needsYouCount={needsYouCount} />
      </Scaled>
    </g>
  );
}

function PlotWithShadow({
  variant,
  kind,
  text,
  signals,
  needsYouCount,
}: {
  variant: BuildingVariant;
  kind: 'brief' | 'unknown';
  text: string;
  signals: BuildingArtProps['signals'];
  needsYouCount?: number;
}): JSX.Element {
  const { A, D } = SPECS[variant];
  const geo: Geo = {
    chimney: null,
    top: { x: 0, y: -60 },
    bannerBase: iso(0, 0, -A - 12, D + 14),
    flagBase: iso(0, 0, A, 0),
    door: iso(0, 0, 0, D + 4),
    doorstep: iso(0, 0, 24, D + 12),
    fire: iso(0, 0, -A + 6, D + 28),
    vines: [
      { x: iso(0, 0, -A, D).x, y: iso(0, 0, -A, D).y, h: 24, lean: 0.03 },
      { x: iso(0, 0, A, D).x, y: iso(0, 0, A, D).y, h: 24, lean: -0.03 },
      { x: iso(0, 0, -A - 8, D + 18).x, y: iso(0, 0, -A - 8, D + 18).y, h: 40, lean: 0.02 },
    ],
    sky: [],
    width: 2 * (A + D),
  };
  return (
    <g data-stage={kind}>
      <Scaled o={scaleOrigin(variant)}>
        <BackOverlays geo={geo} signals={signals} />
        <Plot kind={kind} signText={text} A={A} D={D} />
        <FrontOverlays geo={geo} signals={signals} needsYouCount={needsYouCount} />
      </Scaled>
    </g>
  );
}

/* -------------------------------------------------------------- sub-parts */

function LadderAt({ at, h }: { at: Pt; h: number }): JSX.Element {
  return (
    <g transform={`translate(${at.x} ${at.y})`} stroke={C('wood-dark')} strokeLinecap="round">
      <line x1={-4} y1={0} x2={-2} y2={-h} strokeWidth={2.2} />
      <line x1={4} y1={0} x2={6} y2={-h} strokeWidth={2.2} />
      {Array.from({ length: Math.floor(h / 8) }, (_, i) => (
        <line key={i} x1={-3.6 + (i * 8 * 2) / h} y1={-(i + 1) * 8} x2={4.4 + (i * 8 * 2) / h} y2={-(i + 1) * 8} strokeWidth={1.6} />
      ))}
    </g>
  );
}

/** Log or plaster texture, floor beam and windows for a face drawn in flat local coords. */
function WallDetail({
  w,
  h,
  floorH,
  log,
  lit,
  variant,
  doorH,
  open,
  first,
  shadeFace,
}: {
  w: number;
  h: number;
  floorH: number;
  log: boolean;
  lit: boolean;
  variant: BuildingVariant;
  doorH: number;
  open: boolean;
  first: boolean;
  shadeFace?: boolean;
}): JSX.Element {
  void open;
  void doorH;
  const rows = Math.floor(h / 7);
  const floorsUp = Math.max(1, Math.ceil(h / floorH));
  const wins: Array<{ x: number; y: number }> = [];
  for (let f = 0; f < floorsUp; f++) {
    const cy = -(f * floorH + floorH * 0.58);
    if (h < f * floorH + floorH * 0.78) continue;
    let xs: number[];
    if (first) xs = f === 0 ? [w * 0.2, w * 0.8] : [w * 0.2, w * 0.5, w * 0.8];
    else xs = variant === 'lodge' ? [w * 0.18, w * 0.84] : [w * 0.8];
    for (const x of xs) wins.push({ x, y: cy });
  }
  return (
    <g>
      {log ? (
        <g stroke={C('wood-dark')} strokeOpacity={0.38} strokeWidth={1}>
          {Array.from({ length: rows }, (_, i) => (
            <path key={i} d={`M0,${-(i + 1) * 7} L${w},${-(i + 1) * 7}`} />
          ))}
        </g>
      ) : (
        <g>
          <path d={`M0,0 L0,${-h} M${w},0 L${w},${-h} M${w / 2},0 L${w / 2},${-h}`} stroke={C('wood')} strokeWidth={3} />
          <path d={`M0,${-h} L${w},${-h}`} stroke={C('wood')} strokeWidth={3} />
        </g>
      )}
      {Array.from({ length: Math.floor(h / floorH) }, (_, i) => (
        <path key={i} d={`M0,${-(i + 1) * floorH} L${w},${-(i + 1) * floorH}`} stroke={C('wood-dark')} strokeWidth={3} />
      ))}
      <path d={`M0,0 L0,${-h} M${w},0 L${w},${-h}`} stroke={C('wood-dark')} strokeWidth={3.4} />
      {wins.map((p, i) => (
        <Win key={i} x={p.x} y={p.y} lit={lit} shut={!(variant === 'workshop' && first)} />
      ))}
      {shadeFace && <rect x={0} y={-h} width={w} height={h} fill={C('shade')} style={SHADE_OPACITY} />}
    </g>
  );
}

function SurveyorsTent({ A, D }: { A: number; D: number }): JSX.Element {
  const p = iso(0, 0, A * 0.35, -D * 0.35);
  const t = iso(0, 0, -A * 0.55, D * 0.5);
  return (
    <g>
      <g transform={`translate(${p.x} ${p.y})`}>
        <ellipse cx={4} cy={2} rx={39.0} ry={9.1} fill="url(#va-g-contact)" />
        <polygon points="-24,0 -2,-34 -2,0" fill={C('canvas')} {...LINE} />
        <polygon points="-2,-34 24,-6 24,0 -2,0" fill={C('canvas')} {...LINE} />
        <polygon points="-2,-34 24,-6 24,0 -2,0" fill={C('shade')} style={SHADE_OPACITY} />
        <path d="M-24,0 L-2,-34 L-13,0 Z" fill={C('canvas-stripe')} />
        <path d="M-2,-34 L24,-6 L12,-1 Z" fill={C('canvas-stripe')} fillOpacity={0.85} />
        <path d="M-14,0 L-2,-22 L-2,0 Z" fill={C('outline')} fillOpacity={0.75} />
        <line x1={-2} y1={-34} x2={-2} y2={-42} stroke={C('wood-dark')} strokeWidth={2} />
        <path d="M-2,-42 L8,-39 L-2,-36 Z" fill={C('c-red')} {...thin} />
      </g>
      <g transform={`translate(${t.x} ${t.y})`}>
        <path d="M-7,0 L0,-14 L7,0 M0,-14 L0,0" fill="none" stroke={C('wood-dark')} strokeWidth={2} strokeLinecap="round" />
        <rect x={-5} y={-22} width={10} height={8} rx={1.5} fill={C('gold')} {...thin} />
        <circle cx={0} cy={-18} r={2.2} fill={C('c-cyan')} />
      </g>
    </g>
  );
}

/** Wooden posts and beams: the design-stage skeleton, also the growing top of a building stage wall. */
function TimberFrame({ A, D, z0, h, wallH, floorH }: { A: number; D: number; z0: number; h: number; wallH: number; floorH: number }): JSX.Element {
  const P = (a: number, b: number, z: number): Pt => iso(0, 0, a, b, z0 + z);
  const base = wallH;
  const out: ReactNode[] = [];
  // back posts + beams first
  out.push(<Beam key="pb" p={P(-A, -D, base)} q={P(-A, -D, h)} />);
  out.push(<Beam key="pr" p={P(A, -D, base)} q={P(A, -D, h)} />);
  out.push(<Beam key="tbr" p={P(-A, -D, h)} q={P(A, -D, h)} />);
  out.push(<Beam key="tbl" p={P(-A, -D, h)} q={P(-A, D, h)} />);
  // mid floor beams
  for (let f = 1; f * floorH < h; f++) {
    if (f * floorH <= base) continue;
    out.push(<Beam key={`fl${f}`} p={P(-A, D, f * floorH)} q={P(A, D, f * floorH)} w={3} />);
    out.push(<Beam key={`fr${f}`} p={P(A, D, f * floorH)} q={P(A, -D, f * floorH)} w={3} />);
  }
  // front posts
  for (const a of [-A, -A / 2, 0, A / 2, A]) out.push(<Beam key={`lp${a}`} p={P(a, D, base)} q={P(a, D, h)} w={a === -A || a === A ? 3.8 : 3} />);
  out.push(<Beam key="rp" p={P(A, 0, base)} q={P(A, 0, h)} w={3} />);
  out.push(<Beam key="rpb" p={P(A, -D, base)} q={P(A, -D, h)} w={3.8} />);
  out.push(<Beam key="tf" p={P(-A, D, h)} q={P(A, D, h)} />);
  out.push(<Beam key="tr" p={P(A, D, h)} q={P(A, -D, h)} />);
  // diagonal braces on the first bay of the lit face and on the right face
  out.push(<Beam key="b1" p={P(-A, D, base)} q={P(-A / 2, D, Math.min(h, base + floorH * 0.7))} w={2.4} />);
  out.push(<Beam key="b2" p={P(A, D, base)} q={P(A / 2, D, Math.min(h, base + floorH * 0.7))} w={2.4} />);
  return <g>{out}</g>;
}

/** Scaffolding in front of the lit face: poles, planked platforms, rails and a ladder. */
function Scaffold({ A, D, z0, top, floorH, done }: { A: number; D: number; z0: number; top: number; floorH: number; done: boolean }): JSX.Element {
  const b0 = D + 8;
  const b1 = D + 20;
  const P = (a: number, b: number, z: number): Pt => iso(0, 0, a, b, z0 + z);
  const poleTop = top + (done ? 14 : 18);
  const poles = [-A + 6, -A / 3, A / 3, A - 6];
  const levels: number[] = [];
  for (let z = floorH; z <= top + 0.5; z += floorH) levels.push(z);
  if (!done && levels[levels.length - 1] !== top) levels.push(top);
  return (
    <g>
      {poles.map((a) => (
        <g key={a} stroke={C('wood-dark')} strokeWidth={2.4} strokeLinecap="round">
          <line x1={P(a, b1, 0).x} y1={P(a, b1, 0).y} x2={P(a, b1, poleTop).x} y2={P(a, b1, poleTop).y} />
          <line x1={P(a, b0, 0).x} y1={P(a, b0, 0).y} x2={P(a, b0, poleTop).x} y2={P(a, b0, poleTop).y} />
        </g>
      ))}
      {levels.map((z) => (
        <g key={z}>
          <polygon points={pts(P(-A + 4, b0, z), P(A - 4, b0, z), P(A - 4, b1, z), P(-A + 4, b1, z))} fill={C('wood-light')} {...LINE} />
          <path d={`M${P(-A + 4, b1, z + 12).x},${P(-A + 4, b1, z + 12).y} L${P(A - 4, b1, z + 12).x},${P(A - 4, b1, z + 12).y}`} stroke={C('wood-dark')} strokeWidth={2} strokeLinecap="round" />
          <path d={`M${P(-A + 4, b1, z).x},${P(-A + 4, b1, z).y} L${P(A - 4, b1, z).x},${P(A - 4, b1, z).y}`} stroke={C('outline')} strokeWidth={0.9} strokeOpacity={0.5} />
        </g>
      ))}
      <path d={`M${P(-A + 6, b1, 0).x},${P(-A + 6, b1, 0).y} L${P(-A / 3, b1, floorH).x},${P(-A / 3, b1, floorH).y} M${P(-A / 3, b1, 0).x},${P(-A / 3, b1, 0).y} L${P(-A + 6, b1, floorH).x},${P(-A + 6, b1, floorH).y}`} stroke={C('wood-dark')} strokeWidth={1.6} />
      <LadderAt at={P(A - 16, b1 + 4, 0)} h={Math.min(top, floorH) + 4} />
      {!done && (
        <g transform={`translate(${P(-A / 3 + 4, (b0 + b1) / 2, top).x} ${P(-A / 3 + 4, (b0 + b1) / 2, top).y})`}>
          <Plank x={-9} y={-5} w={20} rot={-3} />
          <Plank x={-8} y={-9} w={18} rot={2} />
          <rect x={14} y={-12} width={11} height={11} fill={C('wood')} {...thin} />
          <path d="M14,-12 L25,-1 M25,-12 L14,-1" stroke={C('wood-dark')} strokeWidth={0.9} />
        </g>
      )}
    </g>
  );
}

/** Walled garden (lodge): a low stone wall closes the yard, with one locked gate in front of the door. */
const GARDEN = { cb: 26, A: 84, D: 62 };
function wallSeg(key: string, a0: number, a1: number, b0: number, b1: number, h = 15): JSX.Element {
  const ca = (a0 + a1) / 2;
  const cb = (b0 + b1) / 2;
  const c = iso(0, 0, ca, cb);
  return <Box key={key} cx={c.x} cy={c.y} A={Math.abs(a1 - a0) / 2} D={Math.abs(b1 - b0) / 2} h={h} left={C('stone-light')} right={C('stone')} top={C('stone-light')} />;
}
function GardenBack(): JSX.Element {
  const { cb, A, D } = GARDEN;
  const b0 = cb - D;
  return (
    <g>
      {wallSeg('bl', -A, A, b0 - 3, b0 + 3)}
      {wallSeg('bb', -A - 3, -A + 3, b0, cb + D)}
      <ellipse cx={iso(0, 0, 0, cb).x} cy={iso(0, 0, 0, cb).y + 2} rx={A + 8} ry={(A + D) / 2 - 6} fill={C('grass-3')} fillOpacity={0.35} />
    </g>
  );
}
function GardenFront(): JSX.Element {
  const { cb, A, D } = GARDEN;
  const bf = cb + D;
  const gl = iso(0, 0, -A, bf);
  return (
    <g>
      {wallSeg('fl1', -A, -13, bf - 3, bf + 3)}
      {wallSeg('fl2', 13, A, bf - 3, bf + 3)}
      {wallSeg('fr', A - 3, A + 3, cb - D, bf)}
      {/* gate: closed double door with a padlock, between two stone pillars */}
      <g transform={leftFaceTf(0, 0, A, bf)}>
        <rect x={A - 13} y={-20} width={26} height={20} fill={C('wood')} {...thin} />
        <path d={`M${A},-20 L${A},0 M${A - 8},-20 L${A - 8},0 M${A + 8},-20 L${A + 8},0`} stroke={C('wood-dark')} strokeWidth={0.9} />
        <rect x={A - 3.4} y={-12} width={6.8} height={6} rx={1} fill={C('gold')} {...thin} />
        <path d={`M${A - 2},-12 L${A - 2},-14.5 A2,2 0 0 1 ${A + 2},-14.5 L${A + 2},-12`} fill="none" stroke={C('gold-dark')} strokeWidth={1.4} />
      </g>
      <Box cx={iso(0, 0, -13, bf).x} cy={iso(0, 0, -13, bf).y} A={4} D={4.5} h={26} left={C('stone-light')} right={C('stone-dark')} top={C('stone')} />
      <Box cx={iso(0, 0, 13, bf).x} cy={iso(0, 0, 13, bf).y} A={4} D={4.5} h={26} left={C('stone-light')} right={C('stone-dark')} top={C('stone')} />
      <circle cx={gl.x} cy={gl.y} r={0} />
    </g>
  );
}
