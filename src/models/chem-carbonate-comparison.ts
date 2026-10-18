export type CarbonateSalt = 'carbonate' | 'bicarbonate';
const clamp = (n: number, lo = 0, hi = 1, fallback = lo) =>
  Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : fallback));
const phase = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const smooth = (p: number) => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};
export const CARBONATE_MOLAR_MASS = {
  bicarbonate: 84.0066,
  carbonate: 105.9888,
  water: 18.0153,
  carbonDioxide: 44.0091,
} as const;
/** Net stoichiometry only; extent is NOT inferred from heating time. */
export function carbonateHeating(salt: CarbonateSalt, initialGrams: number, extent: number) {
  const initial = clamp(initialGrams, 0, 5),
    x = salt === 'bicarbonate' ? clamp(extent) : 0;
  const productMoles = ((initial / CARBONATE_MOLAR_MASS.bicarbonate) * x) / 2;
  const carbonateGrams = productMoles * CARBONATE_MOLAR_MASS.carbonate;
  const waterGrams = productMoles * CARBONATE_MOLAR_MASS.water;
  const carbonDioxideGrams = productMoles * CARBONATE_MOLAR_MASS.carbonDioxide;
  const unreactedGrams = initial * (1 - x);
  return {
    extent: x,
    initialGrams: initial,
    carbonateGrams,
    waterGrams,
    carbonDioxideGrams,
    gasMoles: productMoles,
    unreactedGrams,
    residueGrams: unreactedGrams + carbonateGrams,
    furtherLossGrams:
      salt === 'bicarbonate'
        ? unreactedGrams *
          (1 - CARBONATE_MOLAR_MASS.carbonate / (2 * CARBONATE_MOLAR_MASS.bicarbonate))
        : 0,
  };
}
/** Endpoint solubility approximation; temperature/hydration are qualitative textbook observations. */
export function carbonateDissolving(salt: CarbonateSalt, progress: number) {
  const p = clamp(progress),
    waterGrams = 0.15 * Math.min(1, p / 0.35) + 5 * Math.max(0, (p - 0.35) / 0.65);
  const dissolvedGrams = Math.min(1, (salt === 'carbonate' ? 17 / 83 : 0.096) * waterGrams);
  return {
    waterGrams,
    dissolvedGrams,
    residualGrams: 1 - dissolvedGrams,
    hydration:
      salt === 'carbonate' ? Math.min(1, p / 0.35) * (1 - Math.max(0, (p - 0.35) / 0.65)) : 0,
    heatDirection: salt === 'carbonate' ? 1 : -1,
    indicatorTone: salt === 'carbonate' ? 0.65 : 0.13,
  };
}
export const CARBONATE_EQUILIBRIUM = { K1: 10 ** -6.35, K2: 10 ** -10.33, Kw: 1e-14 } as const;
/** Ideal 25°C closed dilute solution. H2CO3* denotes CO2(aq)+H2CO3, not pure carbonic acid.
 * Sodium and total carbon are conserved inputs; pH solves electroneutrality, not an indicator lookup. */
