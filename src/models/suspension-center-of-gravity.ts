export type Point2 = { x: number; y: number };
export const LAMINA_SHAPES = {
  irregular: [
    { x: -92, y: -72 },
    { x: 38, y: -88 },
    { x: 90, y: -25 },
    { x: 63, y: 70 },
    { x: -20, y: 92 },
    { x: -83, y: 32 },
  ],
  triangle: [
    { x: -85, y: 70 },
    { x: 10, y: -85 },
    { x: 92, y: 70 },
  ],
} satisfies Record<string, Point2[]>;
export const LAMINA_WEIGHT = { x: 45, y: 20 };
export const LAMINA_METRES_PER_UNIT = 0.003;
export const LAMINA_BOARD_MASS = 0.1;
export const SUSPENSION_G = 9.8;
const finitePoint = (p: Point2) => Number.isFinite(p.x) && Number.isFinite(p.y);
export function polygonCentroid(points: Point2[]) {
  if (points.length < 3 || !points.every(finitePoint))
    throw new RangeError('Finite polygon required.');
  let crossSum = 0,
    x = 0,
    y = 0,
    polar = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      q = points[(i + 1) % points.length],
      cross = p.x * q.y - q.x * p.y;
    crossSum += cross;
    x += (p.x + q.x) * cross;
    y += (p.y + q.y) * cross;
    polar += cross * (p.x * p.x + p.x * q.x + q.x * q.x + p.y * p.y + p.y * q.y + q.y * q.y);
  }
  if (Math.abs(crossSum) < 1e-9) throw new RangeError('Nondegenerate polygon required.');
  const cx = x / (3 * crossSum),
    cy = y / (3 * crossSum);
  return {
    x: cx,
    y: cy,
    area: Math.abs(crossSum) / 2,
    centralSecondMoment: polar / (6 * crossSum) - cx * cx - cy * cy,
  };
}
export function laminaCenter(points: Point2[], addedMass = 0) {
  if (!Number.isFinite(addedMass) || addedMass < 0)
    throw new RangeError('Nonnegative mass ratio required.');
  const c = polygonCentroid(points);
  return {
    x: (c.x + addedMass * LAMINA_WEIGHT.x) / (1 + addedMass),
    y: (c.y + addedMass * LAMINA_WEIGHT.y) / (1 + addedMass),
  };
}
export function suspensionHoles(points: Point2[]) {
  const c = polygonCentroid(points);
  return points.map((p) => ({ x: p.x + 0.08 * (c.x - p.x), y: p.y + 0.08 * (c.y - p.y) }));
}
export function suspensionState(points: Point2[], pivotIndex: number, addedMass = 0) {
  if (!Number.isFinite(pivotIndex)) throw new RangeError('Finite pivot index required.');
  const holes = suspensionHoles(points),
    pivot = holes[((Math.floor(pivotIndex) % points.length) + points.length) % points.length];
  const center = laminaCenter(points, addedMass),
    angle = Math.PI / 2 - Math.atan2(center.y - pivot.y, center.x - pivot.x);
  const transform = (p: Point2) => rotateAbout(p, pivot, angle);
  return { pivot, center, angle, transform, centerWorld: transform(center) };
}
export function rotateAbout(p: Point2, pivot: Point2, angle: number): Point2 {
  const dx = p.x - pivot.x,
    dy = p.y - pivot.y;
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle),
    y: dx * Math.sin(angle) + dy * Math.cos(angle),
  };
}
/** SI inertia about the pin; addedMass is a ratio to the 0.10 kg board. */
export function laminaMechanics(points: Point2[], pivotIndex: number, addedMass = 0) {
  const state = suspensionState(points, pivotIndex, addedMass),
    c = polygonCentroid(points),
    s = LAMINA_METRES_PER_UNIT;
  const inertia =
    LAMINA_BOARD_MASS *
    s *
    s *
    (c.centralSecondMoment +
      (c.x - state.pivot.x) ** 2 +
      (c.y - state.pivot.y) ** 2 +
      addedMass *
        ((LAMINA_WEIGHT.x - state.pivot.x) ** 2 + (LAMINA_WEIGHT.y - state.pivot.y) ** 2));
  const distance = Math.hypot(state.center.x - state.pivot.x, state.center.y - state.pivot.y) * s;
  return { ...state, mass: LAMINA_BOARD_MASS * (1 + addedMass), inertia, distance };
}
export type PendulumParameters = {
  mass: number;
  distance: number;
  inertia: number;
  gamma?: number;
  initialOffset?: number;
  initialVelocity?: number;
};
/** Clockwise-positive coordinates, nonlinear gravity and viscous torque -2γIω. */
export function physicalPendulum(parameters: PendulumParameters, seconds: number) {
  const {
    mass,
    distance,
    inertia,
    gamma = 1.2,
    initialOffset = 0.45,
    initialVelocity = 0,
  } = parameters;
  if (
    ![mass, distance, inertia, gamma, initialOffset, initialVelocity, seconds].every(
      Number.isFinite,
    ) ||
    mass <= 0 ||
    distance < 0 ||
    inertia <= 0 ||
    gamma < 0 ||
    seconds < 0 ||
    seconds > 60
  )
    throw new RangeError('Finite physical pendulum parameters and time in [0,60] required.');
  const k = (mass * SUSPENSION_G * distance) / inertia,
    dt = 1 / 240;
  const key = [mass, distance, inertia, gamma, initialOffset, initialVelocity].join(':');
  let track = trajectories.get(key);
  if (!track) {
    if (trajectories.size > 80) trajectories.clear();
    track = [[initialOffset, initialVelocity]];
    trajectories.set(key, track);
  }
  const step = (a: number, v: number, h: number): [number, number] => {
    const f = (q: number, w: number) => -k * Math.sin(q) - 2 * gamma * w;
    const a1 = v,
      v1 = f(a, v),
      a2 = v + (h * v1) / 2,
      v2 = f(a + (h * a1) / 2, v + (h * v1) / 2),
      a3 = v + (h * v2) / 2,
      v3 = f(a + (h * a2) / 2, v + (h * v2) / 2),
      a4 = v + h * v3,
      v4 = f(a + h * a3, v + h * v3);
    return [a + (h * (a1 + 2 * a2 + 2 * a3 + a4)) / 6, v + (h * (v1 + 2 * v2 + 2 * v3 + v4)) / 6];
  };
  const n = Math.floor(seconds / dt);
  while (track.length <= n) {
    const last = track[track.length - 1];
    track.push(step(last[0], last[1], dt));
  }
  const last = track[n],
    [offset, velocity] = step(last[0], last[1], seconds - n * dt);
  return {
    offset,
    velocity,
    acceleration: -k * Math.sin(offset) - 2 * gamma * velocity,
    energy:
      0.5 * inertia * velocity * velocity + mass * SUSPENSION_G * distance * (1 - Math.cos(offset)),
    gravityTorque: -mass * SUSPENSION_G * distance * Math.sin(offset),
    dampingTorque: -2 * gamma * inertia * velocity,
  };
}
const trajectories = new Map<string, [number, number][]>();
export function suspensionMotion(
  points: Point2[],
  pivotIndex: number,
  seconds: number,
  addedMass = 0,
  initialAngle?: number,
  gamma = 1.2,
) {
  const m = laminaMechanics(points, pivotIndex, addedMass),
    p = physicalPendulum(
      { ...m, gamma, initialOffset: initialAngle === undefined ? 0.45 : initialAngle - m.angle },
      seconds,
    ),
    angle = m.angle + p.offset;
  const transform = (q: Point2) => rotateAbout(q, m.pivot, angle),
    centerWorld = transform(m.center),
    leverArm = centerWorld.x * LAMINA_METRES_PER_UNIT;
  return {
    ...m,
    ...p,
    angle,
    transform,
    centerWorld,
    leverArm,
    settled: Math.abs(leverArm) < 0.00025 && Math.abs(p.velocity) < 0.002,
  };
}
/** Compatibility helper now follows the nonlinear model; initial offset is 0.18 radians. */
export function suspensionOffset(
  points: Point2[],
  pivotIndex: number,
  seconds: number,
  addedMass = 0,
) {
  const m = laminaMechanics(points, pivotIndex, addedMass);
  return physicalPendulum({ ...m, initialOffset: 0.18 }, Math.max(0, seconds)).offset;
}
export type PlumbRecord = {
  pivot: Point2;
  angle: number;
  massRatio: number;
  ends: readonly [Point2, Point2];
};
/** Record a world vertical through the pin, inverse-transformed into the material. No centre argument. */
export function recordPlumb(pivot: Point2, angle: number, massRatio: number): PlumbRecord {
  if (!finitePoint(pivot) || ![angle, massRatio].every(Number.isFinite) || massRatio < 0)
    throw new RangeError('Finite observed pose required.');
  const direction = { x: Math.sin(angle), y: Math.cos(angle) };
  const ends = [
    Object.freeze({ x: pivot.x - 220 * direction.x, y: pivot.y - 220 * direction.y }),
    Object.freeze({ x: pivot.x + 320 * direction.x, y: pivot.y + 320 * direction.y }),
  ] as const;
  return Object.freeze({
    pivot: Object.freeze({ ...pivot }),
    angle,
    massRatio,
    ends: Object.freeze(ends),
  });
}
export function settledRecord(points: Point2[], pivotIndex: number, massRatio = 0) {
  const m = suspensionMotion(points, pivotIndex, 10, massRatio);
  if (!m.settled) throw new RangeError('Record requires a settled pose.');
  return recordPlumb(m.pivot, m.angle, massRatio);
}
/** Retained static helper for external consumers; new observations use recordPlumb. */
export function plumbTrace(pivot: Point2, center: Point2) {
  if (Math.hypot(center.x - pivot.x, center.y - pivot.y) < 1e-10)
    throw new RangeError('Pivot cannot equal center.');
  return [
    ...recordPlumb(pivot, Math.PI / 2 - Math.atan2(center.y - pivot.y, center.x - pivot.x), 0).ends,
  ];
}
export function lineIntersection(a: Point2, b: Point2, c: Point2, d: Point2) {
  if (![a, b, c, d].every(finitePoint)) return null;
  const ux = b.x - a.x,
    uy = b.y - a.y,
    vx = d.x - c.x,
    vy = d.y - c.y,
    den = ux * vy - uy * vx;
  const lengthProduct = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (lengthProduct === 0 || Math.abs(den) < 1e-10 * lengthProduct) return null;
  const q = ((c.x - a.x) * vy - (c.y - a.y) * vx) / den;
  return { x: a.x + q * ux, y: a.y + q * uy };
}
export function intersectRecords(records: readonly PlumbRecord[]) {
  if (records.length < 2) return null;
  const [a, b] = records.slice(-2);
  return lineIntersection(...a.ends, ...b.ends);
}
const clamp = (x: number) => Math.max(0, Math.min(1, x));
/** Deterministic causal phases. The measured locale clock below drives these phases. */
export function suspensionShot(chapter: number, progress: number) {
  const p = clamp(progress),
    c = Math.max(0, Math.min(3, Math.floor(chapter)));
  const kind: keyof typeof LAMINA_SHAPES = c === 3 ? 'triangle' : 'irregular';
  const points = LAMINA_SHAPES[kind];
  let pivot = c === 2 ? 2 : c === 3 ? 1 : 0,
    mass = 0,
    seconds = 10,
    held = false,
    initialAngle: number | undefined,
    plumb = c > 0,
    gravity = c === 0,
    medians = c === 3,
    showCenter = false,
    predict = false,
    shot = 'rest',
    recordProgress = 1;
  let records: PlumbRecord[] = [];
  if (c === 0) {
    held = p < 0.16;
    seconds = held ? 0 : Math.min(10, ((p - 0.16) / 0.68) * 10);
    shot = held ? 'held' : seconds < 9 ? 'turning' : 'balance';
    showCenter = true;
  }
  if (c === 1) {
    records = p > 0.18 ? [settledRecord(points, 0)] : [];
    recordProgress = clamp((p - 0.18) / 0.15);
    shot = p < 0.18 ? 'vertical' : p < 0.38 ? 'first-mark' : 'candidates';
  }
  if (c === 2) {
    records = [settledRecord(points, 0)];
    held = p < 0.14;
    initialAngle = suspensionState(points, 2).angle + 0.35;
    seconds = held ? 0 : Math.min(10, ((p - 0.14) / 0.48) * 10);
    shot =
      p < 0.14 ? 'rehang' : p < 0.65 ? 'old-ink-turns' : p < 0.78 ? 'second-mark' : 'intersection';
    if (p >= 0.65)
      records.push(
        recordPlumb(
          suspensionHoles(points)[pivot],
          suspensionMotion(points, pivot, 10, 0, initialAngle).angle,
          0,
        ),
      );
    recordProgress = clamp((p - 0.65) / 0.12);
    showCenter = p >= 0.78;
  }
  if (c === 3) {
    const uniformSecondAngle = suspensionState(points, 2).angle + 0.25;
    if (p >= 0.1) records.push(settledRecord(points, 1));
    if (p >= 0.13) {
      pivot = 2;
      initialAngle = uniformSecondAngle;
      held = p < 0.15;
      seconds = held ? 0 : Math.min(10, ((p - 0.15) / 0.09) * 10);
    }
    if (p >= 0.25) {
      const observed = suspensionMotion(points, 2, 10, 0, uniformSecondAngle);
      records.push(recordPlumb(observed.pivot, observed.angle, 0));
    }
    mass = p >= 0.34 ? 0.75 : 0;
    if (p >= 0.29) held = p < 0.48;
    predict = mass > 0 && p >= 0.43 && p < 0.75;
    gravity = mass > 0 && p >= 0.48;
    showCenter = (p >= 0.25 && p < 0.29) || p >= 0.94;
    if (mass > 0) {
      initialAngle = suspensionState(points, 2).angle;
      seconds = p < 0.48 ? 0 : Math.min(10, ((p - 0.48) / 0.23) * 10);
    }
    shot =
      p < 0.1
        ? 'median-predict'
        : p < 0.29
          ? 'median-test'
          : p < 0.34
            ? 'clamp'
            : p < 0.48
              ? 'predict-load'
              : p < 0.73
                ? 'loaded-turn'
                : p < 0.78
                  ? 'new-first-mark'
                  : p < 0.92
                    ? 'loaded-rehang'
                    : 'new-intersection';
    if (p >= 0.73) {
      const m = suspensionMotion(points, 2, 10, mass, initialAngle);
      records.push(recordPlumb(m.pivot, m.angle, mass));
    }
    if (p >= 0.78) {
      pivot = 0;
      initialAngle = suspensionState(points, 0, mass).angle + 0.3;
      held = p < 0.81;
      seconds = held ? 0 : Math.min(10, ((p - 0.81) / 0.1) * 10);
    }
    if (p >= 0.92) {
      const m = suspensionMotion(points, pivot, 10, mass, initialAngle);
      records.push(recordPlumb(m.pivot, m.angle, mass));
    }
  }
  const motion = suspensionMotion(points, pivot, seconds, mass, initialAngle);
  return {
    kind,
    points,
    pivot,
    mass,
    seconds,
    held,
    plumb,
    gravity,
    medians,
    showCenter,
    predict,
    shot,
    recordProgress,
    records,
    motion,
  };
}

