import { Barrel, Crate } from '../buildings/Props';
import { Box, C, GroundShadow, LINE, SHADE_OPACITY, iso, leftFaceTf, rightFaceTf } from '../buildings/iso';
import { Bench, Door, Dormer, Fence, FootTufts, GableRoof, GardenBed, HangingSign, HayCart, RoofChimney, Stones, TimberFrame, Window, thin, type RoofGeo } from './parts';

/** Footprint: stone ground floor A x D, timber-framed upper floor jettied out by J on the two visible sides. */
const A = 54;
const D = 34;
const G = 30; // ground floor height
const J = 4;
const U2 = 30; // upper floor height
const H = G + U2;
const ROOF: RoofGeo = { A: A + J, D: D + J, H, rise: 42, over: 5 };

function Vine({ x, h }: { x: number; h: number }): JSX.Element {
  const leaves = Array.from({ length: Math.round(h / 4) }, (_, k) => ({ y: -3 - k * 4, s: k % 2 ? 1 : -1 }));
  return (
    <g>
      <path d={`M${x},0 C${x - 3},${-h * 0.3} ${x + 4},${-h * 0.6} ${x},${-h}`} fill="none" stroke={C('vine-dark')} strokeWidth={1.2} />
      {leaves.map((l, i) => (
        <ellipse key={i} cx={x + l.s * 2.6} cy={l.y} rx={2.6} ry={1.8} fill={C(i % 3 ? 'vine' : 'leaf')} stroke="var(--va-outline)" strokeWidth={0.4} />
      ))}
    </g>
  );
}

/** T48: a standing board in front of the inn with how many agents are inside (text plus a mug, never colour alone). */
function GuestBoard({ text }: { text: string }): JSX.Element {
  return (
    <g>
      <ellipse cx={6} cy={2} rx={30} ry={5} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-shadow-opacity) * 0.8)' }} />
      <path d="M-20,0 L-17,-22 M20,0 L17,-22" stroke="var(--va-outline)" strokeWidth={3.4} strokeLinecap="round" />
      <path d="M-20,0 L-17,-22 M20,0 L17,-22" stroke={C('wood-dark')} strokeWidth={2} strokeLinecap="round" />
      <rect x={-40} y={-44} width={80} height={24} rx={3} fill={C('sign')} stroke="var(--va-outline)" strokeWidth={1.4} />
      <rect x={-37} y={-41} width={74} height={18} rx={2} fill={C('parchment')} stroke="var(--va-outline)" strokeWidth={0.8} />
      <g transform="translate(-28 -32) scale(0.62)">
        <Mug />
      </g>
      <text x={-19} y={-27.5} fontSize={13} fontWeight={700} textAnchor="start" fill={C('ink')} fontFamily="system-ui, sans-serif">
        {text}
      </text>
    </g>
  );
}

function Mug(): JSX.Element {
  return (
    <g>
      <rect x={-6} y={-6} width={11} height={13} rx={2} fill={C('c-cream')} {...thin} />
      <path d="M5,-3 Q11,-3 10,3 Q9,7 5,6" fill="none" stroke="var(--va-outline)" strokeWidth={1.4} />
      <path d="M-6,-6 Q-3,-10 0,-7 Q3,-10 5,-6 Z" fill={C('c-cream')} {...thin} />
      <rect x={-5} y={-3} width={9} height={2} fill={C('c-yellow')} />
    </g>
  );
}

/**
 * Art pass 3 preview (T46): the inn. A stone ground floor with a timber-framed, jettied upper floor, a steep tiled
 * roof with a dormer and two chimneys, shuttered windows with flower boxes, a hanging sign, barrels, a hay cart and a
 * kitchen garden. Windows are lamp-lit at dusk and night (civic building, like the current tavern).
 */
