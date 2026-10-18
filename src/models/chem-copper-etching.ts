export const COPPER_GRID = { width: 40, height: 24 };
export const COPPER_TRACE: [number, number][] = [
  [5, 5],
  [15, 5],
  [15, 12],
  [28, 12],
  [28, 19],
  [35, 19],
];
const clamp = (x: number) => Math.max(0, Math.min(1, x));
function segmentDistance(x: number, y: number, a: number[], b: number[]) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy));
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}
export function copperProtected(x: number, y: number, mask = true) {
  return (
    mask &&
    (COPPER_TRACE.slice(1).some((b, i) => segmentDistance(x, y, COPPER_TRACE[i], b) < 1.4) ||
      [COPPER_TRACE[0], COPPER_TRACE.at(-1)!].some((v) => Math.hypot(x - v[0], y - v[1]) < 2.6))
  );
}
/** Equal area cells, unit total copper amount, ideal vertical etch. No undercut/kinetics. */
export function copperEtching(extent = 1, ferric = 2, mask = true) {
  const cells = Array.from({ length: 960 }, (_, i) => ({
    x: i % 40,
    y: Math.floor(i / 40),
    protected: copperProtected((i % 40) + 0.5, Math.floor(i / 40) + 0.5, mask),
  }));
  const protectedFraction = cells.filter((c) => c.protected).length / 960,
    exposed = 1 - protectedFraction;
  const removed = Math.min(exposed, Math.max(0, ferric) / 2) * clamp(extent),
    depth = exposed ? removed / exposed : 0;
  return {
    cells,
    protectedFraction,
    exposed,
    removed,
    depth,
    copperSolid: 1 - removed,
    copperIon: removed,
    ferricLeft: Math.max(0, ferric) - 2 * removed,
    ferrous: 2 * removed,
  };
}
export function copperEtchDirector(chapter: number, p: number) {
  const x = clamp(p);
  return {
    extent: chapter === 0 ? 0 : chapter === 1 ? x : 1,
    ferric: 2,
    mask: true,
    maskVisible: chapter < 3,
    section: chapter === 1 || chapter === 2,
    account: chapter === 2,
    progress: x,
  };
}
