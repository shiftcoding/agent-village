import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';

/** Colour helper: v('wood') -> 'var(--va-wood)'. The only way art refers to colours. */
export const v = (name: string): string => `var(--va-${name})`;

/** Hand-painted look: warm brown outline, round joins. */
export const O = {
  stroke: 'var(--va-outline)',
  strokeWidth: 1.35,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

/** Soft shade overlay (lit from the top-left, so the right side is darker). */
export const shadeStyle: CSSProperties = { fillOpacity: 'var(--va-shade-opacity)' };

/** Reference to a shared def (see ArtDefs.tsx): g('g-cloth') -> 'url(#va-g-cloth)'. */
export const g = (id: string): string => `url(#va-${id})`;

/** Soft cloth folds: thin curved strokes in the shade colour. Very low contrast on purpose. */
const foldStyle = { stroke: 'var(--va-shade)', strokeOpacity: 0.3, strokeWidth: 0.9, fill: 'none', strokeLinecap: 'round' } as const;

/** True while drawing inside a mirrored (flip) figure; text-like details counter-mirror themselves with <Unflip>. */
export const FlipContext = createContext(false);

/** Draws its children un-mirrored inside a flipped figure (letters and glyphs must never read backwards). Children should be centred on x=0. */
export function Unflip({ children }: { children: ReactNode }): JSX.Element {
  const flipped = useContext(FlipContext);
  return <g transform={flipped ? 'scale(-1 1)' : undefined}>{children}</g>;
}

/**
 * One leg for the walk pose: pivots about the hip (x, y). Outside the walk pose it is a plain group,
 * so a still figure is drawn exactly as before. `side` a/b alternate (motion.css: va-leg-a, va-leg-b).
 */
export function Leg({ x, y, side, walk, children }: { x: number; y: number; side: 'a' | 'b'; walk?: boolean; children: ReactNode }): JSX.Element {
  if (!walk) return <g>{children}</g>;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`va-leg va-leg-${side}`}>
        <g transform={`translate(${-x} ${-y})`}>{children}</g>
      </g>
    </g>
  );
}

export interface Look {
  body: 'robe' | 'tunic' | 'armor';
  cloth: string;
  trim: string;
  pants?: string;
  skin?: string;
  hair?: string;
  scale?: [number, number];
  /** Class work animation (CSS class suffix, see motion.css). */
  anim: 'swing' | 'scribble' | 'aim' | 'wave' | 'bob' | 'paint' | 'toot' | 'tick';
  /** Lean in degrees (elder). */
  lean?: number;
  hair_?: ReactNode;
  hat?: ReactNode;
  face?: ReactNode;
  back?: ReactNode;
  front?: ReactNode;
  held?: ReactNode;
  off?: ReactNode;
  /** Replaces the face and hair entirely (stranger). */
  head?: ReactNode;
  /** Extra things standing beside the figure (tinkerer's automaton). */
  beside?: ReactNode;
  /** Replaces the body fill with two halves (jester). */
  split?: string;
}

