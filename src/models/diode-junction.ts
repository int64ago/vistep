export const ELECTRON_CHARGE = 1.602176634e-19;
export const BOLTZMANN_CONSTANT = 1.380649e-23;
export interface JunctionParameters {
  temperature: number;
  acceptors: number;
  donors: number;
  intrinsic: number;
  permittivity: number;
  saturationCurrent: number;
  applied: number;
  seriesResistance: number;
}
export const junctionDefaults = (): JunctionParameters => ({
  temperature: 300,
  acceptors: 1e22,
  donors: 3e22,
  intrinsic: 1e16,
  permittivity: 11.7 * 8.8541878128e-12,
  saturationCurrent: 1e-12,
  applied: 0,
  seriesResistance: 0,
});
export function diodeJunction(p: JunctionParameters) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.temperature <= 0 ||
    p.acceptors <= p.intrinsic ||
    p.donors <= p.intrinsic ||
    p.intrinsic <= 0 ||
    p.permittivity <= 0 ||
    p.saturationCurrent <= 0 ||
    p.seriesResistance < 0 ||
    p.applied < -1 ||
    p.applied > 1
  )
    throw new RangeError('Abrupt junction parameters outside supported range');
  const thermalVoltage = (BOLTZMANN_CONSTANT * p.temperature) / ELECTRON_CHARGE,
    builtIn = thermalVoltage * Math.log((p.acceptors * p.donors) / p.intrinsic ** 2),
    shockley = (v: number) => p.saturationCurrent * Math.expm1(v / thermalVoltage);
  let junctionVoltage = p.applied;
  if (p.seriesResistance > 0) {
    let lo = Math.min(p.applied, 0),
      hi = Math.max(p.applied, 0);
    for (let n = 0; n < 90; n++) {
      const mid = (lo + hi) / 2;
      if (mid + p.seriesResistance * shockley(mid) > p.applied) hi = mid;
      else lo = mid;
    }
    junctionVoltage = (lo + hi) / 2;
  }
  const barrier = builtIn - junctionVoltage;
  if (barrier <= 0.08) throw new RangeError('Forward bias exceeds depletion-model range');
  const width = Math.sqrt(
      ((2 * p.permittivity) / ELECTRON_CHARGE) * (1 / p.acceptors + 1 / p.donors) * barrier,
    ),
    pWidth = (width * p.donors) / (p.acceptors + p.donors),
    nWidth = (width * p.acceptors) / (p.acceptors + p.donors),
    peakField = (-ELECTRON_CHARGE * p.acceptors * pWidth) / p.permittivity,
    current = shockley(junctionVoltage),
    potential = (x: number) =>
      x <= -pWidth
        ? 0
        : x < 0
          ? ((ELECTRON_CHARGE * p.acceptors) / (2 * p.permittivity)) * (x + pWidth) ** 2
          : x < nWidth
            ? barrier - ((ELECTRON_CHARGE * p.donors) / (2 * p.permittivity)) * (nWidth - x) ** 2
            : barrier,
    field = (x: number) =>
      x <= -pWidth || x >= nWidth
        ? 0
        : x < 0
          ? ((-ELECTRON_CHARGE * p.acceptors) / p.permittivity) * (x + pWidth)
          : ((-ELECTRON_CHARGE * p.donors) / p.permittivity) * (nWidth - x),
    chargeDensity = (x: number) =>
      x <= -pWidth || x >= nWidth
        ? 0
        : x < 0
          ? -ELECTRON_CHARGE * p.acceptors
          : ELECTRON_CHARGE * p.donors;
  return {
    ...p,
    thermalVoltage,
    builtIn,
    junctionVoltage,
    barrier,
    width,
    pWidth,
    nWidth,
    peakField,
    current,
    resistorVoltage: current * p.seriesResistance,
    potential,
    field,
    chargeDensity,
  };
}
export function junctionShot(chapter: number, progress: number) {
  const p = junctionDefaults(),
    u = Math.max(0, Math.min(1, progress));
  if (chapter === 2) p.applied = 0.5 * u;
  if (chapter === 3) p.applied = 0.45 + 0.15 * u;
  if (chapter === 4) p.applied = -u;
  if (chapter === 5) {
    p.seriesResistance = 100;
    p.applied = u;
  }
  return diodeJunction(p);
}
