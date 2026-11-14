import type { BuildingAnchors, RingBox } from '../contract';
import { Scaled, iso, scalePt } from '../buildings/iso';
import { StoneChapel } from '../v3/StoneChapel';

/** Front wall depth of the stone chapel (v3/StoneChapel); the spots stand in front of it. */
const D = 24;

/** Spots in front of the chapel door (local coords): three on the front row, two behind them. */
export const CHAPEL_SPOTS: Array<{ x: number; y: number }> = [
  ...[-30, 0, 30].map((a) => iso(0, 0, a, D + 16)),
  ...[-15, 15].map((a) => iso(0, 0, a, D + 34)),
];

/** Scale origin: the ground at the foot of the front wall (art pass 3: drawn 1.1x). */
const O = iso(0, 0, 0, D);
const K = 1.1;
const RAW_ANCHORS: BuildingAnchors = {
  // the door is in the bell tower (west end); the roof anchor is the spire tip
  door: iso(0, 0, -58, 18),
  roof: iso(0, 0, -58, 0, 136),
  workSpots: CHAPEL_SPOTS,
};
export const CHAPEL_ANCHORS: BuildingAnchors = { door: scalePt(RAW_ANCHORS.door, O, K), roof: scalePt(RAW_ANCHORS.roof, O, K), workSpots: RAW_ANCHORS.workSpots };

/** Focus ring box in local coords, measured from the art (T47): spire tip to the characters in front, tower to the yew. */
export const CHAPEL_RING: RingBox = { x: -110, y: -202, w: 200, h: 326 };

/** Chapel (content-safety-reviewer). Art pass 3 (T47): the stone chapel with its bell tower; see v3/StoneChapel. */
export function Chapel(): JSX.Element {
  return (
    <Scaled k={K} o={O}>
      <StoneChapel />
    </Scaled>
  );
}
