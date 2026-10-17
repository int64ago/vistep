/** Reciprocal one-dimensional small-signal plate. Compression x and force F are positive.
 * Electrode convention: q_terminal = C V - d F; x = F/k - d V.
 * Under passive parallel R: C Vdot + V/R = d Fdot. */
export interface PiezoParameters {
  d: number;
  capacitance: number;
  stiffness: number;
  resistance: number;
  peakForce: number;
  ramp: number;
  hold: number;
  release: number;
}
export const piezoDefaults = (): PiezoParameters => ({
  d: 300e-12,
  capacitance: 2e-9,
  stiffness: 5e9,
  resistance: 1e9,
  peakForce: 100,
  ramp: 0.1,
  hold: 6,
  release: 0.2,
});
function validate(p: PiezoParameters) {
  if (
    ![p.d, p.capacitance, p.stiffness, p.peakForce, p.ramp, p.hold, p.release].every(
      Number.isFinite,
    ) ||
    p.d < 0 ||
    p.capacitance <= 0 ||
    p.stiffness <= 0 ||
    !(p.resistance > 0) ||
    p.peakForce < 0 ||
    p.ramp <= 0 ||
    p.hold < 0 ||
    p.release <= 0 ||
    p.d * p.d * p.stiffness >= p.capacitance
  )
    throw new RangeError('Stable small-signal piezo parameters required');
}
export function piezoVoltageSegment(
  voltage: number,
  forceRate: number,
  dt: number,
  p: PiezoParameters,
) {
  if (p.resistance === Infinity) return voltage + (p.d / p.capacitance) * forceRate * dt;
  const tau = p.resistance * p.capacitance,
    oneMinus = -Math.expm1(-dt / tau);
  return voltage * (1 - oneMinus) + (p.d / p.capacitance) * forceRate * tau * oneMinus;
}
export function piezoSensor(p: PiezoParameters, time: number) {
  validate(p);
  if (!Number.isFinite(time) || time < 0) throw new RangeError('Nonnegative finite time required');
  let voltage = 0,
    force = 0,
    forceRate = 0,
    left = time;
  const pieces = [
    { duration: p.ramp, rate: p.peakForce / p.ramp },
    { duration: p.hold, rate: 0 },
    { duration: p.release, rate: -p.peakForce / p.release },
    { duration: Infinity, rate: 0 },
  ];
  for (const piece of pieces) {
    const dt = Math.min(left, piece.duration);
    voltage = piezoVoltageSegment(voltage, piece.rate, dt, p);
    force += piece.rate * dt;
    forceRate = piece.rate;
    left -= dt;
    if (left <= 0) break;
  }
  force = Math.max(0, force);
  return {
    ...p,
    time,
    force,
    forceRate,
    voltage,
    compression: force / p.stiffness - p.d * voltage,
    sourceCharge: p.d * force,
    storedCharge: p.capacitance * voltage,
    leakedCharge: p.d * force - p.capacitance * voltage,
    tau: p.resistance * p.capacitance,
    current: p.resistance === Infinity ? 0 : voltage / p.resistance,
    mode: 'sensor' as const,
  };
}
export function piezoActuator(p: PiezoParameters, voltage: number) {
  validate(p);
  if (!Number.isFinite(voltage)) throw new RangeError('Finite voltage required');
  return {
    ...p,
    time: 0,
    force: 0,
    forceRate: 0,
    voltage,
    compression: -p.d * voltage,
    sourceCharge: 0,
    storedCharge: p.capacitance * voltage,
    leakedCharge: 0,
    tau: p.resistance * p.capacitance,
    current: 0,
    mode: 'actuator' as const,
  };
}
export function piezoShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = piezoDefaults();
  if (chapter === 0) {
    p.resistance = Infinity;
    p.ramp = 1;
    return piezoSensor(p, u);
  }
  if (chapter === 1) return piezoSensor(p, 0.1 + 6 * u);
  if (chapter === 2) return piezoSensor(p, 6.1 + 0.2 * u);
  if (chapter === 3) {
    p.resistance = 1e8;
    return piezoSensor(p, 0.1 + 6 * u);
  }
  if (chapter === 4) {
    p.ramp = 4;
    return piezoSensor(p, 4 * u);
  }
  return piezoActuator(p, 30 * Math.sin(2 * Math.PI * u));
}
