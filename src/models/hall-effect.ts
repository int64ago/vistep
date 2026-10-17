export const HALL_CHARGE = 1.602176634e-19;
export interface HallParameters {
  current: number;
  field: number;
  density: number;
  carrier: -1 | 1;
  width: number;
  thickness: number;
  length: number;
  mobility: number;
}
export const hallDefaults = (): HallParameters => ({
  current: 0.01,
  field: 0.2,
  density: 1e22,
  carrier: -1,
  width: 0.008,
  thickness: 0.0005,
  length: 0.02,
  mobility: 0.1,
});
export function hallEffect(p: HallParameters) {
  if (
    ![p.current, p.field, p.density, p.width, p.thickness, p.length, p.mobility].every(
      Number.isFinite,
    ) ||
    p.density <= 0 ||
    p.width <= 0 ||
    p.thickness <= 0 ||
    p.length <= 0 ||
    p.mobility <= 0 ||
    ![1, -1].includes(p.carrier)
  )
    throw new RangeError('Single-carrier Hall sample parameters required');
  const charge = p.carrier * HALL_CHARGE,
    drift = p.current === 0 ? 0 : p.current / (p.density * charge * p.width * p.thickness),
    hallField = p.field === 0 || p.current === 0 ? 0 : drift * p.field,
    magneticForce = p.field === 0 || p.current === 0 ? 0 : -charge * drift * p.field,
    electricForce = charge * hallField,
    hallVoltage = hallField * p.width,
    hallCoefficient = 1 / (p.density * charge),
    conductivity = p.density * HALL_CHARGE * p.mobility,
    longitudinalField = p.current / (conductivity * p.width * p.thickness),
    longitudinalVoltage = longitudinalField * p.length,
    power = p.current * longitudinalVoltage;
  return {
    ...p,
    charge,
    drift,
    hallField,
    magneticForce,
    electricForce,
    hallVoltage,
    hallCoefficient,
    conductivity,
    longitudinalField,
    longitudinalVoltage,
    power,
  };
}
export function hallShot(chapter: number, progress: number) {
  const p = hallDefaults(),
    u = Math.max(0, Math.min(1, progress));
  if (chapter === 0) p.field = 0;
  if (chapter === 3) p.field = 0.2 * (1 - 2 * u);
  if (chapter === 4) p.carrier = 1;
  if (chapter === 5) p.density = (2 - 1.5 * u) * 1e22;
  return hallEffect(p);
}

/** Displayed transport is slowed: an entire chapter spans 20 ms of drift. */
export function hallDriftDistance(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    s = hallShot(chapter, u);
  if (chapter !== 5) return s.drift * 0.02 * u;
  const p = hallDefaults(),
    factor = p.current / (p.density * p.carrier * HALL_CHARGE * p.width * p.thickness);
  return (factor * 0.02 * Math.log(2 / (2 - 1.5 * u))) / 1.5;
}
