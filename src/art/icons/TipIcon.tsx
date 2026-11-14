import type { IconProps } from '../contract';

export type TipIconKind = 'place' | 'task';

export interface TipIconProps extends IconProps {
  kind: TipIconKind;
}

/**
 * T49: small glyphs for the agent tooltip rows. `place`: a map pin; `task`: a task tag with a hole and string.
 * Same drawing rules as SignalIcon: 24x24, outlined with --va-text so the shape holds in both themes.
 * Decorative (aria-hidden) unless a title is passed; the tooltip always pairs it with text.
 */
export function TipIcon({ kind, size = 16, title }: TipIconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title} focusable="false">
      <g stroke="var(--va-text)" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round">
        {kind === 'place' ? (
          <g>
            <path d="M12,22 Q5,14 5,9.5 Q5,3 12,3 Q19,3 19,9.5 Q19,14 12,22 Z" fill="var(--va-accent)" />
            <circle cx={12} cy={9.5} r={2.8} fill="var(--va-surface)" />
          </g>
        ) : (
          <g stroke="var(--va-ink)">
            <path d="M3,8 L10,3 L21,3 L21,13 L10,13 Z" fill="var(--va-parchment)" transform="translate(0 4)" />
            <circle cx={8.6} cy={12} r={1.4} fill="var(--va-surface)" />
            <path d="M13,10 L18,10 M13,13 L17,13" strokeWidth={1.4} />
          </g>
        )}
      </g>
    </svg>
  );
}
