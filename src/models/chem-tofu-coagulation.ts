/** Conserved illustrative material accounts, not a recipe, rheology fit or food standard. */
export const tofuClamp = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
export const tofuNodes = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: 45 + (i % 5) * 55 + Math.sin(i * 3.1) * 7,
  y: 65 + Math.floor(i / 5) * 45 + Math.cos(i * 2.3) * 6,
}));
export const tofuEdges = tofuNodes.flatMap((n) =>
  [n.id % 5 < 4 ? n.id + 1 : -1, n.id < 15 ? n.id + 5 : -1]
    .filter((i) => i >= 0)
    .map((j) => ({
      a: n.id,
      b: j,
      threshold:
        0.09 + ((0.72 * (((Math.sin(n.id * 12.9898 + j * 78.233) * 43758.5453) % 1) + 1)) % 1),
    })),
);
export function tofuNetwork(heat: number, coagulant: number) {
  const h = tofuClamp(heat),
    d = tofuClamp(coagulant),
    drive = h * d;
  const edges = tofuEdges.map((e) => ({ ...e, weight: tofuClamp((drive - e.threshold) * 8) }));
  const density = edges.reduce((s, e) => s + e.weight, 0) / edges.length;
  return { heat: h, dose: d, edges, density, gel: tofuClamp((density - 0.12) / 0.72) };
}
export function tofuBalance(heat: number, dose: number, press: number) {
  const network = tofuNetwork(heat, dose),
    p = tofuClamp(press),
    input = { protein: 40, other: 60, water: 900 },
    okara = { protein: 4, other: 16, water: 100 },
    milk = { protein: 36, other: 44, water: 800 },
    salt = 2 * network.dose;
  const curd = {
    protein: milk.protein * 0.97 * network.gel,
    other: milk.other * 0.75 * network.gel,
    water: milk.water * network.gel * (0.8 - 0.45 * p),
    salt: salt * 0.15 * network.gel,
  };
  const serum = {
    protein: milk.protein - curd.protein,
    other: milk.other - curd.other,
    water: milk.water - curd.water,
    salt: salt - curd.salt,
  };
  const sum = (v: Record<string, number>) => Object.values(v).reduce((a, b) => a + b, 0);
  return {
    network,
    press: p,
    input,
    okara,
    milk,
    salt,
    curd,
    serum,
    inputTotal: sum(input) + salt,
    outputTotal: sum(okara) + sum(curd) + sum(serum),
    proteinRecovery: curd.protein / input.protein,
    curdMass: sum(curd),
    serumMass: sum(serum),
  };
}
export function tofuDirector(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(6, Math.floor(Number.isFinite(chapter) ? chapter : 0))),
    p = tofuClamp(progress);
  return {
    chapter: c,
    p,
    soak: c === 0 ? p : 1,
    grind: c === 1 ? p : 1,
    filter: c === 2 ? p : 1,
    heat: c < 3 ? 0 : c === 3 ? p : 1,
    dose: c < 4 ? 0 : c === 4 ? p : 1,
    press: c < 5 ? 0 : c === 5 ? p : 1,
  };
}
export function soyBeanRadius(absorbed: number) {
  return 8 * Math.cbrt(1 + 1.8 * tofuClamp(absorbed));
}
