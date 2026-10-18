const unit = (x: number) => Math.max(0, Math.min(1, x));
/** 24 illustrative iron-bearing units; no food concentration or extraction yield is asserted. */
export function foodIron(recovery = 0.75, oxidation = 1, scn = 1, ironPresent = true) {
  const total = ironPresent ? 24 : 0,
    extracted = total * unit(recovery),
    residue = total - extracted,
    initialFerric = extracted * 0.25,
    oxidized = extracted * 0.75 * unit(oxidation),
    ferric = initialFerric + oxidized,
    ferrous = extracted - ferric,
    signal = (ferric / 24) * unit(scn);
  return { total, extracted, residue, initialFerric, oxidized, ferric, ferrous, signal };
}
export function foodIronDirector(chapter: number, progress: number) {
  const p = unit(progress);
  return {
    stage: Math.min(3, Math.max(0, chapter)),
    recovery: 0.75,
    oxidation: chapter < 2 ? 0 : chapter === 2 ? p : 1,
    scn: chapter === 3 ? p : 0,
    ironPresent: true,
    progress: p,
  };
}
export function foodIronToken(id: number, recovery: number) {
  return { id, inFiltrate: (id + 0.5) / 24 < unit(recovery) };
}
/** Continuous schematic paths through the funnel centre and stem into the same receiving beaker. */
export function foodIronMarkerPoint(id: number, recovery: number, progress: number) {
  const token = foodIronToken(id, recovery),
    p = unit(progress);
  const from = { x: 110 + ((id * 19) % 140), y: 58 + (id % 3) * 12 };
  if (!token.inFiltrate) {
    const to = { x: 130 + ((id * 17) % 100), y: 68 + (id % 2) * 14 };
    return {
      ...token,
      x: from.x + (to.x - from.x) * p,
      y: from.y + (to.y - from.y) * p,
      collected: false,
    };
  }
  const points = [
    from,
    { x: 180, y: 154 },
    { x: 180, y: 225 },
    { x: 130 + ((id * 17) % 100), y: 275 + (id % 3) * 9 },
  ];
  const breaks = [0, 0.35, 0.5, 1];
  const segment = p < 0.35 ? 0 : p < 0.5 ? 1 : 2;
  const t = (p - breaks[segment]) / (breaks[segment + 1] - breaks[segment]);
  const a = points[segment],
    b = points[segment + 1];
  const x = a.x + (b.x - a.x) * t,
    y = a.y + (b.y - a.y) * t;
  return { ...token, x, y, collected: y >= 260 };
}
