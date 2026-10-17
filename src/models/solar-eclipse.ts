import { diskOverlap } from './moon';
/** Ideal spherical Sun/Moon, vacuum, kilometres. Geocentric observing plane;
 * angular portrait uses small-angle circular disks, uniform solar brightness.
 * No calendar predictions, atmosphere, limb relief or solar-eye exposure simulation.
 */
export const ECLIPSE = {
  sunRadius: 695700,
  moonRadius: 1737.4,
  earthRadius: 6371,
  sunDistance: 149597870.7,
  inclination: 5.145,
};
const rad = Math.PI / 180;
export type EclipseInput = {
  distance: number;
  longitude: number;
  nodeAngle: number;
  inclination: number;
  observerOffset: number;
};
export function eclipseFrame(input: EclipseInput) {
  if (
    !Object.values(input).every(Number.isFinite) ||
    input.distance < 350000 ||
    input.distance > 410000 ||
    Math.abs(input.longitude) > 2 ||
    Math.abs(input.nodeAngle) > 90 ||
    input.inclination < 0 ||
    input.inclination > 10 ||
    Math.abs(input.observerOffset) > 6371
  )
    throw new RangeError('Outside the controlled eclipse geometry domain.');
  const { distance: d, longitude, nodeAngle, inclination, observerOffset } = input;
  const beta = Math.asin(Math.sin(inclination * rad) * Math.sin(nodeAngle * rad));
  const moon = {
    x: -d * Math.cos(beta) * Math.cos(longitude * rad),
    y: d * Math.cos(beta) * Math.sin(longitude * rad),
    z: d * Math.sin(beta),
  };
  const sunMoon = Math.hypot(moon.x + ECLIPSE.sunDistance, moon.y, moon.z);
  const axis = {
    x: (moon.x + ECLIPSE.sunDistance) / sunMoon,
    y: moon.y / sunMoon,
    z: moon.z / sunMoon,
  };
  const target = { x: -moon.x, y: -moon.y, z: observerOffset - moon.z };
  const along = target.x * axis.x + target.y * axis.y + target.z * axis.z;
  const miss = Math.sqrt(Math.max(0, target.x ** 2 + target.y ** 2 + target.z ** 2 - along ** 2));
  const q = (ECLIPSE.sunRadius - ECLIPSE.moonRadius) / sunMoon;
  const qp = (ECLIPSE.sunRadius + ECLIPSE.moonRadius) / sunMoon;
  const umbra = (ECLIPSE.moonRadius - along * q) / Math.sqrt(1 - q * q);
  const penumbra = (ECLIPSE.moonRadius + along * qp) / Math.sqrt(1 - qp * qp);
  const moonObserver = Math.hypot(moon.x, moon.y, moon.z - observerOffset);
  const sunObserver = Math.hypot(ECLIPSE.sunDistance, observerOffset);
  const cosine =
    (ECLIPSE.sunDistance * -moon.x - observerOffset * (moon.z - observerOffset)) /
    (moonObserver * sunObserver);
  const separation = Math.acos(Math.max(-1, Math.min(1, cosine)));
  const sunAngular = Math.asin(ECLIPSE.sunRadius / sunObserver),
    moonAngular = Math.asin(ECLIPSE.moonRadius / moonObserver);
  const east = moon.y / moonObserver;
  const north = (moon.z - observerOffset) / moonObserver + observerOffset / sunObserver;
  const transverse = Math.hypot(east, north);
  const sky = {
    x: transverse ? (separation * east) / transverse : 0,
    y: transverse ? (separation * north) / transverse : 0,
  };
  const obscured = diskOverlap(sunAngular, moonAngular, separation) / (Math.PI * sunAngular ** 2);
  const kind: 'none' | 'partial' | 'total' | 'annular' =
    separation >= sunAngular + moonAngular
      ? 'none'
      : separation <= Math.abs(sunAngular - moonAngular)
        ? moonAngular >= sunAngular
          ? 'total'
          : 'annular'
        : 'partial';
  return {
    input,
    beta,
    moon,
    sunMoon,
    along,
    miss,
    umbra,
    penumbra,
    apex: ECLIPSE.moonRadius / q,
    sunAngular,
    moonAngular,
    separation,
    sky,
    obscured,
    kind,
  };
}
export function eclipseShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    q = p * p * (3 - 2 * p);
  const input: EclipseInput = {
    distance: 360000,
    longitude: 0,
    nodeAngle: 0,
    inclination: ECLIPSE.inclination,
    observerOffset: 0,
  };
  if (chapter === 0) input.nodeAngle = 90;
  if (chapter === 1) input.nodeAngle = 90 * (1 - q);
  if (chapter === 2) input.longitude = 0.9 * (1 - q);
  if (chapter === 3) input.observerOffset = 0;
  if (chapter === 4) input.observerOffset = 2500 * q;
  if (chapter === 5) input.distance = 360000 + 45000 * q;
  if (chapter === 6) {
    input.longitude = -0.8 + 1.6 * q;
    input.distance = 360000;
  }
  if (chapter === 7) {
    input.nodeAngle = 28 * q;
    input.distance = 384400;
  }
  return {
    input,
    view: chapter <= 1 ? 'alignment' : chapter === 3 || chapter === 4 ? 'shadow' : 'sky',
  };
}
