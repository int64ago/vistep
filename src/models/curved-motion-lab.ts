export type Vec2 = { x: number; y: number };
export function arcExit(time: number, exitAngle = 0, speed = 0.6, radius = 0.7) {
  if (
    ![time, exitAngle, speed, radius].every(Number.isFinite) ||
    speed <= 0 ||
    radius <= 0 ||
    exitAngle < -Math.PI / 2 ||
    exitAngle > Math.PI / 6
  )
    throw new RangeError('Valid circular track required');
  const start = -Math.PI / 2,
    exitTime = (radius * (exitAngle - start)) / speed,
    t = Math.max(0, time),
    theta = Math.min(exitAngle, start + (speed * t) / radius),
    extra = Math.max(0, t - exitTime),
    vx = -speed * Math.sin(theta),
    vy = speed * Math.cos(theta);
  return {
    time: t,
    x: radius * Math.cos(theta) + vx * extra,
    y: radius * Math.sin(theta) + vy * extra,
    vx,
    vy,
    theta,
    exitTime,
    released: t >= exitTime,
  };
}
/** Induced-dipole qualitative far field: U=-C |B|², unit dipole axis x.
 * Positions metres; strength C is illustrative, not a calibrated magnet fit.
 * Solid sphere rolling uses translational acceleration 5F/(7m). */
export function magneticRolling(time: number, side = true, strength = 0.00004) {
  if (!Number.isFinite(time) || !Number.isFinite(strength) || strength < 0)
    throw new RangeError('Finite time and nonnegative field strength required');
  const magnet = { x: side ? 0.85 : 1.2, y: side ? 0.5 : 0 },
    mass = 0.02,
    limit = 0.27;
  const accel = (x: number, y: number) => {
    const rx = x - magnet.x,
      ry = y - magnet.y,
      s = rx * rx + ry * ry,
      q = rx,
      n = s + 3 * q * q,
      fac = ((5 / 7) * strength) / mass;
    return {
      x: fac * ((2 * rx + 6 * q) / s ** 4 - (8 * rx * n) / s ** 5),
      y: fac * ((2 * ry) / s ** 4 - (8 * ry * n) / s ** 5),
    };
  };
  let x = 0,
    y = 0,
    vx = 0.55,
    vy = 0,
    t = 0,
    stopped = false;
  const trace: Vec2[] = [{ x, y }],
    target = Math.min(2.1, Math.max(0, time));
  let index = 0;
  while (t < target - 1e-12) {
    const dt = Math.min(0.0004, target - t),
      state = [x, y, vx, vy];
    const deriv = (q: number[]) => {
        const a = accel(q[0], q[1]);
        return [q[2], q[3], a.x, a.y];
      },
      k1 = deriv(state),
      k2 = deriv(state.map((q, i) => q + (dt * k1[i]) / 2)),
      k3 = deriv(state.map((q, i) => q + (dt * k2[i]) / 2)),
      k4 = deriv(state.map((q, i) => q + dt * k3[i]));
    const next = state.map((q, i) => q + (dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6);
    [x, y, vx, vy] = next;
    t += dt;
    if (++index % 40 === 0) trace.push({ x, y });
    if (Math.hypot(x - magnet.x, y - magnet.y) <= limit) {
      stopped = true;
      break;
    }
  }
  trace.push({ x, y });
  const a = accel(x, y),
    r2 = (x - magnet.x) ** 2 + (y - magnet.y) ** 2,
    energy =
      0.5 * mass * 1.4 * (vx * vx + vy * vy) -
      (strength * (r2 + 3 * (x - magnet.x) ** 2)) / r2 ** 4;
  return { x, y, vx, vy, ax: a.x, ay: a.y, time: t, trace, magnet, stopped, energy };
}
export function dartFlight(
  time: number,
  angle = Math.PI / 5,
  speed = 4,
  height = 0.75,
  length = 0.28,
) {
  if (
    ![time, angle, speed, height, length].every(Number.isFinite) ||
    speed <= 0 ||
    height <= 0 ||
    length <= 0
  )
    throw new RangeError('Finite projectile parameters required');
  const vx = speed * Math.cos(angle),
    v0 = speed * Math.sin(angle),
    at = (t: number) => {
      const vy = v0 - 9.8 * t,
        z = height + v0 * t - 4.9 * t * t,
        heading = Math.atan2(vy, vx);
      return { x: vx * t, y: z, vx, vy, heading, tipY: z + (length / 2) * Math.sin(heading) };
    };
  let lo = Math.max(0, v0 / 9.8),
    hi = (v0 + Math.sqrt(v0 * v0 + 19.6 * height)) / 9.8;
  for (let i = 0; i < 45; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid).tipY > 0) lo = mid;
    else hi = mid;
  }
  const duration = (lo + hi) / 2,
    t = Math.max(0, Math.min(duration, time)),
    s = at(t);
  return { ...s, time: t, duration, length, landed: time >= duration };
}
