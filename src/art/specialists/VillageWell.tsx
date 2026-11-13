import type { BuildingAnchors, RingBox } from '../contract';
import { Box, C, GroundShadow, LINE, SHADE_OPACITY, U, iso, pts, Scaled, scalePt, scaleRing } from '../buildings/iso';
import { thin } from './House';

const PA = 27; // post distance along a
const RD = 20; // roof half depth
const RZ = 62; // eave height
const RISE = 24;

/** Spots in front of the well (local coords). */
export const WELL_SPOTS: Array<{ x: number; y: number }> = [
  ...[-28, 0, 28].map((a) => iso(0, 0, a, 40)),
  ...[-14, 14].map((a) => iso(0, 0, a, 58)),
];

/** Scale origin: the ground at the foot of the front wall (T39 round 2: drawn 1.2x). */
const O = { x: 0, y: 0 };
const K = 1.2;
const RAW_ANCHORS: BuildingAnchors = {
  door: iso(0, 0, 0, 34),
  roof: iso(0, 0, 0, 0, RZ + RISE + 6),
  workSpots: WELL_SPOTS,
};
export const WELL_ANCHORS: BuildingAnchors = { door: scalePt(RAW_ANCHORS.door, O, K), roof: scalePt(RAW_ANCHORS.roof, O, K), workSpots: RAW_ANCHORS.workSpots };

/** Focus ring box in local coords. */
export const WELL_RING: RingBox = scaleRing({ x: -100, y: -112, w: 178, h: 218 }, O, K);

function Post({ a, front }: { a: number; front?: boolean }): JSX.Element {
  const f = iso(0, 0, a, 0);
  const t = iso(0, 0, a, 0, RZ);
  return (
    <g strokeLinecap="round" data-front={front ? 1 : 0}>
      <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="var(--va-outline)" strokeWidth={6.6} />
      <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={C('wood')} strokeWidth={4.6} />
      <line x1={f.x - 1} y1={f.y} x2={t.x - 1} y2={t.y} stroke={C('wood-light')} strokeWidth={1.2} />
    </g>
  );
}

/**
 * Village well (relationship-advisor, the elder counselor): a round stone well with a wooden roof on two posts,
 * a windlass with a hanging bucket and a bench beside it. Footprint centre (0,0); about 150 wide, 105 tall.
 */
