import { gauseRecords, hareLynxRecords } from './bio-community-interactions-data';
export { gauseRecords, hareLynxRecords };
export const communityClamp = (v: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
export function competitionModel(days: number, overlap = 1, mixed = true) {
  const t = communityClamp(days, 0, 60),
    a = communityClamp(overlap),
    steps = Math.ceil(t / 0.025);
  let caudatum = 2,
    aurelia = 2;
  // Illustrative Lotka–Volterra parameters; not a fitted reconstruction of the records.
  const rates = (c: number, u: number) => [
    0.65 * c * (1 - (c + (mixed ? 1.8 * a * u : 0)) / 160),
    0.65 * u * (1 - (u + (mixed ? 0.5 * a * c : 0)) / 220),
  ];
  for (let i = 0; i < steps; i++) {
    const dt = Math.min(0.025, t - i * 0.025),
      k1 = rates(caudatum, aurelia),
      k2 = rates(caudatum + (dt * k1[0]) / 2, aurelia + (dt * k1[1]) / 2),
      k3 = rates(caudatum + (dt * k2[0]) / 2, aurelia + (dt * k2[1]) / 2),
      k4 = rates(caudatum + dt * k3[0], aurelia + dt * k3[1]);
    caudatum += (dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])) / 6;
    aurelia += (dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])) / 6;
  }
  return { caudatum, aurelia };
}
export function normalizedHareLynx() {
  const h = Math.max(...hareLynxRecords.map((r) => r.hare)),
    l = Math.max(...hareLynxRecords.map((r) => r.lynx));
  return hareLynxRecords.map((r) => ({ ...r, hareIndex: r.hare / h, lynxIndex: r.lynx / l }));
}
export function hareLynxCorrelation(lag = 0) {
  const n = Math.round(communityClamp(lag, -5, 5)),
    x: number[] = [],
    y: number[] = [];
  for (let i = 0; i < hareLynxRecords.length; i++) {
    const j = i + n;
    if (j >= 0 && j < hareLynxRecords.length) {
      x.push(hareLynxRecords[i].hare);
      y.push(hareLynxRecords[j].lynx);
    }
  }
  const mx = x.reduce((a, b) => a + b, 0) / x.length,
    my = y.reduce((a, b) => a + b, 0) / y.length;
  let cov = 0,
    vx = 0,
    vy = 0;
  for (let i = 0; i < x.length; i++) {
    cov += (x[i] - mx) * (y[i] - my);
    vx += (x[i] - mx) ** 2;
    vy += (y[i] - my) ** 2;
  }
  return { value: cov / Math.sqrt(vx * vy), pairs: x.length };
}
/** Published peak/decline phase averages; a four-condition evidence table, not an instant simulation. */
export function hareFactorial(food: boolean, exclusion: boolean) {
  return food ? (exclusion ? 11 : 3) : exclusion ? 2 : 1;
}
export type ShoreSpecies = 'empty' | 'barnacle' | 'mussel' | 'limpet' | 'chiton';
export const shoreInitial = [0.25, 0.04, 0.12, 0.09] as const;
export function shoreOccupancy(time: number, removed = true) {
  const t = communityClamp(time, 0, 10),
    steps = Math.ceil(t / 0.01);
  let a: number[] = [...shoreInitial];
  // Fractions of one fixed rock surface. Barnacles recruit into empty space;
  // mussels expand into empty space and displace other occupants. No raw-field fit.
  const rates = (v: number[]) => {
    const [b, m, l, c] = v,
      e = Math.max(0, 1 - b - m - l - c);
    return [6 * b * e - 0.65 * m * b, 0.65 * m * (e + b + l + c), -0.65 * m * l, -0.65 * m * c];
  };
  if (removed)
    for (let i = 0; i < steps; i++) {
      const dt = Math.min(0.01, t - i * 0.01),
        k1 = rates(a),
        k2 = rates(a.map((x, j) => x + (k1[j] * dt) / 2)),
        k3 = rates(a.map((x, j) => x + (k2[j] * dt) / 2)),
        k4 = rates(a.map((x, j) => x + k3[j] * dt));
      a = a.map((x, j) => x + (dt * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) / 6);
    }
  const [barnacle, mussel, limpet, chiton] = a;
  return { barnacle, mussel, limpet, chiton, empty: Math.max(0, 1 - a.reduce((s, x) => s + x, 0)) };
}
export function shoreSites(time: number, removed = true) {
  const f = shoreOccupancy(time, removed),
    types: ShoreSpecies[] = ['mussel', 'barnacle', 'limpet', 'chiton', 'empty'];
  const cutoffs = types.map((_, i) => types.slice(0, i + 1).reduce((s, k) => s + f[k], 0));
  return Array.from({ length: 96 }, (_, id) => {
    const rank = (id * 37) % 96,
      quantity = (rank + 0.5) / 96;
    return {
      id,
      x: ((id % 12) + 0.5) / 12,
      y: (Math.floor(id / 12) + 0.5) / 8,
      type: types[cutoffs.findIndex((c) => quantity <= c)] ?? 'empty',
    };
  });
}
export function shoreTransition(time: number, removed = true) {
  const t = communityClamp(time, 0, 10),
    lo = Math.floor(t * 8) / 8,
    hi = Math.min(10, lo + 0.125),
    p = (t - lo) * 8;
  const old = shoreSites(lo, removed),
    next = shoreSites(hi, removed);
  return old.map((cell, i) => ({ ...cell, next: next[i].type, progress: p }));
}
