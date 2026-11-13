import type { CharacterArtProps, Pose } from '../contract';
import { LOOKS } from './looks';
import { Arm, Face, FlipContext, Hair, O, Torso, shadeStyle, v } from './parts';

/** T39: figures are drawn 14 % bigger than the 64 unit design height (feet stay at 0,0), so classes read at laptop size. */
export const CHAR_SCALE = 1.14;

/** Hand positions per pose: [right hand, left hand] in figure coordinates (feet at 0,0). */
const HANDS: Record<Pose, { r: [number, number]; l: [number, number] }> = {
  stand: { r: [13, -22], l: [-12, -22] },
  work: { r: [15, -33], l: [-10, -26] },
  study: { r: [9, -27], l: [-8, -26] },
  rest: { r: [12, -13], l: [-11, -14] },
  wait: { r: [8, -24], l: [-8, -24] },
  walk: { r: [11, -23], l: [-10, -23] },
};

/** Small "!" with a glow disc: used for alert (blocked or needs attention). */
export function AlertMark({ y = -88 }: { y?: number }): JSX.Element {
  return (
    <g transform={`translate(0 ${y})`}>
      <g className="va-glow-pulse">
        <circle r={11.5} fill={v('alert-glow')} fillOpacity={0.4} />
        <circle r={8.4} fill={v('alert-glow')} {...O} />
        <text x={0} y={5.2} textAnchor="middle" fontSize={14} fontWeight={800} fontFamily="Georgia, serif" fill={v('ink')}>
          !
        </text>
      </g>
    </g>
  );
}

function Zzz(): JSX.Element {
  return (
    <g transform="translate(10 -76)" fontFamily="Georgia, serif" fontWeight={700} fill={v('c-cream')} stroke={v('outline')} strokeWidth={0.5}>
      <text className="va-zzz va-zzz-1" x={0} y={0} fontSize={12}>
        z
      </text>
      <text className="va-zzz va-zzz-2" x={6} y={-7} fontSize={13}>
        z
      </text>
      <text className="va-zzz va-zzz-3" x={13} y={-15} fontSize={14}>
        z
      </text>
    </g>
  );
}

function Mug(): JSX.Element {
  return (
    <g transform="translate(-11 -17)">
      <rect x={-3.6} y={-4.5} width={7.2} height={8} rx={1.4} fill={v('c-cream')} {...O} strokeWidth={0.9} />
      <path d="M3.6,-2.5 Q7.5,-2 3.6,1.5" fill="none" stroke="var(--va-outline)" strokeWidth={1.1} />
      <rect x={-3} y={-4} width={6} height={2.2} fill={v('c-yellow')} />
    </g>
  );
}

/**
 * One village character (~64 units tall, feet at 0,0). Decorative: aria-hidden; the UI
 * puts the name, role and status in text next to it.
 */
export function Character({ villageClass, pose, alert, sleepy, mug, flip }: CharacterArtProps): JSX.Element {
  const look = LOOKS[villageClass];
  const skin = look.skin ?? v('skin-1');
  const [sx, sy] = look.scale ?? [1, 1];
  const hands = HANDS[pose];
  const sit = pose === 'rest' ? 6 : 0;
  const hasHead = 'head' in look;
  const headTilt = pose === 'study' ? 7 : 0;
  const sleeve = look.body === 'armor' ? v('c-steel-dark') : look.cloth;
  const walk = pose === 'walk';
  const figure = (
    <g transform={`translate(0 ${sit})`}>
      <g className={walk ? 'va-walk-bob' : undefined}>
        <g className="va-breathe" style={{ transformOrigin: '0 0' }}>
          <g transform={`scale(${sx} ${sy}) rotate(${look.lean ?? 0})`}>
            {look.beside}
            {look.back}
            {look.split ? (
              <g>
                <Torso look={look} walk={walk} rightLegExtra={<rect x={1.1} y={-20} width={6.4} height={17} fill={look.split} {...O} />} />
                <path d="M0,-43 L9,-41 L10.5,-18 L0,-18 Z" fill={look.split} {...O} />
                <path d="M3,-43 L9,-41 L10.5,-18 L4,-18 Z" fill={v('shade')} style={shadeStyle} />
              </g>
            ) : (
              <Torso look={look} walk={walk} />
            )}
            {look.front}
            {pose !== 'rest' || !mug ? <Arm from={[-9, -38]} to={hands.l} sleeve={sleeve} skin={skin} /> : <Arm from={[-9, -38]} to={[-11, -17]} sleeve={sleeve} skin={skin} />}
            {look.off && !mug && (
              <g transform={`translate(${hands.l[0]} ${hands.l[1]})`}>{look.off}</g>
            )}
            {mug && <Mug />}
            <g transform={`rotate(${headTilt} 0 -42)`}>
              {hasHead ? (
                look.head
              ) : (
                <g>
                  <Face skin={skin} />
                  {look.face}
                  {!look.hat && look.hair && <Hair colour={look.hair} />}
                </g>
              )}
              {look.hat}
            </g>
            <Arm from={[9, -38]} to={hands.r} sleeve={sleeve} skin={skin} />
            {look.held && (
              <g transform={`translate(${hands.r[0]} ${hands.r[1]})`}>
                <g transform="scale(1.2)">
                  <g className={`va-w-${look.anim}`}>{look.held}</g>
                </g>
              </g>
            )}
          </g>
        </g>
      </g>
    </g>
  );
  return (
    <g aria-hidden="true" className={`va-char va-pose-${pose} va-class-${villageClass}`}>
      <ellipse cx={11} cy={3} rx={21} ry={5.2} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.7)' }} />
      <ellipse cx={3} cy={1} rx={19} ry={5.6} fill="url(#va-g-contact)" />
      <ellipse cx={0} cy={0.6} rx={11} ry={3} fill="url(#va-g-contact)" />
      {/* Only the figure mirrors. Held items mirror with it (they swap hands); the stranger's "?" un-mirrors itself; zzz and "!" sit outside the mirror. */}
      <g transform={flip ? `scale(${-CHAR_SCALE} ${CHAR_SCALE})` : `scale(${CHAR_SCALE})`}>
        <FlipContext.Provider value={!!flip}>{figure}</FlipContext.Provider>
      </g>
      {sleepy && <Zzz />}
      {alert && <AlertMark y={-98} />}
    </g>
  );
}
