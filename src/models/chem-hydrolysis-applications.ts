export const hydroClamp = (v: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
export type HydroSalt = 'NaCl' | 'KNO3' | 'Na2CO3' | 'NaAc' | 'NH4Cl' | 'AmSulfate';
export function saltHydrolysis(salt: HydroSalt, concentration = 0.1) {
  const C = hydroClamp(concentration, 0, 1),
    N = salt === 'NH4Cl' ? C : salt === 'AmSulfate' ? 2 * C : 0,
    S = salt === 'AmSulfate' ? C : 0,
    A = salt === 'NaAc' ? C : 0,
    carbon = salt === 'Na2CO3' ? C : 0,
    Na = A + 2 * carbon,
    Cl = salt === 'NH4Cl' ? C : 0;
  const parts = (h: number) => {
    const kaN = 1e-14 / 1.8e-5,
      den = h * h + 4.5e-7 * h + 4.5e-7 * 4.7e-11;
    return {
      nh4: (N * h) / (h + kaN),
      nh3: (N * kaN) / (h + kaN),
      acetate: (A * 1.75e-5) / (h + 1.75e-5),
      acetic: (A * h) / (h + 1.75e-5),
      hco3: (carbon * 4.5e-7 * h) / den,
      co3: (carbon * 4.5e-7 * 4.7e-11) / den,
      h2co3: (carbon * h * h) / den,
      so4: (S * 0.012) / (h + 0.012),
      hso4: (S * h) / (h + 0.012),
    };
  };
  let lo = -14,
    hi = 0;
  for (let i = 0; i < 90; i++) {
    const m = (lo + hi) / 2,
      h = 10 ** m,
      a = parts(h);
    if (h + Na + a.nh4 - 1e-14 / h - Cl - a.acetate - a.hco3 - 2 * a.co3 - a.hso4 - 2 * a.so4 > 0)
      hi = m;
    else lo = m;
  }
  const h = 10 ** ((lo + hi) / 2),
    a = parts(h);
  return { ...a, h, oh: 1e-14 / h, pH: -Math.log10(h), C, Na, Cl, N, S, carbon };
}
/** First aqueous Fe(III) hydrolysis only, plus bisulfate. No sulfate complexes, polymeric iron or solid phase. */
export function ferricHydrolysis(saltMoles = 0.00005, volumeMl = 5, tempC = 25, acidMoles = 0) {
  const V = hydroClamp(volumeMl, 1, 100) / 1000,
    F = (2 * hydroClamp(saltMoles, 0, 0.01)) / V,
    S = (3 * hydroClamp(saltMoles, 0, 0.01) + hydroClamp(acidMoles, 0, 0.05)) / V,
    T = hydroClamp(tempC, 0, 100) + 273.15;
  const K = 10 ** -2.19 * Math.exp((40000 / 8.314462618) * (1 / 298.15 - 1 / T));
  let lo = -14,
    hi = 2;
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2,
      h = 10 ** m,
      x = (F * K) / (K + h),
      hs = (S * h) / (0.012 + h);
    if (h + 3 * F - x - 1e-14 / h - 2 * S + hs > 0) hi = m;
    else lo = m;
  }
  const h = 10 ** ((lo + hi) / 2),
    hydrolyzed = (F * K) / (K + h),
    hso4 = (S * h) / (0.012 + h);
  return {
    F,
    S,
    h,
    oh: 1e-14 / h,
    pH: -Math.log10(h),
    hydrolyzed,
    aquo: F - hydrolyzed,
    hso4,
    so4: S - hso4,
    fraction: F ? hydrolyzed / F : 0,
    hydrolyzedMoles: hydrolyzed * V,
    volumeMl: V * 1000,
    K,
  };
}
/** Particle settling illustration; pH is measured/assumed AFTER dosing, not inferred from unreported soil buffering. */
export function flocculationState(
  time: number,
  coagulant: 'none' | 'Fe' | 'Al',
  postDosePH = 6.5,
  mix = true,
) {
  const t = hydroClamp(time, 0, 300),
    pH = hydroClamp(postDosePH, 2, 10),
    chemistry =
      coagulant === 'none' ? 0 : Math.exp(-(((pH - 6.5) / (coagulant === 'Fe' ? 2 : 1.2)) ** 4)),
    aggregation = chemistry * (mix ? 1 : 0.1) * (1 - Math.exp(-t / 35));
  const radiusUm = 2 + 33 * aggregation,
    velocity = ((2 * 100 * 9.81 * (radiusUm * 1e-6) ** 2) / (9 * 0.001)) * 1000;
  let distance = 0;
  const steps = 100,
    dt = t / steps;
  for (let i = 0; i < steps; i++) {
    const q = chemistry * (mix ? 1 : 0.1) * (1 - Math.exp(-((i + 0.5) * dt) / 35)),
      r = (2 + 33 * q) * 1e-6;
    distance += ((2 * 100 * 9.81 * r * r) / (9 * 0.001)) * 1000 * dt;
  }
  return { aggregation, chemistry, radiusUm, velocity, distance, time: t };
}
export function mudParticle(
  id: number,
  time: number,
  coagulant: 'none' | 'Fe' | 'Al',
  postDosePH = 6.5,
  mix = true,
) {
  const state = flocculationState(time, coagulant, postDosePH, mix),
    group = Math.floor(id / 4),
    x0 = (((id * 37) % 101) / 100 - 0.5) * 1.6,
    depth0 = 5 + ((id * 17) % 47),
    clusterX = (((group * 29) % 71) / 70 - 0.5) * 1.3,
    clusterDepth = 12 + ((group * 11) % 33),
    angle = ((id % 4) * Math.PI) / 2;
  const x = x0 * (1 - state.aggregation) + (clusterX + Math.cos(angle) * 0.055) * state.aggregation,
    depth =
      depth0 * (1 - state.aggregation) +
      (clusterDepth + Math.sin(angle) * 1.2) * state.aggregation +
      state.distance;
  return {
    id,
    x,
    depth: Math.min(56 + (id % 4) * 0.7, depth),
    settled: depth >= 56 + (id % 4) * 0.7,
    aggregation: state.aggregation,
  };
}
/** Six equal iron-dose units, not a claimed molarity for unspecified saturated FeCl3. */
export function colloidPreparation(progress: number) {
  const p = hydroClamp(progress),
    phase = hydroClamp((p - 0.08) / 0.56) * 6,
    delivered = Math.min(6, Math.floor(phase)),
    clock = p * 120;
  let colloid = 0;
  for (let i = 1; i <= delivered; i++) {
    const addedAt = (0.08 + (i * 0.56) / 6) * 120;
    colloid += 1 - Math.exp(-0.06 * Math.max(0, clock - addedAt));
  }
  return {
    delivered,
    phase: phase - Math.floor(phase),
    dropping: p > 0.08 && p < 0.64,
    volumeMl: 40 + delivered * 0.05,
    ironTotal: delivered,
    aqueous: delivered - colloid,
    colloid,
    acidEquivalents: 3 * colloid,
    heating: p < 0.88,
  };
}
export function oilCleaning(hot: boolean, minutes = 3) {
  const t = hydroClamp(minutes, 0, 5) * 60,
    k = 0.0015 * (hot ? 6 : 1),
    remaining = Math.exp(-k * t),
    initial = 0.15,
    converted = initial * (1 - remaining),
    wallBefore = 0.06 * remaining,
    detached = wallBefore * (0.25 + 0.6 * (1 - remaining)),
    wallAfter = wallBefore - detached;
  return {
    initial,
    converted,
    unreacted: initial - converted,
    wallBefore,
    detached,
    wallAfter,
    wasteOil: initial - converted - wallAfter,
    soapEquivalent: converted,
  };
}
export type HydroPoint = { x: number; y: number };
export function polygonArea(points: HydroPoint[]) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const b = points[(i + 1) % points.length];
    a += points[i].x * b.y - b.x * points[i].y;
  }
  return Math.abs(a) / 2;
}
export function clipBelow(points: HydroPoint[], level: number) {
  const out: HydroPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      ina = a.y >= level,
      inb = b.y >= level;
    if (ina) out.push(a);
    if (ina !== inb) {
      const f = (level - a.y) / (b.y - a.y);
      out.push({ x: a.x + f * (b.x - a.x), y: level });
    }
  }
  return out;
}
/** A 2D equal-depth vessel section; visible retained volume follows the drawn polygon and lower pouring lip. */
export function pourTube(angleDeg: number, initialMl: number, cx = 85, cy = 160) {
  const angle = (hydroClamp(angleDeg, 0, 115) * Math.PI) / 180,
    local = [
      { x: -20, y: -62 },
      { x: 20, y: -62 },
      { x: 20, y: 42 },
      ...Array.from({ length: 13 }, (_, i) => ({
        x: 20 * Math.cos((i * Math.PI) / 12),
        y: 42 + 20 * Math.sin((i * Math.PI) / 12),
      })),
    ];
  const points = local.map((a) => ({
      x: cx + a.x * Math.cos(angle) - a.y * Math.sin(angle),
      y: cy + a.x * Math.sin(angle) + a.y * Math.cos(angle),
    })),
    full = polygonArea(points),
    lip = points[0].y > points[1].y ? points[0] : points[1],
    capacity = (polygonArea(clipBelow(points, lip.y)) / full) * 10,
    retained = Math.min(hydroClamp(initialMl, 0, 10), capacity);
  let lo = Math.min(...points.map((a) => a.y)),
    hi = Math.max(...points.map((a) => a.y));
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if ((polygonArea(clipBelow(points, m)) / full) * 10 > retained) lo = m;
    else hi = m;
  }
  const level = (lo + hi) / 2;
  return {
    points,
    liquid: clipBelow(points, level),
    level,
    retained,
    poured: initialMl - retained,
    lip,
    capacity,
  };
}
export function rinseOilTube(progress: number, hot: boolean, cx = 85) {
  const p = hydroClamp(progress),
    first = hydroClamp(p / 0.3),
    fill = hydroClamp((p - 0.42) / 0.16),
    second = hydroClamp((p - 0.58) / 0.3),
    angle =
      p < 0.3
        ? 115 * first
        : p < 0.42
          ? 115 * (1 - hydroClamp((p - 0.3) / 0.12))
          : p < 0.58
            ? 0
            : p < 0.88
              ? 115 * second
              : 115 * (1 - hydroClamp((p - 0.88) / 0.12));
  const initial = p < 0.42 ? 5 : p < 0.58 ? 5 * fill : 5,
    geometry =
      p < 0.3
        ? pourTube(angle, 5, cx)
        : p < 0.42
          ? pourTube(angle, 0, cx)
          : p < 0.58
            ? pourTube(0, initial, cx)
            : p < 0.88
              ? pourTube(angle, 5, cx)
              : pourTube(angle, 0, cx);
  const rinsed = hydroClamp((p - 0.42) / 0.16),
    oil = oilCleaning(hot),
    film = oil.wallBefore - (oil.wallBefore - oil.wallAfter) * rinsed,
    waste = p < 0.3 ? geometry.poured : p < 0.58 ? 5 : p < 0.88 ? 5 + geometry.poured : 10;
  return {
    angle,
    geometry,
    waterInput: 5 * fill,
    film,
    waste,
    oil,
    stream: (p < 0.3 || (p > 0.58 && p < 0.88)) && geometry.poured > 0 && geometry.retained > 0,
    adding: p > 0.42 && p < 0.58,
  };
}
