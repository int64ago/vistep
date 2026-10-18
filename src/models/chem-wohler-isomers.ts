/** Connectivity models. Layout coordinates are explanatory, not measured bond lengths. */
export type Atom = {
  id: string;
  element: 'C' | 'O' | 'N' | 'H';
  x: number;
  y: number;
  implicitH?: number;
  charge?: number;
};
export type Bond = { a: string; b: string; order: 1 | 2 | 3 };
export type Structure = { atoms: Atom[]; bonds: Bond[]; name: string };
export type Isomer =
  'pentane' | 'isopentane' | 'neopentane' | 'but1' | 'but2' | 'ethanol' | 'ether';
const atom = (id: string, element: Atom['element'], x: number, y: number, implicitH = 0): Atom => ({
  id,
  element,
  x,
  y,
  implicitH,
});
const bond = (a: string, b: string, order: Bond['order'] = 1): Bond => ({ a, b, order });
export function structure(kind: Isomer): Structure {
  const chain = (xy: number[][], edges: [number, number, 1 | 2 | 3][], oxygen = -1) => {
    const atoms = xy.map(([x, y], i) => atom(`a${i}`, i === oxygen ? 'O' : 'C', x, y));
    const bonds = edges.map(([a, b, o]) => bond(`a${a}`, `a${b}`, o));
    for (const a of atoms)
      a.implicitH =
        (a.element === 'O' ? 2 : 4) -
        bonds.filter((b) => b.a === a.id || b.b === a.id).reduce((n, b) => n + b.order, 0);
    return { atoms, bonds, name: kind };
  };
  if (kind === 'pentane')
    return chain(
      [
        [35, 130],
        [95, 90],
        [155, 130],
        [215, 90],
        [275, 130],
      ],
      [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
        [3, 4, 1],
      ],
    );
  if (kind === 'isopentane')
    return chain(
      [
        [40, 145],
        [115, 105],
        [190, 145],
        [265, 105],
        [115, 35],
      ],
      [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
        [1, 4, 1],
      ],
    );
  if (kind === 'neopentane')
    return chain(
      [
        [155, 110],
        [70, 55],
        [240, 55],
        [70, 165],
        [240, 165],
      ],
      [
        [0, 1, 1],
        [0, 2, 1],
        [0, 3, 1],
        [0, 4, 1],
      ],
    );
  if (kind === 'but1' || kind === 'but2')
    return chain(
      [
        [45, 130],
        [115, 85],
        [185, 130],
        [255, 85],
      ],
      [
        [0, 1, kind === 'but1' ? 2 : 1],
        [1, 2, kind === 'but2' ? 2 : 1],
        [2, 3, 1],
      ],
    );
  if (kind === 'ethanol')
    return chain(
      [
        [65, 130],
        [155, 80],
        [245, 130],
      ],
      [
        [0, 1, 1],
        [1, 2, 1],
      ],
      2,
    );
  return chain(
    [
      [65, 130],
      [155, 80],
      [245, 130],
    ],
    [
      [0, 1, 1],
      [1, 2, 1],
    ],
    1,
  );
}
export function formula(s: Structure) {
  const c = { C: 0, H: 0, N: 0, O: 0 };
  for (const a of s.atoms) {
    c[a.element]++;
    c.H += a.implicitH || 0;
  }
  return c;
}
export function nodeLabel(a: Atom) {
  return a.element + (a.implicitH ? `H${a.implicitH > 1 ? a.implicitH : ''}` : '');
}
export function carbonDegrees(s: Structure) {
  return s.atoms
    .filter((a) => a.element === 'C')
    .map(
      (a) =>
        s.bonds.filter(
          (b) =>
            (b.a === a.id && s.atoms.find((x) => x.id === b.b)?.element === 'C') ||
            (b.b === a.id && s.atoms.find((x) => x.id === b.a)?.element === 'C'),
        ).length,
    )
    .sort();
}
export function wohler(product: boolean): Structure {
  const initial = [
    atom('C', 'C', 225, 112),
    { ...atom('O', 'O', 282, 112), charge: -1 },
    atom('N-a', 'N', 168, 112),
    { ...atom('N-b', 'N', 65, 112), charge: 1 },
    atom('H1', 'H', 24, 112),
    atom('H2', 'H', 65, 65),
    atom('H3', 'H', 105, 112),
    atom('H4', 'H', 65, 160),
  ];
  const final = [
    atom('C', 'C', 155, 102),
    atom('O', 'O', 155, 38),
    atom('N-a', 'N', 94, 140),
    atom('N-b', 'N', 216, 140),
    atom('H1', 'H', 52, 111),
    atom('H2', 'H', 87, 187),
    atom('H3', 'H', 258, 111),
    atom('H4', 'H', 223, 187),
  ];
  return {
    name: product ? 'urea' : 'ammonium cyanate',
    atoms: product ? final : initial,
    bonds: product
      ? [
          bond('C', 'O', 2),
          bond('C', 'N-a'),
          bond('C', 'N-b'),
          bond('N-a', 'H1'),
          bond('N-a', 'H2'),
          bond('N-b', 'H3'),
          bond('N-b', 'H4'),
        ]
      : [
          bond('C', 'O'),
          bond('C', 'N-a', 3),
          ...['H1', 'H2', 'H3', 'H4'].map((h) => bond('N-b', h)),
        ],
  };
}
/** Camera rotation rotates the entire planar alkene: it never twists one end of C=C. */
export function alkene(cis: boolean, viewAngle: number, terminal = false) {
  const coords = [
    [-0.67, 0, 0],
    [0.67, 0, 0],
    [-1.3, 1.05, 0],
    [-1.3, -1.05, 0],
    [1.3, cis ? 1.05 : -1.05, 0],
    [1.3, cis ? -1.05 : 1.05, 0],
  ];
  const a = (viewAngle * Math.PI) / 180;
  return coords.map(([x, y, z], i) => ({
    id: i,
    label: i < 2 ? 'C' : (i === 2 && !terminal) || i === 4 ? 'CH3' : 'H',
    x: x * Math.cos(a) + z * Math.sin(a),
    y,
    z: -x * Math.sin(a) + z * Math.cos(a),
  }));
}
export function hasCisTrans(left: [string, string], right: [string, string]) {
  return left[0] !== left[1] && right[0] !== right[1];
}
/** π overlap only: an idealized angular relationship, not a reaction-energy curve. */
export function piOverlap(twistDegrees: number) {
  return Math.cos((twistDegrees * Math.PI) / 180) ** 2;
}
