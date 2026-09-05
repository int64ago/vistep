/** Symmetric Joukowski airfoil in steady 2D incompressible potential flow.
 * The Kutta condition selects circulation. Bernoulli converts the resulting velocity to pressure.
 * Counterclockwise circulation is positive; laboratory inflow is horizontal to the right.
 */
export type AirfoilVector = { x: number; y: number };
export const AIRFOIL = {
  chord: 1,
  speed: 25,
  angle: 6,
  offset: 0.1,
  density: 1.225,
  pressure: 101325,
  panels: 512,
} as const;
export type AirfoilOptions = Partial<{ [K in keyof typeof AIRFOIL]: number }>;
export type AirfoilParameters = { [K in keyof typeof AIRFOIL]: number } & {
  alpha: number;
  a: number;
  center: number;
  radius: number;
  midpoint: number;
  gamma: number;
  dynamicPressure: number;
};
const add = (a: AirfoilVector, b: AirfoilVector) => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: AirfoilVector, b: AirfoilVector) => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: AirfoilVector, b: AirfoilVector) => ({
  x: a.x * b.x - a.y * b.y,
  y: a.x * b.y + a.y * b.x,
});
const scale = (a: AirfoilVector, s: number) => ({ x: a.x * s, y: a.y * s });
const div = (a: AirfoilVector, b: AirfoilVector) => {
  const d = b.x * b.x + b.y * b.y;
  return { x: (a.x * b.x + a.y * b.y) / d, y: (a.y * b.x - a.x * b.y) / d };
};
const rotate = (v: AirfoilVector, a: number) => ({
  x: v.x * Math.cos(a) - v.y * Math.sin(a),
  y: v.x * Math.sin(a) + v.y * Math.cos(a),
});
const root = (v: AirfoilVector) => {
  const r = Math.hypot(v.x, v.y);
  return {
    x: Math.sqrt(Math.max(0, (r + v.x) / 2)),
    y: (v.y < 0 ? -1 : 1) * Math.sqrt(Math.max(0, (r - v.x) / 2)),
  };
};
const polar = (r: number, t: number) => ({ x: r * Math.cos(t), y: r * Math.sin(t) });
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => {
  const q = clamp(v);
  return q * q * (3 - 2 * q);
};
export function airfoilParameters(options: AirfoilOptions = {}): AirfoilParameters {
  const p = { ...AIRFOIL, ...options };
  if (
    Object.values(p).some((v) => !Number.isFinite(v)) ||
    p.chord < 0.2 ||
    p.chord > 3 ||
    p.speed <= 0 ||
    p.speed > 40 ||
    Math.abs(p.angle) > 8 ||
    p.offset < 0.08 ||
    p.offset > 0.16 ||
    p.density <= 0 ||
    p.pressure < 50000 ||
    p.panels < 64 ||
    p.panels > 4096 ||
    !Number.isInteger(p.panels)
  )
    throw new RangeError('Outside the positive-speed, small-incidence ideal-airfoil domain.');
  const alpha = (p.angle * Math.PI) / 180,
    a = p.chord / (2 + (1 + 2 * p.offset) + 1 / (1 + 2 * p.offset));
  const center = -p.offset * a,
    radius = (1 + p.offset) * a,
    leading = -a * (1 + 2 * p.offset) - a / (1 + 2 * p.offset);
  return {
    ...p,
    alpha,
    a,
    center,
    radius,
    midpoint: (2 * a + leading) / 2,
    gamma: alpha === 0 ? 0 : -4 * Math.PI * radius * p.speed * Math.sin(alpha),
    dynamicPressure: 0.5 * p.density * p.speed ** 2,
  };
}
/** The physical body is the conformal image of |ζ-center|=R, rotated into the wind frame. */
export function airfoilMap(p: AirfoilParameters, zeta: AirfoilVector): AirfoilVector {
  if (!Number.isFinite(zeta.x + zeta.y))
    throw new RangeError('Finite conformal coordinates required.');
  if (Math.hypot(zeta.x, zeta.y) < p.a * 1e-12) throw new RangeError('Excluded mapping pole.');
  const z = add(zeta, div({ x: p.a * p.a, y: 0 }, zeta));
  return rotate({ x: z.x - p.midpoint, y: z.y }, -p.alpha);
}
export function airfoilGeometry(p: AirfoilParameters, theta: number) {
  if (!Number.isFinite(theta)) throw new RangeError('Finite surface angle required.');
  const w = polar(p.radius, theta),
    zeta = add({ x: p.center, y: 0 }, w);
  const derivative = sub({ x: 1, y: 0 }, div({ x: p.a * p.a, y: 0 }, mul(zeta, zeta)));
  const tangent = rotate(mul(derivative, { x: -w.y, y: w.x }), -p.alpha);
  return { ...airfoilMap(p, zeta), zeta, tangent };
}
export function airfoilPreimage(p: AirfoilParameters, point: AirfoilVector) {
  if (!Number.isFinite(point.x + point.y) || Math.hypot(point.x, point.y) > p.chord * 1e6)
    throw new RangeError('Finite coordinates within the numerical exterior domain required.');
  const body = rotate(point, p.alpha),
    z = { x: body.x + p.midpoint, y: body.y };
  const d = root(sub(mul(z, z), { x: 4 * p.a * p.a, y: 0 }));
  const a = scale(add(z, d), 0.5),
    b = scale(sub(z, d), 0.5);
  return Math.hypot(a.x - p.center, a.y) >= Math.hypot(b.x - p.center, b.y) ? a : b;
}
function preimageVelocity(p: AirfoilParameters, zeta: AirfoilVector) {
  const w = sub(zeta, { x: p.center, y: 0 }),
    w2 = mul(w, w);
  const derivative = sub({ x: 1, y: 0 }, div({ x: p.a * p.a, y: 0 }, mul(zeta, zeta)));
  if (Math.hypot(derivative.x, derivative.y) < 1e-10) return null;
  // dW/dζ = U exp(-iα) - U R² exp(iα)/w² - i Γ/(2πw).
  const n = sub(
    sub(polar(p.speed, -p.alpha), div(polar(p.speed * p.radius * p.radius, p.alpha), w2)),
    div({ x: 0, y: p.gamma / (2 * Math.PI) }, w),
  );
  const q = div(n, derivative);
  return rotate({ x: q.x, y: -q.y }, -p.alpha);
}
export type AirfoilField =
  | {
      valid: true;
      x: number;
      y: number;
      u: number;
      v: number;
      speed: number;
      cp: number;
      pressure: number;
      stream: number;
    }
  | { valid: false; reason: 'solid' | 'mapping-singularity' };
