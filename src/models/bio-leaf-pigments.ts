import spectra from './bio-pigment-spectra.json';
export type PigmentKey = 'a' | 'b' | 'carotene';
export const pigmentBands = [
  { id: 'carotene', name: '胡萝卜素', color: '#d49b38', mobile: 0.93, amount: 0.12 },
  { id: 'xanthophyll', name: '叶黄素', color: '#d6bd45', mobile: 0.68, amount: 0.13 },
  { id: 'a', name: '叶绿素a', color: '#4b8c7a', mobile: 0.45, amount: 0.5 },
  { id: 'b', name: '叶绿素b', color: '#96a44d', mobile: 0.26, amount: 0.25 },
] as const;
const bounded = (n: number, lo: number, hi: number, fallback = lo) =>
  Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
const smooth = (p: number) => {
  const x = bounded(p, 0, 1);
  return x * x * (3 - 2 * x);
};
/** K = stationary/mobile concentration ratio. Volumes are dimensionless positive ratios. */
export function mobileFraction(K: number, stationaryVolume = 1, mobileVolume = 1) {
  if (
    ![K, stationaryVolume, mobileVolume].every(Number.isFinite) ||
    K < 0 ||
    stationaryVolume <= 0 ||
    mobileVolume <= 0
  )
    throw new RangeError('Finite nonnegative K and positive phase volumes required.');
  return 1 / (1 + (K * stationaryVolume) / mobileVolume);
}
/** Presentation within one solvent-volume step. It changes no equilibrium fraction. */
export function transferFraction(part: number) {
  return smooth((bounded(part, 0, 1) - 0.2) / 0.65);
}
/** An exact conserved population: equilibrate, then transfer the mobile fraction one cell.
 * These are ideal theoretical plates, not paper pores, fitted kinetics or measured Rf values. */
