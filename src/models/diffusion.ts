/** Exact finite-mode solutions of c_t = D c_xx. No advection, reaction or particle clock. */
export type DiffusionKind = 'pulse' | 'mix' | 'reservoir';
export interface DiffusionOptions {
  D?: number;
  length?: number;
  mass?: number;
  kind?: DiffusionKind;
}
export interface DiffusionParameters {
  D: number;
  length: number;
  mass: number;
  kind: DiffusionKind;
}
export interface DiffusionMode {
  n: number;
  amplitude: number;
}
export interface DiffusionField {
  p: DiffusionParameters;
  time: number;
  species: 'A' | 'B';
  basis: 'cos' | 'sin';
  baseLeft: number;
  baseRight: number;
  modes: DiffusionMode[];
}
const finite = (v: number, name: string, min: number, max: number) => {
  if (!Number.isFinite(v) || v < min || v > max)
    throw new RangeError(`${name} outside [${min}, ${max}]`);
  return v;
};
export function diffusionParameters(o: DiffusionOptions = {}): DiffusionParameters {
  const kind = o.kind ?? 'pulse';
  if (!['pulse', 'mix', 'reservoir'].includes(kind))
    throw new RangeError('Unsupported initial/boundary problem');
  return {
    D: finite(o.D ?? 0.015, 'D', 0, 0.1),
    length: finite(o.length ?? 1, 'length', 0.5, 2),
    mass: finite(o.mass ?? 1, 'mass', 0.1, 2),
    kind,
  };
}
export function diffusionField(
  options: DiffusionOptions = {},
  time = 0,
  species: 'A' | 'B' = 'A',
): DiffusionField {
  const p = diffusionParameters(options);
  if (p.kind === 'reservoir' && p.mass !== 1)
    throw new RangeError('Reservoir problem prescribes concentration, not total mass');
  finite(time, 'time', 0, 120);
  if (species !== 'A' && species !== 'B') throw new RangeError('Unknown species');
  if (species === 'B' && p.kind !== 'mix')
    throw new RangeError('Second species only exists in mixing experiment');
  let modes: DiffusionMode[],
    basis: 'cos' | 'sin' = 'cos',
    baseLeft = p.mass / p.length,
    baseRight = baseLeft;
  if (p.kind === 'pulse')
    modes = [
      { n: 2, amplitude: -1.6 * baseLeft },
      { n: 4, amplitude: 0.8 * baseLeft },
      { n: 6, amplitude: (-8 / 35) * baseLeft },
      { n: 8, amplitude: (1 / 35) * baseLeft },
    ];
  else if (p.kind === 'mix')
    modes = [{ n: 1, amplitude: (species === 'A' ? 1 : -1) * 0.95 * baseLeft }];
  else {
    basis = 'sin';
    baseLeft = 1;
    baseRight = 0;
    modes = [{ n: 1, amplitude: -0.2 }];
  }
  return {
    p,
    time,
    species,
    basis,
    baseLeft,
    baseRight,
    modes: modes.map((m) => ({
      ...m,
      amplitude: m.amplitude * Math.exp(-p.D * ((m.n * Math.PI) / p.length) ** 2 * time),
    })),
  };
}
const position = (f: DiffusionField, x: number) =>
  finite(x, 'position', 0, f.p.length) / f.p.length;
