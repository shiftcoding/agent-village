import type { BuildingAnchors, BuildingArtProps } from '../contract';
import { ProjectBuilding, anchorsFor } from './ProjectBuilding';

/**
 * The village's own building: a small plaster-and-timber cartographer's workshop with a slate roof,
 * a compass weathervane, a compass-rose plaque over the door and a map table outside.
 * Footprint centre at (0,0).
 */
export function CartographersWorkshop(props: BuildingArtProps): JSX.Element {
  return <ProjectBuilding variant="workshop" {...props} />;
}

export const WORKSHOP_ANCHORS: BuildingAnchors = anchorsFor('workshop');
