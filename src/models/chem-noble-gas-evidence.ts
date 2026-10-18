export const heliumLine = 587.56148;
export const sodiumLines = [588.995, 589.5924];
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export type Point = { x: number; y: number };
export function spectrum(wavelength: number, lines: number[], fwhm: number, offset = 0) {
  const sigma = Math.max(0.02, fwhm) / 2.35482;
  return lines.reduce(
    (sum, x) => sum + Math.exp(-0.5 * ((wavelength - x - offset) / sigma) ** 2),
    0,
  );
}
export function matchDistance(lines: number[], reference: number[]) {
  return Math.max(...reference.map((r) => Math.min(...lines.map((l) => Math.abs(l - r)))));
}
/** Book density observations; a common ideal-gas reference temperature supports only the explicit temperature counterexample. */
export function densityEvidence(volumeLitres: number, airTemperatureOffset = 0) {
  const base = 273.15,
    chemicalDensity = 1.2508,
    airDensity = (1.2572 * base) / (base + airTemperatureOffset);
  return {
    chemicalDensity,
    airDensity,
    chemicalMass: chemicalDensity * volumeLitres,
    airMass: airDensity * volumeLitres,
    differenceMg: (airDensity - chemicalDensity) * volumeLitres * 1000,
  };
}
export const separationPath: Point[] = [
  { x: 55, y: 160 },
  { x: 55, y: 105 },
  { x: 265, y: 105 },
  { x: 265, y: 215 },
  { x: 55, y: 215 },
  { x: 55, y: 160 },
];
export function onPath(points: Point[], p: number): Point {
  const lengths = points.slice(1).map((b, i) => Math.hypot(b.x - points[i].x, b.y - points[i].y)),
    total = lengths.reduce((a, b) => a + b, 0);
  let d = clamp(p) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const f = d / lengths[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      };
    }
    d -= lengths[i];
  }
  return points[0];
}
export function separation(p: number) {
  const oxygenRemoved = clamp((p - 0.235) / 0.2),
    nitrogenRemoved = clamp((p - 0.765) / 0.2);
  return {
    oxygenRemoved,
    nitrogenRemoved,
    gas: 21 * (1 - oxygenRemoved) + 78 * (1 - nitrogenRemoved) + 1,
    oxygenProduct: 21 * oxygenRemoved,
    nitrogenProduct: 78 * nitrogenRemoved,
    argon: 1,
  };
}
export function xenonPath(i: number): Point[] {
  const angle = (i * Math.PI) / 3;
  return [
    { x: 260 + 24 * Math.cos(angle), y: 125 + 24 * Math.sin(angle) },
    { x: 260, y: 125 },
    { x: 190, y: 125 },
    { x: 100, y: 125 },
    { x: 76 + i * 9, y: 163 + (i % 2) * 4 },
  ];
}
export function xenonMarker(i: number, p: number, sealOpen: boolean) {
  return onPath(xenonPath(i), sealOpen ? clamp((p - 0.18) / 0.72) : 0);
}
export function xenonObservation(p: number, sealOpen: boolean) {
  const contact = sealOpen ? clamp((p - 0.18) / 0.72) : 0;
  return { contact, redVapor: 1 - contact, orangeSolid: contact };
}
export const ionizationEV = { oxygenMolecule: 12.0697, xenonAtom: 12.12984 };

export const xenonVessel = {
  left: 100,
  right: 260,
  y: 125,
  radius: 55,
  neckHalf: 10,
  leftJoin: 100 + Math.sqrt(55 ** 2 - 10 ** 2),
  rightJoin: 260 - Math.sqrt(55 ** 2 - 10 ** 2),
};
