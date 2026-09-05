/** Perfect coupling, sinusoidal steady state and an open-secondary RL switch-on.
 * SI throughout. RMS phasors use Re{sqrt(2) V exp(jωt)}.
 * v1,v2: dotted → undotted; i1 enters dot, i2 leaves dot into the load.
 * Positive Φ goes up the left limb. Thus v=N dΦ/dt; loop emf=-N dΦ/dt.
 * Sources and approximations: docs/examples/transformer-electric-brief.md.
 */
export const ELECTRIC_TRANSFORMER = {
  primaryTurns: 24,
  area: 8e-4,
  magnetizingInductance: 0.5,
  voltageRms: 4,
  dcSeriesResistance: 128,
  coreLossResistance: 400,
  primaryResistance: 0.6,
  secondaryResistancePerTurn: 0.0125,
  linearLimitTesla: 1.4,
  geometry: {
    halfWidth: 2.1,
    bottom: 0.3,
    top: 4.3,
    limb: 0.72,
    depth: 0.78,
    limbX: 1.74,
    coilBottom: 1.14,
    coilTop: 3.46,
    windingX: 0.58,
    windingZ: 0.56,
    wireRadius: 0.021,
    laminations: 84,
  },
} as const;

export type ElectricInput = {
  secondaryTurns: number;
  frequency: number;
  voltageRms: number;
  loadOhms: number;
  connected: boolean;
  losses: boolean;
  ideal: boolean;
};
export const electricDefaults: ElectricInput = {
  secondaryTurns: 12,
  frequency: 50,
  voltageRms: 4,
  loadOhms: 12,
  connected: false,
  losses: false,
  ideal: false,
};
type Complex = { re: number; im: number };
const abs = (z: Complex) => Math.hypot(z.re, z.im);
const scale = (z: Complex, n: number): Complex => ({ re: z.re * n, im: z.im * n });
const multiply = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
const atPhase = (z: Complex, phase: number) =>
  Math.SQRT2 * (z.re * Math.cos(phase) - z.im * Math.sin(phase));
const positive = (v: number, name: string) => {
  if (!Number.isFinite(v) || v <= 0) throw new RangeError(`${name} must be finite and positive`);
  return v;
};

