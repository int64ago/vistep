import coordinates from './bio-dna-coordinates.json';
export type Base = 'A' | 'T' | 'G' | 'C';
export type Vec3 = [number, number, number];
export type Residue = {
  id: string;
  chain: string;
  index: number;
  base: Base;
  atoms: Record<string, Vec3>;
};
export const dnaResidues = coordinates.residues as unknown as Residue[];
export const dnaSequence = dnaResidues
  .filter((r) => r.chain === 'A')
  .map((r) => r.base)
  .join('');
export const complement = (base: Base): Base =>
  (({ A: 'T', T: 'A', G: 'C', C: 'G' }) as const)[base];
export function pairedSequence(sequence: string) {
  return [...sequence].map((b) => complement(b as Base)).join('');
}
export function basePair(a: Base, b: Base) {
  const valid = complement(a) === b;
  return {
    valid,
    rings: [a === 'A' || a === 'G' ? 2 : 1, b === 'A' || b === 'G' ? 2 : 1],
    hydrogenBonds: valid ? (a === 'G' || a === 'C' ? 3 : 2) : 0,
  };
}
export function dnaCounts(sequence: string) {
  const counts = { A: 0, T: 0, G: 0, C: 0 };
  for (const b of sequence) counts[b as Base]++;
  return counts;
}
export function verifyDuplex(top: string, bottom: string, antiparallel: boolean) {
  return {
    lengthMatches: top.length === bottom.length,
    pairErrors: [...top].flatMap((b, i) => (complement(b as Base) === bottom[i] ? [] : [i])),
    antiparallel,
    valid: antiparallel && top.length === bottom.length && pairedSequence(top) === bottom,
  };
}
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalized = (a: Vec3) => scale(a, 1 / Math.hypot(...a));
const start = scale(add(dnaResidues[0].atoms["C1'"], dnaResidues[23].atoms["C1'"]), 0.5),
  end = scale(add(dnaResidues[11].atoms["C1'"], dnaResidues[12].atoms["C1'"]), 0.5);
const center = scale(add(start, end), 0.5),
  axis = normalized(sub(end, start)),
  right = normalized(cross(axis, [0, 0, 1])),
  depth = cross(right, axis);
export function projectDna(point: Vec3, rotation: number) {
  const p = sub(point, center),
    a = dot(p, right),
    b = dot(p, depth),
    c = dot(p, axis);
  return {
    x: 175 + 6.1 * (a * Math.cos(rotation) + b * Math.sin(rotation)),
    y: 165 + 6.1 * c,
    z: -a * Math.sin(rotation) + b * Math.cos(rotation),
  };
}
export function backboneSegments() {
  const lines: { id: string; chain: string; a: Vec3; b: Vec3 }[] = [];
  for (const r of dnaResidues) {
    const order = ['P', "O5'", "C5'", "C4'", "C3'", "O3'"].filter((n) => r.atoms[n]);
    for (let i = 1; i < order.length; i++)
      lines.push({
        id: `${r.id}-${order[i]}`,
        chain: r.chain,
        a: r.atoms[order[i - 1]],
        b: r.atoms[order[i]],
      });
    const next = dnaResidues.find((n) => n.chain === r.chain && n.index === r.index + 1);
    if (next)
      lines.push({ id: `${r.id}-bridge`, chain: r.chain, a: r.atoms["O3'"], b: next.atoms.P });
  }
  return lines;
}
export function residueRings(r: Residue) {
  return [
    { kind: 'sugar', atoms: ["C1'", "C2'", "C3'", "C4'", "O4'"] },
    {
      kind: 'base',
      atoms:
        r.base === 'A' || r.base === 'G'
          ? ['N1', 'C2', 'N3', 'C4', 'C5', 'C6']
          : ['N1', 'C2', 'N3', 'C4', 'C5', 'C6'],
    },
    ...(r.base === 'A' || r.base === 'G'
      ? [{ kind: 'base', atoms: ['C4', 'C5', 'N7', 'C8', 'N9'] }]
      : []),
  ].map((ring, i) => ({
    id: `${r.id}-ring-${i}`,
    kind: ring.kind,
    points: ring.atoms.map((n) => r.atoms[n]),
  }));
}
export function pairHydrogenBonds(index: number) {
  const first = dnaResidues[index],
    second = dnaResidues[23 - index];
  const purine = first.base === 'A' || first.base === 'G' ? first : second,
    pyrimidine = purine === first ? second : first;
  const pairs =
    purine.base === 'A'
      ? [
          ['N6', 'O4'],
          ['N1', 'N3'],
        ]
      : [
          ['O6', 'N4'],
          ['N1', 'N3'],
          ['N2', 'O2'],
        ];
  return pairs.map(([a, b]) => ({
    a: purine.atoms[a],
    b: pyrimidine.atoms[b],
    distance: Math.hypot(...sub(purine.atoms[a], pyrimidine.atoms[b])),
  }));
}
/** Equal point scatterers on two ideal strands, Å units. This is not a reconstruction of Photo 51. */
export function idealScatterers(twist = 36, count = 40) {
  return Array.from({ length: count * 2 }, (_, id) => {
    const i = Math.floor(id / 2),
      angle = ((i * twist + (id % 2) * 144) * Math.PI) / 180;
    return [10 * Math.cos(angle), 10 * Math.sin(angle), (i - (count - 1) / 2) * 3.4] as Vec3;
  });
}
export function scatteringIntensity(qx: number, qz: number, twist = 36, orientations = 8) {
  const points = idealScatterers(twist);
  let intensity = 0;
  for (let n = 0; n < orientations; n++) {
    const rotation = (n * Math.PI * 2) / orientations;
    let re = 0,
      im = 0;
    for (const p of points) {
      const phase =
        2 * Math.PI * (qx * (p[0] * Math.cos(rotation) + p[1] * Math.sin(rotation)) + qz * p[2]);
      re += Math.cos(phase);
      im += Math.sin(phase);
    }
    intensity += re * re + im * im;
  }
  return intensity / orientations / points.length ** 2;
}
