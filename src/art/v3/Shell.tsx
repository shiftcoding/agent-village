import type { ReactNode } from 'react';
import { Box, C, GroundShadow, SHADE_OPACITY, leftFaceTf, rightFaceTf, type FaceTex } from '../buildings/iso';
import { FootTufts, GableRoof, RoofChimney, Stones, TimberFrame, type RoofGeo, type RoofKind } from './parts';

/**
 * Art pass 3 (T47): the shell shared by the cottage-style buildings (herbalist hut, schoolhouse, preview cottage):
 * a stone plinth, a wall storey (plaster or planks) with optional timber framing, a gable roof with soffits, an
 * optional roof chimney, and slots for each face. Anchor (0,0) at the footprint centre.
 */
export interface ShellProps {
  A: number;
  D: number;
  /** Stone plinth height and wall height above it (wall top at P + W). */
  P?: number;
  W: number;
  rise: number;
  over: number;
  roof: { kind: RoofKind; fill: string; edge: string; seed?: number };
  wall?: { left: string; right: string; tex: FaceTex };
  /** Timber framing on the wall storey of each face (face coordinates of that storey). */
  frameLeft?: { posts: number[]; rails?: number[]; braces?: Array<[number, number, 'up' | 'down']> };
  frameRight?: { posts: number[]; rails?: number[]; braces?: Array<[number, number, 'up' | 'down']> };
  /** Details on the left face and right face, in ground face coordinates (y = 0 at the ground, up to -(P + W)). */
  left?: ReactNode;
  right?: ReactNode;
  gable?: { fill: string; tex?: FaceTex; detail?: ReactNode };
  chimney?: { a: number; b: number; w?: number; d?: number; above?: number };
  /** Drawn before the building (behind it) and after the roof (in front of it), in local screen coordinates. */
  behind?: ReactNode;
  above?: ReactNode;
  seed?: number;
}

export function roofOf(p: Pick<ShellProps, 'A' | 'D' | 'P' | 'W' | 'rise' | 'over'>): RoofGeo {
  return { A: p.A, D: p.D, H: (p.P ?? 8) + p.W, rise: p.rise, over: p.over };
}

export function Shell(p: ShellProps): JSX.Element {
  const { A, D, W, rise } = p;
  const P = p.P ?? 8;
  const H = P + W;
  const g = roofOf(p);
  const wall = p.wall ?? { left: 'plaster', right: 'plaster-shade', tex: 'plaster' as FaceTex };
  const seed = p.seed ?? 1;
  return (
    <g>
      <GroundShadow rx={A + D + 16} ry={(A + D) / 2 + 12} cast={false} />
      {p.behind}
      <Box A={A} D={D} h={P} castH={H + rise * 0.8} left={C('stone')} right={C('stone')} top={C('stone-dark')} tex="stone" />
      <Box A={A} D={D} h={W} z={P} left={C(wall.left)} right={C(wall.right)} top={C('wood-dark')} tex={wall.tex} />
      {p.frameLeft && (
        <g transform={leftFaceTf(0, 0, A, D, P)}>
          <TimberFrame w={2 * A} h={W} posts={p.frameLeft.posts} rails={p.frameLeft.rails} braces={p.frameLeft.braces} />
        </g>
      )}
      <g transform={leftFaceTf(0, 0, A, D)}>
        <Stones w={2 * A} h={P} seed={seed * 7 + 1} quoins={false} />
        {p.left}
      </g>
      <g transform={rightFaceTf(0, 0, A, D, P)}>{p.frameRight && <TimberFrame w={2 * D} h={W} posts={p.frameRight.posts} rails={p.frameRight.rails} braces={p.frameRight.braces} />}</g>
      <g transform={rightFaceTf(0, 0, A, D)}>
        <Stones w={2 * D} h={P} seed={seed * 7 + 2} quoins={false} />
        {p.right}
        <rect x={0} y={-H} width={2 * D} height={H} fill="var(--va-shade)" style={SHADE_OPACITY} />
      </g>
      <GableRoof g={g} kind={p.roof.kind} fill={p.roof.fill} edge={p.roof.edge} gable={p.gable?.fill ?? wall.left} gableTex={p.gable?.tex ?? wall.tex} gableDetail={p.gable?.detail} seed={p.roof.seed ?? seed} />
      {p.chimney && <RoofChimney g={g} a={p.chimney.a} b={p.chimney.b} w={p.chimney.w} d={p.chimney.d} above={p.chimney.above} />}
      <FootTufts A={A} D={D} seed={seed + 5} />
      {p.above}
    </g>
  );
}
