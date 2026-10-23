import { microscopeBessel } from './microscope';
export type Complex = { re: number; im: number };
const TAU = Math.PI * 2;
export const bounded = (v: number, lo: number, hi: number, fallback = lo) =>
  Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
export const smooth = (t: number, start: number, end: number) => {
  const p = bounded((t - start) / (end - start), 0, 1);
  return p * p * (3 - 2 * p);
};
const sq = (z: Complex) => z.re * z.re + z.im * z.im;
export function diffractionInputs(width = 100, wavelength = 550, distance = 1) {
  return {
    a: bounded(width, 30, 800, 100) * 1e-6,
    lambda: bounded(wavelength, 450, 650, 550) * 1e-9,
    L: bounded(distance, 0.5, 2, 1),
  };
}
/** Integrate the SAME paraxial propagator over disjoint subintervals. SI coordinates. */
function intervalField(
  x: number,
  lo: number,
  hi: number,
  lambda: number,
  L: number,
  steps: number,
): Complex {
  const cycles =
    (Math.abs(hi - lo) * (Math.abs(x) + Math.max(Math.abs(lo), Math.abs(hi)))) / (lambda * L);
  const n = 2 * Math.ceil(Math.max(bounded(steps, 8, 4096, 192), 32 * cycles) / 2);
  let re = 0,
    im = 0;
  for (let j = 0; j <= n; j++) {
    const u = lo + ((hi - lo) * j) / n,
      p = (Math.PI * (x - u) ** 2) / (lambda * L),
      w = j === 0 || j === n ? 1 : j % 2 ? 4 : 2;
    re += w * Math.cos(p);
    im += w * Math.sin(p);
  }
  const scale = (hi - lo) / (3 * n * Math.sqrt(lambda * L));
  return { re: re * scale, im: im * scale };
}
export function fresnelSlitField(
  xMm: number,
  width = 100,
  wavelength = 550,
  distance = 1,
  steps = 192,
) {
  const { a, lambda, L } = diffractionInputs(width, wavelength, distance),
    x = bounded(xMm, -15, 15, 0) * 1e-3;
  return intervalField(x, -a / 2, a / 2, lambda, L, steps);
}
export function fresnelSlit(xMm: number, width = 100, wavelength = 550, distance = 1, steps = 192) {
  return sq(fresnelSlitField(xMm, width, wavelength, distance, steps));
}
/** Eight extended bands, not eight point emitters: their exact integral sums to the slit field. */
export function slitContributions(xMm: number, width = 100, wavelength = 550, distance = 1) {
  const { a, lambda, L } = diffractionInputs(width, wavelength, distance),
    x = bounded(xMm, -15, 15, 0) * 1e-3;
  const bands = Array.from({ length: 8 }, (_, id) => ({
    id,
    u: a * ((id + 0.5) / 8 - 0.5),
    ...intervalField(x, a * (id / 8 - 0.5), a * ((id + 1) / 8 - 0.5), lambda, L, 128),
  }));
  const total = bands.reduce((s, b) => ({ re: s.re + b.re, im: s.im + b.im }), { re: 0, im: 0 });
  const common = (Math.PI * x * x) / (lambda * L),
    c = Math.cos(common),
    s = Math.sin(common),
    scale = a / Math.sqrt(lambda * L);
  const relative = bands.map((b) => ({
    ...b,
    re: (b.re * c + b.im * s) / scale,
    im: (b.im * c - b.re * s) / scale,
  }));
  return {
    bands,
    relative,
    total,
    intensity: sq(total),
    fresnelNumber: (a * a) / (lambda * L),
    pairPathNm: (((a / 2) * x) / L) * 1e9,
    fullPathNm: ((a * x) / L) * 1e9,
  };
}
/** Path difference between centers of bands1 and5, with stable subtraction.
 * Paraxial difference drives the Fresnel phase; exact Euclidean lengths diagnose its limit. */
