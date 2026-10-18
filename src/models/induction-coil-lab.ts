/** SI models. Signed z points from the loop toward the approaching magnet.
 * Positive loop current is CCW viewed from +z; point dipole and pure R, no L.
 * Bounds define the supported teaching domain; nonfinite inputs use defaults.
 */
export const INDUCTION_MU0 = 4e-7 * Math.PI;
export type InductionExperiment = 'coil' | 'ring' | 'fall' | 'disc';
const bounded = (v: number, lo: number, hi: number, fallback = lo) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : fallback));
const unit = (v: number) => bounded(v, 0, 1);
const smooth = (v: number) => {
  const p = unit(v);
  return p * p * (3 - 2 * p);
};
export function dipoleFlux(z: number, moment = 0.03, radius = 0.025) {
  const x = bounded(z, -2, 2),
    m = bounded(moment, -10, 10, 0.03),
    a = bounded(radius, 0.005, 0.1, 0.025);
  return (INDUCTION_MU0 * m * a * a) / (2 * Math.pow(a * a + x * x, 1.5));
}
export function dipoleFluxDerivative(z: number, moment = 0.03, radius = 0.025) {
  const x = bounded(z, -2, 2),
    m = bounded(moment, -10, 10, 0.03),
    a = bounded(radius, 0.005, 0.1, 0.025);
  return (-3 * INDUCTION_MU0 * m * a * a * x) / (2 * Math.pow(a * a + x * x, 2.5));
}
export function coilInduction({
  z = 0.04,
  velocity = -0.4,
  moment = 0.03,
  turns = 80,
  resistance = 8,
  closed = true,
  radius = 0.025,
}: {
  z?: number;
  velocity?: number;
  moment?: number;
  turns?: number;
  resistance?: number;
  closed?: boolean;
  radius?: number;
} = {}) {
  const x = bounded(z, -2, 2, 0.04),
    v = bounded(velocity, -20, 20),
    m = bounded(moment, -10, 10, 0.03),
    n = bounded(turns, 0, 2000, 80),
    r = bounded(resistance, 0.0001, 1e9, 8),
    a = bounded(radius, 0.005, 0.1, 0.025);
  const flux = dipoleFlux(x, m, a),
    gradient = dipoleFluxDerivative(x, m, a),
    emf = v === 0 || n === 0 ? 0 : -n * gradient * v,
    current = closed ? emf / r : 0,
    magnetForce = current === 0 ? 0 : n * current * gradient;
  return {
    z: x,
    velocity: v,
    moment: m,
    turns: n,
    resistance: r,
    radius: a,
    closed,
    flux,
    gradient,
    fluxRate: gradient * v,
    emf,
    current,
    magnetForce,
    heatPower: current * current * r,
    externalPower: -magnetForce * v,
  };
}
/** Legacy continuous cycle remains available to cover/model consumers. */
export function approachMagnet(progress: number, polarity = 1) {
  const p = unit(progress);
  return coilInduction({
    z: 0.01 + (0.07 * (1 + Math.cos(2 * Math.PI * p))) / 2,
    velocity: -0.07 * Math.PI * Math.sin(2 * Math.PI * p),
    moment: -0.03 * (polarity < 0 ? -1 : 1),
  });
}
/** One clock, smooth departures, real rests. Position derivative is velocity. */
export function magnetMotion(time: number) {
  const t = bounded(time, 0, 8);
  let q = 0,
    v = 0;
  if (t >= 1 && t < 3) {
    const u = (t - 1) / 2;
    q = smooth(u);
    v = (-0.055 * 6 * u * (1 - u)) / 2;
  } else if (t >= 3 && t < 4) q = 1;
  else if (t >= 4 && t < 6) {
    const u = (t - 4) / 2;
    q = 1 - smooth(u);
    v = (0.055 * 6 * u * (1 - u)) / 2;
  }
  return { time: t, z: 0.08 - 0.055 * q, velocity: v === 0 ? 0 : v };
}
/** Qualitative directions copied from PEP elective 2 pp25–26, not generated
 * readings or measured amplitudes. + current = CCW seen from the magnet side. */
