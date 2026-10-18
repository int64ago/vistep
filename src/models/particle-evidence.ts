import { finiteClamp } from './modern-labs';
import { ATLAS_BACKGROUND, ATLAS_RECORDS, ATLAS_TOTAL_FIT } from './particle-evidence-records';
export {
  ATLAS_RECORDS,
  ATLAS_BACKGROUND,
  ATLAS_TOTAL_FIT,
  TING_RECORDS,
  RICHTER_RECORDS,
} from './particle-evidence-records';
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
  const m = finiteClamp(mass, 0, 1e4),
    e1 = finiteClamp(energy1, m, 1e6),
    e2 = finiteClamp(energy2, m, 1e6),
    theta = finiteClamp(angle, 0, Math.PI),
    p1 = Math.sqrt(Math.max(0, e1 ** 2 - m ** 2)),
    p2 = Math.sqrt(Math.max(0, e2 ** 2 - m ** 2));
  return Math.sqrt(Math.max(0, 2 * m ** 2 + 2 * (e1 * e2 - p1 * p2 * Math.cos(theta))));
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

/** A 125 GeV/c² parent, boosted along one of its back-to-back rest-frame photons.
 * Photon energies are GeV; momentum times c is in GeV. Not an observed ATLAS event. */
export function photonEvent(betaInput: number) {
  const beta = finiteClamp(betaInput, 0, 0.6),
    gamma = 1 / Math.sqrt(1 - beta * beta),
    e1 = 62.5 * gamma * (1 + beta),
    e2 = 62.5 * gamma * (1 - beta),
    energy = e1 + e2,
    momentumC = e1 - e2;
  return { beta, gamma, e1, e2, energy, momentumC, mass: invariantPair(e1, e2, Math.PI) };
}
export type ParticlePoint = { x: number; y: number };
/** Uniform B points out of the page. Screen +y is downward. A positive charge
 * initially moving right bends downward, from q v×B. Coordinates and arc length in m. */
export function magneticTrack(
  momentumGeV: number,
  fieldT: number,
  charge: number,
  lengthM: number,
  heading = 0,
  start: ParticlePoint = { x: 0, y: 0 },
) {
  const p = finiteClamp(momentumGeV, 0.01, 100),
    B = finiteClamp(fieldT, 0, 2),
    q = finiteClamp(charge, -1, 1),
    length = finiteClamp(lengthM, -12, 12),
    h = finiteClamp(heading, -Math.PI, Math.PI),
    curvature = (0.299792458 * q * B) / p,
    x0 = finiteClamp(start.x, -100, 100),
    y0 = finiteClamp(start.y, -100, 100);
  const at = (s: number) => {
    const x = Math.abs(curvature) < 1e-10 ? s : Math.sin(curvature * s) / curvature,
      y = Math.abs(curvature) < 1e-10 ? 0 : (1 - Math.cos(curvature * s)) / curvature;
    return { x: x0 + x * Math.cos(h) - y * Math.sin(h), y: y0 + x * Math.sin(h) + y * Math.cos(h) };
  };
  return {
    momentumGeV: p,
    fieldT: B,
    curvature,
    radiusM: Math.abs(curvature) < 1e-10 ? null : 1 / Math.abs(curvature),
    points: Array.from({ length: 65 }, (_, i) => at((length * i) / 64)),
    end: at(length),
    tangent: { x: Math.cos(h + curvature * length), y: Math.sin(h + curvature * length) },
  };
}
/** Equal 10 GeV electron/positron energies moving forward at an opening angle
 * that reconstructs 3.1 GeV/c². A mechanism example, not original event tracks. */
