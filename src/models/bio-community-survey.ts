import { signalPathPoint } from './bio-chemical-signals';
export const surveyClamp = (n: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export const wetlandBirds = [
  {
    zh: '绿翅鸭',
    en: 'Eurasian teal',
    count: 2120,
    habitat: [67, 0, 33],
    contents: [52.8, 16.7, 0, 12, 13, 0, 5.5],
  },
  {
    zh: '绿头鸭',
    en: 'Mallard',
    count: 1513,
    habitat: [98, 1, 1],
    contents: [78.3, 0.8, 0, 7.1, 5.6, 1.1, 7.1],
  },
  {
    zh: '鹤鹬',
    en: 'Spotted redshank',
    count: 1678,
    habitat: [64, 0, 36],
    contents: [0, 0, 50, 25, 25, 0, 0],
  },
  {
    zh: '青脚鹬',
    en: 'Common greenshank',
    count: 1517,
    habitat: [29, 28, 43],
    contents: [0, 0, 33.3, 33.3, 0, 33.3, 0.1],
  },
];
export function habitatBreadth(percent: number[]) {
  const p = percent.map((x) => Math.max(0, x) / 100);
  return 1 / p.reduce((sum, x) => sum + x * x, 0);
}
export const coreVolumeMl = (diameterCm = 5, depthCm = 5) =>
  Math.PI * (surveyClamp(diameterCm, 0, 30) / 2) ** 2 * surveyClamp(depthCm, 0, 30);
export function coreState(progress: number) {
  const p = surveyClamp(progress),
    insert = surveyClamp(p / 0.4),
    lift = surveyClamp((p - 0.5) / 0.4);
  return { top: 50 + 60 * insert - 75 * lift, insert, lift, volumeMl: coreVolumeMl() };
}
export type SoilGroup = 'mite' | 'springtail' | 'unknown';
export function soilIndividuals() {
  return Array.from({ length: 18 }, (_, id) => ({
    id,
    group: (id < 8 ? 'mite' : id < 14 ? 'springtail' : 'unknown') as SoilGroup,
    x: -24 + (id % 7) * 8,
    y: 115 + Math.floor(id / 7) * 10,
  }));
}
export function soilExtraction(progress: number, lamp = true) {
  const p = surveyClamp(progress);
  return soilIndividuals().map((c) => {
    const delay = c.group === 'unknown' ? 0.4 : c.group === 'mite' ? 0.12 : 0.02,
      q = lamp ? surveyClamp((p - delay - (c.id % 3) * 0.025) / 0.5) : 0;
    const opening = -24 + (c.id % 7) * 8;
    const path = [
      [c.x, c.y],
      [opening, 146],
      [opening, 156],
      [0, 218],
      [0, 249],
      [-12 + (c.id % 6) * 4.8, 280 + Math.floor(c.id / 6) * 5],
    ] as const;
    const point = signalPathPoint(
      path.map(([x, y]) => ({ x, y })),
      q,
    );
    return { ...c, ...point, phase: q, collected: q >= 1 };
  });
}
export function extractionCounts(progress: number, lamp = true) {
  const collected = soilExtraction(progress, lamp).filter((c) => c.collected);
  const counts = { mite: 0, springtail: 0, unknown: 0 };
  for (const c of collected) counts[c.group]++;
  return {
    counts,
    total: collected.length,
    groups: Object.values(counts).filter((n) => n > 0).length,
  };
}
export const aspiratorPath = [
  [-90, 246],
  [-90, 120],
  [-64, 87],
  [-35, 87],
  [-20, 110],
  [-20, 185],
  [-12, 229],
] as const;
export const aspiratorAirPath = [
  [-12, 219],
  [0, 183],
  [18, 145],
  [18, 100],
  [75, 70],
] as const;
export function aspiratorState(progress: number, pump = true) {
  const p = pump ? surveyClamp(progress) : 0;
  return {
    ...signalPathPoint(
      aspiratorPath.map(([x, y]) => ({ x, y })),
      p,
    ),
    collected: p >= 1,
    phase: p,
  };
}
export function successionState(progress: number, secondary = false, moisture = 0.85) {
  const t = surveyClamp(progress) * 180,
    w = surveyClamp(moisture),
    steps = Math.ceil(t / 0.1);
  let soil = secondary ? 0.65 : 0,
    pioneer = secondary ? 0.05 : 0,
    herb = secondary ? 0.08 : 0,
    shrub = 0,
    tree = 0;
  for (let i = 0; i < steps; i++) {
    const dt = Math.min(0.1, t - i * 0.1);
    const ds = (0.003 + 0.018 * pioneer + 0.009 * herb + 0.012 * shrub) * (1 - soil),
      dp = 0.05 * (1 - pioneer) * (1 - 0.7 * tree) - 0.01 * tree * pioneer,
      dh = 0.07 * soil * w * (1 - herb) - 0.04 * (shrub + tree) * herb,
      db = 0.04 * Math.max(0, soil - 0.2) * w * (1 - shrub) - 0.025 * tree * shrub,
      dtree = 0.04 * Math.max(0, soil - 0.45) * Math.max(0, (w - 0.5) * 2) * (1 - tree);
    soil += ds * dt;
    pioneer += dp * dt;
    herb += dh * dt;
    shrub += db * dt;
    tree += dtree * dt;
  }
  return {
    soil,
    pioneer,
    herb,
    shrub,
    tree,
    seedBank: secondary ? 0.8 : 0,
    secondary,
    moisture: w,
  };
}
export function groupedRecord(counts: (number | null)[]) {
  const recorded = counts.filter((n): n is number => n !== null && Number.isFinite(n) && n >= 0);
  return {
    recorded: recorded.length,
    total: recorded.reduce((a, b) => a + b, 0),
    groups: recorded.filter((n) => n > 0).length,
  };
}
