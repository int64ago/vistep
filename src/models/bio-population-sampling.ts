import { signalPathPoint } from './bio-chemical-signals';
export const surveyClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export function surveyRandom(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
export function sampleIds(total: number, count: number, seed: number) {
  const ids = Array.from({ length: total }, (_, i) => i),
    rnd = surveyRandom(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, Math.max(0, Math.min(total, Math.floor(count))));
}
export function markRecaptureEstimate(marked: number, caught: number, recaught: number) {
  const m = Math.max(0, marked),
    c = Math.max(0, caught),
    r = Math.max(0, recaught);
  return r > 0 && r <= m && r <= c ? (m * c) / r : null;
}
export function captureSample(seed = 26, tagLoss = 0) {
  const first = sampleIds(48, 16, 11),
    second = sampleIds(48, 12, seed),
    lost = new Set(first.slice(0, Math.round(16 * surveyClamp(tagLoss))));
  const recognized = second.filter((id) => first.includes(id) && !lost.has(id));
  return {
    first,
    second,
    lost,
    recognized,
    marked: 16,
    caught: 12,
    recaught: recognized.length,
    estimate: markRecaptureEstimate(16, 12, recognized.length),
    truePopulation: 48,
  };
}
export function animalLocations(id: number, mixed = false) {
  // Avalanche each coordinate seed: consecutive identities must not form LCG diagonal bands.
  const hash = (n: number) => {
    let v = n >>> 0;
    v = Math.imul(v ^ (v >>> 16), 0x21f0aaad);
    v = Math.imul(v ^ (v >>> 15), 0x735a2d97);
    return ((v ^ (v >>> 15)) >>> 0) / 4294967296;
  };
  const base = 500 + id * 77 + (mixed ? 7777 : 0);
  return { x: 0.06 + 0.88 * hash(base), y: 0.08 + 0.84 * hash(base + 0x9e3779b9) };
}
export type SurveyPlant = { id: number; x: number; y: number; target: boolean };
export function surveyMeadow(): SurveyPlant[] {
  const rnd = surveyRandom(761);
  const plants = Array.from({ length: 116 }, (_, id) => ({
    id,
    x: id < 64 ? 0.25 + 3.8 * rnd() : 0.1 + 9.8 * rnd(),
    y: 0.1 + 9.8 * rnd(),
    target: id < 76,
  }));
  return [
    ...plants,
    ...[
      { x: 2, y: 2 },
      { x: 2, y: 2.5 },
      { x: 3, y: 2.5 },
      { x: 2.5, y: 3 },
    ].map((q, i) => ({ ...q, id: 116 + i, target: true })),
  ];
}
export type Quadrat = { id: number; x: number; y: number; size: number };
export function countQuadrat(plants: SurveyPlant[], q: Quadrat) {
  return plants.filter(
    (p) => p.target && p.x >= q.x && p.x < q.x + q.size && p.y >= q.y && p.y < q.y + q.size,
  );
}
export function selectQuadrats(count = 8, seed = 17, biased = false) {
  const grid = Array.from({ length: 100 }, (_, id) => ({
    id,
    x: id % 10,
    y: Math.floor(id / 10),
    size: 1,
  }));
  const order = biased
    ? grid
        .slice()
        .sort(
          (a, b) => countQuadrat(surveyMeadow(), b).length - countQuadrat(surveyMeadow(), a).length,
        )
        .map((q) => q.id)
    : sampleIds(100, 100, seed);
  return order.slice(0, Math.round(surveyClamp(count, 1, 20))).map((i) => grid[i]);
}
export function quadratEstimate(plots: Quadrat[], plants = surveyMeadow()) {
  const rows = plots.map((q) => ({
      quadrat: q,
      count: countQuadrat(plants, q).length,
      area: q.size * q.size,
    })),
    area = rows.reduce((a, r) => a + r.area, 0),
    count = rows.reduce((a, r) => a + r.count, 0);
  return {
    rows,
    area,
    count,
    density: area ? count / area : null,
    trueDensity: plants.filter((p) => p.target).length / 100,
  };
}
/** Illustrative detection process; catch changes without changing the underlying insects. */
export function lightTrapState(progress: number, weather = 1, on = true) {
  const p = surveyClamp(progress),
    effort = surveyClamp(weather, 0.05, 1);
  return Array.from({ length: 24 }, (_, id) => {
    const rnd = surveyRandom(1003 + id * 73),
      strength = id < 12 ? 0.95 : 0.15,
      arrival = 0.15 + (rnd() * 0.45) / (strength * effort),
      phase = on ? surveyClamp((p - arrival) / 0.24) : 0;
    return {
      id,
      stronglyAttracted: id < 12,
      phase,
      caught: phase === 1,
      start: { x: 0.04 + rnd() * 0.92, y: 0.08 + rnd() * 0.54 },
    };
  });
}
export const wildlifeRecords = [
  { record: '01', identity: 'A' },
  { record: '02', identity: 'B' },
  { record: '03', identity: 'A' },
  { record: '04', identity: 'C' },
  { record: '05', identity: 'B' },
  { record: '06', identity: null },
] as const;
export const wildlifeAlleles = {
  A: [
    [118, 122],
    [164, 170],
    [208, 208],
  ],
  B: [
    [118, 126],
    [164, 174],
    [204, 208],
  ],
  C: [
    [120, 126],
    [168, 174],
    [204, 212],
  ],
} as const;
export function wildlifePattern(identity: 'A' | 'B' | 'C') {
  const offset = { A: 0, B: 2, C: 4 }[identity];
  return Array.from({ length: 8 }, (_, i) => ({
    x: -25 + (i % 4) * 15 + (i % 2 ? 3 : 0),
    y: -8 + Math.floor(i / 4) * 16,
    r: 2 + ((i + offset) % 3) * 2,
  }));
}
export function acousticSignature(identity: 'A' | 'B' | 'C', t: number) {
  const [f, rate] = { A: [5, 2], B: [8, 3], C: [6, 5] }[identity];
  const envelope =
    Math.exp(-(((t - 0.3) / 0.15) ** 2)) + 0.7 * Math.exp(-(((t - 0.7) / 0.12) ** 2));
  return Math.sin(2 * Math.PI * (f * t + rate * t * t)) * envelope;
}
export function wildlifeEvidenceDistance(a: 'A' | 'B' | 'C', b: 'A' | 'B' | 'C', method = 1) {
  if (method === 0)
    return wildlifePattern(a).reduce(
      (sum, p, i) => sum + Math.abs(p.r - wildlifePattern(b)[i].r),
      0,
    );
  if (method === 1)
    return wildlifeAlleles[a].reduce(
      (sum, p, i) =>
        sum + Math.abs(p[0] - wildlifeAlleles[b][i][0]) + Math.abs(p[1] - wildlifeAlleles[b][i][1]),
      0,
    );
  return (
    Array.from(
      { length: 141 },
      (_, i) => (acousticSignature(a, i / 140) - acousticSignature(b, i / 140)) ** 2,
    ).reduce((a, b) => a + b, 0) / 141
  );
}
export function matchWildlife(a: 'A' | 'B' | 'C', b: 'A' | 'B' | 'C', quality = true, method = 1) {
  return quality
    ? wildlifeEvidenceDistance(a, b, method) < 1e-9
      ? 'same'
      : 'different'
    : 'unresolved';
}
export function observedIndividuals() {
  return new Set(wildlifeRecords.flatMap((r) => (r.identity ? [r.identity] : []))).size;
}

export function lightTrapPosition(
  phase: number,
  start: { x: number; y: number },
  center: number,
  id: number,
) {
  const q = surveyClamp(phase);
  const position =
    q < 0.45
      ? signalPathPoint([start, { x: center + (id % 2 ? 10 : -10), y: 146 }], q / 0.45)
      : signalPathPoint(
          [
            { x: center + (id % 2 ? 10 : -10), y: 146 },
            { x: center + (id % 2 ? 10 : -10), y: 178 },
            { x: center, y: 219 },
            { x: center, y: 238 },
            { x: center - 15 + (id % 4) * 10, y: 255 + Math.floor(id / 4) * 4 },
          ],
          (q - 0.45) / 0.55,
        );
  return { ...position, wingHalfSpan: 7 - 5 * surveyClamp((q - 0.55) / 0.18) };
}
