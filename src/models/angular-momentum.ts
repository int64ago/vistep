/** Symmetric radial sliders on a rigid rotor. Prescribed internal radial motion,
 * zero or stated external axial torque, with full radial + rotational kinetic energy. */
export interface AngularMomentumParameters {
  mass: number;
  baseInertia: number;
  startRadius: number;
  endRadius: number;
  initialSpeed: number;
  duration: number;
  externalTorque: number;
}
export const angularMomentumDefaults = (): AngularMomentumParameters => ({
  mass: 1,
  baseInertia: 0.3,
  startRadius: 0.65,
  endRadius: 0.25,
  initialSpeed: 2,
  duration: 3,
  externalTorque: 0,
});
export function angularRadius(p: AngularMomentumParameters, time: number) {
  const u = Math.max(0, Math.min(1, time / p.duration)),
    d = p.endRadius - p.startRadius,
    radius = p.startRadius + d * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5),
    velocity = (d / p.duration) * (30 * u ** 2 - 60 * u ** 3 + 30 * u ** 4),
    acceleration = (d / p.duration ** 2) * (60 * u - 180 * u ** 2 + 120 * u ** 3);
  return { radius, velocity, acceleration };
}
function validate(p: AngularMomentumParameters, time: number) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.mass <= 0 ||
    p.baseInertia <= 0 ||
    p.startRadius < 0.2 ||
    p.startRadius > 0.7 ||
    p.endRadius < 0.2 ||
    p.endRadius > 0.7 ||
    p.initialSpeed <= 0 ||
    p.duration <= 0 ||
    !Number.isFinite(time) ||
    time < 0 ||
    time > 10
  )
    throw new RangeError('Positive rotor, supported radii and bounded time required');
}
export function angularMomentumState(p: AngularMomentumParameters, time: number) {
  validate(p, time);
  const initialInertia = p.baseInertia + 2 * p.mass * p.startRadius ** 2,
    initialMomentum = initialInertia * p.initialSpeed,
    at = (t: number) => {
      const q = angularRadius(p, t),
        inertia = p.baseInertia + 2 * p.mass * q.radius ** 2,
        momentum = initialMomentum + p.externalTorque * t;
      return { ...q, inertia, momentum, omega: momentum / inertia };
    },
    v = at(time);
  const intervals = Math.max(2, Math.ceil(time / 0.006 / 2) * 2),
    dt = time / intervals;
  let angle = 0;
  for (let i = 0; i <= intervals; i++)
    angle += (i === 0 || i === intervals ? 1 : i % 2 ? 4 : 2) * at(i * dt).omega;
  angle *= dt / 3;
  const rotationEnergy = 0.5 * v.inertia * v.omega ** 2,
    radialEnergy = p.mass * v.velocity ** 2,
    initialEnergy = 0.5 * initialInertia * p.initialSpeed ** 2,
    externalWork = p.externalTorque * angle,
    actuatorForce = p.mass * (v.acceleration - v.radius * v.omega ** 2),
    actuatorPower = 2 * actuatorForce * v.velocity,
    energy = rotationEnergy + radialEnergy;
  return {
    ...p,
    time,
    ...v,
    angle,
    initialInertia,
    initialMomentum,
    initialEnergy,
    rotationEnergy,
    radialEnergy,
    energy,
    externalWork,
    internalWork: energy - initialEnergy - externalWork,
    actuatorForce,
    actuatorPower,
  };
}
export type AngularMomentumState = ReturnType<typeof angularMomentumState>;
export function angularMomentumShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = angularMomentumDefaults();
  let time = 3 * u;
  if (chapter === 0) {
    p.endRadius = p.startRadius;
    time = 3 * u;
  }
  if (chapter === 2) {
    p.startRadius = 0.25;
    p.endRadius = 0.65;
    p.initialSpeed = 2.29 / 0.425;
  }
  if (chapter === 3) time = 3 * u;
  if (chapter === 4) {
    p.endRadius = 0.45;
    time = 3 * u;
  }
  if (chapter === 5) {
    p.endRadius = 0.65;
    p.externalTorque = -0.35;
    time = 4 * u;
  }
  return angularMomentumState(p, time);
}
