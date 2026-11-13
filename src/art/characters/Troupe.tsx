import type { TroupeArtProps } from '../contract';
import { AlertMark } from './Character';
import { Leg, O, v } from './parts';

const thin = { ...O, strokeWidth: 0.8 } as const;
const COATS = ['c-red', 'c-teal', 'c-purple', 'c-orange', 'c-blue', 'c-forest'] as const;
const FEATHERS = ['c-yellow', 'c-cyan', 'c-red', 'c-cream', 'c-magenta', 'c-orange'] as const;

/** Eight distinct mask silhouettes, cycled by persona index (head centre is 0,-40). */
function MaskArt({ kind }: { kind: number }): JSX.Element {
  const eyes = (
    <g fill={v('outline')}>
      <ellipse cx={-3} cy={-41} rx={1.6} ry={1.1} />
      <ellipse cx={3} cy={-41} rx={1.6} ry={1.1} />
    </g>
  );
  switch (kind % 8) {
    case 0: // domino
      return (
        <g>
          <path d="M-8,-43 Q0,-46 8,-43 L7,-38.5 Q0,-37 -7,-38.5 Z" fill={v('mask')} {...thin} />
          {eyes}
        </g>
      );
    case 1: // comedy
      return (
        <g>
          <circle cy={-40} r={7.6} fill={v('mask')} {...thin} />
          {eyes}
          <path d="M-4,-36.5 Q0,-32.5 4,-36.5" fill="none" stroke={v('outline')} strokeWidth={1.1} strokeLinecap="round" />
        </g>
      );
    case 2: // tragedy
      return (
        <g>
          <circle cy={-40} r={7.6} fill={v('mask')} {...thin} />
          {eyes}
          <path d="M-4,-34.5 Q0,-38.5 4,-34.5" fill="none" stroke={v('outline')} strokeWidth={1.1} strokeLinecap="round" />
        </g>
      );
    case 3: // beak
      return (
        <g>
          <circle cy={-40} r={7.6} fill={v('mask')} {...thin} />
          <path d="M-1.8,-39 L0,-29.5 L1.8,-39 Z" fill={v('c-orange')} {...thin} />
          {eyes}
        </g>
      );
    case 4: // cat
      return (
        <g>
          <circle cy={-40} r={7.6} fill={v('mask')} {...thin} />
          <path d="M-7,-44 L-6,-51 L-1.5,-46.5 M7,-44 L6,-51 L1.5,-46.5" fill={v('mask')} {...thin} />
          {eyes}
          <path d="M-1.4,-37.4 L1.4,-37.4 L0,-36 Z" fill={v('c-red')} />
        </g>
      );
    case 5: // star
      return (
        <g>
          <circle cy={-40} r={7.6} fill={v('mask')} {...thin} />
          <path d="M0,-47 L1.8,-43 L6,-43 L2.6,-40.4 L4,-36.4 L0,-38.8 L-4,-36.4 L-2.6,-40.4 L-6,-43 L-1.8,-43 Z" fill={v('gold')} {...thin} />
        </g>
      );
    case 6: // half mask (left)
      return (
        <g>
          <circle cy={-40} r={7.6} fill={v('skin-2')} {...thin} />
          <path d="M0,-47.6 A7.6,7.6 0 0 0 0,-32.4 Z" fill={v('mask')} {...thin} />
          {eyes}
        </g>
      );
    default: // visor with glasses (screen-reader-style goggles)
      return (
        <g>
          <circle cy={-40} r={7.6} fill={v('mask')} {...thin} />
          <rect x={-7} y={-43} width={14} height={5} rx={2.4} fill={v('c-navy')} {...thin} />
          <path d="M-7,-40.5 L-9,-39 M7,-40.5 L9,-39" stroke={v('outline')} strokeWidth={1} />
        </g>
      );
  }
}

