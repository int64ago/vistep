/** CMOS teaching abstraction: complementary input-controlled resistive switches,
 * one lumped output capacitance per stage, no leakage or switching overlap.
 * Internal series nodes have no capacitance. This is not a MOSFET I–V model.
 */
export type CmosKind = 'inverter' | 'nand' | 'nor';
export type CmosBit = 0 | 1;
export type CmosInputs = readonly [CmosBit, CmosBit];
export type CmosLevel = '0' | 'X' | '1';
export interface CmosParameters {
  vdd: number;
  capacitance: number;
  resistanceP: number;
  resistanceN: number;
}
export const cmosDefaults = (): CmosParameters => ({
  vdd: 1.2,
  capacitance: 20e-15,
  resistanceP: 5000,
  resistanceN: 5000,
});
export const CMOS_THRESHOLDS = { low: 0.3, switch: 0.5, high: 0.7 };
export interface CmosDevice {
  id: string;
  type: 'p' | 'n';
  input: 0 | 1;
  a: string;
  b: string;
}
export const CMOS_TOPOLOGIES: Record<CmosKind, readonly CmosDevice[]> = {
  inverter: [
    { id: 'pA', type: 'p', input: 0, a: 'VDD', b: 'Y' },
    { id: 'nA', type: 'n', input: 0, a: 'Y', b: 'GND' },
  ],
  nand: [
    { id: 'pA', type: 'p', input: 0, a: 'VDD', b: 'Y' },
    { id: 'pB', type: 'p', input: 1, a: 'VDD', b: 'Y' },
    { id: 'nA', type: 'n', input: 0, a: 'Y', b: 'N1' },
    { id: 'nB', type: 'n', input: 1, a: 'N1', b: 'GND' },
  ],
  nor: [
    { id: 'pA', type: 'p', input: 0, a: 'VDD', b: 'P1' },
    { id: 'pB', type: 'p', input: 1, a: 'P1', b: 'Y' },
    { id: 'nA', type: 'n', input: 0, a: 'Y', b: 'GND' },
    { id: 'nB', type: 'n', input: 1, a: 'Y', b: 'GND' },
  ],
};
function validate(p: CmosParameters) {
  if (!Object.values(p).every((v) => Number.isFinite(v) && v > 0))
    throw new RangeError('Positive finite CMOS parameters required');
}
function checkInputs(inputs: CmosInputs) {
  if (inputs.length !== 2 || !inputs.every((v) => v === 0 || v === 1))
    throw new RangeError('Two binary control inputs required');
}
export function cmosLevel(voltage: number, vdd: number): CmosLevel {
  if (
    !Number.isFinite(voltage) ||
    !Number.isFinite(vdd) ||
    vdd <= 0 ||
    voltage < -1e-12 ||
    voltage > vdd + 1e-12
  )
    throw new RangeError('Voltage outside the supply rails');
  return voltage <= CMOS_THRESHOLDS.low * vdd
    ? '0'
    : voltage >= CMOS_THRESHOLDS.high * vdd
      ? '1'
      : 'X';
}
function connected(devices: { a: string; b: string; on: boolean }[], start: string) {
  const found = new Set([start]);
  for (let changed = true; changed;) {
    changed = false;
    for (const d of devices)
      if (d.on && (found.has(d.a) || found.has(d.b))) {
        if (!found.has(d.a) || !found.has(d.b)) changed = true;
        found.add(d.a);
        found.add(d.b);
      }
  }
  return found;
}
type SwitchedDevice = CmosDevice & { on: boolean; resistance: number };
/** Solve internal resistor nodes from KCL. Unconnected internal nodes are null,
 * rather than being silently assigned ground potential. */