export function spectrometerPair(fieldT: number) {
  const e = 10,
    m = ELECTRON_MEV / 1000,
    p = Math.sqrt(e * e - m * m),
    halfAngle = Math.asin(Math.sqrt(3.1 ** 2 - 4 * m * m) / (2 * p)),
    B = finiteClamp(fieldT, 0, 2),
    detectorX = 8,
    k = (0.299792458 * B) / p,
    // End every path on the SAME stationary detector plane, not at a fixed arc length.
    length =
      k < 1e-10
        ? detectorX / Math.cos(halfAngle)
        : (Math.asin(Math.sin(halfAngle) + k * detectorX) - halfAngle) / k;
  return {
    energyEach: e,
    momentumEach: p,
    halfAngle,
    mass: invariantPair(e, e, 2 * halfAngle, m),
    detectorX,
    electron: magneticTrack(p, B, -1, length, -halfAngle),
    positron: magneticTrack(p, B, 1, length, halfAngle),
  };
}
export const ANTI_SIGMA_RECORD = Object.freeze({
  pionMomentum: 244,
  pionUncertainty: 10,
  measuredParentMomentum: 1104,
  parentUncertainty: 600,
  pionAngleDegrees: 39 + 38 / 60,
  neutralAngleDegrees: 5 + 29 / 60,
  neutralLengthMm: 7.7,
  chargedKinetic: 1203,
  kineticUncertainty: 60,
  createdPionRestEnergy: 280,
  parentCharge: 1,
  pionCharge: 1,
  neutralCharge: 0,
});
/** Conditional reconstruction USING the measured AB angle, not an independent
 * prediction of it. Modern rest masses and rounded source angles give slight
 * rounding differences from the published reconstructed 1798±100 MeV/c. */
export function antiSigmaReconstruction() {
  const r = ANTI_SIGMA_RECORD,
    a = (r.pionAngleDegrees * Math.PI) / 180,
    b = (r.neutralAngleDegrees * Math.PI) / 180,
    pionMass = 139.57039,
    neutralMass = 939.56542052,
    neutralMomentum = (r.pionMomentum * Math.sin(a)) / Math.sin(b),
    parentMomentum = r.pionMomentum * Math.cos(a) + neutralMomentum * Math.cos(b),
    pionEnergy = Math.hypot(r.pionMomentum, pionMass),
    neutralEnergy = Math.hypot(neutralMomentum, neutralMass),
    totalEnergy = pionEnergy + neutralEnergy,
    parentMass = Math.sqrt(totalEnergy * totalEnergy - parentMomentum * parentMomentum),
    pion = { x: r.pionMomentum * Math.cos(a), y: -r.pionMomentum * Math.sin(a) },
    neutral = { x: neutralMomentum * Math.cos(b), y: neutralMomentum * Math.sin(b) },
    measuredMissing = { x: r.measuredParentMomentum - pion.x, y: -pion.y };
  return {
    pion,
    neutral,
    parentMomentum,
    neutralMomentum,
    parentMass,
    neutralKinetic: neutralEnergy - neutralMass,
    measuredMissing,
    measuredMissingAngle: (Math.atan2(measuredMissing.y, measuredMissing.x) * 180) / Math.PI,
    minimumProductEnergy: r.chargedKinetic + r.createdPionRestEnergy,
    annihilationAvailable: neutralEnergy + neutralMass,
  };
}
export function atlasFitAt(massInput: number, total = false) {
  const mass = finiteClamp(massInput, 100, 160),
    rows = total ? ATLAS_TOTAL_FIT : ATLAS_BACKGROUND;
  let i = 0;
  while (i < rows.length - 2 && rows[i + 1].mass < mass) i++;
  const a = rows[i],
    b = rows[i + 1],
    f = finiteClamp((mass - a.mass) / (b.mass - a.mass), 0, 1);
  return a.events + f * (b.events - a.events);
}
export function atlasResiduals() {
  return ATLAS_RECORDS.map((r) => ({ mass: r.mass, residual: r.events - atlasFitAt(r.mass) }));
}
/** Stable manual-exploration shot coordinate. Automatic playback maps recorded
 * chapter time onto this coordinate below, separately for each language. */
