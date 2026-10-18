import data from './chem-protein-structure-data.json';
export type Vec3 = [number, number, number];
export type Residue = { id: number; name: string; atoms: Record<string, number[]> };
export const crambin = data['1CRN'].chains.A as Residue[];
export const hemoglobin = data['4HHB'].chains as Record<string, Residue[]>;
export const aminoLetter: Record<string, string> = {
  ALA: 'A',
  ARG: 'R',
  ASN: 'N',
  ASP: 'D',
  CYS: 'C',
  GLN: 'Q',
  GLU: 'E',
  GLY: 'G',
  HIS: 'H',
  ILE: 'I',
  LEU: 'L',
  LYS: 'K',
  MET: 'M',
  PHE: 'F',
  PRO: 'P',
  SER: 'S',
  THR: 'T',
  TRP: 'W',
  TYR: 'Y',
  VAL: 'V',
};
export const sequence = crambin.map((r) => aminoLetter[r.name]).join('');
const bound = (n: number, a: number, b: number) =>
  Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a;
export function distance(a: number[], b: number[]) {
  return Math.hypot(...a.map((v, i) => v - b[i]));
}
export function center(points: number[][]): Vec3 {
  return [0, 1, 2].map(
    (i) => points.reduce((s, p) => s + p[i], 0) / Math.max(1, points.length),
  ) as Vec3;
}
export function rotate(point: number[], yaw: number, pitch = 0.35): Vec3 {
  const [x, y, z] = point,
    cy = Math.cos(yaw),
    sy = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  return [x * cy + z * sy, y * cp - (z * cy - x * sy) * sp, y * sp + (z * cy - x * sy) * cp];
}
export const secondary = (id: number) =>
  (id >= 7 && id <= 19) || (id >= 23 && id <= 30)
    ? 'helix'
    : id <= 4 || (id >= 32 && id <= 35)
      ? 'sheet'
      : 'loop';
export function structureLinks(view: 'helix' | 'sheet' | 'whole') {
  const get = (id: number, atom: string) => crambin[id - 1].atoms[atom];
  if (view === 'whole')
    return [
      [3, 40],
      [4, 32],
      [16, 26],
    ].map(([a, b]) => ({
      a: get(a, 'SG'),
      b: get(b, 'SG'),
      kind: 'disulfide',
      ids: [a, b],
      length: distance(get(a, 'SG'), get(b, 'SG')),
    }));
  const pairs =
    view === 'helix'
      ? Array.from({ length: 7 }, (_, i) => [i + 7, i + 11])
      : [
          [1, 35],
          [35, 1],
          [3, 33],
          [33, 3],
        ];
  return pairs.map(([a, b]) => ({
    a: get(a, 'O'),
    b: get(b, 'N'),
    kind: 'hydrogen',
    ids: [a, b],
    length: distance(get(a, 'O'), get(b, 'N')),
  }));
}
export function proteinGeometry(
  view: 'helix' | 'sheet' | 'whole' | 'assembly',
  yaw = 0,
  separation = 0,
) {
  const sets =
    view === 'assembly'
      ? Object.entries(hemoglobin)
      : ([
          [
            'A',
            crambin.filter((r) =>
              view === 'helix'
                ? r.id >= 7 && r.id <= 17
                : view === 'sheet'
                  ? r.id <= 4 || (r.id >= 32 && r.id <= 35)
                  : true,
            ),
          ],
        ] as [string, Residue[]][]);
  const origin = center(sets.flatMap(([, rs]) => rs.map((r) => r.atoms.CA))),
    spread = bound(separation, 0, 1);
  const reference = sets.flatMap(([, rs]) => {
    const centroid = center(rs.map((r) => r.atoms.CA));
    const offset = view === 'assembly' ? centroid.map((v, i) => (v - origin[i]) * 0.8) : [0, 0, 0];
    return rs.flatMap((r) =>
      Object.values(r.atoms).map((p) =>
        rotate(
          p.map((v, i) => v - origin[i] + offset[i]),
          yaw,
        ),
      ),
    );
  });
  const xmin = Math.min(...reference.map((p) => p[0])),
    xmax = Math.max(...reference.map((p) => p[0])),
    ymin = Math.min(...reference.map((p) => p[1])),
    ymax = Math.max(...reference.map((p) => p[1]));
  const scale = Math.min(270 / Math.max(1, xmax - xmin), 240 / Math.max(1, ymax - ymin));
  const transform = (p: number[], offset: number[] = [0, 0, 0]) => {
    const q = rotate(
      p.map((v, i) => v - origin[i] + offset[i]),
      yaw,
    );
    return [
      160 + (q[0] - (xmin + xmax) / 2) * scale,
      145 - (q[1] - (ymin + ymax) / 2) * scale,
      q[2] * scale,
    ] as Vec3;
  };
  const nodes = sets.flatMap(([chain, rs]) => {
    const c = center(rs.map((r) => r.atoms.CA)),
      off = view === 'assembly' ? c.map((v, i) => (v - origin[i]) * spread * 0.8) : [0, 0, 0];
    return rs.map((r) => ({
      chain,
      id: r.id,
      name: r.name,
      point: transform(r.atoms.CA, off),
      secondary: secondary(r.id),
    }));
  });
  const segments = nodes
    .flatMap((n, i) =>
      i > 0 && nodes[i - 1].chain === n.chain && nodes[i - 1].id === n.id - 1
        ? [{ a: nodes[i - 1], b: n, depth: (nodes[i - 1].point[2] + n.point[2]) / 2 }]
        : [],
    )
    .sort((a, b) => a.depth - b.depth);
  const links =
    view === 'assembly'
      ? []
      : structureLinks(view).map((l) => ({ ...l, a: transform(l.a), b: transform(l.b) }));
  const sidechains =
    view === 'whole'
      ? [
          [3, 40],
          [4, 32],
          [16, 26],
        ]
          .flat()
          .map((id) => ({
            id,
            points: ['CA', 'CB', 'SG'].map((a) => transform(crambin[id - 1].atoms[a])),
          }))
      : [];
  return { nodes, segments, links, sidechains, scale };
}
export function proteinStructureDirector(chapter: number, p: number) {
  const c = Math.floor(bound(chapter, 0, 4)),
    progress = bound(p, 0, 1);
  return {
    chapter: c,
    progress,
    selected: 1 + Math.min(45, Math.floor(progress * 46)),
    yaw: c === 0 ? 0 : -0.5 + progress * 0.9,
    separation: c === 4 ? Math.max(0, 1 - progress * 1.6) : 0,
    linkOpacity: bound((progress - 0.2) / 0.45, 0, 1),
  };
}