export function electricAC(input: ElectricInput) {
  const n1 = ELECTRIC_TRANSFORMER.primaryTurns,
    n2 = positive(input.secondaryTurns, 'turns');
  if (!Number.isInteger(n2) || n2 > 96)
    throw new RangeError('turns must be an integer from 1 to 96');
  const f = positive(input.frequency, 'frequency'),
    r = positive(input.loadOhms, 'load');
  if (!Number.isFinite(input.voltageRms) || input.voltageRms < 0)
    throw new RangeError('voltage must be nonnegative');
  const ratio = n2 / n1,
    omega = 2 * Math.PI * f;
  const rp = input.losses ? ELECTRIC_TRANSFORMER.primaryResistance : 0;
  const rs = input.losses ? n2 * ELECTRIC_TRANSFORMER.secondaryResistancePerTurn : 0;
  const gc = input.losses ? 1 / ELECTRIC_TRANSFORMER.coreLossResistance : 0;
  const lm = input.ideal && !input.losses ? Infinity : ELECTRIC_TRANSFORMER.magnetizingInductance;
  const gl = input.connected ? (ratio * ratio) / (r + rs) : 0;
  const admittance = { re: gl + gc, im: -1 / (omega * lm) };
  const denominator = { re: 1 + rp * admittance.re, im: rp * admittance.im };
  const norm = denominator.re ** 2 + denominator.im ** 2;
  const coreVoltage = {
    re: (input.voltageRms * denominator.re) / norm,
    im: (-input.voltageRms * denominator.im) / norm,
  };
  const primaryCurrent = multiply(coreVoltage, admittance);
  const primaryLoadCurrent = scale(coreVoltage, gl);
  const magnetizingCurrent = multiply(coreVoltage, { re: 0, im: -1 / (omega * lm) });
  const inducedSecondary = scale(coreVoltage, ratio);
  const secondaryCurrent = scale(inducedSecondary, input.connected ? 1 / (r + rs) : 0);
  const secondaryVoltage = input.connected ? scale(secondaryCurrent, r) : inducedSecondary;
  const phi = { re: coreVoltage.im / (omega * n1), im: -coreVoltage.re / (omega * n1) };
  const outputWatts = abs(secondaryCurrent) ** 2 * r;
  const copperWatts = abs(primaryCurrent) ** 2 * rp + abs(secondaryCurrent) ** 2 * rs;
  const coreWatts = abs(coreVoltage) ** 2 * gc;
  const inputWatts = input.voltageRms * primaryCurrent.re;
  return {
    input,
    ratio,
    omega,
    rp,
    rs,
    lm,
    coreVoltage,
    primaryCurrent,
    primaryLoadCurrent,
    magnetizingCurrent,
    inducedSecondary,
    secondaryCurrent,
    secondaryVoltage,
    phi,
    primaryRms: abs(primaryCurrent),
    primaryLoadRms: abs(primaryLoadCurrent),
    magnetizingRms: abs(magnetizingCurrent),
    secondaryRms: abs(secondaryCurrent),
    secondaryVoltageRms: abs(secondaryVoltage),
    coreVoltageRms: abs(coreVoltage),
    fluxPeak: Math.SQRT2 * abs(phi),
    bPeak: (Math.SQRT2 * abs(phi)) / ELECTRIC_TRANSFORMER.area,
    outputWatts,
    copperWatts,
    coreWatts,
    inputWatts,
    efficiency: inputWatts > 0 ? outputWatts / inputWatts : null,
    validLinear:
      (Math.SQRT2 * abs(phi)) / ELECTRIC_TRANSFORMER.area <= ELECTRIC_TRANSFORMER.linearLimitTesla,
  };
}
export type ElectricAC = ReturnType<typeof electricAC>;

export function electricInstant(ac: ElectricAC, phase: number) {
  if (!Number.isFinite(phase)) throw new RangeError('phase must be finite');
  const flux = atPhase(ac.phi, phase),
    dFlux = atPhase(ac.coreVoltage, phase) / ELECTRIC_TRANSFORMER.primaryTurns;
  const v1 = Math.SQRT2 * ac.input.voltageRms * Math.cos(phase);
  const i1 = atPhase(ac.primaryCurrent, phase),
    im = atPhase(ac.magnetizingCurrent, phase);
  const i2 = atPhase(ac.secondaryCurrent, phase),
    v2 = atPhase(ac.secondaryVoltage, phase);
  const vc = atPhase(ac.coreVoltage, phase);
  const copperPower = i1 * i1 * ac.rp + i2 * i2 * ac.rs;
  const corePower = ac.input.losses ? (vc * vc) / ELECTRIC_TRANSFORMER.coreLossResistance : 0;
  return {
    phase,
    time: phase / ac.omega,
    flux,
    dFlux,
    b: flux / ELECTRIC_TRANSFORMER.area,
    v1,
    v2,
    i1,
    i2,
    im,
    primaryLoad: atPhase(ac.primaryLoadCurrent, phase),
    e1: -ELECTRIC_TRANSFORMER.primaryTurns * dFlux,
    e2: -ac.input.secondaryTurns * dFlux,
    inputPower: v1 * i1,
    outputPower: v2 * i2,
    copperPower,
    corePower,
    fieldEnergy: Number.isFinite(ac.lm) ? (ac.lm * im * im) / 2 : 0,
    fieldPower: vc * im,
  };
}

