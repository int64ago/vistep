export type ElectronBond = 'ionic' | 'polar';
/** Electron bookkeeping, not a quantum trajectory or partial-charge computation. */
export function electronLedger(bond: ElectronBond, formed: boolean) {
  const leftValence = 1,
    rightValence = 7,
    total = leftValence + rightValence;
  const assignedLeft = formed ? 0 : leftValence,
    assignedRight = total - assignedLeft;
  return {
    bond,
    total,
    assignedLeft,
    assignedRight,
    leftOxidation: leftValence - assignedLeft,
    rightOxidation: rightValence - assignedRight,
    sharedPair: bond === 'polar' && formed ? 2 : 0,
    ionic: bond === 'ionic',
  };
}
export function transferPosition(progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    smooth = p * p * (3 - 2 * p);
  return { x: 163 + 239 * smooth, y: 103 + 32 * smooth - 60 * Math.sin(Math.PI * smooth) };
}
export function bondDensity(x: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  // Illustrative normalized relative envelope: shift towards chlorine as the polar bond is introduced.
  const centre = 0.5 + 0.14 * p,
    width = 0.23;
  return Math.exp(-(((x - centre) / width) ** 2));
}
export function electronDirector(chapter: number, progress: number) {
  return {
    bond: (chapter === 2 ? 'polar' : 'ionic') as ElectronBond,
    progress: chapter === 1 ? 1 : Math.max(0, Math.min(1, progress)),
    formed: chapter > 0 || progress > 0.85,
    ledger: chapter === 1,
  };
}