export function bandPathDifference(xMm = 0, width = 100, wavelength = 550, distance = 1) {
  const { a, lambda, L } = diffractionInputs(width, wavelength, distance),
    x = bounded(xMm, -15, 15, 0) * 1e-3,
    u1 = (-7 * a) / 16,
    u5 = a / 16;
  const numerator = (u5 - u1) * (2 * x - u1 - u5),
    r1 = Math.hypot(L, x - u1),
    r5 = Math.hypot(L, x - u5),
    delta = numerator / (2 * L);
  return {
    u1,
    u5,
    r1,
    r5,
    delta,
    exactDelta: numerator / (r1 + r5),
    cycles: delta / lambda,
    phase: (TAU * delta) / lambda,
  };
}
/** Fraunhofer inference. y≈L sin(theta); use as prediction, not an exact finite-z zero. */
export function slitPrediction(width = 100, wavelength = 550, distance = 1) {
  const { a, lambda, L } = diffractionInputs(width, wavelength, distance);
  return {
    firstMm: ((lambda * L) / a) * 1e3,
    theta: Math.asin(lambda / a),
    throughputRelative: a / 100e-6,
    farFieldPeak: (a * a) / (lambda * L),
  };
}
export function farFieldSlit(xMm: number, width = 100, wavelength = 550, distance = 1) {
  const { a, lambda, L } = diffractionInputs(width, wavelength, distance),
    x = bounded(xMm, -15, 15, 0) * 1e-3,
    q = (Math.PI * a * x) / (lambda * L);
  return ((a * a) / (lambda * L)) * (Math.abs(q) < 1e-8 ? 1 : Math.sin(q) / q) ** 2;
}
/** Circular Fresnel aperture field; opaque disk is its Babinet complement. */
export function fresnelCircleField(
  radiusMm: number,
  obstacleRadiusMm = 0.6,
  wavelengthNm = 550,
  distance = 1,
  disk = true,
  steps = 192,
): Complex {
  const r = Math.abs(bounded(radiusMm, -3, 3, 0)) * 1e-3,
    a = bounded(obstacleRadiusMm, 0.1, 1, 0.6) * 1e-3,
    lambda = bounded(wavelengthNm, 450, 650, 550) * 1e-9,
    L = bounded(distance, 0.5, 2, 1),
    K = Math.PI / (lambda * L),
    n = 2 * Math.ceil(bounded(steps, 32, 4096, 192) / 2);
  let re = 0,
    im = 0;
  for (let j = 0; j <= n; j++) {
    const rho = (a * j) / n,
      w = j === 0 || j === n ? 1 : j % 2 ? 4 : 2,
      b = microscopeBessel(0, 2 * K * r * rho),
      p = K * rho * rho;
    re += w * rho * b * Math.cos(p);
    im += w * rho * b * Math.sin(p);
  }
  const scale = (a / (3 * n)) * 2 * K,
    ph = K * r * r,
    c = Math.cos(ph),
    s = Math.sin(ph),
    ar = scale * (re * s + im * c),
    ai = scale * (-re * c + im * s);
  return disk ? { re: 1 - ar, im: -ai } : { re: ar, im: ai };
}
export function fresnelCircle(r: number, a = 0.6, w = 550, L = 1, disk = true, steps = 192) {
  return sq(fresnelCircleField(r, a, w, L, disk, steps));
}
/** Same physical circumference and on-axis target. Phase is paraxial, consistent with Fresnel model.
 * Samples illustrate rotational symmetry only; screen intensity is NOT a sum of point rim emitters. */
export function diskAxisGeometry(radiusMm = 0.6, wavelength = 550, distance = 1) {
  const a = bounded(radiusMm, 0.1, 1, 0.6) * 1e-3,
    lambda = bounded(wavelength, 450, 650, 550) * 1e-9,
    L = bounded(distance, 0.5, 2, 1),
    phase = (Math.PI * a * a) / (lambda * L);
  return {
    radius: a,
    L,
    path: Math.hypot(a, L),
    phase,
    field: { re: Math.cos(phase), im: Math.sin(phase) },
    points: Array.from({ length: 12 }, (_, id) => ({
      id,
      x: a * Math.cos((TAU * id) / 12),
      y: a * Math.sin((TAU * id) / 12),
      z: 0,
      path: Math.hypot(a, L),
      phase,
    })),
  };
}
export function slitProfile(width = 100, white = false, wavelength = 550) {
  return Array.from({ length: 301 }, (_, j) => {
    const x = ((j / 300) * 2 - 1) * 15;
    return {
      x,
      values: (white ? [650, 530, 460] : [wavelength]).map((w) => fresnelSlit(x, width, w)),
    };
  });
}
export const SLIT_EXPOSURE = 100;
export function diffractionDisplayLevel(value: number, exposure = 2.5) {
  return (1 - Math.exp(-bounded(exposure, 0, 100, 2.5) * bounded(value, 0, 100, 0))) ** 0.55;
}
/** Display-only approximate wavelength hue, not a calibrated colorimetric or photometric model.
 * The same exposure/maximum RGB channel encodes intensity. Three independent channels stay unchanged.
 */
export function diffractionDisplayColor(values: number[], exposure = 2.5, wavelength = 550) {
  const b = (n: number) => Math.round(255 * diffractionDisplayLevel(n, exposure));
  if (values.length === 3) return `rgb(${values.map(b).join(',')})`;
  const v = b(values[0] ?? 0);
  const wl = bounded(wavelength, 450, 650, 550),
    anchors = [
      [0.35, 0.45, 1],
      [0.65, 1, 0.75],
      [1, 0.35, 0.28],
    ] as const,
    lower = wl <= 550 ? 0 : 1,
    t = (wl - (450 + 100 * lower)) / 100,
    raw = anchors[lower]!.map((a, i) => a + (anchors[lower + 1]![i]! - a) * t),
    peak = Math.max(...raw);
  return `rgb(${raw.map((c) => Math.round((v * c) / peak)).join(',')})`;
}
export type DiffractionView =
  | 'screen'
  | 'contributions'
  | 'paths'
  | 'prediction'
  | 'colors'
  | 'aperture'
  | 'pencils'
  | 'calipers'
  | 'shadow'
  | 'rim'
  | 'disk';
