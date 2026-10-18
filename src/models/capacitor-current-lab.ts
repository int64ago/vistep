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

/** Presentation time follows the unchanged recordings; RC time remains a separate physical axis. */
export function capacitorFilmState(chapter: number, seconds: number, locale: 'zh' | 'en') {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const range = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const smooth = (p: number) => p * p * (3 - 2 * p);
  const en = locale === 'en';
  const closedAt = chapter === 0 ? 2.5 : chapter === 2 ? (en ? 7.5 : 7.2) : en ? 6.3 : 7.1;
  const equalAt = chapter === 2 ? (en ? 11.3 : 12) : en ? 9.3 : 10.4;
  const openAt = chapter === 2 ? (en ? 11.9 : 12.8) : en ? 10 : 11.2;
  const physicalTime =
    chapter === 0
      ? 8 * smooth(range(closedAt, en ? 16.5 : 19.5))
      : 8 * smooth(range(1, en ? 15 : 17));
  // capacitorSharing's progress is a normalized connection state, not elapsed RC seconds.
  const sharingProgress =
    t < closedAt ? 0.2 : t < equalAt ? 0.25 + 0.5 * range(closedAt, equalAt) : t < openAt ? 0.8 : 1;
  return {
    physicalTime,
    dischargeClosed: chapter !== 0 || t >= closedAt,
    plotView: chapter === 1 || t >= (en ? 6.2 : 6.35),
    sharingProgress,
    sharingRound: (chapter === 3 ? 2 : 1) as 1 | 2,
  };
}
