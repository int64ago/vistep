/** Small uniform thermal strain; isotropic, constant coefficients, linear elasticity. */
export interface ExpansionOptions {
  deltaT?: number;
  plugDeltaT?: number;
  alpha?: number;
  young?: number;
  length?: number;
  locked?: boolean;
}
export function thermalExpansion(o: ExpansionOptions = {}) {
  const deltaT = o.deltaT ?? 100,
    plugDeltaT = o.plugDeltaT ?? 0,
    alpha = o.alpha ?? 25e-6,
    young = o.young ?? 70e9,
    length = o.length ?? 1,
    locked = o.locked ?? false;
  if (
    ![deltaT, plugDeltaT].every(Number.isFinite) ||
    ![alpha, young, length].every((v) => Number.isFinite(v) && v > 0) ||
    1 + alpha * deltaT <= 0 ||
    1 + alpha * plugDeltaT <= 0
  )
    throw new RangeError('Valid strain and positive material parameters required');
  const strain = alpha * deltaT,
    scale = 1 + strain,
    plugScale = 1 + alpha * plugDeltaT,
    outerRadius = 0.05 * scale,
    holeRadius = 0.02 * scale,
    plugRadius = 0.01998 * plugScale,
    freeChange = length * strain,
    actualStrain = locked ? 0 : strain,
    stress = young * (actualStrain - strain);
  return {
    deltaT,
    plugDeltaT,
    alpha,
    young,
    length,
    locked,
    strain,
    scale,
    plugScale,
    outerRadius,
    holeRadius,
    plugRadius,
    clearance: holeRadius - plugRadius,
    freeChange,
    actualLength: length * (1 + actualStrain),
    actualStrain,
    stress,
    volumeRatio: scale ** 3,
    densityRatio: 1 / scale ** 3,
  };
}
export function expandPoint(
  x: number,
  y: number,
  deltaT: number,
  alpha = 25e-6,
  magnification = 1,
) {
  const scale = 1 + alpha * deltaT * magnification;
  return { x: x * scale, y: y * scale };
}
export function expansionShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = {
      deltaT: 100 * p,
      plugDeltaT: 0,
      alpha: 25e-6,
      young: 70e9,
      length: 1,
      locked: false,
      view: 'plate' as 'plate' | 'gap' | 'rod',
    };
  if (chapter === 1) return { ...base, deltaT: 100 * p, view: 'gap' as const };
  if (chapter === 2) return { ...base, deltaT: 100, plugDeltaT: 100 * p, view: 'gap' as const };
  if (chapter === 3) return { ...base, deltaT: 100 * p, view: 'rod' as const };
  if (chapter === 4) return { ...base, deltaT: 100 * p, locked: true, view: 'rod' as const };
  if (chapter === 5) return { ...base, deltaT: -40 * p, locked: true, view: 'rod' as const };
  return base;
}
