/** Rounded constant-pressure water/ice values near melting, SI units. */
export const WATER_MELTING = {
  iceCapacity: 2100,
  liquidCapacity: 4186,
  fusion: 334000,
  startTemperature: -20,
} as const;
export function latentHeat(energy: number, mass = 0.1) {
  if (!Number.isFinite(energy) || !Number.isFinite(mass) || mass <= 0)
    throw new RangeError('Invalid enthalpy parameters');
  const warmIce = mass * WATER_MELTING.iceCapacity * 20,
    melt = mass * WATER_MELTING.fusion;
  const fraction = Math.max(0, Math.min(1, (energy - warmIce) / melt));
  const temperature =
    energy < warmIce
      ? -20 + energy / (mass * WATER_MELTING.iceCapacity)
      : energy <= warmIce + melt
        ? 0
        : (energy - warmIce - melt) / (mass * WATER_MELTING.liquidCapacity);
  return {
    energy,
    mass,
    temperature,
    fraction,
    warmIce,
    melt,
    iceEnergy: Math.min(energy, warmIce),
    phaseEnergy: Math.max(0, Math.min(melt, energy - warmIce)),
    liquidEnergy: Math.max(0, energy - warmIce - melt),
    phase: energy < warmIce ? 'ice' : energy < warmIce + melt ? 'mixture' : 'water',
  };
}
export function heatingAt(seconds: number, power = 100, mass = 0.1) {
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(power) || power < 0)
    throw new RangeError('Invalid heater parameters');
  return { ...latentHeat(seconds * power, mass), seconds, power };
}
export function latentShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const energies = [
    4200 * p,
    4200 + 33400 * p,
    4200 + 33400 * (0.25 + 0.5 * p),
    37600 + 8372 * p,
    20000,
    37600 - 33400 * p,
  ];
  return {
    energy: energies[Math.min(5, chapter)],
    power: chapter === 4 ? (p < 0.5 ? 100 : 200) : chapter === 5 ? -100 : 100,
  };
}
