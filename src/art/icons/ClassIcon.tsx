import type { ReactNode } from 'react';
import type { VillageClass } from '../../data/types';
import type { IconProps } from '../contract';

export interface ClassIconProps extends IconProps {
  villageClass: VillageClass;
}

const L = 'var(--va-text)'; // icon line colour: dark on light theme, light on dark theme

/** 24x24 glyphs. Each has a distinct SHAPE; colour is only a second cue. */
const GLYPHS: Record<VillageClass, ReactNode> = {
  // banner on a staff
  'guild-master': (
    <g>
      <path d="M6,2 L6,22" />
      <path d="M6,3 L19,3 L19,12 L12.5,9.5 L6,12 Z" fill="var(--va-c-purple)" />
    </g>
  ),
  // owl
  'wizard-scholar': (
    <g>
      <path d="M5,5 L8,8 L16,8 L19,5 L19,16 Q19,21 12,21 Q5,21 5,16 Z" fill="var(--va-c-blue)" />
      <circle cx={9} cy={12} r={2.6} fill="var(--va-c-cream)" />
      <circle cx={15} cy={12} r={2.6} fill="var(--va-c-cream)" />
      <path d="M11,15 L12,17 L13,15 Z" fill="var(--va-gold)" />
    </g>
  ),
  // compass
  cartographer: (
    <g>
      <circle cx={12} cy={12} r={9} fill="var(--va-c-teal)" />
      <path d="M12,5 L14.5,12 L12,19 L9.5,12 Z" fill="var(--va-c-cream)" />
    </g>
  ),
  // paint palette
  illusionist: (
    <g>
      <path d="M12,3 Q22,3 21,12 Q20,16 16,15 Q13,15 14,18 Q15,21 11,21 Q3,20 3,12 Q3,3 12,3 Z" fill="var(--va-c-magenta)" />
      <circle cx={8} cy={9} r={1.5} fill="var(--va-c-yellow)" />
      <circle cx={13} cy={7} r={1.5} fill="var(--va-c-cream)" />
      <circle cx={17} cy={10} r={1.5} fill="var(--va-c-cyan)" />
    </g>
  ),
  // wrench
  artificer: (
    <g>
      <path d="M17,3 Q21,4 20,8 L18,8 L16,6 L14,8 L16,10 L16,12 L7,21 L3,17 L12,8 Q12,4 17,3 Z" fill="var(--va-c-copper)" />
    </g>
  ),
  // hammer
  'dwarf-smith': (
    <g>
      <path d="M4,21 L13,10" strokeWidth={3} />
      <rect x={9} y={3} width={13} height={7} rx={1.5} transform="rotate(30 15 6)" fill="var(--va-c-red)" />
    </g>
  ),
  // anchor
  'harbor-master': (
    <g>
      <circle cx={12} cy={5} r={2.2} fill="var(--va-c-navy)" />
      <path d="M12,7 L12,20 M7,11 L17,11 M4,14 Q6,20 12,20 Q18,20 20,14" fill="none" strokeWidth={2.2} />
    </g>
  ),
  // shield
  paladin: (
    <g>
      <path d="M4,4 L20,4 L20,12 Q20,19 12,22 Q4,19 4,12 Z" fill="var(--va-c-steel)" />
      <path d="M12,6 L12,19 M7,10 L17,10" strokeWidth={2.2} stroke="var(--va-gold-dark)" />
    </g>
  ),
  // bow and arrow
  ranger: (
    <g>
      <path d="M7,3 Q22,12 7,21" fill="none" strokeWidth={2.4} stroke="var(--va-c-forest)" />
      <path d="M7,3 L7,21" strokeWidth={1} />
      <path d="M3,12 L19,12 M16,9 L19,12 L16,15" fill="none" />
    </g>
  ),
  // two masks (comedy/tragedy)
  'bard-troupe': (
    <g>
      <circle cx={9} cy={10} r={6} fill="var(--va-mask)" />
      <circle cx={16} cy={14} r={6} fill="var(--va-c-red)" />
      <path d="M6.5,9 L7.5,9 M10.5,9 L11.5,9" strokeWidth={1.6} />
    </g>
  ),
  // magic wand with star
  enchanter: (
    <g>
      <path d="M4,20 L14,10" strokeWidth={3} />
      <path d="M17,2 L18.6,6 L22.5,6.5 L19.4,9.2 L20.4,13 L17,10.8 L13.6,13 L14.6,9.2 L11.5,6.5 L15.4,6 Z" fill="var(--va-c-cyan)" />
    </g>
  ),
  // rune slab
  'rune-smith': (
    <g>
      <path d="M6,3 L18,3 L20,21 L4,21 Z" fill="var(--va-stone-light)" />
      <path d="M9,8 L15,8 L12,12 L12,18 M9,14 L15,14" fill="none" strokeWidth={2} stroke="var(--va-gold-dark)" />
    </g>
  ),
  // cog
  tinkerer: (
    <g>
      <circle cx={12} cy={12} r={6} fill="var(--va-c-orange)" strokeDasharray="0" />
      <path d="M12,2 L12,5 M12,19 L12,22 M2,12 L5,12 M19,12 L22,12 M5,5 L7,7 M17,17 L19,19 M19,5 L17,7 M5,19 L7,17" strokeWidth={3} />
      <circle cx={12} cy={12} r={2} fill="var(--va-surface)" />
    </g>
  ),
  // trumpet
  herald: (
    <g>
      <path d="M3,10 L12,10 L21,5 L21,19 L12,14 L3,14 Z" fill="var(--va-gold)" />
      <path d="M7,14 L8,19 L11,19 L11,14" fill="var(--va-c-red)" />
    </g>
  ),
  // sign board
  'sign-painter': (
    <g>
      <rect x={3} y={4} width={18} height={11} rx={1.5} fill="var(--va-sign)" />
      <path d="M12,15 L12,22 M7,8 L17,8 M7,11 L14,11" />
    </g>
  ),
  // jester hat
  jester: (
    <g>
      <path d="M3,18 L5,8 Q7,6 10,13 Q12,9 14,13 Q17,6 19,8 L21,18 Z" fill="var(--va-c-yellow)" />
      <circle cx={5} cy={7} r={2} fill="var(--va-c-red)" />
      <circle cx={19} cy={7} r={2} fill="var(--va-c-red)" />
      <circle cx={12} cy={9} r={2} fill="var(--va-c-red)" />
    </g>
  ),
  // sun / halo cross
  cleric: (
    <g>
      <circle cx={12} cy={12} r={5} fill="var(--va-gold)" />
      <path d="M12,2 L12,5 M12,19 L12,22 M2,12 L5,12 M19,12 L22,12 M5,5 L7,7 M17,17 L19,19 M19,5 L17,7 M5,19 L7,17" />
    </g>
  ),
  // padlock
  warden: (
    <g>
      <path d="M8,11 L8,7 A4,4 0 0 1 16,7 L16,11" fill="none" strokeWidth={2.2} />
      <rect x={5} y={11} width={14} height={10} rx={2} fill="var(--va-c-moss)" />
      <circle cx={12} cy={16} r={1.6} fill="var(--va-c-cream)" />
    </g>
  ),
  // walking cane + beard drop
  'elder-counselor': (
    <g>
      <path d="M8,21 L8,7 Q8,3 12,3 Q16,3 16,7" fill="none" strokeWidth={2.8} stroke="var(--va-c-brown)" />
      <path d="M13,10 L21,10 L17,20 Z" fill="var(--va-hair-white)" />
    </g>
  ),
  // leaf sprig
  healer: (
    <g>
      <path d="M12,21 L12,9" fill="none" strokeWidth={2} />
      <path d="M12,12 Q4,12 4,5 Q11,5 12,12 Z" fill="var(--va-c-forest)" />
      <path d="M12,9 Q20,9 20,2 Q13,2 12,9 Z" fill="var(--va-c-sage)" />
    </g>
  ),
  // open book
  teacher: (
    <g>
      <path d="M12,6 Q7,3 2,5 L2,19 Q7,17 12,20 Q17,17 22,19 L22,5 Q17,3 12,6 Z" fill="var(--va-c-burgundy)" />
      <path d="M12,6 L12,20" />
    </g>
  ),
  // hooded silhouette
  stranger: (
    <g>
      <path d="M12,2 Q19,3 19,12 L21,21 L3,21 L5,12 Q5,3 12,2 Z" fill="var(--va-c-grey)" />
      <ellipse cx={12} cy={11} rx={3.6} ry={4.4} fill="var(--va-outline)" />
    </g>
  ),
};

/** Small class icon for quest-board notes and lists. Decorative unless a title is given. */
export function ClassIcon({ villageClass, size = 20, title }: ClassIconProps): JSX.Element {
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
      stroke={L}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      {GLYPHS[villageClass]}
    </svg>
  );
}
