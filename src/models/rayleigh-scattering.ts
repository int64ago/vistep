export type RayleighSample = {
  wavelength: number;
  source: number;
  direct: number;
  removed: number;
  toward: number;
};
/** Relative cross-section in the small-particle, nonabsorbing Rayleigh limit. */
export function rayleighCross(wavelength: number) {
  if (!Number.isFinite(wavelength) || wavelength <= 0) throw new RangeError('Invalid wavelength');
  return (550 / wavelength) ** 4;
}
/** Unpolarized angular density, normalized to integrate to one over 4pi steradians. */
export function rayleighPhase(angle: number) {
  return (3 * (1 + Math.cos((angle * Math.PI) / 180) ** 2)) / (16 * Math.PI);
}
export function rayleighPlanck(wavelength: number, temperature = 5778) {
  if (!Number.isFinite(temperature) || temperature <= 0)
    throw new RangeError('Invalid temperature');
  rayleighCross(wavelength);
  return (
    ((550 / wavelength) ** 5 * Math.expm1(1.438776877e7 / (550 * temperature))) /
    Math.expm1(1.438776877e7 / (wavelength * temperature))
  );
}
export function rayleighSpectrum({
  column = 1,
  opticalDepth = 0.12,
  angle = 90,
  mono = false,
  wavelength = 650,
}: {
  column?: number;
  opticalDepth?: number;
  angle?: number;
  mono?: boolean;
  wavelength?: number;
} = {}) {
  if (
    ![column, opticalDepth, angle, wavelength].every(Number.isFinite) ||
    column < 0 ||
    opticalDepth < 0 ||
    angle < 0 ||
    angle > 180 ||
    wavelength < 380 ||
    wavelength > 780
  )
    throw new RangeError('Invalid scattering column');
  const selected = 5 * Math.round(wavelength / 5);
  return Array.from({ length: 81 }, (_, i) => {
    const wavelength = 380 + 5 * i,
      source = mono ? (wavelength === selected ? 1 : 0) : rayleighPlanck(wavelength),
      direct = source * Math.exp(-opticalDepth * column * rayleighCross(wavelength)),
      removed = source - direct;
    return { wavelength, source, direct, removed, toward: removed * rayleighPhase(angle) };
  });
}
/** Wyman, Sloan & Shirley (2013), Eq4/Table1: CIE1931 piecewise Gaussian fits. */
export function rayleighCie(w: number) {
  const g = (a: number, b: number, l: number, r: number) =>
    a * Math.exp(-0.5 * ((w - b) * (w < b ? l : r)) ** 2);
  return [
    g(0.362, 442, 0.0624, 0.0374) +
      g(1.056, 599.8, 0.0264, 0.0323) -
      g(0.065, 501.1, 0.049, 0.0382),
    g(0.821, 568.8, 0.0213, 0.0247) + g(0.286, 530.9, 0.0613, 0.0322),
    g(1.217, 437, 0.0845, 0.0278) + g(0.681, 459, 0.0385, 0.0725),
  ] as [number, number, number];
}
/** Relative sRGB swatch; independent normalization exposes hue, not absolute brightness. */
export function rayleighColor(
  spectrum: RayleighSample[],
  kind: 'source' | 'direct' | 'removed' | 'toward',
) {
  const xyz = [0, 0, 0];
  for (const sample of spectrum) {
    const cmf = rayleighCie(sample.wavelength);
    for (let j = 0; j < 3; j++) xyz[j] += cmf[j] * sample[kind];
  }
  const [X, Y, Z] = xyz,
    linear = [
      3.2406 * X - 1.5372 * Y - 0.4986 * Z,
      -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
      0.0557 * X - 0.204 * Y + 1.057 * Z,
    ].map((v) => Math.max(0, v)),
    max = Math.max(...linear);
  if (max === 0) return '#111b28';
  const rgb = linear.map((v) => {
    const c = v / max;
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
  });
  return `rgb(${rgb.join(' ')})`;
}
export function rayleighShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    column: chapter === 3 ? 1 + 7 * p : 1,
    angle: chapter === 2 ? 180 * p : 90,
    mono: chapter === 5,
    wavelength: 650,
    view: chapter === 1 ? 'ratio' : chapter === 2 ? 'phase' : chapter === 4 ? 'vision' : 'spectrum',
  } as const;
}
