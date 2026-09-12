/** Educational near-hover rotor, SI units. Sources: FAA Helicopter Flying Handbook,
 * chapters 2–4; NASA NDARC Theory §11-4.1. Uniform inflow, untwisted rectangular
 * blades, linear lift slope. No blade flapping, stall, profile loss or flight dynamics.
 * The independently prescribed cyclic waveform does not predict disk tilt. */
export const HELICOPTER = Object.freeze({
  radius: 4.5,
  rootRadius: 0.7,
  chord: 0.32,
  blades: 2,
  omega: 42,
  density: 1.225,
  liftSlope: 5.7,
  mass: 1000,
  gravity: 9.81,
  tailArm: 4.7,
  yawInertia: 4500,
});
export const helicopterRadians = (d: number) => (d * Math.PI) / 180;
const finite = (...values: number[]) => {
  if (!values.every(Number.isFinite)) throw new RangeError('Finite helicopter state required');
};
export type HelicopterInput = {
  collectiveDeg: number;
  cyclicDeg?: number;
  diskTiltDeg?: number;
  tailBalance?: number;
};
export function helicopterBladePitch(collectiveDeg: number, cyclicDeg: number, azimuth: number) {
  finite(collectiveDeg, cyclicDeg, azimuth);
  return collectiveDeg + cyclicDeg * Math.sin(azimuth);
}
export function helicopterElement(collectiveDeg: number, induced: number, radius: number) {
  finite(collectiveDeg, induced, radius);
  if (radius < HELICOPTER.rootRadius || radius > HELICOPTER.radius || induced < 0)
    throw new RangeError('Blade element outside modeled rotor');
  const tangential = HELICOPTER.omega * radius,
    inflowAngle = Math.atan2(induced, tangential),
    alpha = helicopterRadians(collectiveDeg) - inflowAngle,
    speed = Math.hypot(tangential, induced),
    liftPerMetre =
      0.5 * HELICOPTER.density * speed * speed * HELICOPTER.chord * HELICOPTER.liftSlope * alpha;
  return {
    tangential,
    inflowAngle,
    alpha,
    speed,
    liftPerMetre,
    thrustPerMetre: liftPerMetre * Math.cos(inflowAngle),
  };
}
export function helicopterBladeThrust(collectiveDeg: number, induced: number, elements = 96) {
  finite(collectiveDeg, induced, elements);
  if (!Number.isInteger(elements) || elements < 4 || elements > 4096)
    throw new RangeError('Invalid blade integration resolution');
  const dr = (HELICOPTER.radius - HELICOPTER.rootRadius) / elements;
  let thrust = 0;
  for (let i = 0; i < elements; i++) {
    const r = HELICOPTER.rootRadius + (i + 0.5) * dr;
    thrust += helicopterElement(collectiveDeg, induced, r).thrustPerMetre * dr;
  }
  return thrust * HELICOPTER.blades;
}
export function helicopterSolve(input: HelicopterInput, elements = 96) {
  const { collectiveDeg, cyclicDeg = 0, diskTiltDeg = 0, tailBalance = 1 } = input;
  finite(collectiveDeg, cyclicDeg, diskTiltDeg, tailBalance);
  if (
    collectiveDeg < 4 ||
    collectiveDeg > 13 ||
    Math.abs(cyclicDeg) > 3 ||
    Math.abs(diskTiltDeg) > 25 ||
    tailBalance < 0 ||
    tailBalance > 1.4
  )
    throw new RangeError('Outside the near-hover teaching envelope');
  const area = Math.PI * HELICOPTER.radius ** 2;
  let lo = 0,
    hi = 30;
  for (let i = 0; i < 48; i++) {
    const v = (lo + hi) / 2;
    if (helicopterBladeThrust(collectiveDeg, v, elements) > 2 * HELICOPTER.density * area * v * v)
      lo = v;
    else hi = v;
  }
  const induced = (lo + hi) / 2,
    thrust = 2 * HELICOPTER.density * area * induced * induced,
    tilt = helicopterRadians(diskTiltDeg),
    vertical = thrust * Math.cos(tilt),
    horizontal = thrust * Math.sin(tilt),
    weight = HELICOPTER.mass * HELICOPTER.gravity,
    inducedPower = thrust * induced,
    rotorTorque = inducedPower / HELICOPTER.omega,
    tailForce = (rotorTorque / HELICOPTER.tailArm) * tailBalance,
    tailTorque = tailForce * HELICOPTER.tailArm,
    netYawTorque = tailTorque - rotorTorque;
  return {
    ...input,
    cyclicDeg,
    diskTiltDeg,
    tailBalance,
    area,
    induced,
    farWake: 2 * induced,
    thrust,
    vertical,
    horizontal,
    weight,
    inducedPower,
    rotorTorque,
    tailForce,
    tailTorque,
    netYawTorque,
    verticalAcceleration: (vertical - weight) / HELICOPTER.mass,
    horizontalAcceleration: horizontal / HELICOPTER.mass,
    yawAcceleration: netYawTorque / HELICOPTER.yawInertia,
  };
}
export type HelicopterState = ReturnType<typeof helicopterSolve>;
export function helicopterCollectiveForThrust(target: number) {
  finite(target);
  if (target <= 0) throw new RangeError('Positive target required');
  const v = Math.sqrt(target / (2 * HELICOPTER.density * Math.PI * HELICOPTER.radius ** 2));
  // At fixed inflow the chosen linear section model is exactly affine in pitch.
  const zero = helicopterBladeThrust(0, v),
    slope = helicopterBladeThrust(1, v) - zero;
  const pitch = (target - zero) / slope;
  if (pitch < 4 || pitch > 13) throw new RangeError('Target outside modeled thrust envelope');
  return pitch;
}
export const HELICOPTER_HOVER_PITCH = helicopterCollectiveForThrust(
  HELICOPTER.mass * HELICOPTER.gravity,
);
export const HELICOPTER_TILTED_PITCH = helicopterCollectiveForThrust(
  (HELICOPTER.mass * HELICOPTER.gravity) / Math.cos(helicopterRadians(20)),
);

