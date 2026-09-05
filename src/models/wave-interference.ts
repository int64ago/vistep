/** Small-slope, lossless transverse string. SI units throughout. No time integrator. */
export const INTERFERENCE_STRING = {
  tension: 1,
  density: 0.01,
  amplitude: 0.004,
  halfWidth: 0.4,
  wavelength: 1.6,
} as const;
export const INTERFERENCE_DURATION = 176;
export type InterferenceMode = 'pulses' | 'phase' | 'trains' | 'standing';
export type InterferenceInput = {
  mode: InterferenceMode;
  time: number;
  ratio: number;
  phase: number;
  probe: number;
};
export const INTERFERENCE_DEFAULT: InterferenceInput = {
  mode: 'pulses',
  time: -0.08,
  ratio: -1,
  phase: 0,
  probe: 0.2,
};
export type StringJet = {
  y: number;
  dx: number;
  dt: number;
  dxx: number;
  dtt: number;
  dxt: number;
};
const zero = (): StringJet => ({ y: 0, dx: 0, dt: 0, dxx: 0, dtt: 0, dxt: 0 });
const clean = (x: number) => (Math.abs(x) < 1e-14 ? 0 : x);
const positive = (x: number) => {
  if (!Number.isFinite(x) || x <= 0) throw new RangeError('Expected positive finite value');
  return x;
};
export const stringSpeed = (
  tension: number = INTERFERENCE_STRING.tension,
  density: number = INTERFERENCE_STRING.density,
) => Math.sqrt(positive(tension) / positive(density));
const travelJet = (y: number, dx: number, dxx: number, direction: number): StringJet => {
  const c = stringSpeed();
  return {
    y: clean(y),
    dx: clean(dx),
    dt: clean(-direction * c * dx),
    dxx: clean(dxx),
    dtt: clean(c * c * dxx),
    dxt: clean(-direction * c * dxx),
  };
};

/** A compact C3 pulse: A cos^4(pi z / 2w), exactly zero outside |z| < w. */
export function stringPulse(
  x: number,
  time: number,
  direction: 1 | -1,
  amplitude: number = INTERFERENCE_STRING.amplitude,
): StringJet {
  if (![x, time, amplitude].every(Number.isFinite)) throw new RangeError('Non-finite pulse input');
  const w = INTERFERENCE_STRING.halfWidth,
    z = x - direction * stringSpeed() * time;
  if (Math.abs(z) >= w) return zero();
  const q = (Math.PI * z) / (2 * w),
    cs = Math.cos(q),
    sn = Math.sin(q);
  return travelJet(
    amplitude * cs ** 4,
    ((-2 * Math.PI * amplitude) / w) * cs ** 3 * sn,
    ((Math.PI ** 2 * amplitude) / w ** 2) * (3 * cs ** 2 * sn ** 2 - cs ** 4),
    direction,
  );
}

/** Quintic wavefront envelope and its derivatives in the traveling coordinate. */
function trainEnvelope(z: number, direction: 1 | -1) {
  const slope = -direction / 0.5,
    u = (-1.5 - direction * z) / 0.5;
  if (u <= 0) return { f: 0, dx: 0, dxx: 0 };
  if (u >= 1) return { f: 1, dx: 0, dxx: 0 };
  return {
    f: u ** 3 * (10 - 15 * u + 6 * u * u),
    dx: 30 * u * u * (1 - u) ** 2 * slope,
    dxx: 60 * u * (1 - u) * (1 - 2 * u) * slope * slope,
  };
}
export function stringHarmonic(
  x: number,
  time: number,
  direction: 1 | -1,
  amplitude: number,
  phase = 0,
  front = false,
): StringJet {
  if (![x, time, amplitude, phase].every(Number.isFinite))
    throw new RangeError('Non-finite harmonic input');
  const z = x - direction * stringSpeed() * time,
    k = (2 * Math.PI) / INTERFERENCE_STRING.wavelength;
  const q = k * z + phase,
    sn = Math.sin(q),
    cs = Math.cos(q);
  const e = front ? trainEnvelope(z, direction) : { f: 1, dx: 0, dxx: 0 };
  return travelJet(
    amplitude * e.f * sn,
    amplitude * (e.dx * sn + e.f * k * cs),
    amplitude * (e.dxx * sn + 2 * e.dx * k * cs - e.f * k * k * sn),
    direction,
  );
}
export function interferenceAt(input: InterferenceInput, x: number) {
  if (![input.time, input.ratio, input.phase, input.probe, x].every(Number.isFinite))
    throw new RangeError('Non-finite string state');
  if (Math.abs(input.ratio) > 1) throw new RangeError('Amplitude ratio outside supported range');
  if (!['pulses', 'phase', 'trains', 'standing'].includes(input.mode))
    throw new RangeError('Unknown string mode');
  const a = INTERFERENCE_STRING.amplitude;
  const first =
    input.mode === 'pulses'
      ? stringPulse(x, input.time, 1, a)
      : stringHarmonic(x, input.time, 1, a, 0, input.mode === 'trains');
  const second =
    input.mode === 'pulses'
      ? stringPulse(x, input.time, -1, a * input.ratio)
      : stringHarmonic(
          x,
          input.time,
          input.mode === 'phase' ? 1 : -1,
          a * input.ratio,
          input.phase,
          input.mode === 'trains',
        );
  const sum = Object.fromEntries(
    (Object.keys(first) as (keyof StringJet)[]).map((key) => [
      key,
      clean(first[key] + second[key]),
    ]),
  ) as StringJet;
  const kinetic = 0.5 * INTERFERENCE_STRING.density * sum.dt ** 2;
  const potential = 0.5 * INTERFERENCE_STRING.tension * sum.dx ** 2;
  const flux = clean(-INTERFERENCE_STRING.tension * sum.dt * sum.dx);
  return { x, first, second, ...sum, kinetic, potential, energy: kinetic + potential, flux };
}
export function interferenceSamples(input: InterferenceInput, min = -1.6, max = 1.6, count = 321) {
  if (![min, max, count].every(Number.isFinite) || max <= min)
    throw new RangeError('Invalid sample domain');
  const n = Math.max(3, Math.min(641, Math.round(count)));
  return Array.from({ length: n }, (_, i) =>
    interferenceAt(input, min + ((max - min) * i) / (n - 1)),
  );
}
/** Trapezoidal integral over the observation window, not a claim of closed boundaries. */
export function interferenceEnergy(input: InterferenceInput, min = -1.6, max = 1.6, count = 641) {
  const samples = interferenceSamples(input, min, max, count),
    dx = (max - min) / (samples.length - 1);
  let kinetic = 0,
    potential = 0;
  samples.forEach((s, i) => {
    const w = i === 0 || i === samples.length - 1 ? 0.5 : 1;
    kinetic += w * s.kinetic * dx;
    potential += w * s.potential * dx;
  });
  return {
    kinetic,
    potential,
    total: kinetic + potential,
    incoming: samples[0].flux - samples.at(-1)!.flux,
  };
}
export const singlePulseEnergy = (amplitude: number = INTERFERENCE_STRING.amplitude) =>
  (5 * Math.PI ** 2 * INTERFERENCE_STRING.tension * amplitude ** 2) /
  (16 * INTERFERENCE_STRING.halfWidth);
