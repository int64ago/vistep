export type PeroxideCondition = 'blank' | 'heated' | 'iron' | 'catalase';
export const peroxideRates: Record<PeroxideCondition, number> = {
  blank: 0.007,
  heated: 0.06,
  iron: 0.15,
  catalase: 0.55,
};
/** Normalized substrate amount, illustrative first-order rates; catalyst changes rate, not yield. */
export function peroxideReaction(time: number, condition: PeroxideCondition) {
  const substrate = Math.exp(-peroxideRates[condition] * Math.max(0, time));
  return {
    substrate,
    oxygen: (1 - substrate) / 2,
    water: 1 - substrate,
    rate: peroxideRates[condition] * substrate,
  };
}
export function enzymeActivity(temperature: number, pH: number, preheatTemperature = temperature) {
  const thermal = 2 ** ((temperature - 25) / 15),
    survival = Math.exp(-(Math.max(0, (preheatTemperature - 45) / 15) ** 2)),
    phFactor = Math.exp(-(((pH - 7) / 2) ** 2));
  return { activity: thermal * survival * phFactor, survival };
}
export function enzymeConversion(
  time: number,
  temperature: number,
  pH: number,
  preheatTemperature = temperature,
) {
  const state = enzymeActivity(temperature, pH, preheatTemperature);
  return {
    ...state,
    rate: 0.3 * state.activity * Math.exp(-0.3 * state.activity * Math.max(0, time)),
    remaining: Math.exp(-0.3 * state.activity * Math.max(0, time)),
    converted: 1 - Math.exp(-0.3 * state.activity * Math.max(0, time)),
  };
}
export function amylaseSpecificity(substrate: 'starch' | 'sucrose', time: number) {
  const converted = substrate === 'starch' ? 1 - Math.exp(-0.5 * Math.max(0, time)) : 0;
  return { converted, reducingProduct: converted, positive: converted > 0.3 };
}
export function cellFreeFermentation(time: number, extractActive = true, glucose = true) {
  const consumed = extractActive && glucose ? 1 - Math.exp(-0.22 * Math.max(0, time)) : 0;
  return { glucose: 1 - consumed, ethanol: 2 * consumed, carbonDioxide: 2 * consumed };
}
export function cagedMeat(progress: number, gastricFluid = true) {
  return {
    fraction: gastricFluid ? Math.exp(-4 * Math.max(0, progress)) : 1,
    mechanicalAccess: false,
  };
}
