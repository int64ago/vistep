/** Constant-speed upward sliding along a straight ramp, pull parallel to the
 * surface. Coulomb kinetic friction, SI units; not a static-start threshold. */
export interface InclineParameters {
  weight: number;
  height: number;
  angle: number;
  friction: number;
  progress: number;
}
export const inclineDefaults = (): InclineParameters => ({
  weight: 120,
  height: 1,
  angle: 30,
  friction: 0,
  progress: 0.5,
});
export function inclineState(p: InclineParameters) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.weight < 0 ||
    p.height <= 0 ||
    p.angle <= 0 ||
    p.angle > 90 ||
    p.friction < 0 ||
    p.progress < 0 ||
    p.progress > 1
  )
    throw new RangeError(
      'Positive height, angle (0,90], nonnegative weight/friction and progress [0,1] required',
    );
  const theta = (p.angle * Math.PI) / 180,
    length = p.height / Math.sin(theta),
    run = p.height / Math.tan(theta),
    normal = p.weight * Math.cos(theta),
    gravityAlong = p.weight * Math.sin(theta),
    frictionForce = p.friction * normal,
    pull = gravityAlong + frictionForce,
    distance = p.progress * length,
    rise = p.progress * p.height;
  return {
    theta,
    length,
    run,
    normal,
    gravityAlong,
    frictionForce,
    pull,
    distance,
    rise,
    inputWork: pull * distance,
    potential: p.weight * rise,
    heat: frictionForce * distance,
    position: { x: p.progress * run, y: rise },
  };
}
export function inclineShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    e = u * u * (3 - 2 * u),
    p = inclineDefaults();
  if (chapter === 0) {
    p.angle = 90;
    p.progress = e;
  }
  if (chapter === 1) {
    p.angle = 30;
    p.progress = e;
  }
  if (chapter === 2) {
    p.angle = 60 - 45 * e;
    p.progress = 0.65;
  }
  if (chapter === 3) p.progress = e;
  if (chapter === 4) {
    p.friction = 0.3 * e;
    p.progress = 1;
  }
  if (chapter >= 5) {
    p.angle = 30 - 18 * e;
    p.friction = 0.3;
    p.progress = 1;
  }
  return p;
}
export function inclineOutline(p: InclineParameters) {
  const s = inclineState(p);
  return [
    { x: 0, y: 0 },
    { x: s.run, y: p.height },
    { x: s.run, y: 0 },
  ];
}
