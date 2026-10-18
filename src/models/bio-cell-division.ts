export type MitoticPhase =
  'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase' | 'daughter';
const clamp = (v: number) => Math.min(1, Math.max(0, v));
export function mitoticState(progress: number) {
  const p = Math.max(0, Math.min(5.999, progress)),
    phase = (['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase', 'daughter'] as const)[
      Math.floor(p)
    ],
    alignment = clamp((p - 1) / 1.5),
    separation = clamp(p - 3),
    division = clamp(p - 4),
    replication = clamp(p);
  const chromatids = Array.from({ length: 8 }, (_, id) => {
    const chromosome = Math.floor(id / 2),
      sister = id % 2,
      side = sister === 0 ? -1 : 1,
      x0 = 145 + (chromosome % 2) * 80,
      y0 = 85 + Math.floor(chromosome / 2) * 70,
      cx = x0 + (185 - x0) * alignment + side * (2 + 68 * separation),
      cy = y0 + (65 + chromosome * 36 - y0) * alignment;
    return {
      id,
      chromosome,
      sister,
      x: cx,
      y: cy,
      color: ['#9d7898', '#7c87a9', '#b28b73', '#8c9f73'][chromosome],
      armOffset: side * 8 * (1 - 2 * separation),
      visible: sister === 0 ? 1 : replication,
    };
  });
  return {
    phase,
    alignment,
    separation,
    division,
    replication,
    chromatids,
    chromosomesPerCell: p < 3 ? 4 : p < 5 ? 8 : 4,
    dnaPerDaughter: 4,
    dnaInWholeSystem: 4 + 4 * replication,
  };
}
export function cubeExchange(edge: number, depth = 0.5) {
  const l = Math.max(0.001, edge),
    d = Math.max(0, Math.min(depth, l / 2)),
    volume = l ** 3,
    area = 6 * l * l,
    core = (l - 2 * d) ** 3;
  return {
    edge: l,
    depth: d,
    volume,
    area,
    areaPerVolume: area / volume,
    penetrated: volume - core,
    fraction: (volume - core) / volume,
  };
}
export const fixedStages: MitoticPhase[] = Array.from({ length: 50 }, (_, id) =>
  id < 34
    ? 'interphase'
    : id < 40
      ? 'prophase'
      : id < 44
        ? 'metaphase'
        : id < 47
          ? 'anaphase'
          : 'telophase',
);
export function fixedRootField(field = 0) {
  return Array.from({ length: 50 }, (_, id) => ({
    id: id + field * 50,
    stage: fixedStages[(id * 17 + field * 7) % 50],
    x: 20 + (id % 10) * 32,
    y: 20 + Math.floor(id / 10) * 38,
  }));
}
export function stageCounts(field = 0) {
  return fixedRootField(field).reduce(
    (a, c) => {
      a[c.stage]++;
      return a;
    },
    { interphase: 0, prophase: 0, metaphase: 0, anaphase: 0, telophase: 0, daughter: 0 },
  );
}
