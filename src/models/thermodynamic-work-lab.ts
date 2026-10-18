export function compressionFire(fraction: number, adiabatic = true) {
  const f = Math.max(0, Math.min(1, fraction)),
    ratio = 1 / (1 - 0.9 * f),
    initialVolume = 30e-6,
    volume = initialVolume / ratio,
    temperature = adiabatic ? 293.15 * ratio ** 0.4 : 293.15,
    pressure = 1e5 * ratio ** (adiabatic ? 1.4 : 1),
    internalChange = ((1e5 * initialVolume) / 0.4) * (temperature / 293.15 - 1),
    work = adiabatic ? internalChange : 1e5 * initialVolume * Math.log(ratio);
  return {
    volume,
    ratio,
    temperature,
    pressure,
    internalChange,
    work,
    heat: internalChange - work,
    ignited: adiabatic && temperature >= 500,
  };
}
export function jouleCalorimeter(progress: number, mass = 10, height = 1, duration = 12) {
  const p = Math.max(0, Math.min(1, progress)),
    drop = p * height,
    work = mass * 9.8 * drop,
    capacity = 0.05 * 4180 + 20,
    power = (mass * 9.8 * height) / duration,
    current = Math.sqrt(power / 4);
  return {
    drop,
    work,
    capacity,
    temperature: 20 + work / capacity,
    power,
    current,
    electricalEnergy: current * current * 4 * duration * p,
    angle: drop / 0.04,
  };
}
export function saturationPressure(celsius: number) {
  return 610.94 * Math.exp((17.625 * celsius) / (celsius + 243.04));
}
/** Ideal adiabatic well-mixed rigid-tank blowdown, no latent-heat feedback. */
export function cloudBottle(progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    initial = 120000,
    pressure = initial - (initial - 101325) * p,
    ratio = pressure / initial,
    temperature = 293.15 * ratio ** (0.4 / 1.4),
    remainingMassFraction = ratio ** (1 / 1.4),
    vapour = saturationPressure(20) * ratio,
    saturation = saturationPressure(temperature - 273.15),
    excess = Math.max(0, vapour - saturation);
  return {
    pressure,
    temperature,
    remainingMassFraction,
    vapour,
    saturation,
    fog: Math.min(1, excess / 1000),
  };
}
export function rumfordHeating(time: number, torque = 10, omega = 12) {
  const t = Math.max(0, time),
    power = torque * omega,
    work = power * t,
    capacity = 4300,
    sensible = Math.min(work, capacity * 80),
    latent = Math.max(0, work - sensible);
  return {
    power,
    work,
    temperature: 20 + sensible / capacity,
    evaporated: latent / 2256000,
    boiling: latent > 0,
    displayAngle: (omega * t) / 1200,
  };
}
