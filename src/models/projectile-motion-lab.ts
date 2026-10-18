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
  return rollingState(time, rollingLaunch(height), drop);
}
export function rollingState(time: number, ramp: ReturnType<typeof rollingLaunch>, drop = 0.8) {
  if (![time, drop].every(Number.isFinite) || drop < 0)
    throw new RangeError('Finite time and nonnegative drop required');
  const t = Math.max(0, time);
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
  if (![x, y].every(Number.isFinite)) throw new RangeError('Finite position required');
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

export const PROJECTILE_RADIUS = 0.024;
export const PROJECTILE_SPEED = 1.4;
export const PROJECTILE_IDS = [
  'strobe',
  'paired',
  'carbon',
  'receivers',
  'home-board',
  'home-wall',
  'parabola',
  'speed',
] as const;
export type ProjectileMode =
  'strobe' | 'pair' | 'carbon' | 'sensor' | 'board' | 'wall' | 'parabola' | 'speed' | 'forces';
/** Fixed, explicitly synthetic teaching coordinates: v0=1.4 m/s, g=9.8, delta-t=.1 s. */
export const PROJECTILE_RECORDS = Object.freeze([
  Object.freeze({ id: 0, time: 0, x: 0, y: 0 }),
  Object.freeze({ id: 1, time: 0.1, x: 0.14, y: 0.049 }),
  Object.freeze({ id: 2, time: 0.2, x: 0.28, y: 0.196 }),
  Object.freeze({ id: 3, time: 0.3, x: 0.42, y: 0.441 }),
  Object.freeze({ id: 4, time: 0.4, x: 0.56, y: 0.784 }),
]);
export const PROJECTILE_RULER = Object.freeze({ drop: 0.8, range: 0.56 });
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
const blend = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
export function projectileInitialMode(variant?: string): ProjectileMode {
  return variant?.includes('parabola')
    ? 'parabola'
    : variant?.includes('launch-speed')
      ? 'speed'
      : 'strobe';
}
/** Same SI coordinate system for all front-facing contact surfaces. */
export function horizontalContact(surfaceY: number, radius = PROJECTILE_RADIUS) {
  if (![surfaceY, radius].every(Number.isFinite) || radius < 0 || surfaceY < radius)
    throw new RangeError('Surface must lie at least one radius below origin');
  return { surfaceY, centerY: surfaceY - radius, radius };
}
export function verticalContact(surfaceX: number, speed: number, radius = PROJECTILE_RADIUS) {
  if (![surfaceX, radius].every(Number.isFinite) || radius < 0 || surfaceX < radius)
    throw new RangeError('Surface must lie at least one radius beyond origin');
  return { ...wallIntercept(surfaceX - radius, speed), surfaceX, radius };
}
/** The solver describes the center path; the rail's closest surface is its normal offset. */
export function rollingSupport(
  x: number,
  height = 0.14,
  length = 0.35,
  radius = PROJECTILE_RADIUS,
  thickness = 0.008,
) {
  if (
    ![x, height, length, radius, thickness].every(Number.isFinite) ||
    height <= 0 ||
    length <= 0 ||
    radius < 0 ||
    thickness < 0
  )
    throw new RangeError('Invalid rolling surface geometry');
  const xx = Math.min(0, Math.max(-length, x)),
    y = -height * (xx / length) ** 2,
    dy = (-2 * height * xx) / (length * length),
    n = Math.hypot(1, dy),
    nx = -dy / n,
    ny = 1 / n;
  return {
    center: { x: xx, y },
    surface: { x: xx + radius * nx, y: y + radius * ny },
    stroke: { x: xx + (radius + thickness / 2) * nx, y: y + (radius + thickness / 2) * ny },
    normal: { x: nx, y: ny },
  };
}
export function recoverFromRanges(r1: number, r2: number, bx = -0.12, y1 = 0.12, y2 = 0.72) {
  if (![r1, r2, bx, y1, y2].every(Number.isFinite) || r1 < 0 || r2 < 0 || y1 === y2) return null;
  const d = Math.abs(y2 - y1);
  if (r1 + r2 < d - 1e-12 || Math.abs(r1 - r2) > d + 1e-12) return null;
  const y = (r1 * r1 - r2 * r2 + y2 * y2 - y1 * y1) / (2 * (y2 - y1));
  const xx = r1 * r1 - (y - y1) ** 2;
  if (xx < -1e-12) return null;
  const dx = Math.sqrt(Math.max(0, xx));
  return { left: { x: bx - dx, y }, right: { x: bx + dx, y } };
}
export function coordinateTime(y: number) {
  if (!Number.isFinite(y) || y < 0) throw new RangeError('Finite nonnegative center drop required');
  return Math.sqrt((2 * y) / PROJECTILE_G);
}
export function quadraticRatio(x: number, y: number) {
  if (![x, y].every(Number.isFinite) || x === 0) return null;
  return y / (x * x);
}
export function rulerPrediction(
  drop = PROJECTILE_RULER.drop,
  range = PROJECTILE_RULER.range,
  newDrop = 0.2,
) {
  const speed = reconstructLaunchSpeed(range, drop),
    time = coordinateTime(drop),
    newTime = coordinateTime(newDrop);
  return { drop, range, speed, time, newDrop, newTime, newRange: speed * newTime };
}
export function projectileVelocity(time: number, speed = PROJECTILE_SPEED, mass = 0.02) {
  if (![time, speed, mass].every(Number.isFinite) || mass <= 0 || speed < 0)
    throw new RangeError('Finite motion and positive mass required');
  const t = Math.max(0, time),
    vy = PROJECTILE_G * t;
  return {
    vx: speed,
    vy,
    ax: 0,
    ay: PROJECTILE_G,
    fx: 0,
    fy: mass * PROJECTILE_G,
    speed: Math.hypot(speed, vy),
    angle: Math.atan2(vy, speed),
  };
}
export function projectileCandidate(x: number, kind: 'linear' | 'quadratic') {
  if (!Number.isFinite(x) || x < 0) throw new RangeError('Finite nonnegative coordinate required');
  return kind === 'linear' ? 0.35 * x : 2.5 * x * x;
}
/** Normalized causal states. Measured bilingual speech maps onto this state axis below. */
export function projectileShot(chapter: number, progress: number) {
  const c = Math.trunc(clamp(chapter, 0, 7)),
    p = clamp(progress),
    prediction = p >= 0.28 && p < 0.66,
    locked = p >= 0.46 && p < 0.66;
  let mode: ProjectileMode = [
    'strobe',
    'pair',
    'carbon',
    'forces',
    'board',
    'wall',
    'parabola',
    'speed',
  ][c] as ProjectileMode;
  let time = 0,
    speed = PROJECTILE_SPEED,
    drop = 0.784,
    wall = 0.14,
    phase = 'motion',
    revealed = 0,
    showPrediction = false,
    showResult = false;
  let previousContact: Readonly<{ x: number; y: number }> | undefined;
  if (c === 0) {
    time = blend(p, 0.04, 0.5) * 0.4;
    phase = p < 0.55 ? 'motion' : 'projections';
  }
  if (c === 1) {
    const second = p >= 0.5;
    speed = second ? 2.8 : 1.4;
    time = blend(second ? p - 0.5 : p, 0.04, 0.43) * 0.4;
    phase = second ? 'faster' : 'first';
  }
  if (c === 2) {
    time = blend(p, 0.02, 0.38) * 0.4;
    revealed = Math.min(4, Math.floor(time / 0.1 + 1e-8));
    phase = p < 0.42 ? 'marks' : p < 0.65 ? 'coordinates' : 'inference';
  }
  if (c === 3) {
    time = blend(p, 0.1, 0.85) * 0.4;
    phase = p < 0.3 ? 'force' : 'velocity';
  }
  if (c === 4 || c === 5) {
    const second = p >= 0.28;
    phase = prediction ? (locked ? 'locked' : 'predict') : second ? 'test' : 'baseline';
    showPrediction = locked || p >= 0.66;
    showResult = p >= 0.94;
    if (second) previousContact = PROJECTILE_RECORDS[c === 4 ? 2 : 1];
    if (c === 4) drop = second ? 0.784 : 0.196;
    else {
      wall = second ? 0.28 : 0.14;
      drop = wallIntercept(wall, speed).y;
    }
    time = prediction
      ? 0
      : blend(p, second ? 0.66 : 0.02, second ? 0.94 : 0.23) * coordinateTime(drop);
  }
  if (c === 6) {
    phase =
      p < 0.22
        ? 'records'
        : p < 0.48
          ? 'candidates'
          : p < 0.65
            ? 'mechanism'
            : p < 0.83
              ? 'predict'
              : 'reveal';
    revealed = p >= 0.83 ? 4 : 3;
    showPrediction = p >= 0.74;
    showResult = p >= 0.83;
  }
  if (c === 7) {
    const q = rulerPrediction();
    speed = q.speed;
    const second = p >= 0.53;
    drop = second ? q.newDrop : q.drop;
    phase = p < 0.24 ? 'measure' : p < 0.53 ? 'infer' : p < 0.78 ? 'predict' : 'test';
    showPrediction = p >= 0.66;
    showResult = p >= 0.96;
    time =
      p < 0.24
        ? blend(p, 0.02, 0.2) * q.time
        : p < 0.53
          ? q.time
          : p < 0.78
            ? 0
            : blend(p, 0.78, 0.96) * q.newTime;
  }
  return {
    chapter: c,
    progress: p,
    mode,
    time,
    speed,
    drop,
    wall,
    phase,
    revealed,
    showPrediction,
    showResult,
    previousContact,
  };
}

/** Seconds relative to each chapter, including the recording's 0.45 s lead-in.
 * Actual independent word times: artifacts/teaching-principles/batch-8-timed-speech/.
 * Each pair binds a spoken event to the same deterministic normalized physical state.
 * These are presentation cuts, not a change to the SI trajectory clock.
 */
export const PROJECTILE_SPEECH_CUTS = {
  zh: [
    [
      [0, 0],
      [1, 0.04],
      [7.1, 0.5],
      [12.55, 0.55],
      [28, 1],
    ],
    [
      [0, 0],
      [3.9, 0.04],
      [17.2, 0.43],
      [18.2, 0.5],
      [18.6, 0.54],
      [24.2, 0.93],
      [28.5, 1],
    ],
    [
      [0, 0],
      [0.15, 0.02],
      [1.75, 0.38],
      [2.4, 0.42],
      [15.45, 0.65],
      [30, 1],
    ],
    [
      [0, 0],
      [17.5, 0.3],
      [23.4, 0.85],
      [31.5, 1],
    ],
    [
      [0, 0],
      [0.2, 0.02],
      [2.9, 0.23],
      [3.4, 0.28],
      [20.1, 0.46],
      [22.15, 0.66],
      [25.3, 0.94],
      [30, 1],
    ],
    [
      [0, 0.23],
      [1.6, 0.28],
      [15.8, 0.46],
      [17.95, 0.66],
      [19.5, 0.94],
      [29, 1],
    ],
    [
      [0, 0],
      [11.2, 0.22],
      [17.0, 0.34],
      [22.4, 0.48],
      [35.9, 0.65],
      [40.4, 0.74],
      [43.15, 0.83],
      [50, 1],
    ],
    [
      [0, 0],
      [0.4, 0.02],
      [4.7, 0.2],
      [21.1, 0.24],
      [28.4, 0.4],
      [38.6, 0.53],
      [46.65, 0.66],
      [49.1, 0.78],
      [50.5, 0.96],
      [51, 1],
    ],
  ],
  en: [
    [
      [0, 0],
      [1, 0.04],
      [7.8, 0.5],
      [12.95, 0.55],
      [28, 1],
    ],
    [
      [0, 0],
      [1.1, 0.04],
      [14.9, 0.43],
      [15.65, 0.5],
      [16.05, 0.54],
      [22.2, 0.93],
      [28.5, 1],
    ],
    [
      [0, 0],
      [0.15, 0.02],
      [1.55, 0.38],
      [1.95, 0.42],
      [16.0, 0.65],
      [30, 1],
    ],
    [
      [0, 0],
      [20.95, 0.3],
      [27.9, 0.85],
      [31.5, 1],
    ],
    [
      [0, 0],
      [0.2, 0.02],
      [2.25, 0.23],
      [2.55, 0.28],
      [17.6, 0.46],
      [19.9, 0.66],
      [22.5, 0.94],
      [30, 1],
    ],
    [
      [0, 0.23],
      [1.3, 0.28],
      [13.15, 0.46],
      [14.95, 0.66],
      [16.65, 0.94],
      [29, 1],
    ],
    [
      [0, 0],
      [10.05, 0.22],
      [14.6, 0.34],
      [21.1, 0.48],
      [31.95, 0.65],
      [37.2, 0.74],
      [41.1, 0.83],
      [50, 1],
    ],
    [
      [0, 0],
      [0.4, 0.02],
      [3.0, 0.2],
      [22.2, 0.24],
      [27.4, 0.4],
      [35.2, 0.53],
      [44.6, 0.66],
      [45.9, 0.78],
      [48.5, 0.96],
      [51, 1],
    ],
  ],
} as const;
export function projectileSpeechProgress(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en',
) {
  const c = Math.trunc(clamp(chapter, 0, 7)),
    t = Number.isFinite(chapterTime) ? Math.max(0, chapterTime) : 0,
    cuts = PROJECTILE_SPEECH_CUTS[locale === 'en' ? 'en' : 'zh'][c];
  for (let i = 1; i < cuts.length; i++) {
    const a = cuts[i - 1],
      b = cuts[i];
    if (t < b[0]) return a[1] + (b[1] - a[1]) * blend(t, a[0], b[0]);
  }
  return cuts[cuts.length - 1][1];
}