export function particleShot(chapter: number, progress: number) {
  const p = finiteClamp(progress, 0, 1);
  if (chapter === 0) return p < 0.35 ? 'photons' : p < 0.62 ? 'mass' : 'boost';
  if (chapter === 1)
    return p < 0.28 ? 'atlas' : p < 0.64 ? 'residual' : p < 0.78 ? 'cms-predict' : 'cms';
  if (chapter === 6) return p < 0.32 ? 'curvature' : p < 0.64 ? 'missing' : 'neutral';
  if (chapter === 7) return p < 0.33 ? 'triangle' : p < 0.7 ? 'neutron' : 'annihilation';
  if (chapter === 10)
    return p < 0.42 ? 'spectrometer' : p < 0.65 ? 'field-test' : p < 0.8 ? 'ting-predict' : 'ting';
  if (chapter === 11) return p < 0.3 ? 'beams' : p < 0.78 ? 'scan' : 'compare';
  return 'retained';
}

/** Chapter-local presentation anchors read from the recorded bilingual word times.
 * Seconds include the 0.45 s cue lead-in. Progress remains the stable manual
 * exploration coordinate; these maps only align the automatic film to speech.
 * Audio: zh189e09a6fe5d / en cf7d46b0722a, shared duration294 s. */
const particleVoiceAnchors: Record<
  'zh' | 'en',
  Record<number, readonly (readonly [number, number])[]>
> = {
  zh: {
    0: [
      [0, 0],
      [1, 0.22],
      [5.69, 0.35],
      [9.97, 0.62],
      [14.61, 0.88],
      [23.05, 1],
    ],
    1: [
      [0, 0],
      [3.67, 0.28],
      [8.97, 0.46],
      [11.87, 0.64],
      [16.09, 0.78],
      [24.65, 1],
    ],
    6: [
      [0, 0],
      [2.57, 0.32],
      [15.83, 0.64],
      [23.83, 1],
    ],
    7: [
      [0, 0],
      [11.23, 0.33],
      [19.41, 0.7],
      [24.15, 1],
    ],
    10: [
      [0, 0],
      [6.81, 0.42],
      [9.61, 0.58],
      [12.49, 0.65],
      [17.49, 0.8],
      [23.93, 1],
    ],
    11: [
      [0, 0],
      [8.59, 0.3],
      [12.79, 0.54],
      [13.99, 0.78],
      [23.91, 1],
    ],
  },
  en: {
    0: [
      [0, 0],
      [1, 0.22],
      [5.35, 0.35],
      [8.29, 0.62],
      [11.45, 0.88],
      [22.81, 1],
    ],
    1: [
      [0, 0],
      [4.15, 0.28],
      [10.67, 0.46],
      [13.29, 0.64],
      [15.09, 0.78],
      [21.63, 1],
    ],
    6: [
      [0, 0],
      [2.51, 0.32],
      [14.57, 0.64],
      [20.79, 1],
    ],
    7: [
      [0, 0],
      [11.19, 0.33],
      [17.63, 0.7],
      [22.75, 1],
    ],
    10: [
      [0, 0],
      [5.41, 0.42],
      [8.19, 0.58],
      [11.95, 0.65],
      [17.07, 0.8],
      [23.63, 1],
    ],
    11: [
      [0, 0],
      [10.33, 0.3],
      [13.97, 0.54],
      [14.99, 0.78],
      [22.49, 1],
    ],
  },
};
export function particleFilmProgress(chapter: number, chapterTime: number, locale: 'zh' | 'en') {
  const t = finiteClamp(chapterTime, 0, 360),
    anchors = particleVoiceAnchors[locale][chapter];
  if (!anchors) return finiteClamp(t / 24, 0, 1);
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1],
      b = anchors[i];
    if (t <= b[0]) return a[1] + ((t - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
  }
  return 1;
}
/** The retained Wu narration explicitly removes polarization after comparison.
 * This changes the existing angular model rather than leaving a contrary P>0 readout. */
export function particleFilmPolarization(chapterTime: number, locale: 'zh' | 'en') {
  const t = finiteClamp(chapterTime, 0, 360),
    riseEnd = locale === 'zh' ? 6.67 : 5.15,
    removeStart = locale === 'zh' ? 12.33 : 9.51,
    removeEnd = locale === 'zh' ? 13.45 : 10.85;
  return (
    0.9 *
    finiteClamp(t / riseEnd, 0, 1) *
    (1 - finiteClamp((t - removeStart) / (removeEnd - removeStart), 0, 1))
  );
}
