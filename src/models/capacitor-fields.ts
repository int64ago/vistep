export const VACUUM_PERMITTIVITY = 8.8541878128e-12;
export interface CapacitorFieldParameters {
  area: number;
  gap: number;
  relativePermittivity: number;
  fraction: number;
  voltage: number;
  charge: number;
  connection: 'voltage' | 'charge';
}
export const capacitorFieldDefaults = (): CapacitorFieldParameters => ({
  area: 0.01,
  gap: 0.005,
  relativePermittivity: 4,
  fraction: 0,
  voltage: 12,
  charge: ((VACUUM_PERMITTIVITY * 0.01) / 0.005) * 12,
  connection: 'voltage',
});
export function capacitorFields(p: CapacitorFieldParameters) {
  const { area, gap, relativePermittivity: k, fraction: f } = p;
  if (
    ![area, gap, k, f, p.voltage, p.charge].every(Number.isFinite) ||
    area <= 0 ||
    gap <= 0 ||
    k < 1 ||
    f < 0 ||
    f > 1 ||
    p.voltage < 0 ||
    p.charge < 0
  )
    throw new RangeError('Positive parallel-plate geometry and passive dielectric required');
  const thickness = f * gap,
    airHalf = (gap - thickness) / 2,
    effectiveGap = gap - thickness + thickness / k,
    capacitance = (VACUUM_PERMITTIVITY * area) / effectiveGap,
    charge = p.connection === 'charge' ? p.charge : capacitance * p.voltage,
    voltage = charge / capacitance,
    displacement = charge / area,
    airField = displacement / VACUUM_PERMITTIVITY,
    dielectricField = airField / k,
    polarization = displacement * (1 - 1 / k),
    energy = 0.5 * charge * voltage,
    potential = (x: number) => {
      const a = Math.max(0, Math.min(gap, x)),
        air1 = Math.min(a, airHalf),
        dielectric = Math.max(0, Math.min(thickness, a - airHalf)),
        air2 = Math.max(0, a - airHalf - thickness);
      return voltage - airField * (air1 + air2) - dielectricField * dielectric;
    };
  return {
    ...p,
    thickness,
    airHalf,
    effectiveGap,
    capacitance,
    charge,
    voltage,
    displacement,
    airField,
    dielectricField,
    polarization,
    energy,
    potential,
  };
}
export type CapacitorFieldState = ReturnType<typeof capacitorFields>;
export function capacitorFieldShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = capacitorFieldDefaults();
  if (chapter === 0) p.voltage = 12;
  if (chapter === 1) p.voltage = 3 + 9 * u;
  if (chapter === 2) {
    p.connection = 'charge';
    p.gap = 0.003 + 0.004 * u;
  }
  if (chapter === 3) {
    p.connection = 'charge';
    p.fraction = 1;
    p.relativePermittivity = 1 + 3 * u;
  }
  if (chapter === 4) {
    p.fraction = 1;
    p.relativePermittivity = 1 + 3 * u;
  }
  if (chapter === 5) {
    p.fraction = 0.5;
    p.relativePermittivity = 4;
  }
  return capacitorFields(p);
}
