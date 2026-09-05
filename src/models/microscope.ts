/** Finite-conjugate microscope: mm for rays, µm for specimen/defocus/wavelength.
 * Ideal thin lenses in air; scalar paraxial diffraction through the SAME pupil.
 * NA is the paraxial r/u value (not a high-NA/vectorial objective model).
 */
export type MicroscopeConfig = {
  focus: number;
  na: number;
  ocular: number;
  separation: number;
  layers: boolean;
};
export const microscopeDefaults: MicroscopeConfig = {
  focus: 0,
  na: 0.2,
  ocular: 10,
  separation: 2.4,
  layers: false,
};
export const microscopeOptics = {
  objective: 8,
  image: 160,
  wavelength: 0.55,
  referenceDistance: 250,
};
export const microscopeObjectDistance =
  1 / (1 / microscopeOptics.objective - 1 / microscopeOptics.image);
export const microscopeNominalMagnification = -microscopeOptics.image / microscopeObjectDistance;
export const microscopeClamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export type MicroscopeMatrix = [number, number, number, number];
export const microscopePropagation = (distance: number): MicroscopeMatrix => [1, distance, 0, 1];
export const microscopeLens = (f: number): MicroscopeMatrix => {
  if (!Number.isFinite(f) || f === 0) throw new RangeError('Finite nonzero focal length required');
  return [1, 0, -1 / f, 1];
};
export const microscopeMultiply = (a: MicroscopeMatrix, b: MicroscopeMatrix): MicroscopeMatrix => [
  a[0] * b[0] + a[1] * b[2],
  a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2],
  a[2] * b[1] + a[3] * b[3],
];
export const microscopeTransfer = (matrix: MicroscopeMatrix, height: number, slope: number) => ({
  height: matrix[0] * height + matrix[1] * slope,
  slope: matrix[2] * height + matrix[3] * slope,
});
export function validateMicroscope(c: MicroscopeConfig) {
  if (
    ![c.focus, c.na, c.ocular, c.separation].every(Number.isFinite) ||
    Math.abs(c.focus) > 40 ||
    c.na < 0.06 ||
    c.na > 0.25 ||
    c.ocular < 5 ||
    c.ocular > 30 ||
    c.separation < 0.5 ||
    c.separation > 6
  )
    throw new RangeError('Outside the supported paraxial microscope domain');
}
export function microscopeSystem(config: MicroscopeConfig, layerDepth = 0) {
  validateMicroscope(config);
  if (!Number.isFinite(layerDepth) || Math.abs(layerDepth) > 60)
    throw new RangeError('Invalid specimen depth');
  const u = microscopeObjectDistance + (layerDepth - config.focus) / 1000;
  const f = microscopeOptics.objective,
    v = microscopeOptics.image;
  const imageDistance = 1 / (1 / f - 1 / u);
  const pupil = microscopeObjectDistance * config.na;
  const na = pupil / u;
  const eyepiece = microscopeOptics.referenceDistance / config.ocular;
  const matrix = microscopeMultiply(
    microscopePropagation(v),
    microscopeMultiply(microscopeLens(f), microscopePropagation(u)),
  );
  const beta =
    (Math.PI * pupil * pupil * (1 / u + 1 / v - 1 / f)) / (microscopeOptics.wavelength / 1000);
  return {
    u,
    pupil,
    na,
    exactSineNA: pupil / Math.hypot(u, pupil),
    eyepiece,
    eyeZ: v + eyepiece,
    imageDistance,
    magnification: -imageDistance / u,
    planeMagnification: -v / u,
    visualMagnification: (-v / u) * config.ocular,
    matrix,
    beta,
    geometricBlur: Math.abs(pupil * (1 + v / u - v / f)),
    rayleigh: (0.6098349456 * microscopeOptics.wavelength) / na,
    depthScale: microscopeOptics.wavelength / (na * na),
  };
}
export function microscopeRay(
  config: MicroscopeConfig,
  sourceHeight: number,
  pupilFraction: number,
  layerDepth = 0,
) {
  if (
    ![sourceHeight, pupilFraction].every(Number.isFinite) ||
    Math.abs(sourceHeight) > 0.08 ||
    Math.abs(pupilFraction) > 1
  )
    throw new RangeError('Ray outside pupil or paraxial field');
  const system = microscopeSystem(config, layerDepth);
  const height = system.pupil * pupilFraction;
  const incoming = (height - sourceHeight) / system.u;
  const objective = microscopeTransfer(
    microscopeLens(microscopeOptics.objective),
    height,
    incoming,
  );
  const at = (z: number) => height + objective.slope * z;
  const eyeHeight = at(system.eyeZ);
  const outgoing = microscopeTransfer(microscopeLens(system.eyepiece), eyeHeight, objective.slope);
  const end = system.eyeZ + 26;
  return {
    pupilFraction,
    sourceHeight,
    incoming,
    objectiveSlope: objective.slope,
    outgoingSlope: outgoing.slope,
    blocked: Math.abs(eyeHeight) > 2.5,
    points: [
      { z: -system.u, h: sourceHeight },
      { z: 0, h: height },
      { z: microscopeOptics.image, h: at(microscopeOptics.image) },
      { z: system.eyeZ, h: eyeHeight },
      { z: end, h: outgoing.height + 26 * outgoing.slope },
    ],
    atImage: { z: system.imageDistance, h: at(system.imageDistance) },
  };
}

