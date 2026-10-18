import { finiteClamp } from './modern-labs';
export function weberResponse(frequency = 1660, strain = 1e-18) {
  const inputStrain = finiteClamp(Number.isFinite(strain) ? strain : 0, -1e-14, 1e-14),
    f = finiteClamp(Number.isFinite(frequency) ? frequency : 1660, 1500, 1800),
    f0 = 1660,
    Q = 1000,
    L = 1.5,
    w = 2 * Math.PI * f,
    w0 = 2 * Math.PI * f0;
  return {
    amplitude:
      (L * Math.abs(inputStrain) * w * w) / (2 * Math.hypot(w0 * w0 - w * w, (w * w0) / Q)),
    frequency: f,
    Q,
    L,
  };
}
export function binaryPulsar(years = 30, phase = 0.2) {
  const m1 = 1.4398,
    m2 = 1.3886,
    e = 0.6171334,
    P = 27906.98,
    Ts = 4.925490947e-6,
    mu = 1.3271244e20 * (m1 + m2),
    a = (mu * (P / (2 * Math.PI)) ** 2) ** (1 / 3),
    n = (2 * Math.PI) / P;
  const orbitPhase = Number.isFinite(phase) ? ((phase % 1) + 1) % 1 : 0;
  let E = 2 * Math.PI * orbitPhase;
  for (let j = 0; j < 12; j++)
    E -= (E - e * Math.sin(E) - 2 * Math.PI * orbitPhase) / (1 - e * Math.cos(E));
  const pdot =
      (((((-192 * Math.PI) / 5) * ((2 * Math.PI * Ts) / P) ** (5 / 3) * (m1 * m2)) /
        (m1 + m2) ** (1 / 3)) *
        (1 + (73 * e * e) / 24 + (37 * e ** 4) / 96)) /
      (1 - e * e) ** 3.5,
    t = finiteClamp(years, 0, 50) * 365.25 * 86400,
    // The illustrated observer is to the right (+x); positive radial velocity is recession.
    vr = (((a * m2) / (m1 + m2)) * Math.sin(E) * n) / (1 - e * Math.cos(E));
  return {
    pdot,
    advance: ((0.5 * pdot) / P) * t * t,
    observedPulseMs: 59.03 * (1 + vr / 299792458),
    x: Math.cos(E) - e,
    y: Math.sqrt(1 - e * e) * Math.sin(E),
    e,
    a,
    recessionVelocity: vr,
    orbitPhase,
  };
}
/** Leading-order inspiral only. No merger, ringdown, noise or detector antenna response. */
export function inspiral(time: number) {
  const t = finiteClamp(time, 0, 0.295),
    tau = 0.3 - t,
    mc = 28 * 4.925490947e-6,
    f = (5 / (256 * Math.PI ** (8 / 3) * mc ** (5 / 3) * tau)) ** (3 / 8),
    phase = ((-16 * Math.PI) / 5) * f * tau,
    envelope = 1e-21 * (f / 100) ** (2 / 3);
  return { frequency: f, strain: envelope * Math.cos(phase), envelope, phase };
}
export function interferometerStrain(h: number) {
  const safeH = finiteClamp(Number.isFinite(h) ? h : 0, -1e-6, 1e-6),
    L = 4000,
    lambda = 1064e-9;
  return {
    dx: (L * safeH) / 2,
    dy: (-L * safeH) / 2,
    difference: L * safeH,
    phase: (4 * Math.PI * L * safeH) / lambda,
  };
}