export function Inn({ inside, sleepers = 0 }: { inside?: number; sleepers?: number } = {}): JSX.Element {
  const guests = inside ?? 0;
  /** Windows that show a figure, in order: ground floor, then the upper floor. */
  const fig = (k: number): boolean => k < guests;
  const tableAt = iso(0, 0, 0, D + 24);
  return (
    <g>
      <GroundShadow rx={A + D + 18} ry={(A + D) / 2 + 12} cast={false} />
      {/* kitchen garden behind the right end */}
      <GardenBed a={A + 26} b={-10} A={12} D={15} seed={4} />
      <Fence p={{ a: A + 42, b: -28 }} q={{ a: A + 42, b: 8 }} />
      {/* ground floor: stone */}
      <Box A={A} D={D} h={G} castH={H + ROOF.rise * 0.8} left={C('stone')} right={C('stone')} top={C('wood-dark')} tex="stone" />
      <g transform={leftFaceTf(0, 0, A, D)}>
        <Stones w={2 * A} h={G} seed={11} />
        <Vine x={2 * A - 8} h={G - 4} />
        <Door x={A} w={17} h={25} />
        <Window x={22} y={-15} w={13} h={13} shutters="c-forest" box lit figure={fig(0)} />
        <Window x={2 * A - 22} y={-15} w={13} h={13} shutters="c-forest" box lit figure={fig(1)} />
      </g>
      <g transform={rightFaceTf(0, 0, A, D)}>
        <Stones w={2 * D} h={G} seed={12} />
        <Window x={D} y={-15} w={12} h={13} shutters="c-forest" lit figure={fig(5)} />
        <rect x={0} y={-G} width={2 * D} height={G} fill="var(--va-shade)" style={SHADE_OPACITY} />
      </g>
      {/* upper floor: plaster and timber, jettied out over the ground floor */}
      <Box A={A + J} D={D + J} h={U2} z={G} left={C('plaster')} right={C('plaster-shade')} top={C('wood-dark')} tex="plaster" />
      <g transform={leftFaceTf(0, 0, A + J, D + J, G)}>
        <TimberFrame w={2 * (A + J)} h={U2} posts={[18, 40, 76, 98]} rails={[-6]} braces={[[0, 18, 'up'], [98, 2 * (A + J), 'down']]} />
        {[29, 58, 87].map((x, i) => (
          <Window key={x} x={x} y={-17} w={12} h={14} box={i !== 1} lit figure={fig(2 + i)} />
        ))}
        {/* joist ends under the jetty */}
        {Array.from({ length: 14 }, (_, k) => (
          <rect key={k} x={4 + k * 8.3} y={-1} width={3.4} height={3.4} fill={C('wood-dark')} stroke="var(--va-outline)" strokeWidth={0.6} />
        ))}
      </g>
      <g transform={rightFaceTf(0, 0, A + J, D + J, G)}>
        <TimberFrame w={2 * (D + J)} h={U2} posts={[22, 54]} rails={[-6]} braces={[[0, 22, 'up'], [54, 2 * (D + J), 'down']]} />
        <Window x={D + J} y={-17} w={12} h={14} lit />
        <rect x={0} y={-U2} width={2 * (D + J)} height={U2} fill="var(--va-shade)" style={SHADE_OPACITY} />
      </g>
      {/* shadow of the jetty on the stone below */}
      <g transform={leftFaceTf(0, 0, A, D)}>
        <rect x={0} y={-G} width={2 * A} height={5} fill="var(--va-shadow)" style={{ fillOpacity: 'calc(var(--va-ao-opacity) * 0.8)' }} />
      </g>
      <GableRoof
        g={ROOF}
        kind="tiles"
        fill="roof"
        edge="roof-dark"
        gable="plaster"
        gableTex="plaster"
        seed={7}
        gableDetail={
          <g>
            <path d="M19,0 L19,-20 M57,0 L57,-20 M14,-20 L62,-20 M19,-20 L38,-38 M57,-20 L38,-38" stroke="var(--va-outline)" strokeWidth={4.6} strokeLinecap="square" />
            <path d="M19,0 L19,-20 M57,0 L57,-20 M14,-20 L62,-20 M19,-20 L38,-38 M57,-20 L38,-38" stroke={C('wood-dark')} strokeWidth={3.2} strokeLinecap="square" />
            <Window x={38} y={-9} w={9} h={11} shape="arch" lit />
            <Window x={38} y={-28} w={6} h={6} shape="round" />
          </g>
        }
      />
      <RoofChimney g={ROOF} a={-38} b={2} w={5.5} d={5} above={14} />
      <RoofChimney g={ROOF} a={34} b={3} w={4.5} d={4.5} above={11} pot={false} />
      <Dormer g={ROOF} a={-4} w={9} bd={28} hd={13} gr={8} roof="roof" edge="roof-dark" wall="plaster">
        <Window x={0} y={-6.5} w={8} h={9} lit />
      </Dormer>
      {sleepers > 0 && (
        <g transform={`translate(${iso(0, 0, -4, 30, 104).x + 4} ${iso(0, 0, -4, 30, 104).y})`} fontFamily="Georgia, serif" fontWeight={700} fill={C('c-cream')} stroke="var(--va-outline)" strokeWidth={0.5} aria-hidden="true">
          <text className="va-zzz va-zzz-1" x={0} y={0} fontSize={12}>z</text>
          <text className="va-zzz va-zzz-2" x={6} y={-7} fontSize={13}>z</text>
          <text className="va-zzz va-zzz-3" x={13} y={-15} fontSize={14}>z</text>
        </g>
      )}
      {/* hanging sign from the jetty, beside the door */}
      <g transform={`translate(${iso(0, 0, -46, D + J, G + 2).x} ${iso(0, 0, -46, D + J, G + 2).y})`}>
        <HangingSign icon={<Mug />} reach={16} />
      </g>
      {/* barrels and crates at the left corner, the hay cart at the right */}
      <g transform={`translate(${iso(0, 0, -A - 10, D - 4).x} ${iso(0, 0, -A - 10, D - 4).y})`}>
        <Barrel />
      </g>
      <g transform={`translate(${iso(0, 0, -A - 16, D - 16).x} ${iso(0, 0, -A - 16, D - 16).y})`}>
        <Barrel s={0.9} />
      </g>
      <g transform={`translate(${iso(0, 0, -A - 30, D + 4).x} ${iso(0, 0, -A - 30, D + 4).y})`}>
        <Crate />
      </g>
      <g transform={`translate(${iso(0, 0, -A - 24, D + 14).x} ${iso(0, 0, -A - 24, D + 14).y})`}>
        <Crate s={0.8} />
      </g>
      <g transform={`translate(${iso(0, 0, A + 20, D + 6).x} ${iso(0, 0, A + 20, D + 6).y})`}>
        <HayCart />
      </g>
      <FootTufts A={A} D={D} seed={3} />
      {/* long table and two benches in front (the sitting spots of the current tavern) */}
      <g transform={`translate(${iso(0, 0, 0, D + 12).x} ${iso(0, 0, 0, D + 12).y})`}>
        <Bench len={58} />
      </g>
      <Box cx={tableAt.x} cy={tableAt.y} A={30} D={6} h={13} left={C('wood-light')} right={C('wood')} top={C('wood-light')} tex="planks" />
      <g transform={`translate(${tableAt.x} ${tableAt.y})`}>
        <ellipse cx={-14} cy={-15} rx={3} ry={1.4} fill={C('c-cream')} {...LINE} />
        <rect x={-17} y={-21} width={6} height={6} rx={1} fill={C('c-cream')} {...thin} />
        <rect x={8} y={-20} width={5} height={5} rx={1} fill={C('wood-light')} {...thin} />
        <rect x={-2} y={-17} width={8} height={2.4} rx={1} fill={C('wood')} {...thin} />
      </g>
      <g transform={`translate(${iso(0, 0, 0, D + 38).x} ${iso(0, 0, 0, D + 38).y})`}>
        <Bench len={58} />
      </g>
      {inside !== undefined && (
        <g transform={`translate(${iso(0, 0, 52, D + 30).x} ${iso(0, 0, 52, D + 30).y})`}>
          <GuestBoard text={guests === 0 ? 'Empty' : `${guests} inside`} />
        </g>
      )}
    </g>
  );
}
