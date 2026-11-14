import { Box, C, GroundShadow, SHADE_OPACITY, iso, leftFaceTf, rightFaceTf } from '../buildings/iso';
import { Bench, Bush, Door, Fence, FootTufts, GableRoof, GardenBed, RoofChimney, Stones, TimberFrame, Window, WoodPile, thin, type RoofGeo } from './parts';

const A = 36;
const D = 28;
const P = 8; // stone plinth
const W = 30; // plastered wall above the plinth
const H = P + W;
const ROOF: RoofGeo = { A, D, H, rise: 34, over: 7 };

/**
 * Art pass 3 preview (T46): a thatched cottage, the shell for the specialist houses. Stone plinth, plaster and timber
 * walls, a deep thatch with a scalloped ridge, a tall stone chimney on the gable end, a little hood over the door, a
 * fenced kitchen garden, a woodpile and a bench. No lamp-lit windows: lit windows stay a project signal.
 */
export function Cottage(): JSX.Element {
  return (
    <g>
      <GroundShadow rx={A + D + 16} ry={(A + D) / 2 + 12} cast={false} />
      <g transform={`translate(${iso(0, 0, -A - 8, -6).x} ${iso(0, 0, -A - 8, -6).y})`}>
        <WoodPile n={4} />
      </g>
      <Box A={A} D={D} h={P} castH={H + ROOF.rise * 0.8} left={C('stone')} right={C('stone')} top={C('stone-dark')} tex="stone" />
      <Box A={A} D={D} h={W} z={P} left={C('plaster')} right={C('plaster-shade')} top={C('wood-dark')} tex="plaster" />
      <g transform={leftFaceTf(0, 0, A, D, P)}>
        <TimberFrame w={2 * A} h={W} posts={[39]} braces={[[0, 7, 'up'], [65, 72, 'down']]} />
      </g>
      <g transform={leftFaceTf(0, 0, A, D)}>
        <Stones w={2 * A} h={P} seed={21} quoins={false} />
        <Door x={52} w={14} h={25} arch={false} surround="wood-dark" />
        <Window x={20} y={-23} w={12} h={13} shutters="c-teal" box />
        {/* little tiled hood over the door on two brackets */}
        <path d="M41,-30 L63,-30 L52,-39 Z" fill={C('roof')} stroke="var(--va-outline)" strokeWidth={1.2} strokeLinejoin="round" />
        <path d="M41,-30 L63,-30 L63,-28 L41,-28 Z" fill={C('roof-dark')} {...thin} />
        <path d="M44,-28 L46,-24 M60,-28 L58,-24" stroke={C('wood-dark')} strokeWidth={1.6} strokeLinecap="round" />
      </g>
      <g transform={rightFaceTf(0, 0, A, D, P)}>
        <TimberFrame w={2 * D} h={W} posts={[]} braces={[[0, 12, 'up'], [44, 56, 'down']]} />
        <Window x={D} y={-15} w={10} h={11} shutters="c-teal" />
        <rect x={0} y={-W} width={2 * D} height={W} fill="var(--va-shade)" style={SHADE_OPACITY} />
      </g>
      <g transform={rightFaceTf(0, 0, A, D)}>
        <Stones w={2 * D} h={P} seed={22} quoins={false} />
        <rect x={0} y={-P} width={2 * D} height={P} fill="var(--va-shade)" style={SHADE_OPACITY} />
      </g>
      <GableRoof
        g={ROOF}
        kind="thatch"
        fill="thatch"
        edge="thatch-dark"
        gable="plaster"
        gableTex="plaster"
        seed={3}
        gableDetail={
          <g>
            <path d="M10,0 L10,-10 M46,0 L46,-10 M6,-10 L50,-10 M28,-10 L28,-30" stroke="var(--va-outline)" strokeWidth={4.4} strokeLinecap="square" />
            <path d="M10,0 L10,-10 M46,0 L46,-10 M6,-10 L50,-10 M28,-10 L28,-30" stroke={C('wood-dark')} strokeWidth={3} strokeLinecap="square" />
            <Window x={28} y={-4.5} w={8} h={6} />
          </g>
        }
      />
      <RoofChimney g={ROOF} a={A - 12} b={1} w={5.5} d={6} above={13} />
      {/* bench by the door, bushes and the fenced kitchen garden in front */}
      <g transform={`translate(${iso(0, 0, 4, D + 5).x} ${iso(0, 0, 4, D + 5).y})`}>
        <Bench len={18} />
      </g>
      <g transform={`translate(${iso(0, 0, A + 6, D + 4).x} ${iso(0, 0, A + 6, D + 4).y})`}>
        <Bush s={1} flowers={2} />
      </g>
      <FootTufts A={A} D={D} seed={6} />
      <GardenBed a={-20} b={D + 17} A={16} D={7} seed={8} />
      <Fence p={{ a: -40, b: D + 6 }} q={{ a: -40, b: D + 28 }} />
      <Fence p={{ a: -40, b: D + 28 }} q={{ a: 2, b: D + 28 }} />
      <g transform={`translate(${iso(0, 0, -46, D + 30).x} ${iso(0, 0, -46, D + 30).y})`}>
        <Bush s={0.8} flowers={3} />
      </g>
    </g>
  );
}
