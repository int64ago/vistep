/** Exact first-order response of a linear capacitor through a positive resistor
 * to an ideal DC source. Target zero is a closed resistor discharge loop. SI. */
export interface RCParameters {
  resistance: number;
  capacitance: number;
  target: number;
  initial: number;
}
export const rcDefaults = (): RCParameters => ({
  resistance: 1000,
  capacitance: 0.001,
  target: 5,
  initial: 0,
});
export function rcState(p: RCParameters, time: number) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.resistance <= 0 ||
    p.capacitance <= 0 ||
    p.target < 0 ||
    p.initial < 0 ||
    !Number.isFinite(time) ||
    time < 0
  )
    throw new RangeError('Positive finite R and C; nonnegative voltages and time required');
  const tau = p.resistance * p.capacitance,
    decay = Math.exp(-time / tau),
    voltage = p.target + (p.initial - p.target) * decay,
    current = (p.target - voltage) / p.resistance,
    charge = p.capacitance * voltage;
  const energy = 0.5 * p.capacitance * voltage ** 2,
    initialEnergy = 0.5 * p.capacitance * p.initial ** 2,
    sourceEnergy = p.target * p.capacitance * (voltage - p.initial),
    heat = 0.5 * p.capacitance * (p.initial - p.target) ** 2 * -Math.expm1((-2 * time) / tau);
  return {
    time,
    tau,
    voltage,
    current,
    charge,
    energy,
    initialEnergy,
    sourceEnergy,
    heat,
    resistorVoltage: p.target - voltage,
    energyResidual: sourceEnergy + initialEnergy - energy - heat,
  };
}
export function rcShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    e = u * u * (3 - 2 * u),
    p = rcDefaults();
  let time = 0;
  if (chapter === 0) time = 0.2 * e;
  if (chapter === 1) time = e;
  if (chapter === 2) time = 1 + 4 * e;
  if (chapter === 3) {
    p.resistance = 1000 + 4000 * e;
    time = 1;
  }
  if (chapter === 4) {
    p.capacitance = 0.001 + 0.001 * e;
    time = 1;
  }
  if (chapter === 5) {
    p.target = 0;
    p.initial = 5;
    time = 4 * e;
  }
  if (chapter >= 6) time = 5 * e;
  return { parameters: p, state: rcState(p, time) };
}
export function rcCurve(p: RCParameters, duration: number, samples = 80) {
  if (
    !Number.isInteger(samples) ||
    samples < 2 ||
    samples > 1000 ||
    !Number.isFinite(duration) ||
    duration <= 0
  )
    throw new RangeError('Finite positive duration and 2–1000 samples required');
  return Array.from({ length: samples + 1 }, (_, i) => rcState(p, (duration * i) / samples));
}
