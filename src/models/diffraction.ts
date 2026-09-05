/** Uniform, monochromatic, normally incident scalar single-slit Fraunhofer model.
 * All computation uses SI; boundary inputs and screen readouts carry explicit units.
 * The angular aperture factor is normalized to its own on-axis field. It is not
 * a throughput or absolute radiometric prediction. References: Fitzpatrick,
 * Wave Optics §10.6 (UT Austin); Feynman I.30; MIT 2.71 Fourier optics.
 */
export type DiffractionParameters = { slitUm: number; wavelengthNm: number; distanceM: number };
export type DiffractionComplex = { re: number; im: number };
export type DiffractionSample = {
  yMm: number;
  theta: number;
  beta: number;
  amplitude: number;
  intensity: number;
};
export type DiffractionView =
  'aperture' | 'sum' | 'cancel' | 'square' | 'width' | 'wavelength' | 'distance' | 'limits';
export const DIFFRACTION_DEFAULT: DiffractionParameters = {
  slitUm: 80,
  wavelengthNm: 550,
  distanceM: 1,
};
export const DIFFRACTION_DURATION = 176;
export const DIFFRACTION_SIDE_PEAK_BETA = 4.493409457909064;
/** Deliberately conservative teaching guard; not an exact physical boundary.
 * N uses the FULL slit width (some Fresnel-number definitions use half-width).
 */
export const DIFFRACTION_GUARD = {
  maxFullWidthFresnel: 0.1,
  minSlitWavelengths: 20,
  maxScreenSlope: 0.12,
};
const finite = (n: number) => {
  if (!Number.isFinite(n)) throw new RangeError('Diffraction inputs must be finite');
  return n;
};
const positive = (n: number) => {
  if (finite(n) <= 0) throw new RangeError('Diffraction dimensions must be positive');
  return n;
};
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, finite(n)));

export function diffractionUnits(p: DiffractionParameters) {
  return {
    a: positive(p.slitUm) * 1e-6,
    lambda: positive(p.wavelengthNm) * 1e-9,
    L: positive(p.distanceM),
  };
}
export function diffractionSinc(x: number) {
  finite(x);
  if (Math.abs(x) < 1e-4) {
    const xx = x * x;
    return 1 - xx / 6 + (xx * xx) / 120 - (xx * xx * xx) / 5040;
  }
  const value = Math.sin(x) / x;
  return Math.abs(value) < 1e-14 ? 0 : value;
}
export function diffractionAt(p: DiffractionParameters, yMm: number): DiffractionSample {
  const { a, lambda, L } = diffractionUnits(p),
    y = finite(yMm) * 1e-3;
  const theta = Math.atan2(y, L),
    beta = ((Math.PI * a) / lambda) * Math.sin(theta);
  const amplitude = diffractionSinc(beta);
  return { yMm, theta, beta, amplitude, intensity: amplitude * amplitude };
}
/** Algebraic finite-screen zero. null also covers a grazing (90°) zero, which
 * lies at infinity on a plane screen. Not an assertion of scalar validity.
 */
export function diffractionMinimum(p: DiffractionParameters, order = 1) {
  const { a, lambda, L } = diffractionUnits(p);
  if (!Number.isInteger(order) || order === 0)
    throw new RangeError('Minimum order must be a nonzero integer');
  const s = (order * lambda) / a;
  if (Math.abs(s) >= 1) return null;
  const theta = Math.asin(s);
  return { order, theta, yMm: L * Math.tan(theta) * 1e3 };
}
export function diffractionPositionForBeta(p: DiffractionParameters, beta: number) {
  const { a, lambda, L } = diffractionUnits(p),
    s = (finite(beta) * lambda) / (Math.PI * a);
  return Math.abs(s) < 1 ? ((L * s) / Math.sqrt(1 - s * s)) * 1e3 : null;
}
export function diffractionValidity(p: DiffractionParameters) {
  const { a, lambda, L } = diffractionUnits(p);
  const fullWidthFresnel = (a * a) / (lambda * L);
  const slitWavelengths = a / lambda;
  // Exact extra on-axis path at an edge, evaluated without subtractive cancellation.
  const edge = a / 2,
    edgePath = (edge * edge) / (Math.hypot(L, edge) + L);
  return {
    fullWidthFresnel,
    slitWavelengths,
    edgePhaseError: (2 * Math.PI * edgePath) / lambda,
    farField: fullWidthFresnel <= DIFFRACTION_GUARD.maxFullWidthFresnel,
    scalar: slitWavelengths >= DIFFRACTION_GUARD.minSlitWavelengths,
    usable:
      fullWidthFresnel <= DIFFRACTION_GUARD.maxFullWidthFresnel &&
      slitWavelengths >= DIFFRACTION_GUARD.minSlitWavelengths,
  };
}
/** Exact normalized integral over an aperture subinterval. lo and hi are
 * fractions of the full slit, within [-1/2, 1/2]. Each displayed arrow is a
 * finite STRIP integral, not a point source or a numerical photon.
 */
