/** Passive series-series compensated inductive link. RMS phasors, SI units.
 * Both dotted terminals are the inner spiral ends. Positive coil current runs
 * inner→outer; both coil normals are +y. This is an AC load, not a battery model.
 */
export type WCComplex = { re: number; im: number };
export type WCPoint = [number, number, number];
export const WIRELESS = {
  turns: 8,
  innerRadius: 0.0085,
  pitch: 0.0016,
  wireRadius: 0.00045,
  backedL: 6.8e-6,
  airL: 4.2e-6,
  frequency: 150e3,
  sourceR: 0.5,
  r1: 0.25,
  r2: 0.28,
  voltage: 2,
  load: 3,
  scale: 100,
  txHeight: 0.005,
} as const;
export const wirelessOuterRadius = WIRELESS.innerRadius + WIRELESS.turns * WIRELESS.pitch;
export const wirelessCapacitance = 1 / ((2 * Math.PI * WIRELESS.frequency) ** 2 * WIRELESS.backedL);
const c = (re = 0, im = 0): WCComplex => ({ re, im });
export const wcAdd = (a: WCComplex, b: WCComplex) => c(a.re + b.re, a.im + b.im);
export const wcMul = (a: WCComplex, b: WCComplex) =>
  c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const wcDiv = (a: WCComplex, b: WCComplex) => {
  const d = b.re * b.re + b.im * b.im;
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
export const wcAbs = (a: WCComplex) => Math.hypot(a.re, a.im);
export const wcInstant = (a: WCComplex, phase: number) =>
  Math.SQRT2 * (a.re * Math.cos(phase) - a.im * Math.sin(phase));
const clamp = (x: number, a: number, b: number) =>
  Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));
export type WirelessInput = {
  gap: number;
  offset: number;
  frequency: number;
  voltage: number;
  load: number;
  connected: boolean;
  ferrite: boolean;
  lossScale: number;
  phase: number;
};
export const wirelessDefaults: WirelessInput = {
  gap: 0.008,
  offset: 0,
  frequency: 150e3,
  voltage: 2,
  load: 3,
  connected: true,
  ferrite: true,
  lossScale: 1,
  phase: Math.PI / 4,
};
export function normalizeWireless(input: WirelessInput): WirelessInput {
  return {
    ...input,
    gap: clamp(input.gap, 0.002, 0.024),
    offset: clamp(input.offset, 0, 0.032),
    frequency: clamp(input.frequency, 0, 1e6),
    voltage: clamp(input.voltage, 0, 3),
    load: clamp(input.load, 0.5, 12),
    lossScale: clamp(input.lossScale, 1, 4),
    phase: Number.isFinite(input.phase) ? input.phase : 0,
  };
}
/** Authored geometry-shaped approximation, NOT a field solver or Qi calibration.
 * Gap follows an axial-loop decay envelope; lateral offset is a Gaussian proxy.
 * Ferrite effects on L and k are illustrative declared values.
 */
