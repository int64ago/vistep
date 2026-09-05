/** Steady, incompressible, one-dimensional Venturi streamtube; SI units.
 * Q and inlet absolute pressure are prescribed. Outlet pressure is an output.
 * Mean-velocity kinetic correction is one. No transient, separation or cavitation solver.
 */
export const BERNOULLI = {
  length: 1.8,
  diameter: 0.06,
  areaRatio: 0.36,
  flow: 0.004,
  rise: 0,
  inletPressure: 113100,
  density: 998.2,
  gravity: 9.80665,
  ambient: 101325,
  vapor: 2338,
  friction: 0,
  cells: 240,
} as const;
export type BernoulliOptions = Partial<{ [K in keyof typeof BERNOULLI]: number }>;
export type BernoulliParameters = { [K in keyof typeof BERNOULLI]: number } & { area: number };
export type BernoulliStation = {
  s: number;
  x: number;
  z: number;
  area: number;
  diameter: number;
  velocity: number;
  pressure: number;
  pressureHead: number;
  velocityHead: number;
  totalHead: number;
  hydraulicHead: number;
  loss: number;
  volume: number;
};
export type BernoulliRun = {
  parameters: BernoulliParameters;
  stations: BernoulliStation[];
  status: 'valid' | 'vapor-boundary';
  inletPressure: number;
  limitingInletPressure: number;
  minimumPressure: number;
  minimumIndex: number;
  minimumPosition: number;
  totalVolume: number;
  transit: number | null;
};
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => {
  const q = clamp(v);
  return q * q * (3 - 2 * q);
};
export function bernoulliParameters(options: BernoulliOptions = {}): BernoulliParameters {
  const p = { ...BERNOULLI, ...options };
  if (Object.values(p).some((v) => !Number.isFinite(v)))
    throw new RangeError('Finite parameters required.');
  if (
    p.length < 0.5 ||
    p.length > 10 ||
    p.diameter < 0.02 ||
    p.diameter > 0.2 ||
    p.areaRatio < 0.2 ||
    p.areaRatio > 1 ||
    p.flow < 0 ||
    p.flow > 0.02 ||
    Math.abs(p.rise) > p.length * 0.5 ||
    p.inletPressure < p.vapor ||
    p.inletPressure > 1e6 ||
    p.density <= 0 ||
    p.gravity <= 0 ||
    p.ambient <= p.vapor ||
    p.vapor <= 0 ||
    p.friction < 0 ||
    p.friction > 0.1 ||
    p.cells < 40 ||
    p.cells > 1920 ||
    !Number.isInteger(p.cells)
  )
    throw new RangeError('Outside the positive-flow, liquid-only teaching domain.');
  return { ...p, area: (Math.PI * p.diameter ** 2) / 4 };
}
/** Circular area changes smoothly. The coordinate s is distance along the inclined centerline. */
export function bernoulliGeometry(p: BernoulliParameters, s: number) {
  if (!Number.isFinite(s) || s < 0 || s > p.length)
    throw new RangeError('Position outside the finite tube.');
  const w = s / p.length;
  const neck = smooth((w - 0.18) / 0.2) - smooth((w - 0.52) / 0.32);
  const area = p.area * (1 + (p.areaRatio - 1) * neck);
  return {
    s,
    x: s * Math.sqrt(1 - (p.rise / p.length) ** 2),
    z: p.rise * w,
    area,
    diameter: Math.sqrt((4 * area) / Math.PI),
  };
}
function integratedRamp(w: number, a: number, b: number) {
  if (w <= a) return 0;
  if (w >= b) return (b - a) / 2 + w - b;
  const u = (w - a) / (b - a);
  return (b - a) * (u ** 3 - u ** 4 / 2);
}
/** Analytic integral of A(s), so material coordinates conserve actual circular-tube volume. */
export function bernoulliVolume(p: BernoulliParameters, s: number) {
  bernoulliGeometry(p, s);
  const w = s / p.length;
  return (
    p.area *
    p.length *
    (w + (p.areaRatio - 1) * (integratedRamp(w, 0.18, 0.38) - integratedRamp(w, 0.52, 0.84)))
  );
}
export function bernoulliPosition(p: BernoulliParameters, volume: number) {
  const total = bernoulliVolume(p, p.length);
  if (!Number.isFinite(volume) || volume < 0 || volume > total)
    throw new RangeError('Volume outside the finite tube.');
  if (volume === 0) return 0;
  if (volume === total) return p.length;
  let lo = 0,
    hi = p.length;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (bernoulliVolume(p, mid) < volume) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const lossRate = (p: BernoulliParameters, s: number) => {
  const g = bernoulliGeometry(p, s),
    v = p.flow / g.area;
  return (p.friction * v * v) / (2 * p.gravity * g.diameter);
};
export function solveBernoulli(options: BernoulliOptions = {}): BernoulliRun {
  const p = bernoulliParameters(options),
    dx = p.length / p.cells;
  const inletVelocityHead = (p.flow / p.area) ** 2 / (2 * p.gravity);
  let loss = 0,
    minDelta = Infinity,
    minIndex = 0;
  const provisional = Array.from({ length: p.cells + 1 }, (_, i) => {
    const s = i === p.cells ? p.length : i * dx,
      g = bernoulliGeometry(p, s);
    if (i > 0) {
      const cuts = [
        s - dx,
        ...[0.18, 0.38, 0.52, 0.84].map((w) => w * p.length).filter((v) => v > s - dx && v < s),
        s,
      ];
      for (let j = 1; j < cuts.length; j++) {
        const a = cuts[j - 1],
          b = cuts[j];
        loss += ((b - a) / 6) * (lossRate(p, a) + 4 * lossRate(p, (a + b) / 2) + lossRate(p, b));
      }
    }
    const velocity = p.flow / g.area,
      velocityHead = velocity ** 2 / (2 * p.gravity);
    const deltaHead = inletVelocityHead - velocityHead - g.z - loss;
    if (deltaHead < minDelta) {
      minDelta = deltaHead;
      minIndex = i;
    }
    return { ...g, velocity, velocityHead, loss, deltaHead, volume: bernoulliVolume(p, s) };
  });
  const deltaAt = (s: number) => {
    const u = s / dx,
      i = Math.min(p.cells - 1, Math.floor(u)),
      q = u - i;
    const localLoss = provisional[i].loss * (1 - q) + provisional[i + 1].loss * q;
    const g = bernoulliGeometry(p, s);
    return inletVelocityHead - (p.flow / g.area) ** 2 / (2 * p.gravity) - g.z - localLoss;
  };
  let minimumPosition = provisional[minIndex].s;
  // Refine smooth local minima between nodes using the same interpolated loss as probes.
  // A grid-node-only vapor test can otherwise miss an interior minimum.
  for (let i = 1; i < p.cells; i++)
    if (
      provisional[i].deltaHead <= provisional[i - 1].deltaHead &&
      provisional[i].deltaHead <= provisional[i + 1].deltaHead &&
      (provisional[i].deltaHead < provisional[i - 1].deltaHead ||
        provisional[i].deltaHead < provisional[i + 1].deltaHead)
    ) {
      let a = provisional[i - 1].s,
        b = provisional[i + 1].s;
      for (let k = 0; k < 55; k++) {
        const l = a + (b - a) / 3,
          r = b - (b - a) / 3;
        if (deltaAt(l) < deltaAt(r)) b = r;
        else a = l;
      }
      const s = (a + b) / 2,
        delta = deltaAt(s);
      if (delta < minDelta) {
        minDelta = delta;
        minimumPosition = s;
        minIndex = i;
      }
    }
  // Shift the entire requested steady solution to its first fully liquid boundary.
  // The rejected pressure field is never exposed or advected as a valid liquid state.
  const limitingInletPressure = p.vapor - p.density * p.gravity * minDelta;
  const status = p.inletPressure <= limitingInletPressure ? 'vapor-boundary' : 'valid';
  const inletPressure = Math.max(p.inletPressure, limitingInletPressure);
  const stations = provisional.map(({ deltaHead, ...g }) => {
    const pressure = Math.max(p.vapor, inletPressure + p.density * p.gravity * deltaHead);
    const pressureHead = (pressure - p.ambient) / (p.density * p.gravity);
    const hydraulicHead = g.z + pressureHead;
    return {
      ...g,
      pressure,
      pressureHead,
      hydraulicHead,
      totalHead: hydraulicHead + g.velocityHead,
    };
  });
  const totalVolume = bernoulliVolume(p, p.length);
  return {
    parameters: p,
    stations,
    status,
    inletPressure,
    limitingInletPressure,
    minimumPressure: Math.max(p.vapor, inletPressure + p.density * p.gravity * minDelta),
    minimumIndex: minIndex,
    minimumPosition,
    totalVolume,
    transit: p.flow === 0 ? null : totalVolume / p.flow,
  };
}
/** Spatial interpolation of loss only; geometry and Bernoulli balance remain evaluated at s. */
export function bernoulliAt(run: BernoulliRun, s: number): BernoulliStation {
  const p = run.parameters,
    g = bernoulliGeometry(p, s),
    u = (s / p.length) * p.cells;
  const i = Math.min(p.cells - 1, Math.floor(u)),
    q = u - i;
  const loss = run.stations[i].loss * (1 - q) + run.stations[i + 1].loss * q;
  const velocity = p.flow / g.area,
    velocityHead = velocity ** 2 / (2 * p.gravity);
  const totalHead =
    (run.inletPressure - p.ambient) / (p.density * p.gravity) +
    (p.flow / p.area) ** 2 / (2 * p.gravity) -
    loss;
  const hydraulicHead = totalHead - velocityHead,
    pressureHead = hydraulicHead - g.z;
  return {
    ...g,
    loss,
    velocity,
    velocityHead,
    totalHead,
    hydraulicHead,
    pressureHead,
    pressure: p.ambient + p.density * p.gravity * pressureHead,
    volume: bernoulliVolume(p, s),
  };
}
export type BernoulliParcel = {
  id: number;
  start: number;
  end: number;
  volume: number;
  complete: boolean;
};
/** Translating volume coordinate V by Q*t gives ds/dt=Q/A. No periodic wrapping of an identity. */
export function bernoulliParcels(
  run: BernoulliRun,
  time: number,
  onlyTracked = false,
): BernoulliParcel[] {
  if (!Number.isFinite(time) || time < 0) throw new RangeError('Time must be nonnegative.');
  const p = run.parameters,
    width = run.totalVolume * 0.065,
    pitch = run.totalVolume * 0.19;
  const advance = run.status === 'valid' ? p.flow * time : 0;
  const first = onlyTracked ? 0 : Math.ceil((-advance - width) / pitch),
    last = onlyTracked ? 0 : Math.floor((run.totalVolume - advance) / pitch);
  const parcels: BernoulliParcel[] = [];
  for (let id = first; id <= last; id++) {
    const left = id * pitch + advance,
      right = left + width;
    const a = clamp(left, 0, run.totalVolume),
      b = clamp(right, 0, run.totalVolume);
    if (b <= a) continue;
    parcels.push({
      id,
      start: bernoulliPosition(p, a),
      end: bernoulliPosition(p, b),
      volume: b - a,
      complete: left >= 0 && right <= run.totalVolume,
    });
  }
  return parcels;
}
export type BernoulliShot = {
  chapter: number;
  run: BernoulliRun;
  reference: BernoulliRun | null;
  probe: number;
  physicalTime: number;
  view: 'tube' | 'parcel' | 'heads' | 'recovery' | 'elevation' | 'static' | 'loss' | 'limit';
  comparingSteadyStates: boolean;
};
export function bernoulliShot(chapter: number, progress: number): BernoulliShot {
  const c = clamp(Math.floor(chapter), 0, 7),
    q = clamp(progress),
    e = smooth(q);
  const options: BernoulliOptions =
    c === 4
      ? { areaRatio: 1, rise: 0.45 * smooth((q - 0.15) / 0.65) }
      : c === 5
        ? { flow: 0, rise: 0.45, areaRatio: 1 }
        : c === 6
          ? { friction: 0.035 }
          : c === 7
            ? { inletPressure: 16000 - 13000 * e }
            : {};
  const run = solveBernoulli(options),
    L = run.parameters.length;
  return {
    chapter: c,
    run,
    reference: c === 6 ? solveBernoulli() : null,
    probe:
      (c === 2
        ? 0.08 + 0.37 * e
        : c === 3
          ? 0.45 + 0.48 * e
          : c === 5
            ? 0.08 + 0.85 * e
            : c === 6
              ? 0.08 + 0.85 * e
              : 0.45) * L,
    physicalTime:
      c === 1 ? q * (run.transit ?? 0) * 0.92 : c === 4 || c === 5 || c === 7 ? 0 : q * 0.88,
    view: (
      ['tube', 'parcel', 'heads', 'recovery', 'elevation', 'static', 'loss', 'limit'] as const
    )[c],
    comparingSteadyStates: c === 4 || c === 7,
  };
}
