export type TitrationDirection = 'base-into-acid' | 'acid-into-base';
export type TitrationError =
  'none' | 'burette-water' | 'flask-water' | 'flask-sample' | 'tip-bubble';
export const titrationClamp = (x: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));
/** Ideal 25C strong acid/base charge balance, including water near equivalence. */
export function strongTitration(
  direction: TitrationDirection,
  deliveredMl: number,
  sampleC = 0.1,
  sampleMl = 20,
  titrantC = 0.1,
  waterMl = 0,
) {
  const v = titrationClamp(deliveredMl, 0, 50),
    c = titrationClamp(sampleC, 0.001, 1),
    vs = titrationClamp(sampleMl, 1, 50),
    ct = titrationClamp(titrantC, 0.001, 1),
    water = titrationClamp(waterMl, 0, 50);
  const sample = (c * vs) / 1000,
    added = (ct * v) / 1000,
    totalL = (v + vs + water) / 1000;
  const acid = direction === 'base-into-acid' ? sample : added,
    base = direction === 'base-into-acid' ? added : sample;
  const excess = (base - acid) / totalL,
    root = Math.sqrt(excess * excess + 4e-14);
  const h = excess >= 0 ? 2e-14 / (root + excess) : (root - excess) / 2;
  const pH = -Math.log10(h),
    neutralized = Math.min(acid, base);
  return {
    acid,
    base,
    neutralized,
    acidLeft: acid - neutralized,
    baseLeft: base - neutralized,
    h,
    oh: 1e-14 / h,
    pH,
    totalMl: totalL * 1000,
    equivalenceMl: (sample / ct) * 1000,
    pink: titrationClamp((pH - 8.2) / 1.8),
    orange: titrationClamp((pH - 3.1) / 1.3),
  };
}
export function endpointVolume(direction: TitrationDirection, pH: number, waterMl = 0) {
  let lo = 0,
    hi = 40;
  for (let i = 0; i < 90; i++) {
    const m = (lo + hi) / 2,
      state = strongTitration(direction, m, 0.1, 20, 0.1, waterMl);
    if (state.pH < pH === (direction === 'base-into-acid')) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
export function readingVolume(initial: number, final: number) {
  return Number.isFinite(initial) &&
    Number.isFinite(final) &&
    initial >= 0 &&
    final <= 50 &&
    final >= initial
    ? final - initial
    : null;
}
export function titrationErrors(error: TitrationError) {
  const actualTitrant = error === 'burette-water' ? 0.098 : 0.1,
    sampleMl = error === 'flask-sample' ? 21 : 20;
  const actualDelivered = (sampleMl * 0.1) / actualTitrant,
    indicated = actualDelivered + (error === 'tip-bubble' ? 0.2 : 0);
  return {
    actualTitrant,
    sampleMl,
    waterMl: error === 'flask-water' ? 5 : 0,
    actualDelivered,
    indicated,
    inferredC: (0.1 * indicated) / 20,
    trueC: 0.1,
  };
}
/** Illustrative rinse: retain 0.5mL between 5mL rinses, then fill to50mL. */
export function rinseCarryover(cycles: number) {
  const n = Math.round(titrationClamp(cycles, 0, 3)),
    waterFraction = (0.5 / 5.5) ** n;
  return {
    waterFraction,
    waterMl: 0.5 * waterFraction,
    finalC: 0.1 * (1 - (0.5 * waterFraction) / 50),
  };
}
/** Half-drop is retained at the tip, touched to the inner wall, then washed into the bulk. */
export function halfDropState(progress: number) {
  const p = titrationClamp(progress),
    formed = 0.025 * titrationClamp(p / 0.16),
    touched = p >= 0.28 ? formed : 0,
    flushed = touched * titrationClamp((p - 0.55) / 0.2),
    waterMl = 2 * titrationClamp((p - 0.55) / 0.2);
  const lift =
    p < 0.2
      ? titrationClamp((p - 0.12) / 0.08)
      : p < 0.32
        ? 1
        : 1 - titrationClamp((p - 0.32) / 0.13);
  return {
    formed,
    hanging: formed - touched,
    wall: touched - flushed,
    bulk: flushed,
    waterMl,
    lift,
    flaskDx: 22 * lift,
    flaskDy: -42 * lift,
    reading: 19.975 + formed,
    bulkDelivered: 19.975 + flushed,
    clock: 30 * titrationClamp((p - 0.76) / 0.18),
    state: strongTitration('acid-into-base', 19.975 + flushed, 0.1, 20, 0.1, waterMl),
  };
}
export const TITRATION_TEXTBOOK_RUNS = [27.84, 27.83, 27.85] as const;
export function textbookTitrationMean() {
  return (0.1032 * TITRATION_TEXTBOOK_RUNS.reduce((a, b) => a + b, 0)) / 3 / 25;
}
export function studentTitrationRows(
  rows: { initial: string; final: string }[],
  standard = 0.1,
  sampleMl = 20,
) {
  const parsed = rows.map((row) => {
    if (!row.initial.trim() || !row.final.trim()) return null;
    const v = readingVolume(Number(row.initial), Number(row.final));
    return v === null ? null : { volume: v, concentration: (standard * v) / sampleMl };
  });
  const valid = parsed.filter((x): x is NonNullable<typeof x> => x !== null);
  return {
    parsed,
    mean:
      valid.length === rows.length && valid.length > 0
        ? valid.reduce((a, b) => a + b.concentration, 0) / valid.length
        : null,
  };
}
/** Schematic flask interior: rounded base and tapered body. Volume follows the drawn radius profile. */
export function titrationFlaskGeometry(ml: number) {
  const radius = (h: number) =>
    h < 10 ? 44 + 20 * Math.sqrt(h / 10) - (12 * h) / 10 : 52 - 0.4 * (h - 10);
  const area = (h: number) => {
    const q = Math.min(h, 10);
    const base =
      1936 * q -
      32.8 * q * q +
      (3520 / (3 * Math.sqrt(10))) * q ** 1.5 -
      (96 / (5 * Math.sqrt(10))) * q ** 2.5 +
      0.48 * q ** 3;
    const u = Math.max(0, h - 10);
    return Math.PI * (base + 2704 * u - 20.8 * u * u + (0.16 / 3) * u ** 3);
  };
  const target = (area(60) * titrationClamp(ml, 0, 50)) / 50;
  let lo = 0,
    hi = 60;
  for (let i = 0; i < 45; i++) {
    const h = (lo + hi) / 2;
    if (area(h) < target) lo = h;
    else hi = h;
  }
  const height = (lo + hi) / 2;
  return {
    height,
    level: 277 - height,
    radius: radius(height),
    cornerControl: 44 + 10 * Math.sqrt(Math.min(height, 10) / 10),
  };
}
