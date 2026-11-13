import type { ReactNode } from 'react';
import type { IconProps, SignalIconKind } from '../contract';

export interface SignalIconProps extends IconProps {
  kind: SignalIconKind;
}

const c = (name: string): string => `var(--va-sig-${name})`;
const LINE = 'var(--va-text)';

/** "!" built from shapes (no font needed). */
const Bang = ({ x = 12, y = 0, fill = 'var(--va-surface)' }: { x?: number; y?: number; fill?: string }) => (
  <g fill={fill} stroke="none">
    <rect x={x - 1.6} y={y + 6} width={3.2} height={7} rx={1.4} />
    <circle cx={x} cy={y + 16} r={1.9} />
  </g>
);

/**
 * 24x24 signal glyphs. Each is a distinct SHAPE (chimney+smoke, banner, storm cloud, mask,
 * vine, flag, hammer, scroll, octagon, note, mug, hood, stake, signpost). The fill colour comes
 * from --va-sig-* (>= 3:1 on the UI surfaces in both themes, see docs/design.md); the outline
 * uses --va-text so the shape also holds up where the fill is close to the background.
 */
const GLYPHS: Record<SignalIconKind, ReactNode> = {
  // chimney with rising smoke
  active: (
    <g>
      <path d="M7,21 L7,12 L16,12 L16,21 Z" fill={c('active')} />
      <path d="M5,12 L18,12" strokeWidth={2.4} />
      <path d="M10,9 Q7,6 10,4 Q13,2 11,0.5 M15,9 Q12,6 15,4" fill="none" strokeWidth={1.6} />
    </g>
  ),
  // roof banner with "!"
  'needs-you': (
    <g>
      <path d="M5,2 L5,22" />
      <path d="M5,3 L20,3 L20,16 L12.5,13 L5,16 Z" fill={c('needs')} />
      <Bang x={12.5} y={-1} />
    </g>
  ),
  // storm cloud with bolt
  failing: (
    <g>
      <path d="M6,15 Q2,15 3,11 Q4,8 8,9 Q9,4 14,5 Q19,5 19,10 Q23,10 22,14 Q21,15 19,15 Z" fill={c('failing')} />
      <path d="M13,14 L9,20 L12,20 L10,24 L16,17 L13,17 L15,14 Z" fill="var(--va-lightning)" strokeWidth={1.1} />
    </g>
  ),
  // comedy/tragedy mask with frown
  friction: (
    <g>
      <path d="M4,5 Q12,2 20,5 L20,13 Q20,21 12,22 Q4,21 4,13 Z" fill={c('friction')} />
      <path d="M7.5,10 Q9,8.5 10.5,10 M13.5,10 Q15,8.5 16.5,10" fill="none" stroke="var(--va-surface)" strokeWidth={1.8} />
      <path d="M8,18 Q12,14 16,18" fill="none" stroke="var(--va-surface)" strokeWidth={1.8} />
    </g>
  ),
  // creeping vine
  stale: (
    <g>
      <path d="M4,21 Q4,13 11,13 Q18,13 17,6 Q17,4 19,3" fill="none" strokeWidth={2.2} />
      <path d="M7,17 Q2,17 3,12 Q8,12 7,17 Z" fill={c('stale')} />
      <path d="M11,13 Q8,8 12,5 Q15,8 11,13 Z" fill={c('stale')} />
      <path d="M17,7 Q22,8 21,13 Q16,12 17,7 Z" fill={c('stale')} />
    </g>
  ),
  // flying flag
  released: (
    <g>
      <path d="M5,2 L5,22" strokeWidth={2} />
      <path d="M5,3 Q10,1 13,4 T21,4 L21,13 Q17,15 13,12 T5,14 Z" fill={c('released')} />
    </g>
  ),
  // hammer
  doing: (
    <g>
      <path d="M5,21 L14,11" strokeWidth={3.2} stroke={LINE} />
      <path d="M5,21 L14,11" strokeWidth={1.6} stroke={c('doing')} />
      <rect x={9.5} y={3} width={12} height={7} rx={1.5} transform="rotate(35 15 6.5)" fill={c('doing')} />
    </g>
  ),
  // rolled scroll
  review: (
    <g>
      <path d="M7,4 L19,4 L19,18 Q19,21 16,21 L6,21 Q9,19 9,16 L9,6 Q9,4 7,4 Z" fill={c('review')} />
      <path d="M6,4 Q4,4 4,6 Q4,8 6,8 L9,8" fill="none" />
      <path d="M12,9 L17,9 M12,12.5 L17,12.5 M12,16 L15,16" stroke="var(--va-surface)" strokeWidth={1.4} />
    </g>
  ),
  // octagon stop with "!"
  blocked: (
    <g>
      <path d="M8,2 L16,2 L22,8 L22,16 L16,22 L8,22 L2,16 L2,8 Z" fill={c('blocked')} />
      <Bang x={12} y={0.5} />
    </g>
  ),
  // pinned note
  todo: (
    <g>
      <path d="M4,4 L20,4 L20,16 L14,21 L4,21 Z" fill={c('todo')} />
      <path d="M14,21 L14,16 L20,16" fill="var(--va-surface-2)" />
      <circle cx={12} cy={6.5} r={1.8} fill="var(--va-c-red)" />
      <path d="M7,11 L17,11 M7,14.5 L12,14.5" stroke="var(--va-surface)" strokeWidth={1.4} />
    </g>
  ),
  // mug with steam
  idle: (
    <g>
      <path d="M5,9 L17,9 L16,19 Q16,21 14,21 L8,21 Q6,21 6,19 Z" fill={c('idle')} />
      <path d="M17,11 Q22,11 21,15 Q20,18 16.5,17" fill="none" strokeWidth={1.8} />
      <path d="M9,6 Q8,4 10,3 M13,6 Q12,4 14,3" fill="none" strokeWidth={1.4} />
    </g>
  ),
  // hooded figure with a "?"
  stranger: (
    <g>
      <path d="M12,2 Q19,3 19,12 L22,22 L2,22 L5,12 Q5,3 12,2 Z" fill={c('stranger')} />
      <ellipse cx={12} cy={11} rx={4} ry={4.8} fill="var(--va-surface)" stroke="none" />
      <path d="M10,9.5 Q10,7.5 12,7.5 Q14,7.5 14,9.5 Q14,11 12,11.5 L12,12.8" fill="none" strokeWidth={1.5} />
      <circle cx={12} cy={14.8} r={0.9} fill={LINE} stroke="none" />
    </g>
  ),
  // stake in the ground with a tag
  'no-folder': (
    <g>
      <path d="M11,3 L13,3 L13,18 L12,22 L11,18 Z" fill={c('nofolder')} />
      <path d="M13,5 L21,5 L21,11 L13,11" fill="var(--va-surface-2)" />
      <path d="M2,20 L9,20 M15,20 L22,20" strokeWidth={1.8} />
    </g>
  ),
  // signpost with two arrows
  'no-progress': (
    <g>
      <path d="M11,2 L13,2 L13,22 L11,22 Z" fill={c('noprogress')} />
      <path d="M13,4 L21,4 L23,6.5 L21,9 L13,9 Z" fill={c('noprogress')} />
      <path d="M11,11 L3,11 L1,13.5 L3,16 L11,16 Z" fill="var(--va-surface-2)" />
    </g>
  ),
};

/** One icon per signal. Decorative (aria-hidden) unless a title is passed; the UI always adds a text label. */
export function SignalIcon({ kind, size = 20, title }: SignalIconProps): JSX.Element {
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
