import { finiteClamp, E_CHARGE, ELECTRON_MASS, C_LIGHT, H } from './modern-labs';
/** Quantities are SI except explicitly marked teaching detector response. */
export function radiationTrack(kind: 'alpha' | 'beta' | 'gamma', fieldT: number) {
  const mass = kind === 'alpha' ? 6.6446573357e-27 : ELECTRON_MASS;
  const kinetic = (kind === 'alpha' ? 5 : 2) * 1e6 * E_CHARGE;
  const p = Math.sqrt(kinetic * (kinetic + 2 * mass * C_LIGHT ** 2)) / C_LIGHT;
  const q = kind === 'alpha' ? 2 * E_CHARGE : kind === 'beta' ? -E_CHARGE : 0;
  const curvature = (-q * finiteClamp(fieldT, -0.3, 0.3)) / p;
  const points: { x: number; y: number }[] = [];
  for (let j = 0; j <= 600; j++) {
    const s = j * 0.001;
    const x = Math.abs(curvature) < 1e-10 ? s : Math.sin(curvature * s) / curvature;
    const y = Math.abs(curvature) < 1e-10 ? 0 : (1 - Math.cos(curvature * s)) / curvature;
    if (x < -0.005 || x > 0.3 || Math.abs(y) > 0.115) break;
    points.push({ x, y });
  }
  return {
    points,
    radius: q === 0 || fieldT === 0 ? Infinity : Math.abs(1 / curvature),
    charge: q,
  };
}
export function plateExposure(time: number, sample = true, transmission = 1) {
  return (
    1 - Math.exp(-finiteClamp(time, 0, 10) * (sample ? 1 : 0.02) * finiteClamp(transmission, 0, 1))
  );
}
const saturation = (t: number) => 611.2 * Math.exp((17.67 * (t - 273.15)) / (t - 29.65));
export function expansionChamber(volumeRatio: number) {
  const ratio = finiteClamp(volumeRatio, 1, 1.25),
    temperature = 293.15 * ratio ** -0.4;
  const vaporPressure = (0.9 * saturation(293.15) * (temperature / 293.15)) / ratio;
  const supersaturation = vaporPressure / saturation(temperature);
  return { temperature, supersaturation, visibility: finiteClamp((supersaturation - 1) / 2, 0, 1) };
}
export function xrayTransmission(energyKeV: number, bone: boolean) {
  const e = finiteClamp(energyKeV, 8, 60),
    mu = bone ? 4 : 1;
  return Math.exp(-mu * (20 / e) ** 3);
}
export const xrayCutoffPM = (voltageKV: number) =>
  ((H * C_LIGHT) / (E_CHARGE * finiteClamp(voltageKV, 10, 100) * 1000)) * 1e12;
