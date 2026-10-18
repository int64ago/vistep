/** Textbook rounded atomic masses: Na 23.0 + Cl 35.5. */
export const TEXTBOOK_NACL_MOLAR_MASS = 58.5;
const bounded = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export function solutionPreparation(
  mass = 5.85,
  recovery = 1,
  volumeMl = 100,
  stockMl: number | null = null,
) {
  const weighedMass = bounded(mass, 0, 12),
    fraction = bounded(recovery, 0, 1),
    volume = bounded(volumeMl, 1, 110);
  const inputMoles =
    stockMl === null ? weighedMass / TEXTBOOK_NACL_MOLAR_MASS : bounded(stockMl, 0, 100) / 1000;
  const deliveredMoles = inputMoles * fraction,
    residueMoles = inputMoles - deliveredMoles;
  return {
    inputMoles,
    deliveredMoles,
    residueMoles,
    concentration: deliveredMoles / (volume / 1000),
    volume,
    mass: weighedMass,
    recoveredMass: deliveredMoles * TEXTBOOK_NACL_MOLAR_MASS,
    targetMass: 1 * 0.1 * TEXTBOOK_NACL_MOLAR_MASS,
  };
}
const radiusNodes = [
  [40, 14],
  [145, 14],
  [180, 32],
  [225, 65],
  [275, 77],
  [315, 64],
  [330, 49],
];
export function flaskRadius(y: number) {
  const k = Math.max(0, radiusNodes.findIndex((n) => n[0] >= y) - 1);
  if (y <= 40) return 14;
  if (y >= 330) return 49;
  const a = radiusNodes[k],
    b = radiusNodes[k + 1],
    p = (y - a[0]) / (b[0] - a[0]),
    s = p * p * (3 - 2 * p);
  return a[1] + (b[1] - a[1]) * s;
}
const volumeLookup = Array.from({ length: 581 }, () => 0);
for (let i = 579; i >= 0; i--)
  volumeLookup[i] = volumeLookup[i + 1] + Math.PI * flaskRadius(40 + (i + 0.5) * 0.5) ** 2 * 0.5;
function geometricVolume(y: number) {
  const t = bounded((y - 40) * 2, 0, 580),
    i = Math.floor(t);
  return volumeLookup[i] + (volumeLookup[Math.min(580, i + 1)] - volumeLookup[i]) * (t - i);
}
const calibration = geometricVolume(100);
/** Idealized rotationally symmetric flask, normalized at the 100 mL line. Meniscus cap volume omitted. */
export function flaskLevel(volumeMl: number) {
  const desired = (bounded(volumeMl, 0, 101.3) / 100) * calibration;
  let a = 40,
    b = 330;
  for (let i = 0; i < 45; i++) {
    const y = (a + b) / 2;
    if (geometricVolume(y) > desired) a = y;
    else b = y;
  }
  return (a + b) / 2;
}
export function flaskProfile(cx = 190) {
  const ys = Array.from({ length: 59 }, (_, i) => 40 + i * 5);
  return (
    `M${cx - flaskRadius(40)} 40 ` +
    ys
      .slice(1)
      .map((y) => `L${cx - flaskRadius(y)} ${y}`)
      .join(' ') +
    ` L${cx + flaskRadius(330)} 330 ` +
    ys
      .slice()
      .reverse()
      .map((y) => `L${cx + flaskRadius(y)} ${y}`)
      .join(' ')
  );
}
/** Equal-volume layers: the average remains the bulk concentration while mixing removes the gradient. */
export function mixingLayers(concentration: number, mixed: number) {
  const p = bounded(mixed, 0, 1);
  return Array.from(
    { length: 10 },
    (_, i) => concentration * (1 + (1 - p) * 0.8 * (((i + 0.5) / 10) * 2 - 1)),
  );
}
export type PreparationMode = 'solid' | 'transfer' | 'meniscus' | 'mixing' | 'dilution';
export function preparationDirector(chapter: number, progress: number) {
  const p = bounded(progress, 0, 1);
  return {
    mode: (['solid', 'transfer', 'transfer', 'meniscus', 'mixing', 'dilution'][chapter] ||
      'dilution') as PreparationMode,
    mass: 5.85,
    recovery: chapter === 1 ? 0.95 * p : chapter === 2 ? 0.95 + 0.05 * p : 1,
    volume:
      chapter === 1
        ? Math.max(1, 40 * p)
        : chapter === 2
          ? 40 + 15 * p
          : chapter === 3
            ? 98.8 + 1.2 * p
            : chapter === 5
              ? 50 + 50 * Math.min(1, p / 0.6)
              : 100,
    stockMl: 50,
    mixed: chapter === 4 ? p : 1,
    progress: p,
    stage: chapter === 2 ? 'rinse' : chapter === 0 ? 'dissolve' : 'normal',
  };
}
