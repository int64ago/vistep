/** Asynchronous buck, SI units. Fixed duty, no feedback controller or parasitic ringing.
 * State = [inductor current, ideal capacitor voltage, integral channels...].
 * RK4 stops exactly at gate edges and locates the diode's zero-current event.
 * The capacitor ESR is algebraically eliminated, not added as a fake voltage offset.
 */
export type BuckMode = 'on' | 'diode' | 'idle';
export interface BuckParameters {
  vin: number;
  frequency: number;
  duty: number;
  inductance: number;
  capacitance: number;
  resistance: number;
  nonideal: boolean;
}
export const buckDefaults = (): BuckParameters => ({
  vin: 12,
  frequency: 20_000,
  duty: 0.45,
  inductance: 150e-6,
  capacitance: 100e-6,
  resistance: 4,
  nonideal: false,
});
export const BUCK_LOSSES = {
  switchR: 0.12,
  diodeV: 0.45,
  diodeR: 0.05,
  inductorR: 0.15,
  capacitorR: 0.04,
};
export interface BuckPoint {
  time: number;
  y: number[];
  mode: BuckMode;
  resistance: number;
}
export interface BuckTrace {
  parameters: BuckParameters;
  points: BuckPoint[];
  duration: number;
  steps: number;
  settled: boolean;
  warmCycles: number;
  loadStepAt?: number;
}
export function buckInstant(p: BuckParameters, y: readonly number[], mode: BuckMode) {
  const i = y[0],
    vc = y[1],
    r = p.nonideal
      ? BUCK_LOSSES
      : { switchR: 0, diodeV: 0, diodeR: 0, inductorR: 0, capacitorR: 0 };
  const ic = (p.resistance * i - vc) / (p.resistance + r.capacitorR);
  const vo = vc + r.capacitorR * ic;
  const sw =
    mode === 'on' ? p.vin - r.switchR * i : mode === 'diode' ? -r.diodeV - r.diodeR * i : vo;
  const vl = mode === 'idle' ? 0 : sw - r.inductorR * i - vo;
  const di = vl / p.inductance,
    dvc = ic / p.capacitance;
  const sourcePower = mode === 'on' ? p.vin * i : 0;
  const loadPower = (vo * vo) / p.resistance;
  const switchLoss = mode === 'on' ? r.switchR * i * i : 0;
  const diodeLoss = mode === 'diode' ? r.diodeV * i + r.diodeR * i * i : 0;
  const inductorLoss = r.inductorR * i * i,
    capacitorLoss = r.capacitorR * ic * ic;
  const energyL = (p.inductance * i * i) / 2,
    energyC = (p.capacitance * vc * vc) / 2;
  const storageRate = vl * i + vc * ic;
  const routePower =
    mode === 'on' ? sourcePower : mode === 'diode' ? Math.max(0, -vl * i) : Math.max(0, -vc * ic);
  return {
    i,
    vc,
    ic,
    vo,
    sw,
    vl,
    di,
    dvc,
    sourcePower,
    loadPower,
    switchLoss,
    diodeLoss,
    inductorLoss,
    capacitorLoss,
    loss: switchLoss + diodeLoss + inductorLoss + capacitorLoss,
    energyL,
    energyC,
    storageRate,
    routePower,
    diodeCurrent: mode === 'diode' ? i : 0,
    sourceCurrent: mode === 'on' ? i : 0,
  };
}
function derivative(p: BuckParameters, y: number[], mode: BuckMode) {
  const s = buckInstant(p, y, mode);
  return y.length === 2
    ? [s.di, s.dvc]
    : [
        s.di,
        s.dvc,
        s.sourcePower,
        s.loadPower,
        s.switchLoss,
        s.diodeLoss,
        s.inductorLoss,
        s.capacitorLoss,
        Math.max(0, s.vl),
        Math.min(0, s.vl),
        Math.max(0, s.ic),
        Math.min(0, s.ic),
        s.routePower,
        s.vo,
        s.i,
      ];
}
function rk4(p: BuckParameters, y: number[], mode: BuckMode, h: number) {
  const a = derivative(p, y, mode);
  const b = derivative(
    p,
    y.map((v, j) => v + (h * a[j]) / 2),
    mode,
  );
  const c = derivative(
    p,
    y.map((v, j) => v + (h * b[j]) / 2),
    mode,
  );
  const d = derivative(
    p,
    y.map((v, j) => v + h * c[j]),
    mode,
  );
  return y.map((v, j) => v + (h * (a[j] + 2 * b[j] + 2 * c[j] + d[j])) / 6);
}
function validate(p: BuckParameters, steps: number) {
  if (
    !Object.values(p).every((v) => typeof v === 'boolean' || Number.isFinite(v)) ||
    p.vin <= 0 ||
    p.frequency <= 0 ||
    p.duty <= 0 ||
    p.duty >= 1 ||
    p.inductance <= 0 ||
    p.capacitance <= 0 ||
    p.resistance <= 0 ||
    !Number.isInteger(steps) ||
    steps < 16 ||
    steps > 1024
  )
    throw new RangeError('Positive finite SI parameters, 0 < duty < 1 and 16–1024 steps required');
  // Explicit integration is only exposed within a numerically resolved time scale.
  const h = 1 / p.frequency / steps;
  if (h > Math.min(Math.sqrt(p.inductance * p.capacitance), p.resistance * p.capacitance) / 8)
    throw new RangeError('Time step does not resolve the LC/load dynamics');
}
function period(
  p: BuckParameters,
  initial: number[],
  steps: number,
  offset: number,
  points?: BuckPoint[],
) {
  let y = initial.slice();
  const T = 1 / p.frequency;
  for (const [start, end, gate] of [
    [0, p.duty * T, true],
    [p.duty * T, T, false],
  ] as const) {
    let time = start;
    let mode: BuckMode = gate ? 'on' : y[0] > 0 ? 'diode' : 'idle';
    points?.push({ time: offset + time, y: y.slice(), mode, resistance: p.resistance });
    while (end - time > T * 1e-12) {
      const h = Math.min(T / steps, end - time);
      let next = rk4(p, y, mode, h);
      if (mode === 'diode' && next[0] < 0) {
        let lo = 0,
          hi = h;
        for (let k = 0; k < 38; k++) {
          const mid = (lo + hi) / 2;
          if (rk4(p, y, mode, mid)[0] > 0) lo = mid;
          else hi = mid;
        }
        const event = (lo + hi) / 2;
        y = rk4(p, y, mode, event);
        y[0] = 0;
        points?.push({ time: offset + time + event, y: y.slice(), mode, resistance: p.resistance });
        mode = 'idle';
        points?.push({ time: offset + time + event, y: y.slice(), mode, resistance: p.resistance });
        next = rk4(p, y, mode, h - event);
      }
      y = next;
      time += h;
      points?.push({ time: offset + time, y: y.slice(), mode, resistance: p.resistance });
    }
  }
  return y;
}
function periodicState(p: BuckParameters, steps: number) {
  // D·Vin is just a starting guess; even the final mean voltage is solved by the ODE.
  let y = [(p.duty * p.vin) / p.resistance, p.duty * p.vin],
    cycles = 0,
    settled = false;
  while (cycles < 5000) {
    const next = period(p, y, steps, 0);
    cycles++;
    settled = Math.max(Math.abs(next[0] - y[0]), Math.abs(next[1] - y[1])) < 1e-10;
    if (settled) {
      y = next;
      break;
    }
    // Solve the *integrated* period map's fixed point. This accelerates weakly
    // damped LC cases without replacing the switching ODE by an averaged model.
    if (cycles > 20 && cycles < 100) {
      const h0 = Math.max(1e-6, Math.abs(y[0]) * 1e-6),
        h1 = Math.max(1e-6, Math.abs(y[1]) * 1e-6);
      const a = period(p, [y[0] + h0, y[1]], steps, 0),
        b = period(p, [y[0], y[1] + h1], steps, 0);
      const j00 = (a[0] - next[0]) / h0 - 1,
        j10 = (a[1] - next[1]) / h0;
      const j01 = (b[0] - next[0]) / h1,
        j11 = (b[1] - next[1]) / h1 - 1;
      const determinant = j00 * j11 - j01 * j10;
      const f0 = next[0] - y[0],
        f1 = next[1] - y[1];
      if (Math.abs(determinant) > 1e-15) {
        const candidate = [
          Math.max(0, y[0] - (j11 * f0 - j01 * f1) / determinant),
          Math.max(0, y[1] - (-j10 * f0 + j00 * f1) / determinant),
        ];
        const mapped = period(p, candidate, steps, 0);
        if (
          Math.max(Math.abs(mapped[0] - candidate[0]), Math.abs(mapped[1] - candidate[1])) <
          Math.max(Math.abs(f0), Math.abs(f1))
        ) {
          y = candidate;
          continue;
        }
      }
    }
    y = next;
  }
  if (!settled) throw new Error('Periodic buck state did not converge');
  return { y, cycles, settled };
}
export function buckSteady(parameters: BuckParameters = buckDefaults(), steps = 128): BuckTrace {
  const p = { ...parameters };
  validate(p, steps);
  const warm = periodicState(p, steps),
    points: BuckPoint[] = [];
  period(p, [...warm.y, ...Array<number>(13).fill(0)], steps, 0, points);
  return {
    parameters: p,
    points,
    steps,
    duration: 1 / p.frequency,
    settled: warm.settled,
    warmCycles: warm.cycles,
  };
}
export function buckLoadStep(
  parameters: BuckParameters,
  newResistance = 3,
  steps = 128,
): BuckTrace {
  validate(parameters, steps);
  validate({ ...parameters, resistance: newResistance }, steps);
  const warm = periodicState(parameters, steps),
    points: BuckPoint[] = [];
  let y = [...warm.y, ...Array<number>(13).fill(0)];
  for (let cycle = 0; cycle < 24; cycle++)
    y = period(
      { ...parameters, resistance: cycle < 5 ? parameters.resistance : newResistance },
      y,
      steps,
      cycle / parameters.frequency,
      points,
    );
  return {
    parameters: { ...parameters },
    points,
    steps,
    duration: 24 / parameters.frequency,
    settled: false,
    warmCycles: warm.cycles,
    loadStepAt: 5 / parameters.frequency,
  };
}
export function buckStatistics(trace: BuckTrace) {
  const first = trace.points[0],
    last = trace.points[trace.points.length - 1],
    e = last.y;
  const initial = buckInstant(trace.parameters, first.y, first.mode),
    final = buckInstant({ ...trace.parameters, resistance: last.resistance }, last.y, last.mode);
  const storageChange = final.energyL + final.energyC - initial.energyL - initial.energyC;
  let low = Infinity,
    high = -Infinity,
    iLow = Infinity,
    iHigh = -Infinity,
    idleTime = 0;
  trace.points.forEach((point, index) => {
    const s = buckInstant(
      { ...trace.parameters, resistance: point.resistance },
      point.y,
      point.mode,
    );
    low = Math.min(low, s.vo);
    high = Math.max(high, s.vo);
    iLow = Math.min(iLow, s.i);
    iHigh = Math.max(iHigh, s.i);
    if (point.mode === 'idle' && index + 1 < trace.points.length)
      idleTime += trace.points[index + 1].time - point.time;
  });
  const loss = e[4] + e[5] + e[6] + e[7];
  return {
    inputEnergy: e[2],
    loadEnergy: e[3],
    lossEnergy: loss,
    storageChange,
    closure: e[2] - e[3] - loss - storageChange,
    meanVoltage: e[13] / trace.duration,
    meanCurrent: e[14] / trace.duration,
    ripple: high - low,
    voltageMin: low,
    voltageMax: high,
    currentMin: iLow,
    currentMax: iHigh,
    idleFraction: idleTime / trace.duration,
    positiveVoltSeconds: e[8],
    negativeVoltSeconds: e[9],
    positiveCharge: e[10],
    negativeCharge: e[11],
    switchEnergy: e[4],
    diodeEnergy: e[5],
    inductorEnergy: e[6],
    capacitorEnergy: e[7],
    efficiency: e[2] > 0 ? e[3] / e[2] : 0,
  };
}
export function buckSample(trace: BuckTrace, requestedTime: number) {
  const time = Math.max(0, Math.min(trace.duration, requestedTime)),
    points = trace.points;
  let lo = 0,
    hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (points[mid].time <= time + 1e-15) lo = mid + 1;
    else hi = mid;
  }
  const index = Math.max(0, lo - 1),
    a = points[index],
    b = points[Math.min(index + 1, points.length - 1)];
  const u = b.time > a.time ? Math.max(0, Math.min(1, (time - a.time) / (b.time - a.time))) : 0;
  const y = a.y.map((v, j) => v + (b.y[j] - v) * u);
  const p = { ...trace.parameters, resistance: a.resistance };
  let start = index,
    end = index;
  while (
    start > 0 &&
    points[start - 1].mode === a.mode &&
    points[start - 1].resistance === a.resistance
  )
    start--;
  while (
    end + 1 < points.length &&
    points[end + 1].mode === a.mode &&
    points[end + 1].resistance === a.resistance
  )
    end++;
  const energySpan = points[end].y[12] - points[start].y[12];
  const packetProgress =
    energySpan > 1e-15 ? Math.max(0, Math.min(1, (y[12] - points[start].y[12]) / energySpan)) : 0;
  return {
    time,
    y,
    mode: a.mode,
    parameters: p,
    state: buckInstant(p, y, a.mode),
    packetProgress,
    phase: (time * p.frequency) % 1,
  };
}
export type BuckSample = ReturnType<typeof buckSample>;
export type BuckFocus =
  'switching' | 'on' | 'diode' | 'balance' | 'capacitor' | 'transient' | 'discontinuous' | 'losses';