/** Torso + legs per body type. cloth is the main colour var(--va-...). */
export function Torso({ look, walk, rightLegExtra }: { look: Look; walk?: boolean; rightLegExtra?: ReactNode }): JSX.Element {
  const { body, cloth, trim, pants = v('c-brown') } = look;
  if (body === 'robe') {
    return (
      <g>
        <Leg x={-5} y={-8} side="a" walk={walk}>
          <ellipse cx={-5} cy={-1} rx={4.5} ry={2.4} fill={v('wood-dark')} {...O} />
        </Leg>
        <Leg x={5} y={-8} side="b" walk={walk}>
          <ellipse cx={5} cy={-1} rx={4.5} ry={2.4} fill={v('wood-dark')} {...O} />
          {rightLegExtra}
        </Leg>
        <path d="M-9,-41 Q0,-45 9,-41 L15,-3 Q0,3 -15,-3 Z" fill={cloth} {...O} />
        <path d="M-9,-41 L-15,-3 L-10,-3 L-5,-41 Z" fill={v('highlight')} fillOpacity={0.2} />
        <path d="M3,-43 L9,-41 L15,-3 Q8,2 5,1 Z" fill={v('shade')} style={shadeStyle} />
        <path d="M-9,-41 Q0,-45 9,-41 L15,-3 Q0,3 -15,-3 Z" fill={g('g-cloth')} />
        <path d="M-5,-2 Q-6.5,-18 -4.5,-33 M1.5,-1 Q3,-16 1,-30 M8.5,-2 Q10,-16 7,-30" {...foldStyle} />
        <path d="M-4,-41.5 Q0,-36 4,-41.5" fill="none" stroke={trim} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M-15,-3 Q0,3 15,-3" fill="none" stroke={trim} strokeWidth={2.2} strokeLinecap="round" />
        <rect x={-9.5} y={-26} width={19} height={2.6} fill={trim} fillOpacity={0.9} />
      </g>
    );
  }
  const torso = body === 'armor' ? v('c-steel') : cloth;
  return (
    <g>
      <Leg x={-4.3} y={-20} side="a" walk={walk}>
        <rect x={-7.5} y={-20} width={6.4} height={17} fill={pants} {...O} />
        <rect x={-7.5} y={-20} width={6.4} height={17} fill={g('g-cloth')} />
        <rect x={-8.2} y={-4.5} width={7.6} height={4.5} rx={1.5} fill={v('wood-dark')} {...O} />
      </Leg>
      <Leg x={4.3} y={-20} side="b" walk={walk}>
        <rect x={1.1} y={-20} width={6.4} height={17} fill={pants} {...O} />
        <rect x={1.1} y={-20} width={6.4} height={17} fill={g('g-cloth')} />
        <rect x={0.6} y={-4.5} width={7.6} height={4.5} rx={1.5} fill={v('wood-dark')} {...O} />
        {rightLegExtra}
      </Leg>
      <path d="M-9,-41 Q0,-45 9,-41 L10.5,-18 L-10.5,-18 Z" fill={torso} {...O} />
      <path d="M-9,-41 L-10.5,-18 L-6,-18 L-5,-41 Z" fill={v('highlight')} fillOpacity={0.22} />
      <path d="M3,-43 L9,-41 L10.5,-18 L4,-18 Z" fill={v('shade')} style={shadeStyle} />
      <path d="M-9,-41 Q0,-45 9,-41 L10.5,-18 L-10.5,-18 Z" fill={g('g-cloth')} />
      {body === 'armor' ? (
        <path d="M-9.5,-33 Q0,-30 9.5,-33 M0,-41 L0,-23" {...foldStyle} />
      ) : (
        <path d="M-6,-35 Q-3,-29 -5.5,-23 M5,-36 Q3.5,-30 6,-24 M-3,-33 Q0,-30 3,-33" {...foldStyle} />
      )}
      <path d="M-4,-41.5 Q0,-37 4,-41.5" fill="none" stroke={trim} strokeWidth={1.4} strokeLinecap="round" />
      <rect x={-10.5} y={-22} width={21} height={3.4} fill={body === 'armor' ? v('c-steel-dark') : v('wood-dark')} {...O} />
      <rect x={-2} y={-22.2} width={4} height={3.8} rx={0.8} fill={trim} {...O} strokeWidth={0.7} />
    </g>
  );
}

