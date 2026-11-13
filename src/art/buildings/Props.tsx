import { C, LINE, U } from './iso';

const thin = { ...LINE, strokeWidth: 0.95 } as const;

/** Small role props (T39). Local origin = foot. Each has a hard cast shadow to the bottom right, like every other object. */

export function Barrel({ s = 1 }: { s?: number }): JSX.Element {
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={8} cy={2} rx={16} ry={4.6} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      <path d="M-9,0 Q-12,-10 -9,-21 L9,-21 Q12,-10 9,0 Q0,4 -9,0 Z" fill={C('wood')} {...LINE} />
      <path d="M-9,0 Q-12,-10 -9,-21 L-3,-21 Q-6,-10 -3,1 Z" fill={C('wood-light')} fillOpacity={0.75} />
      <path d="M3,1 Q6,-10 3,-21 L9,-21 Q12,-10 9,0 Z" fill="var(--va-shade)" style={{ fillOpacity: 'var(--va-shade-opacity)' }} />
      <path d="M-11,-15 Q0,-11 11,-15 M-11.4,-6 Q0,-2 11.4,-6" fill="none" stroke={C('wood-dark')} strokeWidth={2.2} />
      <ellipse cx={0} cy={-21} rx={9} ry={3.2} fill={C('wood-light')} {...thin} />
      <ellipse cx={0} cy={-21} rx={9} ry={3.2} fill={U('g-lit')} />
    </g>
  );
}

export function Crate({ s = 1 }: { s?: number }): JSX.Element {
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={9} cy={2} rx={17} ry={4.4} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      <path d="M-11,0 L-11,-14 L0,-9 L0,5 Z" fill={C('wood-light')} {...LINE} />
      <path d="M0,5 L0,-9 L11,-14 L11,0 Z" fill={C('wood')} {...LINE} />
      <path d="M-11,-14 L0,-19 L11,-14 L0,-9 Z" fill={C('wood-light')} {...LINE} />
      <path d="M0,5 L0,-9 L11,-14 L11,0 Z" fill="var(--va-shade)" style={{ fillOpacity: 'var(--va-shade-opacity)' }} />
      <path d="M-11,-5 L0,0 M-11,-9 L0,-4" stroke={C('wood-dark')} strokeWidth={1.1} fill="none" />
    </g>
  );
}
