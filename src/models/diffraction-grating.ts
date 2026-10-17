export type GratingOptions = {
  slits?: number;
  spacing?: number;
  width?: number;
  wavelength?: number;
};
/** Closed-form equivalent for raster/curve samples; avoids allocating a phasor chain. */
export function gratingIntensity(sine: number, options: GratingOptions = {}) {
  const { slits: N = 12, spacing: d = 3000, width: a = 500, wavelength: lambda = 550 } = options;
  const halfPhase = (Math.PI * d * sine) / lambda;
  const denominator = Math.sin(halfPhase);
  const interference =
    Math.abs(denominator) < 1e-10 ? 1 : (Math.sin(N * halfPhase) / (N * denominator)) ** 2;
  const beta = (Math.PI * a * sine) / lambda;
  const envelope = Math.abs(beta) < 1e-10 ? 1 : (Math.sin(beta) / beta) ** 2;
  return { normalized: envelope * interference, envelope };
}
/** Scalar Fraunhofer pattern: identical uniformly illuminated rectangular slits, nm units. */
export function grating(sine: number, options: GratingOptions = {}) {
  const { slits: N = 12, spacing: d = 3000, width: a = 500, wavelength: lambda = 550 } = options;
  if (
    ![sine, N, d, a, lambda].every(Number.isFinite) ||
    Math.abs(sine) > 1 ||
    !Number.isInteger(N) ||
    N < 1 ||
    N > 100 ||
    d <= 0 ||
    a <= 0 ||
    a > d ||
    lambda <= 0
  )
    throw new RangeError('Invalid grating parameters');
  const phase = (2 * Math.PI * d * sine) / lambda,
    beta = (Math.PI * a * sine) / lambda;
  let re = 0,
    im = 0;
  const phasors = [{ x: 0, y: 0 }];
  for (let j = 0; j < N; j++) {
    re += Math.cos(j * phase);
    im += Math.sin(j * phase);
    phasors.push({ x: re / N, y: im / N });
  }
  const envelope = Math.abs(beta) < 1e-10 ? 1 : (Math.sin(beta) / beta) ** 2,
    interference = (re * re + im * im) / (N * N);
  return {
    normalized: envelope * interference,
    envelope,
    interference,
    phase,
    phasors,
    peak: N * N,
    amplitude: Math.hypot(re, im),
  };
}
export function gratingOrders(spacing = 3000, wavelength = 550) {
  if (!Number.isFinite(spacing) || !Number.isFinite(wavelength) || spacing <= 0 || wavelength <= 0)
    throw new RangeError('Invalid order parameters');
  const m = Math.floor(spacing / wavelength);
  return Array.from({ length: 2 * m + 1 }, (_, i) => {
    const order = i - m;
    return {
      order,
      sine: (order * wavelength) / spacing,
      angle: (Math.asin((order * wavelength) / spacing) * 180) / Math.PI,
    };
  });
}
export function gratingShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const slits = chapter === 0 ? 2 : chapter === 1 ? 2 + Math.round(10 * p) : 12,
    spacing = chapter === 5 ? 3000 - 1500 * p : 3000,
    width = chapter === 6 ? 1500 : 500,
    wavelength = 550,
    sine =
      chapter === 3
        ? ((1 + Math.min(1, p * 2) / slits) * wavelength) / spacing
        : chapter === 6
          ? (2 * wavelength) / spacing
          : wavelength / spacing;
  return { slits, spacing, width, wavelength, sine, white: chapter === 4 };
}
