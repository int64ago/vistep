import atoms from './bio-insulin-coordinates.json';
export const proteinChapters = ['condense', 'chains', 'connect', 'verify'] as const;
export const proteinDurations = [33, 31.5, 40.5, 42] as const;
export const insulinResidues = atoms;
export const insulinDisulfides = [
  ['A6', 'A11'],
  ['A7', 'B7'],
  ['A20', 'B19'],
] as const;
const finite = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback);
const clamp = (n: number) => Math.max(0, Math.min(1, finite(n)));
const blend = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (p: number) => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};
const phase = (t: number, a: number, b: number) => smooth((finite(t) - a) / (b - a));
const center = atoms.reduce((s, a) => s.map((v, i) => v + a.xyz[i] / atoms.length), [0, 0, 0]);
export type ProteinPoint = { x: number; y: number; z: number };
function rotate(x: number, y: number, z: number, angle: number): ProteinPoint {
  const a = ((finite(angle) % 360) * Math.PI) / 180;
  return { x: x * Math.cos(a) + z * Math.sin(a), y, z: -x * Math.sin(a) + z * Math.cos(a) };
}
/** Open, unbranched, nonempty chains. Invalid zero-chain input is normalized, never a cyclic chain. */
export function peptideAccounting(residues: number, chains: number) {
  const n = Math.max(0, Math.floor(finite(residues))),
    c = n === 0 ? 0 : Math.max(1, Math.min(n, Math.floor(finite(chains, 1))));
  return { residues: n, chains: c, peptideBonds: n - c, water: n - c };
}
/** C-alpha geometry is a backbone reference. Interpolation is layout, NOT folding dynamics. */
export function insulinGeometry(folding: number, rotation: number) {
  const p = clamp(folding);
  return atoms.map((atom) => {
    const x = blend(
      (atom.residue - 1) * 1.1 - (atom.chain === 'A' ? 11 : 16),
      atom.xyz[0] - center[0],
      p,
    );
    const y = blend(atom.chain === 'A' ? -9 : 9, atom.xyz[1] - center[1], p);
    return {
      ...atom,
      id: atom.chain + atom.residue,
      ...rotate(x, y, (atom.xyz[2] - center[2]) * p, rotation),
    };
  });
}
// RCSB PDB 2A3G (2005), A/B chains, blank or A alternate. Angstroms; six CYS side chains only.
export const insulinCysteineAtoms = [
  {
    atom: 'CA',
    residue: 6,
    chain: 'A',
    name: 'CYS',
    xyz: [-10.205, 8.655, 11.958],
    serial: 39,
    id: 'A6-CA',
  },
  {
    atom: 'CB',
    residue: 6,
    chain: 'A',
    name: 'CYS',
    xyz: [-9.82, 8.854, 10.493],
    serial: 42,
    id: 'A6-CB',
  },
  {
    atom: 'SG',
    residue: 6,
    chain: 'A',
    name: 'CYS',
    xyz: [-11.05, 9.643, 9.408],
    serial: 43,
    id: 'A6-SG',
  },
  {
    atom: 'CA',
    residue: 7,
    chain: 'A',
    name: 'CYS',
    xyz: [-7.11, 7.4, 13.755],
    serial: 45,
    id: 'A7-CA',
  },
  {
    atom: 'CB',
    residue: 7,
    chain: 'A',
    name: 'CYS',
    xyz: [-5.716, 7.979, 13.462],
    serial: 48,
    id: 'A7-CB',
  },
  {
    atom: 'SG',
    residue: 7,
    chain: 'A',
    name: 'CYS',
    xyz: [-4.371, 6.947, 14.133],
    serial: 49,
    id: 'A7-SG',
  },
  {
    atom: 'CA',
    residue: 11,
    chain: 'A',
    name: 'CYS',
    xyz: [-14.711, 7.649, 10.926],
    serial: 76,
    id: 'A11-CA',
  },
  {
    atom: 'CB',
    residue: 11,
    chain: 'A',
    name: 'CYS',
    xyz: [-13.739, 8.728, 10.442],
    serial: 79,
    id: 'A11-CB',
  },
  {
    atom: 'SG',
    residue: 11,
    chain: 'A',
    name: 'CYS',
    xyz: [-12.501, 8.239, 9.193],
    serial: 80,
    id: 'A11-SG',
  },
  {
    atom: 'CA',
    residue: 20,
    chain: 'A',
    name: 'CYS',
    xyz: [-12.82, 16.375, -1.339],
    serial: 154,
    id: 'A20-CA',
  },
  {
    atom: 'CB',
    residue: 20,
    chain: 'A',
    name: 'CYS',
    xyz: [-13.856, 15.496, -2.041],
    serial: 157,
    id: 'A20-CB',
  },
  {
    atom: 'SG',
    residue: 20,
    chain: 'A',
    name: 'CYS',
    xyz: [-13.903, 13.749, -1.546],
    serial: 158,
    id: 'A20-SG',
  },
  {
    atom: 'CA',
    residue: 7,
    chain: 'B',
    name: 'CYS',
    xyz: [-4.11, 5.94, 10.506],
    serial: 223,
    id: 'B7-CA',
  },
  {
    atom: 'CB',
    residue: 7,
    chain: 'B',
    name: 'CYS',
    xyz: [-3.527, 5.289, 11.76],
    serial: 226,
    id: 'B7-CB',
  },
  {
    atom: 'SG',
    residue: 7,
    chain: 'B',
    name: 'CYS',
    xyz: [-4.635, 5.166, 13.203],
    serial: 227,
    id: 'B7-SG',
  },
  {
    atom: 'CA',
    residue: 19,
    chain: 'B',
    name: 'CYS',
    xyz: [-12.404, 11.806, -3.762],
    serial: 320,
    id: 'B19-CA',
  },
  {
    atom: 'CB',
    residue: 19,
    chain: 'B',
    name: 'CYS',
    xyz: [-11.488, 12.834, -3.118],
    serial: 323,
    id: 'B19-CB',
  },
  {
    atom: 'SG',
    residue: 19,
    chain: 'B',
    name: 'CYS',
    xyz: [-11.943, 13.234, -1.405],
    serial: 324,
    id: 'B19-SG',
  },
] as const;
export function insulinSidechains(rotation: number) {
  return insulinCysteineAtoms.map((a) => ({
    ...a,
    ...rotate(a.xyz[0] - center[0], a.xyz[1] - center[1], a.xyz[2] - center[2], rotation),
  }));
}
/** A camera move between the A7/B7 side-chain detail and whole reference, not a molecular deformation. */
export function proteinProjection(rotation: number, whole = 1) {
  const all = [...insulinGeometry(1, rotation), ...insulinSidechains(rotation)];
  const local = insulinSidechains(rotation).filter(
    (a) => a.id.startsWith('A7-') || a.id.startsWith('B7-'),
  );
  const bounds = (ps: ProteinPoint[], w: number, h: number) => {
    const xs = ps.map((a) => a.x),
      ys = ps.map((a) => a.y),
      xmin = Math.min(...xs),
      xmax = Math.max(...xs),
      ymin = Math.min(...ys),
      ymax = Math.max(...ys);
    return {
      cx: (xmin + xmax) / 2,
      cy: (ymin + ymax) / 2,
      scale: Math.min(w / (xmax - xmin), h / (ymax - ymin)),
    };
  };
  const a = bounds(local, 240, 142),
    b = bounds(all, 220, 168),
    p = clamp(whole);
  return {
    cx: blend(a.cx, b.cx, p),
    cy: blend(a.cy, b.cy, p),
    scale: blend(a.scale, b.scale, p),
    y: blend(92, 98, p),
  };
}
/** Actual SG--SG bond endpoints; callers must draw CA--CB--SG attachment as well. */
export function disulfideEdges(rotation: number) {
  const a = insulinSidechains(rotation);
  return insulinDisulfides.map(([from, to]) => ({
    from: a.find((x) => x.id === from + '-SG')!,
    to: a.find((x) => x.id === to + '-SG')!,
  }));
}
export function insulinPeptideEdges() {
  return ['A', 'B'].flatMap((chain) => {
    const a = atoms.filter((r) => r.chain === chain);
    return a.slice(1).map((r, i) => ({ from: chain + a[i].residue, to: chain + r.residue, chain }));
  });
}
/** Layout-only permutation: identity travels, slot adjacency stays. No chemical swap mechanism is implied. */
export function sequenceStrip(chain: 'A' | 'B', swap = 0) {
  const p = clamp(swap),
    list = atoms.filter((a) => a.chain === chain);
  const slot = (i: number) => ({ x: 22 + (i < 15 ? i : 29 - i) * 18, y: i < 15 ? 35 : 55 });
  return list.map((a, i) => {
    const other = chain === 'A' && (i === 1 || i === 2) ? (i === 1 ? 2 : 1) : i;
    const from = slot(i),
      to = slot(other);
    return {
      ...a,
      id: chain + a.residue,
      slot: blend(i + 1, other + 1, p),
      x: blend(from.x, to.x, p),
      y:
        blend(from.y, to.y, p) +
        (i === 1 ? -1 : 1) * (other !== i ? 14 * Math.sin(Math.PI * p) : 0),
    };
  });
}
export function sequenceCandidate(swapped: boolean) {
  return {
    id: swapped ? 'candidate-swapped-A2-A3' : 'native-sequence-reference',
    residueCount: 51,
    peptideBonds: 49,
    changed: swapped,
    activity: null,
    resultStatus: 'unmeasured' as const,
  };
}
export function connectivityState(removeDisulfides: boolean) {
  return {
    residues: 51,
    chains: 2,
    peptideBonds: insulinPeptideEdges().length,
    disulfides: removeDisulfides ? 0 : insulinDisulfides.length,
    activity: null,
  };
}
export type NetAtom = {
  id: string;
  element: 'C' | 'N' | 'O' | 'H';
  x: number;
  y: number;
  water: boolean;
};
/** Net composition only: not an elementary chemical reaction or a ribosomal synthesis mechanism.
 * Explicit retained N-H prevents double-counting H in an NH label. Carbon substituents are collapsed.
 */
