/** Independent explanatory models. None of the teaching parameters is fitted historical data. */
export const membraneClamp = (x: number) => Math.max(0, Math.min(1, x));
export const membraneRamp = (x: number, a: number, b: number) => membraneClamp((x - a) / (b - a));
export const membraneEase = (x: number) => {
  const p = membraneClamp(x);
  return p * p * (3 - 2 * p);
};
export const membraneChapters = [
  'permeability',
  'monolayer',
  'tension',
  'em',
  'fusion',
  'mosaic',
  'build',
] as const;
export type MembraneChapter = (typeof membraneChapters)[number];
/** Measured shared chapter windows; explanatory motion is synchronized, never the speech. */
export const membraneDurations = [28.5, 40, 26.5, 28, 34.5, 35.5, 32];
export const membraneCueCuts = {
  zh: [
    [9.0, 16.4, 21.9],
    [8.3, 12.3, 21.5, 25.9, 30.5],
    [4.2, 13.7, 19.1],
    [11.7, 17.5, 23.7],
    [6.8, 12.3, 31.1],
    [7.5, 11.6, 17.8, 28.5],
    [5.1, 10.4, 14.3, 21.2],
  ],
  en: [
    [8.5, 17.4, 22.8],
    [9.0, 14.6, 24.5, 28.4, 33.2],
    [3.1, 12.4, 16.2],
    [10.0, 15.3, 22.35],
    [6.0, 12.0, 30.8],
    [7.3, 9.6, 17.2, 27.4],
    [3.4, 8.5, 12.9, 20.85],
  ],
} as const;
/** Original teaching-motion ranges, distinct from seconds on the measured media clock. */
const membraneMotionRanges = [
  [
    [0, 5.7],
    [5.7, 15.1],
    [15.1, 21.3],
    [21.3, 26],
  ],
  [
    [0, 5],
    [5, 9.5],
    [9.5, 18.2],
    [18.2, 29.6],
    [29.6, 34.2],
    [34.2, 38],
  ],
  [
    [0, 5],
    [5, 15],
    [15, 20.5],
    [20.5, 25],
  ],
  // Both recordings discuss blur before the historical chemical interpretation.
  [
    [0, 7.3],
    [13, 18],
    [7.3, 12.9],
    [20.3, 26],
  ],
  [
    [0, 7.8],
    [7.8, 14.6],
    [14.6, 27.2],
    [27.2, 34],
  ],
  [
    [0, 4.4],
    [4.4, 8.8],
    [8.8, 19],
    [19, 26.5],
    [26.5, 34],
  ],
  // Inspect water-facing heads, then show the same pieces wrongly oriented.
  [
    [0, 8.7],
    [8.7, 15],
    [0, 8.7],
    [17.1, 24.8],
    [24.8, 31],
  ],
] as const;
export function membraneDirector(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const time = Math.max(0, seconds),
    cuts = membraneCueCuts[locale][chapter] ?? [],
    phase = cuts.filter((t) => time >= t).length,
    boundaries = [0, ...cuts, membraneDurations[chapter] ?? 1],
    local = membraneRamp(time, boundaries[phase], boundaries[phase + 1]),
    range = membraneMotionRanges[chapter]?.[phase] ?? [0, 0],
    sceneTime = range[0] + (range[1] - range[0]) * local,
    shot = chapter === 3 ? [0, 2, 1, 3][phase] : chapter === 6 ? [0, 1, 0, 2, 3][phase] : phase,
    buildCuts = membraneCueCuts[locale][6],
    buildFlip =
      1 -
      membraneEase(membraneRamp(time, buildCuts[0], buildCuts[0] + 1.5)) +
      membraneEase(membraneRamp(time, buildCuts[1], buildCuts[1] + 1.3));
  return {
    time,
    sceneTime,
    shot,
    buildFlip,
    progress: membraneClamp(time / (membraneDurations[chapter] ?? 1)),
  };
}
/** Equal finite aqueous volumes, negligible membrane inventory; P = D K / h. */
export function passivePartitionBarrier(
  time: number,
  K: number,
  D = 0.025,
  h = 1,
  area = 1,
  volume = 1,
) {
  const permeability = (Math.max(0, D) * Math.max(0, K)) / Math.max(1e-8, h);
  const rate = (permeability * Math.max(0, area)) / Math.max(1e-8, volume);
  const inside = 0.5 * (1 - Math.exp(-2 * rate * Math.max(0, time))),
    outside = 1 - inside;
  return {
    K,
    permeability,
    inside,
    outside,
    forward: permeability * area * outside,
    reverse: permeability * area * inside,
    net: permeability * area * (outside - inside),
    membraneAffinity: Math.max(0, K) / (1 + Math.max(0, K)),
  };
}
/** A representative conditional crossing path, not a measured trajectory or a transport rate. */
export function partitionCrossing(progress: number, reverse = false) {
  const p = membraneEase(progress);
  return { x: reverse ? 282 - 204 * p : 78 + 204 * p, y: reverse ? 154 : 94 };
}
/** Original Table I human observations are independent of every candidate parameter. */
export const areaObservations = Object.freeze([
  Object.freeze({ sample: 18, cellArea: 0.47, spreadArea: 0.92, unit: 'm²' }),
  Object.freeze({ sample: 19, cellArea: 0.47, spreadArea: 0.89, unit: 'm²' }),
]);
export function areaHypothesis(
  layers: 1 | 2,
  extraction = 1,
  footprintRatio = 1,
  areaEstimateFactor = 1,
) {
  const A = areaObservations[0].cellArea;
  return {
    observedA: A,
    observedB: areaObservations[0].spreadArea,
    observedRatio: areaObservations[0].spreadArea / A,
    predictedArea:
      (layers * A * membraneClamp(extraction) * Math.max(0, footprintRatio)) /
      Math.max(1e-8, areaEstimateFactor),
    predictedRatio:
      (layers * membraneClamp(extraction) * Math.max(0, footprintRatio)) /
      Math.max(1e-8, areaEstimateFactor),
  };
}
export interface LipidGeometry {
  id: number;
  x: number;
  y: number;
  angle: number;
  head: { x: number; y: number };
  tails: { x: number; y: number }[];
  tailLength: number;
}
function lipid(id: number, x: number, y: number, angle: number, length = 21): LipidGeometry {
  const r = (angle * Math.PI) / 180;
  return {
    id,
    x,
    y,
    angle,
    head: { x, y },
    tails: [-2.2, 2.2].map((dx) => ({
      x: x + dx * Math.cos(r) - length * Math.sin(r),
      y: y + dx * Math.sin(r) + length * Math.cos(r),
    })),
    tailLength: length,
  };
}
/** Forty identities: one row of forty to two rows of twenty. Rotation preserves each tail. */
export function foldingLipids(fold: number) {
  const p = membraneEase(fold);
  return Array.from({ length: 40 }, (_, id) => {
    const row = id < 20 ? 0 : 1,
      index = id % 20;
    return lipid(
      id,
      (24 + id * 8) * (1 - p) + (104 + index * 8) * p,
      140 * (1 - p) + (row ? 166 : 120) * p,
      row ? 180 : 180 * (1 - p),
    );
  });
}
/** Same-width rectangles have areas proportional to independently measured A and B. */
export function areaRectangle(area: number, width = 62, scale = 150 / 0.94) {
  return { width, height: Math.max(0, area) * scale, area: Math.max(0, area) * scale * width };
}
export function interfaceEvidence(coverage: number, radius = 1) {
  const gamma = 1 - 0.6 * membraneClamp(coverage),
    R = Math.max(0.001, radius);
  return {
    coverage: membraneClamp(coverage),
    gamma,
    radius: R,
    pressure: (2 * gamma) / R,
    pressureForce: ((2 * gamma) / R) * Math.PI * R * R,
    tensionForce: 2 * Math.PI * R * gamma,
  };
}
/** Two fixed contrast sources convolved with a normalized Gaussian, not chemical identities. */
export function electronContrast(x: number, sigma: number) {
  const s = Math.max(0.15, sigma),
    normal = 1 / (Math.sqrt(2 * Math.PI) * s);
  return (
    0.05 +
    0.7 * normal * (Math.exp(-0.5 * ((x - 2) / s) ** 2) + Math.exp(-0.5 * ((x + 2) / s) ** 2))
  );
}
export function contrastSamples(sigma: number, count = 161) {
  return Array.from({ length: count }, (_, i) => {
    const x = -8 + (16 * i) / (count - 1);
    return { x, intensity: electronContrast(x, sigma) };
  });
}
function random01(seed: number) {
  let x = seed | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 16;
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 16;
  return ((x >>> 0) + 0.5) / 4294967296;
}
function normal(id: number, step: number) {
  return (
    Math.sqrt(-2 * Math.log(random01(id * 1999 + step * 7127 + 37))) *
    Math.cos(2 * Math.PI * random01(id * 5519 + step * 104729 + 19))
  );
}
/** D is angular diffusivity, rad² per teaching-time unit. R only scales display geometry.
 * This one-dimensional closed-path model is NOT a projection of measured 2D surface tracks. */
