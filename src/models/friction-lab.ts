export const FRICTION_GRAVITY = 9.8;
export function normalFriction(mass = 0.5, extraNormal = 0, muStatic = 0.45, muKinetic = 0.3) {
  if (
    ![mass, extraNormal, muStatic, muKinetic].every(Number.isFinite) ||
    mass <= 0 ||
    extraNormal < 0 ||
    muKinetic < 0 ||
    muStatic <= muKinetic
  )
    throw new RangeError('Positive mass and static coefficient above kinetic required.');
  const normal = mass * FRICTION_GRAVITY + extraNormal;
  return { normal, staticLimit: muStatic * normal, kinetic: muKinetic * normal };
}
/** A force-controlled hand trajectory: static ramp, then a smooth approach to constant speed. */
export function frictionPull(time: number, mass = 0.5, extraNormal = 0) {
  if (!Number.isFinite(time)) throw new RangeError('Finite time required.');
  const t = Math.max(0, time),
    f = normalFriction(mass, extraNormal),
    release = 2,
    cruise = 0.18;
  if (t <= release) {
    const pull = (f.staticLimit * t) / release;
    return {
      ...f,
      time: t,
      position: 0,
      velocity: 0,
      acceleration: 0,
      pull,
      friction: pull,
      peak: pull,
      sliding: false,
      extension: pull / 100,
    };
  }
  const tau = (mass * cruise) / (f.staticLimit - f.kinetic),
    u = t - release,
    e = Math.exp(-u / tau),
    velocity = cruise * (1 - e),
    acceleration = (cruise / tau) * e,
    position = cruise * (u - tau * (1 - e)),
    pull = f.kinetic + mass * acceleration;
  return {
    ...f,
    time: t,
    position,
    velocity,
    acceleration,
    pull,
    friction: f.kinetic,
    peak: f.staticLimit,
    sliding: true,
    extension: pull / 100,
  };
}
export function frictionSteady(time: number, mass = 0.5, extraNormal = 0) {
  const f = normalFriction(mass, extraNormal),
    t = Math.max(0, time),
    velocity = 0.18;
  return {
    ...f,
    time: t,
    position: velocity * t,
    velocity,
    acceleration: 0,
    pull: f.kinetic,
    friction: f.kinetic,
    peak: f.kinetic,
    sliding: true,
    extension: f.kinetic / 100,
  };
}
