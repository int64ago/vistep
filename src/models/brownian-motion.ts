/** Free, dilute spherical tracer: Markovian Langevin teaching model, SI internally.
 * No walls, mean flow, trapping, pair interactions or hydrodynamic memory.
 * Exact joint Gaussian (position, velocity) transitions, NOT Euler noise kicks.
 */
export const BROWNIAN = { kB: 1.380649e-23, density: 1050, seed: 137, duration: 176 } as const;
export type BrownianParameters = { temperature: number; viscosity: number; radius: number };
export const brownianDefault: BrownianParameters = {
  temperature: 300,
  viscosity: 1e-3,
  radius: 0.5e-6,
};
export function brownianCoefficients(p: BrownianParameters) {
  if (
    ![p.temperature, p.viscosity, p.radius].every(Number.isFinite) ||
    p.temperature < 0 ||
    p.temperature > 600 ||
    p.viscosity < 0.2e-3 ||
    p.viscosity > 20e-3 ||
    p.radius < 0.1e-6 ||
    p.radius > 3e-6
  )
    throw new RangeError('Brownian parameter outside teaching domain');
  const mass = (4 / 3) * Math.PI * p.radius ** 3 * BROWNIAN.density;
  const drag = 6 * Math.PI * p.viscosity * p.radius;
  return {
    mass,
    drag,
    tau: mass / drag,
    diffusion: (BROWNIAN.kB * p.temperature) / drag,
    velocityVariance: (BROWNIAN.kB * p.temperature) / mass,
  };
}
/** Small-h series avoids subtraction of three nearly equal exponentials. */
export function brownianKernel(h: number) {
  if (!Number.isFinite(h) || h < 0) throw new RangeError('Invalid reduced time');
  const b = -Math.expm1(-h),
    a = Math.exp(-h),
    vv = -Math.expm1(-2 * h);
  const xx =
    h < 0.001
      ? h ** 3 * (2 / 3 + h * (-1 / 2 + h * (7 / 30 + h * (-1 / 12 + (h * 31) / 1260))))
      : 2 * h - 2 * b - b * b;
  return { a, b, vv, xx: Math.max(0, xx), xv: b * b };
}
function hash(x: number) {
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return (x ^ (x >>> 15)) >>> 0;
}
/** Counter-addressed Gaussian; no global PRNG cursor can be changed by seeking. */
export function brownianNormal(seed: number, index: number) {
  const key = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  const u = (hash(key) + 0.5) / 4294967296;
  const v = (hash(key ^ 0x85ebca6b) + 0.5) / 4294967296;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export type BrownianAxis = { x: number; v: number };
export function brownianStep(
  s: BrownianAxis,
  dt: number,
  p: BrownianParameters,
  zVelocity: number,
  zPosition: number,
) {
  if (![s.x, s.v, dt, zVelocity, zPosition].every(Number.isFinite) || dt < 0)
    throw new RangeError('Invalid Brownian step');
  const c = brownianCoefficients(p),
    k = brownianKernel(dt / c.tau);
  const sigmaV = Math.sqrt(c.velocityVariance * k.vv);
  const coupledX =
    k.vv === 0 ? 0 : (Math.sqrt(c.velocityVariance) * c.tau * k.xv) / Math.sqrt(k.vv);
  const independentX = Math.sqrt(
    c.velocityVariance * c.tau ** 2 * Math.max(0, k.xx - (k.vv === 0 ? 0 : k.xv ** 2 / k.vv)),
  );
  const dx = c.tau * k.b * s.v + coupledX * zVelocity + independentX * zPosition;
  const v = k.a * s.v + sigmaV * zVelocity;
  const dragImpulse = -c.drag * dx;
  const thermalImpulse = c.mass * (v - s.v) - dragImpulse;
  return { x: s.x + dx, v, dragImpulse, thermalImpulse };
}
/** Equilibrium initial velocities; two observed Cartesian coordinates, hence factor 4. */
export function brownianMSD(p: BrownianParameters, time: number) {
  if (!Number.isFinite(time) || time < 0) throw new RangeError('Invalid MSD time');
  const c = brownianCoefficients(p),
    h = time / c.tau;
  const reduced =
    h < 0.001 ? h * h * (0.5 + h * (-1 / 6 + h * (1 / 24 - h / 120))) : h + Math.expm1(-h);
  return 4 * c.diffusion * c.tau * reduced;
}
export type BrownianPoint = {
  time: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  thermalX: number;
  dragX: number;
};
export type BrownianTrack = {
  parameters: BrownianParameters;
  seed: number;
  span: number;
  dt: number;
  points: BrownianPoint[];
};
export function brownianTrack(
  parameters: BrownianParameters,
  seed: number,
  span = 4,
  steps = 512,
  velocity?: [number, number],
): BrownianTrack {
  const c = brownianCoefficients(parameters);
  if (
    !Number.isInteger(seed) ||
    !Number.isInteger(steps) ||
    steps < 1 ||
    steps > 2048 ||
    !Number.isFinite(span) ||
    span <= 0 ||
    span > 10
  )
    throw new RangeError('Track budget exceeded');
  const dt = span / steps,
    speed = Math.sqrt(c.velocityVariance);
  const vx = velocity?.[0] ?? speed * brownianNormal(seed, 0),
    vy = velocity?.[1] ?? speed * brownianNormal(seed, 1);
  const points: BrownianPoint[] = [
    { time: 0, x: 0, y: 0, vx, vy, ox: 0, oy: 0, thermalX: 0, dragX: 0 },
  ];
  for (let i = 1; i <= steps; i++) {
    const s = points[i - 1];
    const x = brownianStep(
      { x: s.x, v: s.vx },
      dt,
      parameters,
      brownianNormal(seed, i * 4),
      brownianNormal(seed, i * 4 + 1),
    );
    const y = brownianStep(
      { x: s.y, v: s.vy },
      dt,
      parameters,
      brownianNormal(seed, i * 4 + 2),
      brownianNormal(seed, i * 4 + 3),
    );
    points.push({
      time: i * dt,
      x: x.x,
      y: y.x,
      vx: x.v,
      vy: y.v,
      ox: x.x + c.tau * (x.v - vx),
      oy: y.x + c.tau * (y.v - vy),
      thermalX: x.thermalImpulse,
      dragX: x.dragImpulse,
    });
  }
  return { parameters, seed, span, dt, points };
}
/** Linear exposure interpolation only; unresolved motion is not fabricated. */
export function brownianSample(track: BrownianTrack, time: number): BrownianPoint {
  if (!Number.isFinite(time)) throw new RangeError('Invalid sample time');
  const u = Math.max(0, Math.min(track.points.length - 1, time / track.dt));
  const i = Math.floor(u),
    j = Math.min(i + 1, track.points.length - 1),
    f = u - i;
  const a = track.points[i],
    b = track.points[j];
  return {
    time: Math.min(track.span, Math.max(0, time)),
    x: a.x + f * (b.x - a.x),
    y: a.y + f * (b.y - a.y),
    vx: a.vx + f * (b.vx - a.vx),
    vy: a.vy + f * (b.vy - a.vy),
    ox: a.ox + f * (b.ox - a.ox),
    oy: a.oy + f * (b.oy - a.oy),
    thermalX: a.thermalX,
    dragX: a.dragX,
  };
}
export function brownianStatistics(tracks: BrownianTrack[], time: number) {
  if (tracks.length < 1 || tracks.length > 256) throw new RangeError('Invalid ensemble');
  const samples = tracks.map((track) => brownianSample(track, time));
  let x = 0,
    y = 0,
    msd = 0;
  for (const s of samples) {
    x += s.x;
    y += s.y;
    msd += s.x * s.x + s.y * s.y;
  }
  return { x: x / samples.length, y: y / samples.length, msd: msd / samples.length, samples };
}
/** Integrated bath and drag impulses over the latest COMPLETE exposure window. */
export function brownianImpulse(track: BrownianTrack, time: number, windowSteps = 16) {
  if (
    !Number.isFinite(time) ||
    !Number.isInteger(windowSteps) ||
    windowSteps < 1 ||
    windowSteps > 2048
  )
    throw new RangeError('Invalid impulse window');
  const end = Math.max(
    0,
    Math.min(track.points.length - 1, Math.floor(time / track.dt / windowSteps) * windowSteps),
  );
  const start = Math.max(0, end - windowSteps),
    a = track.points[start],
    b = track.points[end],
    c = brownianCoefficients(track.parameters);
  const drag = -c.drag * (b.x - a.x),
    momentum = c.mass * (b.vx - a.vx);
  return {
    drag,
    thermal: momentum - drag,
    momentum,
    start: a.time,
    end: b.time,
    duration: windowSteps * track.dt,
  };
}
export type BrownianView =
  'trace' | 'impulse' | 'memory' | 'overdamped' | 'temperature' | 'resistance' | 'msd' | 'mean';
export const brownianViews: BrownianView[] = [
  'trace',
  'impulse',
  'memory',
  'overdamped',
  'temperature',
  'resistance',
  'msd',
  'mean',
];
export function brownianFilm(seed: number = BROWNIAN.seed) {
  const p = brownianDefault,
    c = brownianCoefficients(p);
  const base = brownianTrack(p, seed),
    inertial = brownianTrack(p, seed, 12 * c.tau, 384);
  const initial = inertial.points[0];
  const opening = { ...base, span: 1, points: base.points.filter((point) => point.time <= 1) };
  return {
    base,
    opening,
    inertial,
    cooling: brownianTrack({ ...p, temperature: 0 }, seed, 8 * c.tau, 256, [
      initial.vx,
      initial.vy,
    ]),
    hot: brownianTrack({ ...p, temperature: 450 }, seed),
    thick: brownianTrack({ ...p, viscosity: 3e-3 }, seed),
    large: brownianTrack({ ...p, radius: 1e-6 }, seed),
    ensemble: [base, ...Array.from({ length: 63 }, (_, i) => brownianTrack(p, hash(seed + i + 1)))],
  };
}
export type BrownianFilm = ReturnType<typeof brownianFilm>;
export function brownianShot(chapter: number, progress: number) {
  if (!Number.isFinite(progress) || !Number.isFinite(chapter))
    throw new RangeError('Invalid chapter');
  const index = Math.max(0, Math.min(7, Math.floor(chapter))),
    u = Math.max(0, Math.min(1, (progress - 0.06) / 0.86));
  const phase = u * u * (3 - 2 * u);
  const tau = brownianCoefficients(brownianDefault).tau;
  const durations = [1, 12 * tau, 8 * tau, 4, 3, 3, 2, 2];
  return { view: brownianViews[index], time: (index === 7 ? 2 : 0) + phase * durations[index] };
}
/** Fixed framing over a whole run, using actual paths and physical particle bounds. */
export function brownianExtent(tracks: BrownianTrack[], centroid = false) {
  let extent = centroid ? 0.02e-9 : 0.8e-6;
  for (const track of tracks)
    for (const p of track.points)
      extent = Math.max(extent, Math.hypot(p.x, p.y) + (centroid ? 0 : track.parameters.radius));
  return extent * 1.2;
}
