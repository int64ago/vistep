/** Homogeneous incompressible static liquid. y is elevation above the common bottom. */
export interface HydrostaticOptions {
  height?: number;
  depth?: number;
  density?: number;
  surface?: number;
  sensorArea?: number;
}
export const vesselProfiles = [
  { key: 'straight', bottom: 0.08, top: 0.08 },
  { key: 'flare', bottom: 0.08, top: 0.18 },
  { key: 'taper', bottom: 0.08, top: 0.04 },
] as const;
export function hydrostaticPressure(depth: number, density = 1000, surface = 101325) {
  if (
    !Number.isFinite(depth) ||
    depth < 0 ||
    !Number.isFinite(density) ||
    density <= 0 ||
    !Number.isFinite(surface) ||
    surface < 0
  )
    throw new RangeError('Physical pressure boundary required');
  return { gauge: density * 9.81 * depth, absolute: surface + density * 9.81 * depth };
}
export function hydrostatic(o: HydrostaticOptions = {}) {
  const height = o.height ?? 0.3,
    depth = o.depth ?? 0.2,
    density = o.density ?? 1000,
    surface = o.surface ?? 101325,
    sensorArea = o.sensorArea ?? 0.0001,
    g = 9.81;
  if (
    ![height, density, sensorArea].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isFinite(depth) ||
    depth < 0 ||
    depth > height ||
    height > 0.36 ||
    !Number.isFinite(surface) ||
    surface < 0
  )
    throw new RangeError('Physical liquid and submerged probe required');
  const gauge = density * g * depth,
    absolute = surface + gauge,
    bottomGauge = density * g * height;
  const vessels = vesselProfiles.map((profile) => {
    const slope = (profile.top - profile.bottom) / 0.36,
      volume = 0.08 * (profile.bottom * height + 0.5 * slope * height ** 2),
      weight = density * g * volume,
      bottomForce = bottomGauge * profile.bottom * 0.08;
    return { ...profile, slope, volume, weight, bottomForce, wallUp: weight - bottomForce };
  });
  return {
    height,
    depth,
    density,
    surface,
    sensorArea,
    g,
    gauge,
    absolute,
    bottomGauge,
    sensorForce: gauge * sensorArea,
    vessels,
  };
}
export function vesselWidth(index: number, elevation: number) {
  const p = vesselProfiles[index];
  return p.bottom + ((p.top - p.bottom) * elevation) / 0.36;
}
export function hydrostaticShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = {
      height: 0.3,
      depth: 0.04 + 0.24 * p,
      density: 1000,
      surface: 101325,
      sensorArea: 0.0001,
      forces: false,
      patch: false,
    };
  if (chapter === 1) return { ...base, height: 0.18 + 0.14 * p, depth: 0.18 + 0.14 * p };
  if (chapter === 2) return { ...base, depth: 0.2, density: 800 + 400 * p };
  if (chapter === 3) return { ...base, depth: 0.2, surface: 101325 + 50000 * p };
  if (chapter === 4) return { ...base, depth: 0.3, forces: true };
  if (chapter === 5) return { ...base, depth: 0.2, sensorArea: 0.0001 + 0.0003 * p, patch: true };
  return base;
}
