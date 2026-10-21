/** Symmetric lossless film, s polarization, wavelength/thickness in nm.
 * Incident and exit medium are equal. Evanescent/TIR incidence is explicitly outside this model. */
export const filmClamp = (v: number, lo: number, hi: number, fallback = lo) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : fallback));
export type Complex = { re: number; im: number };
export function filmOptics(
  thickness: number,
  wavelength = 589,
  index = 1.333,
  outer = 1,
  angle = 0,
) {
  if (
    ![thickness, wavelength, index, outer, angle].every(Number.isFinite) ||
    thickness < 0 ||
    thickness > 200000 ||
    wavelength < 380 ||
    wavelength > 780 ||
    index < 0.5 ||
    index > 2.5 ||
    outer < 0.5 ||
    outer > 2.5 ||
    Math.abs(angle) > 80
  )
    return null;
  const theta0 = (angle * Math.PI) / 180,
    sin1 = (outer / index) * Math.sin(theta0);
  if (Math.abs(sin1) >= 1) return null;
  const theta1 = Math.asin(sin1),
    cos0 = Math.cos(theta0),
    cos1 = Math.cos(theta1),
    r = (outer * cos0 - index * cos1) / (outer * cos0 + index * cos1),
    opd = 2 * index * thickness * cos1,
    beta = (2 * Math.PI * opd) / wavelength,
    q = { re: Math.cos(beta), im: Math.sin(beta) },
    den = { re: 1 - r * r * q.re, im: -r * r * q.im },
    norm = den.re ** 2 + den.im ** 2,
    numerator = { re: -r * (1 - r * r) * q.re, im: -r * (1 - r * r) * q.im },
    returned = {
      re: (numerator.re * den.re + numerator.im * den.im) / norm,
      im: (numerator.im * den.re - numerator.re * den.im) / norm,
    },
    front = { re: r, im: 0 },
    total = { re: r + returned.re, im: returned.im },
    R = total.re ** 2 + total.im ** 2,
    T = (1 - r * r) ** 2 / norm,
    Rmax = (4 * r * r) / (1 + r * r) ** 2;
  return {
    thickness,
    wavelength,
    index,
    outer,
    angle,
    theta0,
    theta1,
    r,
    front,
    returned,
    total,
    R,
    T,
    Rmax,
    opd,
    beta,
    frontFlip: r < 0,
    backFlip: r > 0,
    firstReturn: { re: numerator.re, im: numerator.im },
    relative: Rmax > 1e-24 ? filmClamp(R / Rmax, 0, 1) : 0,
  };
}
export function fieldAt(field: Complex, phase: number) {
  const t = Number.isFinite(phase) ? phase : 0;
  return field.re * Math.cos(t) - field.im * Math.sin(t);
}
/** Backwards-compatible normal-incidence scalar; invalid indices return NaN-free zero, not a physical TIR prediction. */
export function symmetricFilm(thickness: number, wavelength = 589, index = 1.333, outer = 1) {
  return (
    filmOptics(filmClamp(thickness, 0, 200000), filmClamp(wavelength, 380, 780, 589), index, outer)
      ?.R ?? 0
  );
}
export function soapThickness(y: number, drain = 1) {
  return (30 + 1250 * filmClamp(y, 0, 1)) * filmClamp(drain, 0.15, 1.2, 1);
}
export function wedgeThickness(xMm: number, sheets = 2) {
  return (filmClamp(xMm, 0, 80) / 80) * 40 * filmClamp(sheets, 1, 2, 2) * 1000;
}
export function wedgeSpacing(wavelength = 589, sheets = 2) {
  return (
    filmClamp(wavelength, 380, 780, 589) / (2 * ((40 * filmClamp(sheets, 1, 2, 2) * 1000) / 80))
  );
}
export function brightThickness(
  order: number,
  wavelength = 589,
  index = 1.333,
  outer = 1,
  angle = 0,
) {
  const s = filmOptics(0, wavelength, index, outer, angle);
  return s
    ? ((2 * filmClamp(Math.round(order), 0, 20) + 1) * wavelength) /
        (4 * index * Math.cos(s.theta1))
    : null;
}
export function soapContour(order: number, drain = 1, wavelength = 589, angle = 0) {
  const d = brightThickness(order, wavelength, 1.333, 1, angle);
  return d === null ? null : (d / filmClamp(drain, 0.15, 1.2, 1) - 30) / 1250;
}
/** Display encoding samples three independent wavelengths. Not colorimetry or an observed spectrum. */
export function filmColor(
  thickness: number,
  white = false,
  wavelength = 589,
  index = 1.333,
  outer = 1,
  angle = 0,
) {
  const relative = (w: number) => filmOptics(thickness, w, index, outer, angle)?.relative ?? 0;
  if (white)
    return `rgb(${[650, 530, 460].map((w) => Math.round(10 + 225 * Math.sqrt(relative(w)))).join(',')})`;
  const rgb =
      wavelength > 575 ? [232, 189, 80] : wavelength > 500 ? [122, 190, 122] : [100, 140, 229],
    v = Math.sqrt(relative(filmClamp(wavelength, 380, 780, 589)));
  return `rgb(${rgb.map((c) => Math.round(10 + c * v)).join(',')})`;
}
export type Point = { x: number; y: number };
/** Straight Snell/reflection paths in one uniformly scaled section; D and C share an outgoing wavefront.
 * n1(AB+BC)-n0 AD equals2n1 d cos(theta1), not2n1d/cos(theta1). */
