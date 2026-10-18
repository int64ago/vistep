/** Illustrative kinetics, not fitted textbook measurements. Concentrations mol/L, time s. */
export const rateClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export const GAS_ML = ((8.314462618 * 298.15) / 101.325) * 1000;
export const temperatureFactor = (c: number, ea = 35000) =>
  Math.exp((ea / 8.314462618) * (1 / 298.15 - 1 / (rateClamp(c, 0, 70) + 273.15)));
export function peroxide(
  seconds: number,
  temperature: number,
  catalyst: 'none' | 'Fe' | 'Mn',
  percent = 5,
) {
  const n0 = (2 * rateClamp(percent, 0, 10)) / 100 / 34.0147;
  // Both catalyst pathways are shown with the SAME illustrative k: no ranking from unequal doses.
  const k = (catalyst === 'none' ? 0.0005 : 0.015) * temperatureFactor(temperature);
  const remaining = n0 * Math.exp(-k * Math.max(0, seconds));
  return {
    n0,
    remaining,
    oxygen: (n0 - remaining) / 2,
    oxygenMl: ((n0 - remaining) / 2) * GAS_ML,
    initialRate: (k * n0) / 2,
    rate: (k * remaining) / 2,
    k,
  };
}
export function marble(seconds: number, acidM: number, surface = 1) {
  const acid = 0.002 * rateClamp(acidM, 0, 1),
    solid = 0.001;
  const k = 0.04 * rateClamp(surface, 1, 2),
    maximum = Math.min(solid, acid / 2);
  const extent = Math.min(solid, (acid / 2) * (1 - Math.exp(-k * Math.max(0, seconds))));
  return {
    extent,
    solidLeft: solid - extent,
    acidLeft: acid - 2 * extent,
    maximum,
    volume: extent * GAS_ML,
    initialRate: (acid / 2) * k,
    rate: extent < solid ? (acid / 2) * k * Math.exp(-k * Math.max(0, seconds)) : 0,
  };
}
export function turbidity(seconds: number, stockMl: number, temperature: number) {
  const c0 = (rateClamp(stockMl, 0, 2) * 0.1) / 4;
  const k = 0.035 * temperatureFactor(temperature, 45000);
  const sulfur = c0 * (1 - Math.exp(-k * Math.max(0, seconds)));
  const threshold = Math.log(2) / 40;
  return {
    c0,
    k,
    sulfur,
    transmission: Math.exp(-40 * sulfur),
    endpoint: c0 > threshold ? -Math.log(1 - threshold / c0) / k : null,
    volumeMl: 4,
  };
}
export function zincGas(seconds: number, acidM: number, leak = 0) {
  const maximum = Math.min(2 / 65.38, 0.04 * rateClamp(acidM, 0, 4));
  const referenceMaximum = (2 / 65.38) * GAS_ML;
  const k = (-Math.log(1 - 10 / referenceMaximum) / 30) * rateClamp(acidM, 0, 4);
  const produced = maximum * (1 - Math.exp(-k * Math.max(0, seconds)));
  const fraction = 1 - rateClamp(leak),
    collected = produced * fraction;
  const finalMl = maximum * GAS_ML * fraction;
  const endpoint = k > 0 && finalMl > 10 ? -Math.log(1 - 10 / finalMl) / k : null;
  return {
    produced,
    collected,
    leaked: produced - collected,
    volumeMl: collected * GAS_ML,
    finalMl,
    endpoint,
    k,
  };
}
export function observedRate(time: string) {
  if (!time.trim()) return null;
  const t = Number(time);
  return Number.isFinite(t) && t > 0 ? 10 / t : null;
}
/** Each comparison holds its completed collision before the next trial/chapter. */
export function collisionTrial(progress: number) {
  const p = rateClamp(progress),
    trial = p < 0.5 ? 0 : 1;
  return { trial, progress: rateClamp((trial === 0 ? p * 2 : (p - 0.5) * 2) / 0.84) };
}
export type RateAtom = { id: string; element: 'H' | 'I'; x: number; y: number; r: number };
/** Fixed four atom identities; visible bonds follow the same contact geometry. */
export function collision(width: number, progress: number, enough: boolean, oriented: boolean) {
  const cx = width / 2,
    p = rateClamp(progress),
    success = enough && oriented;
  const near = oriented ? 13 : 16,
    far = Math.min(70, width / 2 - 28);
  const approach = Math.min(1, p / 0.45);
  const separation = far + (near - far) * approach;
  let left = cx - separation,
    right = cx + separation;
  if (!success && p > 0.45) {
    const q = (p - 0.45) / 0.55;
    left = cx - near - (far - near) * q;
    right = cx + near + (far - near) * q;
  }
  let atoms: RateAtom[] = [
    { id: 'H1', element: 'H', x: left + 7, y: 140, r: 6 },
    { id: 'I1', element: 'I', x: left - 11, y: 140, r: 12 },
    { id: 'H2', element: 'H', x: right + (oriented ? -7 : 11), y: 140, r: 6 },
    { id: 'I2', element: 'I', x: right + (oriented ? 11 : -7), y: 140, r: 12 },
  ];
  if (success && p > 0.45) {
    const q = rateClamp((p - 0.45) / 0.35);
    atoms = [
      { id: 'H1', element: 'H', x: cx - 6, y: 140 - q * 60, r: 6 },
      { id: 'I1', element: 'I', x: cx - 24 - q * 22, y: 140 + q * 48, r: 12 },
      { id: 'H2', element: 'H', x: cx + 6, y: 140 - q * 60, r: 6 },
      { id: 'I2', element: 'I', x: cx + 24 + q * 22, y: 140 + q * 48, r: 12 },
    ];
    if (p > 0.8) {
      const a = (p - 0.8) / 0.2;
      atoms[1].x = cx - 46 + 34 * a;
      atoms[3].x = cx + 46 - 34 * a;
    }
  }
  return {
    atoms,
    hi: !success || p <= 0.45,
    hh: success && p > 0.45,
    ii: success && p >= 1,
    radicals: success && p > 0.45 && p < 1,
  };
}
/** Generic reaction-coordinate profile: not a measured HI energy surface. */
export function energyProfile(q: number, catalyzed: boolean) {
  const x = rateClamp(q);
  return (
    -20 * x +
    (catalyzed
      ? 39 * Math.sin(Math.PI * x) ** 2 + 9 * Math.sin(2 * Math.PI * x) ** 2
      : 70 * Math.sin(Math.PI * x) ** 2)
  );
}
export function syringeGeometry(width: number, volume: number) {
  const x0 = width / 2 - 60,
    span = 90,
    piston = x0 + (span * rateClamp(volume, 0, 20)) / 20;
  return { x0, span, piston, stop: x0 + span, tick10: x0 + span / 2 };
}