/** Current-limited DC switch-on: secondary open, linear L, R external + winding. */
export function electricDC(time: number, secondaryTurns = 12, voltage = 4) {
  if (!Number.isFinite(time) || !Number.isFinite(voltage) || voltage < 0)
    throw new RangeError('finite time and nonnegative voltage required');
  positive(secondaryTurns, 'turns');
  const l = ELECTRIC_TRANSFORMER.magnetizingInductance,
    r = ELECTRIC_TRANSFORMER.dcSeriesResistance;
  const tau = l / r,
    decay = time < 0 ? 1 : Math.exp(-time / tau);
  const i1 = (voltage / r) * (1 - decay),
    dCurrent = time < 0 ? 0 : (voltage / l) * decay;
  const flux = (l * i1) / ELECTRIC_TRANSFORMER.primaryTurns;
  const dFlux = (l * dCurrent) / ELECTRIC_TRANSFORMER.primaryTurns;
  return {
    time,
    tau,
    i1,
    i2: 0,
    im: i1,
    primaryLoad: 0,
    flux,
    dFlux,
    b: flux / ELECTRIC_TRANSFORMER.area,
    v1: time < 0 ? 0 : voltage,
    v2: secondaryTurns * dFlux,
    e1: -ELECTRIC_TRANSFORMER.primaryTurns * dFlux,
    e2: -secondaryTurns * dFlux,
    inputPower: (time < 0 ? 0 : voltage) * i1,
    copperPower: r * i1 * i1,
    corePower: 0,
    outputPower: 0,
    fieldEnergy: (l * i1 * i1) / 2,
    fieldPower: l * i1 * dCurrent,
  };
}

export type ElectricPoint = [number, number, number];
export function electricCircuitGeometry(narrow: boolean) {
  const g = ELECTRIC_TRANSFORMER.geometry;
  return (['primary', 'secondary'] as const).map((side) => {
    const sign = side === 'primary' ? -1 : 1;
    const x = sign * (narrow ? 1.22 : 3.24),
      y = narrow ? -0.8 : 2.2,
      z = 0.91;
    const top = electricWindingPoint(side, 24, 1),
      bottom = electricWindingPoint(side, 24, 0);
    const upper: ElectricPoint[] = narrow
      ? [top, [sign * 2.43, g.coilTop + 0.1, 0.7], [sign * 2.6, 0.0, z], [x, y + 0.87, z]]
      : [top, [sign * 2.6, g.coilTop + 0.1, 0.7], [x, y + 0.87, z]];
    const lower: ElectricPoint[] = narrow
      ? [[x, y - 0.44, z], [sign * 0.52, y - 0.44, z], [sign * 0.77, 0.55, z], bottom]
      : [[x, y - 0.44, z], [x, 0.92, z], bottom];
    return {
      side,
      x,
      y,
      z,
      upper,
      lower,
      switchTop: [x, y + 0.87, z] as ElectricPoint,
      switchBottom: [x, y + 0.44, z] as ElectricPoint,
    };
  });
}
/** Continuous helical centreline, bottom to top. Secondary handedness reverses
 * because the two legs carry opposite B. Both top terminals are polarity dots. */
