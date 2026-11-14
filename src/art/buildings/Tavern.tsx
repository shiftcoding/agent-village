import type { BuildingAnchors } from '../contract';
import { Inn } from '../v3/Inn';
import { iso } from './iso';

/** Same footprint depth as the inn (v3/Inn), so the benches, table and spots in front stay where they were. */
const D = 34;
const H = 60;
const RISE = 42;

/** Sitting spots on the benches (feet at bench height) and standing spots around the tables (local coords). */
export const TAVERN_SIT_SPOTS: Array<{ x: number; y: number }> = [-20, 0, 20].flatMap((a) => [iso(0, 0, a, D + 12, 4), iso(0, 0, a, D + 38, 4)]);
export const TAVERN_STAND_SPOTS: Array<{ x: number; y: number }> = [iso(0, 0, -56, D + 14), iso(0, 0, 56, D + 14), iso(0, 0, -50, D + 44), iso(0, 0, 50, D + 44)];

/** Focus ring (local coords), measured from the inn art (T47): chimney pots to the back bench, barrels to the garden fence. */
export const TAVERN_RING = { x: -154, y: -152, w: 294, h: 232 };
export const TAVERN_ANCHORS: BuildingAnchors = {
  door: iso(0, 0, 0, D + 3),
  roof: iso(0, 0, 0, 0, H + RISE),
  workSpots: [...TAVERN_SIT_SPOTS, ...TAVERN_STAND_SPOTS],
};

/**
 * The tavern. Art pass 3 (T47): the inn (v3/Inn): stone ground floor, jettied timber-framed upper floor, tiled roof
 * with a dormer and two chimneys, hanging mug sign, barrels, hay cart and kitchen garden, and the long table with two
 * benches in front where agents sit. At dusk and night its windows are lamp-lit (token --va-lamp): the tavern is a
 * civic place, not a project, so this is time of day, never the Active signal. Footprint centre at (0,0).
 */
export function Tavern(): JSX.Element {
  return <Inn />;
}
