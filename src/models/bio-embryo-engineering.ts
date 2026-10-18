export const embryoClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export function fertilizationFrame(progress: number, mature = true, capacitated = true) {
  const p = embryoClamp(progress),
    ready = mature && capacitated;
  // The observed route has a zona passage before the membrane contact and fusion.
  const x = ready
    ? p < 0.36
      ? 92 - ((92 - 60) * p) / 0.36
      : p < 0.5
        ? 60
        : 60 - 40 * embryoClamp((p - 0.5) / 0.28)
    : 92 - 2 * p;
  return {
    x,
    y: 0,
    ready,
    zonaPassage: ready && p > 0.01 && p < 0.58,
    membranePore: ready && p >= 0.36 && p < 0.72,
    fused: ready && p >= 0.5,
    pronuclei: ready ? embryoClamp((p - 0.65) / 0.2) : 0,
    polarBody: ready ? embryoClamp((p - 0.55) / 0.18) : 0,
    spermNucleus: { x, y: 0 },
    femaleNucleus: { x: -20, y: 0 },
    secondX: 90 - 3 * embryoClamp(p * 1.4),
  };
}
export const cleavageState = (p: number) => {
  const k = Math.min(3, Math.floor(embryoClamp(p) * 4));
  return { count: 2 ** k, stage: k, relativeTotalVolume: 1, relativeCellVolume: 1 / 2 ** k };
};
export const embryoBatch = [
  { id: 'E1', quality: 'suitable' },
  { id: 'E2', quality: 'degenerate' },
  { id: 'E3', quality: 'suitable' },
  { id: 'E4', quality: 'unfertilized' },
  { id: 'E5', quality: 'suitable' },
  { id: 'E6', quality: 'suitable' },
] as const;
export function cycleMatch(embryoDay = 7, recipientDay = 7) {
  const e = embryoClamp(embryoDay, 0, 14),
    r = embryoClamp(recipientDay, 0, 14);
  return { embryo: e, recipient: r, difference: r - e, exact: r === e };
}
export function transferPoint(t0: number, w: number) {
  const t = embryoClamp(t0),
    cx = w / 2;
  if (t < 0.35) return { x: cx, y: 284 - (64 * t) / 0.35 };
  if (t < 0.65) {
    const u = (t - 0.35) / 0.3;
    return { x: cx + 42 * u * u, y: (1 - u) ** 2 * 220 + 2 * (1 - u) * u * 195 + u * u * 173 };
  }
  const u = (t - 0.65) / 0.35;
  return {
    x: (1 - u) ** 2 * (cx + 42) + 2 * (1 - u) * u * (cx + 73) + u * u * (cx + 60),
    y: (1 - u) ** 2 * 173 + 2 * (1 - u) * u * 145 + u * u * 120,
  };
}
export function transferFrame(p0: number, w: number) {
  const p = embryoClamp(p0),
    tipT = 0.12 + 0.8 * embryoClamp(p / 0.55),
    embryoT = p < 0.55 ? Math.max(0, tipT - 0.1) : 0.82 + 0.18 * embryoClamp((p - 0.55) / 0.45);
  return {
    tipT,
    embryoT,
    tip: transferPoint(tipT, w),
    embryo: transferPoint(embryoT, w),
    released: embryoT > tipT,
  };
}
export function transferPath(t: number, w: number) {
  const points = Array.from({ length: 101 }, (_, i) => transferPoint((t * i) / 100, w));
  return points.map((a, i) => `${i ? 'L' : 'M'}${a.x} ${a.y}`).join(' ');
}
export const blastocystCells = () => [
  ...Array.from({ length: 32 }, (_, i) => {
    const a = ((i + 0.5) * Math.PI * 2) / 32;
    return { id: `TE-${i}`, type: 'TE' as const, x: 47 * Math.cos(a), y: 47 * Math.sin(a), r: 3 };
  }),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `ICM-${i}`,
    type: 'ICM' as const,
    x: -32 + (i % 2) * 13,
    y: -24 + Math.floor(i / 2) * 16,
    r: 5.3,
  })),
];
export function embryoSplit(progress: number, cutHeight = 0) {
  const p = embryoClamp(progress),
    cut = embryoClamp(cutHeight, -40, 40),
    reach = Math.sqrt(55 ** 2 - cut ** 2),
    bladeX = -82 + 164 * embryoClamp(p / 0.55),
    separation = 21 * embryoClamp((p - 0.55) / 0.45),
    cells = blastocystCells().map((a) => ({
      ...a,
      half: a.y < cut ? 0 : 1,
      y: a.y + (a.y < cut ? -separation : separation),
    }));
  const counts = [0, 1].map((half) => ({
    icm: cells.filter((a) => a.half === half && a.type === 'ICM').length,
    te: cells.filter((a) => a.half === half && a.type === 'TE').length,
  }));
  return {
    cut,
    reach,
    bladeX,
    separation,
    cells,
    counts,
    hasBoth: counts.every((a) => a.icm > 0 && a.te > 0),
    balanced: counts[0].icm === counts[1].icm,
  };
}
