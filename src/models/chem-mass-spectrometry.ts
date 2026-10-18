export const AMU = 1.6605390666e-27,
  E = 1.602176634e-19,
  SCALE = 700;
export function ionRadius(mass: number, z: number, voltage: number, field: number) {
  if (z <= 0 || voltage <= 0 || field <= 0) return Infinity;
  return Math.sqrt((2 * mass * AMU * voltage) / (z * E)) / field;
}
export const collectorR = ionRadius(92, 1, 1000, 0.3),
  slitHalfRadius = 0.00025;
export function fieldForMass(mass: number, z: number, voltage: number) {
  return Math.sqrt((2 * mass * AMU * voltage) / (z * E)) / collectorR;
}
export function sectorPoint(radius: number, angle: number) {
  return {
    x: 60 + radius * SCALE * (1 - Math.cos(angle)),
    y: 200 - radius * SCALE * Math.sin(angle),
  };
}
export function sector(mass: number, z: number, voltage: number, field: number) {
  const radius = ionRadius(mass, z, voltage, field),
    r = radius * SCALE,
    top = r > 180 ? Math.asin(180 / r) : Math.PI,
    side = 2 * r > 270 ? Math.acos(1 - 270 / r) : Math.PI,
    stop = Math.min(Math.PI, top, side);
  return {
    radius,
    stop,
    hitWall: stop < Math.PI,
    hit: stop === Math.PI && Math.abs(radius - collectorR) <= slitHalfRadius,
    deltaMillimetres: (radius - collectorR) * 1000,
    points: Array.from({ length: 121 }, (_, i) => sectorPoint(radius, (stop * i) / 120)),
  };
}
export const spectra = {
  toluene: [
    { mz: 65, height: 34, role: 'fragment' },
    { mz: 91, height: 100, role: 'base' },
    { mz: 92, height: 60, role: 'molecular' },
  ],
  ethanol: [
    { mz: 27, height: 27, role: 'fragment' },
    { mz: 29, height: 46, role: 'fragment' },
    { mz: 31, height: 100, role: 'base' },
    { mz: 45, height: 43, role: 'fragment' },
    { mz: 46, height: 16, role: 'molecular' },
  ],
} as const;
export function isotopeRelative(carbonCount: number, p13 = 0.0107) {
  return {
    M: 1,
    M1: (carbonCount * p13) / (1 - p13),
    M2: ((carbonCount * (carbonCount - 1)) / 2) * (p13 / (1 - p13)) ** 2,
  };
}
export function formulaEvidence(peak: number, z: number, empiricalMass = 46) {
  const ratio = (peak * z) / empiricalMass,
    n = Math.round(ratio),
    integral = n >= 1 && Math.abs(ratio - n) < 0.005;
  return {
    ratio,
    n,
    integral,
    formula: integral ? { C: 2 * n, H: 6 * n, O: n } : null,
    ordinaryNeutralValence: integral && 6 * n <= 2 * (2 * n) + 2,
  };
}
export function ionization(p: number) {
  const q = Math.max(0, Math.min(1, p));
  return {
    incoming: { x: 22 + 113 * Math.min(1, q / 0.4), y: 84 },
    outgoing: [
      { x: 135 + 150 * Math.max(0, (q - 0.4) / 0.6), y: 84 - 38 * Math.max(0, (q - 0.4) / 0.6) },
      { x: 135 + 138 * Math.max(0, (q - 0.4) / 0.6), y: 84 + 37 * Math.max(0, (q - 0.4) / 0.6) },
    ],
    charged: q >= 0.4,
  };
}
export function hydrogenFragment(p: number) {
  return {
    x: 244 + 46 * p,
    y: 125 - 60 * p,
    ionMass: 91,
    neutralMass: 1,
    totalMass: 92,
    charge: 1,
  };
}
