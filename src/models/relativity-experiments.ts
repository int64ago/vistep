import { finiteClamp } from './modern-labs';
export const LIGHT_SPEED = 299792458;
export function etherFringes(angle: number, velocity = 30000, length = 11, wavelength = 500e-9) {
  const b = velocity / LIGHT_SPEED;
  const roundTrip = (a: number) =>
    (((2 * length) / LIGHT_SPEED) * Math.sqrt(1 - b * b * Math.sin(a) ** 2)) / (1 - b * b);
  return (LIGHT_SPEED * (roundTrip(angle) - roundTrip(angle + Math.PI / 2))) / wavelength;
}
/** Units L=c=1. Emissions are simultaneous at x=±1/2 in the ground frame. */
export function simultaneity(beta = 0.6) {
  const b = finiteClamp(beta, 0, 0.8),
    gamma = 1 / Math.sqrt(1 - b * b);
  return {
    beta: b,
    gamma,
    arrivalRight: 0.5 / (1 + b),
    arrivalLeft: 0.5 / (1 - b),
    emissionLeftPrime: (gamma * b) / 2,
    emissionRightPrime: (-gamma * b) / 2,
  };
}
export function muonFlight(beta = 0.995, height = 10000, progress = 1) {
  const b = finiteClamp(beta, 0.9, 0.999),
    h = finiteClamp(height, 0, 20000),
    p = finiteClamp(progress, 0, 1),
    gamma = 1 / Math.sqrt(1 - b * b),
    labTime = (h * p) / (b * LIGHT_SPEED),
    properTime = labTime / gamma,
    lifetime = 2.1969811e-6;
  return {
    gamma,
    labTime,
    properTime,
    survival: Math.exp(-properTime / lifetime),
    classical: Math.exp(-labTime / lifetime),
    height: h * (1 - p),
    contractedHeight: h / gamma,
  };
}
/** Slow-speed weak-field equatorial example, not the historical flight paths. */
export function flightClock(direction = 1, height = 10000, hours = 40, speed = 250) {
  const t = finiteClamp(hours, 0, 48) * 3600,
    h = finiteClamp(height, 0, 15000),
    u = finiteClamp(speed, 0, 350),
    ground = 465.1,
    air = ground + (direction < 0 ? -u : u),
    gravity = ((9.80665 * h * t) / LIGHT_SPEED ** 2) * 1e9,
    kinetic = ((-(air ** 2 - ground ** 2) * t) / (2 * LIGHT_SPEED ** 2)) * 1e9;
  return { gravity, kinetic, total: gravity + kinetic, groundSpeed: ground, airSpeed: air };
}