export const TEXTBOOK_DIRECTIONS = Object.freeze([
  Object.freeze({ pole: 1, velocity: -1, field: -1, current: 1 }),
  Object.freeze({ pole: -1, velocity: -1, field: 1, current: -1 }),
  Object.freeze({ pole: 1, velocity: 1, field: -1, current: -1 }),
  Object.freeze({ pole: -1, velocity: 1, field: 1, current: 1 }),
]);
export function fallingMagnet(time: number, height = 0.18, turns = 80) {
  const h = bounded(height, 0.06, 0.5, 0.18),
    stop = Math.sqrt((2 * (h + 0.12)) / 9.8),
    t = bounded(time, 0, stop),
    landed = t >= stop;
  return {
    ...coilInduction({
      z: h - 4.9 * t * t,
      velocity: landed ? 0 : -9.8 * t,
      moment: -0.03,
      turns,
      closed: false,
    }),
    time: t,
    height: h,
    stop,
    landed,
  };
}
export function fallTrace(height: number, turns: number, count = 181) {
  const h = bounded(height, 0.06, 0.5, 0.18),
    stop = Math.sqrt((2 * (h + 0.12)) / 9.8),
    n = Math.round(bounded(count, 2, 1001, 181));
  return Array.from({ length: n }, (_, i) => {
    const s = fallingMagnet((stop * i) / (n - 1), h, turns);
    return { time: s.time, z: s.z, emf: s.emf };
  });
}
export function discGenerator(
  omega: number,
  field = 0.3,
  radius = 0.08,
  resistance = 5,
  closed = true,
) {
  const w = bounded(omega, -100, 100),
    b = bounded(field, -2, 2, 0.3),
    r = bounded(radius, 0.01, 0.3, 0.08),
    R = bounded(resistance, 0.01, 1e7, 5),
    emf = (b * w * r * r) / 2,
    current = closed ? emf / R : 0,
    torque = (-b * current * r * r) / 2;
  return {
    omega: w,
    field: b,
    radius: r,
    resistance: R,
    closed,
    emf,
    current,
    torque,
    loadPower: current * emf,
    mechanicalPower: -torque * w,
  };
}
export function discRadial(omega: number, field: number, radius: number) {
  const s = discGenerator(omega, field),
    r = bounded(radius, 0, s.radius);
  return {
    radius: r,
    speed: s.omega * r,
    forcePerCharge: s.omega * r * s.field,
    axisToRadius: (s.field * s.omega * r * r) / 2,
  };
}
export const RING = Object.freeze({
  length: 0.14,
  mass: 0.001,
  resistance: 0.003,
  moment: 3,
  damping: 0.00002,
  viewGain: 200,
});
/** Small axial displacement approximation for mutual flux; full pendulum gravity.
 * The electrical model uses the physical displacement/velocity, never viewGain.
 */