/** J0/J1 via convergent power series below 14; asymptotic expansion above it.
 * Coefficients follow product(4ν²-(2k-1)²)/(k! 8^k), with 12 terms.
 */
export function microscopeBessel(order: 0 | 1, value: number) {
  const x = Math.abs(value);
  let result: number;
  if (x < 14) {
    let term = order ? x / 2 : 1,
      sum = term;
    for (let k = 1; k <= 70; k++) {
      term *= -((x * x) / 4) / (k * (k + order));
      sum += term;
      if (Math.abs(term) < 1e-15) break;
    }
    result = sum;
  } else {
    let term = 1,
      p = 1,
      q = 0;
    for (let k = 1; k <= 12; k++) {
      term *= (4 * order * order - (2 * k - 1) ** 2) / (k * 8 * x);
      if (k % 2) q += (k % 4 === 1 ? 1 : -1) * term;
      else p += (k % 4 === 0 ? 1 : -1) * term;
    }
    const phase = x - (order * Math.PI) / 2 - Math.PI / 4;
    result = Math.sqrt(2 / (Math.PI * x)) * (Math.cos(phase) * p - Math.sin(phase) * q);
  }
  return order && value < 0 ? -result : result;
}

const radialSteps = 96,
  kernelSteps = 720,
  kernelStep = 0.05;
let pupilTable: Float64Array | undefined;
function microscopePupilTable() {
  if (pupilTable) return pupilTable;
  pupilTable = new Float64Array((kernelSteps + 1) * (radialSteps + 1));
  for (let j = 0; j <= kernelSteps; j++)
    for (let i = 0; i <= radialSteps; i++) {
      const rho = i / radialSteps,
        weight = i === 0 || i === radialSteps ? 1 : i % 2 ? 4 : 2;
      pupilTable[j * (radialSteps + 1) + i] =
        ((2 * rho * weight) / (3 * radialSteps)) * microscopeBessel(0, j * kernelStep * rho);
    }
  return pupilTable;
}
/** Scalar Fresnel integral of a uniformly filled circular pupil at the fixed
 * intermediate plane: |2∫ρ J0(vρ) exp(iβρ²)dρ|². Intensity, not amplitude,
 * adds between incoherent fluorescent emitters. Kernel is cut at v=36.
 */
export function microscopeKernel(beta: number) {
  if (!Number.isFinite(beta) || Math.abs(beta) > 80)
    throw new RangeError('Unsupported defocus phase');
  const table = microscopePupilTable(),
    result = new Float64Array(kernelSteps + 1);
  const cosine = new Float64Array(radialSteps + 1),
    sine = new Float64Array(radialSteps + 1);
  for (let i = 0; i <= radialSteps; i++) {
    const phase = beta * (i / radialSteps) ** 2;
    cosine[i] = Math.cos(phase);
    sine[i] = Math.sin(phase);
  }
  for (let j = 0; j <= kernelSteps; j++) {
    let real = 0,
      imaginary = 0;
    for (let i = 0; i <= radialSteps; i++) {
      const a = table[j * (radialSteps + 1) + i];
      real += a * cosine[i];
      imaginary += a * sine[i];
    }
    result[j] = real * real + imaginary * imaginary;
  }
  return result;
}
export function microscopeKernelAt(kernel: Float64Array, v: number) {
  const x = Math.abs(v) / kernelStep,
    i = Math.floor(x);
  if (i >= kernelSteps) return 0;
  return kernel[i] * (1 - x + i) + kernel[i + 1] * (x - i);
}
export const microscopeAxialPeak = (beta: number) =>
  Math.abs(beta) < 1e-8 ? 1 : (Math.sin(beta / 2) / (beta / 2)) ** 2;
