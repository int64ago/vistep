import atoms from './bio-insulin-coordinates.json';
export const insulinResidues = atoms;
export const insulinDisulfides = [
  ['A6', 'A11'],
  ['A7', 'B7'],
  ['A20', 'B19'],
] as const;
const center = atoms.reduce((s, a) => s.map((v, i) => v + a.xyz[i] / atoms.length), [0, 0, 0]);
export function peptideAccounting(residues: number, chains: number) {
  const n = Math.max(0, Math.floor(residues)),
    c = Math.max(0, Math.min(n, Math.floor(chains)));
  return { residues: n, chains: c, peptideBonds: n - c, water: n - c };
}
/** Geometry interpolation is an explanatory transition, not a folding trajectory or dynamics simulation. */
export function insulinGeometry(folding: number, rotation: number) {
  const p = Math.max(0, Math.min(1, folding)),
    a = (rotation * Math.PI) / 180;
  return atoms.map((atom) => {
    const x =
        (atom.xyz[0] - center[0]) * p +
        ((atom.residue - 1) * 1.1 - (atom.chain === 'A' ? 11 : 16)) * (1 - p),
      y = (atom.xyz[1] - center[1]) * p + (atom.chain === 'A' ? -9 : 9) * (1 - p),
      z = (atom.xyz[2] - center[2]) * p;
    return {
      ...atom,
      id: atom.chain + atom.residue,
      x: x * Math.cos(a) + z * Math.sin(a),
      y,
      z: -x * Math.sin(a) + z * Math.cos(a),
    };
  });
}
export function disulfideEdges(folding: number, rotation: number) {
  const a = insulinGeometry(folding, rotation);
  return insulinDisulfides.map(([from, to]) => ({
    from: a.find((x) => x.id === from)!,
    to: a.find((x) => x.id === to)!,
  }));
}