function ringAt(t: number, theta: number, omega: number, closed: boolean, pole: number) {
  const m = magnetMotion(t),
    x = RING.length * Math.sin(theta),
    v = RING.length * Math.cos(theta) * omega,
    s = coilInduction({
      z: m.z + x,
      velocity: m.velocity + v,
      moment: -RING.moment * pole,
      turns: 1,
      resistance: RING.resistance,
      closed,
    });
  return {
    ...s,
    time: t,
    theta,
    omega,
    x,
    ringVelocity: v,
    magnetZ: m.z,
    magnetVelocity: m.velocity,
    force: s.magnetForce,
    ringPower: s.magnetForce * v,
    drivePower: -s.magnetForce * m.velocity,
  };
}
const ringCache = new Map<string, ReadonlyArray<readonly [number, number]>>();
function ringTable(closed: boolean, pole: number) {
  const key = `${closed}:${pole}`;
  const old = ringCache.get(key);
  if (old) return old;
  const dt = 1 / 256,
    rows: Array<readonly [number, number]> = [[0, 0]];
  let th = 0,
    w = 0;
  const f = (t: number, a: number, b: number) => {
    const s = ringAt(t, a, b, closed, pole);
    return [
      b,
      (s.force * Math.cos(a)) / (RING.mass * RING.length) -
        (9.8 * Math.sin(a)) / RING.length -
        (RING.damping * b) / (RING.mass * RING.length * RING.length),
    ] as const;
  };
  for (let i = 0; i < 2048; i++) {
    const t = i * dt,
      a = f(t, th, w),
      b = f(t + dt / 2, th + (a[0] * dt) / 2, w + (a[1] * dt) / 2),
      c = f(t + dt / 2, th + (b[0] * dt) / 2, w + (b[1] * dt) / 2),
      d = f(t + dt, th + c[0] * dt, w + c[1] * dt);
    th += (dt * (a[0] + 2 * b[0] + 2 * c[0] + d[0])) / 6;
    w += (dt * (a[1] + 2 * b[1] + 2 * c[1] + d[1])) / 6;
    rows.push(Object.freeze([th, w]));
  }
  const result = Object.freeze(rows);
  ringCache.set(key, result);
  return result;
}
export function ringResponse(time: number, closed = true, polarity = 1) {
  const t = bounded(time, 0, 8),
    p = polarity < 0 ? -1 : 1,
    table = ringTable(closed, p),
    k = t * 256,
    i = Math.min(2047, Math.floor(k)),
    u = k - i,
    a = table[i]!,
    b = table[i + 1]!;
  return ringAt(t, a[0] * (1 - u) + b[0] * u, a[1] * (1 - u) + b[1] * u, closed, p);
}
export function ringGeometry(time: number, closed = true, polarity = 1, gain = 1) {
  const s = ringResponse(time, closed, polarity),
    g = bounded(gain, 1, 200, 1),
    angle = s.theta * g,
    length = 118;
  return {
    ...s,
    gain: g,
    angle,
    pivot: { x: 0, y: 0 },
    center: { x: length * Math.sin(angle), y: length * Math.cos(angle) },
    radius: (0.025 * length) / RING.length,
    top: {
      x: (length - (0.025 * length) / RING.length) * Math.sin(angle),
      y: (length - (0.025 * length) / RING.length) * Math.cos(angle),
    },
  };
}
export const INDUCTION_IDS = [
  'magnet-rest',
  'magnet-move',
  'magnet-pole',
  'ring-closed',
  'ring-open',
  'drop-height',
  'drop-turns',
  'disc-rotate',
  'disc-reverse',
] as const;
export type InductionView =
  'apparatus' | 'flux' | 'directions' | 'response' | 'trace' | 'radial' | 'power';
export function initialInduction(v?: string): InductionExperiment {
  return v?.includes('aluminium-ring')
    ? 'ring'
    : v?.includes('falling-magnet')
      ? 'fall'
      : v?.includes('faraday-disc')
        ? 'disc'
        : 'coil';
}
/** Measured retained voices: chapter-relative word times + 0.45 s lead-in.
 * The shared windows remain26 s. Model time is explicitly slowed/replayed;
 * no underlying SI model, source record or recording is changed. */