export type HelicopterView =
  'aircraft' | 'section' | 'collective' | 'cyclic' | 'vector' | 'torque' | 'balance';
const views: HelicopterView[] = [
  'aircraft',
  'section',
  'collective',
  'cyclic',
  'vector',
  'torque',
  'balance',
];
const smooth = (p: number) => {
  const v = Math.max(0, Math.min(1, p));
  return v * v * (3 - 2 * v);
};
const ramp = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
export function helicopterShot(chapter: number, progress: number, time: number) {
  finite(chapter, progress, time);
  const c = Math.max(0, Math.min(6, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress));
  let collectiveDeg = HELICOPTER_HOVER_PITCH,
    cyclicDeg = 0,
    diskTiltDeg = 0,
    tailBalance = 1;
  if (c === 1) collectiveDeg = 6 + 4 * (ramp(p, 0.18, 0.48) - ramp(p, 0.78, 0.96));
  if (c === 2) collectiveDeg += 1.8 * (ramp(p, 0.18, 0.43) - ramp(p, 0.71, 0.9));
  if (c === 3) cyclicDeg = 3 * ramp(p, 0.12, 0.3);
  if (c === 4) diskTiltDeg = 20 * ramp(p, 0.14, 0.48);
  if (c === 5) tailBalance = 1 - ramp(p, 0.13, 0.27) + ramp(p, 0.52, 0.73);
  if (c === 6) {
    diskTiltDeg = 20;
    collectiveDeg += (HELICOPTER_TILTED_PITCH - collectiveDeg) * ramp(p, 0.18, 0.49);
  }
  return {
    view: views[c],
    collectiveDeg,
    cyclicDeg,
    diskTiltDeg,
    tailBalance,
    phase: c === 1 ? 0 : c === 3 ? p * Math.PI * 2 : Math.max(0, time) * 0.9,
    progress: p,
  };
}
