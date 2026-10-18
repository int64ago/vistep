/** Teaching geometry. Length unit = 100 pm; textbook values are inputs, not VSEPR predictions. */
export type ShapePoint = { x: number; y: number; z: number };
export type ShapeAtom = ShapePoint & { element: 'H' | 'Cl' | 'C' | 'O' | 'N' };
export type ShapeMolecule = {
  key: string;
  formula: string;
  atoms: ShapeAtom[];
  bonds: { a: number; b: number; order: number }[];
  lonePairs: ShapePoint[];
  domains: number;
  angle: number | null;
};
export const shapeAdd = (a: ShapePoint, b: ShapePoint): ShapePoint => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
export const shapeScale = (a: ShapePoint, k: number): ShapePoint => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});
export const shapeDot = (a: ShapePoint, b: ShapePoint) => a.x * b.x + a.y * b.y + a.z * b.z;
export const shapeNorm = (a: ShapePoint) => Math.hypot(a.x, a.y, a.z);
export const shapeUnit = (a: ShapePoint) => shapeScale(a, 1 / shapeNorm(a));
const deg = Math.PI / 180;
export const SHAPE_TETRA = [
  { x: 0, y: 1, z: 0 },
  ...[0, 1, 2].map((i) => ({
    x: Math.sqrt(8 / 9) * Math.cos((i * 2 * Math.PI) / 3),
    y: -1 / 3,
    z: Math.sqrt(8 / 9) * Math.sin((i * 2 * Math.PI) / 3),
  })),
];
export function shapeMolecule(key: string): ShapeMolecule {
  const atoms: ShapeAtom[] = [],
    bonds: ShapeMolecule['bonds'] = [],
    lonePairs: ShapePoint[] = [];
  const atom = (element: ShapeAtom['element'], p: ShapePoint) => {
    atoms.push({ ...p, element });
    return atoms.length - 1;
  };
  const center = (element: ShapeAtom['element']) => atom(element, { x: 0, y: 0, z: 0 });
  const end = (element: ShapeAtom['element'], p: ShapePoint, order = 1) =>
    bonds.push({ a: 0, b: atom(element, p), order });
  let domains = 0,
    angle: number | null = null,
    formula = '';
  if (key === 'hydrogen' || key === 'chlorine') {
    const e = key === 'hydrogen' ? 'H' : 'Cl',
      l = key === 'hydrogen' ? 0.74 : 1.98;
    atom(e, { x: -l / 2, y: 0, z: 0 });
    atom(e, { x: l / 2, y: 0, z: 0 });
    bonds.push({ a: 0, b: 1, order: 1 });
    formula = e + '2';
  } else if (key === 'carbon-dioxide') {
    center('C');
    end('O', { x: -1.16, y: 0, z: 0 }, 2);
    end('O', { x: 1.16, y: 0, z: 0 }, 2);
    domains = 2;
    angle = 180;
    formula = 'CO2';
  } else if (key === 'formaldehyde') {
    center('C');
    end('O', { x: 0, y: 1.2, z: 0 }, 2);
    for (const s of [-1, 1]) end('H', { x: ((s * Math.sqrt(3)) / 2) * 1.09, y: -1.09 / 2, z: 0 });
    domains = 3;
    angle = 120;
    formula = 'CH2O';
  } else if (key === 'ammonia') {
    center('N');
    const h = Math.sqrt((Math.cos(107 * deg) + 0.5) / 1.5),
      r = Math.sqrt(1 - h * h);
    for (let i = 0; i < 3; i++)
      end(
        'H',
        shapeScale(
          { x: r * Math.cos((i * 2 * Math.PI) / 3), y: -h, z: r * Math.sin((i * 2 * Math.PI) / 3) },
          1.01,
        ),
      );
    lonePairs.push({ x: 0, y: 1, z: 0 });
    domains = 4;
    angle = 107;
    formula = 'NH3';
  } else if (key === 'water') {
    center('O');
    for (const s of [-1, 1])
      end('H', { x: s * 0.96 * Math.sin(52.5 * deg), y: -0.96 * Math.cos(52.5 * deg), z: 0 });
    // Lone-pair lobes are schematic domain markers, not measured electron-density surfaces.
    lonePairs.push(shapeUnit({ x: 0, y: 1, z: 1 }), shapeUnit({ x: 0, y: 1, z: -1 }));
    domains = 4;
    angle = 105;
    formula = 'H2O';
  } else {
    center('C');
    SHAPE_TETRA.forEach((p, i) =>
      end(
        key === 'chloromethane' && i === 0 ? 'Cl' : 'H',
        shapeScale(p, key === 'chloromethane' && i === 0 ? 1.77 : 1.09),
      ),
    );
    domains = 4;
    angle = Math.acos(-1 / 3) / deg;
    formula = key === 'chloromethane' ? 'CH3Cl' : 'CH4';
  }
  return { key, formula, atoms, bonds, lonePairs, domains, angle };
}
/** Physical electric-dipole arrows point from negative to positive (IUPAC).
 * Relative bond weights are qualitative, not Debye or a molecular electron-density calculation. */