export function partitionPopulation(mobile: number, steps: number, originWidth = 0) {
  const f = bounded(mobile, 0, 1),
    s = bounded(steps, 0, 80),
    n = Math.floor(s),
    u = transferFraction(s - n),
    w = Math.round(bounded(originWidth, 0, 8));
  let q = Array.from({ length: w + 1 }, () => 1 / (w + 1));
  const advance = (v: number[]) =>
    Array.from({ length: v.length + 1 }, (_, j) => (v[j] ?? 0) * (1 - f) + (v[j - 1] ?? 0) * f);
  for (let i = 0; i < n; i++) q = advance(q);
  const next = advance(q),
    bins = next.map((v, j) => ({ cell: j - w / 2, mass: (q[j] ?? 0) * (1 - u) + v * u }));
  const mass = bins.reduce((a, b) => a + b.mass, 0),
    mean = bins.reduce((a, b) => a + b.cell * b.mass, 0) / mass;
  const variance = bins.reduce((a, b) => a + (b.cell - mean) ** 2 * b.mass, 0) / mass;
  return { bins, mass, mean, variance, mobile: f, wholeSteps: n, transfer: u };
}
function randomUnit(id: number, event: number) {
  let x = (Math.imul(id + 173, 0x9e3779b1) ^ Math.imul(event + 31, 0x85ebca6b)) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
/** Same Bernoulli law as partitionPopulation. The selected traces are samples, not a mean. */
export function partitionTracer(id: number, mobile: number, steps: number) {
  const ident = Math.max(0, Math.trunc(Number.isFinite(id) ? id : 0)),
    f = bounded(mobile, 0, 1),
    s = bounded(steps, 0, 80),
    n = Math.floor(s),
    u = s - n;
  let cell = 0;
  for (let event = 0; event < n; event++) if (randomUnit(ident, event) < f) cell++;
  const moving = randomUnit(ident, n) < f,
    wasMoving = n === 0 ? false : randomUnit(ident, n - 1) < f;
  const phaseBlend =
    wasMoving === moving
      ? Number(moving)
      : Number(wasMoving) + (Number(moving) - Number(wasMoving)) * smooth(u / 0.2);
  return {
    id: ident,
    cell,
    position: cell + Number(moving) * transferFraction(u),
    mobile: moving,
    phaseBlend,
    phase: u < 0.2 && wasMoving !== moving ? 'exchange' : moving ? 'mobile' : 'retained',
  };
}
/** Whole-strip geometry is a teaching mapping; sqrt progress suggests a slowing front, not fitted kinetics. */
export function chromatography(progress: number, immersed = false, lineWidth = 1, coelute = false) {
  const p = bounded(progress, 0, 1),
    steps = 40 * Math.sqrt(p),
    w = Math.round(bounded(lineWidth, 1, 8) - 1),
    retained = immersed ? Math.exp(-6 * p) : 1;
  return {
    front: 8 + steps * 4,
    steps,
    valid: !immersed,
    dissolved: 1 - retained,
    bands: pigmentBands.map((b) => {
      const f = coelute && b.id === 'b' ? pigmentBands[2].mobile : b.mobile,
        distribution = partitionPopulation(f, steps, w);
      return {
        ...b,
        mobile: f,
        distribution,
        distance: distribution.mean * 4,
        width: Math.max(2, Math.sqrt(distribution.variance) * 8),
        retained,
        paperMass: b.amount * retained,
        reservoirMass: b.amount * (1 - retained),
      };
    }),
  };
}
/** Raise only the reservoir first; loss starts once it covers the origin. This is
 * qualitative washout, separate from the theoretical-stage migration model. */
export function originImmersion(progress: number, lineWidth = 1) {
  const p = bounded(progress, 0, 1),
    rise = smooth(p / 0.3),
    wash = bounded((p - 0.3) / 0.7, 0, 1),
    reservoir = 1 - Math.exp(-6 * wash);
  const base = chromatography(0, false, lineWidth);
  return {
    ...base,
    liquidY: 240 - 31 * rise,
    wash,
    paper: 1 - reservoir,
    reservoir,
    dissolved: reservoir,
    bands: base.bands.map((b) => ({
      ...b,
      retained: 1 - reservoir,
      paperMass: b.amount * (1 - reservoir),
      reservoirMass: b.amount * reservoir,
    })),
  };
}
export function pigmentTransmission(
  pigment: PigmentKey,
  wavelength: number,
  microMolar = 5,
  pathCm = 1,
) {
  if (!(pigment in spectra)) throw new RangeError('Known measured pigment required.');
  const series = spectra[pigment].extinctionPerMolarCm,
    position = (bounded(wavelength, 400, 700, 550) - 400) / 5,
    i = Math.floor(position),
    epsilon = series[i] + ((series[i + 1] ?? series[i]) - series[i]) * (position - i),
    concentration = bounded(microMolar, 0, 1e6),
    path = bounded(pathCm, 0, 1e6),
    absorbance = epsilon * concentration * 1e-6 * path,
    transmitted = 10 ** -absorbance;
  return { epsilon, absorbance, transmitted, absorbed: 1 - transmitted };
}
export function spectralColor(nm: number) {
  const stops = [
      [400, 113, 88, 170],
      [450, 81, 114, 177],
      [500, 82, 155, 125],
      [550, 133, 170, 73],
      [600, 205, 152, 63],
      [650, 182, 94, 68],
      [700, 138, 63, 65],
    ],
    p = (bounded(nm, 400, 700, 550) - 400) / 50,
    i = Math.min(5, Math.floor(p)),
    f = p - i,
    a = stops[i],
    b = stops[i + 1];
  return `rgb(${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)},${Math.round(a[3] + (b[3] - a[3]) * f)})`;
}
/** Measured 162.5 s film. Anchors include the 0.45 s cue lead-in; no speech stretching. */
export function pigmentDirector(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const t = bounded(seconds, 0, 300),
    en = locale === 'en',
    r = (a: number, b: number) => smooth((t - a) / (b - a));
  if (chapter === 0) {
    const close = en ? 6.4 : 5.85,
      release = en ? 10.1 : 8.5,
      filter = en ? 13.6 : 14.5;
    return {
      shot: t < close ? 'sample' : t < filter ? 'release' : 'filter',
      progress: t < close ? 0 : t < filter ? r(release, filter - 0.4) : r(filter, 18.5),
      nm: 550,
    };
  }
  if (chapter === 1) {
    const raise = en ? 8.6 : 9.05,
      restore = en ? 15.2 : 15,
      width = en ? 17.9 : 18.4;
    return {
      shot: t < raise ? 'origin' : t < restore ? 'immersed' : t < width ? 'restore' : 'width',
      progress:
        t < raise ? 0 : t < restore ? r(raise, restore - 0.4) : t < width ? 0 : r(width, 25),
      nm: 550,
    };
  }
  if (chapter === 2) {
    const close = en ? 4.15 : 3.9,
      whole = en ? 26.3 : 29.05,
      predict = en ? 32.5 : 36.3;
    return {
      shot: t < close ? 'bands' : t < whole ? 'exchange' : t < predict ? 'resolved' : 'coelute',
      progress:
        t < close
          ? r(0, close) * 0.25
          : t < whole
            ? r(7.6, whole - 0.3)
            : t < predict
              ? 0.25 + 0.75 * r(whole, whole + 2.6)
              : 1,
      nm: 550,
    };
  }
  if (chapter === 3) {
    // Keep blue and red simultaneously visible when their short spoken comparison starts.
    const sample = en ? 4.55 : 4.45,
      comparison = en ? 16.15 : 14.15;
    return {
      shot: t < sample ? 'blank' : t < comparison ? 'selected' : 'remaining',
      progress: r(0, 32),
      nm: 430,
    };
  }
  const fixed = en ? 11.25 : 10.6,
    reveal = en ? 25.65 : 24.45;
  return {
    shot: t < fixed ? 'curves' : t < reveal ? 'double' : 'reveal',
    progress: r(en ? 15.5 : 14.8, en ? 19.5 : 19),
    nm: 550,
  };
}

/** A selected type marker follows the drawn funnel, stem and receiving liquid. */
export function filterTracer(id: number, progress: number) {
  const ident = Math.round(bounded(id, 0, 7)),
    u = bounded((bounded(progress, 0, 1) - ident * 0.035) / 0.6, 0, 1);
  const points = [
      { x: 105 + (ident % 4) * 30, y: 96 + Math.floor(ident / 4) * 16 },
      { x: 150, y: 156 },
      { x: 150, y: 204 },
      { x: 112 + (ident % 4) * 24, y: 223 + Math.floor(ident / 4) * 11 },
    ],
    cuts = [0, 0.45, 0.78, 1];
  const k = u < cuts[1] ? 0 : u < cuts[2] ? 1 : 2,
    a = points[k],
    b = points[k + 1],
    f = (u - cuts[k]) / (cuts[k + 1] - cuts[k]);
  return { id: ident, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, progress: u };
}
