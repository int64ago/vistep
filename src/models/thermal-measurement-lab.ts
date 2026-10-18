/** Lumped calorimetry and ideal-gas measurements; SI energy, mL gas volumes. */
export function mixingCalorimeter(time: number, cupCapacity = 60, metalSpecificHeat = 900) {
  const metalMass = 0.2,
    waterMass = 0.15,
    waterSpecificHeat = 4180;
  const hotCapacity = metalMass * metalSpecificHeat,
    coldCapacity = waterMass * waterSpecificHeat + cupCapacity;
  const initialHot = 100,
    initialCold = 20,
    equilibrium =
      (hotCapacity * initialHot + coldCapacity * initialCold) / (hotCapacity + coldCapacity);
  const difference =
    (initialHot - initialCold) *
    Math.exp(-12 * (1 / hotCapacity + 1 / coldCapacity) * Math.max(0, time));
  const hot = equilibrium + (coldCapacity / (hotCapacity + coldCapacity)) * difference;
  const cold = equilibrium - (hotCapacity / (hotCapacity + coldCapacity)) * difference;
  return {
    hot,
    cold,
    equilibrium,
    hotCapacity,
    coldCapacity,
    transferred: hotCapacity * (initialHot - hot),
    balance: hotCapacity * (hot - initialHot) + coldCapacity * (cold - initialCold),
    inferredWithoutCup:
      (waterMass * waterSpecificHeat * (equilibrium - initialCold)) /
      (metalMass * (initialHot - equilibrium)),
  };
}
export function syringeGas(volume: number, exponent = 1, deadVolume = 1) {
  const totalVolume = Math.max(0.1, volume + deadVolume),
    ratio = (20 + deadVolume) / totalVolume;
  return {
    volume,
    totalVolume,
    pressure: 101.325 * ratio ** exponent,
    temperature: 293.15 * ratio ** (exponent - 1),
    pv: 101.325 * ratio ** exponent * totalVolume,
  };
}
export function flaskPlug(temperature: number, initialVolume = 101, area = 0.5) {
  const kelvin = temperature + 273.15,
    volume = (initialVolume * kelvin) / 293.15;
  return {
    temperature,
    kelvin,
    volume,
    displacement: (volume - initialVolume) / area,
    pressure: 101.325,
  };
}