export function diffusionValue(f: DiffusionField, x: number) {
  const r = position(f, x);
  let c = f.baseLeft + (f.baseRight - f.baseLeft) * r;
  for (const m of f.modes)
    c +=
      m.amplitude * (f.basis === 'cos' ? Math.cos(m.n * Math.PI * r) : Math.sin(m.n * Math.PI * r));
  return c; // Tiny negative roundoff at an exact zero is not clipped into a fake conserved solution.
}
export function diffusionGradient(f: DiffusionField, x: number) {
  const r = position(f, x);
  if (f.basis === 'cos' && (r === 0 || r === 1)) return 0;
  let g = (f.baseRight - f.baseLeft) / f.p.length;
  for (const m of f.modes) {
    const k = (m.n * Math.PI) / f.p.length;
    g +=
      m.amplitude *
      k *
      (f.basis === 'cos' ? -Math.sin(m.n * Math.PI * r) : Math.cos(m.n * Math.PI * r));
  }
  return g;
}
export const diffusionFlux = (f: DiffusionField, x: number) => {
  const g = diffusionGradient(f, x);
  return g === 0 || f.p.D === 0 ? 0 : -f.p.D * g;
};
export function diffusionTimeDerivative(f: DiffusionField, x: number) {
  const r = position(f, x);
  return f.modes.reduce(
    (sum, m) =>
      sum -
      f.p.D *
        ((m.n * Math.PI) / f.p.length) ** 2 *
        m.amplitude *
        (f.basis === 'cos' ? Math.cos(m.n * Math.PI * r) : Math.sin(m.n * Math.PI * r)),
    0,
  );
}
export function diffusionIntegral(f: DiffusionField, a = 0, b = f.p.length) {
  position(f, a);
  position(f, b);
  if (b < a) throw new RangeError('Reversed integration interval');
  let sum =
    f.baseLeft * (b - a) + ((f.baseRight - f.baseLeft) * (b * b - a * a)) / (2 * f.p.length);
  for (const m of f.modes) {
    const k = (m.n * Math.PI) / f.p.length;
    sum +=
      (m.amplitude / k) *
      (f.basis === 'cos' ? Math.sin(k * b) - Math.sin(k * a) : Math.cos(k * a) - Math.cos(k * b));
  }
  return sum;
}
/** Exact cumulative boundary transfers from time zero. Right flux is positive outwards. */
export function diffusionBoundaryBudget(f: DiffusionField) {
  if (f.basis === 'cos') return { leftIn: 0, rightOut: 0, change: 0 };
  const initial = diffusionField(f.p, 0, f.species),
    L = f.p.length,
    D = f.p.D;
  let leftIn = ((-D * (f.baseRight - f.baseLeft)) / L) * f.time,
    rightOut = leftIn;
  for (const m of initial.modes) {
    const k = (m.n * Math.PI) / L,
      decay = -Math.expm1(-D * k * k * f.time);
    leftIn -= (m.amplitude / k) * decay;
    rightOut -= (m.amplitude / k) * Math.cos(m.n * Math.PI) * decay;
  }
  return { leftIn, rightOut, change: leftIn - rightOut };
}
export function diffusionDiagnostics(f: DiffusionField) {
  const L = f.p.length,
    mass = diffusionIntegral(f),
    a = f.baseLeft,
    b = f.baseRight - f.baseLeft;
  let moment1 = L * L * (a / 2 + b / 3),
    moment2 = L ** 3 * (a / 3 + b / 4),
    smoothingEnergy = 0,
    smoothingRate = 0;
  for (const m of f.modes) {
    const z = m.n * Math.PI,
      sign = m.n % 2 === 0 ? 1 : -1,
      k = z / L;
    if (f.basis === 'cos') {
      moment1 += (m.amplitude * L * L * (sign - 1)) / (z * z);
      moment2 += (m.amplitude * 2 * L ** 3 * sign) / (z * z);
    } else {
      moment1 -= (m.amplitude * L * L * sign) / z;
      moment2 += m.amplitude * L ** 3 * (-sign / z + (2 * (sign - 1)) / z ** 3);
    }
    smoothingEnergy += (L / 2) * m.amplitude * m.amplitude;
    smoothingRate -= f.p.D * L * k * k * m.amplitude * m.amplitude;
  }
  const mean = moment1 / mass,
    variance = moment2 / mass - mean * mean,
    initialMass = diffusionIntegral(diffusionField(f.p, 0, f.species)),
    budget = diffusionBoundaryBudget(f);
  return {
    mass,
    initialMass,
    mean,
    variance,
    equilibriumVariance: (L * L) / 12,
    smoothingEnergy,
    smoothingRate,
    dimensionlessTime: (f.p.D * f.time) / (L * L),
    leftFlux: diffusionFlux(f, 0),
    rightFlux: diffusionFlux(f, L),
    massRate: diffusionFlux(f, 0) - diffusionFlux(f, L),
    massResidual: mass - initialMass - budget.change,
    budget,
  };
}
export function diffusionSamples(f: DiffusionField, count = 120) {
  if (!Number.isInteger(count) || count < 8 || count > 512)
    throw new RangeError('Sample count outside [8,512]');
  const dx = f.p.length / count;
  return Array.from({ length: count }, (_, i) => ({
    x: (i + 0.5) * dx,
    concentration: diffusionIntegral(f, i * dx, (i + 1) * dx) / dx,
  }));
}
/** Illustrative absorption palette, not molecular colors or a calibrated optical measurement. */
export function diffusionColor(cA: number, cB = 0) {
  if (!Number.isFinite(cA) || !Number.isFinite(cB) || cA < -1e-12 || cB < -1e-12)
    throw new RangeError('Invalid displayed concentration');
  const a = Math.max(0, cA),
    b = Math.max(0, cB),
    paper = [237, 241, 237],
    ka = [0.65, 0.28, 0.12],
    kb = [0.04, 0.23, 0.65];
  return `rgb(${paper.map((v, i) => Math.round(25 + (v - 25) * Math.exp(-ka[i] * a - kb[i] * b))).join(',')})`;
}
export type DiffusionView =
  'release' | 'flux' | 'budget' | 'variance' | 'D' | 'length' | 'mix' | 'reservoir';
export function diffusionShot(chapter: number, progress: number) {
  finite(chapter, 'chapter', 0, 7);
  if (!Number.isInteger(chapter)) throw new RangeError('Chapter must be integer');
  finite(progress, 'progress', 0, 1);
  const q = progress;
  const options: DiffusionOptions = {};
  let comparison: DiffusionOptions | null = null,
    time = 0,
    view: DiffusionView = 'release';
  if (chapter === 0) time = 0.8 * q;
  if (chapter === 1) {
    view = 'flux';
    time = 0.15 + 2.35 * q;
  }
  if (chapter === 2) {
    view = 'budget';
    time = 0.3 + 3.2 * q;
  }
  if (chapter === 3) {
    view = 'variance';
    time = 0.1 + 17.9 * q;
  }
  if (chapter === 4) {
    view = 'D';
    options.D = 0.01;
    comparison = { D: 0.02 };
    time = 6 * q;
  }
  if (chapter === 5) {
    view = 'length';
    comparison = { length: 2 };
    time = 8 * q;
  }
  if (chapter === 6) {
    view = 'mix';
    options.kind = 'mix';
    time = 30 * q;
  }
  if (chapter === 7) {
    view = 'reservoir';
    options.kind = 'reservoir';
    time = 35 * q;
  }
  return { chapter, view, options, comparison, time, section: 0.67, region: [0.55, 0.85] as const };
}
