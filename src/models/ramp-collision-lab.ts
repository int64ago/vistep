import { rollingLaunch } from './projectile-motion-lab';
export function rampCollisionSetup(
  height = 0.12,
  referenceHeight = 0.12,
  targetMass = 0.02,
  restitution = 0.9,
) {
  if (
    ![height, referenceHeight, targetMass, restitution].every(Number.isFinite) ||
    height <= 0 ||
    referenceHeight <= 0 ||
    targetMass <= 0 ||
    targetMass >= 0.04 ||
    restitution < 0 ||
    restitution > 1
  )
    throw new RangeError('Positive heights, lighter target and restitution0–1 required');
  const incidentMass = 0.04,
    radius = 0.018,
    drop = 0.65,
    ramp = rollingLaunch(height, 0.34),
    reference = rollingLaunch(referenceHeight, 0.34),
    u = ramp.speed,
    v1 = ((incidentMass - restitution * targetMass) / (incidentMass + targetMass)) * u,
    v2 = (((1 + restitution) * incidentMass) / (incidentMass + targetMass)) * u,
    flightTime = Math.sqrt((2 * drop) / 9.8),
    P = reference.speed * flightTime,
    M = v1 * flightTime,
    N = v2 * flightTime;
  return {
    height,
    referenceHeight,
    targetMass,
    incidentMass,
    restitution,
    radius,
    drop,
    ramp,
    reference,
    u,
    v1,
    v2,
    flightTime,
    P,
    M,
    N,
    before: incidentMass * P,
    after: incidentMass * M + targetMass * N,
    actualMomentum: incidentMass * u,
    postMomentum: incidentMass * v1 + targetMass * v2,
    endTime: ramp.duration + (2 * radius) / v1 + flightTime,
  };
}
export type RampCollisionSetup = ReturnType<typeof rampCollisionSetup>;
/** Centers touch at x=-2R and x=0. The incident ball then traverses a frictionless horizontal lip before launching from x=0. */
export function rampCollisionState(s: RampCollisionSetup, time: number, collision = true) {
  if (!Number.isFinite(time)) throw new RangeError('Finite time required');
  const t = Math.max(0, time),
    r = collision ? s.ramp : s.reference,
    impact = r.duration,
    u = collision ? s.u : s.reference.speed,
    speed = collision ? s.v1 : u,
    exit = impact + (2 * s.radius) / speed,
    flight = (from: number, v: number) => {
      const dt = Math.max(0, Math.min(s.flightTime, t - from));
      return {
        x: v * dt,
        y: 4.9 * dt * dt,
        landed: t >= from + s.flightTime,
        airborne: t >= from,
        time: dt,
        vx: v,
        vy: 9.8 * dt,
      };
    };
  let incident;
  if (t < impact) {
    let i = r.trace.findIndex((p) => p.time > t);
    if (i < 1) i = 1;
    const a = r.trace[i - 1],
      b = r.trace[i],
      f = (t - a.time) / (b.time - a.time);
    incident = {
      x: a.x + (b.x - a.x) * f - 2 * s.radius,
      y: a.y + (b.y - a.y) * f,
      landed: false,
      airborne: false,
      time: 0,
      vx: (b.x - a.x) / (b.time - a.time),
      vy: (b.y - a.y) / (b.time - a.time),
    };
  } else if (t < exit) {
    incident = {
      x: -2 * s.radius + speed * (t - impact),
      y: 0,
      landed: false,
      airborne: false,
      time: 0,
      vx: speed,
      vy: 0,
    };
  } else incident = flight(exit, speed);
  const target =
    t >= impact
      ? flight(impact, s.v2)
      : { x: 0, y: 0, landed: false, airborne: false, time: 0, vx: 0, vy: 0 };
  return {
    time: t,
    incident,
    target,
    collided: collision && t >= impact,
    impact,
    exit,
    endTime: exit + s.flightTime,
  };
}
export function rampBallPath(s: RampCollisionSetup, speed: number, progress = 1) {
  const end = Math.max(0, Math.min(1, progress));
  return Array.from({ length: 45 }, (_, i) => {
    const t = ((s.flightTime * i) / 44) * end;
    return { x: speed * t, y: 4.9 * t * t };
  });
}
