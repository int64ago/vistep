/** Linear 1D elastic water hammer, SI units. Characteristic grid has Courant number exactly 1.
 * Pressure-dependent terminal orifice + fixed-pressure upstream reservoir; no pipe friction.
 * A vapor boundary terminates the single-phase solution, rather than extrapolating through it.
 */
export const WATER_HAMMER = {
  length: 120,
  diameter: 0.08,
  thickness: 0.004,
  density: 998.2,
  bulk: 2.2e9,
  young: 200e9,
  support: 1,
  pressure: 1.8e6,
  downstream: 101325,
  vapor: 2338,
  speed: 1,
  closure: 0.02,
  cells: 96,
  horizon: 1.6,
} as const;
export type HammerOptions = Partial<{
  length: number;
  diameter: number;
  thickness: number;
  density: number;
  bulk: number;
  young: number;
  support: number;
  pressure: number;
  downstream: number;
  vapor: number;
  speed: number;
  closure: number;
  cells: number;
  horizon: number;
}>;
export type HammerParameters = { [K in keyof typeof WATER_HAMMER]: number } & {
  area: number;
  fluidCompliance: number;
  wallCompliance: number;
  compliance: number;
  waveSpeed: number;
  impedance: number;
  transit: number;
  roundTrip: number;
  joukowsky: number;
  dx: number;
  dt: number;
  initialEnergy: number;
};
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => {
  const v = clamp(x, 0, 1);
  return v * v * (3 - 2 * v);
};
export function hammerParameters(options: HammerOptions = {}): HammerParameters {
  const p = { ...WATER_HAMMER, ...options };
  if (Object.values(p).some((x) => !Number.isFinite(x)))
    throw new RangeError('Water-hammer parameters must be finite.');
  if (
    p.length < 10 ||
    p.length > 500 ||
    p.diameter <= 0 ||
    p.thickness <= 0 ||
    p.density <= 0 ||
    p.bulk <= 0 ||
    p.young <= 0 ||
    p.support < 0 ||
    p.speed < 0 ||
    p.speed > 3 ||
    p.closure < 0 ||
    p.closure > 3 ||
    p.horizon <= 0 ||
    p.horizon > 3 ||
    p.cells < 24 ||
    p.cells > 1024 ||
    !Number.isInteger(p.cells) ||
    p.vapor <= 0 ||
    p.downstream < p.vapor ||
    p.pressure <= p.downstream
  )
    throw new RangeError('Outside the single-pipe teaching domain.');
  const area = (Math.PI * p.diameter ** 2) / 4;
  const fluidCompliance = 1 / p.bulk,
    wallCompliance = (p.support * p.diameter) / (p.young * p.thickness);
  const compliance = fluidCompliance + wallCompliance;
  const waveSpeed = 1 / Math.sqrt(p.density * compliance),
    impedance = p.density * waveSpeed;
  if (waveSpeed > 1e4) throw new RangeError('Wave speed outside the teaching grid.');
  return {
    ...p,
    area,
    fluidCompliance,
    wallCompliance,
    compliance,
    waveSpeed,
    impedance,
    transit: p.length / waveSpeed,
    roundTrip: (2 * p.length) / waveSpeed,
    joukowsky: impedance * p.speed,
    dx: p.length / p.cells,
    dt: p.length / (p.cells * waveSpeed),
    initialEnergy: 0.5 * p.density * p.speed ** 2 * area * p.length,
  };
}
/** Prescribed effective Cd*A ratio, not a universal handle-angle law. */
export function hammerOpening(time: number, duration: number) {
  return duration === 0 ? 0 : 1 - smooth(time / duration);
}
/** Solve u |u| = B (p - p_down) together with incoming u + (p-p0)/Z = R+.
 * Signed square-root flow also handles a still-open valve under reverse pressure difference.
 */
