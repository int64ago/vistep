import { signalPathPoint } from './bio-chemical-signals';
export const cultureClamp = (n: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(n) ? n : a));
export function plateGeometry(w: number) {
  return { cx: w / 2, cy: 149, r: Math.min(88, w * 0.36) };
}
export function streakPaths(w: number) {
  const g = plateGeometry(w);
  return Array.from({ length: 5 }, (_, z) => {
    const points = Array.from({ length: 10 }, (_, i) => {
      const angle = ((-130 + z * 65 + (i % 2 ? 42 : 0)) * Math.PI) / 180,
        r = g.r * (0.78 - i * 0.035);
      return { x: g.cx + r * Math.cos(angle), y: g.cy + r * Math.sin(angle) };
    });
    return z ? points : points;
  });
}
export function streakState(progress: number, w: number, sterile = true) {
  const p = cultureClamp(progress),
    paths = streakPaths(w),
    zone = Math.min(4, Math.floor(p * 5)),
    q = p === 1 ? 1 : p * 5 - zone,
    g = plateGeometry(w),
    flame = { x: 25, y: 253 },
    cool = { x: g.cx, y: 40 };
  const previous = zone ? paths[zone - 1].at(-1)! : { x: w - 23, y: 255 },
    route = [previous, flame, cool, previous, ...paths[zone]];
  let loop;
  if (q < 0.12) loop = signalPathPoint([previous, flame], q / 0.12);
  else if (q < 0.22) loop = flame;
  else if (q < 0.38) loop = signalPathPoint([flame, cool], (q - 0.22) / 0.16);
  else if (q < 0.5) loop = signalPathPoint([cool, previous], (q - 0.38) / 0.12);
  else if (zone === 0 && q < 0.6) loop = signalPathPoint([previous, paths[0][0]], (q - 0.5) / 0.1);
  else
    loop =
      zone === 0
        ? signalPathPoint(paths[0], (q - 0.6) / 0.4)
        : signalPathPoint([previous, ...paths[zone]], (q - 0.5) / 0.5);
  const counts = sterile ? [64, 24, 9, 4, 2] : [64, 64, 64, 64, 64];
  const seeds = paths.flatMap((points, z) =>
    Array.from({ length: counts[z] }, (_, i) => {
      const t = (i + 0.5) / counts[z],
        point = signalPathPoint(z ? [paths[z - 1].at(-1)!, ...points] : points, t);
      return {
        id: `${z}-${i}`,
        zone: z,
        t,
        ...point,
        visible:
          z < zone ||
          (z === zone &&
            q >= (z === 0 ? 0.6 : 0.5) &&
            t <= (q - (z === 0 ? 0.6 : 0.5)) / (z === 0 ? 0.4 : 0.5)),
      };
    }),
  );
  return {
    paths,
    seeds,
    loop,
    zone,
    q,
    hot: sterile && q >= 0.12 && q < 0.25,
    cooling: sterile && q >= 0.25 && q < 0.38,
    depositing: q >= (zone === 0 ? 0.6 : 0.5),
    sterile,
    route,
  };
}
export function pureCulture(
  progress: number,
  w: number,
  sterile = true,
  blank = false,
  contaminated = false,
) {
  const s = streakState(1, w, sterile);
  return blank
    ? contaminated
      ? [{ id: 'blank-contaminant', x: w / 2 + 12, y: 145, r: 2 + 3 * cultureClamp(progress) }]
      : []
    : s.seeds.map((a) => ({ ...a, r: 0.6 + 2.4 * cultureClamp(progress) }));
}
export function dilutionTransfer(progress: number, initialExponent = 1) {
  const p = cultureClamp(progress),
    removed = cultureClamp(p / 0.3),
    delivered = cultureClamp((p - 0.7) / 0.3),
    stockGPerMl = 10 ** -initialExponent;
  return {
    sourceMl: 10 - removed,
    pipetteMl: removed - delivered,
    receiverMl: 9 + delivered,
    sourceG: (10 - removed) * stockGPerMl,
    pipetteG: (removed - delivered) * stockGPerMl,
    receiverG: delivered * stockGPerMl,
    finalGPerMl: stockGPerMl / 10,
  };
}
export function cfuEstimate(counts: string[], exponent: number, platedMl = 0.1) {
  if (
    counts.length < 3 ||
    counts.some((x) => x.trim() === '' || !Number.isInteger(+x) || +x < 0) ||
    platedMl <= 0
  )
    return null;
  const values = counts.map(Number),
    acceptable = values.every((x) => x >= 30 && x <= 300),
    mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    mean,
    acceptable,
    cfuPerGram: mean / (platedMl * 10 ** -exponent),
    unitMass: platedMl * 10 ** -exponent,
  };
}
export function colonySites(count: number, w: number) {
  const g = plateGeometry(w),
    n = Math.round(cultureClamp(count, 0, 400));
  return Array.from({ length: n }, (_, i) => {
    const theta = i * 2.399963229728653,
      r = (g.r - 9) * Math.sqrt((i + 0.5) / n);
    return { id: i, x: g.cx + r * Math.cos(theta), y: g.cy + r * Math.sin(theta) };
  });
}
export const screeningWells = Array.from({ length: 24 }, (_, i) => {
  const id = `${'ABCD'[Math.floor(i / 6)]}${(i % 6) + 1}`,
    base = 0.45 + ((i * 7) % 13) * 0.065,
    initial = id === 'A4' ? 2.1 : id === 'B3' ? 3.4 : id === 'D5' ? 1.9 : base,
    retest =
      id === 'A4'
        ? [1.9, 2, 2.1]
        : id === 'B3'
          ? [0.8, 0.9, 0.7]
          : id === 'D5'
            ? [1.8, 2, 1.9]
            : [base * 0.92, base, base * 1.08];
  return {
    id,
    initial,
    biomass: id === 'B3' ? 3 : id === 'A4' ? 0.8 : 0.5 + ((i * 3) % 7) * 0.3,
    retest,
    mean: retest.reduce((a, b) => a + b, 0) / 3,
  };
});
export function screeningRank(retest = false, perBiomass = false) {
  return [...screeningWells].sort(
    (a, b) =>
      (retest ? b.mean : b.initial) / (perBiomass ? b.biomass : 1) -
      (retest ? a.mean : a.initial) / (perBiomass ? a.biomass : 1),
  );
}
export function samplingUnits(
  kind: 'air' | 'water' | 'milk' | 'soil',
  count: number,
  volume: number,
  dilution = 1,
  active = true,
) {
  if (volume <= 0 || count < 0) return null;
  if (kind === 'air')
    return active
      ? { value: count / (volume / 1000), unit: 'CFU/m³' }
      : { value: count, unit: 'CFU/plate/time' };
  return { value: (count * dilution) / volume, unit: kind === 'soil' ? 'CFU/g' : 'CFU/mL' };
}
