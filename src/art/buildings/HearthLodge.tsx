import type { BuildingAnchors, BuildingArtProps } from '../contract';
import { ProjectBuilding, anchorsFor } from './ProjectBuilding';

/**
 * FlowBro: the Hearth Lodge. A timber lodge with a big stone hearth chimney on the gable end, a closed
 * walled garden (the privacy boundary: nothing leaves it, the only gate is locked) and the carved Bro
 * sign above the door. Footprint centre at (0,0); lit face looks down-left; garden extends to about
 * x -172..+120, y -60..+86.
 */
export function HearthLodge(props: BuildingArtProps): JSX.Element {
  return <ProjectBuilding variant="lodge" {...props} />;
}

export const HEARTH_LODGE_ANCHORS: BuildingAnchors = anchorsFor('lodge');
