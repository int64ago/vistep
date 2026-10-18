export const ELEMENT_SYMBOLS =
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(
    ' ',
  );
export const PERIOD_LENGTHS = [2, 8, 8, 18, 18, 32, 32];
export type PeriodicBlock = 's' | 'p' | 'd' | 'ds' | 'f';
/** Teaching geometry uses a 14-cell f insertion. This does not settle group-3 conventions. */
export function periodicCell(z: number, expanded = 0) {
  const n = Math.max(1, Math.min(118, Math.round(z)));
  let period = 0,
    offset = n - 1;
  while (offset >= PERIOD_LENGTHS[period]) offset -= PERIOD_LENGTHS[period++];
  const f = period >= 5 && offset >= 2 && offset < 16;
  const d = period >= 3 && offset >= (period >= 5 ? 16 : 2) && offset < (period >= 5 ? 26 : 12);
  const block: PeriodicBlock =
    offset < 2 ? 's' : f ? 'f' : d ? (offset >= (period >= 5 ? 24 : 10) ? 'ds' : 'd') : 'p';
  let compactX: number,
    compactY = period;
  if (period === 0) compactX = offset === 0 ? 0 : 17;
  else if (period < 3) compactX = offset < 2 ? offset : offset + 10;
  else if (period < 5) compactX = offset;
  else if (f) {
    compactX = offset + 1;
    compactY = period + 3;
  } else compactX = offset < 2 ? offset : offset - 14;
  const wideX =
    period === 0
      ? offset === 0
        ? 0
        : 31
      : period < 3
        ? offset < 2
          ? offset
          : offset + 24
        : period < 5
          ? offset < 2
            ? offset
            : offset + 14
          : offset;
  const t = Math.max(0, Math.min(1, expanded));
  return {
    z: n,
    symbol: ELEMENT_SYMBOLS[n - 1],
    period: period + 1,
    block,
    x: compactX * (1 - t) + wideX * t,
    y: compactY * (1 - t) + period * t,
    columns: 18 + 14 * t,
  };
}
export const PERIOD_3 = [
  { z: 11, symbol: 'Na', en: 0.9, ie: 5.13907696, s: 1, p: 0 },
  { z: 12, symbol: 'Mg', en: 1.2, ie: 7.646236, s: 2, p: 0 },
  { z: 13, symbol: 'Al', en: 1.5, ie: 5.985769, s: 2, p: 1 },
  { z: 14, symbol: 'Si', en: 1.8, ie: 8.15168, s: 2, p: 2 },
  { z: 15, symbol: 'P', en: 2.1, ie: 10.486686, s: 2, p: 3 },
  { z: 16, symbol: 'S', en: 2.5, ie: 10.3600167, s: 2, p: 4 },
  { z: 17, symbol: 'Cl', en: 3.0, ie: 12.967633, s: 2, p: 5 },
  { z: 18, symbol: 'Ar', en: null, ie: 15.7596119, s: 2, p: 6 },
];
export const GROUP_1 = [
  { symbol: 'Li', en: 1.0, ie: 5.391714996 },
  { symbol: 'Na', en: 0.9, ie: 5.13907696 },
  { symbol: 'K', en: 0.8, ie: 4.34066373 },
  { symbol: 'Rb', en: 0.8, ie: 4.1771281 },
  { symbol: 'Cs', en: 0.7, ie: 3.893905 },
];
export const GROUP_17 = [
  { symbol: 'F', en: 4.0, ie: 17.42282 },
  { symbol: 'Cl', en: 3.0, ie: 12.967633 },
  { symbol: 'Br', en: 2.8, ie: 11.81381 },
  { symbol: 'I', en: 2.5, ie: 10.451236 },
];
/** Hund/Pauli occupancy display for a single subshell; no electron trajectories. */
export function orbitalOccupancy(electrons: number, orbitals: number) {
  const n = Math.max(0, Math.min(orbitals * 2, Math.round(electrons)));
  return Array.from({ length: orbitals }, (_, i) => (n > i ? 1 : 0) + (n > orbitals + i ? 1 : 0));
}
export function trendData(group: 'period' | 'alkali' | 'halogen', metric: 'en' | 'ie') {
  const data = group === 'period' ? PERIOD_3 : group === 'alkali' ? GROUP_1 : GROUP_17;
  return data.map((e) => ({
    symbol: e.symbol,
    value: metric === 'en' ? e.en : e.ie * 96.48533212,
  }));
}
export function periodicDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    chapter,
    progress: p,
    expanded: chapter === 1 ? p * p * (3 - 2 * p) : 0,
    z:
      chapter < 2
        ? [1, 3, 11, 19, 37, 55, 87][Math.min(6, Math.floor(p * 7))]
        : 11 + Math.min(7, Math.floor(p * 8)),
    group: (chapter === 5 ? 'alkali' : chapter === 6 ? 'halogen' : 'period') as
      'period' | 'alkali' | 'halogen',
    metric: (chapter === 7 ? 'ie' : 'en') as 'en' | 'ie',
    exception: p < 0.5 ? 'Cr' : 'Cu',
  };
}
