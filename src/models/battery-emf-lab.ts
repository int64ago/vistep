export type SourceSample = { current: number; voltage: number };
export function loadedSource(
  emf: number,
  internal: number,
  load: number,
  voltmeter = Infinity,
  ammeter = 0,
) {
  if (
    ![emf, internal, load, ammeter].every(Number.isFinite) ||
    emf < 0 ||
    internal < 0 ||
    load <= 0 ||
    ammeter < 0 ||
    !(voltmeter > 0)
  )
    throw new RangeError('Finite nonnegative source and positive load required.');
  const conductance = 1 / (load + ammeter) + (Number.isFinite(voltmeter) ? 1 / voltmeter : 0),
    voltage = emf / (1 + internal * conductance),
    current = voltage / (load + ammeter),
    meterCurrent = Number.isFinite(voltmeter) ? voltage / voltmeter : 0,
    totalCurrent = current + meterCurrent;
  return {
    emf,
    internal,
    load,
    voltage,
    current,
    meterCurrent,
    totalCurrent,
    internalDrop: internal * totalCurrent,
    loadVoltage: current * load,
    sourcePower: emf * totalCurrent,
    internalPower: internal * totalCurrent ** 2,
  };
}
export function fitSource(samples: SourceSample[]) {
  if (samples.length < 2 || samples.some((x) => ![x.current, x.voltage].every(Number.isFinite)))
    throw new RangeError('At least two finite samples required.');
  const n = samples.length,
    meanI = samples.reduce((s, x) => s + x.current, 0) / n,
    meanU = samples.reduce((s, x) => s + x.voltage, 0) / n,
    variance = samples.reduce((s, x) => s + (x.current - meanI) ** 2, 0);
  if (variance === 0) throw new RangeError('Distinct load currents required.');
  const slope =
      samples.reduce((s, x) => s + (x.current - meanI) * (x.voltage - meanU), 0) / variance,
    emf = meanU - slope * meanI,
    residuals = samples.map((x) => x.voltage - (emf + slope * x.current));
  return {
    emf,
    internal: -slope,
    residuals,
    rms: Math.sqrt(residuals.reduce((s, x) => s + x * x, 0) / n),
  };
}
export function parallelLamps(count: number, internal = 1.2) {
  if (!Number.isInteger(count) || count < 1 || count > 8)
    throw new RangeError('One to eight lamps required.');
  const state = loadedSource(3, internal, 6 / count);
  return { ...state, count, branchCurrent: state.voltage / 6, lampPower: state.voltage ** 2 / 6 };
}
export const DRY_LOADS = [20, 14, 10, 7, 5, 3.5] as const;
export function drySamples(internal = 1, voltmeter = 10000) {
  return DRY_LOADS.map((load) => {
    const s = loadedSource(1.5, internal, load, voltmeter, 0.1);
    return { current: s.current, voltage: s.voltage };
  });
}
export const FRUIT_LOADS = [10000, 8000, 6000, 4000, 3000, 2000] as const;
export function fruitSamples(internal = 1800, voltmeter = 1e7) {
  return FRUIT_LOADS.map((load) => {
    const s = loadedSource(0.95, internal, load, voltmeter);
    return { current: s.voltage / load, voltage: s.voltage };
  });
}
export const ORANGE_DATA = [
  { load: 9000, current: 92e-6 },
  { load: 8000, current: 102e-6 },
  { load: 7000, current: 115e-6 },
  { load: 6000, current: 131e-6 },
  { load: 5000, current: 152e-6 },
  { load: 4000, current: 180e-6 },
  { load: 3000, current: 220e-6 },
].map((x) => ({ ...x, voltage: x.current * x.load }));
export const BANK_DATA = [
  { current: 0.169, voltage: 5.05 },
  { current: 0.313, voltage: 5.033 },
  { current: 0.665, voltage: 5.005 },
  { current: 0.933, voltage: 4.967 },
  { current: 1.179, voltage: 4.938 },
  { current: 1.373, voltage: 4.929 },
  { current: 1.627, voltage: 4.898 },
  { current: 1.887, voltage: 4.865 },
];
export const CHARGE_DATA = [
  { charge: 100, bankE: 5.07, bankR: 0.11, cellE: 4.16, cellR: 0.25 },
  { charge: 80, bankE: 5.04, bankR: 0.21, cellE: 3.96, cellR: 0.23 },
  { charge: 60, bankE: 5.04, bankR: 0.2, cellE: 3.85, cellR: 0.23 },
  { charge: 40, bankE: 5, bankR: 0.21, cellE: 3.8, cellR: 0.24 },
  { charge: 20, bankE: 5.14, bankR: 0.25, cellE: 3.75, cellR: 0.26 },
  { charge: 5, bankE: 5.08, bankR: 0.15, cellE: 3.64, cellR: 0.25 },
];
export function regulatedBank(load: number, chargeIndex = 0, limit = 2) {
  if (
    !Number.isFinite(load) ||
    load <= 0 ||
    !Number.isFinite(limit) ||
    limit <= 0 ||
    !Number.isInteger(chargeIndex) ||
    chargeIndex < 0 ||
    chargeIndex >= CHARGE_DATA.length
  )
    throw new RangeError('Positive load and current limit; known charge row required.');
  const row = CHARGE_DATA[chargeIndex],
    linear = loadedSource(row.bankE, row.bankR, load),
    limited = linear.current > limit,
    current = Math.min(linear.current, limit),
    voltage = current * load;
  return {
    ...linear,
    current,
    voltage,
    limited,
    limit,
    row,
    extrapolatedVoltage: row.bankE - row.bankR * current,
  };
}
export function fruitResistance(gapCm: number, depthCm: number) {
  if (![gapCm, depthCm].every(Number.isFinite) || gapCm <= 0 || depthCm <= 0)
    throw new RangeError('Positive electrode spacing and immersion required.');
  return (1800 * gapCm * 3) / depthCm;
}
export function bankSamples(index: number): SourceSample[] {
  if (index === 0) return BANK_DATA;
  if (index === 1)
    return [0.184, 0.288, 0.583, 0.781, 0.887, 1.209, 1.399, 1.642].map((current, i) => ({
      current,
      voltage: [5.011, 4.987, 4.904, 4.865, 4.839, 4.768, 4.749, 4.702][i],
    }));
  if (index === 2)
    return [0.173, 0.422, 0.642, 0.794, 1.04, 1.357, 1.576, 1.827].map((current, i) => ({
      current,
      voltage: [5.004, 4.948, 4.907, 4.89, 4.844, 4.764, 4.724, 4.681][i],
    }));
  if (!Number.isInteger(index) || index < 0 || index >= CHARGE_DATA.length)
    throw new RangeError('Known charge row required.');
  return BANK_DATA.map(({ current }) => ({
    current,
    voltage: CHARGE_DATA[index].bankE - CHARGE_DATA[index].bankR * current,
  }));
}
