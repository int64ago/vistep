import { finiteClamp } from './modern-labs';
export function stoppedMotion(speed = 3, duration = 0.3, time = 0.15) {
  const v = finiteClamp(speed, 0.1, 30),
    T = finiteClamp(duration, 0.025, 1),
    t = finiteClamp(time, 0, 3),
    q = Math.min(1, t / T);
  return {
    speed: v,
    duration: T,
    time: t,
    velocity: (v * (1 + Math.cos(Math.PI * q))) / 2,
    acceleration: q < 1 ? ((-v * Math.PI) / (2 * T)) * Math.sin(Math.PI * q) : 0,
    displacement: (v / 2) * (Math.min(t, T) + (T / Math.PI) * Math.sin(Math.PI * q)),
    impulsePerMass: (-v / 2) * (1 - Math.cos(Math.PI * q)),
    peakAcceleration: (v * Math.PI) / (2 * T),
  };
}
export function caughtBalloon(filled = true, speed = 3, duration = 0.3, time = 0.15) {
  const diameter = 1,
    latexMass = 0.1,
    airDensity = 1.2,
    volume = (Math.PI / 6) * diameter ** 3,
    airMass = filled ? airDensity * volume : 0,
    mass = latexMass + airMass,
    motion = stoppedMotion(speed, duration, time);
  return {
    ...motion,
    diameter,
    volume,
    airMass,
    latexMass,
    mass,
    momentum: mass * motion.velocity,
    force: mass * motion.acceleration,
    impulse: mass * motion.impulsePerMass,
    peakForce: mass * motion.peakAcceleration,
  };
}
/** Prescribed vehicle half-cosine stop and a critically damped linear occupant restraint.
 * This equivalent mass/spring/damper is not a crashworthiness or injury predictor. */
export function crashTrace(duration = 0.1, speedKmh = 50) {
  const T = finiteClamp(duration, 0.04, 0.16),
    v = finiteClamp(speedKmh, 30, 70) / 3.6,
    m = 70,
    k = 18000,
    c = 2 * Math.sqrt(m * k),
    dt = 0.0005;
  let q = 0,
    w = 0;
  const trace = [];
  for (let j = 0; j <= 1200; j++) {
    const t = j * dt,
      car = stoppedMotion(v, T, t),
      restraint = -k * q - c * w;
    trace.push({
      t,
      car,
      q,
      relativeVelocity: w,
      occupantVelocity: car.velocity + w,
      restraint,
      carForce: 1000 * car.acceleration,
    });
    const acceleration = (qt: number, wt: number, at: number) => (-k * qt - c * wt) / m - at,
      a1 = acceleration(q, w, car.acceleration),
      qm = q + (w * dt) / 2,
      wm = w + (a1 * dt) / 2,
      am = stoppedMotion(v, T, t + dt / 2).acceleration;
    q += wm * dt;
    w += acceleration(qm, wm, am) * dt;
  }
  return {
    duration: T,
    speed: v,
    mass: 1000,
    occupantMass: m,
    k,
    c,
    trace,
    peakCarForce: Math.max(...trace.map((p) => Math.abs(p.carForce))),
    peakOccupantForce: Math.max(...trace.map((p) => Math.abs(p.restraint))),
  };
}
