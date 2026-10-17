/** Ideal fixed-activity PEM feed with a lumped ohmic loss; not a fitted polarization curve. */
export const fuelCellConstants = {
  faraday: 6.02214076e23 * 1.602176634e-19,
  deltaG: 237100,
  deltaH: 285800,
};
export interface FuelCellInput {
  resistance: number;
  internalResistance: number;
  seconds: number;
  hydrogenMMol: number;
  oxygenMMol: number;
  circuitClosed?: boolean;
  membraneConducting?: boolean;
}
export function fuelCell(input: FuelCellInput) {
  const {
    resistance,
    internalResistance,
    seconds,
    hydrogenMMol,
    oxygenMMol,
    circuitClosed = true,
    membraneConducting = true,
  } = input;
  if (
    !Number.isFinite(resistance) ||
    resistance < 0.01 ||
    resistance > 20 ||
    !Number.isFinite(internalResistance) ||
    internalResistance < 0.05 ||
    internalResistance > 2 ||
    !Number.isFinite(seconds) ||
    seconds < 0 ||
    seconds > 600 ||
    !Number.isFinite(hydrogenMMol) ||
    hydrogenMMol < 0 ||
    hydrogenMMol > 100 ||
    !Number.isFinite(oxygenMMol) ||
    oxygenMMol < 0 ||
    oxygenMMol > 100
  )
    throw new RangeError('Unsupported fuel-cell input');
  const F = fuelCellConstants.faraday;
  const reversibleVoltage = fuelCellConstants.deltaG / (2 * F);
  const availableCharge = Math.min((hydrogenMMol / 1000) * 2 * F, (oxygenMMol / 1000) * 4 * F);
  const connected = circuitClosed && membraneConducting;
  const nominalCurrent =
    connected && availableCharge > 0 ? reversibleVoltage / (resistance + internalResistance) : 0;
  const charge = Math.min(nominalCurrent * seconds, availableCharge);
  const exhausted = charge >= availableCharge;
  const current = exhausted ? 0 : nominalCurrent;
  const usedHydrogen = charge / (2 * F),
    usedOxygen = charge / (4 * F);
  const loadedVoltage = (reversibleVoltage * resistance) / (resistance + internalResistance);
  // At depleted feed or a nonconducting membrane the reference cell voltage is undefined.
  const voltage =
    exhausted || !membraneConducting ? null : circuitClosed ? loadedVoltage : reversibleVoltage;
  const electricalPower = current * current * resistance;
  const enthalpyRate = (current / (2 * F)) * fuelCellConstants.deltaH;
  const ohmicHeat = current * current * internalResistance;
  const reversibleHeat =
    (current / (2 * F)) * (fuelCellConstants.deltaH - fuelCellConstants.deltaG);
  const electricalEnergy = charge * loadedVoltage;
  const enthalpyUsed = usedHydrogen * fuelCellConstants.deltaH;
  return {
    reversibleVoltage,
    nominalCurrent,
    current,
    charge,
    voltage,
    usedHydrogen,
    usedOxygen,
    water: usedHydrogen,
    electrons: charge / F,
    protons: charge / F,
    hydrogenRemaining: Math.max(0, hydrogenMMol / 1000 - usedHydrogen),
    oxygenRemaining: Math.max(0, oxygenMMol / 1000 - usedOxygen),
    exhausted,
    limiting:
      hydrogenMMol < 2 * oxygenMMol
        ? ('hydrogen' as const)
        : hydrogenMMol > 2 * oxygenMMol
          ? ('oxygen' as const)
          : ('both' as const),
    electricalPower,
    enthalpyRate,
    ohmicHeat,
    reversibleHeat,
    heatOut: ohmicHeat + reversibleHeat,
    electricalEnergy,
    enthalpyUsed,
    heatEnergy: enthalpyUsed - electricalEnergy,
    efficiency: current > 0 ? electricalPower / enthalpyRate : null,
    depletionSeconds: nominalCurrent > 0 ? availableCharge / nominalCurrent : null,
  };
}