export function membraneTracer(
  id: number,
  time: number,
  angularD = 0.18,
  anchored = false,
  count = 48,
  anchorAt = 0,
) {
  const base = ((id + 0.5) / count) * 2 * Math.PI,
    dt = 0.1,
    steps = Math.max(0, anchored ? Math.min(time, anchorAt) : time) / dt;
  let angle = base;
  for (let n = 0; n < Math.ceil(steps); n++)
    angle += normal(id, n) * Math.sqrt(2 * Math.max(0, angularD) * dt) * Math.min(1, steps - n);
  return {
    id,
    origin: id < count / 2 ? 'mouse' : 'human',
    angle,
    x: Math.cos(angle),
    y: Math.sin(angle),
    anchored,
  };
}
/** Representative distributions from distinct sampling times; identities are deliberately distinct. */
export function historicalSnapshot(minutes: 5 | 40, count = 32) {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((i + 0.5) * 2 * Math.PI) / count;
    return {
      id: `sample-${minutes}-${i}`,
      origin: minutes === 5 ? (i < count / 2 ? 'mouse' : 'human') : i % 2 ? 'mouse' : 'human',
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
  });
}
export function membraneGeometry(time = 0, flipped = 0, protein = true) {
  const lipids = Array.from({ length: 40 }, (_, id) => {
    const row = id < 20 ? 0 : 1,
      i = id % 20;
    const x = protein ? (i < 10 ? 15 + i * 13 : 228 + (i - 10) * 13) : 24 + i * 16;
    return lipid(
      id,
      x,
      row ? 166 : 120,
      (row ? 180 : 0) + (row ? -180 : 180) * membraneClamp(flipped),
    );
  });
  const exposedTails = lipids
    .flatMap((q) => q.tails)
    .filter((q) => q.y < 120 - 1e-6 || q.y > 166 + 1e-6).length;
  return {
    lipids,
    exposedTails,
    waterUpper: 120,
    waterLower: 166,
    protein: {
      x: 180,
      y: 143,
      halfWidth: 24,
      top: 94,
      bottom: 190,
      waistTop: 120,
      waistBottom: 166,
    },
    glycan: { x: 180, y: 94, endY: 60 },
    time,
  };
}
