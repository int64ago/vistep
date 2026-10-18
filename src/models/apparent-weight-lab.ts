/** Upward position and acceleration. The ideal force platform measures N=m(g+a). */
export const APPARENT_G = 9.8;
export type WeightTrial = 'squat' | 'lift';
export function apparentMotion(trial: WeightTrial, time: number, mass = 60, direction = 1) {
  if (![time, mass, direction].every(Number.isFinite) || mass <= 0 || Math.abs(direction) !== 1)
    throw new RangeError('Finite time, positive mass and direction ±1 required.');
  const duration = trial === 'squat' ? 4.8 : 8,
    t = Math.max(0, Math.min(duration, time));
  let z = 0,
    v = 0,
    a = 0;
  if (trial === 'squat') {
    const T = 1.4,
      movingDown = t >= 0.5 && t < 1.9,
      movingUp = t >= 2.4 && t < 3.8;
    if (movingDown || movingUp) {
      const u = (t - (movingDown ? 0.5 : 2.4)) / T,
        f = u ** 3 * (10 - 15 * u + 6 * u * u),
        df = (30 * u * u * (1 - u) ** 2) / T,
        ddf = (60 * u * (1 - u) * (1 - 2 * u)) / (T * T),
        sign = movingDown ? -1 : 1;
      z = (movingDown ? 0 : -0.32) + sign * 0.32 * f;
      v = sign * 0.32 * df;
      a = sign * 0.32 * ddf;
    } else if (t >= 1.9 && t < 2.4) z = -0.32;
  } else {
    const T = 2,
      A = 0.9,
      k = Math.PI / T,
      V = (2 * A) / k,
      up = t - 0.5;
    if (up > 0 && up < T) {
      a = A * Math.sin(k * up);
      v = (A / k) * (1 - Math.cos(k * up));
      z = (A / k) * (up - Math.sin(k * up) / k);
    } else if (up >= T && up < T + 2) {
      v = V;
      z = (V * T) / 2 + V * (up - T);
    } else if (up >= T + 2 && up < 2 * T + 2) {
      const u = up - T - 2;
      a = -A * Math.sin(k * u);
      v = V - (A / k) * (1 - Math.cos(k * u));
      z = (V * T) / 2 + V * 2 + V * u - (A / k) * (u - Math.sin(k * u) / k);
    } else if (up >= 2 * T + 2) z = V * (T + 2);
    z *= direction;
    v *= direction;
    a *= direction;
  }
  const normal = mass * (APPARENT_G + a);
  return {
    time: t,
    z,
    v,
    a,
    normal,
    gravity: mass * APPARENT_G,
    scaleMass: normal / APPARENT_G,
    duration,
  };
}
/** Open vented bottle, negligible level change. The rapid pressure transient is omitted. */
export function leakingBottle(time: number, falling = true, head = 0.12) {
  if (![time, head].every(Number.isFinite) || head < 0)
    throw new RangeError('Finite time and nonnegative head required.');
  const t = Math.max(-0.3, Math.min(0.5, time)),
    released = falling && t >= 0,
    z = released ? -0.5 * APPARENT_G * t * t : 0,
    a = released ? -APPARENT_G : 0,
    effectiveGravity = APPARENT_G + a,
    pressure = 1000 * effectiveGravity * head,
    speed = Math.sqrt(2 * effectiveGravity * head),
    initialSpeed = Math.sqrt(2 * APPARENT_G * head);
  const drops = Array.from({ length: 100 }, (_, i) => t - i * 0.008)
    .filter((te) => !falling || te < 0)
    .map((te) => {
      const age = t - te;
      return { emitted: te, x: initialSpeed * age, z: -0.5 * APPARENT_G * age * age };
    });
  return { time: t, released, z, a, effectiveGravity, pressure, speed, drops };
}
/** Equal thigh and shin lengths; feet remain on the platform. */
export function squatKnee(hipHeight: number, segment = 0.44) {
  if (hipHeight < 0 || hipHeight > 2 * segment) throw new RangeError('Unreachable leg pose');
  return { x: Math.sqrt(segment * segment - (hipHeight / 2) ** 2), height: hipHeight / 2 };
}
