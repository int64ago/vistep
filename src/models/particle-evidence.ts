import { finiteClamp } from './modern-labs';
/** MeV/c² units. Pair creation is forbidden below twice the electron rest energy. */
export const ELECTRON_MEV = 0.51099895;
export function pairEvidence(energyMeV: number, thickness: number) {
  const e = finiteClamp(energyMeV, 0.2, 4),
    d = finiteClamp(thickness, 0, 3);
  const pair = e > 2 * ELECTRON_MEV ? Math.sqrt(1 - (2 * ELECTRON_MEV) / e) : 0;
  return {
    threshold: 2 * ELECTRON_MEV,
    pairTerm: pair,
    baseline: Math.exp(-0.35 * d),
    transmission: Math.exp(-(0.35 + 0.6 * pair) * d),
    kineticEach: Math.max(0, e / 2 - ELECTRON_MEV),
  };
}
export function captureRecoil(neutrinoKeV = 861.8, massU = 7) {
  return (neutrinoKeV ** 2 / (2 * massU * 931494.10242)) * 1000;
}
export function invariantPair(energy1: number, energy2: number, angle: number, mass = 0) {
  const p1 = Math.sqrt(Math.max(0, energy1 ** 2 - mass ** 2)),
    p2 = Math.sqrt(Math.max(0, energy2 ** 2 - mass ** 2));
  return Math.sqrt(
    Math.max(0, 2 * mass ** 2 + 2 * (energy1 * energy2 - p1 * p2 * Math.cos(angle))),
  );
}
export function parityCounts(polarization: number) {
  const p = finiteClamp(polarization, 0, 1),
    a = -0.7 * p;
  return {
    up: 0.5 + a / 4,
    down: 0.5 - a / 4,
    asymmetry: a / 2,
    angular: (cos: number) => 1 + a * finiteClamp(cos, -1, 1),
  };
}
/** Toy expected spectra, explicitly not experimental data or a significance calculation. */
export function resonanceBins(kind: 'higgs' | 'jpsi', exposure: number, signal = true) {
  const center = kind === 'higgs' ? 125 : 3.097,
    width = kind === 'higgs' ? 1.5 : 0.018,
    lo = kind === 'higgs' ? 110 : 2.9,
    hi = kind === 'higgs' ? 140 : 3.3;
  return Array.from({ length: 45 }, (_, j) => {
    const mass = lo + ((j + 0.5) * (hi - lo)) / 45,
      background = kind === 'higgs' ? 30 * Math.exp(-(mass - lo) / 35) : 8;
    const peak = signal
      ? (kind === 'higgs' ? 18 : 38) * Math.exp(-0.5 * ((mass - center) / width) ** 2)
      : 0;
    return { mass, background: background * exposure, total: (background + peak) * exposure };
  });
}
/** Isotropic singly charged recoil ions entering the forward hemisphere of a planar retarding field. */
export function captureTransmission(voltage: number) {
  return Math.max(0, 1 - Math.sqrt(Math.max(0, voltage) / captureRecoil()));
}