function VillageWellArt(): JSX.Element {
  const w0 = iso(0, 0, -PA, 0, 44);
  const w1 = iso(0, 0, PA, 0, 44);
  const rope = iso(0, 0, 0, 0, 44);
  const Lt = iso(0, 0, -PA - 5, RD, RZ);
  const Ft = iso(0, 0, PA + 5, RD, RZ);
  const M1 = iso(0, 0, -PA - 5, 0, RZ + RISE);
  const M2 = iso(0, 0, PA + 5, 0, RZ + RISE);
  const Rt = iso(0, 0, PA + 5, -RD, RZ);
  return (
    <g>
      <GroundShadow cx={4} cy={2} rx={76} ry={26} cast={false} />
      <Post a={-PA} />
      {/* stone ring */}
      <path d="M-25,-22 L-25,0 A25,12.5 0 0 0 25,0 L25,-22 Z" fill={C('stone-light')} {...LINE} />
      <path d="M-25,-22 L-25,0 A25,12.5 0 0 0 25,0 L25,-22 Z" fill={U('p-stone')} />
      <path d="M2,-9.4 A25,12.5 0 0 0 25,0 L25,-22 L2,-22 Z" fill={C('shade')} style={SHADE_OPACITY} />
      <path d="M-25,-22 L-25,0 A25,12.5 0 0 0 25,0 L25,-22 Z" fill={U('g-ao-base')} />
      <path d="M-25,-11 A25,12.5 0 0 0 25,-11 M-12,-3.6 L-12,-22 M3,-0.3 L3,-22 M17,-3.6 L17,-22" fill="none" stroke={C('outline')} strokeOpacity={0.3} strokeWidth={1} />
      <ellipse cx={0} cy={-22} rx={25} ry={12.5} fill={C('stone')} {...LINE} />
      <ellipse cx={0} cy={-22} rx={18} ry={9} fill={C('stone-dark')} {...thin} />
      <ellipse cx={0} cy={-19.5} rx={15} ry={7.2} fill={C('water')} />
      <path d="M-9,-21 Q-4,-23.4 2,-21.6" fill="none" stroke={C('highlight')} strokeOpacity={0.6} strokeWidth={1.2} strokeLinecap="round" />
      {/* windlass, rope, bucket */}
      <line x1={w0.x} y1={w0.y} x2={w1.x} y2={w1.y} stroke="var(--va-outline)" strokeWidth={6.2} strokeLinecap="round" />
      <line x1={w0.x} y1={w0.y} x2={w1.x} y2={w1.y} stroke={C('wood-light')} strokeWidth={4} strokeLinecap="round" />
      <line x1={rope.x} y1={rope.y} x2={rope.x} y2={rope.y + 11} stroke={C('wood-dark')} strokeWidth={1.4} />
      <g transform={`translate(${rope.x} ${rope.y + 11})`}>
        <path d="M-5.6,0 L-4.6,9 Q0,11.4 4.6,9 L5.6,0 Z" fill={C('wood')} {...thin} />
        <ellipse cx={0} cy={0} rx={5.6} ry={2.2} fill={C('wood-dark')} {...thin} />
        <path d="M-5.2,4 Q0,6.2 5.2,4" fill="none" stroke={C('wood-dark')} strokeWidth={1.2} />
        <path d="M-5.6,0 Q0,-9 5.6,0" fill="none" stroke={C('outline')} strokeWidth={1} />
      </g>
      <g stroke="var(--va-outline)" strokeLinecap="round">
        <line x1={w1.x + 2} y1={w1.y} x2={w1.x + 11} y2={w1.y + 5} strokeWidth={2.6} />
        <circle cx={w1.x + 11} cy={w1.y + 5} r={2} fill={C('wood-light')} strokeWidth={0.9} />
      </g>
      <Post a={PA} front />
      {/* roof on posts: front slope, gable end, ridge */}
      <polygon points={pts(iso(0, 0, PA, RD, RZ), iso(0, 0, PA, -RD, RZ), iso(0, 0, PA, 0, RZ + RISE * 0.9))} fill={C('wood')} {...LINE} />
      <polygon points={pts(iso(0, 0, PA, RD, RZ), iso(0, 0, PA, -RD, RZ), iso(0, 0, PA, 0, RZ + RISE * 0.9))} fill={C('shade')} style={SHADE_OPACITY} />
      <polygon points={pts(Lt, Ft, M2, M1)} fill={C('wood-light')} {...LINE} />
      <polygon points={pts(Lt, Ft, M2, M1)} fill={U('p-planks')} />
      <polygon points={pts(Lt, Ft, M2, M1)} fill={U('g-lit')} />
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={Lt.x + (M1.x - Lt.x) * t} y1={Lt.y + (M1.y - Lt.y) * t} x2={Ft.x + (M2.x - Ft.x) * t} y2={Ft.y + (M2.y - Ft.y) * t} stroke={C('wood-dark')} strokeWidth={1.2} strokeOpacity={0.75} />
      ))}
      <line x1={Ft.x} y1={Ft.y} x2={M2.x} y2={M2.y} stroke={C('wood-dark')} strokeWidth={3.2} strokeLinecap="round" />
      <line x1={Rt.x} y1={Rt.y} x2={M2.x} y2={M2.y} stroke={C('wood-dark')} strokeWidth={3.2} strokeLinecap="round" />
      <line x1={M1.x} y1={M1.y} x2={M2.x} y2={M2.y} stroke={C('wood-dark')} strokeWidth={3} strokeLinecap="round" />
      {/* bench beside the well */}
      {[-9, 9].map((b) => (
        <Box key={b} cx={iso(0, 0, 50, b).x} cy={iso(0, 0, 50, b).y} A={2.4} D={2.2} h={8} left={C('wood-dark')} right={C('wood-dark')} top={C('wood-dark')} />
      ))}
      <Box cx={iso(0, 0, 50, 0).x} cy={iso(0, 0, 50, 0).y} A={3.8} D={15} h={3.2} z={8} left={C('wood-light')} right={C('wood')} top={C('wood-light')} />
    </g>
  );
}

export function VillageWell(): JSX.Element {
  return (
    <Scaled k={K} o={O}>
      <VillageWellArt />
    </Scaled>
  );
}