export function airfoilField(p: AirfoilParameters, point: AirfoilVector): AirfoilField {
  const tail = rotate({ x: 2 * p.a - p.midpoint, y: 0 }, -p.alpha);
  // Test the physical cusp before inversion: the quadratic square root amplifies roundoff here.
  if (Math.hypot(point.x - tail.x, point.y - tail.y) < p.chord * 1e-10)
    return { valid: false, reason: 'mapping-singularity' };
  const zeta = airfoilPreimage(p, point),
    w = sub(zeta, { x: p.center, y: 0 }),
    r = Math.hypot(w.x, w.y);
  if (r < p.radius * (1 - 1e-10)) return { valid: false, reason: 'solid' };
  const velocity = preimageVelocity(p, zeta);
  if (!velocity) return { valid: false, reason: 'mapping-singularity' };
  const speed = Math.hypot(velocity.x, velocity.y),
    cp = 1 - (speed / p.speed) ** 2;
  const uniform = add(
    mul(polar(p.speed, -p.alpha), w),
    div(polar(p.speed * p.radius * p.radius, p.alpha), w),
  );
  const stream = uniform.y - (p.gamma / (2 * Math.PI)) * Math.log(r / p.radius);
  return {
    valid: true,
    x: point.x,
    y: point.y,
    u: velocity.x,
    v: velocity.y,
    speed,
    cp,
    pressure: p.pressure + p.dynamicPressure * cp,
    stream,
  };
}
export function airfoilTrailingLimit(p: AirfoilParameters) {
  const bodySpeed = (p.speed * Math.cos(p.alpha)) / (1 + p.offset),
    v = rotate({ x: bodySpeed, y: 0 }, -p.alpha);
  return { u: v.x, v: v.y, speed: bodySpeed, cp: 1 - (bodySpeed / p.speed) ** 2 };
}
export type AirfoilSurface = {
  theta: number;
  x: number;
  y: number;
  u: number;
  v: number;
  cp: number;
  pressure: number;
  nx: number;
  ny: number;
  ds: number;
  fx: number;
  fy: number;
};
export function airfoilSurface(p: AirfoilParameters, theta: number, dTheta = 1): AirfoilSurface {
  const g = airfoilGeometry(p, theta),
    velocity = preimageVelocity(p, g.zeta);
  if (!velocity) throw new RangeError('Exact trailing-edge 0/0 excluded; use the analytic limit.');
  const length = Math.hypot(g.tangent.x, g.tangent.y),
    cp = 1 - (Math.hypot(velocity.x, velocity.y) / p.speed) ** 2;
  if (length < 1e-14 * p.chord) throw new RangeError('Degenerate surface tangent.');
  const dp = p.dynamicPressure * cp;
  return {
    theta,
    x: g.x,
    y: g.y,
    u: velocity.x,
    v: velocity.y,
    cp,
    pressure: p.pressure + dp,
    nx: g.tangent.y / length,
    ny: -g.tangent.x / length,
    ds: length * dTheta,
    fx: -dp * g.tangent.y * dTheta,
    fy: dp * g.tangent.x * dTheta,
  };
}
export type AirfoilModel = {
  parameters: AirfoilParameters;
  surface: AirfoilSurface[];
  outline: AirfoilVector[];
  lift: number;
  drag: number;
  predictedLift: number;
  cl: number;
  minCp: number;
  maxLocalSpeed: number;
};
export function solveAirfoil(options: AirfoilOptions = {}): AirfoilModel {
  const p = airfoilParameters(options),
    dTheta = (2 * Math.PI) / p.panels;
  // Midpoint periodic quadrature never samples the exact cusp.
  const surface = Array.from({ length: p.panels }, (_, i) =>
    airfoilSurface(p, (i + 0.5) * dTheta, dTheta),
  );
  const drag = surface.reduce((v, s) => v + s.fx, 0),
    lift = surface.reduce((v, s) => v + s.fy, 0);
  return {
    parameters: p,
    surface,
    outline: Array.from({ length: p.panels + 1 }, (_, i) => airfoilGeometry(p, i * dTheta)),
    lift,
    drag,
    predictedLift: -p.density * p.speed * p.gamma,
    cl: lift / (p.dynamicPressure * p.chord),
    minCp: Math.min(...surface.map((s) => s.cp)),
    maxLocalSpeed: Math.max(...surface.map((s) => Math.hypot(s.u, s.v))),
  };
}
export function airfoilForcePrefix(model: AirfoilModel, fraction: number) {
  const count = clamp(fraction) * model.surface.length,
    n = Math.floor(count),
    part = count - n;
  let x = 0,
    y = 0;
  for (let i = 0; i < n; i++) {
    x += model.surface[i].fx;
    y += model.surface[i].fy;
  }
  if (n < model.surface.length) {
    x += model.surface[n].fx * part;
    y += model.surface[n].fy * part;
  }
  return { x, y, count: n, fraction: clamp(fraction) };
}
export function airfoilCirculation(p: AirfoilParameters, radiusFactor = 1.7, count = 256) {
  if (
    radiusFactor <= 1 ||
    !Number.isFinite(radiusFactor) ||
    count < 32 ||
    count > 4096 ||
    !Number.isInteger(count)
  )
    throw new RangeError('Closed exterior integration contour required.');
  const dt = (2 * Math.PI) / count,
    r = p.radius * radiusFactor;
  const samples = Array.from({ length: count }, (_, i) => {
    const theta = (i + 0.5) * dt,
      w = polar(r, theta),
      zeta = add({ x: p.center, y: 0 }, w),
      point = airfoilMap(p, zeta);
    const derivative = sub({ x: 1, y: 0 }, div({ x: p.a * p.a, y: 0 }, mul(zeta, zeta)));
    const tangent = rotate(mul(derivative, { x: -w.y, y: w.x }), -p.alpha);
    const v = preimageVelocity(p, zeta)!;
    return { ...point, u: v.x, v: v.y, contribution: (v.x * tangent.x + v.y * tangent.y) * dt };
  });
  return { samples, gamma: samples.reduce((sum, s) => sum + s.contribution, 0) };
}
export type AirfoilPathPoint = AirfoilVector & { time: number };
export type AirfoilPath = {
  points: AirfoilPathPoint[];
  arrival: number | null;
  reason: 'exit' | 'horizon' | 'guard';
};
function rk4(p: AirfoilParameters, point: AirfoilVector, h: number) {
  const v = (r: AirfoilVector) => {
    const f = airfoilField(p, r);
    return f.valid ? { x: f.u, y: f.v } : null;
  };
  const a = v(point);
  if (!a) return null;
  const b = v(add(point, scale(a, h / 2)));
  if (!b) return null;
  const c = v(add(point, scale(b, h / 2)));
  if (!c) return null;
  const d = v(add(point, scale(c, h)));
  if (!d) return null;
  return add(point, scale(add(add(a, scale(b, 2)), add(scale(c, 2), d)), h / 6));
}
/** Real-time parcel advection; immutable paths can be sampled in any seek order. */
export function traceAirfoil(
  p: AirfoilParameters,
  seed: AirfoilVector,
  step = 0.002,
  maxTau = 4,
): AirfoilPath {
  if (step < 0.00025 || step > 0.02 || maxTau <= 0 || maxTau > 8 || !Number.isFinite(step + maxTau))
    throw new RangeError('Invalid path integration settings.');
  if (!airfoilField(p, seed).valid) throw new RangeError('Parcel starts outside the fluid domain.');
  const base = (step * p.chord) / p.speed,
    end = (maxTau * p.chord) / p.speed,
    tailX = airfoilGeometry(p, 0).x;
  const points: AirfoilPathPoint[] = [{ ...seed, time: 0 }];
  let current = seed,
    time = 0,
    arrival: number | null = null;
  while (time < end && points.length < 32000) {
    let h = Math.min(base, end - time),
      next: AirfoilVector | null = null;
    for (let tries = 0; tries < 10; tries++) {
      next = rk4(p, current, h);
      if (next && airfoilField(p, next).valid) break;
      next = null;
      h /= 2;
    }
    if (!next) return { points, arrival, reason: 'guard' };
    if (arrival === null && current.x < tailX && next.x >= tailX)
      arrival = time + (h * (tailX - current.x)) / (next.x - current.x);
    time += h;
    points.push({ ...next, time });
    current = next;
    if (current.x > 1.05 * p.chord || Math.abs(current.y) > 1.1 * p.chord)
      return { points, arrival, reason: 'exit' };
  }
  return { points, arrival, reason: 'horizon' };
}
export function sampleAirfoilPath(path: AirfoilPath, time: number) {
  if (!Number.isFinite(time) || time < 0)
    throw new RangeError('Nonnegative finite physical time required.');
  const last = path.points.at(-1)!;
  if (time >= last.time) return { ...last, visible: path.reason !== 'exit' || time === last.time };
  let lo = 0,
    hi = path.points.length - 1;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (path.points[mid].time <= time) lo = mid;
    else hi = mid;
  }
  const a = path.points[lo],
    b = path.points[hi],
    f = (time - a.time) / (b.time - a.time);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, time, visible: true };
}
const pathCache = new Map<string, AirfoilPath[]>();
export function releaseAirfoilPaths() {
  pathCache.clear();
}
function cachePaths(key: string, create: () => AirfoilPath[]) {
  const prior = pathCache.get(key);
  if (prior) return prior;
  const paths = create();
  if (pathCache.size >= 8) pathCache.delete(pathCache.keys().next().value!);
  pathCache.set(key, paths);
  return paths;
}
export function airfoilPair(p: AirfoilParameters) {
  const key = 'pair' + JSON.stringify(p);
  return cachePaths(key, () => {
    const x = -0.85 * p.chord;
    let lo = -p.chord,
      hi = p.chord;
    // Equal offsets from the dividing streamline, at the same upstream x and release time.
    for (let i = 0; i < 50; i++) {
      const y = (lo + hi) / 2,
        f = airfoilField(p, { x, y });
      if (!f.valid) throw new Error('Upstream dividing-line bracket intersects solid.');
      if (f.stream > 0) hi = y;
      else lo = y;
    }
    const y = (lo + hi) / 2,
      gap = 0.035 * p.chord;
    return [traceAirfoil(p, { x, y: y + gap }), traceAirfoil(p, { x, y: y - gap })];
  });
}
export function airfoilStreamlines(p: AirfoilParameters) {
  return cachePaths('streams' + JSON.stringify(p), () =>
    [-0.44, -0.28, -0.15, -0.06, 0.06, 0.15, 0.28, 0.44].map((y) =>
      traceAirfoil(p, { x: -0.95 * p.chord, y: y * p.chord }, 0.006, 4),
    ),
  );
}
export type AirfoilShot = {
  chapter: number;
  model: AirfoilModel;
  reference: AirfoilModel | null;
  view:
    | 'symmetry'
    | 'incidence'
    | 'kutta'
    | 'forces'
    | 'parcels'
    | 'circulation'
    | 'reverse'
    | 'scaling';
  progress: number;
  physicalTime: number;
  delta: number;
  steadyFamily: boolean;
};
export function airfoilShot(chapter: number, progress: number): AirfoilShot {
  if (!Number.isFinite(chapter + progress))
    throw new RangeError('Finite director coordinates required.');
  const c = clamp(Math.floor(chapter), 0, 7),
    q = clamp(progress),
    e = smooth(q);
  const options: AirfoilOptions =
    c === 0
      ? { angle: 0 }
      : c === 1
        ? { angle: 6 * e }
        : c === 6
          ? { angle: 6 - 12 * e }
          : c === 7
            ? { speed: 15 + 15 * e }
            : {};
  const model = solveAirfoil(options),
    p = model.parameters;
  let physicalTime = (q * 2.6 * p.chord) / p.speed;
  if (c === 1 || c === 6 || c === 7) physicalTime = 0;
  if (c === 4) {
    const pair = airfoilPair(p);
    physicalTime = q * Math.max(...pair.map((a) => a.arrival ?? 0)) * 1.15;
  }
  return {
    chapter: c,
    model,
    reference: c === 7 ? solveAirfoil({ speed: 15 }) : null,
    view: (
      [
        'symmetry',
        'incidence',
        'kutta',
        'forces',
        'parcels',
        'circulation',
        'reverse',
        'scaling',
      ] as const
    )[c],
    progress: q,
    physicalTime,
    delta: 0.55 * (1 - e) + 0.035 * e,
    steadyFamily: c === 1 || c === 6 || c === 7,
  };
}