/** Tiny instrument per persona so the figures differ beyond mask and colour. */
function Prop({ kind }: { kind: number }): JSX.Element {
  switch (kind % 4) {
    case 0:
      return (
        <g transform="rotate(-20)">
          <ellipse cy={-2} rx={4} ry={5.2} fill={v('wood-light')} {...thin} />
          <rect x={-0.7} y={-16} width={1.4} height={9} fill={v('wood')} />
        </g>
      );
    case 1:
      return <rect x={-8} y={-1.3} width={16} height={2.6} rx={1.3} fill={v('c-cream')} {...thin} transform="rotate(-35)" />;
    case 2:
      return (
        <g>
          <ellipse cy={0} rx={5} ry={3} fill={v('c-red')} {...thin} />
          <rect x={-5} y={0} width={10} height={5} fill={v('c-cream')} {...thin} />
        </g>
      );
    default:
      return (
        <g>
          <path d="M-3,-2 Q0,-6 3,-2 L4,3 L-4,3 Z" fill={v('gold')} {...thin} />
          <circle cy={4} r={1.2} fill={v('gold-dark')} />
        </g>
      );
  }
}

function Member({ i, pose }: { i: number; pose: TroupeArtProps['pose'] }): JSX.Element {
  const coat = v(COATS[i % COATS.length] ?? 'c-red');
  const feather = v(FEATHERS[i % FEATHERS.length] ?? 'c-yellow');
  const hands = pose === 'work' ? -26 : -18;
  const walk = pose === 'walk';
  return (
    <g className={walk ? 'va-walk-bob' : undefined} style={walk ? { animationDelay: `${(i % 3) * -0.12}s` } : undefined}>
    <g className="va-breathe" style={{ transformOrigin: '0 0', animationDelay: `${i * 0.5}s` }}>
      <ellipse cx={0} cy={0.5} rx={13.0} ry={3.9} fill="url(#va-g-contact)" />
      <Leg x={-2.8} y={-14} side="a" walk={walk}>
        <rect x={-5} y={-14} width={4.4} height={13} fill={v('c-navy')} {...thin} />
      </Leg>
      <Leg x={2.8} y={-14} side="b" walk={walk}>
        <rect x={0.6} y={-14} width={4.4} height={13} fill={v('c-navy')} {...thin} />
      </Leg>
      <path d="M-7,-31 Q0,-34 7,-31 L8,-13 L-8,-13 Z" fill={coat} {...O} />
      <path d="M3,-33 L7,-31 L8,-13 L3,-13 Z" fill={v('shade')} fillOpacity="var(--va-shade-opacity)" />
      <path d="M-7,-31 Q0,-34 7,-31 L8,-13 L-8,-13 Z" fill="url(#va-g-cloth)" />
      <path d="M-3.5,-14 Q-4,-24 -2.5,-29 M2.5,-14 Q3.5,-23 2,-29" fill="none" stroke={v('shade')} strokeOpacity={0.3} strokeWidth={0.8} strokeLinecap="round" />
      <path d="M-7,-17 L7,-17" stroke={v('gold')} strokeWidth={2} />
      <path d={`M-7,-30 L-9,-18 M7,-30 L9,${hands}`} stroke={coat} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <g transform={`translate(10 ${hands})`}>
        <g className="va-w-wave">
          <Prop kind={i} />
        </g>
      </g>
      <MaskArt kind={i} />
      <path d="M-7,-44 Q0,-52 7,-44 Q0,-47 -7,-44 Z" fill={coat} {...thin} />
      <path d="M3,-47 Q12,-58 10,-44" fill="none" stroke={feather} strokeWidth={2.2} strokeLinecap="round" />
    </g>
    </g>
  );
}

/**
 * The bard troupe: one small masked figure per persona (default 4), standing in a shallow
 * arc about 24 units apart. Total width = 24 * count; each figure is ~52 units tall.
 */
export function Troupe({ personas, pose, alert }: TroupeArtProps): JSX.Element {
  const n = Math.max(1, personas.length);
  const gap = 24;
  return (
    <g aria-hidden="true" className={`va-troupe va-pose-${pose}`}>
      {Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * gap;
        const y = Math.abs(i - (n - 1) / 2) * 2.5;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <Member i={i} pose={pose} />
          </g>
        );
      })}
      {alert && <AlertMark y={-72} />}
    </g>
  );
}
