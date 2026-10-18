/** Finite stoichiometry and illustrative material states, never fitted kinetic predictions. */
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export type Point = { x: number; y: number };
const mix = (a: number, b: number, p: number) => a + (b - a) * clamp(p);
export function vinylGeometry(p: number) {
  const start = [
    { x: 40, y: 65 },
    { x: 100, y: 65 },
    { x: 200, y: 65 },
    { x: 260, y: 65 },
    { x: 40, y: 180 },
    { x: 100, y: 180 },
    { x: 200, y: 180 },
    { x: 260, y: 180 },
  ];
  const end = [
    { x: 45, y: 70 },
    { x: 110, y: 70 },
    { x: 175, y: 70 },
    { x: 240, y: 70 },
    { x: 240, y: 180 },
    { x: 175, y: 180 },
    { x: 110, y: 180 },
    { x: 45, y: 180 },
  ];
  return start.map((a, i) => ({
    id: `C${i + 1}`,
    x: mix(a.x, end[i].x, p),
    y: mix(a.y, end[i].y, p),
    chlorine: i % 2 === 1,
    side: i < 4 ? -1 : 1,
  }));
}
export function condensation(pairs: number) {
  const n = Math.max(1, Math.round(pairs));
  return {
    pairs: n,
    monomers: 2 * n,
    esterBonds: 2 * n - 1,
    water: 2 * n - 1,
    acidEnds: 1,
    alcoholEnds: 1,
  };
}
export function esterLink(p: number) {
  const acidO = { x: mix(140, 130, p), y: mix(75, 180, p) };
  const turn = ((-142 * Math.PI) / 180) * p;
  return {
    carbon: { x: 80, y: 75 },
    carbonyl: { x: 80, y: 30 },
    acidO,
    acidH: { x: acidO.x + 32 * Math.cos(turn), y: acidO.y + 32 * Math.sin(turn) },
    alcoholO: { x: mix(230, 150, p), y: 75 },
    alcoholH: { x: mix(203, 153, p), y: mix(75, 160, p) },
    alcoholR: { x: mix(285, 225, p), y: 75 },
  };
}
export const resinRings = Array.from({ length: 6 }, (_, i) => ({
  id: `phenol-${i}`,
  x: 55 + (i % 3) * 110,
  y: i < 3 ? 65 : 195,
  rotation: i < 3 ? 0 : Math.PI,
}));
export function ringVertex(r: number, v: number): Point {
  const a = -Math.PI / 2 + (v * Math.PI) / 3 + resinRings[r].rotation;
  return { x: resinRings[r].x + 21 * Math.cos(a), y: resinRings[r].y + 21 * Math.sin(a) };
}
export const resinEdges = [
  { a: 0, av: 1, b: 1, bv: 5, cross: false },
  { a: 1, av: 1, b: 2, bv: 5, cross: false },
  { a: 3, av: 5, b: 4, bv: 1, cross: false },
  { a: 4, av: 5, b: 5, bv: 1, cross: false },
  { a: 0, av: 3, b: 3, bv: 3, cross: true },
  { a: 1, av: 3, b: 4, bv: 3, cross: true },
  { a: 2, av: 3, b: 5, bv: 3, cross: true },
];
export function resinState(base: boolean, excess: boolean, curing: number) {
  return {
    network: base && excess && curing > 0,
    crosslink: base && excess ? clamp(curing) : 0,
    linear: clamp(curing * 2),
  };
}
export function absorb(
  dry: number,
  water: number,
  capacity: number,
  uptake: number,
  drain: number,
  tare = 43,
) {
  dry = Math.max(0.01, dry);
  water = Math.max(0, water);
  const bound = Math.min(water, dry * Math.max(0, capacity)) * clamp(uptake),
    free = water - bound,
    drained = free * clamp(drain),
    residual = free - drained,
    wet = dry + bound;
  return {
    dry,
    water,
    bound,
    free,
    drained,
    residual,
    wet,
    tare,
    gross: tare + wet + residual,
    ratio: bound / dry,
    apparentRatio: (bound + residual) / dry,
  };
}
/** Connected graph expands continuously; spacing is illustrative, not a molecular length scale. */
export function gelNodes(swelling: number) {
  const scale = 1 + 0.55 * clamp(swelling);
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: 160 + ((i % 6) - 2.5) * 32 * scale,
    y: 135 + (Math.floor(i / 6) - 1.5) * 32 * scale,
  }));
}
export const gelLinks = Array.from({ length: 24 }, (_, i) => (i % 6 < 5 ? [i, i + 1] : null))
  .filter((v): v is number[] => !!v)
  .concat([
    [1, 7],
    [10, 16],
    [14, 20],
    [4, 10],
  ]);
export function decantGeometry(drain: number) {
  const angle = -25 * Math.sin(Math.PI * clamp(drain)),
    a = (angle * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return {
    angle,
    lip: { x: 100 + (55 - 100) * c - (40 - 140) * s, y: 140 + (55 - 100) * s + (40 - 140) * c },
    stream: Math.sin(Math.PI * clamp(drain)),
  };
}
