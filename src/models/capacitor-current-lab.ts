export function dischargeState(
  time: number,
  capacitance = 1000e-6,
  resistance = 2000,
  initialVoltage = 6,
) {
  if (
    ![time, capacitance, resistance, initialVoltage].every(Number.isFinite) ||
    time < 0 ||
    capacitance <= 0 ||
    resistance <= 0 ||
    initialVoltage < 0
  )
    throw new RangeError('Physical RC parameters required.');
  const tau = resistance * capacitance,
    voltage = initialVoltage * Math.exp(-time / tau),
    current = voltage / resistance,
    remainingCharge = capacitance * voltage,
    releasedCharge = capacitance * initialVoltage * -Math.expm1(-time / tau);
  return {
    time,
    tau,
    voltage,
    current,
    remainingCharge,
    releasedCharge,
    initialCharge: capacitance * initialVoltage,
    capacitance,
    resistance,
    initialVoltage,
  };
}
export function sensorSamples(
  time: number,
  capacitance = 1000e-6,
  resistance = 2000,
  initialVoltage = 6,
  step = 0.05,
) {
  if (![time, step].every(Number.isFinite) || time < 0 || step <= 0 || time / step > 1e6)
    throw new RangeError('Finite sampling interval and bounded sample count required.');
  const count = Math.floor(time / step),
    times = Array.from({ length: count + 1 }, (_, i) => i * step);
  if (time > times[times.length - 1]) times.push(time);
  const samples = times.map((t) => dischargeState(t, capacitance, resistance, initialVoltage));
  let integrated = 0;
  for (let i = 1; i < samples.length; i++)
    integrated +=
      ((samples[i - 1].current + samples[i].current) / 2) * (samples[i].time - samples[i - 1].time);
  return { samples, integrated };
}
export function capacitorSharing(
  progress: number,
  round: 1 | 2 = 1,
  capacitance = 1000e-6,
  initialVoltage = 6,
) {
  if (
    !Number.isFinite(progress) ||
    !Number.isFinite(capacitance) ||
    capacitance <= 0 ||
    !Number.isFinite(initialVoltage) ||
    initialVoltage < 0
  )
    throw new RangeError('Finite physical capacitor inputs required.');
  const p = Math.max(0, Math.min(1, progress)),
    before = initialVoltage / 2 ** (round - 1),
    connected = p >= 0.25 && p <= 0.85,
    transfer = p < 0.25 ? 0 : p > 0.75 ? 1 : (1 - Math.exp(-12 * (p - 0.25))) / (1 - Math.exp(-6));
  const a = before * (1 - transfer / 2),
    b = (before * transfer) / 2,
    chargeA = capacitance * a,
    chargeB = capacitance * b,
    energyBefore = 0.5 * capacitance * before ** 2,
    energyAfter = 0.5 * capacitance * (a * a + b * b);
  return {
    a,
    b,
    chargeA,
    chargeB,
    connected,
    transfer,
    round,
    capacitance,
    energyBefore,
    energyAfter,
    dissipated: energyBefore - energyAfter,
  };
}