export function microscopeSpecimen(config: MicroscopeConfig) {
  validateMicroscope(config);
  const depths = config.layers ? [0, 20] : [0];
  return depths.flatMap((z, row) =>
    [-1, 1].map((sign) => ({
      id: `${row}-${sign}`,
      x: (sign * config.separation) / 2,
      y: config.layers ? (row ? 4 : -4) : 0,
      z,
    })),
  );
}
export function microscopeField(config: MicroscopeConfig) {
  const points = microscopeSpecimen(config);
  const layers = [...new Set(points.map((p) => p.z))].map((z) => {
    const system = microscopeSystem(config, z);
    return { z, system, kernel: microscopeKernel(system.beta) };
  });
  const prepared = points.map((point) => {
    const layer = layers.find((l) => l.z === point.z)!;
    const ratio = layer.system.planeMagnification / Math.abs(microscopeNominalMagnification);
    return { ...point, ...layer, cx: point.x * ratio, cy: point.y * ratio, ratio: Math.abs(ratio) };
  });
  return { points: prepared, span: (16 * 10) / config.ocular };
}
export type MicroscopeField = ReturnType<typeof microscopeField>;
/** Coordinates are intermediate-plane lengths divided by |nominal M|, in µm.
 * Fixed in-focus single-point peak reference; brightness/throughput is not compared.
 */
export function microscopeIntensity(field: MicroscopeField, x: number, y: number) {
  let result = 0;
  for (const point of field.points) {
    const radius = Math.hypot(x - point.cx, y - point.cy) / point.ratio;
    result += microscopeKernelAt(
      point.kernel,
      (2 * Math.PI * point.system.na * radius) / microscopeOptics.wavelength,
    );
  }
  return result;
}
export function microscopeImage(field: MicroscopeField, size = 161) {
  if (!Number.isInteger(size) || size < 16 || size > 400)
    throw new RangeError('Invalid specimen raster size');
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++) {
      const x = ((col + 0.5) / size - 0.5) * field.span,
        y = (0.5 - (row + 0.5) / size) * field.span;
      const intensity = microscopeClamp(microscopeIntensity(field, x, y) / 1.25, 0, 1);
      const at = 4 * (row * size + col);
      pixels[at] = 15 + 223 * intensity;
      pixels[at + 1] = 21 + 205 * intensity;
      pixels[at + 2] = 31 + 150 * intensity;
      pixels[at + 3] = 255;
    }
  return { size, pixels, span: field.span };
}
export type MicroscopeFocus =
  'collect' | 'image' | 'ocular' | 'focus' | 'layers' | 'aperture' | 'depth' | 'empty';
const focuses: MicroscopeFocus[] = [
  'collect',
  'image',
  'ocular',
  'focus',
  'layers',
  'aperture',
  'depth',
  'empty',
];
export function microscopeShot(chapter: number, progress: number) {
  const index = microscopeClamp(Math.floor(Number.isFinite(chapter) ? chapter : 0), 0, 7);
  const q = microscopeClamp(((Number.isFinite(progress) ? progress : 0) - 0.06) / 0.86, 0, 1);
  const p = q * q * (3 - 2 * q),
    config = { ...microscopeDefaults };
  let marker = 0.04,
    reveal = 1;
  if (index === 0) reveal = p;
  if (index === 1) marker = 0.04 * (1 - 2 * p);
  if (index === 2) config.ocular = 10 + 10 * p;
  if (index === 3) {
    config.na = 0.22;
    config.focus = 18 * (1 - p);
  }
  if (index === 4) {
    config.na = 0.24;
    config.layers = true;
    config.focus = 20 * p;
  }
  if (index === 5) config.na = 0.08 + 0.16 * p;
  if (index === 6) {
    config.na = 0.24 - 0.16 * p;
    config.layers = true;
    config.focus = 10;
  }
  if (index === 7) {
    config.na = 0.08;
    config.ocular = 10 + 15 * p;
  }
  return {
    config,
    system: microscopeSystem(config),
    marker,
    reveal,
    progress: p,
    focus: focuses[index],
  };
}
export type MicroscopeShot = ReturnType<typeof microscopeShot>;
