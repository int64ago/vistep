export interface BjtParameters {
  supply: number;
  collectorResistance: number;
  emitterResistance: number;
  beta: number;
  saturationCurrent: number;
  thermalVoltage: number;
}
export const bjtDefaults = (): BjtParameters => ({
  supply: 5,
  collectorResistance: 2200,
  emitterResistance: 0,
  beta: 100,
  saturationCurrent: 1e-14,
  thermalVoltage: 0.02585,
});
export function bjtPoint(p: BjtParameters, baseVoltage: number) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.supply <= 0 ||
    p.collectorResistance <= 0 ||
    p.emitterResistance < 0 ||
    p.beta <= 0 ||
    p.saturationCurrent <= 0 ||
    p.thermalVoltage <= 0 ||
    !Number.isFinite(baseVoltage) ||
    baseVoltage < 0 ||
    baseVoltage > 1.2
  )
    throw new RangeError('Low-voltage NPN circuit parameters required');
  const alpha = p.beta / (p.beta + 1),
    alphaReverse = 0.5,
    diode = (v: number, coefficient: number) =>
      (p.saturationCurrent / coefficient) * Math.expm1(v / p.thermalVoltage),
    solveCollector = (emitterVoltage: number) => {
      const forward = diode(baseVoltage - emitterVoltage, alpha);
      let lo = -0.5,
        hi = p.supply;
      for (let n = 0; n < 55; n++) {
        const mid = (lo + hi) / 2,
          reverse = diode(baseVoltage - mid, alphaReverse),
          collectorCurrent = alpha * forward - reverse;
        if ((p.supply - mid) / p.collectorResistance > collectorCurrent) lo = mid;
        else hi = mid;
      }
      const collectorVoltage = (lo + hi) / 2,
        reverse = diode(baseVoltage - collectorVoltage, alphaReverse),
        collectorCurrent = alpha * forward - reverse,
        emitterCurrent = forward - alphaReverse * reverse;
      return {
        collectorVoltage,
        collectorCurrent,
        emitterCurrent,
        baseCurrent: emitterCurrent - collectorCurrent,
      };
    };
  let emitterVoltage = 0;
  if (p.emitterResistance > 0) {
    let lo = 0,
      hi = baseVoltage;
    for (let n = 0; n < 50; n++) {
      const mid = (lo + hi) / 2,
        q = solveCollector(mid);
      if (mid / p.emitterResistance > q.emitterCurrent) hi = mid;
      else lo = mid;
    }
    emitterVoltage = (lo + hi) / 2;
  }
  const q = solveCollector(emitterVoltage),
    vbe = baseVoltage - emitterVoltage,
    vbc = baseVoltage - q.collectorVoltage,
    vce = q.collectorVoltage - emitterVoltage,
    collectorPower = p.supply * q.collectorCurrent,
    basePower = baseVoltage * q.baseCurrent,
    resistorPower =
      p.collectorResistance * q.collectorCurrent ** 2 + p.emitterResistance * q.emitterCurrent ** 2,
    transistorPower = vce * q.collectorCurrent + vbe * q.baseCurrent;
  return {
    ...p,
    ...q,
    baseVoltage,
    emitterVoltage,
    vbe,
    vbc,
    vce,
    alpha,
    collectorPower,
    basePower,
    resistorPower,
    transistorPower,
    region:
      vbc > 0
        ? 'saturation'
        : q.collectorCurrent < (p.supply / p.collectorResistance) * 0.025
          ? 'near-cutoff'
          : 'active',
  };
}
export function bjtBias(p: BjtParameters) {
  const target = p.supply / 2;
  let lo = 0.2,
    hi = 1.1;
  for (let n = 0; n < 45; n++) {
    const mid = (lo + hi) / 2;
    if (bjtPoint(p, mid).collectorVoltage > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const standardBias = bjtBias(bjtDefaults());
const feedbackBias = bjtBias({ ...bjtDefaults(), emitterResistance: 100 });
export function bjtShot(chapter: number, progress: number) {
  const p = bjtDefaults(),
    u = Math.max(0, Math.min(1, progress));
  if (chapter === 4) p.emitterResistance = 100;
  const bias = chapter === 4 ? feedbackBias : standardBias,
    phase = u * 4 * Math.PI,
    amplitude = chapter === 3 ? 0.08 : chapter === 4 ? 0.04 : 0.008,
    baseVoltage =
      chapter === 0
        ? 0.5 + (bias - 0.5) * u
        : chapter === 1
          ? bias + (0.016 * u - 0.008)
          : bias + amplitude * Math.sin(phase);
  return { parameters: p, bias, phase, amplitude, state: bjtPoint(p, baseVoltage) };
}
