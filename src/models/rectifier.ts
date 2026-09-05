/** Single-phase diode bridge. SI units; constant forward drop plus differential
 * resistance per diode, finite source resistance, linear C and resistive load.
 * Between conduction events the capacitor ODE has an exact sinusoidal solution.
 * No diode reverse recovery, transformer inductance, ESR or mains wiring model.
 */
export interface RectifierParameters {
  peak: number;
  frequency: number;
  capacitance: number;
  load: number;
  sourceResistance: number;
  diodeDrop: number;
  diodeResistance: number;
  capacitor: boolean;
  phase: number;
}
export const rectifierDefaults = (): RectifierParameters => ({
  peak: 12,
  frequency: 50,
  capacitance: 1000e-6,
  load: 100,
  sourceResistance: 2,
  diodeDrop: 0.65,
  diodeResistance: 0.08,
  capacitor: true,
  phase: 0,
});
export type BridgeMode = 'positive' | 'negative' | 'blocked';
export type BridgeDiode = 'D1' | 'D2' | 'D3' | 'D4';
export interface RectifierPoint {
  time: number;
  y: number[];
}
export interface RectifierEvent {
  time: number;
  voltage: number;
  conducting: boolean;
}
export interface RectifierTrace {
  parameters: RectifierParameters;
  points: RectifierPoint[];
  events: RectifierEvent[];
  duration: number;
  steps: number;
  startup: boolean;
}
export function rectifierState(p: RectifierParameters, time: number, vc: number) {
  const source = p.peak * Math.sin(2 * Math.PI * p.frequency * time + p.phase);
  const available = Math.abs(source) - 2 * p.diodeDrop;
  const series = p.sourceResistance + 2 * p.diodeResistance;
  const bridgeCurrent = Math.max(
    0,
    (available - (p.capacitor ? vc : 0)) / (series + (p.capacitor ? 0 : p.load)),
  );
  const output = p.capacitor ? vc : bridgeCurrent * p.load;
  const loadCurrent = output / p.load;
  const capacitorCurrent = p.capacitor ? bridgeCurrent - loadCurrent : 0;
  const mode: BridgeMode =
    bridgeCurrent <= 1e-12 ? 'blocked' : source >= 0 ? 'positive' : 'negative';
  const diodes: Record<BridgeDiode, number> = {
    D1: mode === 'positive' ? bridgeCurrent : 0,
    D2: mode === 'negative' ? bridgeCurrent : 0,
    D3: mode === 'negative' ? bridgeCurrent : 0,
    D4: mode === 'positive' ? bridgeCurrent : 0,
  };
  const sourceCurrent = source >= 0 ? bridgeCurrent : -bridgeCurrent;
  const inputPower = source * sourceCurrent,
    loadPower = output * loadCurrent;
  const diodePower = 2 * p.diodeDrop * bridgeCurrent + 2 * p.diodeResistance * bridgeCurrent ** 2;
  const resistancePower = p.sourceResistance * bridgeCurrent ** 2;
  return {
    source,
    available,
    output,
    bridgeCurrent,
    sourceCurrent,
    loadCurrent,
    capacitorCurrent,
    mode,
    diodes,
    threshold: output + 2 * p.diodeDrop,
    inputPower,
    loadPower,
    diodePower,
    resistancePower,
    energy: p.capacitor ? (p.capacitance * vc * vc) / 2 : 0,
    storagePower: output * capacitorCurrent,
    dv: p.capacitor ? capacitorCurrent / p.capacitance : 0,
  };
}
function validate(p: RectifierParameters, steps: number) {
  if (
    !Object.values(p).every((v) => typeof v === 'boolean' || Number.isFinite(v)) ||
    p.peak < 0 ||
    p.frequency <= 0 ||
    p.capacitance <= 0 ||
    p.load <= 0 ||
    p.sourceResistance <= 0 ||
    p.diodeDrop < 0 ||
    p.diodeResistance < 0 ||
    !Number.isInteger(steps) ||
    steps < 64 ||
    steps > 4096
  )
    throw new RangeError('Finite passive SI parameters and 64–4096 steps per cycle required');
}
function advanceVoltage(p: RectifierParameters, t: number, v: number, h: number, on: boolean) {
  if (!p.capacitor) return 0;
  if (!on) return v * Math.exp(-h / (p.load * p.capacitance));
  const resistance = p.sourceResistance + 2 * p.diodeResistance,
    w = 2 * Math.PI * p.frequency;
  const sign = Math.sin(w * (t + h / 2) + p.phase) >= 0 ? 1 : -1;
  const k = (1 / resistance + 1 / p.load) / p.capacitance;
  const a = (sign * p.peak) / (resistance * p.capacitance),
    b = (-2 * p.diodeDrop) / (resistance * p.capacitance);
  const f = (time: number) => k * Math.sin(w * time + p.phase) - w * Math.cos(w * time + p.phase);
  const decay = Math.exp(-k * h);
  return (
    v * decay + (a * (f(t + h) - decay * f(t))) / (k * k + w * w) + (b * -Math.expm1(-k * h)) / k
  );
}
function gap(p: RectifierParameters, t: number, v: number) {
  return Math.abs(p.peak * Math.sin(2 * Math.PI * p.frequency * t + p.phase)) - 2 * p.diodeDrop - v;
}
function startsConducting(p: RectifierParameters, t: number, v: number) {
  const g = gap(p, t, v),
    angle = 2 * Math.PI * p.frequency * t + p.phase;
  const slope =
    (Math.sin(angle) >= 0 ? 1 : -1) * p.peak * 2 * Math.PI * p.frequency * Math.cos(angle) +
    v / (p.load * p.capacitance);
  return g > 1e-10 || (Math.abs(g) <= 1e-10 && slope > 0);
}
function rates(p: RectifierParameters, t: number, v: number) {
  const s = rectifierState(p, t, v);
  return [
    s.inputPower,
    s.loadPower,
    s.diodePower,
    s.resistancePower,
    s.bridgeCurrent,
    s.loadCurrent,
    Math.max(0, s.capacitorCurrent),
    Math.min(0, s.capacitorCurrent),
    s.output,
  ];
}
function evolve(
  p: RectifierParameters,
  initial: number[],
  duration: number,
  steps: number,
  points?: RectifierPoint[],
  events?: RectifierEvent[],
) {
  let time = 0,
    y = initial.slice();
  points?.push({ time, y: y.slice() });
  const maxStep = 1 / p.frequency / steps,
    w = 2 * Math.PI * p.frequency;
  while (duration - time > maxStep * 1e-9) {
    // Quarter-cycle cuts include every source zero and crest. The sign of the
    // sinusoidal forcing is consequently fixed throughout each propagation.
    const phaseQuarter = (w * time + p.phase) / (Math.PI / 2);
    const toQuarter = (((Math.floor(phaseQuarter + 1e-9) + 1) * Math.PI) / 2 - p.phase) / w - time;
    const end = Math.min(duration, time + maxStep, time + toQuarter);
    let on = p.capacitor ? startsConducting(p, time, y[0]) : false,
      transitions = 0;
    while (end - time > maxStep * 1e-10) {
      const chargeTime =
        p.capacitance / (1 / (p.sourceResistance + 2 * p.diodeResistance) + 1 / p.load);
      let h = Math.min(end - time, on ? chargeTime / 16 : Infinity);
      let next = advanceVoltage(p, time, y[0], h, on),
        event = false;
      if (
        p.capacitor &&
        ((on && gap(p, time + h, next) < -1e-10) || (!on && gap(p, time + h, next) > 1e-10))
      ) {
        let lo = 0,
          hi = h;
        for (let iteration = 0; iteration < 42; iteration++) {
          const mid = (lo + hi) / 2,
            candidate = advanceVoltage(p, time, y[0], mid, on);
          const remains = on
            ? gap(p, time + mid, candidate) >= 0
            : gap(p, time + mid, candidate) <= 0;
          if (remains) lo = mid;
          else hi = mid;
        }
        h = (lo + hi) / 2;
        next = advanceVoltage(p, time, y[0], h, on);
        event = true;
      }
      if (y.length > 1) {
        const a = rates(p, time, y[0]),
          b = rates(p, time + h / 2, advanceVoltage(p, time, y[0], h / 2, on)),
          c = rates(p, time + h, next);
        y = [next, ...a.map((v, j) => y[j + 1] + (h * (v + 4 * b[j] + c[j])) / 6)];
      } else y = [next];
      time += h;
      points?.push({ time, y: y.slice() });
      if (event) {
        on = !on;
        transitions++;
        events?.push({ time, voltage: next, conducting: on });
        if (transitions > 4) throw new Error('Unresolved bridge events');
      }
    }
  }
  return y;
}
function steadyVoltage(p: RectifierParameters, steps: number) {
  if (!p.capacitor || p.peak <= 2 * p.diodeDrop) return 0;
  let lo = 0,
    hi = p.peak;
  // Monotone dissipative period map; bracket its scalar fixed point.
  for (let i = 0; i < 43; i++) {
    const mid = (lo + hi) / 2,
      end = evolve(p, [mid], 1 / p.frequency, steps)[0];
    if (end > mid) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export function rectifierTrace(
  parameters: RectifierParameters = rectifierDefaults(),
  startup = false,
  steps = 512,
  initialVoltage = 0,
  cycles = startup ? 3 : 1,
): RectifierTrace {
  const p = { ...parameters };
  validate(p, steps);
  if (!Number.isFinite(initialVoltage) || initialVoltage < 0)
    throw new RangeError('Nonnegative initial capacitor voltage required');
  if (!Number.isFinite(cycles) || cycles < 0.5 || cycles > 6)
    throw new RangeError('Trace length must be 0.5–6 AC cycles');
  const duration = cycles / p.frequency;
  const v = p.capacitor ? (startup ? initialVoltage : steadyVoltage(p, steps)) : 0;
  const points: RectifierPoint[] = [],
    events: RectifierEvent[] = [];
  evolve(p, [v, ...Array<number>(9).fill(0)], duration, steps, points, events);
  return { parameters: p, points, events, duration, steps, startup };
}
export function rectifierSample(trace: RectifierTrace, requestedTime: number) {
  const time = Math.max(0, Math.min(trace.duration, requestedTime));
  let lo = 0,
    hi = trace.points.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (trace.points[mid].time <= time + 1e-14) lo = mid + 1;
    else hi = mid;
  }
  const a = trace.points[Math.max(0, lo - 1)],
    b = trace.points[Math.min(lo, trace.points.length - 1)];
  const u = b.time > a.time ? Math.max(0, Math.min(1, (time - a.time) / (b.time - a.time))) : 0;
  const y = a.y.map((v, j) => v + (b.y[j] - v) * u);
  // Exact propagation from the preceding stored point gives continuous charge
  // and the same event topology when seeking between display samples.
  const vc = advanceVoltage(
    trace.parameters,
    a.time,
    a.y[0],
    Math.max(0, time - a.time),
    startsConducting(trace.parameters, a.time, a.y[0]),
  );
  y[0] = vc;
  return {
    time,
    y,
    state: rectifierState(trace.parameters, time, vc),
    parameters: trace.parameters,
  };
}
export type RectifierSample = ReturnType<typeof rectifierSample>;
const statisticsCache = new WeakMap<RectifierTrace, ReturnType<typeof calculateStatistics>>();
function calculateStatistics(trace: RectifierTrace) {
  const p = trace.parameters,
    first = trace.points[0],
    last = trace.points.at(-1)!;
  let min = Infinity,
    max = -Infinity,
    peakCurrent = 0,
    conductingTime = 0;
  trace.points.forEach((point, index) => {
    const s = rectifierState(p, point.time, point.y[0]);
    min = Math.min(min, s.output);
    max = Math.max(max, s.output);
    peakCurrent = Math.max(peakCurrent, s.bridgeCurrent);
    const next = trace.points[index + 1];
    if (next && rectifierSample(trace, (point.time + next.time) / 2).state.bridgeCurrent > 1e-10)
      conductingTime += next.time - point.time;
  });
  const storageChange = p.capacitor ? (p.capacitance * (last.y[0] ** 2 - first.y[0] ** 2)) / 2 : 0;
  const e = last.y;
  return {
    min,
    max,
    ripple: max - min,
    peakCurrent,
    meanOutput: e[9] / trace.duration,
    meanBridgeCurrent: e[5] / trace.duration,
    conductionFraction: conductingTime / trace.duration,
    inputEnergy: e[1],
    loadEnergy: e[2],
    diodeEnergy: e[3],
    resistanceEnergy: e[4],
    storageChange,
    energyResidual: e[1] - e[2] - e[3] - e[4] - storageChange,
    chargeResidual: e[5] - e[6] - (p.capacitor ? p.capacitance * (last.y[0] - first.y[0]) : 0),
    sourceCharge: e[5],
    loadCharge: e[6],
    positiveCharge: e[7],
    negativeCharge: e[8],
  };
}
export function rectifierStatistics(trace: RectifierTrace) {
  if (!statisticsCache.has(trace)) statisticsCache.set(trace, calculateStatistics(trace));
  return statisticsCache.get(trace)!;
}
export type RectifierFocus =
  | 'positive'
  | 'negative'
  | 'full-wave'
  | 'first-charge'
  | 'threshold'
  | 'capacitance'
  | 'demand'
  | 'inrush';
const films = new Map<string, RectifierTrace>();
function authoredTrace(
  key: string,
  overrides: Partial<RectifierParameters>,
  startup = false,
  cycles = startup ? 3 : 1,
) {
  if (!films.has(key))
    films.set(
      key,
      rectifierTrace({ ...rectifierDefaults(), ...overrides }, startup, 512, 0, cycles),
    );
  return films.get(key)!;
}
export function rectifierShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    u = Math.max(0, Math.min(1, progress));
  let trace = authoredTrace('bare', { capacitor: false }),
    position = u,
    variant = 0;
  const focus: RectifierFocus = [
    'positive',
    'negative',
    'full-wave',
    'first-charge',
    'threshold',
    'capacitance',
    'demand',
    'inrush',
  ][c] as RectifierFocus;
  if (c === 0) position = 0.05 + u * 0.4;
  if (c === 1) position = 0.55 + u * 0.4;
  if (c === 3) {
    trace = authoredTrace('first-charge', {}, true);
    position = u * u;
  }
  if (c === 4) trace = authoredTrace('filtered', {});
  if (c === 5) {
    variant = u < 0.5 ? 0 : 1;
    trace = authoredTrace(`cap-${variant}`, { capacitance: variant ? 2200e-6 : 220e-6 });
    position = (u - variant * 0.5) * 2;
  }
  if (c === 6) {
    variant = Math.min(2, Math.floor(u * 3));
    trace = authoredTrace(
      `demand-${variant}`,
      { load: variant === 0 ? 200 : 50, frequency: variant === 2 ? 100 : 50 },
      false,
      variant === 2 ? 2 : 1,
    );
    position = u * 3 - variant;
  }
  if (c === 7) {
    variant = u < 0.5 ? 0 : 1;
    trace = authoredTrace(
      `inrush-${variant}`,
      { phase: Math.PI / 2, sourceResistance: variant ? 5 : 0.5 },
      true,
      0.5,
    );
    position = ((u - variant * 0.5) * 2) ** 2;
  }
  return {
    trace,
    sample: rectifierSample(trace, position * trace.duration),
    focus,
    variant,
    statistics: rectifierStatistics(trace),
  };
}
export type RectifierShot = ReturnType<typeof rectifierShot>;
export const rectifierManualDefaults = () => ({
  parameters: rectifierDefaults(),
  time: 0.22,
  startup: false,
  view: 'voltage' as 'voltage' | 'current',
});
export type RectifierManual = ReturnType<typeof rectifierManualDefaults>;
export function rectifierReset(): RectifierManual {
  return rectifierManualDefaults();
}

/** The bridge has two AC midpoints, and common positive/negative rails.
 * Edges are directed anode→cathode. The load always conducts plus→minus. */
export const RECTIFIER_EDGES = {
  D1: ['A', 'P'],
  D2: ['B', 'P'],
  D3: ['N', 'A'],
  D4: ['N', 'B'],
} as const;
export function rectifierLoop(mode: BridgeMode): string[] {
  return mode === 'positive'
    ? ['A', 'P', 'N', 'B', 'A']
    : mode === 'negative'
      ? ['B', 'P', 'N', 'A', 'B']
      : ['P', 'N', 'P'];
}
