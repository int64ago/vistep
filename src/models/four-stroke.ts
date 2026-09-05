/** SI units. A kinematic single-cylinder engine and an air-standard Otto teaching cycle. */
export const ENGINE = {
  crank: 0.04,
  rod: 0.14,
  bore: 0.08,
  compression: 9,
  rpm: 800,
  gamma: 1.4,
  inletPressure: 101325,
  inletTemperature: 300,
  heatPerKg: 1_300_000,
};
export type EngineSettings = typeof ENGINE;
const ease = (p: number) => {
  const q = Math.max(0, Math.min(1, p));
  return q * q * (3 - 2 * q);
};
/** Chapter-local reconstruction, independent of previous playback or frame rate. */
export function engineShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const move = ease((p - 0.16) / 0.72);
  let angle = p * Math.PI * 8;
  if (chapter === 1) angle = move * Math.PI;
  if (chapter === 2) angle = Math.PI + move * (Math.PI - 0.001);
  if (chapter === 3) angle = 2 * Math.PI - 0.06 + move * 0.42;
  if (chapter === 4) angle = 2 * Math.PI + 0.36 + move * (Math.PI - 0.361);
  if (chapter === 5) angle = 3 * Math.PI + move * (Math.PI - 0.001);
  if (chapter === 6) angle = 2 * Math.PI + move * Math.PI;
  if (chapter === 7) angle = p * Math.PI * 8;
  return { angle, settings: ENGINE, pressureView: chapter === 7, leverageView: chapter === 6 };
}
export function pistonGeometry(angle: number, crank = ENGINE.crank, rod = ENGINE.rod) {
  if (![angle, crank, rod].every(Number.isFinite) || !(rod > crank && crank > 0))
    throw new RangeError('The connecting rod must exceed the crank radius.');
  const crankX = crank * Math.sin(angle),
    crankY = crank * Math.cos(angle);
  const projectedRod = Math.sqrt(rod * rod - crankX * crankX);
  const pinY = crankY + projectedRod;
  const down = crank + rod - pinY;
  const derivative =
    crank * Math.sin(angle) + (crank * crank * Math.sin(angle) * Math.cos(angle)) / projectedRod;
  return { crankX, crankY, pinY, down, derivative, rodAngle: Math.atan2(-crankX, projectedRod) };
}
export function engineCycle(angle: number, settings: EngineSettings = ENGINE) {
  const s = settings;
  if (!(
    Number.isFinite(angle) &&
    Object.values(s).every(Number.isFinite) &&
    s.compression > 1 &&
    s.gamma > 1 &&
    s.rpm >= 0 &&
    s.bore > 0 &&
    s.inletPressure > 0 &&
    s.inletTemperature > 0 &&
    s.heatPerKg >= 0
  ))
    throw new RangeError('Invalid engine configuration.');
  const cycle = ((angle % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
  const stage = Math.min(3, Math.floor(cycle / Math.PI));
  const position = pistonGeometry(cycle, s.crank, s.rod);
  const area = (Math.PI * s.bore * s.bore) / 4,
    swept = area * 2 * s.crank,
    clearance = swept / (s.compression - 1),
    maximum = clearance + swept;
  const volume = clearance + area * position.down;
  const cv = 287 / (s.gamma - 1),
    mass = (s.inletPressure * maximum) / (287 * s.inletTemperature);
  const compressedTemperature = s.inletTemperature * s.compression ** (s.gamma - 1);
  const peakTemperature = compressedTemperature + s.heatPerKg / cv;
  const peakPressure = (s.inletPressure * s.compression * peakTemperature) / s.inletTemperature;
  let pressure = s.inletPressure;
  if (stage === 1) pressure = s.inletPressure * (maximum / volume) ** s.gamma;
  if (stage === 2) pressure = peakPressure * (clearance / volume) ** s.gamma;
  const angularSpeed = (s.rpm * Math.PI) / 30;
  const torque = (pressure - s.inletPressure) * area * position.derivative;
  const efficiency = 1 - s.compression ** (1 - s.gamma);
  const netWork = mass * s.heatPerKg * efficiency;
  // Ideal intake/exhaust strokes at ambient pressure. No combustion-rate or gas-exchange CFD.
  return {
    ...position,
    cycle,
    stage,
    pressure,
    volume,
    maximum,
    clearance,
    swept,
    mass,
    torque,
    power: torque * angularSpeed,
    efficiency,
    netWork,
    intake: stage === 0 ? Math.sin(cycle) ** 2 : 0,
    exhaust: stage === 3 ? Math.sin(cycle) ** 2 : 0,
    camAngle: cycle / 2,
    peakTemperature,
    peakPressure,
  };
}