function potentials(devices: SwitchedDevice[], vdd: number, output: number) {
  const known: Record<string, number | null> = { VDD: vdd, GND: 0, Y: output };
  const internal = [...new Set(devices.flatMap((d) => [d.a, d.b]))].filter((n) => !(n in known));
  const reachable = internal.filter((n) =>
    [...connected(devices, n)].some((node) => node in known),
  );
  for (const n of internal) if (!reachable.includes(n)) known[n] = null;
  const matrix = reachable.map((node, row) => {
    const values = Array<number>(reachable.length + 1).fill(0);
    for (const d of devices)
      if (d.on && (d.a === node || d.b === node)) {
        const other = d.a === node ? d.b : d.a,
          g = 1 / d.resistance;
        values[row] += g;
        const col = reachable.indexOf(other);
        if (col >= 0) values[col] -= g;
        else values[reachable.length] += g * (known[other] ?? 0);
      }
    return values;
  });
  for (let col = 0; col < reachable.length; col++) {
    const pivot = matrix[col][col];
    if (!(pivot > 0)) throw new Error('Singular connected resistor network');
    for (let j = col; j <= reachable.length; j++) matrix[col][j] /= pivot;
    for (let row = 0; row < reachable.length; row++)
      if (row !== col) {
        const scale = matrix[row][col];
        for (let j = col; j <= reachable.length; j++) matrix[row][j] -= scale * matrix[col][j];
      }
  }
  reachable.forEach((n, i) => {
    known[n] = matrix[i][reachable.length];
  });
  return known;
}
export function cmosNetwork(
  kind: CmosKind,
  parameters: CmosParameters,
  inputs: CmosInputs,
  output = 0,
) {
  validate(parameters);
  checkInputs(inputs);
  if (!(kind in CMOS_TOPOLOGIES)) throw new RangeError('Unknown CMOS gate');
  cmosLevel(output, parameters.vdd);
  const devices = CMOS_TOPOLOGIES[kind].map((d) => ({
    ...d,
    on: d.type === 'p' ? inputs[d.input] === 0 : inputs[d.input] === 1,
    resistance: d.type === 'p' ? parameters.resistanceP : parameters.resistanceN,
  }));
  const reachable = connected(devices, 'Y'),
    pullup = reachable.has('VDD'),
    pulldown = reachable.has('GND');
  if (pullup === pulldown)
    throw new Error(pullup ? 'Illegal supply short' : 'Undriven CMOS output');
  const probe = potentials(devices, 1, pullup ? 0 : 1);
  const effectiveG = Math.abs(
    devices.reduce((sum, d) => {
      if (!d.on) return sum;
      if (d.a === 'Y') return sum + ((probe[d.a] ?? 0) - (probe[d.b] ?? 0)) / d.resistance;
      if (d.b === 'Y') return sum + ((probe[d.b] ?? 0) - (probe[d.a] ?? 0)) / d.resistance;
      return sum;
    }, 0),
  );
  const resistance = 1 / effectiveG,
    target = pullup ? parameters.vdd : 0;
  const nodes = potentials(devices, parameters.vdd, output);
  const evaluated = devices.map((d) => ({
    ...d,
    current:
      d.on && nodes[d.a] !== null && nodes[d.b] !== null
        ? ((nodes[d.a] ?? 0) - (nodes[d.b] ?? 0)) / d.resistance
        : 0,
  }));
  const current = (target - output) / resistance;
  const sourceCurrent = pullup ? current : 0;
  return {
    kind,
    inputs: [...inputs] as [CmosBit, CmosBit],
    pullup,
    pulldown,
    target,
    resistance,
    tau: resistance * parameters.capacitance,
    nodes,
    devices: evaluated,
    current,
    sourceCurrent,
    sourcePower: parameters.vdd * sourceCurrent,
    heatPower: evaluated.reduce((s, d) => s + d.current ** 2 * d.resistance, 0),
    storagePower: output * current,
  };
}
export interface CmosEvent {
  at: number;
  inputs: CmosInputs;
}
export interface CmosSegment {
  start: number;
  end: number;
  initial: number;
  inputs: CmosInputs;
  target: number;
  resistance: number;
  sourceBefore: number;
  heatBefore: number;
  chargeBefore: number;
}
export interface CmosTrace {
  kind: CmosKind;
  parameters: CmosParameters;
  initial: number;
  duration: number;
  events: CmosEvent[];
  segments: CmosSegment[];
}
function response(segment: CmosSegment, p: CmosParameters, elapsed: number) {
  const tau = segment.resistance * p.capacitance,
    decay = Math.exp(-elapsed / tau);
  const voltage = segment.target + (segment.initial - segment.target) * decay;
  const charge = p.capacitance * (voltage - segment.initial);
  const source = segment.target > 0 ? p.vdd * charge : 0;
  const heat =
    (p.capacitance * (segment.initial - segment.target) ** 2 * -Math.expm1((-2 * elapsed) / tau)) /
    2;
  return { voltage, charge, source, heat };
}
export function cmosTrace(
  kind: CmosKind,
  parameters: CmosParameters,
  initial: number,
  schedule: readonly CmosEvent[],
  duration: number,
): CmosTrace {
  const p = { ...parameters };
  validate(p);
  cmosLevel(initial, p.vdd);
  if (!Number.isFinite(duration) || duration <= 0 || !schedule.length || schedule[0].at !== 0)
    throw new RangeError('A positive duration and a schedule starting at zero are required');
  schedule.forEach((event, i) => {
    checkInputs(event.inputs);
    if (
      !Number.isFinite(event.at) ||
      event.at < 0 ||
      event.at >= duration ||
      (i > 0 && event.at <= schedule[i - 1].at)
    )
      throw new RangeError('Input events must increase within the trace');
  });
  const events = schedule.map((e) => ({ at: e.at, inputs: [...e.inputs] as [CmosBit, CmosBit] }));
  let v = initial,
    sourceBefore = 0,
    heatBefore = 0,
    chargeBefore = 0;
  const segments = events.map((event, index) => {
    const network = cmosNetwork(kind, p, event.inputs, v);
    const segment = {
      start: event.at,
      end: events[index + 1]?.at ?? duration,
      initial: v,
      inputs: event.inputs,
      target: network.target,
      resistance: network.resistance,
      sourceBefore,
      heatBefore,
      chargeBefore,
    };
    const end = response(segment, p, segment.end - segment.start);
    v = end.voltage;
    sourceBefore += end.source;
    heatBefore += end.heat;
    chargeBefore += end.charge;
    return segment;
  });
  return { kind, parameters: p, initial, duration, events, segments };
}
export function cmosSample(trace: CmosTrace, requestedTime: number) {
  if (!Number.isFinite(requestedTime)) throw new RangeError('Finite sample time required');
  const time = Math.max(0, Math.min(trace.duration, requestedTime));
  const segment = trace.segments.findLast((s) => s.start <= time) ?? trace.segments[0];
  const state = response(segment, trace.parameters, time - segment.start);
  const network = cmosNetwork(trace.kind, trace.parameters, segment.inputs, state.voltage);
  const energy = (trace.parameters.capacitance * state.voltage ** 2) / 2;
  const initialEnergy = (trace.parameters.capacitance * trace.initial ** 2) / 2;
  return {
    time,
    voltage: state.voltage,
    level: cmosLevel(state.voltage, trace.parameters.vdd),
    targetLevel: network.pullup ? '1' : '0',
    network,
    inputs: segment.inputs,
    energy,
    sourceEnergy: segment.sourceBefore + state.source,
    heatEnergy: segment.heatBefore + state.heat,
    transferredCharge: segment.chargeBefore + state.charge,
    energyResidual:
      segment.sourceBefore +
      state.source -
      segment.heatBefore -
      state.heat -
      energy +
      initialEnergy,
    charge: trace.parameters.capacitance * state.voltage,
  };
}
export type CmosSample = ReturnType<typeof cmosSample>;
export function cmosCrossings(trace: CmosTrace, fraction = CMOS_THRESHOLDS.switch) {
  if (!(fraction > 0 && fraction < 1))
    throw new RangeError('Crossing fraction must be between rails');
  const voltage = fraction * trace.parameters.vdd;
  return trace.segments.flatMap((segment) => {
    const ratio = (voltage - segment.target) / (segment.initial - segment.target);
    if (!(ratio > 0 && ratio <= 1)) return [];
    const elapsed = -segment.resistance * trace.parameters.capacitance * Math.log(ratio);
    return elapsed <= segment.end - segment.start
      ? [{ at: segment.start + elapsed, rising: segment.target > segment.initial }]
      : [];
  });
}
export function cmosCascade(first: CmosTrace) {
  const initialBit: CmosBit =
    first.initial >= first.parameters.vdd * CMOS_THRESHOLDS.switch ? 1 : 0;
  const events: CmosEvent[] = [{ at: 0, inputs: [initialBit, 0] }];
  for (const crossing of cmosCrossings(first)) {
    const event: CmosEvent = { at: crossing.at, inputs: [crossing.rising ? 1 : 0, 0] };
    if (event.at >= first.duration) continue;
    if (Math.abs(events.at(-1)!.at - event.at) < 1e-24) events[events.length - 1] = event;
    else events.push(event);
  }
  return cmosTrace(
    'inverter',
    first.parameters,
    initialBit ? 0 : first.parameters.vdd,
    events,
    first.duration,
  );
}
export type CmosFocus =
  'charge' | 'discharge' | 'nand' | 'nor' | 'threshold' | 'load' | 'cascade' | 'energy';
