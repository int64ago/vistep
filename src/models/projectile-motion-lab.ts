export const PROJECTILE_G = 9.8;
export function horizontalProjectile(time: number, speed = 1.35, drop = 0.8) {
  if (![time, speed, drop].every(Number.isFinite) || speed < 0 || drop < 0)
    throw new RangeError('Finite nonnegative launch speed and drop required');
  const duration = Math.sqrt((2 * drop) / PROJECTILE_G),
    t = Math.max(0, Math.min(duration, time));
  return {
    time: t,
    x: speed * t,
    y: 0.5 * PROJECTILE_G * t * t,
    vx: speed,
    vy: PROJECTILE_G * t,
    duration,
    arrived: time >= duration,
  };
}
/** Solid ball rolling without slip on y=-H(x/L)^2, downward y, tangent horizontal at exit. */
export function rollingLaunch(height = 0.13, length = 0.35) {
  if (![height, length].every(Number.isFinite) || height <= 0 || length <= 0)
    throw new RangeError('Positive ramp dimensions required');
  let x = -length,
    v = 0,
    t = 0;
  const dt = 0.0003,
    trace = [{ x, y: -height, time: t }];
  const derivative = (x: number, v: number) => {
    const yp = (-2 * height * x) / (length * length),
      ypp = (-2 * height) / (length * length);
    return [v, ((5 / 7) * PROJECTILE_G * yp - yp * ypp * v * v) / (1 + yp * yp)];
  };
  while (x < 0 && t < 5) {
    const a = derivative(x, v),
      b = derivative(x + (dt * a[0]) / 2, v + (dt * a[1]) / 2),
      c = derivative(x + (dt * b[0]) / 2, v + (dt * b[1]) / 2),
      d = derivative(x + dt * c[0], v + dt * c[1]),
      nx = x + (dt * (a[0] + 2 * b[0] + 2 * c[0] + d[0])) / 6,
      nv = v + (dt * (a[1] + 2 * b[1] + 2 * c[1] + d[1])) / 6;
    if (nx >= 0) {
      const f = -x / (nx - x);
      t += dt * f;
      x = 0;
      v = Math.sqrt((10 * PROJECTILE_G * height) / 7);
      trace.push({ x, y: 0, time: t });
      break;
    }
    x = nx;
    v = nv;
    t += dt;
    if (trace.length === 1 || t - trace.at(-1)!.time >= 0.008)
      trace.push({ x, y: -height * (x / length) ** 2, time: t });
  }
  return { height, length, speed: v, duration: t, trace };
}
export function rampFlight(time: number, height = 0.13, drop = 0.8) {
  const ramp = rollingLaunch(height),
    t = Math.max(0, time);
  if (t < ramp.duration) {
    const i = Math.max(0, ramp.trace.findIndex((q) => q.time > t) - 1),
      a = ramp.trace[i],
      b = ramp.trace[i + 1] ?? a,
      f = b.time > a.time ? (t - a.time) / (b.time - a.time) : 0;
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      time: t,
      airborne: false,
      arrived: false,
      speed: ramp.speed,
      launchTime: ramp.duration,
      duration: ramp.duration + Math.sqrt((2 * drop) / PROJECTILE_G),
    };
  }
  const s = horizontalProjectile(t - ramp.duration, ramp.speed, drop);
  return {
    ...s,
    time: ramp.duration + s.time,
    airborne: true,
    speed: ramp.speed,
    launchTime: ramp.duration,
    duration: ramp.duration + s.duration,
  };
}
export function wallIntercept(distance: number, speed = 1.35) {
  if (![distance, speed].every(Number.isFinite) || distance < 0 || speed <= 0)
    throw new RangeError('Positive speed and nonnegative distance required');
  const time = distance / speed;
  return { x: distance, y: 0.5 * PROJECTILE_G * time * time, time };
}
export function reconstructLaunchSpeed(horizontal: number, drop: number) {
  if (![horizontal, drop].every(Number.isFinite) || horizontal < 0 || drop <= 0)
    throw new RangeError('Positive measured drop required');
  return horizontal * Math.sqrt(PROJECTILE_G / (2 * drop));
}
/** Two receiver baseline vertical at x=-0.12, y=.12 and .72, downward coordinates. */
export function projectileRanges(x: number, y: number) {
  const bx = -0.12,
    y1 = 0.12,
    y2 = 0.72,
    d = y2 - y1,
    r1 = Math.hypot(x - bx, y - y1),
    r2 = Math.hypot(x - bx, y - y2),
    recoveredY = (r1 * r1 - r2 * r2 + y2 * y2 - y1 * y1) / (2 * d),
    recoveredX = bx + Math.sqrt(Math.max(0, r1 * r1 - (recoveredY - y1) ** 2));
  return { r1, r2, y1, y2, bx, delay1: r1 / 343, delay2: r2 / 343, recoveredX, recoveredY };
}
