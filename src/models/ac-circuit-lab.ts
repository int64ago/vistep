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
/** RL turn-on, with 6 Ω lamp plus 2 Ω winding resistance. */
export function inductorCharging(time: number, inductance = 0.04) {
  const L = Math.max(1e-9, inductance),
    resistance = 8,
    voltage = 3,
    tau = L / resistance,
    decay = Math.exp(-Math.max(0, time) / tau),
    current = (voltage / resistance) * (1 - decay),
    derivative = (voltage / L) * decay;
  return {
    current,
    derivative,
    voltage: voltage * decay,
    backEmf: -voltage * decay,
    tau,
    lampPower: current * current * 6,
  };
}

/** Passive-sign component voltage; conventional current enters the capacitor's positive-q plate. */
export function reactiveCircuitState(
  kind: 'inductor' | 'capacitor',
  frequency: number,
  value: number,
  phase: number,
  dc = false,
  time = 0,
) {
  const steady = sinusoidalCircuit(kind, frequency, value, phase, dc),
    w = Math.max(0, frequency) * 2 * Math.PI,
    transient =
      kind === 'inductor' ? inductorCharging(time, value) : capacitorCharging(time, value),
    current = dc ? transient.current : steady.current,
    derivative = dc
      ? kind === 'inductor'
        ? inductorCharging(time, value).derivative
        : -current / (6 * Math.max(value, 1e-9))
      : w * Math.SQRT2 * steady.currentRms * Math.cos(phase - steady.lag),
    componentVoltage = dc
      ? transient.voltage
      : kind === 'inductor'
        ? value * derivative
        : w > 0 && value > 0
          ? (-Math.SQRT2 * steady.currentRms * Math.cos(phase - steady.lag)) / (w * value)
          : steady.voltage,
    charge = kind === 'capacitor' ? value * componentVoltage : 0;
  return {
    ...steady,
    current,
    derivative,
    componentVoltage,
    charge,
    backEmf: kind === 'inductor' ? -componentVoltage : 0,
    electric: kind === 'capacitor' ? 0.5 * value * componentVoltage ** 2 : 0,
    magnetic: kind === 'inductor' ? 0.5 * value * current ** 2 : 0,
    lampPower: dc ? transient.lampPower : steady.lampPower,
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

export type AcSceneState = {
  apparatus: AcApparatus;
  dc: boolean;
  frequency: number;
  phase: number;
  inductance: number;
  capacitance: number;
  resistance: number;
  transientTime: number;
  cycles: number;
  charging: boolean;
  chapter: number;
};
const smooth = (p: number) => {
  const x = Math.max(0, Math.min(1, p));
  return x * x * (3 - 2 * x);
};
/** One ideal LC cycle, with inspection holds at zero voltage and reverse maximum charge. */
export function lcExchangeCycle(progress: number, locale: 'zh' | 'en' = 'zh') {
  const time = Math.max(0, Math.min(1, progress)) * 28;
  // Measured bilingual word times. Holds cover each zero-voltage/current-maximum claim.
  const [start, quarter, leave, reverse, returnStart, returnEnd, finish] =
    locale === 'en'
      ? [6.2, 9.8, 14.65, 18.7, 21.3, 22.2, 25]
      : [5.6, 9.1, 13.3, 16.9, 17.4, 18.5, 24];
  if (time < start) return 0;
  if (time < quarter) return 0.25 * smooth((time - start) / (quarter - start));
  if (time < leave) return 0.25;
  if (time < reverse) return 0.25 + 0.25 * smooth((time - leave) / (reverse - leave));
  if (time < returnStart) return 0.5;
  if (time < returnEnd)
    return 0.5 + 0.25 * smooth((time - returnStart) / (returnEnd - returnStart));
  if (time < finish) return 0.75;
  return 0.75 + 0.25 * smooth((time - finish) / (28 - finish));
}
export function acFilmState(
  chapter: number,
  progress: number,
  locale: 'zh' | 'en' = 'zh',
): AcSceneState {
  const p = Math.max(0, Math.min(1, progress)),
    old = acShot(chapter, p),
    duration = [22, 22, 22, 22, 24.5, 23, 24.5, 24.5, 25.5, 23, 28, 25.5][chapter] ?? 22,
    time = p * duration,
    frequencyStart = chapter === 8 ? 3.9 : 14,
    frequencyEnd = chapter === 8 ? 7 : 17,
    u = (time - frequencyStart) / (frequencyEnd - frequencyStart),
    integratedRise = u <= 0 ? 0 : u >= 1 ? u - 0.5 : u ** 3 - 0.5 * u ** 4,
    changingFrequency = chapter === 5 || chapter === 8,
    phase =
      ((2 * Math.PI) / 12) *
      (time + (changingFrequency ? (frequencyEnd - frequencyStart) * integratedRise : 0));
  return {
    apparatus: old.apparatus,
    dc: old.dc,
    frequency: changingFrequency ? 50 + 50 * smooth(u) : 50,
    phase: chapter === 2 || chapter === 3 ? old.phase : phase,
    inductance: 0.04,
    capacitance: 0.0001,
    resistance: chapter === 10 ? 0 : 1,
    transientTime:
      (chapter === 4 ? 0.04 / 8 : 6 * 0.0001) *
      6 *
      smooth((time - (chapter === 4 ? 3.5 : 2.5)) / 12),
    cycles: chapter === 9 ? 0 : chapter === 10 ? lcExchangeCycle(p, locale) : p * 10,
    charging: chapter === 9,
    chapter,
  };
}