export function electricWindingPoint(
  side: 'primary' | 'secondary',
  turns: number,
  t: number,
): ElectricPoint {
  const g = ELECTRIC_TRANSFORMER.geometry,
    sign = side === 'primary' ? -1 : 1;
  const angle = Math.PI / 2 + (side === 'primary' ? 1 : -1) * 2 * Math.PI * turns * t;
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return [
    sign * g.limbX + g.windingX * Math.sign(c) * Math.sqrt(Math.abs(c)),
    g.coilBottom + (g.coilTop - g.coilBottom) * t,
    g.windingZ * Math.sign(s) * Math.sqrt(Math.abs(s)),
  ];
}
/** Closed, rounded rectangular flux centreline, up left limb. No field particles. */
export function electricFluxPoint(fraction: number, z = 0.414): ElectricPoint {
  const g = ELECTRIC_TRANSFORMER.geometry,
    x = g.limbX,
    lo = g.bottom + g.limb / 2,
    hi = g.top - g.limb / 2;
  const r = 0.24,
    vertical = hi - lo - 2 * r,
    horizontal = 2 * x - 2 * r;
  const arc = (Math.PI * r) / 2,
    lengths = [vertical, arc, horizontal, arc, vertical, arc, horizontal, arc];
  const perimeter = lengths.reduce((a, b) => a + b, 0);
  let d = (((fraction % 1) + 1) % 1) * perimeter;
  let part = 0;
  while (part < 7 && d > lengths[part]) d -= lengths[part++];
  const q = d / lengths[part];
  if (part === 0) return [-x, lo + r + q * vertical, z];
  if (part === 2) return [-x + r + q * horizontal, hi, z];
  if (part === 4) return [x, hi - r - q * vertical, z];
  if (part === 6) return [x - r - q * horizontal, lo, z];
  const center: [number, number] =
    part === 1
      ? [-x + r, hi - r]
      : part === 3
        ? [x - r, hi - r]
        : part === 5
          ? [x - r, lo + r]
          : [-x + r, lo + r];
  const angle = Math.PI - (((part - 1) / 2) * Math.PI) / 2 - (q * Math.PI) / 2;
  return [center[0] + r * Math.cos(angle), center[1] + r * Math.sin(angle), z];
}
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const q = clamp(x);
  return q * q * (3 - 2 * q);
};
export const electricRamp = (p: number, a: number, b: number) => smooth((p - a) / (b - a));

/** Story time is pedagogically slowed. AC snapshots are steady states; parameter
 * sweeps do not claim to solve switching transients. DC has its own physical time. */
export function electricShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    p = clamp(progress);
  const input = { ...electricDefaults };
  let cycles = p * 2,
    coilOpacity = 1;
  if (c === 1) {
    // Hold at Φ peak, then at Φ zero; deterministic under paused chapter seeks.
    cycles =
      0.25 * electricRamp(p, 0, 0.23) +
      0.25 * electricRamp(p, 0.43, 0.67) +
      0.5 * electricRamp(p, 0.79, 1);
  }
  if (c === 2) {
    input.secondaryTurns = p < 0.35 ? 12 : p < 0.68 ? 24 : 48;
    const distance = Math.min(Math.abs(p - 0.35), Math.abs(p - 0.68));
    coilOpacity = 0.08 + 0.92 * smooth(distance / 0.035);
  }
  if (c === 3) input.connected = p >= 0.25;
  if (c === 4) {
    input.connected = true;
    input.ideal = true;
    input.secondaryTurns = p < 0.5 ? 12 : 48;
    input.loadOhms = p < 0.5 ? 12 : 192; // Equal output power; ratio changes current.
    coilOpacity = 0.08 + 0.92 * smooth(Math.abs(p - 0.5) / 0.04);
  }
  if (c === 5) cycles = 0;
  if (c === 6) {
    input.losses = true;
    input.connected = p >= 0.36;
  }
  if (c === 7) {
    input.connected = true;
    input.frequency = 50 + 50 * electricRamp(p, 0.3, 0.78);
  }
  const ac = electricAC(input),
    dcTime =
      ((9 * electricRamp(p, 0.13, 0.85) - 1) * ELECTRIC_TRANSFORMER.magnetizingInductance) /
      ELECTRIC_TRANSFORMER.dcSeriesResistance;
  const phase = cycles * Math.PI * 2;
  return {
    chapter: c,
    progress: p,
    input,
    ac,
    phase,
    dcTime,
    dc: c === 5,
    instant: c === 5 ? electricDC(dcTime, input.secondaryTurns) : electricInstant(ac, phase),
    coilOpacity,
    showPower: c === 4 || c === 6,
    showLosses: c === 6,
    fieldFocus: c === 1 ? electricRamp(p, 0.04, 0.2) * (1 - electricRamp(p, 0.82, 1)) : 0,
    laminationFocus: c === 6 ? electricRamp(p, 0.1, 0.28) * (1 - electricRamp(p, 0.8, 1)) : 0,
  };
}
export type ElectricShot = ReturnType<typeof electricShot>;