export function filmRayGeometry(
  thickness: number,
  index = 1.333,
  outer = 1,
  angle = 25,
  width = 300,
  height = 172,
) {
  const s = filmOptics(thickness, 589, index, outer, angle);
  if (!s) return null;
  const d = thickness,
    A = { x: 0, y: 0 },
    B = { x: d * Math.tan(s.theta1), y: d },
    C = { x: 2 * d * Math.tan(s.theta1), y: 0 },
    u = { x: Math.sin(s.theta0), y: -Math.cos(s.theta0) },
    extra = C.x * u.x,
    D = { x: u.x * extra, y: u.y * extra },
    leg = 140,
    incoming = { x: -u.x * leg, y: -Math.cos(s.theta0) * leg },
    end1 = { x: D.x + u.x * leg, y: D.y + u.y * leg },
    end2 = { x: C.x + u.x * leg, y: C.y + u.y * leg },
    pts = [A, B, C, D, incoming, end1, end2],
    minX = Math.min(...pts.map((p) => p.x)),
    maxX = Math.max(...pts.map((p) => p.x)),
    minY = Math.min(...pts.map((p) => p.y)),
    maxY = Math.max(...pts.map((p) => p.y)),
    w = filmClamp(width, 260, 720, 300),
    h = filmClamp(height, 140, 240, 172),
    scale = Math.min((w - 92) / Math.max(1, maxX - minX), (h - 32) / Math.max(1, maxY - minY)),
    tx = (w - (maxX - minX) * scale) / 2 - minX * scale,
    ty = 14 - minY * scale,
    map = (p: Point) => ({ x: tx + p.x * scale, y: ty + p.y * scale });
  return {
    A: map(A),
    B: map(B),
    C: map(C),
    D: map(D),
    incoming: map(incoming),
    end1: map(end1),
    end2: map(end2),
    scale,
    top: ty,
    bottom: ty + d * scale,
    referenceLength: extra,
    internalLength: (2 * d) / Math.cos(s.theta1),
    opd: s.opd,
  };
}
export type FilmView = 'observation' | 'paths' | 'sum' | 'colors' | 'wedge';
export type FilmShot = {
  mode: 0 | 1;
  view: FilmView;
  drain: number;
  sheets: number;
  sheetWithdrawal: number;
  wavelength: number;
  white: boolean;
  thickness: number;
  angle: number;
  phase: number;
  reveal: boolean;
  stage: number;
  trackOrder: number;
  pathStep: number;
};
export const FILM_SECONDS = [46, 28, 28, 43.5, 28] as const;
/** Actual chapter-local word times, including the 0.45 s audio lead-in.
 * Only presentation cuts change; optical equations and recorded speech are retained. */
