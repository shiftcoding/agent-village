import type { ReactNode } from 'react';
import type { DayPart, DayPartIconProps } from '../contract';

const LINE = 'var(--va-text)';

const sun = (cx: number, cy: number, r: number, rays: number, from = 0, to = Math.PI * 2): ReactNode => (
  <g strokeWidth={1.8}>
    {Array.from({ length: rays }, (_, k) => {
      const a = from + (rays === 1 ? 0 : (k / (rays - 1)) * (to - from));
      return <line key={k} x1={cx + Math.cos(a) * (r + 2.4)} y1={cy + Math.sin(a) * (r + 2.4)} x2={cx + Math.cos(a) * (r + 5.4)} y2={cy + Math.sin(a) * (r + 5.4)} />;
    })}
  </g>
);

/** 24x24 glyphs. Four distinct shapes: low sun with an up arrow (dawn), full sun with rays (day), half sun on a line with a down arrow (dusk), crescent with a star (night). */
const GLYPHS: Record<DayPart, ReactNode> = {
  dawn: (
    <g>
      <path d="M2,18 L22,18" />
      <path d="M6.5,18 A5.5,5.5 0 0 1 17.5,18 Z" fill="var(--va-sig-active)" />
      {sun(12, 18, 5.5, 5, Math.PI * 1.12, Math.PI * 1.88)}
      <path d="M12,4.2 L12,8.6 M10,6.2 L12,4.2 L14,6.2" strokeWidth={1.6} />
    </g>
  ),
  day: (
    <g>
      <circle cx={12} cy={12} r={4.6} fill="var(--va-gold)" />
      {sun(12, 12, 4.6, 8)}
    </g>
  ),
  dusk: (
    <g>
      <path d="M2,18 L22,18" />
      <path d="M6.5,18 A5.5,5.5 0 0 1 17.5,18 Z" fill="var(--va-sig-needs)" />
      {sun(12, 18, 5.5, 5, Math.PI * 1.12, Math.PI * 1.88)}
      <path d="M12,3.6 L12,8 M10,6 L12,8 L14,6" strokeWidth={1.6} />
      <path d="M5,21.4 L19,21.4" strokeWidth={1.2} />
    </g>
  ),
  night: (
    <g>
      <path d="M16.5,3.6 A8.4,8.4 0 1 0 20.4,15.6 A7,7 0 0 1 16.5,3.6 Z" fill="var(--va-sig-review)" />
      <path d="M19,4 L19,8 M17,6 L21,6" strokeWidth={1.4} />
    </g>
  ),
};

/**
 * Time-of-day glyph (dawn, day, dusk, night). Decorative (aria-hidden) unless a title is passed; the UI always
 * pairs it with the part's name as text, so the icon is never the only cue.
 */
export function DayPartIcon({ kind, size = 20, title }: DayPartIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      fill="none"
      stroke={LINE}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      {GLYPHS[kind]}
    </svg>
  );
}