export function shapeDipoles(m: ShapeMolecule) {
  const zero = { x: 0, y: 0, z: 0 };
  const bonds = m.bonds.map((b) => {
    const a = m.atoms[b.a],
      z = m.atoms[b.b],
      u = shapeUnit(shapeAdd(z, shapeScale(a, -1)));
    let weight = 0;
    if (m.key === 'carbon-dioxide') weight = -1;
    if (m.key === 'water' || m.key === 'ammonia') weight = 1;
    if (m.key === 'formaldehyde') weight = z.element === 'O' ? -1.4 : 0.35;
    if (m.key === 'methane') weight = 0.35;
    if (m.key === 'chloromethane') weight = z.element === 'Cl' ? -1.25 : 0.35;
    return { a: b.a, b: b.b, vector: shapeScale(u, weight), weight };
  });
  const resultant = bonds.reduce((r, b) => shapeAdd(r, b.vector), zero);
  return { bonds, resultant, magnitude: shapeNorm(resultant) };
}
export function shapeProject(p: ShapePoint, yaw: number, pitch: number) {
  const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw),
    z = -p.x * Math.sin(yaw) + p.z * Math.cos(yaw);
  return {
    x,
    y: p.y * Math.cos(pitch) - z * Math.sin(pitch),
    z: p.y * Math.sin(pitch) + z * Math.cos(pitch),
  };
}
export function shapeDirector(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(9, chapter)),
    p = Math.max(0, Math.min(1, progress));
  const keys = [
    'hydrogen',
    'carbon-dioxide',
    'formaldehyde',
    'methane',
    'balloons',
    'ammonia',
    'water',
    'carbon-dioxide',
    'water',
    'methane',
  ];
  return {
    chapter: c,
    key:
      c === 0
        ? p < 0.5
          ? 'hydrogen'
          : 'chlorine'
        : c === 9
          ? p < 0.5
            ? 'methane'
            : 'chloromethane'
          : keys[c],
    domains: c >= 1 && c <= 6,
    polarity: c >= 7,
    yaw: c === 0 || c === 7 || c === 8 ? 0 : 0.28 + p * 0.65,
    pitch: c === 6 ? 0.48 : c === 5 ? 0.32 : 0.2,
    reveal: Math.min(1, p * 2),
    sum: Math.max(0, Math.min(1, (p - 0.25) * 2.2)),
  };
}
/** Equal balloon axes maximize the minimum separation at tetrahedral directions.
 * Surface is an illustrative fixed profile, not a pressure / rubber-elasticity simulation. */
export function balloonSurface(direction: ShapePoint, ring: number, azimuth: number): ShapePoint {
  const u = shapeUnit(direction),
    axis = Math.abs(u.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const v = shapeUnit({
    x: u.y * axis.z - u.z * axis.y,
    y: u.z * axis.x - u.x * axis.z,
    z: u.x * axis.y - u.y * axis.x,
  });
  const w = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
  const t = Math.max(0, Math.min(1, ring)),
    long = 0.06 + 1.6 * t,
    r = 0.59 * Math.pow(Math.sin(Math.PI * t), 0.7) * Math.min(1, t * 8);
  return shapeAdd(
    shapeScale(u, long),
    shapeAdd(shapeScale(v, r * Math.cos(azimuth)), shapeScale(w, r * Math.sin(azimuth))),
  );
}
