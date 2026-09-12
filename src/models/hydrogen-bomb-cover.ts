import {
  DT_CONTACT_FM,
  coulombPotentialMeV,
  gamowIntegrand,
  maxwellEnergyDensity,
  tunnellingProbability,
  turningPointFm,
} from './hydrogen-bomb';

export type CoverPoint = { x: number; y: number };
export const hydrogenBombCoverPath = (points: readonly CoverPoint[], close = false) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ') +
  (close ? 'Z' : '');

/** 400×230 cover: the Coulomb hill sampled from the model on a logarithmic separation
 * axis, a tritium nucleus at its classical turning point for the film's 10 keV
 * temperature, a faint tunnelled twin inside the well, and the Gamow peak in the corner
 * built from the same Maxwell and tunnelling functions. Nothing is drawn freehand. */
export function hydrogenBombCover(temperatureKeV = 10) {
  const left = 26,
    right = 372,
    base = 176,
    top = 48;
  const rMin = 1,
    rMax = 1e7,
    eMax = 520;
  const x = (r: number) =>
    left +
    ((Math.log10(r) - Math.log10(rMin)) / (Math.log10(rMax) - Math.log10(rMin))) * (right - left);
  const y = (keV: number) => base - (keV / eMax) * (base - top);
  const hill = Array.from({ length: 96 }, (_, i) => {
    const r = Math.exp(
      Math.log(DT_CONTACT_FM) + (Math.log(rMax) - Math.log(DT_CONTACT_FM)) * (i / 95),
    );
    return { x: x(r), y: y(coulombPotentialMeV(r) * 1000), rFm: r };
  });
  const wellX = x(DT_CONTACT_FM),
    wellDepth = 22;
  const energyKeV = 1.5 * temperatureKeV,
    turning = turningPointFm(energyKeV);
  const nucleus = { x: x(turning), y: y(energyKeV), rFm: turning };
  const twin = { x: (x(rMin) + wellX) / 2, y: base + wellDepth - 9, opacity: 0.32 };
  const energyLine = { x1: nucleus.x, x2: right, y: y(energyKeV) };
  // Gamow inset: Maxwell shape, tunnelling and their product on 0–100 keV.
  const inset = { left: 236, right: 372, top: 24, bottom: 92 };
  const samples = 60;
  const energies = Array.from({ length: samples }, (_, i) => (i / (samples - 1)) * 100);
  const ix = (e: number) => inset.left + (e / 100) * (inset.right - inset.left);
  const iy = (v: number) => inset.bottom - v * (inset.bottom - inset.top);
  const maxwell = energies.map((e) => maxwellEnergyDensity(e, temperatureKeV));
  const mPeak = Math.max(...maxwell);
  const product = energies.map((e) => gamowIntegrand(e, temperatureKeV));
  const pPeak = Math.max(...product);
  const tunnel = energies.map((e) => tunnellingProbability(Math.max(e, 0.2)));
  const logMin = -12;
  const insetCurves = {
    maxwell: energies.map((e, i) => ({ x: ix(e), y: iy(maxwell[i] / mPeak) })),
    tunnelling: energies.map((e, i) => ({
      x: ix(e),
      y: iy((Math.max(logMin, Math.log10(tunnel[i])) - logMin) / -logMin),
    })),
    product: energies.map((e, i) => ({ x: ix(e), y: iy((product[i] / pPeak) * 0.82) })),
  };
  return {
    temperatureKeV,
    energyKeV,
    hill,
    well: { left: x(rMin), right: wellX, top: base + wellDepth, bottom: top },
    base,
    nucleus,
    twin,
    energyLine,
    tunnelProbability: tunnellingProbability(energyKeV),
    inset,
    insetCurves,
    deuterium: { x: x(rMin) + 8, y: base + wellDepth - 9 },
  };
}
