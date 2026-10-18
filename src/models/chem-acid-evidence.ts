export type AcidKind = 'HCl' | 'HAc';
export const ACETIC_KA = 1.75e-5;
export const acidClamp = (v: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
/** Ideal25C charge balance, includes water. Countercation is charge equivalents in mol/L. */
export function acidSpeciation(kind: AcidKind, total: number, countercation = 0) {
  const C = acidClamp(total, 0, 2),
    z = acidClamp(countercation, 0, C),
    Kw = 1e-14;
  let h: number;
  if (kind === 'HCl') {
    const net = C - z;
    h = (net + Math.sqrt(net * net + 4 * Kw)) / 2;
  } else {
    let low = -14,
      high = 1;
    for (let i = 0; i < 90; i++) {
      const m = (low + high) / 2,
        x = 10 ** m;
      if (x + z - Kw / x - (ACETIC_KA * C) / (ACETIC_KA + x) > 0) high = m;
      else low = m;
    }
    h = 10 ** ((low + high) / 2);
  }
  const anion = kind === 'HCl' ? C : (ACETIC_KA * C) / (ACETIC_KA + h),
    molecular = kind === 'HCl' ? 0 : C - anion;
  const conductivity = 349.8 * h + 198 * (Kw / h) + (kind === 'HCl' ? 76.3 : 40.9) * anion;
  return {
    h,
    oh: Kw / h,
    pH: -Math.log10(h),
    anion,
    molecular,
    fraction: C ? anion / C : 0,
    conductivity,
  };
}
export function acidMeter(kind: AcidKind, total: number, immersed = true) {
  const a = acidSpeciation(kind, total);
  return { ...a, currentMa: immersed ? a.conductivity * 0.1 : 0, reading: immersed ? a.pH : null };
}
/** Phenomenological reconstruction of the textbook curve shape, NOT mechanistic kinetics or digitized observations. */
export function acidCurve(kind: AcidKind, time: number) {
  const t = Math.max(0, time);
  if (kind === 'HCl') {
    const e = Math.exp(-t / 23);
    return { fraction: 1 - e, derivative: e / 23 };
  }
  const initial = 1 / (1 + Math.exp(70 / 23)),
    L = 1 / (1 + Math.exp(-(t - 70) / 23));
  return {
    fraction: (L - initial) / (1 - initial),
    derivative: (L * (1 - L)) / 23 / (1 - initial),
  };
}
export function magnesiumPressure(kind: AcidKind, time: number, headspaceMl = 100, leak = 0) {
  const acidMoles = 0.002 * 2,
    initialMg = 0.05 / 24.305,
    limit = Math.min(initialMg, acidMoles / 2),
    curve = acidCurve(kind, time),
    hydrogen = limit * curve.fraction,
    collected = hydrogen * (1 - acidClamp(leak)),
    deltaP = (collected * 8.314462618 * 298.15) / (acidClamp(headspaceMl, 50, 200) / 1000);
  return {
    hydrogen,
    collected,
    escaped: hydrogen - collected,
    deltaP,
    limit,
    initialMg,
    mgLeft: initialMg - hydrogen,
    mgMassLeft: (initialMg - hydrogen) * 24.305,
    protonCapacity: acidMoles - 2 * hydrogen,
    rate: limit * curve.derivative,
    speciation: acidSpeciation(kind, 2, (2 * hydrogen) / 0.002),
  };
}
export function qualitativeMagnesium(kind: AcidKind, time: number, concentration = 0.1) {
  const initialMg = 0.005 / 24.305,
    acidMoles = 0.002 * acidClamp(concentration, 0, 0.1),
    limit = Math.min(initialMg, acidMoles / 2),
    k = kind === 'HCl' ? 0.045 : 0.008,
    hydrogen = limit * (1 - Math.exp(-k * Math.max(0, time)));
  return {
    hydrogen,
    rate: limit * k * Math.exp(-k * Math.max(0, time)),
    mgLeft: initialMg - hydrogen,
    initialMg,
    volume: hydrogen * 24465.4,
  };
}
export function carbonateAddition(progress: number, drops = 10) {
  const n = Math.round(acidClamp(drops, 0, 30)),
    p = acidClamp(progress),
    phase = p * (n + 1),
    delivered = Math.min(n, Math.floor(phase)),
    volume = 0.002 + delivered * 0.00005,
    carbonate = delivered * 0.00005,
    acid = 0.002,
    maximum = Math.min(carbonate, acid / 2);
  let gas = 0,
    rate = 0;
  for (let j = 1; j <= delivered; j++) {
    const capacity = Math.max(0, Math.min(0.00005, acid / 2 - (j - 1) * 0.00005));
    const e = Math.exp(-5 * Math.max(0, phase - j));
    gas += capacity * (1 - e);
    rate += capacity * 5 * e;
  }
  gas = Math.min(maximum, Math.max(0, gas));
  return {
    delivered,
    rate,
    fall: phase - Math.floor(phase),
    dropping: delivered < n,
    volume,
    carbonate,
    gas,
    maximum,
    acidLeft: acid - 2 * gas,
    carbonateLeft: carbonate - gas,
    acetate: 2 * gas,
    gasMl: gas * 24465.4,
  };
}
/** During syringe injection, both gas production and air compression can affect the transducer. */
export function acidInjection(kind: AcidKind, progress: number, headspaceMl = 100) {
  const p = acidClamp(progress),
    injected = acidClamp(p / 0.35),
    base = magnesiumPressure(kind, p * 80, headspaceMl),
    hydrogen = base.hydrogen * injected,
    V = headspaceMl + 2 * (1 - injected),
    airRise = (101.325 * (headspaceMl + 2)) / V - 101.325,
    gasRise = (hydrogen * 8.314462618 * 298.15) / (V / 1000);
  return {
    injected,
    liquidMl: 2 * injected,
    remainingMl: 2 * (1 - injected),
    hydrogen,
    mgMassLeft: 0.05 - hydrogen * 24.305,
    headspaceMl: V,
    airRise,
    gasRise,
    deltaP: airRise + gasRise,
  };
}
