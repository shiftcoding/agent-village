import type { CSSProperties } from 'react';
import { C, LINE } from './iso';

const thin = { ...LINE, strokeWidth: 0.9 } as const;

/**
 * Opacity driven by the day-part token --va-lamp (0 by day and dawn, 0.8 at dusk, 1 at night; tokens.css).
 * No JS: the UI only sets [data-daypart] on the scene wrapper and CSS does the rest (smoothly, via @property).
 */
export const LAMP_STYLE: CSSProperties = { opacity: 'var(--va-lamp)' };

/**
 * A lamp-lit pane laid over an unlit window: a soft glow and the lit glass. Civic buildings only (town hall,
 * tavern, gatehouse): lit windows on a PROJECT building mean "Active", so they never follow the clock.
 * (x, y) is the window centre in the parent's coordinates; the parent may be a skewed face group.
 */
export function LitPane({ x, y, w, h, glow = true }: { x: number; y: number; w: number; h: number; glow?: boolean }): JSX.Element {
  return (
    <g style={LAMP_STYLE} aria-hidden="true">
      {glow && <rect x={x - w / 2 - 2.6} y={y - h / 2 - 2.6} width={w + 5.2} height={h + 5.2} rx={3} fill={C('glow')} fillOpacity={0.35} />}
      <rect className="va-window-lit" x={x - w / 2} y={y - h / 2} width={w} height={h} fill={C('window-lit')} />
    </g>
  );
}

/**
 * Lantern post, local origin at the foot of the post (~50 tall). By day it is an unlit post; at dusk and night
 * the lamp lights and a soft pool of light spreads on the ground (tokens --va-lamp, --va-glow, --va-window-lit).
 * Ground draws one at each LANTERN_SPOTS entry.
 */
export function Lantern(): JSX.Element {
  return (
    <g aria-hidden="true">
      {/* light pool on the ground and halo around the lamp */}
      <g style={LAMP_STYLE}>
        <ellipse cx={0} cy={2} rx={52} ry={24} fill="url(#va-g-lampglow)" />
        <circle cx={0} cy={-44} r={26} fill="url(#va-g-lampglow)" />
      </g>
      <ellipse cx={4} cy={1.6} rx={11} ry={3.4} fill="url(#va-g-contact)" />
      <rect x={-3} y={-40} width={6} height={40} rx={1.6} fill={C('wood-dark')} {...thin} />
      <path d="M-5,0 L5,0 L3.4,-7 L-3.4,-7 Z" fill={C('stone')} {...thin} />
      <path d="M0,-38 L0,-48" stroke={C('outline')} strokeWidth={1.4} />
      {/* lamp house */}
      <path d="M-6.5,-45 L-5,-55 L5,-55 L6.5,-45 Z" fill={C('window')} {...thin} />
      <path d="M-6.5,-45 L-5,-55 L5,-55 L6.5,-45 Z" style={LAMP_STYLE} fill={C('window-lit')} />
      <path d="M-5,-54 L5,-54 L0,-61 Z" fill={C('roof-dark')} {...thin} />
      <rect x={-7} y={-46} width={14} height={2.6} rx={1} fill={C('wood-dark')} {...thin} />
      <path d="M0,-55 L0,-46" stroke={C('wood-dark')} strokeWidth={0.9} />
    </g>
  );
}