export function wirelessCoupling(gap: number, offset: number, ferrite = true) {
  const k0 = ferrite ? 0.22 : 0.1364;
  return (k0 / (1 + (gap / 0.015) ** 2) ** 1.5) * Math.exp(-((offset / 0.022) ** 2));
}
export type CoupledCircuit = {
  frequency: number;
  voltage: number;
  l1: number;
  l2: number;
  m: number;
  c1: number;
  c2: number;
  r1: number;
  r2: number;
  sourceR: number;
  load: number;
  connected: boolean;
};
export function solveWirelessCircuit(p: CoupledCircuit) {
  for (const key of ['l1', 'l2', 'c1', 'c2', 'r1', 'r2', 'sourceR', 'load'] as const)
    if (!Number.isFinite(p[key]) || p[key] <= 0) throw new RangeError(`Positive ${key} required`);
  if (
    !Number.isFinite(p.frequency) ||
    p.frequency < 0 ||
    !Number.isFinite(p.voltage) ||
    p.voltage < 0 ||
    !Number.isFinite(p.m) ||
    p.m * p.m > p.l1 * p.l2
  )
    throw new RangeError('Passive inductance matrix and finite nonnegative source required');
  const w = 2 * Math.PI * p.frequency;
  let i1 = c(),
    i2 = c(),
    reflected = c(),
    x1: number | null = null,
    x2: number | null = null;
  if (w > 0) {
    x1 = w * p.l1 - 1 / (w * p.c1);
    x2 = w * p.l2 - 1 / (w * p.c2);
    const z1 = c(p.sourceR + p.r1, x1),
      z2 = c(p.r2 + p.load, x2);
    reflected = p.connected ? wcDiv(c((w * p.m) ** 2), z2) : c();
    i1 = wcDiv(c(p.voltage), wcAdd(z1, reflected));
    i2 = p.connected ? wcDiv(wcMul(c(0, -w * p.m), i1), z2) : c();
  }
  const linkedFlux = wcMul(c(p.m), i1),
    selfFlux = wcMul(c(p.l1), i1);
  const induced = wcMul(c(0, -w), linkedFlux),
    loadVoltage = wcMul(c(p.load), i2);
  const inputPower = p.voltage * i1.re,
    sourceLoss = wcAbs(i1) ** 2 * p.sourceR;
  const txLoss = wcAbs(i1) ** 2 * p.r1,
    rxLoss = wcAbs(i2) ** 2 * p.r2,
    loadPower = wcAbs(i2) ** 2 * p.load;
  return {
    i1,
    i2,
    reflected,
    x1,
    x2,
    linkedFlux,
    selfFlux,
    induced,
    loadVoltage,
    inputPower,
    sourceLoss,
    txLoss,
    rxLoss,
    loadPower,
    efficiency: inputPower > 0 ? loadPower / inputPower : 0,
    resonance1: 1 / (2 * Math.PI * Math.sqrt(p.l1 * p.c1)),
    resonance2: 1 / (2 * Math.PI * Math.sqrt(p.l2 * p.c2)),
    magneticDeterminant: p.l1 * p.l2 - p.m * p.m,
  };
}
export function wirelessState(raw: WirelessInput) {
  const input = normalizeWireless(raw),
    l = input.ferrite ? WIRELESS.backedL : WIRELESS.airL;
  const coupling = wirelessCoupling(input.gap, input.offset, input.ferrite),
    m = coupling * l;
  const circuit: CoupledCircuit = {
    frequency: input.frequency,
    voltage: input.voltage,
    l1: l,
    l2: l,
    m,
    c1: wirelessCapacitance,
    c2: wirelessCapacitance,
    r1: WIRELESS.r1 * input.lossScale,
    r2: WIRELESS.r2 * input.lossScale,
    sourceR: WIRELESS.sourceR,
    load: input.load,
    connected: input.connected,
  };
  const s = solveWirelessCircuit(circuit);
  return {
    ...s,
    input,
    circuit,
    coupling,
    m,
    instantI1: wcInstant(s.i1, input.phase),
    instantI2: wcInstant(s.i2, input.phase),
    instantFlux: wcInstant(s.linkedFlux, input.phase),
    instantEmf: wcInstant(s.induced, input.phase),
    phaseDifference:
      wcAbs(s.i2) > 1e-12 ? Math.atan2(s.i2.im, s.i2.re) - Math.atan2(s.i1.im, s.i1.re) : null,
  };
}
export type WirelessState = ReturnType<typeof wirelessState>;
/** Exactly eight continuous Archimedean turns, with separate inner/outer ends. */
export function wirelessCoilPoint(u: number): WCPoint {
  const t = clamp(u, 0, 1),
    a = t * 2 * Math.PI * WIRELESS.turns,
    r = WIRELESS.innerRadius + WIRELESS.pitch * WIRELESS.turns * t;
  return [r * Math.cos(a), 0, -r * Math.sin(a)];
}
export const wirelessPorts = {
  capLeft: [-0.012, 0, 0.029] as WCPoint,
  capRight: [-0.007, 0, 0.029] as WCPoint,
  deviceLeft: [-0.003, 0, 0.029] as WCPoint,
  deviceRight: [0.003, 0, 0.029] as WCPoint,
};
/** Inner crossover is on an insulated second level, clearing every outer turn. */
export function wirelessWires(receiver = false) {
  const level = receiver ? 0.0015 : -0.0015;
  return {
    inner: [
      wirelessCoilPoint(0),
      [WIRELESS.innerRadius, level, 0],
      [-0.027, level, 0],
      [-0.027, 0, 0.029],
      wirelessPorts.capLeft,
    ] as WCPoint[],
    outer: [
      wirelessCoilPoint(1),
      [0.027, 0, 0],
      [0.027, 0, 0.029],
      wirelessPorts.deviceRight,
    ] as WCPoint[],
    bridge: [wirelessPorts.capRight, wirelessPorts.deviceLeft] as WCPoint[],
  };
}
export function wirelessReceiverOffset(input: WirelessInput, narrow = false): WCPoint {
  return narrow ? [0, input.gap, -input.offset] : [input.offset, input.gap, 0];
}
/** Closed return-path guide only, NOT a quantitative B-field streamline. */
export function wirelessFluxPath(input: WirelessInput, azimuth: number, narrow = false): WCPoint[] {
  const shift = wirelessReceiverOffset(input, narrow),
    r = 0.029,
    dx = Math.cos(azimuth),
    dz = Math.sin(azimuth);
  return [
    [dx * 0.003, -0.003, dz * 0.003],
    [shift[0] + dx * 0.003, input.gap + 0.003, shift[2] + dz * 0.003],
    [shift[0] + dx * r, input.gap + 0.006, shift[2] + dz * r],
    [shift[0] * 0.5 + dx * r * 1.08, input.gap * 0.5, shift[2] * 0.5 + dz * r * 1.08],
    [dx * r, -0.006, dz * r],
  ];
}
/** Periodic smooth interpolation of the explicitly qualitative return guide. */
export function wirelessFluxPoint(
  input: WirelessInput,
  azimuth: number,
  u: number,
  narrow = false,
): WCPoint {
  const points = wirelessFluxPath(input, azimuth, narrow),
    n = points.length;
  const phase = (((u % 1) + 1) % 1) * n,
    i = Math.floor(phase),
    t = phase - i;
  const a = points[(i + n - 1) % n],
    b = points[i],
    c = points[(i + 1) % n],
    d = points[(i + 2) % n];
  return [0, 1, 2].map(
    (k) =>
      0.5 *
      (2 * b[k] +
        (-a[k] + c[k]) * t +
        (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t +
        (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t),
  ) as WCPoint;
}
const ease = (v: number) => {
  const t = clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};
export function wirelessShot(chapterInput: number, progressInput: number) {
  const chapter = Math.floor(clamp(chapterInput, 0, 7)),
    progress = clamp(progressInput, 0, 1);
  const input = { ...wirelessDefaults, phase: progress * 2 * Math.PI };
  let focus: 'drive' | 'induction' | 'load' | 'gap' | 'offset' | 'tuning' | 'ferrite' | 'power' =
    'drive';
  if (chapter === 0) {
    input.connected = false;
    input.voltage = 2 * ease((progress - 0.12) / 0.5);
  }
  if (chapter === 1) {
    focus = 'induction';
    input.connected = false;
  }
  if (chapter === 2) {
    focus = 'load';
    input.connected = progress >= 0.35;
  }
  if (chapter === 3) {
    focus = 'gap';
    input.gap = 0.02 - 0.017 * ease((progress - 0.1) / 0.75);
  }
  if (chapter === 4) {
    focus = 'offset';
    input.gap = 0.004;
    input.offset = 0.03 * ease((progress - 0.12) / 0.7);
  }
  if (chapter === 5) {
    focus = 'tuning';
    input.gap = 0.006;
    input.frequency = 85e3 + 65e3 * ease((progress - 0.1) / 0.72);
  }
  if (chapter === 6) {
    focus = 'ferrite';
    input.gap = 0.006;
    input.ferrite = progress < 0.5;
  }
  if (chapter === 7) {
    focus = 'power';
    input.gap = 0.006;
    input.lossScale = 1 + 2.5 * ease((progress - 0.15) / 0.65);
  }
  return {
    chapter,
    progress,
    focus,
    input,
    state: wirelessState(input),
    showFlux: chapter === 1 || chapter === 3 || chapter === 6,
  };
}
export type WirelessShot = ReturnType<typeof wirelessShot>;
