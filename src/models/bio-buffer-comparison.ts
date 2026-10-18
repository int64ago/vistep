export type BufferMaterial = 'water' | 'phosphate' | 'biological';
export type BufferReagent = 'acid' | 'base';
export const bufferMaterials: BufferMaterial[] = ['water', 'phosphate', 'biological'];
export const bufferColors = ['#7399b6', '#729c83', '#aa8b69'];
/** 25 mL aliquots and 0.1 mol/L titrant follow the textbook. Drop size and
 * effective buffer concentrations are disclosed teaching choices, not measurements. */
export function bufferState(material: BufferMaterial, drops: number, reagent: BufferReagent) {
  const n = Math.min(120, Math.max(0, Number.isFinite(drops) ? drops : 0));
  const volume = 0.025 + n * 0.00005;
  const totalMoles = { water: 0, phosphate: 0.02, biological: 0.012 }[material] * 0.025;
  const ka = 10 ** -7.2,
    kw = 1e-14,
    initialH = 1e-7;
  const initialCounterions = (totalMoles * ka) / (ka + initialH);
  const titrantMoles = n * 0.00005 * 0.1;
  const strongCharge = (initialCounterions + (reagent === 'base' ? 1 : -1) * titrantMoles) / volume;
  const total = totalMoles / volume;
  const balance = (pH: number) => {
    const h = 10 ** -pH;
    return h + strongCharge - kw / h - (total * ka) / (ka + h);
  };
  let lo = 0,
    hi = 14;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (balance(mid) > 0) lo = mid;
    else hi = mid;
  }
  const pH = (lo + hi) / 2,
    h = 10 ** -pH;
  const baseMoles = (totalMoles * ka) / (ka + h);
  return {
    material,
    drops: n,
    reagent,
    pH,
    volumeMl: volume * 1000,
    titrantMmol: titrantMoles * 1000,
    baseMmol: baseMoles * 1000,
    acidMmol: (totalMoles - baseMoles) * 1000,
    totalMmol: totalMoles * 1000,
    chargeResidual: balance(pH),
  };
}
export function bufferShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    reagent: (chapter === 3 ? 'base' : 'acid') as BufferReagent,
    drops:
      chapter === 0
        ? 0
        : chapter === 1
          ? p * 10
          : chapter === 2
            ? 10 + p * 20
            : chapter === 3
              ? p * 30
              : 30 + p * 90,
  };
}
