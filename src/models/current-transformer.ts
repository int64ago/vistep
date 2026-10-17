export interface CTParameters {
  primaryRms: number;
  frequency: number;
  primaryTurns: number;
  secondaryTurns: number;
  burden: number;
  area: number;
  pathLength: number;
  permeability: number;
  knee: number;
  open: boolean;
  waveform: 'ac' | 'dc';
}
export const ctDefaults = (): CTParameters => ({
  primaryRms: 100,
  frequency: 50,
  primaryTurns: 1,
  secondaryTurns: 100,
  burden: 1,
  area: 2e-4,
  pathLength: 0.16,
  permeability: 10000,
  knee: 0.8,
  open: false,
  waveform: 'ac',
});
const mu0 = 4e-7 * Math.PI;
export const ctH = (b: number, p: CTParameters) =>
  (b / (mu0 * p.permeability)) * (1 + (b / p.knee) ** 8);
export const ctSlope = (b: number, p: CTParameters) =>
  (1 + 9 * (b / p.knee) ** 8) / (mu0 * p.permeability);
export const ctEnergy = (b: number, p: CTParameters) =>
  ((p.area * p.pathLength) / (mu0 * p.permeability)) * ((b * b) / 2 + b ** 10 / (10 * p.knee ** 8));
function validate(p: CTParameters) {
  if (
    ![
      p.primaryRms,
      p.frequency,
      p.primaryTurns,
      p.secondaryTurns,
      p.burden,
      p.area,
      p.pathLength,
      p.permeability,
      p.knee,
    ].every(Number.isFinite) ||
    p.primaryRms < 0 ||
    p.frequency <= 0 ||
    p.primaryTurns <= 0 ||
    p.secondaryTurns <= 0 ||
    p.burden <= 0 ||
    p.area <= 0 ||
    p.pathLength <= 0 ||
    p.permeability <= 0 ||
    p.knee <= 0 ||
    !['ac', 'dc'].includes(p.waveform)
  )
    throw new RangeError('Positive magnetic and circuit parameters required');
}
export function ctInverseH(h: number, p: CTParameters) {
  let lo = -10,
    hi = 10;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    if (ctH(mid, p) < h) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const cache = new Map<string, number[]>();
function trajectory(p: CTParameters) {
  const key = JSON.stringify([
    p.primaryRms,
    p.frequency,
    p.primaryTurns,
    p.secondaryTurns,
    p.burden,
    p.area,
    p.pathLength,
    p.permeability,
    p.knee,
  ]);
  const cached = cache.get(key);
  if (cached) return cached;
  const steps = 1024,
    dt = 1 / p.frequency / steps,
    peak = Math.SQRT2 * p.primaryRms,
    derivative = (b: number, time: number) =>
      (p.burden / (p.secondaryTurns ** 2 * p.area)) *
      (p.primaryTurns * peak * Math.sin(2 * Math.PI * p.frequency * time) -
        p.pathLength * ctH(b, p));
  const step = (b: number, time: number) => {
    const k1 = derivative(b, time),
      k2 = derivative(b + (dt * k1) / 2, time + dt / 2),
      k3 = derivative(b + (dt * k2) / 2, time + dt / 2),
      k4 = derivative(b + dt * k3, time + dt);
    return b + (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
  };
  const half = (start: number) => {
    let b = start;
    for (let i = 0; i < steps / 2; i++) b = step(b, i * dt);
    return b;
  };
  let hi = ctInverseH((p.primaryTurns * peak) / p.pathLength, p),
    lo = -hi;
  for (let i = 0; i < 38; i++) {
    const mid = (lo + hi) / 2;
    if (half(mid) + mid > 0) hi = mid;
    else lo = mid;
  }
  let b = (lo + hi) / 2;
  const values = [b];
  for (let i = 0; i < steps; i++) {
    b = step(b, i * dt);
    values.push(b);
  }
  if (values.some((v) => !Number.isFinite(v))) throw new RangeError('Magnetic integration failed');
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  cache.set(key, values);
  return values;
}
export function currentTransformer(p: CTParameters, theta: number) {
  validate(p);
  if (!Number.isFinite(theta)) throw new RangeError('Finite phase required');
  const phase = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    ip = p.waveform === 'dc' ? p.primaryRms : Math.SQRT2 * p.primaryRms * Math.sin(phase),
    dip =
      p.waveform === 'dc'
        ? 0
        : Math.SQRT2 * p.primaryRms * 2 * Math.PI * p.frequency * Math.cos(phase);
  let b: number, secondary: number, db: number;
  if (p.open || p.waveform === 'dc') {
    b = ctInverseH((p.primaryTurns * ip) / p.pathLength, p);
    secondary = 0;
    db = (p.primaryTurns * dip) / (p.pathLength * ctSlope(b, p));
  } else {
    const values = trajectory(p),
      q = (phase / (2 * Math.PI)) * (values.length - 1),
      i = Math.min(values.length - 2, Math.floor(q));
    b = values[i] + (values[i + 1] - values[i]) * (q - i);
    secondary = (p.primaryTurns * ip - p.pathLength * ctH(b, p)) / p.secondaryTurns;
    db = (p.burden * secondary) / (p.secondaryTurns * p.area);
  }
  const voltage = p.secondaryTurns * p.area * db,
    primaryVoltage = p.primaryTurns * p.area * db,
    excitingMMF = p.pathLength * ctH(b, p);
  return {
    ...p,
    theta: phase,
    primary: ip,
    secondary,
    b,
    db,
    voltage,
    primaryVoltage,
    excitingMMF,
    idealSecondary: (p.primaryTurns * ip) / p.secondaryTurns,
    burdenPower: p.open ? 0 : p.burden * secondary * secondary,
    magneticEnergy: ctEnergy(b, p),
    inputPower: primaryVoltage * ip,
  };
}
export function ctShot(chapter: number, progress: number) {
  const p = ctDefaults();
  if (chapter === 2) p.secondaryTurns = 200;
  if (chapter === 3) p.burden = 8;
  if (chapter === 4) p.open = true;
  if (chapter === 5) p.waveform = 'dc';
  return currentTransformer(p, 2 * Math.PI * (2 * Math.max(0, Math.min(1, progress)) + 0.125));
}
/** One continuous helical wire around a toroidal core, orthographic along its axis.
 * Back half of each turn is occluded by the core; front half is shown over it. */
export function ctWinding(turns: number) {
  return Array.from({ length: turns }, (_, turn) =>
    Array.from({ length: 13 }, (_, j) => {
      const psi = (j / 12) * Math.PI,
        u = (turn + psi / (2 * Math.PI)) / turns,
        a = -0.75 + 1.5 * u,
        r = 51 + 16 * Math.cos(psi);
      return [103 + r * Math.cos(a), 104 + r * Math.sin(a)] as [number, number];
    }),
  );
}
