/** A guided ballast moves internally on a freely translating platform. Horizontal
 * center-of-mass motion responds only to the stated external resultant force. */
export interface CenterMassParameters {
  platformMass: number;
  cargoMass: number;
  start: number;
  end: number;
  duration: number;
  initialSpeed: number;
  externalForce: number;
}
export const centerMassDefaults = (): CenterMassParameters => ({
  platformMass: 120,
  cargoMass: 60,
  start: -0.8,
  end: 0.8,
  duration: 3,
  initialSpeed: 0,
  externalForce: 0,
});
export function centerMassState(p: CenterMassParameters, time: number) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.platformMass <= 0 ||
    p.cargoMass <= 0 ||
    Math.abs(p.start) > 0.8 ||
    Math.abs(p.end) > 0.8 ||
    p.duration <= 0 ||
    !Number.isFinite(time) ||
    time < 0 ||
    time > 10
  )
    throw new RangeError('Positive masses, supported travel and bounded time required');
  const mass = p.platformMass + p.cargoMass,
    q = p.cargoMass / mass,
    u = Math.max(0, Math.min(1, time / p.duration)),
    d = p.end - p.start,
    relative = p.start + d * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5),
    relativeVelocity = (d / p.duration) * (30 * u ** 2 - 60 * u ** 3 + 30 * u ** 4),
    relativeAcceleration = (d / p.duration ** 2) * (60 * u - 180 * u ** 2 + 120 * u ** 3),
    initialCenter = q * p.start,
    acceleration = p.externalForce / mass,
    center = initialCenter + p.initialSpeed * time + 0.5 * acceleration * time * time,
    centerVelocity = p.initialSpeed + acceleration * time,
    platform = center - q * relative,
    cargo = platform + relative,
    platformVelocity = centerVelocity - q * relativeVelocity,
    cargoVelocity = centerVelocity + (1 - q) * relativeVelocity,
    platformAcceleration = acceleration - q * relativeAcceleration,
    cargoAcceleration = acceleration + (1 - q) * relativeAcceleration,
    internalForce = p.cargoMass * cargoAcceleration;
  return {
    ...p,
    time,
    mass,
    relative,
    relativeVelocity,
    relativeAcceleration,
    initialCenter,
    acceleration,
    center,
    centerVelocity,
    platform,
    cargo,
    platformVelocity,
    cargoVelocity,
    platformAcceleration,
    cargoAcceleration,
    internalForce,
    platformDisplacement: platform,
    cargoDisplacement: cargo - p.start,
    centerDisplacement: center - initialCenter,
    momentum: p.platformMass * platformVelocity + p.cargoMass * cargoVelocity,
  };
}
export type CenterMassState = ReturnType<typeof centerMassState>;
export function centerMassShot(chapter: number, progress: number) {
  const p = centerMassDefaults(),
    u = Math.max(0, Math.min(1, progress));
  let time = 3 * u;
  if (chapter === 0) {
    p.end = p.start;
    time = 0;
  }
  if (chapter === 3) p.cargoMass = 120;
  if (chapter === 4) p.initialSpeed = 0.35;
  if (chapter === 5) p.externalForce = 36;
  return centerMassState(p, time);
}
