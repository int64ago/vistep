import { spectralExitance, radiationConstants } from './heat-radiation';
export function jouleCalorimeter(current: number, resistance: number, time: number, loss = 0.25) {
  if (
    ![current, resistance, time, loss].every(Number.isFinite) ||
    resistance < 0 ||
    time < 0 ||
    loss < 0
  )
    throw new RangeError('Finite physical calorimeter inputs required');
  const capacity = 600,
    ambient = 20,
    power = current * current * resistance,
    input = power * time,
    rise = loss === 0 ? input / capacity : (power / loss) * -Math.expm1((-loss * time) / capacity),
    stored = capacity * rise;
  return {
    current,
    resistance,
    time,
    power,
    input,
    stored,
    loss: input - stored,
    temperature: ambient + rise,
    capacity,
    voltage: current * resistance,
  };
}
export function eggCooling(time: number, waterMass = 0.2, eggInitial = 90, waterInitial = 20) {
  if (
    ![time, waterMass, eggInitial, waterInitial].every(Number.isFinite) ||
    time < 0 ||
    waterMass <= 0 ||
    Math.min(eggInitial, waterInitial) <= -273.15
  )
    throw new RangeError('Physical cooling inputs required');
  const eggCapacity = 200,
    waterCapacity = 4200 * waterMass,
    conductance = 2,
    total = eggCapacity + waterCapacity,
    equilibrium = (eggCapacity * eggInitial + waterCapacity * waterInitial) / total,
    difference =
      (eggInitial - waterInitial) *
      Math.exp(-conductance * (1 / eggCapacity + 1 / waterCapacity) * time),
    egg = equilibrium + (waterCapacity / total) * difference,
    water = equilibrium - (eggCapacity / total) * difference,
    transfer = eggCapacity * (eggInitial - egg),
    rate = conductance * difference,
    entropy =
      eggCapacity * Math.log((egg + 273.15) / (eggInitial + 273.15)) +
      waterCapacity * Math.log((water + 273.15) / (waterInitial + 273.15));
  return { egg, water, equilibrium, transfer, rate, entropy, eggCapacity, waterCapacity };
}
export function glowingIron(temperature: number) {
  if (!Number.isFinite(temperature) || temperature < 273.15 || temperature > 1750)
    throw new RangeError('Solid-iron teaching range is 273.15–1750 K');
  const peak = radiationConstants.wien / temperature,
    power = 0.8 * radiationConstants.sigma * temperature ** 4;
  let visible = 0;
  const step = 4e-9;
  for (let w = 380e-9 + step / 2; w < 780e-9; w += step)
    visible += spectralExitance(w, temperature, 0.8) * step;
  const reference = spectralExitance(650e-9, 1750, 0.8),
    brightness = Math.min(1, Math.max(0, (temperature - 650) / 1100)),
    channels = [650, 550, 450].map((w) =>
      Math.min(1, ((spectralExitance(w * 1e-9, temperature, 0.8) / reference) * 10) ** 0.45),
    );
  const color = `rgb(${channels.map((v, i) => Math.min(255, Math.round([67, 72, 58][i] * (1 - brightness) + 255 * v))).join(' ')})`;
  return { temperature, peak, power, visible, visibleFraction: visible / power, color, brightness };
}
export function ironSpectrum(temperature: number) {
  const max = spectralExitance(radiationConstants.wien / temperature, temperature, 0.8);
  return Array.from({ length: 140 }, (_, i) => {
    const wavelength = 0.3e-6 * (20 / 0.3) ** (i / 139);
    return { wavelength, value: spectralExitance(wavelength, temperature, 0.8) / max };
  });
}
