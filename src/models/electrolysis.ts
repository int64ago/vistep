/** Ideal PEM water electrolysis: 100% Faradaic yield, no gas crossover or side reactions. */
export const electrolysisConstants = {
  faraday: 6.02214076e23 * 1.602176634e-19,
  // Liquid water, 298.15 K standard-state reference; not an operating-stack fit.
  deltaH: 285800,
  deltaG: 237100,
};
export interface ElectrolysisInput {
  current: number;
  seconds: number;
  voltage: number;
  waterMMol: number;
  circuitClosed?: boolean;
  membraneConducting?: boolean;
}
export function electrolysis(input: ElectrolysisInput) {
  const {
    current,
    seconds,
    voltage,
    waterMMol,
    circuitClosed = true,
    membraneConducting = true,
  } = input;
  if (
    !Number.isFinite(current) ||
    current < 0 ||
    current > 20 ||
    !Number.isFinite(seconds) ||
    seconds < 0 ||
    seconds > 600 ||
    !Number.isFinite(voltage) ||
    voltage < 1.25 ||
    voltage > 2.4 ||
    !Number.isFinite(waterMMol) ||
    waterMMol <= 0 ||
    waterMMol > 100
  )
    throw new RangeError('Unsupported electrolyzer input');
  const F = electrolysisConstants.faraday;
  const connected = circuitClosed && membraneConducting;
  const availableCharge = (waterMMol / 1000) * 2 * F;
  const charge = connected ? Math.min(current * seconds, availableCharge) : 0;
  const exhausted = charge >= availableCharge;
  const runningCurrent = connected && !exhausted ? current : 0;
  const hydrogen = charge / (2 * F),
    oxygen = charge / (4 * F),
    electrons = charge / F;
  const rate = runningCurrent / (2 * F);
  const electricalPower = runningCurrent * voltage;
  const enthalpyRate = rate * electrolysisConstants.deltaH;
  const heatOut = electricalPower - enthalpyRate;
  return {
    charge,
    hydrogen,
    oxygen,
    electrons,
    protons: electrons,
    waterUsed: hydrogen,
    waterRemaining: Math.max(0, waterMMol / 1000 - hydrogen),
    exhausted,
    runningCurrent,
    electricalPower,
    enthalpyRate,
    heatOut,
    electricalEnergy: charge * voltage,
    enthalpyStored: hydrogen * electrolysisConstants.deltaH,
    gibbsStored: hydrogen * electrolysisConstants.deltaG,
    heatEnergyOut: charge * voltage - hydrogen * electrolysisConstants.deltaH,
    exhaustionSeconds: current > 0 && connected ? availableCharge / current : null,
  };
}