export function inductionDirector(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.round(bounded(chapter, 0, 8)),
    t = bounded(chapterTime ?? unit(progress) * 26, 0, 26),
    en = locale === 'en';
  const map = (points: readonly (readonly [number, number])[]) => {
    if (t <= points[0]![0]) return points[0]![1];
    for (let i = 1; i < points.length; i++) {
      const [b, v] = points[i]!,
        [a, u] = points[i - 1]!;
      if (t <= b) return u + ((v - u) * (t - a)) / (b - a);
    }
    return points.at(-1)![1];
  };
  const experiment: InductionExperiment = c < 3 ? 'coil' : c < 5 ? 'ring' : c < 7 ? 'fall' : 'disc';
  let view: InductionView = 'apparatus',
    time = 0,
    polarity = 1,
    closed = c !== 4,
    height = 0.1,
    turns = 80,
    omega = 20,
    predict = false,
    reveal = true,
    replay = false,
    compare = false,
    discAngle = 20 * t;
  if (c === 0) view = t < (en ? 6.85 : 6.4) ? 'apparatus' : 'flux';
  if (c === 1) {
    const cut = en ? 9 : 9.4;
    view = t < cut ? 'apparatus' : 'flux';
    replay = t >= cut;
    time =
      t < cut
        ? map([
            [0, 0],
            [1.3, 1],
            [4, 3],
            [4.7, 4],
            [7.4, 6],
            [8.8, 8],
          ])
        : map([
            [cut, 1.7],
            [en ? 11.8 : 14.2, 3.2],
            [en ? 14.3 : 16.6, 5.2],
            [21, 8],
          ]);
  }
  if (c === 2) {
    const start = en ? 3.5 : 4.65,
      finish = en ? 7.85 : 9.3;
    polarity = -1;
    predict = t < start;
    reveal = !predict;
    time = bounded((t - start) / (finish - start), 0, 1) * 8;
    view = t < (en ? 8.0 : 9.5) ? 'apparatus' : 'directions';
  }
  if (c === 3) {
    time = map([
      [0, 0],
      [2.1, 1],
      [5.25, 3],
      [5.5, 4],
      [8.15, 5],
      [18.5, 5.6],
      [23, 8],
    ]);
    view = t < (en ? 7.55 : 8.55) ? 'apparatus' : 'response';
  }
  if (c === 4) {
    const start = en ? 2.7 : 3.6;
    predict = t < start;
    reveal = !predict;
    time = map([
      [start, 0],
      [start + 0.4, 1],
      [start + 2.8, 3],
      [start + 3.1, 4],
      [start + 6, 6],
      [20, 8],
    ]);
    view = t < (en ? 4.35 : 5.55) ? 'apparatus' : 'response';
  }
  if (c === 5) {
    const change = en ? 2.25 : 2.65,
      release = en ? 3.8 : 4.15,
      trace = en ? 5.5 : 6.4,
      end = en ? 8.5 : 9.35;
    height = t < change ? 0.1 : 0.26;
    const stop = Math.sqrt((2 * (height + 0.12)) / 9.8);
    time =
      t < change
        ? bounded((t - 0.55) / (change - 0.65), 0, 1) * stop
        : bounded((t - release) / (end - release), 0, 1) * stop;
    predict = t >= change && t < release;
    reveal = !predict;
    view = t < trace ? 'apparatus' : 'trace';
  }
  if (c === 6) {
    height = 0.26;
    turns = 160;
    const trace = en ? 5.3 : 5.5,
      start = en ? 7.95 : 8.25,
      hold = en ? 10.2 : 11.4,
      resume = en ? 14.5 : 15.4;
    const peak = Math.sqrt((2 * (height - 0.0125)) / 9.8),
      end = Math.sqrt((2 * (height + 0.12)) / 9.8);
    view = t < trace ? 'apparatus' : 'trace';
    predict = t < start;
    reveal = !predict;
    time = map([
      [start, 0],
      [hold, peak],
      [resume, peak],
      [resume + 3, end],
    ]);
    compare = t >= hold;
  }
  if (c === 7) {
    const radial = en ? 3.6 : 3.6,
      brush = en ? 7.5 : 8.3,
      returnRadial = en ? 10.6 : 14.0;
    view =
      t < radial ? 'apparatus' : t < brush ? 'radial' : t < returnRadial ? 'apparatus' : 'radial';
  }
  if (c === 8) {
    const stop = en ? 4.2 : 4.45,
      down = 0.35,
      resume = en ? 6.85 : 7.15,
      up = 0.5;
    if (t < stop) {
      omega = -20;
      discAngle = -20 * t;
    } else if (t < stop + down) {
      const u = (t - stop) / down;
      omega = -20 * (1 - u);
      discAngle = -20 * stop - 20 * down * (u - (u * u) / 2);
    } else if (t < resume) {
      omega = 0;
      discAngle = -20 * stop - 10 * down;
    } else if (t < resume + up) {
      const u = (t - resume) / up;
      omega = 20 * u;
      discAngle = -20 * stop - 10 * down + 10 * up * u * u;
    } else {
      omega = 20;
      discAngle = -20 * stop - 10 * down + 10 * up + 20 * (t - resume - up);
    }
    view = t < resume ? 'apparatus' : 'power';
  }
  return {
    chapter: c,
    time,
    discAngle,
    chapterTime: t,
    progress: unit(progress),
    experiment,
    view,
    polarity,
    closed,
    height,
    turns,
    omega,
    predict,
    reveal,
    replay,
    compare,
    stationary: c === 0,
  };
}
/** Backwards-compatible legacy shot fields. */
export const inductionShot = (chapter: number, progress: number) =>
  inductionDirector(chapter, progress);
/** Explicit continuous winding, two terminals; +current follows increasing s. */
export function coilPoint(
  s: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  height: number,
  turns = 7,
) {
  const u = unit(s),
    a = 2 * Math.PI * turns * u;
  return {
    x: cx + rx * Math.cos(a),
    y: cy + height * u - ry * Math.sin(a),
    front: Math.sin(a) < 0,
  };
}
