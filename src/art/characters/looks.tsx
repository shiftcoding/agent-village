import type { VillageClass } from '../../data/types';
import { Cog, Hair, O, Unflip, v, type Look } from './parts';

const thin = { ...O, strokeWidth: 0.8 } as const;

/** Small star used as a sparkle tip. */
const Star = ({ r = 4, fill = v('gold') }: { r?: number; fill?: string }) => (
  <path
    d={`M0,${-r} L${r * 0.3},${-r * 0.3} L${r},0 L${r * 0.3},${r * 0.3} L0,${r} L${-r * 0.3},${r * 0.3} L${-r},0 L${-r * 0.3},${-r * 0.3} Z`}
    fill={fill}
    {...thin}
  />
);

const Scroll = ({ rot = 0 }: { rot?: number }) => (
  <g transform={`rotate(${rot})`}>
    <rect x={-8} y={-3} width={16} height={6} rx={3} fill={v('parchment')} {...thin} />
    <circle cx={-8} cy={0} r={3} fill={v('parchment')} {...thin} />
    <path d="M-2,-3 L-2,3 M2,-3 L2,3" stroke={v('c-red')} strokeWidth={1.4} />
  </g>
);

const Book = ({ cover, w = 10, h = 13 }: { cover: string; w?: number; h?: number }) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={1} fill={cover} {...thin} />
    <rect x={-w / 2 + 1.4} y={-h / 2 + 1.6} width={w - 2.8} height={2} fill={v('gold')} />
    <path d={`M${-w / 2},${h / 2 - 1.6} L${w / 2},${h / 2 - 1.6}`} stroke={v('parchment')} strokeWidth={1.2} />
  </g>
);

const Hammer = ({ head = v('c-steel-dark'), big = false }: { head?: string; big?: boolean }) => (
  <g transform={big ? 'scale(1.25)' : undefined}>
    <rect x={-1.3} y={-16} width={2.6} height={22} rx={1} fill={v('wood')} {...thin} />
    <rect x={-6.5} y={-21} width={13} height={7} rx={1.4} fill={head} {...thin} />
    <rect x={-6.5} y={-21} width={4} height={7} rx={1.4} fill={v('highlight')} fillOpacity={0.3} />
  </g>
);

const Staff = ({ h = 56, top }: { h?: number; top?: JSX.Element }) => (
  <g>
    <rect x={-1.3} y={-h + 22} width={2.6} height={h} rx={1.2} fill={v('wood')} {...thin} />
    {top && <g transform={`translate(0 ${-h + 22})`}>{top}</g>}
  </g>
);

const Beard = ({ colour, long = 8 }: { colour: string; long?: number }) => (
  <path
    d={`M-8,-50 Q-9,-${44 - long} 0,-${40 - long} Q9,-${44 - long} 8,-50 Q5,-45 0,-45.5 Q-5,-45 -8,-50 Z`}
    fill={colour}
    {...thin}
  />
);

const Mask = ({ colour = v('mask') }: { colour?: string }) => (
  <g>
    <path d="M-8.4,-52.5 Q0,-55.5 8.4,-52.5 L7.5,-47 Q0,-45 -7.5,-47 Z" fill={colour} {...thin} />
    <ellipse cx={-3.2} cy={-50.4} rx={1.7} ry={1.1} fill={v('outline')} />
    <ellipse cx={3.2} cy={-50.4} rx={1.7} ry={1.1} fill={v('outline')} />
  </g>
);

