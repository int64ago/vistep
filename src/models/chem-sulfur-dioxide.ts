/** Quasistatic ideal gas + water-column balance. Extent is an observation state, not elapsed time. */
export function sulfurDissolution(
  extent: number,
  sealed = false,
  tubeHeight = 0.18,
  mouthDepth = 0.03,
) {
  const p = Math.max(0, Math.min(1, Number.isFinite(extent) ? extent : 0));
  const h = Math.max(0.01, Math.min(0.8, tubeHeight)),
    d = Math.max(0, Math.min(0.3, mouthDepth));
  const rho = 998.2,
    g = 9.80665,
    patm = 101325,
    p0 = patm + rho * g * d,
    remaining = sealed ? 1 : 1 - p;
  let lo = 0,
    hi = h;
  for (let i = 0; i < 64; i++) {
    const r = (lo + hi) / 2,
      q = ((p0 - rho * g * r) * (h - r)) / (p0 * h);
    if (q > remaining) lo = r;
    else hi = r;
  }
  const rise = remaining === 1 ? 0 : remaining === 0 ? h : (lo + hi) / 2;
  return {
    extent: sealed ? 0 : p,
    remaining,
    dissolved: 1 - remaining,
    rise,
    height: h,
    volumeFraction: (h - rise) / h,
    pressure: remaining === 0 ? null : p0 - rho * g * rise,
    initialPressure: p0,
    externalPressureAtMouth: p0,
    acidic: !sealed && p > 0,
    gasUnits: Math.round(24 * remaining),
    aqueousUnits: 24 - Math.round(24 * remaining),
  };
}
/** Reversible textbook colour evidence. Does not fit kinetic constants or all SO2 bleaching chemistry. */
export function sulfurDye(bleaching: number, recovery: number) {
  const clamp = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0)),
    b = clamp(bleaching),
    r = clamp(recovery),
    coloured = 1 - b + b * r;
  return {
    coloured,
    colourless: 1 - coloured,
    units: Array.from({ length: 24 }, (_, i) => ({ id: i, coloured: (i + 0.5) / 24 < coloured })),
  };
}
export function sulfurPink(coloured: number) {
  const p = Math.max(0, Math.min(1, coloured));
  return `rgb(${[220, 234, 230].map((v, i) => Math.round(v + ([185, 81, 119][i] - v) * p)).join(',')})`;
}
/** Lift through the tube mouth before moving to the indicator paper. */
export function sulfurAcidityProbe(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const mix = (a: number, b: number, q: number) => a + (b - a) * Math.max(0, Math.min(1, q));
  const x = mix(95, 232, (p - 0.35) / 0.2);
  const y =
    p < 0.35
      ? mix(180, 35, (p - 0.15) / 0.2)
      : p < 0.7
        ? mix(35, 134, (p - 0.55) / 0.15)
        : mix(134, 95, (p - 0.82) / 0.18);
  const tilt = mix(0, 0.85, (p - 0.4) / 0.15),
    length = mix(170, 95, (p - 0.4) / 0.15);
  return {
    x,
    y,
    endX: x + Math.sin(tilt) * length,
    endY: y - Math.cos(tilt) * length,
    contacted: p >= 0.7,
  };
}
export function sulfurDioxideDirector(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(4, chapter)),
    p = Math.max(0, Math.min(1, progress));
  return {
    chapter: c,
    progress: p,
    mode: c === 0 ? 'dissolution' : c === 1 ? 'acidity' : c === 4 ? 'comparison' : 'dye',
    sealed: c === 0 && p < 0.12,
    extent: c === 0 ? Math.min(1, Math.max(0, (p - 0.12) / 0.76)) : 0.995,
    bleaching: c === 2 ? Math.min(1, Math.max(0, (p - 0.26) / 0.6)) : 1,
    recovery: c === 3 ? Math.min(1, p / 0.8) : c === 4 ? 1 : 0,
    heating: c === 3,
    added: c !== 2 || p > 0.22,
  };
}