/** One arm: dark outline stroke, then the sleeve colour on top, then a hand. */
export function Arm({
  from,
  to,
  sleeve,
  skin,
}: {
  from: [number, number];
  to: [number, number];
  sleeve: string;
  skin: string;
}): JSX.Element {
  const mx = (from[0] + to[0]) / 2 + (to[0] > from[0] ? 2 : -2);
  const my = (from[1] + to[1]) / 2 + 1;
  const d = `M${from[0]},${from[1]} Q${mx},${my} ${to[0]},${to[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke="var(--va-outline)" strokeWidth={5.4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={sleeve} strokeWidth={3.7} strokeLinecap="round" />
      <path d={d} fill="none" stroke="var(--va-highlight)" strokeOpacity={0.22} strokeWidth={1} strokeLinecap="round" transform="translate(-0.9 -0.9)" />
      <circle cx={to[0]} cy={to[1]} r={2.5} fill={skin} {...O} strokeWidth={0.8} />
      <circle cx={to[0]} cy={to[1]} r={2.5} fill={g('g-sphere')} />
    </g>
  );
}

/** Round head: ears, volume, cheeks, eyes with a catch-light, brows, a hint of nose and a small mouth. */
export function Face({ skin }: { skin: string }): JSX.Element {
  return (
    <g>
      <circle cx={-8.5} cy={-49.5} r={1.9} fill={skin} {...O} strokeWidth={0.8} />
      <circle cx={8.5} cy={-49.5} r={1.9} fill={skin} {...O} strokeWidth={0.8} />
      <circle cx={0} cy={-50} r={8.6} fill={skin} {...O} />
      <circle cx={0} cy={-50} r={8.6} fill={g('g-sphere')} />
      <path d="M-8.4,-52 A8.6,8.6 0 0 1 -2,-58.2 Q-6,-54 -5,-44 Z" fill={v('highlight')} fillOpacity={0.2} />
      <ellipse cx={-5.1} cy={-47} rx={2} ry={1.3} fill={v('blush')} fillOpacity={0.42} />
      <ellipse cx={5.1} cy={-47} rx={2} ry={1.3} fill={v('blush')} fillOpacity={0.42} />
      <ellipse cx={-3.2} cy={-50.4} rx={1.55} ry={1.75} fill={v('mask')} />
      <ellipse cx={3.2} cy={-50.4} rx={1.55} ry={1.75} fill={v('mask')} />
      <circle cx={-3} cy={-50.2} r={1.05} fill={v('outline')} />
      <circle cx={3.4} cy={-50.2} r={1.05} fill={v('outline')} />
      <circle cx={-3.35} cy={-50.75} r={0.38} fill={v('highlight')} />
      <circle cx={3.05} cy={-50.75} r={0.38} fill={v('highlight')} />
      <path d="M-5.2,-53.3 Q-3.4,-54.5 -1.6,-53.5 M1.6,-53.5 Q3.4,-54.5 5.2,-53.3" fill="none" stroke="var(--va-outline)" strokeOpacity={0.7} strokeWidth={0.75} strokeLinecap="round" />
      <path d="M0.3,-49.4 Q1.1,-48 -0.2,-47.7" fill="none" stroke="var(--va-shade)" strokeOpacity={0.35} strokeWidth={0.7} strokeLinecap="round" />
      <path d="M-2.2,-46.2 Q0,-44.4 2.2,-46.2" fill="none" stroke="var(--va-outline)" strokeWidth={0.9} strokeLinecap="round" />
    </g>
  );
}

/** Generic hair cap behind a hat or alone. */
export function Hair({ colour }: { colour: string }): JSX.Element {
  return (
    <g>
      <path d="M-9,-49 A9,9 0 0 1 9,-49 Q5,-55.5 0,-55 Q-5,-55.5 -9,-49 Z" fill={colour} {...O} strokeWidth={0.9} />
      <path d="M-6,-55 Q-8,-52.5 -8,-50.5 M-2.5,-56.4 Q-4.5,-54 -4.6,-52" fill="none" stroke={v('highlight')} strokeOpacity={0.35} strokeWidth={1} strokeLinecap="round" />
      <path d="M3,-55.4 Q6.5,-53.5 7,-50" fill="none" stroke={v('shade')} strokeOpacity={0.3} strokeWidth={1} strokeLinecap="round" />
    </g>
  );
}

/** Cog with teeth, drawn at 0,0, r = radius. */
export function Cog({ r, fill }: { r: number; fill: string }): JSX.Element {
  const circ = 2 * Math.PI * r;
  const teeth = Math.round(circ / 3.4);
  return (
    <g>
      <circle r={r} fill="none" stroke="var(--va-outline)" strokeWidth={2.6} strokeDasharray={`${circ / teeth / 1.9} ${circ / teeth - circ / teeth / 1.9}`} />
      <circle r={r} fill={fill} {...O} strokeWidth={0.9} />
      <circle r={r * 0.32} fill="var(--va-outline)" />
    </g>
  );
}
