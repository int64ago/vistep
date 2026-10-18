export type AcApparatus = 'scope' | 'led' | 'inductor' | 'capacitor' | 'lc';
export function sinusoidalCircuit(
  kind: 'inductor' | 'capacitor',
  frequency = 50,
  reactiveValue = kind === 'inductor' ? 0.04 : 0.0001,
  phase = 0,
  dc = false,
) {
  const resistance = kind === 'inductor' ? 8 : 6,
    voltageRms = 3,
    w = 2 * Math.PI * Math.max(0, frequency);
  const reactance = dc
    ? 0
    : kind === 'inductor'
      ? w * reactiveValue
      : w > 0 && reactiveValue > 0
        ? -1 / (w * reactiveValue)
        : Number.NEGATIVE_INFINITY;
  const impedance = Math.hypot(resistance, reactance),
    currentRms = dc ? (kind === 'capacitor' ? 0 : voltageRms / resistance) : voltageRms / impedance;
  const lag = dc ? 0 : Math.atan2(reactance, resistance),
    voltage = dc ? voltageRms : Math.SQRT2 * voltageRms * Math.sin(phase);
  const current = dc ? currentRms : Math.SQRT2 * currentRms * Math.sin(phase - lag);
  return {
    resistance,
    reactance,
    impedance,
    currentRms,
    lag,
    voltage,
    current,
    lampPower: currentRms * currentRms * 6,
  };
}
export function capacitorCharging(time: number, capacitance = 0.0001) {
  const c = Math.max(1e-9, capacitance),
    r = 6,
    voltage = 3,
    t = Math.max(0, time),
    current = (voltage / r) * Math.exp(-t / (r * c));
  return {
    current,
    voltage: voltage * (1 - Math.exp(-t / (r * c))),
    lampPower: current * current * r,
  };
}
export function generatorLeds(phase: number) {
  const voltage = 4 * Math.sin(phase),
    threshold = 1.8,
    resistance = 100;
  return {
    voltage,
    forward: Math.max(0, (voltage - threshold) / resistance),
    reverse: Math.max(0, (-voltage - threshold) / resistance),
    angle: phase,
  };
}
export function lcOscillation(time: number, inductance = 0.2, capacitance = 0.001, resistance = 1) {
  const L = Math.max(0.001, inductance),
    C = Math.max(1e-8, capacitance),
    R = Math.max(0, resistance),
    t = Math.max(0, time),
    u0 = 5,
    q0 = C * u0,
    a = R / (2 * L),
    w0 = 1 / Math.sqrt(L * C),
    d = a * a - w0 * w0;
  let q: number, current: number;
  if (Math.abs(d) < 1e-9) {
    q = q0 * Math.exp(-a * t) * (1 + a * t);
    current = q0 * a * a * t * Math.exp(-a * t);
  } else if (d < 0) {
    const w = Math.sqrt(-d),
      e = Math.exp(-a * t);
    q = q0 * e * (Math.cos(w * t) + (a / w) * Math.sin(w * t));
    current = ((q0 * w0 * w0) / w) * e * Math.sin(w * t);
  } else {
    const z = Math.sqrt(d),
      r1 = -a + z,
      r2 = -a - z,
      A = (-q0 * r2) / (r1 - r2),
      B = (q0 * r1) / (r1 - r2);
    q = A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
    current = -A * r1 * Math.exp(r1 * t) - B * r2 * Math.exp(r2 * t);
  }
  const electric = (q * q) / (2 * C),
    magnetic = 0.5 * L * current * current,
    initial = 0.5 * C * u0 * u0;
  return {
    q,
    current,
    voltage: q / C,
    electric,
    magnetic,
    heat: Math.max(0, initial - electric - magnetic),
    initial,
    period: (2 * Math.PI) / w0,
    powerLoss: R * current * current,
  };
}
export function acShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    apparatus: (chapter < 2
      ? 'scope'
      : chapter < 4
        ? 'led'
        : chapter < 6
          ? 'inductor'
          : chapter < 9
            ? 'capacitor'
            : 'lc') as AcApparatus,
    dc: [0, 4, 6].includes(chapter),
    frequency: chapter === 8 ? 100 : 50,
    phase: chapter === 2 ? p * Math.PI : chapter === 3 ? (1 + p) * Math.PI : p * 6 * Math.PI,
    charging: chapter === 9,
    lcTime:
      chapter === 9 ? 0 : p * (chapter === 11 ? 10 : 3) * 2 * Math.PI * Math.sqrt(0.2 * 0.001),
    stage: chapter,
  };
}