export function peptideNet(progress: number) {
  const p = clamp(progress);
  const retained: NetAtom[] = [
    { id: 'carbonyl-C', element: 'C', x: 98, y: 115, water: false },
    { id: 'carbonyl-O', element: 'O', x: 98, y: 70, water: false },
    { id: 'amino-N', element: 'N', x: blend(230, 172, p), y: 115, water: false },
    { id: 'retained-H', element: 'H', x: blend(230, 172, p), y: 158, water: false },
  ];
  const ox = blend(150, 163, p),
    oy = blend(115, 43, p),
    ohAngle = -Math.PI / 4 - (p * Math.PI) / 2;
  const departing: NetAtom[] = [
    { id: 'carboxyl-O', element: 'O', x: ox, y: oy, water: p >= 1 },
    {
      id: 'carboxyl-H',
      element: 'H',
      x: ox + Math.sqrt(1800) * Math.cos(ohAngle),
      y: oy + Math.sqrt(1800) * Math.sin(ohAngle),
      water: p >= 1,
    },
    { id: 'amino-H', element: 'H', x: blend(230, 193, p), y: blend(70, 13, p), water: p >= 1 },
  ];
  const bonds = [
    { from: 'carbonyl-C', to: 'carbonyl-O', order: 2, opacity: 1 },
    { from: 'carbonyl-C', to: 'carboxyl-O', order: 1, opacity: 1 - p },
    { from: 'carboxyl-O', to: 'carboxyl-H', order: 1, opacity: 1 },
    { from: 'amino-N', to: 'retained-H', order: 1, opacity: 1 },
    { from: 'amino-N', to: 'amino-H', order: 1, opacity: 1 - p },
    { from: 'carboxyl-O', to: 'amino-H', order: 1, opacity: p },
    { from: 'carbonyl-C', to: 'amino-N', order: 1, opacity: p },
  ];
  return {
    atoms: [...retained, ...departing],
    bonds,
    progress: p,
    newPeptideBonds: p === 1 ? 1 : 0,
    netWater: p === 1 ? 1 : 0,
  };
}
/** The record is qualitative and fixed. It does not generate dose-response values or compute activity from coordinates. */
export const insulinFunctionReport = Object.freeze({
  source: 'Tsou, 1998 account, republished 2015, Life Sciences 27(6), pp.778–779, section 2',
  sourceUrl: 'https://lifescience.sinh.ac.cn/webadmin/upload/20156777.pdf',
  experimentYear: 1965,
  recordKind: 'participant-account-qualitative',
  reference: Object.freeze({ id: 'natural-reference', result: 'reported-active' }),
  synthetic: Object.freeze({ id: 'purified-fully-synthetic-bovine', result: 'reported-active' }),
  relation: 'same-activity-as-reported',
  numericalValues: null,
});
/** Chapter-relative seconds aligned to both recorded voices, including the 0.45 s cue lead.
 * Locale changes editing only: atoms, native coordinates and fixed assay evidence are unchanged.
 */
