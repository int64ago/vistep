/** Representative normal alkanes. NIST normal boiling values, rounded to 0.1 °C.
 * This waypoint model explains volatility sorting; it is NOT a VLE column solver.
 * The moving marks are conserved representative parcels, not product yields.
 */
export const petroleumSpecies = [
  { n: 4, bp: -0.5, color: '#92a897' },
  { n: 6, bp: 68.8, color: '#b7af70' },
  { n: 10, bp: 174.2, color: '#b69465' },
  { n: 16, bp: 287, color: '#a7785e' },
  { n: 24, bp: 391.4, color: '#777666' },
] as const;
export const oilClamp = (v: number, a = 0, b = 1) =>
  Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a;
export type OilPoint = { x: number; y: number };
export function columnState(bp: number, bottom = 350, top = 45) {
  bottom = oilClamp(bottom, 250, 420);
  top = oilClamp(top, 20, 120);
  const type = bp <= top ? 'gas' : bp >= bottom ? 'residue' : 'condensate';
  const fraction = oilClamp((bp - top) / (bottom - top));
  return {
    bottom,
    top,
    type,
    y: type === 'gas' ? 28 : type === 'residue' ? 282 : 48 + 215 * fraction,
  };
}
export function oilPath(species: number, bottom = 350, top = 45): OilPoint[] {
  species = oilClamp(Math.round(species), 0, 4);
  const s = columnState(petroleumSpecies[species].bp, bottom, top);
  const inlet = [
    { x: 32, y: 270 },
    { x: 82, y: 270 },
    { x: 82, y: 248 },
    { x: 155, y: 248 },
  ];
  return [...inlet, { x: 155, y: s.y }, { x: 205, y: s.y }, { x: 264, y: s.y }];
}
export function alongOilPath(points: OilPoint[], progress: number) {
  const lengths = points.slice(1).map((v, i) => Math.hypot(v.x - points[i].x, v.y - points[i].y));
  let distance = oilClamp(progress) * lengths.reduce((s, n) => s + n, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const p = lengths[i] ? oilClamp(distance / lengths[i]) : 1;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * p,
        y: points[i].y + (points[i + 1].y - points[i].y) * p,
      };
    }
    distance -= lengths[i];
  }
  return points[0];
}
export function fractionationFrame(progress: number, bottom = 350, top = 45) {
  return Array.from({ length: 40 }, (_, id) => {
    const species = id % 5,
      copy = Math.floor(id / 5),
      p = oilClamp((oilClamp(progress) - copy * 0.025) / 0.8);
    const position = alongOilPath(oilPath(species, bottom, top), p);
    return {
      id,
      species,
      n: petroleumSpecies[species].n,
      progress: p,
      arrived: p >= 1,
      x: position.x + (p === 0 || p === 1 ? ((copy % 4) - 1.5) * 6 : 0),
      y: position.y + (p === 0 || p === 1 ? (Math.floor(copy / 4) - 0.5) * 7 : 0),
    };
  });
}
export type OilBond = { a: number; b: number; order: number };
export function alkaneBonds(n: number): OilBond[] {
  return Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({ a: i, b: i + 1, order: 1 }));
}
/** Net stoichiometric alternatives from the textbook, not elementary reaction paths. */
export function crackingProducts(n: number, cut: number) {
  n = Math.round(oilClamp(n, 4, 24));
  cut = Math.round(oilClamp(cut, 1, n - 2));
  const bonds = alkaneBonds(n)
    .filter((b) => b.a !== cut - 1)
    .map((b) => ({ ...b, order: b.a === cut ? 2 : 1 }));
  const hydrogen = Array.from(
    { length: n },
    (_, id) => 4 - bonds.reduce((s, b) => s + (b.a === id || b.b === id ? b.order : 0), 0),
  );
  return {
    n,
    cut,
    bonds,
    hydrogen,
    carbonTotal: n,
    hydrogenTotal: hydrogen.reduce((a, b) => a + b, 0),
    products: [
      { c: cut, h: hydrogen.slice(0, cut).reduce((a, b) => a + b, 0), alkene: false },
      { c: n - cut, h: hydrogen.slice(cut).reduce((a, b) => a + b, 0), alkene: true },
    ],
  };
}
export function crackingFrame(n: number, cut: number, progress: number) {
  const products = crackingProducts(n, cut),
    p = oilClamp(progress);
  const move = oilClamp((p - 0.3) / 0.5),
    eased = move * move * (3 - 2 * move);
  const step = Math.min(24, 246 / (products.n - 1));
  const atoms = Array.from({ length: products.n }, (_, id) => {
    const before = { x: 160 + (id - (products.n - 1) / 2) * step, y: 78 + (id % 2) * 13 };
    const left = id < products.cut,
      count = left ? products.cut : products.n - products.cut;
    const index = left ? id : id - products.cut;
    const after = {
      x: (left ? 80 : 240) + (index - (count - 1) / 2) * Math.min(20, 122 / Math.max(1, count - 1)),
      y: 190 + (index % 2) * 13,
    };
    return {
      id,
      x: before.x + (after.x - before.x) * eased,
      y: before.y + (after.y - before.y) * eased,
    };
  });
  return {
    ...products,
    p,
    atoms,
    final: p >= 0.8,
    breakOpacity: 1 - oilClamp((p - 0.2) / 0.12),
    doubleOpacity: oilClamp((p - 0.68) / 0.12),
  };
}
const subs = '₀₁₂₃₄₅₆₇₈₉';
export const oilFormula = (c: number, h = 2 * c + 2) =>
  'C' +
  (c === 1
    ? ''
    : String(c)
        .split('')
        .map((v) => subs[+v])
        .join('')) +
  'H' +
  String(h)
    .split('')
    .map((v) => subs[+v])
    .join('');