export function aqueousCarbonateState(
  salt: CarbonateSalt,
  totalCarbonMoles: number,
  waterLitres: number,
) {
  const total = clamp(totalCarbonMoles, 0, 0.02),
    volume = clamp(waterLitres, 0.001, 100, 0.1);
  const concentration = total / volume,
    sodium = (salt === 'carbonate' ? 2 : 1) * concentration;
  const { K1, K2, Kw } = CARBONATE_EQUILIBRIUM;
  const species = (pH: number) => {
    const H = 10 ** -pH,
      OH = Kw / H,
      D = H * H + K1 * H + K1 * K2;
    const carbonicPool = (concentration * H * H) / D,
      bicarbonate = (concentration * K1 * H) / D,
      carbonate = (concentration * K1 * K2) / D;
    return {
      H,
      OH,
      carbonicPool,
      bicarbonate,
      carbonate,
      residual: sodium + H - bicarbonate - 2 * carbonate - OH,
    };
  };
  let lo = -1,
    hi = 15;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (species(mid).residual > 0) lo = mid;
    else hi = mid;
  }
  const pH = (lo + hi) / 2,
    s = species(pH);
  return {
    ...s,
    pH,
    sodium,
    concentration,
    totalCarbonMoles: total,
    waterLitres: volume,
    carbonAmounts: {
      carbonicPool: s.carbonicPool * volume,
      bicarbonate: s.bicarbonate * volume,
      carbonate: s.carbonate * volume,
    },
    carbonResidual: (s.carbonicPool + s.bicarbonate + s.carbonate) * volume - total,
    chargeResidual: s.residual,
    withinDiluteRange: concentration <= 0.02,
    // Qualitative phenolphthalein transition, not absorbance or a calibration of the textbook mixture.
    indicator: smooth((pH - 8.2) / 1.8),
  };
}
export type ProtonRoute = 'carbonate-accepts' | 'bicarbonate-accepts' | 'bicarbonate-donates';
export type NetAtom = {
  id: string;
  element: 'C' | 'O' | 'H' | 'Na';
  x: number;
  y: number;
  tracked?: boolean;
};
export type NetBond = { a: string; b: string; opacity: number };
/** Net endpoints connected for teaching; interpolation is not a molecular trajectory or transition state. */
export function protonTransferGeometry(width: number, route: ProtonRoute, progress: number) {
  const w = clamp(width, 240, 1000, 640),
    compact = w < 560,
    p = smooth(progress);
  const cx = compact ? w * 0.3 : w * 0.3,
    cy = compact ? 95 : 140;
  const wx = compact ? w * 0.69 : w * 0.72,
    wy = compact ? 206 : 140;
  const base: NetAtom[] = [
    { id: 'C', element: 'C', x: cx, y: cy },
    { id: 'O1', element: 'O', x: cx - 27, y: cy - 18 },
    { id: 'O2', element: 'O', x: cx + 27, y: cy - 18 },
    { id: 'O3', element: 'O', x: cx, y: cy + 31 },
    { id: 'Ow', element: 'O', x: wx, y: wy },
    { id: 'Hw2', element: 'H', x: wx + 24, y: wy - 17 },
  ];
  const bi = route !== 'carbonate-accepts',
    donor = route === 'bicarbonate-donates';
  if (bi) base.push({ id: 'Hc', element: 'H', x: cx + 23, y: cy + 47, tracked: donor });
  base.push({ id: 'Hw1', element: 'H', x: wx - 24, y: wy - 17, tracked: !donor });
  const moving = base.find((a) => a.id === (donor ? 'Hc' : 'Hw1'))!;
  const end = donor ? { x: wx, y: wy + 28 } : { x: cx + 48, y: cy - 34 };
  const start = { x: moving.x, y: moving.y };
  moving.x += (end.x - moving.x) * p;
  moving.y += (end.y - moving.y) * p - Math.sin(Math.PI * p) * 20;
  const bonds: NetBond[] = ['O1', 'O2', 'O3'].map((b) => ({ a: 'C', b, opacity: 1 }));
  bonds.push({ a: 'Ow', b: 'Hw2', opacity: 1 });
  if (donor) {
    bonds.push(
      { a: 'Ow', b: 'Hw1', opacity: 1 },
      { a: 'O3', b: 'Hc', opacity: 1 - phase(p, 0.1, 0.45) },
      { a: 'Ow', b: 'Hc', opacity: phase(p, 0.65, 0.95) },
    );
  } else {
    if (bi) bonds.push({ a: 'O3', b: 'Hc', opacity: 1 });
    bonds.push(
      { a: 'Ow', b: 'Hw1', opacity: 1 - phase(p, 0.1, 0.45) },
      { a: 'O2', b: 'Hw1', opacity: phase(p, 0.65, 0.95) },
    );
  }
  const charges = donor
    ? { before: [-1, 0], after: [-2, 1] }
    : bi
      ? { before: [-1, 0], after: [0, -1] }
      : { before: [-2, 0], after: [-1, -1] };
  return {
    width: w,
    height: compact ? 302 : 280,
    atoms: base,
    bonds,
    progress: p,
    start,
    end,
    transferPath: Array.from({ length: 33 }, (_, i) => {
      const f = i / 32;
      return {
        x: start.x + (end.x - start.x) * f,
        y: start.y + (end.y - start.y) * f - Math.sin(Math.PI * f) * 20,
      };
    }),
    cx,
    cy,
    wx,
    wy,
    spectatorSodium: bi ? 1 : 2,
    charges,
    left: donor ? 'HCO₃⁻ + H₂O' : bi ? 'HCO₃⁻ + H₂O' : 'CO₃²⁻ + H₂O',
    right: donor ? 'CO₃²⁻ + H₃O⁺' : bi ? 'H₂CO₃ + OH⁻' : 'HCO₃⁻ + OH⁻',
  };
}
/** Twelve stable atom IDs: a net material map for 2NaHCO3, not an elementary mechanism. */
export function carbonateThermalAtoms(width: number, progress: number) {
  const w = clamp(width, 240, 1000, 640),
    compact = w < 560,
    p = smooth(progress),
    h = compact ? 270 : 300;
  const unit = (cx: number, cy: number, suffix: string): NetAtom[] => [
    { id: `Na${suffix}`, element: 'Na', x: cx - 45, y: cy - 36 },
    { id: `C${suffix}`, element: 'C', x: cx, y: cy },
    { id: `O${suffix}a`, element: 'O', x: cx - 27, y: cy - 17 },
    { id: `O${suffix}b`, element: 'O', x: cx + 27, y: cy - 17 },
    { id: `O${suffix}c`, element: 'O', x: cx, y: cy + 31 },
    { id: `H${suffix}`, element: 'H', x: cx + 23, y: cy + 47 },
  ];
  const atoms = [
    ...unit(compact ? w * 0.3 : w * 0.3, compact ? 76 : 145, '1'),
    ...unit(compact ? w * 0.7 : w * 0.7, compact ? 187 : 145, '2'),
  ];
  const c = { x: compact ? w * 0.3 : w * 0.24, y: compact ? 137 : 148 };
  const co2 = { x: compact ? w * 0.72 : w * 0.73, y: compact ? 65 : 98 };
  const water = { x: compact ? w * 0.73 : w * 0.73, y: compact ? 208 : 222 };
  const end: Record<string, { x: number; y: number }> = {
    C1: c,
    O1a: { x: c.x - 27, y: c.y - 17 },
    O1b: { x: c.x + 27, y: c.y - 17 },
    O1c: { x: c.x, y: c.y + 31 },
    Na1: { x: c.x - 27, y: c.y - 64 },
    Na2: { x: c.x + 27, y: c.y - 64 },
    C2: co2,
    O2a: { x: co2.x - 29, y: co2.y },
    O2b: { x: co2.x + 29, y: co2.y },
    O2c: water,
    H1: { x: water.x - 23, y: water.y - 20 },
    H2: { x: water.x + 23, y: water.y - 20 },
  };
  for (const a of atoms) {
    a.x += (end[a.id].x - a.x) * p;
    a.y += (end[a.id].y - a.y) * p;
  }
  const bonds: NetBond[] = [];
  for (const suffix of ['1', '2'])
    for (const tail of ['a', 'b', 'c'])
      bonds.push({
        a: `C${suffix}`,
        b: `O${suffix}${tail}`,
        opacity: suffix === '1' || tail !== 'c' ? 1 : 1 - phase(p, 0.05, 0.3),
      });
  bonds.push(
    { a: 'O1c', b: 'H1', opacity: 1 - phase(p, 0.05, 0.3) },
    { a: 'O2c', b: 'H2', opacity: 1 },
    { a: 'O2c', b: 'H1', opacity: phase(p, 0.75, 0.95) },
  );
  return { width: w, height: h, atoms, bonds, progress: p, solid: c, carbonDioxide: co2, water };
}
export const CARBONATE_CHAPTER_IDS = [
  'water',
  'solvation-energy',
  'indicator',
  'proton-balance',
  'dilution-prediction',
  'carbonate-heat',
  'bicarbonate-heat',
  'mass',
] as const;
/** Measured 2026-10-18 narration events, in chapter seconds including the 0.45 s cue lead-in.
 * Locale changes shot timing only; scientific inputs and models remain identical. */