const filmCache = new Map<string, BuckTrace>();
function filmTrace(key: string, overrides: Partial<BuckParameters>, transient = false) {
  if (!filmCache.has(key)) {
    const p = { ...buckDefaults(), ...overrides };
    filmCache.set(key, transient ? buckLoadStep(p) : buckSteady(p));
  }
  return filmCache.get(key)!;
}
export function buckShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    u = Math.max(0, Math.min(1, progress));
  const focus: BuckFocus = [
    'switching',
    'on',
    'diode',
    'balance',
    'capacitor',
    'transient',
    'discontinuous',
    'losses',
  ][c] as BuckFocus;
  let trace = filmTrace('ideal', {}),
    phase = u,
    variant = 0;
  if (c === 1) phase = u * trace.parameters.duty * (1 - 1e-8);
  if (c === 2) phase = trace.parameters.duty + u * (1 - trace.parameters.duty);
  if (c === 3) {
    variant = u < 0.5 ? 0 : 1;
    trace = filmTrace(`duty-${variant}`, { duty: variant ? 0.6 : 0.3 });
    phase = Math.min(1, (u - variant * 0.5) * 2);
  }
  if (c === 4) {
    variant = u < 0.5 ? 0 : 1;
    trace = filmTrace(`capacitor-${variant}`, { capacitance: variant ? 220e-6 : 47e-6 });
    phase = Math.min(1, (u - variant * 0.5) * 2);
  }
  if (c === 5) trace = filmTrace('load-step', { resistance: 8, nonideal: true }, true);
  if (c === 6) {
    variant = Math.min(2, Math.floor(u * 3));
    trace = filmTrace(`light-${variant}`, { resistance: [8, 12, 40][variant], nonideal: true });
    phase = Math.min(1, u * 3 - variant);
  }
  if (c === 7) {
    variant = u < 0.5 ? 0 : 1;
    trace = filmTrace(variant ? 'lossy' : 'ideal', { nonideal: !!variant });
    phase = Math.min(1, (u - variant * 0.5) * 2);
  }
  return {
    focus,
    trace,
    sample: buckSample(trace, phase * trace.duration),
    variant,
    statistics: buckStatistics(trace),
  };
}
export type BuckShot = ReturnType<typeof buckShot>;

/** Four connected semicircular-looking cubic lobes, shared by the ink and energy route. */
export function buckCoilPoints(x0: number, x1: number, y: number): [number, number][] {
  const span = (x1 - x0) / 4;
  return Array.from({ length: 65 }, (_, index) => {
    const lobe = Math.min(3, Math.floor(index / 16)),
      u = index / 16 - lobe;
    const x = x0 + span * lobe + span * (3 * u * u - 2 * u * u * u);
    return [x, y - 96 * u * (1 - u)];
  });
}

/** Piecewise straight route for a single schematic energy guide. It is not an electron. */
export function buckRoutePoint(
  route: readonly (readonly [number, number])[],
  progress: number,
): [number, number] {
  const lengths = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1]));
  let distance = Math.max(0, Math.min(1, progress)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? distance / lengths[i] : 0;
      return [
        route[i][0] + (route[i + 1][0] - route[i][0]) * t,
        route[i][1] + (route[i + 1][1] - route[i][1]) * t,
      ];
    }
    distance -= lengths[i];
  }
  return [route[0][0], route[0][1]];
}