export function hammerValve(incoming: number, opening: number, p: HammerParameters) {
  if (opening <= 0 || p.speed === 0)
    return { velocity: 0, pressure: p.pressure + p.impedance * incoming };
  const B = (opening ** 2 * p.speed ** 2) / (p.pressure - p.downstream);
  const driving = p.pressure - p.downstream + p.impedance * incoming;
  const bz = B * p.impedance;
  const velocity = (2 * B * driving) / (Math.sqrt(bz ** 2 + 4 * B * Math.abs(driving)) + bz);
  return { velocity, pressure: p.pressure + p.impedance * (incoming - velocity) };
}
export type HammerFrame = {
  time: number;
  pressure: Float64Array;
  velocity: Float64Array;
  displacement: Float64Array;
  opening: number;
};
export type HammerFailure = { time: number; index: number; x: number; kind: 'vapor' };
export type HammerRun = {
  parameters: HammerParameters;
  frames: HammerFrame[];
  failure: HammerFailure | null;
};
function mixArrays(a: Float64Array, b: Float64Array, f: number) {
  return a.map((v, i) => v + (b[i] - v) * f);
}
export function simulateWaterHammer(options: HammerOptions = {}): HammerRun {
  const p = hammerParameters(options),
    n = p.cells,
    count = n + 1;
  let pressure = new Float64Array(count).fill(p.pressure),
    velocity = new Float64Array(count).fill(p.speed);
  let displacement = new Float64Array(count);
  const initialValve = hammerValve(p.speed, hammerOpening(0, p.closure), p);
  pressure[n] = initialValve.pressure;
  velocity[n] = initialValve.velocity;
  const frames: HammerFrame[] = [
    { time: 0, pressure, velocity, displacement, opening: hammerOpening(0, p.closure) },
  ];
  const steps = Math.ceil(p.horizon / p.dt);
  for (let step = 1; step <= steps; step++) {
    const nextPressure = new Float64Array(count),
      nextVelocity = new Float64Array(count);
    const nextDisplacement = new Float64Array(count),
      time = step * p.dt;
    for (let i = 1; i < n; i++) {
      const plus = velocity[i - 1] + (pressure[i - 1] - p.pressure) / p.impedance;
      const minus = velocity[i + 1] - (pressure[i + 1] - p.pressure) / p.impedance;
      nextVelocity[i] = (plus + minus) / 2;
      nextPressure[i] = p.pressure + (p.impedance * (plus - minus)) / 2;
    }
    // Fixed pressure reflects p' with the opposite sign, while allowing reservoir flow to reverse.
    nextPressure[0] = p.pressure;
    nextVelocity[0] = velocity[1] - (pressure[1] - p.pressure) / p.impedance;
    const incoming = velocity[n - 1] + (pressure[n - 1] - p.pressure) / p.impedance;
    const opening = hammerOpening(time, p.closure),
      valve = hammerValve(incoming, opening, p);
    nextVelocity[n] = valve.velocity;
    nextPressure[n] = valve.pressure;
    // Linear material displacement uses the same velocity history, not a second animation clock.
    for (let i = 0; i < count; i++)
      nextDisplacement[i] = displacement[i] + 0.5 * (velocity[i] + nextVelocity[i]) * p.dt;
    let fraction = 1,
      index = -1;
    for (let i = 0; i < count; i++)
      if (nextPressure[i] <= p.vapor) {
        const f = (pressure[i] - p.vapor) / (pressure[i] - nextPressure[i]);
        // Accept the first event even when it lands exactly at this step's endpoint.
        if (index === -1 || f < fraction) {
          fraction = clamp(f, 0, 1);
          index = i;
        }
      }
    if (index >= 0) {
      const stopTime = (step - 1 + fraction) * p.dt;
      const stopPressure = mixArrays(pressure, nextPressure, fraction);
      stopPressure[index] = p.vapor;
      frames.push({
        time: stopTime,
        pressure: stopPressure,
        velocity: mixArrays(velocity, nextVelocity, fraction),
        displacement: mixArrays(displacement, nextDisplacement, fraction),
        opening: hammerOpening(stopTime, p.closure),
      });
      return {
        parameters: p,
        frames,
        failure: { time: stopTime, index, x: index * p.dx, kind: 'vapor' },
      };
    }
    pressure = nextPressure;
    velocity = nextVelocity;
    displacement = nextDisplacement;
    frames.push({ time, pressure, velocity, displacement, opening });
  }
  return { parameters: p, frames, failure: null };
}
/** Trapezoidal linear-system energy and storage. Constant base-pressure work is excluded. */
export function hammerEnergy(frame: HammerFrame, p: HammerParameters) {
  let kinetic = 0,
    fluid = 0,
    wall = 0,
    storage = 0;
  for (let i = 0; i <= p.cells; i++) {
    const volume = p.area * p.dx * (i === 0 || i === p.cells ? 0.5 : 1),
      dp = frame.pressure[i] - p.pressure;
    kinetic += (volume * p.density * frame.velocity[i] ** 2) / 2;
    fluid += (volume * p.fluidCompliance * dp ** 2) / 2;
    wall += (volume * p.wallCompliance * dp ** 2) / 2;
    storage += volume * p.compliance * dp;
  }
  return { kinetic, fluid, wall, total: kinetic + fluid + wall, storage };
}
export type HammerSample = HammerFrame & {
  parameters: HammerParameters;
  requestedTime: number;
  failure: HammerFailure | null;
  energy: ReturnType<typeof hammerEnergy>;
  minPressure: number;
  maxPressure: number;
  valveRise: number;
  probePressure: number;
  probeVelocity: number;
  densityStrain: number;
  hoopStrain: number;
  probeIndex: number;
};
export function sampleWaterHammer(
  run: HammerRun,
  requestedTime: number,
  probe = 0.72,
): HammerSample {
  if (!Number.isFinite(requestedTime) || !Number.isFinite(probe))
    throw new RangeError('Sample coordinates must be finite.');
  const p = run.parameters,
    last = run.frames.at(-1)!;
  const time = clamp(requestedTime, 0, last.time),
    i = Math.min(run.frames.length - 1, Math.floor(time / p.dt));
  const a = run.frames[i],
    b = run.frames[Math.min(i + 1, run.frames.length - 1)];
  const f = b.time === a.time ? 0 : clamp((time - a.time) / (b.time - a.time), 0, 1);
  const frame: HammerFrame = {
    time,
    pressure: mixArrays(a.pressure, b.pressure, f),
    velocity: mixArrays(a.velocity, b.velocity, f),
    displacement: mixArrays(a.displacement, b.displacement, f),
    opening: hammerOpening(time, p.closure),
  };
  const probeIndex = Math.round(clamp(probe, 0, 1) * p.cells),
    dp = frame.pressure[probeIndex] - p.pressure;
  return {
    ...frame,
    parameters: p,
    requestedTime,
    failure: run.failure && requestedTime >= run.failure.time ? run.failure : null,
    energy: hammerEnergy(frame, p),
    minPressure: Math.min(...frame.pressure),
    maxPressure: Math.max(...frame.pressure),
    valveRise: frame.pressure[p.cells] - p.pressure,
    probePressure: frame.pressure[probeIndex],
    probeVelocity: frame.velocity[probeIndex],
    densityStrain: dp / p.bulk,
    hoopStrain: (dp * p.wallCompliance) / 2,
    probeIndex,
  };
}
// Bounded cache. Sweeping an exploration slider cannot retain every trial.
const runs = new Map<string, HammerRun>();
export function releaseWaterHammerRuns() {
  runs.clear();
}
export function cachedWaterHammer(options: HammerOptions = {}) {
  const key = JSON.stringify(hammerParameters(options));
  const previous = runs.get(key);
  if (previous) {
    runs.delete(key);
    runs.set(key, previous);
    return previous;
  }
  const run = simulateWaterHammer(options);
  runs.set(key, run);
  while (runs.size > 6) runs.delete(runs.keys().next().value!);
  return run;
}
export function hammerTrace(run: HammerRun, until: number, count = 160) {
  const end = Math.min(Math.max(0, until), run.frames.at(-1)!.time);
  return Array.from({ length: count }, (_, i) => {
    const time = (end * i) / (count - 1),
      j = Math.min(run.frames.length - 1, Math.floor(time / run.parameters.dt));
    const a = run.frames[j],
      b = run.frames[Math.min(j + 1, run.frames.length - 1)],
      n = run.parameters.cells;
    const f = b.time === a.time ? 0 : clamp((time - a.time) / (b.time - a.time), 0, 1);
    return {
      time,
      pressure: a.pressure[n] + (b.pressure[n] - a.pressure[n]) * f,
      opening: hammerOpening(time, run.parameters.closure),
    };
  });
}
export type HammerShot = {
  view: 'pipe' | 'elastic' | 'closure' | 'material' | 'limit';
  state: HammerSample;
  reference: HammerSample | null;
  run: HammerRun;
  referenceRun: HammerRun | null;
  chapter: number;
  probe: number;
  annotation:
    'closing' | 'travel' | 'elastic' | 'reservoir' | 'valve' | 'closure' | 'material' | 'limit';
};
export function waterHammerShot(chapter: number, progress: number): HammerShot {
  if (!Number.isFinite(chapter) || !Number.isFinite(progress))
    throw new RangeError('Director coordinates must be finite.');
  const c = clamp(Math.floor(chapter), 0, 7),
    q = clamp(progress, 0, 1),
    base = hammerParameters();
  let run = cachedWaterHammer(),
    referenceRun: HammerRun | null = null,
    time = 0;
  let view: HammerShot['view'] = 'pipe';
  if (c === 0) time = q * base.closure * 2;
  if (c === 1) time = base.closure * 2 + q * (1.08 * base.transit - base.closure * 2);
  if (c === 2) {
    view = 'elastic';
    time = q * base.transit * 1.05;
  }
  if (c === 3) time = base.transit * (0.85 + q * 1.1);
  if (c === 4) time = base.transit * (1.95 + q * 2.15);
  if (c === 5) {
    view = 'closure';
    run = cachedWaterHammer({ closure: 0.9 });
    referenceRun = cachedWaterHammer();
    time = q * 1.2;
  }
  if (c === 6) {
    view = 'material';
    run = cachedWaterHammer({ young: 20e9 });
    referenceRun = cachedWaterHammer();
    time = q * run.parameters.transit * 1.35;
  }
  if (c === 7) {
    view = 'limit';
    run = cachedWaterHammer({ pressure: 0.8e6 });
    time = q * base.transit * 3.2;
  }
  const annotations: HammerShot['annotation'][] = [
    'closing',
    'travel',
    'elastic',
    'reservoir',
    'valve',
    'closure',
    'material',
    'limit',
  ];
  return {
    view,
    state: sampleWaterHammer(run, time),
    reference: referenceRun ? sampleWaterHammer(referenceRun, time) : null,
    run,
    referenceRun,
    chapter: c,
    probe: 0.72,
    annotation: annotations[c],
  };
}