export const CARBONATE_CHAPTER_SECONDS = [23.5, 24.5, 21.5, 34, 24, 22.5, 25, 27] as const;
export function carbonateDirector(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.floor(clamp(chapter, 0, 7)),
    p = clamp(progress),
    time = clamp(chapterTime ?? p * CARBONATE_CHAPTER_SECONDS[c], 0, CARBONATE_CHAPTER_SECONDS[c]),
    acceptAt = locale === 'en' ? 12.85 : 14.65,
    donateAt = locale === 'en' ? 16.9 : 18.6,
    poolAt = locale === 'en' ? 21 : 22.4,
    energyProgress =
      time < 3.7
        ? 0.28 * phase(time, 0.45, 3.7)
        : time < 9
          ? 0.28 + 0.32 * phase(time, 3.7, 9)
          : time < 16.4
            ? 0.6 + 0.2 * phase(time, 9, 16.4)
            : 0.8 + 0.2 * phase(time, 16.4, 23.3);
  return {
    chapter: c,
    id: CARBONATE_CHAPTER_IDS[c],
    progress: p,
    time,
    stage:
      c === 0
        ? time < 10.8
          ? 0.35 * phase(time, 3, 6.5)
          : 0.35 + 0.65 * phase(time, 10.8, 13.6)
        : 1,
    energyPhase: time < 3.7 ? 'separate' : time < 9 ? 'hydrate' : 'net',
    energyProgress,
    energySalt: (time < 16.4 ? 'carbonate' : 'bicarbonate') as CarbonateSalt,
    modelComparison: c === 2 && time >= 15.2,
    protonRoute: (time < acceptAt
      ? 'carbonate-accepts'
      : time < donateAt
        ? 'bicarbonate-accepts'
        : 'bicarbonate-donates') as ProtonRoute,
    protonProgress:
      time < acceptAt
        ? phase(time, 0.75, 6.4)
        : time < donateAt
          ? phase(time, acceptAt + 0.15, acceptAt + 3.15)
          : phase(time, donateAt + 0.15, donateAt + 3.15),
    equilibrium: c === 3 && time >= poolAt,
    dilutionFactor: 100 ** smooth(phase(time, 3, 10.4)),
    salt: (c === 5 ? 'carbonate' : 'bicarbonate') as CarbonateSalt,
    extent: c === 5 ? 0 : c === 6 ? phase(time, 0.2, 3.8) : phase(time, 0.5, 2.3),
    thermalAtoms: c === 6 && time >= 7.05,
    atomProgress: phase(time, 9.2, 15.4),
    massComparison: c === 7 && time >= 10.7,
    reheating: c === 7 && time >= 18.5,
  };
}