export const LOOKS: Record<VillageClass, Look> = {
  // Purple robe, ledger, banner staff. Tallest silhouette: staff with banner.
  'guild-master': {
    body: 'robe',
    cloth: v('c-purple'),
    trim: v('gold'),
    hair: v('hair-white'),
    anim: 'wave',
    face: <Beard colour={v('hair-white')} long={2} />,
    hat: (
      <g>
        <Hair colour={v('hair-white')} />
        <path d="M-7,-57 L-7,-62 L-3.5,-58.5 L0,-63 L3.5,-58.5 L7,-62 L7,-57 Z" fill={v('gold')} {...thin} />
      </g>
    ),
    front: <path d="M-8,-40 L9,-14" stroke={v('gold')} strokeWidth={3} strokeLinecap="round" />,
    off: <Book cover={v('c-purple-dark')} />,
    held: (
      <g>
        <Staff
          h={70}
          top={
            <g>
              <path d="M1.3,2 L18,2 L18,22 L9.6,17 L1.3,22 Z" fill={v('c-purple-dark')} {...thin} />
              <g transform="translate(9.6 10)">
                <Star r={4} />
              </g>
            </g>
          }
        />
      </g>
    ),
  },

  // Blue robe, owl, scrolls. Tall pointed hat.
  'wizard-scholar': {
    body: 'robe',
    cloth: v('c-blue'),
    trim: v('gold'),
    hair: v('hair-white'),
    anim: 'bob',
    face: <Beard colour={v('hair-white')} long={4} />,
    hat: (
      <g>
        <path d="M-10,-56 Q0,-62 10,-56 L1,-88 Q-1,-72 -10,-56 Z" fill={v('c-blue')} {...O} />
        <path d="M-12,-56 Q0,-61 12,-56 Q0,-52 -12,-56 Z" fill={v('c-navy')} {...O} />
        <g transform="translate(-1.5 -68)">
          <Star r={2.6} />
        </g>
        <g transform="translate(3 -60)">
          <Star r={2} />
        </g>
      </g>
    ),
    back: (
      <g transform="translate(-16 -44)">
        <ellipse rx={5} ry={6.5} fill={v('c-brown')} {...thin} />
        <ellipse cx={0} cy={1.5} rx={3} ry={4} fill={v('c-cream')} />
        <circle cx={-2} cy={-3} r={1.9} fill={v('gold')} />
        <circle cx={2} cy={-3} r={1.9} fill={v('gold')} />
        <path d="M-4,-6 L-5,-10 L-1,-7 M4,-6 L5,-10 L1,-7" fill={v('c-brown')} {...thin} />
      </g>
    ),
    held: <Scroll rot={-30} />,
    off: <Scroll rot={20} />,
  },

  // Map case, quill, compass.
  cartographer: {
    body: 'tunic',
    cloth: v('c-teal'),
    trim: v('gold'),
    pants: v('c-brown'),
    hair: v('hair-brown'),
    anim: 'scribble',
    hat: (
      <g>
        <Hair colour={v('hair-brown')} />
        <ellipse cx={0} cy={-56} rx={11.5} ry={3.4} fill={v('c-brown')} {...thin} />
        <path d="M-7,-56 Q0,-64 7,-56 Z" fill={v('c-brown')} {...thin} />
        <path d="M6,-59 Q14,-68 12,-52" fill="none" stroke={v('c-red')} strokeWidth={1.8} strokeLinecap="round" />
      </g>
    ),
    back: (
      <g transform="translate(-9 -40) rotate(-35)">
        <rect x={-3.2} y={-14} width={6.4} height={26} rx={3} fill={v('c-cream')} {...thin} />
        <rect x={-3.2} y={-14} width={6.4} height={4} rx={2} fill={v('c-brown')} {...thin} />
        <rect x={-3.2} y={8} width={6.4} height={4} rx={2} fill={v('c-brown')} {...thin} />
      </g>
    ),
    front: (
      <g transform="translate(-7 -17)">
        <circle r={3.6} fill={v('gold')} {...thin} />
        <path d="M0,-2.6 L1,0 L0,2.6 L-1,0 Z" fill={v('c-red')} />
      </g>
    ),
    held: (
      <g>
        <path d="M0,2 L2,-14 Q8,-22 7,-12 Q4,-4 0,2 Z" fill={v('c-cream')} {...thin} />
        <path d="M0,2 L-1,6" stroke={v('outline')} strokeWidth={1} />
      </g>
    ),
  },

  // Paint palette, glowing sketches.
  illusionist: {
    body: 'robe',
    cloth: v('c-magenta'),
    trim: v('gold'),
    hair: v('hair-dark'),
    anim: 'paint',
    hat: (
      <g>
        <Hair colour={v('hair-dark')} />
        <ellipse cx={-1} cy={-57} rx={11} ry={4.6} transform="rotate(-10 -1 -57)" fill={v('c-magenta')} {...O} />
        <circle cx={-2} cy={-62} r={1.5} fill={v('c-magenta')} {...thin} />
      </g>
    ),
    off: (
      <g transform="rotate(-15)">
        <path d="M-9,-3 Q-12,-10 -3,-11 Q8,-12 10,-3 Q10,5 1,4 Q-3,2 -9,-3 Z" fill={v('wood-light')} {...thin} />
        <circle cx={-4} cy={-6} r={1.8} fill={v('c-red')} />
        <circle cx={1} cy={-8} r={1.8} fill={v('c-yellow')} />
        <circle cx={6} cy={-5} r={1.8} fill={v('c-cyan')} />
        <circle cx={3} cy={0} r={1.8} fill={v('c-forest')} />
      </g>
    ),
    held: (
      <g>
        <rect x={-0.9} y={-14} width={1.8} height={16} fill={v('wood')} {...thin} />
        <path d="M-1.8,-14 L0,-19 L1.8,-14 Z" fill={v('alert-glow')} {...thin} />
      </g>
    ),
    beside: (
      <g transform="translate(19 -62)">
        <circle r={9} fill={v('alert-glow')} fillOpacity={0.35} />
        <rect x={-6} y={-6} width={12} height={12} rx={1.5} fill={v('parchment')} {...thin} />
        <path d="M-4,3 Q-1,-5 1,0 T4,-3" fill="none" stroke={v('c-magenta')} strokeWidth={1.3} />
      </g>
    ),
  },

  // Goggles, clockwork tools.
  artificer: {
    body: 'tunic',
    cloth: v('c-copper'),
    trim: v('gold'),
    pants: v('c-navy'),
    hair: v('hair-red'),
    anim: 'swing',
    hat: (
      <g>
        <Hair colour={v('hair-red')} />
        <path d="M-9,-55 L9,-55" stroke={v('wood-dark')} strokeWidth={2.2} />
        <circle cx={-4} cy={-56} r={3.8} fill={v('gold')} {...thin} />
        <circle cx={4} cy={-56} r={3.8} fill={v('gold')} {...thin} />
        <circle cx={-4} cy={-56} r={2.3} fill={v('c-cyan')} />
        <circle cx={4} cy={-56} r={2.3} fill={v('c-cyan')} />
      </g>
    ),
    back: (
      <g transform="translate(-6 -32)">
        <Cog r={8} fill={v('gold-dark')} />
      </g>
    ),
    held: (
      <g>
        <rect x={-1.4} y={-16} width={2.8} height={20} rx={1.2} fill={v('c-steel')} {...thin} />
        <path d="M-5,-22 L-1.4,-16 L1.4,-16 L5,-22 L3,-22 L0,-18 L-3,-22 Z" fill={v('c-steel')} {...thin} />
      </g>
    ),
  },

  // Beard, hammer, apron. Short and wide.
  'dwarf-smith': {
    body: 'tunic',
    cloth: v('c-red'),
    trim: v('gold'),
    pants: v('c-brown'),
    hair: v('hair-red'),
    scale: [1.15, 0.88],
    anim: 'swing',
    face: <Beard colour={v('hair-red')} long={14} />,
    hat: (
      <g>
        <Hair colour={v('hair-red')} />
        <path d="M-9,-55 Q0,-62 9,-55 L8,-53 Q0,-58 -8,-53 Z" fill={v('c-steel-dark')} {...thin} />
      </g>
    ),
    front: (
      <g>
        <path d="M-8,-30 L8,-30 L10,-4 L-10,-4 Z" fill={v('wood-dark')} {...O} />
        <rect x={-3} y={-24} width={6} height={5} rx={1} fill={v('wood')} {...thin} />
      </g>
    ),
    held: <Hammer big />,
  },

  // Rope, lantern, ledger.
  'harbor-master': {
    body: 'tunic',
    cloth: v('c-navy'),
    trim: v('gold'),
    pants: v('c-slate'),
    hair: v('hair-grey'),
    anim: 'wave',
    face: <Beard colour={v('hair-grey')} long={-2} />,
    hat: (
      <g>
        <Hair colour={v('hair-grey')} />
        <path d="M-9,-56 Q0,-66 9,-56 Q0,-53 -9,-56 Z" fill={v('c-navy')} {...O} />
        <rect x={-11} y={-57} width={22} height={3} rx={1.5} fill={v('shade')} fillOpacity={0.7} />
        <circle cx={0} cy={-60} r={2} fill={v('gold')} />
      </g>
    ),
    back: (
      <g transform="translate(-10 -38)">
        <ellipse rx={7} ry={4.5} fill={v('wood-light')} {...thin} />
        <ellipse rx={4} ry={2.2} fill={v('wood')} />
      </g>
    ),
    off: <Book cover={v('wood-dark')} />,
    held: (
      <g>
        <path d="M-4,-12 Q0,-20 4,-12" fill="none" stroke={v('outline')} strokeWidth={1.2} />
        <rect x={-4.5} y={-12} width={9} height={12} rx={1.5} fill={v('gold-dark')} {...thin} />
        <rect x={-2.8} y={-9.6} width={5.6} height={7.2} rx={1} fill={v('alert-glow')} />
      </g>
    ),
  },

  // Armor, shield, inspection lens.
  paladin: {
    body: 'armor',
    cloth: v('c-steel'),
    trim: v('gold'),
    pants: v('c-steel-dark'),
    skin: v('skin-2'),
    anim: 'bob',
    hat: (
      <g>
        <path d="M-9.4,-49 A9.4,9.4 0 0 1 9.4,-49 L9.4,-45 L-9.4,-45 Z" fill={v('c-steel')} {...O} />
        <rect x={-6} y={-53} width={12} height={3.6} rx={1.2} fill={v('outline')} />
        <path d="M0,-59 Q8,-70 -3,-66 Q4,-64 0,-59 Z" fill={v('c-red')} {...thin} />
      </g>
    ),
    front: (
      <g>
        <circle cx={-9} cy={-39} r={4.6} fill={v('c-steel')} {...O} />
        <circle cx={9} cy={-39} r={4.6} fill={v('c-steel')} {...O} />
        <path d="M0,-38 L0,-24 M-5,-33 L5,-33" stroke={v('gold')} strokeWidth={2.2} strokeLinecap="round" />
      </g>
    ),
    off: (
      <g transform="translate(-3 -2)">
        <path d="M-9,-12 L9,-12 L9,2 Q9,11 0,15 Q-9,11 -9,2 Z" fill={v('c-steel-dark')} {...O} />
        <path d="M0,-9 L0,11 M-6,-3 L6,-3" stroke={v('gold')} strokeWidth={2.4} />
      </g>
    ),
    held: (
      <g>
        <rect x={-1.2} y={-4} width={2.4} height={11} rx={1} fill={v('wood')} {...thin} transform="rotate(-20)" />
        <circle cx={-3} cy={-11} r={7} fill={v('c-cyan')} fillOpacity={0.45} stroke={v('gold')} strokeWidth={2.4} />
        <path d="M-6,-14 Q-4,-16 -2,-15" fill="none" stroke={v('highlight')} strokeWidth={1.2} />
      </g>
    ),
  },

  // Hood, bow, trap kit.
  ranger: {
    body: 'tunic',
    cloth: v('c-forest'),
    trim: v('wood-dark'),
    pants: v('c-moss'),
    hair: v('hair-brown'),
    anim: 'aim',
    hat: (
      <g>
        <path d="M-10.5,-47 A10.5,10.5 0 0 1 10.5,-47 L8,-36 L0,-40 L-8,-36 Z" fill={v('c-forest')} {...O} transform="translate(0 -1)" />
        <path d="M-10,-52 Q0,-76 10,-52 Q0,-58 -10,-52 Z" fill={v('c-forest')} {...O} />
        <circle cx={0} cy={-50} r={6.6} fill={v('skin-1')} {...thin} />
        <circle cx={-2.6} cy={-50.5} r={1} fill={v('outline')} />
        <circle cx={2.6} cy={-50.5} r={1} fill={v('outline')} />
      </g>
    ),
    head: null,
    back: (
      <g transform="translate(-7 -34) rotate(25)">
        <rect x={-3.2} y={-12} width={6.4} height={22} rx={2} fill={v('wood')} {...thin} />
        <path d="M-2,-12 L-2,-18 M0,-12 L0,-19 M2,-12 L2,-18" stroke={v('c-cream')} strokeWidth={1.2} />
      </g>
    ),
    front: (
      <g transform="translate(6 -14)">
        <rect x={-4.5} y={-3} width={9} height={7} rx={1.5} fill={v('wood')} {...thin} />
        <path d="M-4,-3 L-2,-6 L0,-3 L2,-6 L4,-3" fill="none" stroke={v('c-steel-dark')} strokeWidth={1.2} />
      </g>
    ),
    held: (
      <g>
        <path d="M2,-22 Q-12,-1 2,20" fill="none" stroke={v('wood-dark')} strokeWidth={3} strokeLinecap="round" />
        <path d="M2,-22 L2,20" stroke={v('c-cream')} strokeWidth={0.8} />
      </g>
    ),
  },

  // Single masked bard (the troupe uses Troupe.tsx).
  'bard-troupe': {
    body: 'tunic',
    cloth: v('c-red'),
    trim: v('gold'),
    pants: v('c-navy'),
    hair: v('hair-dark'),
    anim: 'wave',
    face: <Mask />,
    hat: (
      <g>
        <Hair colour={v('hair-dark')} />
        <path d="M-8,-56 Q0,-62 8,-56 Q0,-54 -8,-56 Z" fill={v('c-red')} {...thin} />
        <path d="M4,-58 Q16,-72 14,-56" fill="none" stroke={v('c-yellow')} strokeWidth={2} strokeLinecap="round" />
      </g>
    ),
    held: (
      <g transform="rotate(-25)">
        <ellipse cx={0} cy={-2} rx={6.5} ry={8.5} fill={v('wood-light')} {...thin} />
        <circle cx={0} cy={-2} r={2.2} fill={v('wood-dark')} />
        <rect x={-1} y={-24} width={2} height={14} fill={v('wood')} {...thin} />
      </g>
    ),
  },

  // Glowing wand, atom emblem.
  enchanter: {
    body: 'robe',
    cloth: v('c-cyan'),
    trim: v('c-navy'),
    hair: v('hair-dark'),
    anim: 'wave',
    hat: (
      <g>
        <Hair colour={v('hair-dark')} />
        <path d="M-8,-56 Q0,-60 8,-56" fill="none" stroke={v('alert-glow')} strokeWidth={2} strokeLinecap="round" />
        <circle cx={0} cy={-59.4} r={2} fill={v('alert-glow')} />
      </g>
    ),
    front: (
      <g transform="translate(0 -32)" fill="none" stroke={v('c-cream')} strokeWidth={1.1}>
        <ellipse rx={7} ry={2.6} />
        <ellipse rx={7} ry={2.6} transform="rotate(60)" />
        <ellipse rx={7} ry={2.6} transform="rotate(-60)" />
        <circle r={1.5} fill={v('c-cream')} />
      </g>
    ),
    held: (
      <g>
        <rect x={-1} y={-22} width={2} height={26} rx={1} fill={v('wood-dark')} {...thin} />
        <g transform="translate(0 -24)">
          <circle r={7} fill={v('alert-glow')} fillOpacity={0.4} />
          <Star r={5} fill={v('alert-glow')} />
        </g>
      </g>
    ),
  },

  // Carved rune slab, chisel.
  'rune-smith': {
    body: 'tunic',
    cloth: v('c-slate'),
    trim: v('gold'),
    pants: v('c-brown'),
    hair: v('hair-brown'),
    skin: v('skin-3'),
    anim: 'scribble',
    hat: (
      <g>
        <Hair colour={v('hair-brown')} />
        <path d="M-8.6,-53.5 Q0,-58 8.6,-53.5" fill="none" stroke={v('gold')} strokeWidth={2.2} />
        <path d="M-7,-46 Q-12,-38 -9,-30" fill="none" stroke={v('hair-brown')} strokeWidth={3} strokeLinecap="round" />
      </g>
    ),
    front: (
      <path d="M-4,-36 L4,-36 L0,-32 L0,-24 M-3,-28 L3,-28" fill="none" stroke={v('alert-glow')} strokeWidth={1.4} strokeLinecap="round" />
    ),
    off: (
      <g transform="translate(-2 -6)">
        <path d="M-7,-14 L7,-14 L8,4 L-8,4 Z" fill={v('stone-light')} {...thin} />
        <path d="M-3,-9 L3,-9 L0,-5 L0,0 M-3,-3 L3,-3" fill="none" stroke={v('gold')} strokeWidth={1.6} strokeLinecap="round" />
        <rect x={-8} y={-16} width={16} height={22} rx={3} fill={v('gold')} fillOpacity={0.12} />
      </g>
    ),
    held: (
      <g>
        <path d="M0,-17 L1.6,0 L-1.6,0 Z" fill={v('c-steel')} {...thin} />
        <rect x={-2.6} y={0} width={5.2} height={7} rx={1.5} fill={v('wood')} {...thin} />
      </g>
    ),
  },

  // Tinkerer with clockwork automaton.
  tinkerer: {
    body: 'tunic',
    cloth: v('c-orange'),
    trim: v('gold'),
    pants: v('c-brown'),
    hair: v('hair-blond'),
    anim: 'tick',
    hat: (
      <g>
        <Hair colour={v('hair-blond')} />
        <path d="M-6,-57 L-9,-64 M-2,-58 L-3,-66 M3,-58 L5,-66 M7,-56 L11,-62" stroke={v('hair-blond')} strokeWidth={2.4} strokeLinecap="round" />
        <rect x={-5} y={-62} width={10} height={6} rx={1.5} fill={v('gold-dark')} {...thin} />
        <rect x={-8} y={-57} width={16} height={2.4} rx={1} fill={v('gold-dark')} {...thin} />
      </g>
    ),
    front: <rect x={-8} y={-34} width={16} height={14} rx={2} fill={v('wood')} fillOpacity={0.55} />,
    held: (
      <g>
        <Cog r={5} fill={v('gold')} />
        <rect x={-1} y={-14} width={2} height={9} fill={v('c-steel-dark')} />
      </g>
    ),
    beside: (
      <g transform="translate(-21 0)">
        <rect x={-5} y={-12} width={10} height={9} rx={1.5} fill={v('gold-dark')} {...thin} />
        <rect x={-6.5} y={-23} width={13} height={10} rx={2} fill={v('gold')} {...thin} />
        <circle cx={-2.6} cy={-18} r={1.6} fill={v('c-cyan')} />
        <circle cx={2.6} cy={-18} r={1.6} fill={v('c-cyan')} />
        <path d="M0,-23 L0,-28" stroke={v('outline')} strokeWidth={1} />
        <circle cx={0} cy={-29} r={1.4} fill={v('c-red')} />
        <rect x={-5} y={-3} width={4} height={3} fill={v('outline')} />
        <rect x={1} y={-3} width={4} height={3} fill={v('outline')} />
      </g>
    ),
  },

  // Tabard, plumed cap, trumpet.
  herald: {
    body: 'tunic',
    cloth: v('c-red'),
    trim: v('gold'),
    pants: v('c-navy'),
    hair: v('hair-dark'),
    anim: 'toot',
    hat: (
      <g>
        <Hair colour={v('hair-dark')} />
        <path d="M-9,-55 Q0,-63 9,-55 Z" fill={v('c-red')} {...thin} />
        <path d="M5,-59 Q18,-74 14,-54 Q10,-64 5,-59 Z" fill={v('c-yellow')} {...thin} />
      </g>
    ),
    front: (
      <g>
        <path d="M-6,-41 L6,-41 L6,-12 L0,-16 L-6,-12 Z" fill={v('c-yellow')} {...thin} />
        <circle cx={0} cy={-30} r={3} fill={v('c-red')} />
      </g>
    ),
    held: (
      <g transform="rotate(-50)">
        <rect x={-2} y={-18} width={4} height={14} fill={v('gold')} {...thin} />
        <path d="M-2,-18 L-7,-30 L7,-30 L2,-18 Z" fill={v('gold')} {...thin} />
        <path d="M-6,-24 L-6,-12 L-1,-14" fill={v('c-red')} stroke={v('outline')} strokeWidth={0.7} />
      </g>
    ),
  },

  // Flat cap, signboard, brush.
  'sign-painter': {
    body: 'tunic',
    cloth: v('c-olive'),
    trim: v('c-cream'),
    pants: v('c-brown'),
    hair: v('hair-brown'),
    anim: 'scribble',
    hat: (
      <g>
        <Hair colour={v('hair-brown')} />
        <path d="M-9,-55 Q0,-63 9,-55 L12,-54 L-9,-53 Z" fill={v('c-red')} {...thin} />
      </g>
    ),
    front: <path d="M-9,-38 Q0,-33 9,-38 L10,-18 L-10,-18 Z" fill={v('c-cream')} fillOpacity={0.45} />,
    off: (
      <g transform="translate(-1 -6)">
        <rect x={-10} y={-8} width={20} height={14} rx={1} fill={v('sign')} {...thin} />
        <rect x={-7} y={-5} width={14} height={2} fill={v('ink')} />
        <rect x={-7} y={-1} width={9} height={2} fill={v('ink')} />
        <rect x={-1} y={6} width={2} height={7} fill={v('wood-dark')} />
      </g>
    ),
    held: (
      <g>
        <rect x={-0.9} y={-14} width={1.8} height={16} fill={v('wood')} {...thin} />
        <path d="M-2.4,-14 L0,-21 L2.4,-14 Z" fill={v('c-red')} {...thin} />
      </g>
    ),
  },

  // Two-tone motley, belled hat.
  jester: {
    body: 'tunic',
    cloth: v('c-red'),
    split: v('c-yellow'),
    trim: v('gold'),
    pants: v('c-yellow'),
    hair: v('hair-dark'),
    anim: 'wave',
    hat: (
      <g>
        <Hair colour={v('hair-dark')} />
        <path d="M-8,-55 Q-18,-62 -20,-50 Q-13,-58 -4,-57 Z" fill={v('c-red')} {...O} />
        <path d="M8,-55 Q18,-62 20,-50 Q13,-58 4,-57 Z" fill={v('c-yellow')} {...O} />
        <path d="M-9,-55 Q0,-60 9,-55 L8,-53 Q0,-57 -8,-53 Z" fill={v('c-purple')} {...thin} />
        <circle cx={-20} cy={-49} r={2.4} fill={v('gold')} {...thin} />
        <circle cx={20} cy={-49} r={2.4} fill={v('gold')} {...thin} />
      </g>
    ),
    front: (
      <g>
        <path d="M0,-43 L0,-19" stroke={v('outline')} strokeWidth={0.8} />
        <path d="M-9,-30 L0,-37 L9,-30 L0,-23 Z" fill={v('c-purple')} fillOpacity={0.35} />
      </g>
    ),
    held: (
      <g transform="rotate(-18)">
        <rect x={-1} y={-20} width={2} height={26} rx={1} fill={v('wood')} {...thin} />
        <circle cx={0} cy={-24} r={4.2} fill={v('skin-1')} {...thin} />
        <circle cx={-3.6} cy={-28} r={1.7} fill={v('gold')} />
        <circle cx={3.6} cy={-28} r={1.7} fill={v('gold')} />
      </g>
    ),
  },

  // Halo, sun staff, cream robe.
  cleric: {
    body: 'robe',
    cloth: v('c-cream'),
    trim: v('gold'),
    hair: v('hair-brown'),
    anim: 'wave',
    hat: (
      <g>
        <path d="M-8.8,-49 A8.8,8.8 0 0 1 8.8,-49 Q5,-55 0,-52 Q-5,-55 -8.8,-49 Z" fill={v('hair-brown')} {...thin} />
        <ellipse cx={0} cy={-64} rx={9} ry={2.8} fill="none" stroke={v('gold')} strokeWidth={2.2} />
      </g>
    ),
    front: (
      <g transform="translate(0 -31)">
        <circle r={4} fill={v('gold')} {...thin} />
        <path d="M0,-7 L0,-5 M0,5 L0,7 M-7,0 L-5,0 M5,0 L7,0" stroke={v('gold-dark')} strokeWidth={1.4} />
      </g>
    ),
    held: (
      <Staff
        h={62}
        top={
          <g>
            <circle r={5} fill={v('gold')} {...thin} />
            <path d="M0,-9 L0,-7 M0,7 L0,9 M-9,0 L-7,0 M7,0 L9,0 M-6,-6 L-5,-5 M5,5 L6,6 M5,-5 L6,-6 M-6,6 L-5,5" stroke={v('gold-dark')} strokeWidth={1.4} />
          </g>
        }
      />
    ),
  },

  // Dark green plate, great key, padlock.
  warden: {
    body: 'armor',
    cloth: v('c-moss'),
    trim: v('gold'),
    pants: v('c-moss'),
    skin: v('skin-3'),
    anim: 'bob',
    hat: (
      <g>
        <path d="M-10,-49 A10,10 0 0 1 10,-49 L10,-42 L-10,-42 Z" fill={v('c-moss')} {...O} />
        <rect x={-7} y={-51} width={14} height={4} rx={1} fill={v('outline')} />
        <rect x={-10.4} y={-60.4} width={20.8} height={3.2} rx={1.2} fill={v('stone-dark')} {...thin} />
        <rect x={-5} y={-65} width={10} height={5} fill={v('stone')} {...thin} />
      </g>
    ),
    back: <path d="M-10,-42 L10,-42 L16,-2 L-16,-2 Z" fill={v('stone-dark')} {...O} />,
    front: (
      <g transform="translate(0 -30)">
        <path d="M-3.6,-6 L-3.6,-9.5 A3.6,3.6 0 0 1 3.6,-9.5 L3.6,-6" fill="none" stroke={v('gold')} strokeWidth={2} />
        <rect x={-6} y={-6} width={12} height={9.5} rx={1.5} fill={v('gold')} {...thin} />
        <circle cy={-1.5} r={1.5} fill={v('outline')} />
      </g>
    ),
    held: (
      <g>
        <rect x={-1.4} y={-22} width={2.8} height={26} rx={1} fill={v('gold')} {...thin} />
        <circle cx={0} cy={-25} r={5} fill="none" stroke={v('gold')} strokeWidth={3} />
        <path d="M0,0 L5,0 M0,3.5 L4,3.5" stroke={v('gold')} strokeWidth={2.6} />
      </g>
    ),
  },

  // Brown robe, long white beard, cane.
  'elder-counselor': {
    body: 'robe',
    cloth: v('c-brown'),
    trim: v('c-cream'),
    hair: v('hair-white'),
    scale: [0.97, 0.92],
    lean: 5,
    anim: 'bob',
    face: <Beard colour={v('hair-white')} long={9} />,
    hat: (
      <g>
        <path d="M-9,-48 Q-10,-58 0,-58 Q10,-58 9,-48 Q9,-53 5,-54 Q0,-52 -5,-54 Q-9,-53 -9,-48 Z" fill={v('hair-white')} {...thin} />
        <path d="M-6,-53 L-2,-52 M2,-52 L6,-53" stroke={v('hair-grey')} strokeWidth={2} strokeLinecap="round" />
      </g>
    ),
    front: <path d="M-10,-40 Q0,-30 10,-40 L8,-30 Q0,-24 -8,-30 Z" fill={v('c-cream')} {...thin} />,
    held: (
      <g>
        <path d="M0,18 L0,-16 Q0,-24 6,-22 Q9,-21 8,-17" fill="none" stroke={v('wood-dark')} strokeWidth={2.6} strokeLinecap="round" />
      </g>
    ),
  },

  // Sage green, white head-wrap, herb basket.
  healer: {
    body: 'robe',
    cloth: v('c-sage'),
    trim: v('c-cream'),
    hair: v('hair-brown'),
    skin: v('skin-2'),
    anim: 'bob',
    hat: (
      <g>
        <path d="M-9.4,-49 A9.4,9.4 0 0 1 9.4,-49 L9,-52 Q0,-58 -9,-52 Z" fill={v('c-cream')} {...thin} />
        <path d="M-9.4,-49 L-11,-42 L-6,-46 Z" fill={v('c-cream')} {...thin} />
        <ellipse cx={6} cy={-57} rx={3.4} ry={1.6} transform="rotate(-30 6 -57)" fill={v('c-forest')} {...thin} />
      </g>
    ),
    front: <path d="M-7,-34 L7,-34 L9,-4 L-9,-4 Z" fill={v('c-cream')} {...thin} />,
    off: (
      <g transform="translate(-1 -3)">
        <path d="M-8,-4 L8,-4 L6,6 L-6,6 Z" fill={v('wood-light')} {...thin} />
        <path d="M-6,-4 Q-4,-12 -2,-4 M0,-4 Q2,-14 3,-4 M4,-4 Q7,-10 7,-4" fill={v('c-forest')} stroke={v('c-forest')} strokeWidth={1.8} />
        <circle cx={2} cy={-11} r={1.8} fill={v('c-magenta')} />
      </g>
    ),
    held: (
      <g>
        <path d="M0,4 L0,-14" stroke={v('c-forest')} strokeWidth={1.6} />
        <ellipse cx={-3} cy={-8} rx={3.4} ry={1.6} transform="rotate(-30 -3 -8)" fill={v('leaf')} {...thin} />
        <ellipse cx={3} cy={-12} rx={3.4} ry={1.6} transform="rotate(30 3 -12)" fill={v('leaf')} {...thin} />
      </g>
    ),
  },

  // Burgundy dress, bun, spectacles, pointer and books.
  teacher: {
    body: 'robe',
    cloth: v('c-burgundy'),
    trim: v('c-cream'),
    hair: v('hair-dark'),
    skin: v('skin-2'),
    anim: 'wave',
    face: (
      <g fill="none" stroke={v('outline')} strokeWidth={0.9}>
        <circle cx={-3.4} cy={-50.4} r={2.9} />
        <circle cx={3.4} cy={-50.4} r={2.9} />
        <path d="M-0.5,-50.4 L0.5,-50.4" />
      </g>
    ),
    hat: (
      <g>
        <Hair colour={v('hair-dark')} />
        <circle cx={0} cy={-62} r={4.4} fill={v('hair-dark')} {...thin} />
      </g>
    ),
    front: <path d="M-4,-41 L0,-33 L4,-41" fill={v('c-cream')} {...thin} />,
    off: (
      <g transform="translate(-2 -4)">
        <rect x={-7} y={-1} width={14} height={4} fill={v('c-blue')} {...thin} />
        <rect x={-6} y={-5} width={12} height={4} fill={v('c-orange')} {...thin} />
        <rect x={-5} y={-9} width={10} height={4} fill={v('c-forest')} {...thin} />
      </g>
    ),
    held: (
      <g transform="rotate(-8)">
        <rect x={-0.8} y={-24} width={1.6} height={30} rx={0.8} fill={v('wood-light')} {...thin} />
        <circle cx={0} cy={-25} r={1.6} fill={v('c-red')} />
      </g>
    ),
  },

  // Hooded, faceless, "?" stitched on the cloak.
  stranger: {
    body: 'robe',
    cloth: v('c-grey'),
    trim: v('c-slate'),
    anim: 'bob',
    head: (
      <g>
        <path d="M-10.5,-46 A10.5,10.5 0 0 1 10.5,-46 L11,-40 Q0,-36 -11,-40 Z" fill={v('c-grey')} {...O} />
        <path d="M-10,-52 Q0,-72 10,-52 Q0,-57 -10,-52 Z" fill={v('c-grey')} {...O} />
        <ellipse cx={0} cy={-48.5} rx={6.3} ry={6.8} fill={v('outline')} />
      </g>
    ),
    front: (
      <Unflip>
        <text
          x={0}
          y={-12}
          textAnchor="middle"
          fontSize={17}
          fontWeight={700}
          fontFamily="Georgia, serif"
          fill={v('c-cream')}
          fillOpacity={0.55}
          stroke={v('c-cream')}
          strokeWidth={0.8}
          strokeDasharray="1.6 1.4"
        >
          ?
        </text>
      </Unflip>
    ),
  },
};
