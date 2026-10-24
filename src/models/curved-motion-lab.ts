const checked = <T extends Record<string, unknown>>(s: T): T => {
  if (Object.values(s).some((v) => typeof v === 'number' && !Number.isFinite(v)))
    throw new RangeError('Calculated motion must remain finite');
  return s;
};
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
  return checked({
    time: t,
    x: radius * Math.cos(theta) + vx * extra,
    y: radius * Math.sin(theta) + vy * extra,
    vx,
    vy,
    theta,
    exitTime,
    released: t >= exitTime,
  });
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
    if (!next.every(Number.isFinite))
      throw new RangeError('Motion outside finite numerical domain');
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
  return checked({ x, y, vx, vy, ax: a.x, ay: a.y, time: t, trace, magnet, stopped, energy });
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
  return checked({ ...s, time: t, duration, length, landed: time >= duration });
}

export type CurvedState = {
  kind: 'track' | 'magnet' | 'dart';
  time: number;
  exitAngle: number;
  side: boolean;
  angle: number;
  strength: number;
  view: 'scene' | 'vectors';
  compare: boolean;
};
const progress = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
/** Measured existing speech clocks; independent physical functions retain their original outputs. */
export function curvedFilmState(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
): CurvedState {
  if (![chapter, chapterTime].every(Number.isFinite))
    throw new RangeError('Finite film inputs required');
  const c = Math.max(0, Math.min(5, Math.floor(chapter))),
    t = Math.max(0, chapterTime),
    en = locale === 'en';
  const s: CurvedState = {
    kind: c < 2 ? 'track' : c < 4 ? 'magnet' : 'dart',
    time: 0,
    exitAngle: c === 1 ? -Math.PI / 6 : 0,
    side: c === 3,
    angle: ((c === 5 ? 55 : 25) * Math.PI) / 180,
    strength: 0.00004,
    view: 'scene',
    compare: c === 1 || c === 5,
  };
  if (c < 2) {
    const end = arcExit(0, s.exitAngle).exitTime,
      release = c === 1 ? (en ? 3.19 : 3.47) : en ? 8.23 : 9.97,
      finish = c === 1 ? (en ? 8.15 : 9.09) : en ? 15.61 : 17.59;
    s.time =
      t < release
        ? progress(t, 0, release) * end
        : end + progress(t, release, finish) * (3.15 - end);
    s.view = t >= (c === 1 ? 9.5 : 18) ? 'vectors' : 'scene';
  }
  if (c === 2) {
    s.time = progress(t, 0, en ? 9.61 : 11.77) * 1.65;
    s.view = t >= 12 ? 'vectors' : 'scene';
  }
  if (c === 3) {
    const hold = en ? 14.71 : 17.03,
      finish = en ? 21 : 25;
    s.time = t < hold ? progress(t, 0, 9) * 1.0 : 1.0 + progress(t, hold, finish) * 0.65;
    s.view = t >= 4.5 ? 'vectors' : 'scene';
  }
  if (c >= 4) {
    const d = dartFlight(0, s.angle),
      apex = (4 * Math.sin(s.angle)) / 9.8;
    if (c === 4) {
      const start = en ? 5.81 : 7.01,
        peak = en ? 11.85 : 13.1,
        descent = en ? 15.21 : 17.55;
      s.time =
        t < peak
          ? progress(t, start, peak) * apex
          : apex + progress(t, peak, descent) * (d.duration * 0.8 - apex);
      if (t > 25.5) s.time = d.duration * 0.8 + progress(t, 25.5, 27.5) * d.duration * 0.2;
    } else {
      s.time =
        t < 4
          ? progress(t, 0, 4) * apex
          : t < 10
            ? apex
            : apex + progress(t, 10, en ? 19.03 : 20.37) * (d.duration - apex);
    }
    s.view = t >= (c === 4 ? 17.8 : 6.2) ? 'vectors' : 'scene';
  }
  return s;
}