export function proteinDirector(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const t = Math.max(0, finite(chapterTime)),
    en = locale === 'en';
  if (chapter === 0)
    return {
      shot: t < (en ? 24.3 : 22.6) ? 'net' : 'five',
      net: phase(t, en ? 11.7 : 9.8, en ? 16.1 : 14),
      joins: phase(t, en ? 24.6 : 28.6, en ? 28.3 : 30.8),
      swap: 0,
      selected: 0,
      fold: 0,
      removed: false,
      reveal: 0,
      candidate: false,
    };
  if (chapter === 1)
    return {
      shot: 'chains',
      net: 1,
      // Count A's 20 joins, pause on its endpoint, then count B's 29 joins.
      joins:
        (20 * phase(t, en ? 2.4 : 3, en ? 6.5 : 6.8) +
          29 * phase(t, en ? 7.1 : 7.7, en ? 10.2 : 10.4)) /
        49,
      swap: phase(t, en ? 17.6 : 16.9, en ? 19.2 : 18.3),
      selected: 0,
      fold: 0,
      removed: false,
      reveal: 0,
      candidate: false,
    };
  if (chapter === 2)
    return {
      shot: t < (en ? 10.8 : 10.9) ? 'topology' : t < (en ? 21.3 : 22.5) ? 'sulfur' : 'native',
      net: 1,
      joins: 1,
      swap: 0,
      selected: t < (en ? 8.4 : 7.8) ? 0 : t < (en ? 9.5 : 9.1) ? 1 : 2,
      fold: phase(t, en ? 21.3 : 22.5, en ? 24 : 25.1),
      removed: t >= (en ? 29.2 : 31),
      reveal: 0,
      candidate: false,
    };
  return {
    shot: 'evidence',
    net: 1,
    joins: 1,
    swap: 1,
    selected: 0,
    fold: 1,
    removed: false,
    reveal: t < (en ? 11 : 11.6) ? 0 : t < (en ? 12 : 12.8) ? 1 : 2,
    candidate: t >= (en ? 28.4 : 26.5),
  };
}
