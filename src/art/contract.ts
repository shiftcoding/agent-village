/**
 * Art contract (v1). Everything under src/art is pure drawing: SVG React
 * components that take plain props and never import the parser or loader.
 * Art may import TYPE-ONLY names from src/data/types (Stage, VillageClass,
 * HealthKind, AgentState) so the vocabulary stays in one place.
 *
 * Coordinate convention: every component draws in its own local SVG space
 * with its ANCHOR at (0,0) = centre of its footprint on the ground.
 * Characters are ~64 units tall (feet at y=0, head near y=-60).
 * Buildings fit roughly within x -130..130, y -230..20 (town hall may be larger).
 * The UI positions them with <g transform="translate(x y)">.
 *
 * Colours come only from CSS custom properties defined in src/art/tokens.css
 * (light + dark), e.g. fill="var(--va-wood)". No hard-coded hex in components,
 * so themes and future commissioned art can swap cleanly.
 *
 * Owner: ui-designer.
 */
import type { AgentState, HealthKind, SpecialistPlace, Stage, VillageClass } from '../data/types';

export type { SpecialistPlace };

/** Time of day for the scene palette; the UI sets it as [data-daypart] on the scene wrapper (see tokens.css). */
export type DayPart = 'dawn' | 'day' | 'dusk' | 'night';

/** `walk`: legs alternate and the body bobs (CSS loop); a still standing pose under reduced motion. */
export type Pose = 'work' | 'stand' | 'study' | 'rest' | 'wait' | 'walk';

export interface CharacterArtProps {
  villageClass: VillageClass;
  pose: Pose;
  /** Glowing "!" above the head. */
  alert?: boolean;
  /** "zzz" bubble (resting at tavern). */
  sleepy?: boolean;
  /** Holding a mug (tavern). */
  mug?: boolean;
  /** Mirror horizontally. */
  flip?: boolean;
}

export interface TroupeArtProps {
  /** One masked figure per persona (default 4). */
  personas: string[];
  pose: Pose;
  alert?: boolean;
}

export interface BuildingArtProps {
  stage: Stage;
  /** 0-100 or null; used for the "building" stage floor-by-floor growth. */
  overall: number | null;
  /** Health overlays to draw on/around this building. */
  signals: HealthKind[];
  /** Count shown on the "needs you" roof banner badge. */
  needsYouCount?: number;
  /** Text on the plot signpost (project name, "no folder set", "no progress file yet"). */
  signText?: string;
  /** Draw the built-in fireworks while the `released` signal is present (default true). The UI passes false and mounts `Fireworks` itself, once. */
  fireworks?: boolean;
}

/** Named anchor points (local coords) where the UI places characters/overlays. */
export interface BuildingAnchors {
  door: { x: number; y: number };
  roof: { x: number; y: number };
  /** Spots in front of the building where working characters stand. */
  workSpots: Array<{ x: number; y: number }>;
}

export interface IconProps {
  size?: number;
  /** Icons are decorative by default; the UI always pairs them with a text label. */
  title?: string;
}

export type SignalIconKind = HealthKind | AgentState | 'stranger' | 'no-folder' | 'no-progress';

export interface DayPartIconProps extends IconProps {
  kind: DayPart;
}

/** Focus-ring box in local coordinates (same shape as the UI's ring boxes). */
export interface RingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
