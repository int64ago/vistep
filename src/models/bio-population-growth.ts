/** Population models and a spatial counting-chamber exercise. None of the synthetic
 * observations below are claimed to be textbook raw experimental records. */
export const growthClamp = (n: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export function binaryPopulation(minutes: number, initial = 1, generationMinutes = 20) {
  const generations = Math.floor(
    growthClamp(minutes, 0, 4320) / growthClamp(generationMinutes, 1, 120),
  );
  return { generations, population: growthClamp(initial, 0, 1e9) * 2 ** generations };
}
export function logisticPopulation(days: number, initial = 5, carryingCapacity = 375, rate = 1.8) {
  const n = growthClamp(initial, 0, 1e6),
    k = growthClamp(carryingCapacity, 1, 1e6),
    r = growthClamp(rate, 0, 10),
    t = growthClamp(days, 0, 100);
  const value = n === 0 ? 0 : k / (1 + (k / n - 1) * Math.exp(-r * t));
  return { value, slope: r * value * (1 - value / k), capacity: k };
}
export const chamber = { sideMm: 0.2, depthMm: 0.1, cultureMl: 10 } as const;
export function chamberConcentration(
  count: number | null,
  dilution = 10,
  areaMm2 = 0.04,
  depthMm = 0.1,
) {
  if (
    count === null ||
    !Number.isFinite(count) ||
    count < 0 ||
    dilution < 1 ||
    !Number.isFinite(dilution) ||
    areaMm2 <= 0 ||
    depthMm <= 0 ||
    !Number.isFinite(areaMm2 * depthMm)
  )
    return null;
  const volumeMl = (areaMm2 * depthMm) / 1000;
  return {
    volumeMl,
    cellsPerMl: (count * dilution) / volumeMl,
    cultureCells: ((count * dilution) / volumeMl) * chamber.cultureMl,
  };
}
// Fixed illustrative observations, independent of the logistic model. Day zero included.
export const yeastExampleCounts = [4, 7, 15, 28, 35, 33, 22, 14];
export function yeastCount(day: number, replicate = 0) {
  return (
    yeastExampleCounts[Math.round(growthClamp(day, 0, 7))] +
    [-1, 0, 1][Math.round(growthClamp(replicate, 0, 2))]
  );
}
export type YeastCell = { id: number; x: number; y: number };
export const inCountingSquare = (c: YeastCell) => c.x >= 0 && c.x < 1 && c.y >= 0 && c.y < 1;
export function yeastCells(day: number, replicate = 0): YeastCell[] {
  const n = yeastCount(day, replicate);
  // Cell centers specify the boundary convention. All interior cells have fixed distinct slots.
  const cells = Array.from({ length: n - 2 }, (_, id) => ({
    id,
    x: 0.09 + (id % 6) * 0.155,
    y: 0.09 + Math.floor(id / 6) * 0.155,
  }));
  return [
    ...cells,
    { id: 101, x: 0, y: 0.34 },
    { id: 102, x: 0.34, y: 0 },
    { id: 103, x: 1, y: 0.67 },
    { id: 104, x: 0.67, y: 1 },
  ];
}
export function flaskCells(mix: number) {
  const p = growthClamp(mix);
  return Array.from({ length: 32 }, (_, id) => {
    const targetY = 158 + (id % 8) * 9,
      targetX = ((((id * 13) % 31) - 15) * (targetY - 90)) / 70;
    const startX = -42 + (id % 16) * 5.6,
      startY = 225 + Math.floor(id / 16) * 7;
    return { id, x: startX + (targetX - startX) * p, y: startY + (targetY - startY) * p };
  });
}
export function chamberFill(progress: number) {
  return growthClamp((progress - 0.25) / 0.55);
}
export const canopyClosure = [0, 0.2, 0.4, 0.6, 0.8, 1];
export const canopyEvidence = [
  {
    zh: '一年蓬',
    en: 'Annual fleabane',
    values: [15.3, 13.5, 10.8, 7.4, 4.3, 2.4],
    color: '#738d68',
  },
  {
    zh: '加拿大一枝黄花',
    en: 'Canada goldenrod',
    values: [10.4, 9.5, 6.1, 5.6, 3, 1.2],
    color: '#b49a57',
  },
  { zh: '刺儿菜', en: 'Creeping thistle', values: [3.7, 4.3, 8.5, 4.4, 2.2, 1], color: '#a17f9b' },
];
export function recordedMeans(records: (number | null)[][]) {
  return records.map((row) => {
    const valid = row.filter((n): n is number => n !== null && Number.isFinite(n) && n >= 0);
    return {
      n: valid.length,
      mean: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null,
    };
  });
}
