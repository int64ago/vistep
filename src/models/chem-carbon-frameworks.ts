export type CarbonPoint = { x: number; y: number; z: number };
export type CarbonAtom = CarbonPoint & { element: 'C' | 'H' | 'Cl'; id: string };
export type CarbonBond = { a: number; b: number; order: 1 | 2 | 3 };
export type CarbonMolecule = {
  atoms: CarbonAtom[];
  bonds: CarbonBond[];
  formula: string;
  key: string;
};
export const TETRAHEDRON: CarbonPoint[] = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
].map(([x, y, z]) => ({ x: x / Math.sqrt(3), y: y / Math.sqrt(3), z: z / Math.sqrt(3) }));
export const dot = (a: CarbonPoint, b: CarbonPoint) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: CarbonPoint, b: CarbonPoint) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const scale = (a: CarbonPoint, k: number) => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const add = (a: CarbonPoint, b: CarbonPoint) => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
export function unit(a: CarbonPoint) {
  return scale(a, 1 / Math.hypot(a.x, a.y, a.z));
}
export function rotatePoint(p: CarbonPoint, axis: CarbonPoint, angle: number) {
  return add(
    add(scale(p, Math.cos(angle)), scale(cross(axis, p), Math.sin(angle))),
    scale(axis, dot(axis, p) * (1 - Math.cos(angle))),
  );
}
export const CHLORINE_PAIRS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];
export function pairAlignment(pair: number) {
  const chosen = CHLORINE_PAIRS[Math.max(0, Math.min(5, pair))],
    rotations = [
      { axis: { x: 1, y: 0, z: 0 }, angle: 0 },
      ...[
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ].map((axis) => ({ axis, angle: Math.PI })),
      ...TETRAHEDRON.flatMap((axis) =>
        [1, -1].map((sign) => ({ axis, angle: (sign * 2 * Math.PI) / 3 })),
      ),
    ];
  return rotations.find((r) => {
    const indices = chosen
      .map((i) => {
        const p = rotatePoint(TETRAHEDRON[i], r.axis, r.angle);
        return TETRAHEDRON.findIndex((q) => dot(p, q) > 0.999999);
      })
      .sort();
    return indices[0] === 0 && indices[1] === 1;
  })!;
}
function terminalHydrogens(center: CarbonPoint, toward: CarbonPoint) {
  const u = unit(toward),
    v = unit(cross(u, Math.abs(u.z) > 0.8 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 })),
    w = cross(u, v);
  return [0, 1, 2].map((i) =>
    add(
      center,
      scale(
        add(
          scale(u, -1 / 3),
          add(
            scale(v, Math.sqrt(8 / 9) * Math.cos((i * 2 * Math.PI) / 3)),
            scale(w, Math.sqrt(8 / 9) * Math.sin((i * 2 * Math.PI) / 3)),
          ),
        ),
        1.09,
      ),
    ),
  );
}
export function carbonMolecule(key: string, pair = 0, alignment = 1): CarbonMolecule {
  const atoms: CarbonAtom[] = [],
    bonds: CarbonBond[] = [];
  const atom = (element: CarbonAtom['element'], p: CarbonPoint) => {
    atoms.push({ ...p, element, id: `${element}${atoms.length}` });
    return atoms.length - 1;
  };
  const bond = (a: number, b: number, order: CarbonBond['order'] = 1) =>
    bonds.push({ a, b, order });
  if (key === 'methane' || key === 'dichloromethane') {
    atom('C', { x: 0, y: 0, z: 0 });
    const r = pairAlignment(pair);
    TETRAHEDRON.forEach((p, i) => {
      const element = key === 'dichloromethane' && CHLORINE_PAIRS[pair].includes(i) ? 'Cl' : 'H',
        q = key === 'dichloromethane' ? rotatePoint(p, r.axis, r.angle * alignment) : p;
      bond(0, atom(element, scale(q, element === 'Cl' ? 1.77 : 1.09)));
    });
  } else if (['ethane', 'ethene', 'ethyne'].includes(key)) {
    const order = key === 'ethane' ? 1 : key === 'ethene' ? 2 : 3,
      cc = order === 1 ? 1.54 : order === 2 ? 1.34 : 1.2;
    atom('C', { x: -cc / 2, y: 0, z: 0 });
    atom('C', { x: cc / 2, y: 0, z: 0 });
    bond(0, 1, order);
    for (const sign of [-1, 1]) {
      const ci = sign === -1 ? 0 : 1,
        c = atoms[ci];
      if (order === 1)
        terminalHydrogens(c, { x: -sign, y: 0, z: 0 }).forEach((p) => bond(ci, atom('H', p)));
      else if (order === 2)
        for (const side of [-1, 1])
          bond(
            ci,
            atom('H', add(c, { x: (sign * 1.09) / 2, y: (side * 1.09 * Math.sqrt(3)) / 2, z: 0 })),
          );
      else bond(ci, atom('H', add(c, { x: sign * 1.06, y: 0, z: 0 })));
    }
  } else if (key === 'isobutane') {
    atom('C', { x: 0, y: 0, z: 0 });
    TETRAHEDRON.slice(0, 3).forEach((p) => bond(0, atom('C', scale(p, 1.54))));
    bond(0, atom('H', scale(TETRAHEDRON[3], 1.09)));
    for (let i = 1; i < 4; i++)
      terminalHydrogens(atoms[i], scale(atoms[i], -1)).forEach((p) => bond(i, atom('H', p)));
  } else {
    const dx = 1.54 * Math.sqrt(2 / 3),
      dy = 1.54 / Math.sqrt(3);
    for (let i = 0; i < 4; i++) atom('C', { x: (i - 1.5) * dx, y: i % 2 ? -dy / 2 : dy / 2, z: 0 });
    for (let i = 0; i < 3; i++) bond(i, i + 1);
    for (const i of [0, 3])
      terminalHydrogens(atoms[i], add(atoms[i === 0 ? 1 : 2], scale(atoms[i], -1))).forEach((p) =>
        bond(i, atom('H', p)),
      );
    for (const i of [1, 2])
      for (const sign of [-1, 1])
        bond(
          i,
          atom(
            'H',
            add(atoms[i], {
              x: 0,
              y: i === 1 ? -1.09 / Math.sqrt(3) : 1.09 / Math.sqrt(3),
              z: sign * 1.09 * Math.sqrt(2 / 3),
            }),
          ),
        );
  }
  const counts = atoms.reduce(
      (m, a) => ((m[a.element] = (m[a.element] ?? 0) + 1), m),
      {} as Record<string, number>,
    ),
    formula = ['C', 'H', 'Cl']
      .filter((e) => counts[e])
      .map((e) => e + (counts[e] === 1 ? '' : counts[e]))
      .join('');
  return { atoms, bonds, formula, key };
}
export function bondCounts(m: CarbonMolecule) {
  return { sigma: m.bonds.length, pi: m.bonds.reduce((s, b) => s + b.order - 1, 0) };
}
export const FOUR_CARBON_GRAPHS = [
  {
    key: 'butane',
    formula: 'C4H10',
    edges: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
    ],
  },
  {
    key: 'isobutane',
    formula: 'C4H10',
    edges: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ],
  },
  {
    key: 'butene',
    formula: 'C4H8',
    edges: [
      [0, 1, 2],
      [1, 2, 1],
      [2, 3, 1],
    ],
  },
  {
    key: 'cyclobutane',
    formula: 'C4H8',
    edges: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
      [3, 0, 1],
    ],
  },
  {
    key: 'butyne',
    formula: 'C4H6',
    edges: [
      [0, 1, 3],
      [1, 2, 1],
      [2, 3, 1],
    ],
  },
];
export function graphHydrogens(edges: number[][]) {
  return Array.from(
    { length: 4 },
    (_, i) => 4 - edges.reduce((s, [a, b, o]) => s + (a === i || b === i ? o : 0), 0),
  );
}
export function carbonDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    pair = Math.min(5, Math.floor(p * 6));
  return {
    chapter,
    progress: p,
    key:
      chapter === 0
        ? 'methane'
        : chapter === 1
          ? 'ethane'
          : chapter === 2
            ? 'ethene'
            : chapter === 3
              ? 'ethyne'
              : chapter === 4
                ? 'dichloromethane'
                : chapter === 5
                  ? p < 0.5
                    ? 'butane'
                    : 'isobutane'
                  : 'butane',
    pair,
    alignment: Math.min(1, (p * 6 - pair) / 0.65),
    yaw: chapter === 2 ? -Math.PI / 2 + (p * Math.PI) / 2 : p * 0.7,
    pitch: chapter === 2 ? 0.2 : chapter === 3 ? 0.4 + p * 0.4 : 0.25,
    showPi: chapter === 2 || chapter === 3,
    graph: Math.min(4, Math.floor(p * 5)),
  };
}
/** Qualitative pi-direction guides, not density isosurfaces. */
export function carbonPiGuides(m: CarbonMolecule) {
  const cc = m.bonds.find((b) => b.order > 1);
  if (!cc) return [];
  const a = m.atoms[cc.a],
    b = m.atoms[cc.b],
    length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  return Array.from({ length: cc.order === 3 ? 4 : 2 }, (_, i) => ({
    center: {
      x: (a.x + b.x) / 2,
      y: i < 2 ? (i === 0 ? 0.4 : -0.4) : 0,
      z: i >= 2 ? (i === 2 ? 0.4 : -0.4) : 0,
    },
    radii: { x: length * 0.68, y: i < 2 ? 0.25 : 0.32, z: i >= 2 ? 0.25 : 0.32 },
    pair: i < 2 ? 0 : 1,
  }));
}