export const GW_WAVELENGTH = 1064e-9;
/** Equal-arm, quasi-static Michelson; perturbations stay separate from nominal 4 km. */
export function michelsonReadout(dx = 0, dy = 0, bias = Math.PI / 2) {
  const x = finiteClamp(Number.isFinite(dx) ? dx : 0, -GW_WAVELENGTH, GW_WAVELENGTH),
    y = finiteClamp(Number.isFinite(dy) ? dy : 0, -GW_WAVELENGTH, GW_WAVELENGTH),
    operatingPhase = finiteClamp(bias, 0, Math.PI),
    difference = x - y,
    phase = (4 * Math.PI * difference) / GW_WAVELENGTH,
    totalPhase = operatingPhase + phase,
    baseline = Math.sin(operatingPhase / 2) ** 2,
    power = Math.sin(totalPhase / 2) ** 2,
    // Stable exact subtraction; tiny gravitational signals must not be rounded away.
    deltaPower = Math.sin(operatingPhase + phase / 2) * Math.sin(phase / 2);
  return {
    dx: x,
    dy: y,
    difference,
    phase,
    totalPhase,
    bias: operatingPhase,
    baseline,
    power,
    deltaPower,
  };
}
export function returningFields(
  carrierPhase: number,
  differentialPhase: number,
  bias = Math.PI / 2,
) {
  const u = Number.isFinite(carrierPhase) ? carrierPhase : 0,
    d = Number.isFinite(differentialPhase) ? differentialPhase : 0,
    b = finiteClamp(bias, 0, Math.PI),
    x = 0.5 * Math.cos(u),
    y = -0.5 * Math.cos(u + b + d);
  return { x, y, sum: x + y };
}
export function orbitalEnergyComparison(aRatio: number) {
  const ratio = finiteClamp(aRatio, 0.6, 1);
  return {
    aRatio: ratio,
    bindingMagnitudeRatio: 1 / ratio,
    periodRatio: ratio ** 1.5,
    frequencyRatio: ratio ** -1.5,
  };
}
export type BarSignal = 'local' | 'common' | 'background';
/** Explicit synthetic signals, fixed under playback and controls. Not historical candidates. */
export function barTrace(t: number, detector: 0 | 1, kind: BarSignal) {
  const time = finiteClamp(t, 0, 1),
    noise = 0.14 * Math.sin(time * 5 * (detector ? 4.3 : 7.1) + detector),
    impulse = Math.exp(-3 * time) * Math.sin(2 * Math.PI * 5 * time),
    signal = kind === 'common' || (kind === 'local' && detector === 0) ? impulse : 0;
  return { background: noise, signal, total: noise + signal };
}
const smooth = (p: number) => {
  const x = finiteClamp(p, 0, 1);
  return x * x * (3 - 2 * x);
};
/** Teaching sequence: a prescribed slow contraction, integrated Kepler angular rate. */
export function orbitalEnergySequence(progress: number) {
  const p = finiteClamp(progress, 0, 1),
    steps = 128;
  let turns = 0;
  for (let i = 0; i < steps; i++) {
    const t = ((i + 0.5) * p) / steps;
    turns += (2 * (1 - 0.1 * smooth(t)) ** -1.5 * p) / steps;
  }
  return { ...orbitalEnergyComparison(1 - 0.1 * smooth(p)), turns };
}
export function gravityShot(chapter: number, progress: number) {
  const p = finiteClamp(progress, 0, 1),
    c = Math.round(finiteClamp(chapter, 0, 5));
  const shot =
    c === 0
      ? 'bar'
      : c === 1
        ? 'coincidence'
        : c === 2
          ? 'clock'
          : c === 3
            ? p >= 0.2 && p < 0.45
              ? 'energy'
              : 'records'
            : c === 4
              ? p < 0.18
                ? 'paths'
                : p >= 0.82
                  ? 'scale'
                  : 'phase'
              : p >= 0.63 && p < 0.84
                ? 'chirp'
                : 'sites';
  const frequency = p < 0.27 ? 1600 : p < 0.72 ? 1660 : 1720;
  const barKind: BarSignal = p < 0.35 ? 'local' : p < 0.75 ? 'common' : 'background';
  const common = c === 4 && p >= 0.58 && p < 0.65;
  const prediction = c === 4 && p >= 0.47 && p < 0.55;
  let motionXNm = 0,
    motionYNm = 0;
  if (c === 4 && p >= 0.18 && p < 0.82) {
    motionXNm = 66.5 * smooth((p - 0.18) / 0.2);
    motionYNm = -motionXNm;
    // Reset the previous differential trial, then actually move BOTH mirrors together.
    if (p >= 0.55 && p < 0.58) {
      motionXNm = 66.5 * (1 - smooth((p - 0.55) / 0.03));
      motionYNm = -motionXNm;
    } else if (p >= 0.58 && p < 0.65) {
      motionXNm = 66.5 * smooth((p - 0.58) / 0.03);
      motionYNm = motionXNm;
    } else if (p >= 0.65) {
      motionXNm = 66.5 - 133 * smooth((p - 0.65) / 0.12);
      motionYNm = 66.5;
    }
  }
  const displacementNm = motionXNm,
    energy = orbitalEnergySequence(c === 3 ? (p - 0.2) / 0.25 : (p - 0.63) / 0.21);
  return {
    chapter: c,
    p,
    shot,
    frequency,
    barKind,
    common,
    prediction,
    displacementNm,
    motionXNm,
    motionYNm,
    publishedCurve: p >= 0.45,
    observationsThrough: p < 0.62 ? 1992.5 : 1992.5 + (2013 - 1992.5) * smooth((p - 0.62) / 0.22),
    aligned: p >= 0.24,
    alignmentProgress: smooth((p - 0.24) / 0.16),
    showBoth: p >= 0.12,
    energyRatio: energy.aRatio,
    energyTurns: energy.turns,
  };
}
export function gravityInitialMode(variant?: string) {
  return variant === 'required-1-binary-pulsar'
    ? 1
    : variant === 'required-1-ligo-appendix' || variant === 'required-2-ligo'
      ? 2
      : 0;
}

