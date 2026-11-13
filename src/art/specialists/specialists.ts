import type { BuildingAnchors, RingBox, SpecialistPlace } from '../contract';
import { SCENE } from '../layout';
import { CHAPEL_ANCHORS, CHAPEL_RING } from './Chapel';
import { HERBALIST_ANCHORS, HERBALIST_RING } from './HerbalistHut';
import { SCHOOLHOUSE_ANCHORS, SCHOOLHOUSE_RING } from './Schoolhouse';
import { WELL_ANCHORS, WELL_RING } from './VillageWell';

/** The four specialist places, in a stable order (chapel, well, herbalist, schoolhouse). */
export const SPECIALIST_PLACES: SpecialistPlace[] = ['chapel', 'well', 'herbalist', 'schoolhouse'];

/** Anchors (door, roof, workSpots) per place, in local coordinates. */
export const SPECIALIST_ANCHORS: Record<SpecialistPlace, BuildingAnchors> = {
  chapel: CHAPEL_ANCHORS,
  well: WELL_ANCHORS,
  herbalist: HERBALIST_ANCHORS,
  schoolhouse: SCHOOLHOUSE_ANCHORS,
};

/** Focus ring rectangles (local coordinates), same shape as the UI's RING boxes: x, y, w, h. */
export const SPECIALIST_RINGS: Record<SpecialistPlace, RingBox> = {
  chapel: CHAPEL_RING,
  well: WELL_RING,
  herbalist: HERBALIST_RING,
  schoolhouse: SCHOOLHOUSE_RING,
};

/** Scene position of each place (footprint centre); the same points as SCENE.chapel, SCENE.well, ... */
export const SPECIALIST_ORIGINS: Record<SpecialistPlace, { x: number; y: number }> = {
  chapel: SCENE.chapel,
  well: SCENE.well,
  herbalist: SCENE.herbalist,
  schoolhouse: SCENE.schoolhouse,
};
