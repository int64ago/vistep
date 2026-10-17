/** Compact, rigid cavity; linear adiabatic compression; one cylindrical neck. */
export interface HelmholtzOptions {
  volume?: number;
  radius?: number;
  length?: number;
  endFactor?: number;
}
export const helmholtzAir = { c: 343, gamma: 1.4, pressure: 101325 } as const;
export function helmholtz(o: HelmholtzOptions = {}) {
  const V = o.volume ?? 0.001,
    r = o.radius ?? 0.01,
    L = o.length ?? 0.03,
    e = o.endFactor ?? 1.6;
  if (![V, r, L].every((v) => Number.isFinite(v) && v > 0) || !Number.isFinite(e) || e < 0)
    throw new RangeError('Positive cavity, radius and neck length required');
  const { c, gamma, pressure } = helmholtzAir,
    density = (gamma * pressure) / c ** 2,
    area = Math.PI * r ** 2,
    effectiveLength = L + e * r,
    mass = density * area * effectiveLength,
    stiffness = (gamma * pressure * area ** 2) / V,
    omega = Math.sqrt(stiffness / mass),
    frequency = omega / (2 * Math.PI),
    wavelength = c / frequency;
  return {
    V,
    r,
    L,
    e,
    density,
    area,
    effectiveLength,
    mass,
    stiffness,
    omega,
    frequency,
    wavelength,
  };
}
/** x is outward from the cavity; negative pressure then pulls the plug inward. */
export function helmholtzState(phase: number, o: HelmholtzOptions = {}, amplitude = 0.00015) {
  if (!Number.isFinite(phase) || !Number.isFinite(amplitude) || amplitude < 0)
    throw new RangeError('Finite phase and nonnegative amplitude required');
  const h = helmholtz(o),
    displacement = amplitude * Math.cos(phase),
    velocity = -amplitude * h.omega * Math.sin(phase),
    pressure = (-helmholtzAir.gamma * helmholtzAir.pressure * h.area * displacement) / h.V,
    force = pressure * h.area,
    kinetic = 0.5 * h.mass * velocity ** 2,
    compression = 0.5 * h.stiffness * displacement ** 2;
  return {
    ...h,
    displacement,
    velocity,
    pressure,
    force,
    kinetic,
    compression,
    energy: kinetic + compression,
  };
}
export function helmholtzShot(chapter: number, progress: number, seconds: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = {
      volume: 0.001,
      radius: 0.01,
      length: 0.03,
      endFactor: 1.6,
      phase: (2 * Math.PI * seconds) / 6,
    };
  if (chapter === 1) return { ...base, phase: (p * Math.PI) / 2 };
  if (chapter === 2) return { ...base, volume: 0.0015 - 0.001 * p };
  if (chapter === 3) return { ...base, length: 0.02 + 0.06 * p };
  if (chapter === 4) return { ...base, radius: 0.008 + 0.007 * p };
  if (chapter === 5) return { ...base, endFactor: 1.6 * p, phase: 0 };
  return base;
}