/** Actual chapter-relative seconds, including the 0.45 s voice lead-in.
 * Source: batch-7-timed-speech, zh fa6d5a63bb88 / en 0c79fbfb7265.
 * These anchors only direct explanatory states; official measurements remain fixed.
 */
export const GRAVITY_CUE_ANCHORS: Record<
  'zh' | 'en',
  readonly (readonly (readonly [number, number])[])[]
> = {
  zh: [
    [
      [0, 0],
      [8.05, 0.27],
      [19.2, 0.72],
      [28, 1],
    ],
    [
      [0, 0],
      [8.5, 0.35],
      [15.65, 0.75],
      [28, 1],
    ],
    [
      [0, 0],
      [28, 1],
    ],
    [
      [0, 0],
      [10.45, 0.2],
      [17.32, 0.45],
      [21.97, 0.5],
      [26.15, 0.62],
      [28.5, 0.84],
      [40.5, 1],
    ],
    [
      [0, 0],
      [6.3, 0.18],
      [12, 0.18],
      [18.2, 0.38],
      [22.6, 0.47],
      [26.05, 0.55],
      [26.5, 0.58],
      [28.2, 0.61],
      [30.7, 0.65],
      [34.3, 0.77],
      [34.5, 0.82],
      [51, 1],
    ],
    [
      [0, 0],
      [6, 0.12],
      [13.65, 0.24],
      [17.7, 0.4],
      [22.2, 0.63],
      [33.9, 0.84],
      [52.5, 1],
    ],
  ],
  en: [
    [
      [0, 0],
      [8.05, 0.27],
      [19.2, 0.72],
      [28, 1],
    ],
    [
      [0, 0],
      [7.1, 0.35],
      [13.5, 0.75],
      [28, 1],
    ],
    [
      [0, 0],
      [28, 1],
    ],
    [
      [0, 0],
      [9.35, 0.2],
      [15.85, 0.45],
      [20.31, 0.5],
      [23.17, 0.62],
      [25.55, 0.84],
      [40.5, 1],
    ],
    [
      [0, 0],
      [7.15, 0.18],
      [13.55, 0.18],
      [18.25, 0.38],
      [21.7, 0.47],
      [25.25, 0.55],
      [25.55, 0.58],
      [27.15, 0.61],
      [31.35, 0.65],
      [34.9, 0.77],
      [35.1, 0.82],
      [51, 1],
    ],
    [
      [0, 0],
      [6.8, 0.12],
      [12.2, 0.24],
      [16.6, 0.4],
      [23.45, 0.63],
      [36.5, 0.84],
      [52.5, 1],
    ],
  ],
};
export function gravityDirector(chapter: number, chapterTime: number, locale: 'zh' | 'en') {
  const c = Math.round(finiteClamp(chapter, 0, 5)),
    anchors = GRAVITY_CUE_ANCHORS[locale][c]!,
    time = finiteClamp(chapterTime, 0, anchors.at(-1)![0]);
  let index = 0;
  while (index < anchors.length - 2 && time > anchors[index + 1]![0]) index++;
  const [t0, p0] = anchors[index]!,
    [t1, p1] = anchors[index + 1]!;
  return gravityShot(c, p0 + ((time - t0) / (t1 - t0)) * (p1 - p0));
}