const authored = new Map<string, CmosTrace>();
function cached(key: string, create: () => CmosTrace) {
  if (!authored.has(key)) authored.set(key, create());
  return authored.get(key)!;
}
export function cmosShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    u = Math.max(0, Math.min(1, progress)),
    p = cmosDefaults();
  const focus = ['charge', 'discharge', 'nand', 'nor', 'threshold', 'load', 'cascade', 'energy'][
    c
  ] as CmosFocus;
  let trace: CmosTrace,
    position = u,
    variant = 0,
    second: CmosTrace | undefined;
  if (c === 0) {
    trace = cached('charge', () =>
      cmosTrace('inverter', p, 0, [{ at: 0, inputs: [0, 0] }], 600e-12),
    );
    position = u * u;
  } else if (c === 1 || c === 4 || c === 6) {
    trace = cached('fall', () =>
      cmosTrace('inverter', p, p.vdd, [{ at: 0, inputs: [1, 0] }], 600e-12),
    );
    position = u * u;
    if (c === 6) second = cached('cascade', () => cmosCascade(trace));
  } else if (c === 2 || c === 3) {
    const kind = c === 2 ? 'nand' : 'nor';
    trace = cached(kind, () =>
      cmosTrace(
        kind,
        p,
        p.vdd,
        [
          { at: 0, inputs: [0, 0] },
          { at: 450e-12, inputs: [1, 0] },
          { at: 900e-12, inputs: [1, 1] },
          { at: 1350e-12, inputs: [0, 1] },
          { at: 1800e-12, inputs: [0, 0] },
        ],
        2400e-12,
      ),
    );
  } else if (c === 5) {
    variant = u < 0.5 ? 0 : 1;
    trace = cached(`load-${variant}`, () =>
      cmosTrace(
        'inverter',
        { ...p, capacitance: variant ? 40e-15 : 10e-15 },
        0,
        [{ at: 0, inputs: [0, 0] }],
        600e-12,
      ),
    );
    position = ((u - variant * 0.5) * 2) ** 2;
  } else {
    trace = cached('energy', () =>
      cmosTrace(
        'inverter',
        p,
        0,
        [
          { at: 0, inputs: [0, 0] },
          { at: 1200e-12, inputs: [1, 0] },
        ],
        2400e-12,
      ),
    );
    const half = u < 0.5 ? 0 : 1;
    position = (half + ((u - half * 0.5) * 2) ** 3) / 2;
  }
  const time = position * trace.duration;
  return {
    focus,
    trace,
    sample: cmosSample(trace, time),
    second,
    secondSample: second ? cmosSample(second, time) : undefined,
    variant,
  };
}
export type CmosShot = ReturnType<typeof cmosShot>;
export const cmosManualDefaults = () => ({
  kind: 'inverter' as CmosKind,
  parameters: cmosDefaults(),
  before: [0, 0] as [CmosBit, CmosBit],
  after: [1, 0] as [CmosBit, CmosBit],
  time: 0.18,
  cascade: false,
});
export function cmosReset() {
  return cmosManualDefaults();
}
export function cmosManualTrace(state: ReturnType<typeof cmosManualDefaults>) {
  const initial = cmosNetwork(state.kind, state.parameters, state.before).target;
  return cmosTrace(
    state.kind,
    state.parameters,
    initial,
    [{ at: 0, inputs: state.after }],
    1200e-12,
  );
}