export const FILM_CUTS = {
  zh: {
    soap: {
      paths: 6.33,
      internal: 9.93,
      frontPhase: 14.09,
      backPhase: 16.49,
      wavefront: 19.19,
      sum: 23.55,
      question: 32.15,
      collapse: 35.57,
      dark: 38.59,
    },
    drain: { start: 5.33, end: 10.53, sum: 11.15, collapse: 14.67, dark: 17.47 },
    wedge: {
      paths: 6.95,
      frontPhase: 9.25,
      backPhase: 11.89,
      wavefront: 14.69,
      normal: 18.19,
      question: 33.03,
    },
    remove: { start: 0.45, withdrawn: 1.69, settled: 3.15, reveal: 11.37 },
  },
  en: {
    soap: {
      paths: 6.51,
      internal: 10.31,
      frontPhase: 14.59,
      backPhase: 17.69,
      wavefront: 21.47,
      sum: 23.93,
      question: 33.61,
      collapse: 36.85,
      dark: 39.95,
    },
    drain: { start: 4.65, end: 9.17, sum: 9.37, collapse: 12.25, dark: 14.87 },
    wedge: {
      paths: 7.83,
      frontPhase: 11.69,
      backPhase: 14.53,
      wavefront: 17.27,
      normal: 20.83,
      question: 37.71,
    },
    remove: { start: 0.45, withdrawn: 1.79, settled: 3.37, reveal: 11.47 },
  },
} as const;
export function thinFilmDirector(
  chapter: number,
  progress: number,
  time?: number,
  locale: 'zh' | 'en' = 'zh',
): FilmShot {
  const c = filmClamp(Math.floor(chapter), 0, 4),
    t =
      time === undefined
        ? filmClamp(progress, 0, 1) * FILM_SECONDS[c]!
        : filmClamp(time, 0, FILM_SECONDS[c]!),
    cuts = FILM_CUTS[locale],
    ramp = (a: number, b: number) => {
      const x = filmClamp((t - a) / (b - a), 0, 1);
      return x * x * (3 - 2 * x);
    },
    s: FilmShot = {
      mode: c < 3 ? 0 : 1,
      view: 'observation',
      drain: 0.8,
      sheets: 2,
      sheetWithdrawal: 0,
      wavelength: 589,
      white: false,
      thickness: 589 / (4 * 1.333),
      angle: 0,
      phase: t * 0.85,
      reveal: true,
      stage: 0,
      trackOrder: 1,
      pathStep: 4,
    };
  if (c === 0) {
    const k = cuts.soap;
    s.view = t < k.paths ? 'observation' : t < k.sum ? 'paths' : 'sum';
    s.pathStep =
      t < k.internal ? 0 : t < k.frontPhase ? 1 : t < k.backPhase ? 2 : t < k.wavefront ? 3 : 4;
    s.angle = 25;
    s.trackOrder = 0;
    s.thickness = brightThickness(0, 589, 1.333, 1, s.angle)!;
    if (t >= k.question) {
      s.reveal = t >= k.collapse;
      s.thickness *= 1 - ramp(k.collapse, k.dark);
      s.stage = 1;
    }
  }
  if (c === 1) {
    const k = cuts.drain;
    s.view = t < k.sum ? 'observation' : 'sum';
    s.drain = 0.8 - 0.4 * ramp(k.start, k.end);
    s.thickness =
      t < k.sum ? brightThickness(1)! : (589 / (4 * 1.333)) * (1 - ramp(k.collapse, k.dark));
  }
  if (c === 2) {
    s.view = 'colors';
    s.white = true;
    s.thickness = brightThickness(1)!;
    s.stage = t < 8 ? 0 : 1;
  }
  if (c === 3) {
    const k = cuts.wedge;
    s.view = t < k.paths || t >= k.normal ? 'wedge' : 'paths';
    s.pathStep = t < k.frontPhase ? 1 : t < k.backPhase ? 2 : t < k.wavefront ? 3 : 4;
    s.angle = s.view === 'paths' ? 20 : 0;
    s.thickness = brightThickness(0, 589, 1, 1.5, s.angle)!;
    s.stage = t < k.normal ? 0 : 1;
    s.reveal = t < k.question;
  }
  if (c === 4) {
    const k = cuts.remove;
    s.view = 'wedge';
    s.sheetWithdrawal = ramp(k.start, k.withdrawn);
    s.sheets = 2 - ramp(k.withdrawn, k.settled);
    s.reveal = t >= k.reveal;
    s.stage = 1;
  }
  return s;
}
