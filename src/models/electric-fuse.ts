/** One-dimensional finite-volume pre-arcing thermal model. Stops at the first onset
 * of melting: it does not predict arc extinction, clearing time or breaking capacity. */
export interface FuseParameters {
  current: number;
  diameter: number;
  ambient: number;
  pulse: number;
  duration: number;
  cells: number;
}
export interface FuseFrame {
  time: number;
  temperature: number[];
  maximum: number;
  current: number;
  resistance: number;
  joule: number;
  loss: number;
  stored: number;
  supplied: number;
  escaped: number;
  i2t: number;
}
export interface FuseRun {
  parameters: FuseParameters;
  frames: FuseFrame[];
  meltingTime: number | null;
  meltingI2t: number | null;
  meltingTemperature: number;
  length: number;
}
export const FUSE_SILVER = {
  length: 0.01,
  density: 10490,
  heatCapacity: 235,
  conductivity: 429,
  resistivity: 1.59e-8,
  alpha: 0.0038,
  melting: 961.9,
};
export const fuseDefaults = (): FuseParameters => ({
  current: 2.2,
  diameter: 50e-6,
  ambient: 20,
  pulse: Infinity,
  duration: 0.4,
  cells: 40,
});
const cache = new Map<string, FuseRun>();
export function fuseRun(p: FuseParameters): FuseRun {
  if (
    ![p.current, p.diameter, p.ambient, p.duration, p.cells].every(Number.isFinite) ||
    p.current < 0 ||
    p.diameter <= 0 ||
    p.ambient < 0 ||
    p.ambient > 100 ||
    p.duration <= 0 ||
    p.duration > 2 ||
    !(p.pulse > 0) ||
    !Number.isInteger(p.cells) ||
    p.cells < 4 ||
    p.cells > 160
  )
    throw new RangeError('Pre-arcing thermal parameter range exceeded');
  const key = JSON.stringify([p.current, p.diameter, p.ambient, p.pulse, p.duration, p.cells]),
    existing = cache.get(key);
  if (existing) return existing;
  const m = FUSE_SILVER,
    n = p.cells,
    area = Math.PI * (p.diameter / 2) ** 2,
    dx = m.length / n,
    mass = m.density * area * dx,
    capacity = mass * m.heatCapacity,
    g = (m.conductivity * area) / dx,
    dtLimit = (0.22 * capacity) / g,
    outputStep = p.duration / 220;
  let temperature = Array(n).fill(p.ambient) as number[],
    time = 0,
    supplied = 0,
    escaped = 0,
    i2t = 0,
    meltingTime: number | null = null,
    nextOutput = outputStep;
  const frames: FuseFrame[] = [];
  function state(): FuseFrame {
    const current = time < p.pulse ? p.current : 0,
      resistance = temperature.reduce(
        (sum, t) => sum + (m.resistivity * (1 + m.alpha * (t - 20)) * dx) / area,
        0,
      ),
      joule = current * current * resistance,
      loss = 2 * g * (temperature[0] + temperature[n - 1] - 2 * p.ambient),
      stored = temperature.reduce((sum, t) => sum + capacity * (t - p.ambient), 0);
    return {
      time,
      temperature: [...temperature],
      maximum: Math.max(...temperature),
      current,
      resistance,
      joule,
      loss,
      stored,
      supplied,
      escaped,
      i2t,
    };
  }
  frames.push(state());
  while (time < p.duration - 1e-12) {
    const current = time < p.pulse ? p.current : 0,
      untilPulse = time < p.pulse ? p.pulse - time : Infinity,
      dt = Math.min(dtLimit, p.duration - time, nextOutput - time, untilPulse),
      powers = temperature.map(
        (t, i) =>
          (current * current * m.resistivity * (1 + m.alpha * (t - 20)) * dx) / area +
          g *
            ((i ? temperature[i - 1] : 2 * p.ambient - t) +
              (i < n - 1 ? temperature[i + 1] : 2 * p.ambient - t) -
              2 * t),
      ),
      before = state(),
      trial = temperature.map((t, i) => t + (dt * powers[i]) / capacity),
      maxTrial = Math.max(...trial),
      fraction =
        maxTrial >= m.melting ? (m.melting - before.maximum) / (maxTrial - before.maximum) : 1,
      step = dt * fraction;
    temperature = temperature.map((t, i) => t + (trial[i] - t) * fraction);
    time += step;
    supplied += before.joule * step;
    escaped += before.loss * step;
    i2t += current * current * step;
    if (maxTrial >= m.melting) {
      meltingTime = time;
      frames.push(state());
      break;
    }
    if (Math.abs(time - p.pulse) < 1e-12 && time < nextOutput - 1e-12) frames.push(state());
    if (time >= nextOutput - 1e-12 || time >= p.duration - 1e-12) {
      frames.push(state());
      nextOutput += outputStep;
    }
    if (dt <= 1e-15 && time < p.duration - 1e-12) {
      time = Math.min(p.duration, time + 1e-12);
    }
  }
  const run = {
    parameters: { ...p },
    frames,
    meltingTime,
    meltingI2t: meltingTime === null ? null : i2t,
    meltingTemperature: m.melting,
    length: m.length,
  };
  if (cache.size >= 24) cache.delete(cache.keys().next().value!);
  cache.set(key, run);
  return run;
}
export function fuseAt(run: FuseRun, time: number): FuseFrame {
  const t = Math.max(0, Math.min(time, run.frames.at(-1)!.time));
  let lo = 0,
    hi = run.frames.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (run.frames[mid].time <= t) lo = mid;
    else hi = mid;
  }
  const a = run.frames[lo],
    b = run.frames[hi],
    u = b.time === a.time ? 0 : (t - a.time) / (b.time - a.time),
    mix = (x: number, y: number) => x + (y - x) * u,
    temperature = a.temperature.map((x, i) => mix(x, b.temperature[i]));
  return {
    time: t,
    temperature,
    maximum: Math.max(...temperature),
    current: t < run.parameters.pulse ? run.parameters.current : 0,
    resistance: mix(a.resistance, b.resistance),
    joule:
      (t < run.parameters.pulse ? run.parameters.current ** 2 : 0) *
      mix(a.resistance, b.resistance),
    loss: mix(a.loss, b.loss),
    stored: mix(a.stored, b.stored),
    supplied: mix(a.supplied, b.supplied),
    escaped: mix(a.escaped, b.escaped),
    i2t: mix(a.i2t, b.i2t),
  };
}
export function fuseShot(chapter: number, progress: number) {
  const p = fuseDefaults();
  if (chapter === 0) p.current = 1;
  if (chapter === 2) {
    p.current = 4;
    p.pulse = 0.008;
    p.duration = 0.15;
  }
  if (chapter === 3) p.ambient = 80;
  if (chapter === 4) p.diameter = 70e-6;
  if (chapter === 5) {
    p.current = 4;
    p.duration = 0.025;
  }
  const run = fuseRun(p),
    end = run.frames.at(-1)!.time;
  return { run, state: fuseAt(run, Math.max(0, Math.min(1, progress)) * end) };
}