export type DiffractionShot = {
  mode: 0 | 1;
  view: DiffractionView;
  width: number;
  radius: number;
  wavelength: number;
  white: boolean;
  x: number;
  reveal: boolean;
  question: boolean;
  clock: number;
  baselineWidth: number;
  baselineRadius: number;
};
export const DIFFRACTION_SECONDS = [28, 51.5, 28, 28, 23, 24, 46.5, 28] as const;
/** Actual cue-local ASR word times +0.45s. Explanatory motion is not physical light travel time. */
export const DIFFRACTION_CUTS = {
  zh: {
    wideStart: 11.27,
    wideEnd: 18.47,
    pathStart: 12.55,
    pathEnd: 18.91,
    cancellation: 23.2,
    prediction: 30.45,
    slitReveal: 36.27,
    apertureStart: 14.45,
    apertureEnd: 16.47,
    pencilChange: 6.45,
    pencilReveal: 12.25,
    caliperChange: 4.17,
    caliperReveal: 12.33,
    rim: 9.07,
    diskReveal: 29.57,
    diskChangeStart: 0.45,
    diskChangeEnd: 5.35,
  },
  en: {
    wideStart: 11.09,
    wideEnd: 17.89,
    pathStart: 12.13,
    pathEnd: 17.73,
    cancellation: 22.1,
    prediction: 30.45,
    slitReveal: 36.71,
    apertureStart: 12.07,
    apertureEnd: 14.13,
    pencilChange: 5.83,
    pencilReveal: 10.13,
    caliperChange: 3.95,
    caliperReveal: 12.87,
    rim: 8.09,
    diskReveal: 30.45,
    diskChangeStart: 0.45,
    diskChangeEnd: 4.11,
  },
} as const;
export function diffractionDirector(
  chapter: number,
  time: number,
  locale: 'zh' | 'en' = 'zh',
): DiffractionShot {
  const c = Math.round(bounded(chapter, 0, 7)),
    t = bounded(time, 0, 90),
    cuts = DIFFRACTION_CUTS[locale],
    s: DiffractionShot = {
      mode: c >= 6 ? 1 : 0,
      view: 'screen',
      width: 100,
      radius: 0.6,
      wavelength: 550,
      white: false,
      x: 0,
      reveal: true,
      question: false,
      clock: t * 0.35,
      baselineWidth: 100,
      baselineRadius: 0.4,
    };
  if (c === 0) {
    s.width = Math.round((800 - 700 * smooth(t, cuts.wideStart, cuts.wideEnd)) / 2) * 2;
  }
  if (c === 1) {
    s.view =
      t >= cuts.pathStart && t < cuts.pathEnd
        ? 'paths'
        : t < cuts.prediction
          ? 'contributions'
          : 'prediction';
    s.x = 5.5 * smooth(t, cuts.pathStart, cuts.cancellation);
    s.width = t < cuts.prediction ? 100 : 50;
    s.question = t >= cuts.prediction && t < cuts.slitReveal;
    s.reveal = t < cuts.prediction || t >= cuts.slitReveal;
  }
  if (c === 2) {
    s.view = 'colors';
    s.white = true;
  }
  if (c === 3) {
    s.view = 'aperture';
    s.radius =
      Math.round((0.3 - 0.2 * smooth(t, cuts.apertureStart, cuts.apertureEnd)) * 100) / 100;
  }
  if (c === 4) {
    s.view = 'pencils';
    s.width = t < cuts.pencilChange ? 100 : 50;
    s.question = t >= cuts.pencilChange && t < cuts.pencilReveal;
    s.reveal = !s.question;
  }
  if (c === 5) {
    s.view = 'calipers';
    s.width = 100;
    s.wavelength = t < cuts.caliperChange ? 550 : 650;
    s.question = t >= cuts.caliperChange && t < cuts.caliperReveal;
    s.reveal = !s.question;
  }
  if (c === 6) {
    s.view = t < cuts.rim ? 'shadow' : t < cuts.diskReveal ? 'rim' : 'disk';
    s.question = t < cuts.rim;
    s.reveal = t >= cuts.diskReveal;
  }
  if (c === 7) {
    s.view = 'disk';
    s.radius =
      Math.round((0.4 + 0.4 * smooth(t, cuts.diskChangeStart, cuts.diskChangeEnd)) * 100) / 100;
  }
  return s;
}
