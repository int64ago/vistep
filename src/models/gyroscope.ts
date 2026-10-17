/** Exact horizontal steady precession of an ideal symmetric thin disk on a massless shaft.
 * Coordinates: Y vertical, n in XZ; positive precession rotates +X toward -Z.
 * Initial precession is prescribed to its steady value; this is not release from rest. */
export interface GyroscopeParameters {
  mass: number;
  radius: number;
  arm: number;
  spin: number;
  gravity: number;
}
export type GyroVector = { x: number; y: number; z: number };
export const gyroscopeDefaults = (): GyroscopeParameters => ({
  mass: 1,
  radius: 0.18,
  arm: 0.22,
  spin: 120,
  gravity: 9.81,
});
export function gyroscopeState(p: GyroscopeParameters, time: number) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.mass <= 0 ||
    p.radius <= 0 ||
    p.arm <= 0 ||
    Math.abs(p.spin) < 20 ||
    p.gravity < 0 ||
    p.gravity > 20 ||
    !Number.isFinite(time) ||
    time < 0 ||
    time > 60
  )
    throw new RangeError('Positive geometry, nonzero spin and bounded time required');
  const axial = 0.5 * p.mass * p.radius ** 2,
    transverse = p.mass * (p.radius ** 2 / 4 + p.arm ** 2),
    spinMomentum = axial * p.spin,
    torqueMagnitude = p.mass * p.gravity * p.arm,
    precession = torqueMagnitude / spinMomentum,
    azimuth = precession * time,
    axis = { x: Math.cos(azimuth), y: 0, z: -Math.sin(azimuth) },
    tangent = { x: -Math.sin(azimuth), y: 0, z: -Math.cos(azimuth) },
    center = { x: p.arm * axis.x, y: 0, z: p.arm * axis.z },
    momentum = { x: spinMomentum * axis.x, y: transverse * precession, z: spinMomentum * axis.z },
    torque = { x: torqueMagnitude * tangent.x, y: 0, z: torqueMagnitude * tangent.z },
    reaction = {
      x: -p.mass * p.arm * precession ** 2 * axis.x,
      y: p.mass * p.gravity,
      z: -p.mass * p.arm * precession ** 2 * axis.z,
    };
  return {
    ...p,
    time,
    axial,
    transverse,
    spinMomentum,
    precession,
    azimuth,
    spinAngle: p.spin * time,
    axis,
    tangent,
    center,
    momentum,
    torque,
    reaction,
    torqueMagnitude,
    energy: 0.5 * axial * p.spin ** 2 + 0.5 * transverse * precession ** 2,
  };
}
export type GyroscopeState = ReturnType<typeof gyroscopeState>;
export function gyroscopeShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = gyroscopeDefaults();
  let time = 4 * u;
  if (chapter === 1) time = 0.55;
  if (chapter === 2) time = 1.4 * u;
  if (chapter === 3) {
    p.spin = 240;
    time = 4 * u;
  }
  if (chapter === 4) {
    p.spin = -120;
    time = 4 * u;
  }
  if (chapter === 5) {
    p.gravity = 0;
    time = 4 * u;
  }
  return gyroscopeState(p, time);
}