export function samePointAmplitude(ratio: number, phase: number) {
  if (![ratio, phase].every(Number.isFinite)) throw new RangeError('Invalid amplitude input');
  return (
    INTERFERENCE_STRING.amplitude * Math.hypot(1 + ratio * Math.cos(phase), ratio * Math.sin(phase))
  );
}
export function standingNodes(min: number, max: number, phase = 0) {
  if (![min, max, phase].every(Number.isFinite) || max < min || max - min > 100)
    throw new RangeError('Invalid node domain');
  const k = (2 * Math.PI) / INTERFERENCE_STRING.wavelength,
    step = Math.PI / k,
    offset = -phase / (2 * k);
  const first = Math.ceil((min - offset) / step),
    last = Math.floor((max - offset) / step);
  return Array.from(
    { length: Math.max(0, last - first + 1) },
    (_, i) => offset + (first + i) * step,
  );
}
const smooth = (p: number, a = 0, b = 1) => {
  const q = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return q * q * (3 - 2 * q);
};
export type InterferenceView =
  'material' | 'cancel' | 'energy' | 'pass' | 'phase' | 'amplitude' | 'formation' | 'nodes';
export function interferenceShot(
  chapter: number,
  progress: number,
): { input: InterferenceInput; view: InterferenceView } {
  const c = Number.isFinite(chapter) ? Math.max(0, Math.min(7, Math.floor(chapter))) : 0;
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const input = { ...INTERFERENCE_DEFAULT };
  const views: InterferenceView[] = [
    'material',
    'cancel',
    'energy',
    'pass',
    'phase',
    'amplitude',
    'formation',
    'nodes',
  ];
  if (c === 0) input.time = -0.1 + 0.06 * smooth(p, 0.08, 0.92);
  if (c === 1) input.time = -0.04 + 0.04 * smooth(p, 0.08, 0.72);
  if (c === 2) input.time = 0.012 * smooth(p, 0.5, 0.92);
  if (c === 3) input.time = 0.012 + 0.088 * smooth(p, 0.05, 0.92);
  if (c === 4)
    Object.assign(input, {
      mode: 'phase',
      time: 0,
      ratio: 1,
      phase: Math.PI * smooth(p, 0.12, 0.8),
      probe: 0.4,
    });
  if (c === 5)
    Object.assign(input, {
      mode: 'phase',
      time: 0,
      ratio: 1 - 0.5 * smooth(p, 0.15, 0.8),
      phase: Math.PI,
      probe: 0.4,
    });
  if (c === 6)
    Object.assign(input, {
      mode: 'trains',
      time: -0.02 + 0.38 * smooth(p, 0.06, 0.95),
      ratio: 1,
      probe: 0.4,
    });
  if (c === 7)
    Object.assign(input, {
      mode: 'standing',
      time: 0.36 + 0.08 * smooth(p, 0.12, 0.9),
      ratio: 1,
      probe: 0.4,
    });
  return { input, view: views[c] };
}
