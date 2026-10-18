/** Textbook gas-phase bond-energy bookkeeping, not an elementary reaction trajectory. */
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export const textbookBondEnergies = { HH: 436, ClCl: 243, HCl: 431 };
export function bondEnergyBook(progress: number, extent = 1) {
  const p = clamp(progress),
    n = clamp(extent, 0, 2),
    broken = clamp(p * 2),
    formed = clamp((p - 0.5) * 2),
    input = n * (436 + 243) * broken,
    output = n * 2 * 431 * formed;
  return {
    progress: p,
    extent: n,
    broken,
    formed,
    input,
    output,
    net: input - output,
    finalNet: n * (436 + 243 - 2 * 431),
    hydrogenAtoms: 2 * n,
    chlorineAtoms: 2 * n,
  };
}
export type CarbonSpecies = 'C' | 'O2' | 'CO' | 'CO2';
export type CarbonEquation = { coefficients: Record<CarbonSpecies, number>; enthalpy: number };
export function carbonHess(extent = 1, reverse = false) {
  const n = clamp(extent, 0, 2) * (reverse ? -1 : 1);
  const scale = (
    coefficients: Record<CarbonSpecies, number>,
    enthalpy: number,
  ): CarbonEquation => ({
    coefficients: Object.fromEntries(
      Object.entries(coefficients).map(([k, v]) => [k, v * n || 0]),
    ) as Record<CarbonSpecies, number>,
    enthalpy: enthalpy * n || 0,
  });
  const first = scale({ C: -1, O2: -0.5, CO: 1, CO2: 0 }, -110.5),
    second = scale({ C: 0, O2: -0.5, CO: -1, CO2: 1 }, -283),
    direct = scale({ C: -1, O2: -1, CO: 0, CO2: 1 }, -393.5);
  const sum: CarbonEquation = {
    coefficients: { C: 0, O2: 0, CO: 0, CO2: 0 },
    enthalpy: first.enthalpy + second.enthalpy,
  };
  for (const k of Object.keys(sum.coefficients) as CarbonSpecies[])
    sum.coefficients[k] = first.coefficients[k] + second.coefficients[k];
  return {
    extent: Math.abs(n),
    reverse,
    first,
    second,
    direct,
    sum,
    unknown: direct.enthalpy - second.enthalpy,
    levels: [0, -110.5 * Math.abs(n), -393.5 * Math.abs(n)],
  };
}
export function carbonAtoms(eq: CarbonEquation) {
  const c = eq.coefficients;
  return { carbon: c.C + c.CO + c.CO2, oxygen: 2 * c.O2 + c.CO + 2 * c.CO2 };
}
export function bondDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 5)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    bookProgress: c === 0 ? 0 : c === 1 ? p * 0.5 : c === 2 ? 0.5 + 0.5 * p : 1,
    pathProgress: c === 4 ? p : c === 5 ? 1 : 0,
  };
}
export function trackedBondAtoms(progress: number) {
  const p = clamp(progress),
    separate = clamp(p * 2),
    form = clamp((p - 0.5) * 2),
    initial = [
      [58, 80],
      [94, 80],
      [215, 80],
      [265, 80],
    ],
    free = [
      [38, 76],
      [111, 83],
      [205, 76],
      [287, 83],
    ],
    product = [
      [80, 48],
      [190, 121],
      [125, 48],
      [235, 121],
    ];
  return ['H', 'H', 'Cl', 'Cl'].map((element, i) => {
    const a = initial[i],
      b = free[i],
      c = product[i];
    return {
      id: i,
      element,
      x: (a[0] + (b[0] - a[0]) * separate) * (1 - form) + c[0] * form,
      y: (a[1] + (b[1] - a[1]) * separate) * (1 - form) + c[1] * form,
    };
  });
}
