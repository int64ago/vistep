export const eqClamp = (x: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));
const R = 8.314462618;
/** NO2-equivalent moles are invariant; reference Kc is illustrative. */
export const NO_UNITS = 0.0004;
export function nitrogenK(celsius: number) {
  const T = eqClamp(celsius, 0, 80) + 273.15;
  return ((0.01 * 298.15) / T) * Math.exp((56900 / R) * (1 / 298.15 - 1 / T));
}
export function nitrogenEquilibrium(volumeMl: number, celsius: number) {
  const V = eqClamp(volumeMl, 10, 50) / 1000,
    C = NO_UNITS / V,
    K = nitrogenK(celsius),
    m = (2 * K * C) / (Math.sqrt(K * K + 8 * K * C) + K);
  return { monomer: m * V, dimer: ((C - m) * V) / 2, K, V };
}
export function nitrogenRelax(
  initialMonomer: number,
  volumeMl: number,
  celsius: number,
  time: number,
) {
  const e = nitrogenEquilibrium(volumeMl, celsius),
    C = NO_UNITS / e.V,
    ka = 5,
    kd = ka * e.K,
    r1 = e.monomer / e.V,
    r2 = (-e.K - Math.sqrt(e.K * e.K + 8 * e.K * C)) / 4,
    c0 = eqClamp(initialMonomer, 0, NO_UNITS) / e.V;
  const ratio = ((c0 - r1) / (c0 - r2)) * Math.exp(-2 * ka * (r1 - r2) * Math.max(0, time)),
    c = (r1 - ratio * r2) / (1 - ratio),
    monomer = eqClamp(c * e.V, 0, NO_UNITS),
    dimer = (NO_UNITS - monomer) / 2;
  return {
    monomer,
    dimer,
    concentration: monomer / e.V,
    opacity: 1 - Math.exp((-38 * monomer) / e.V),
    pressure: ((monomer + dimer) * 0.08314462618 * (celsius + 273.15)) / e.V,
    forward: ka * (monomer / e.V) ** 2,
    reverse: (kd * dimer) / e.V,
  };
}
export function syringeChange(expand: boolean, p: number) {
  const q = eqClamp(p),
    from = expand ? 20 : 40,
    to = expand ? 40 : 20,
    motion = eqClamp(q / 0.25),
    volume = from + (to - from) * motion,
    initial = nitrogenEquilibrium(from, 25),
    state = nitrogenRelax(initial.monomer, volume, 25, Math.max(0, q - 0.25) * 90);
  return { volume, motion, ...state, phase: q < 0.25 ? 'volume' : q < 0.85 ? 'relax' : 'settled' };
}
/** Formal reversible rate law for a constant-volume N2+3H2 ⇌2NH3 model. Not an elementary mechanism. */
export function ammoniaDynamic(time: number, fromProduct = false, catalyst = 1) {
  let x = fromProduct ? 1 : 0;
  const end = eqClamp(time, 0, 160),
    steps = Math.max(1, Math.ceil(end / 0.05)),
    dt = end / steps,
    m = eqClamp(catalyst, 1, 8);
  const derivative = (q: number) => 0.01 * (1 - q) * (3 - 3 * q) ** 3 - 0.04 * (2 * q) ** 2;
  for (let i = 0; i < steps; i++) {
    const a = derivative(x) * m,
      b = derivative(eqClamp(x + (a * dt) / 2)) * m,
      c = derivative(eqClamp(x + (b * dt) / 2)) * m,
      d = derivative(eqClamp(x + c * dt)) * m;
    x = eqClamp(x + (dt * (a + 2 * b + 2 * c + d)) / 6);
  }
  const nitrogen = 1 - x,
    hydrogen = 3 - 3 * x,
    ammonia = 2 * x;
  return {
    x,
    nitrogen,
    hydrogen,
    ammonia,
    forward: m * 0.01 * nitrogen * hydrogen ** 3,
    reverse: m * 0.04 * ammonia ** 2,
  };
}
export const HABER_T = [200, 300, 400, 500, 600];
export const HABER_P = [0.1, 10, 20, 30, 60, 100];
/** Textbook elective1 table2-2, printed p47: NH3 volume percent, initial N2:H2=1:3. */
export const HABER_YIELDS = [
  [15.3, 81.5, 86.4, 89.9, 95.4, 98.8],
  [2.2, 52, 64.2, 71, 84.2, 92.6],
  [0.4, 25.1, 38.2, 47, 65.2, 79.8],
  [0.1, 10.6, 19.1, 26.4, 42.2, 57.5],
  [0.05, 4.5, 9.1, 13.8, 23.1, 31.4],
];
export function haber(temperature: number, pressure: number, time: number, catalyst = false) {
  const row = HABER_T.indexOf(temperature),
    col = HABER_P.indexOf(pressure);
  if (row < 0 || col < 0) return null;
  const equilibrium = HABER_YIELDS[row][col] / 100,
    k =
      0.025 *
      Math.exp((60000 / R) * (1 / 673.15 - 1 / (temperature + 273.15))) *
      (catalyst ? 5 : 1);
  return { equilibrium, observed: equilibrium * (1 - Math.exp(-k * Math.max(0, time))), k };
}
export function ironMixture(add: 'none' | 'Fe' | 'SCN', drops: number, ironProgress = 0) {
  const d = eqClamp(drops, 0, 5),
    addedVolume = add === 'none' ? 0 : d * 0.00005,
    V = 0.0035 + addedVolume;
  const Fe0 = (0.05 * 0.00025) / 3 + (add === 'Fe' ? 0.05 * addedVolume : 0),
    S = (0.15 * 0.00025) / 3 + (add === 'SCN' ? 0.15 * addedVolume : 0),
    solidAdded = ironProgress > 0 ? Fe0 * 0.45 : 0,
    consumed = solidAdded * eqClamp(ironProgress),
    Fe = Fe0 - 2 * consumed;
  let lo = 0,
    hi = Math.min(Fe, S);
  for (let i = 0; i < 70; i++) {
    const x = (lo + hi) / 2;
    if (x / V > (((200 * (Fe - x)) / V) * (S - x)) / V) hi = x;
    else lo = x;
  }
  const complex = (lo + hi) / 2;
  return {
    volume: V,
    Fe0,
    FeFree: Fe - complex,
    scnFree: S - complex,
    complex,
    FeII: 3 * consumed,
    solidLeft: solidAdded - consumed,
    solidAdded,
    opacity: 1 - Math.exp((-1200 * complex) / V),
  };
}
/** Two-form educational chromate model, omitting HCrO4− and nonideality. Do not report as measured pH. */
export function chromium(baseDrops: number, acidDrops: number) {
  const b = eqClamp(baseDrops, 0, 10),
    a = eqClamp(acidDrops, 0, 10),
    V = 0.002 + 0.00005 * (a + b),
    Cr = 0.0004 / V,
    strong = (a * 0.00005 * 12 - b * 0.00005 * 6) / V,
    K = 1e12;
  let low = -16,
    high = 2;
  const chrom = (h: number) => (2 * Cr) / (1 + Math.sqrt(1 + 8 * K * h * h * Cr));
  for (let i = 0; i < 100; i++) {
    const log = (low + high) / 2,
      h = 10 ** log;
    if (h - 1e-14 / h - chrom(h) - strong > 0) high = log;
    else low = log;
  }
  const h = 10 ** ((low + high) / 2),
    monomer = chrom(h),
    dimer = (Cr - monomer) / 2;
  return { volume: V, chromate: monomer * V, dichromate: dimer * V, fraction: (2 * dimer) / Cr };
}
export function copper(celsius: number) {
  const T = eqClamp(celsius, 0, 80) + 273.15,
    K = 4 * Math.exp((35000 / R) * (1 / 298.15 - 1 / T));
  let lo = 0,
    hi = 0.25;
  for (let i = 0; i < 70; i++) {
    const x = (lo + hi) / 2;
    if (x > K * (0.5 - x) * (1 - 4 * x) ** 4) hi = x;
    else lo = x;
  }
  const chloro = (lo + hi) / 2,
    f = chloro / 0.5;
  const color = `rgb(${Math.round(245 * Math.exp(-((1 - f) * 0.9 + f * 0.1)))} ${Math.round(245 * Math.exp(-((1 - f) * 0.35 + f * 0.18)))} ${Math.round(245 * Math.exp(-((1 - f) * 0.08 + f * 2.7)))})`;
  return { chloro, aqua: 0.5 - chloro, chloride: 1 - 4 * chloro, f, color };
}
export function deliveredDrops(progress: number, count: number) {
  const n = Math.round(eqClamp(count, 0, 10)),
    q = eqClamp(progress) * (n + 1),
    delivered = Math.min(n, Math.floor(q));
  return { delivered, fall: q - Math.floor(q), visible: delivered < n };
}
/** Lift above each bath rim before exchanging x positions; separate vertical paths. */
export function flaskExchange(width: number, progress: number, index: number) {
  const p = eqClamp(progress),
    left = width / 2 - Math.min(85, width * 0.23),
    right = width / 2 + Math.min(85, width * 0.23),
    move = eqClamp((p - 0.32) / 0.26),
    lift =
      p < 0.32
        ? 65 * eqClamp((p - 0.2) / 0.12)
        : p < 0.58
          ? 65
          : 65 * (1 - eqClamp((p - 0.58) / 0.12));
  return {
    x: index ? right + (left - right) * move : left + (right - left) * move,
    y: 220 - lift - (index === 0 && p >= 0.32 && p <= 0.58 ? 95 * Math.sin(Math.PI * move) : 0),
  };
}
/** Finite stoichiometric batch: equilibrium pass, ideal NH3 separation, then recycle. */
export function ammoniaRecycle(progress: number) {
  const p = eqClamp(progress),
    round = Math.min(2, Math.floor(p * 3)),
    q = p === 1 ? 1 : p * 3 - round,
    y = 0.382,
    conversion = (2 * y) / (1 + y),
    feed = (1 - conversion) ** round,
    extent = feed * conversion * eqClamp(q / 0.35),
    made = 2 * extent,
    separated = made * eqClamp((q - 0.35) / 0.35),
    removed = 2 * (1 - feed) + separated;
  return {
    round: round + 1,
    q,
    conversion,
    nitrogen: feed - extent,
    hydrogen: 3 * (feed - extent),
    ammoniaGas: made - separated,
    removed,
    phase: q < 0.35 ? 'react' : q < 0.7 ? 'separate' : 'recycle',
  };
}
