import { finiteClamp } from './modern-labs';
export const RADON_HALF_DAYS = 3.8235;
export const C14_HALF_YEARS = 5730;
export const P32_HALF_DAYS = 14.268;
export function decaySample(count = 160, seed = 23) {
  let state = seed >>> 0;
  return Array.from({ length: count }, () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return -Math.log((state + 0.5) / 4294967296) / Math.LN2;
  });
}
export function remainingAtoms(lifetimes: number[], halfLives: number) {
  return lifetimes.filter((t) => t > finiteClamp(halfLives, 0, 20)).length;
}
export function tracerCompartments(days: number) {
  const t = finiteClamp(days, 0, 100),
    a = 0.2,
    b = 0.1,
    l = Math.LN2 / P32_HALF_DAYS;
  const soil = Math.exp(-(a + l) * t),
    root = (a / (b - a)) * (Math.exp(-(a + l) * t) - Math.exp(-(b + l) * t)),
    total = Math.exp(-l * t);
  return {
    soil,
    root,
    leaf: Math.max(0, total - soil - root),
    total,
    uptakeFraction: (total - soil) / total,
  };
}
export function carbonDate(years: number, modernFraction: number) {
  const trueYears = finiteClamp(years, 0, 40000),
    f = finiteClamp(modernFraction, 0, 0.2);
  const pure = 2 ** (-trueYears / C14_HALF_YEARS),
    measured = (1 - f) * pure + f;
  return { pure, measured, apparentYears: -C14_HALF_YEARS * Math.log2(measured) };
}