/** Local chapter seconds, including the 0.45 s cue lead-in. These cut points are
 * bound to zh-b1d326b37d4a / en-a60530b2a6d8 independent word-time observations.
 * The second coordinate is the causal phase of suspensionShot, not physical time.
 * Slow observation and compressed settling share the same integrated trajectory. */
export const SUSPENSION_SPEECH_CUTS: Record<'zh' | 'en', readonly (readonly [number, number][])[]> =
  {
    zh: [
      [
        [0, 0],
        [9.25, 0.16],
        [14.3, 0.187064],
        [16.2, 0.206376],
        [19.9, 0.296],
        [22.65, 0.84],
        [34, 1],
      ],
      [
        [0, 0],
        [4.3, 0.180001],
        [7, 0.33],
        [11.57, 0.38],
        [28.5, 1],
      ],
      [
        [0, 0],
        [4.5, 0.14],
        [8.1, 0.1736],
        [12.3, 0.62],
        [12.73, 0.65],
        [15.47, 0.77],
        [17.8, 0.78],
        [37, 1],
      ],
      [
        [0, 0],
        [4.55, 0.1],
        [4.95, 0.13],
        [5.1, 0.15],
        [5.65, 0.15315],
        [6.1, 0.24],
        [6.2, 0.25],
        [7.35, 0.29],
        [9.4, 0.34],
        [25.65, 0.43],
        [29.55, 0.48],
        [31.4, 0.48805],
        [33.15, 0.71],
        [33.25, 0.73],
        [34.1, 0.78],
        [34.4, 0.81],
        [35.15, 0.8135],
        [35.9, 0.91],
        [36.05, 0.92],
        [36.6, 0.94],
        [50, 1],
      ],
    ],
    en: [
      [
        [0, 0],
        [11.1, 0.16],
        [16.7, 0.187064],
        [18.5, 0.206376],
        [20.2, 0.296],
        [22.65, 0.84],
        [34, 1],
      ],
      [
        [0, 0],
        [3.79, 0.180001],
        [7.15, 0.33],
        [12.61, 0.38],
        [28.5, 1],
      ],
      [
        [0, 0],
        [5.2, 0.14],
        [8.3, 0.1736],
        [12.45, 0.62],
        [12.69, 0.65],
        [14.27, 0.77],
        [16.65, 0.78],
        [37, 1],
      ],
      [
        [0, 0],
        [4.55, 0.1],
        [4.95, 0.13],
        [5.1, 0.15],
        [5.65, 0.15315],
        [6.1, 0.24],
        [6.2, 0.25],
        [6.95, 0.29],
        [8.75, 0.34],
        [22.1, 0.43],
        [27.8, 0.48],
        [29.55, 0.48805],
        [31.3, 0.71],
        [31.6, 0.73],
        [32.95, 0.78],
        [33.2, 0.81],
        [34.05, 0.8135],
        [34.9, 0.91],
        [35.05, 0.92],
        [35.5, 0.94],
        [50, 1],
      ],
    ],
  };
export function suspensionTimedShot(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
) {
  if (!Number.isFinite(chapterTime) || !Number.isFinite(chapter))
    throw new RangeError('Finite scene clock required.');
  const c = Math.max(0, Math.min(3, Math.floor(chapter))),
    t = Math.max(0, chapterTime),
    knots = SUSPENSION_SPEECH_CUTS[locale][c];
  let phase = knots[knots.length - 1][1];
  for (let i = 1; i < knots.length; i++)
    if (t <= knots[i][0]) {
      const [a, pa] = knots[i - 1],
        [b, pb] = knots[i];
      phase = pa + (pb - pa) * clamp((t - a) / (b - a));
      break;
    }
  const shot = suspensionShot(c, phase);
  // The direction is visible before the numerical prediction. The question itself
  // retains only the old ink and the specified added mass, never the new answer.
  const predictDirection =
    c === 3 && t >= (locale === 'zh' ? 21.4 : 20) && t < (locale === 'zh' ? 25.65 : 22.1);
  return { ...shot, predictDirection, phase };
}