export function diffractionContribution(beta: number, lo: number, hi: number): DiffractionComplex {
  finite(beta);
  finite(lo);
  finite(hi);
  if (lo < -0.5 || hi > 0.5 || lo > hi) throw new RangeError('Contribution interval outside slit');
  const length = hi - lo,
    magnitude = length * diffractionSinc(beta * length),
    phase = -beta * (hi + lo);
  return { re: magnitude * Math.cos(phase), im: magnitude * Math.sin(phase) };
}
export function diffractionContributions(beta: number, count = 8) {
  if (!Number.isInteger(count) || count < 2 || count > 128)
    throw new RangeError('Use 2 to 128 aperture strips');
  let sum: DiffractionComplex = { re: 0, im: 0 };
  return Array.from({ length: count }, (_, i) => {
    const lo = i / count - 0.5,
      hi = (i + 1) / count - 0.5;
    const vector = diffractionContribution(beta, lo, hi),
      start = sum;
    sum = { re: start.re + vector.re, im: start.im + vector.im };
    return { lo, hi, midpoint: (lo + hi) / 2, vector, start, end: sum };
  });
}
export function diffractionPartial(beta: number, fraction: number) {
  return diffractionContribution(beta, -0.5, -0.5 + clamp(fraction, 0, 1));
}
export function diffractionState(parameters: DiffractionParameters = DIFFRACTION_DEFAULT, yMm = 0) {
  const p = { ...parameters },
    units = diffractionUnits(p),
    validity = diffractionValidity(p);
  const spanMm = Math.min(25, units.L * DIFFRACTION_GUARD.maxScreenSlope * 1e3);
  const probeMm = clamp(yMm, -spanMm, spanMm),
    sample = diffractionAt(p, probeMm);
  return {
    parameters: p,
    units,
    validity,
    spanMm,
    sample,
    firstMinimum: diffractionMinimum(p),
    contributions: diffractionContributions(sample.beta),
    pathDifferenceWavelengths: (units.a * Math.sin(sample.theta)) / units.lambda,
  };
}
export type DiffractionState = ReturnType<typeof diffractionState>;
export function diffractionProfile(state: DiffractionState, count = 401) {
  if (!Number.isInteger(count) || count < 3 || count > 641)
    throw new RangeError('Profile sampling is bounded to 3–641');
  if (!state.validity.usable) return [];
  return Array.from({ length: count }, (_, i) =>
    diffractionAt(state.parameters, ((2 * i) / (count - 1) - 1) * state.spanMm),
  );
}
/** Illustrative wavelength colors, not a calibrated spectral-to-display model. */
export function diffractionColor(wavelengthNm: number) {
  const n = clamp(wavelengthNm, 450, 650),
    a = n <= 550 ? [75, 116, 167] : [95, 138, 88],
    b = n <= 550 ? [95, 138, 88] : [188, 94, 66];
  const f = n <= 550 ? (n - 450) / 100 : (n - 550) / 100;
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',')})`;
}
const ease = (p: number) => {
  const v = clamp(p, 0, 1);
  return v * v * (3 - 2 * v);
};
const move = (p: number, a: number, b: number, lo: number, hi: number) =>
  a + (b - a) * ease((p - lo) / (hi - lo));
export function diffractionShot(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 7)),
    p = clamp(progress, 0, 1);
  const view = (
    ['aperture', 'sum', 'cancel', 'square', 'width', 'wavelength', 'distance', 'limits'] as const
  )[c];
  const parameters = { ...DIFFRACTION_DEFAULT };
  let beta = 0,
    reveal = 1,
    mathematicalRatio: number | null = null;
  if (c === 1) reveal = move(p, 0, 1, 0.12, 0.8);
  if (c === 2) beta = Math.PI * move(p, 0, 1, 0.12, 0.62);
  if (c === 3) beta = move(p, Math.PI, DIFFRACTION_SIDE_PEAK_BETA, 0.12, 0.69);
  if (c === 4) {
    parameters.slitUm = move(p, 80, 40, 0.23, 0.84);
    beta = move(p, DIFFRACTION_SIDE_PEAK_BETA, Math.PI, 0, 0.18);
  }
  if (c === 5) {
    parameters.slitUm = 40;
    parameters.wavelengthNm =
      p < 0.45 ? move(p, 550, 450, 0.1, 0.39) : move(p, 450, 650, 0.5, 0.86);
    beta = Math.PI;
  }
  if (c >= 6) {
    parameters.slitUm = 40;
    parameters.wavelengthNm = 650;
    beta = Math.PI;
  }
  if (c === 6)
    parameters.distanceM = p < 0.55 ? move(p, 1, 0.005, 0.12, 0.46) : move(p, 0.005, 1, 0.65, 0.92);
  if (c === 7) {
    mathematicalRatio =
      p < 0.48
        ? move(p, 0.01625, 0.5, 0.1, 0.44)
        : p < 0.73
          ? move(p, 0.5, 1, 0.51, 0.69)
          : move(p, 1, 1.2, 0.77, 0.92);
    // The physical apparatus remains in its safe configuration. The final shot
    // explicitly inspects only the algebraic zero condition, not a subwavelength
    // diffraction pattern outside scalar validity.
  }
  const state = diffractionState(parameters, diffractionPositionForBeta(parameters, beta) ?? 0);
  return {
    state,
    view,
    reveal,
    activePair: c === 2 && p > 0.65 ? Math.min(3, Math.floor((p - 0.65) / 0.0875)) : -1,
    mathematicalRatio,
    mathematicalAngle:
      mathematicalRatio !== null && mathematicalRatio <= 1 ? Math.asin(mathematicalRatio) : null,
  };
}
export const diffractionPath = (points: { x: number; y: number }[]) =>
  points.map((v, i) => `${i ? 'L' : 'M'}${v.x.toFixed(3)},${v.y.toFixed(3)}`).join(' ');
