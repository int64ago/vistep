export type NitrogenGasState = {
  no: number;
  no2: number;
  oxygen: number;
  inert: number;
  aqueousN: number;
  waterConsumed: number;
};
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : 0));
/** Gas-equivalent volumes at a common T/P, not liquid volumes or measured kinetics. */
export function nitrogenInitial(feed = 10, pureOxygen = false, no = 20): NitrogenGasState {
  const v = clamp(feed, 0, 25);
  return {
    no: clamp(no, 0, 20),
    no2: 0,
    oxygen: v * (pureOxygen ? 1 : 0.21),
    inert: v * (pureOxygen ? 0 : 0.79),
    aqueousN: 0,
    waterConsumed: 0,
  };
}
export function oxidizeNitrogen(s: NitrogenGasState, extent = 1): NitrogenGasState {
  const x = Math.min(s.no / 2, s.oxygen) * clamp(extent);
  return { ...s, no: s.no - 2 * x, no2: s.no2 + 2 * x, oxygen: s.oxygen - x };
}
export function absorbNitrogen(s: NitrogenGasState, extent = 1, water = true): NitrogenGasState {
  const x = water ? (s.no2 / 3) * clamp(extent) : 0;
  return {
    ...s,
    no: s.no + x,
    no2: s.no2 - 3 * x,
    aqueousN: s.aqueousN + 2 * x,
    waterConsumed: s.waterConsumed + x,
  };
}
export function finishNitrogenAbsorption(s: NitrogenGasState, water = true) {
  let state = { ...s };
  for (let i = 0; i < 80; i++) {
    const before = state.no + state.no2;
    state = absorbNitrogen(oxidizeNitrogen(state), 1, water);
    if (!water || Math.abs(state.no + state.no2 - before) < 1e-12) break;
  }
  return state;
}
export const nitrogenGasVolume = (s: NitrogenGasState) => s.no + s.no2 + s.oxygen + s.inert;
export const nitrogenAtomInventory = (s: NitrogenGasState) => ({
  reactiveN: s.no + s.no2 + s.aqueousN,
  oxygenFromGas: s.no + 2 * s.no2 + 2 * s.oxygen + 3 * s.aqueousN - s.waterConsumed,
});
/** Textbook limiting cases; concentration is categorical, not an interpolation of real product distributions. */
export function copperNitric(concentrated: boolean, extent: number) {
  const x = clamp(extent);
  return {
    copper: 1 - x,
    copperII: x,
    no: concentrated ? 0 : (2 * x) / 3,
    no2: concentrated ? 2 * x : 0,
    nitricAcidConsumed: concentrated ? 4 * x : (8 * x) / 3,
    nitrateInSalt: 2 * x,
    water: concentrated ? 2 * x : (4 * x) / 3,
    electrons: 2 * x,
  };
}
export function nitrogenDirector(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(6, chapter)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    view: c < 3 ? 'syringe' : c === 3 ? 'oxygen-budget' : c === 6 ? 'gas-comparison' : 'copper',
    concentrated: c === 4,
    feed: c === 0 ? 0 : c === 1 ? Math.min(10, p * 40) : 10,
    oxidation: c === 0 ? 0 : c === 1 ? Math.min(1, Math.max(0, (p - 0.25) / 0.5)) : 1,
    absorption: c === 2 ? Math.min(1, p / 0.8) : 0,
    copperExtent: Math.min(0.75, p),
    lift: p > 0.8 ? (p - 0.8) / 0.2 : 0,
    pureOxygen: c === 3 && p > 0.5,
  };
}
/** Horizontal cylindrical syringe: invert circular-segment area for the liquid fill fraction. */
export function syringeLiquidDepth(fraction: number, radius = 32) {
  const f = clamp(fraction),
    r = Math.max(0.1, radius);
  let lo = 0,
    hi = 2 * r;
  for (let i = 0; i < 50; i++) {
    const h = (lo + hi) / 2,
      a = r * r * Math.acos((r - h) / r) - (r - h) * Math.sqrt(Math.max(0, 2 * r * h - h * h));
    if (a < f * Math.PI * r * r) lo = h;
    else hi = h;
  }
  return (lo + hi) / 2;
}
