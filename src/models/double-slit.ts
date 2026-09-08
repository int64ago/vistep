/** Scalar Fraunhofer model for equally illuminated, identical rectangular slits.
 * Every length is in metres. Intensity is relative to the CURRENT single-slit
 * central intensity: changing slit width therefore changes the reference.
 * This is an angular aperture factor on a nearly paraxial plane screen, not
 * absolute radiometry, a Fresnel calculation, or a photon trajectory model.
 * Sources and approximation bounds: docs/examples/double-slit-brief.md.
 */
export type DoubleSlitParameters = {
  wavelengthM: number;
  slitWidthM: number;
  separationM: number;
  distanceM: number;
  slit: 'one' | 'both';
  /** Real, nonnegative, spatially constant mutual coherence between the slits.
   * Each slit remains internally coherent. Values below one describe an
   * ensemble-averaged cross term, not a single deterministic field sum.
   */
  coherence: number;
};
export const DOUBLE_SLIT_DEFAULT: Readonly<DoubleSlitParameters> = {
  wavelengthM: 550e-9,
  slitWidthM: 35e-6,
  separationM: 180e-6,
  distanceM: 1,
  slit: 'both',
  coherence: 1,
};
export const DOUBLE_SLIT_SEED = 0x51a7d00d;
export type DoubleSlitSample = {
  yM: number;
  theta: number;
  beta: number;
  /** Signed far-field path difference d sin(theta), NOT exact centre distances. */
  pathDifferenceM: number;
  phaseDifference: number;
  singleAmplitude: number;
  envelope: number;
  interferenceFactor: number;
  intensity: number;
};
const finite = (value: number) => {
  if (!Number.isFinite(value)) throw new RangeError('Double-slit values must be finite');
  return value;
};
const positive = (value: number) => {
  if (finite(value) <= 0) throw new RangeError('Double-slit lengths must be positive');
  return value;
};
function validate(p: DoubleSlitParameters) {
  positive(p.wavelengthM);
  positive(p.slitWidthM);
  positive(p.separationM);
  positive(p.distanceM);
  if (p.slitWidthM >= p.separationM) throw new RangeError('The two slits must not overlap');
  if (p.slit !== 'one' && p.slit !== 'both') throw new RangeError('Unknown slit selection');
  if (finite(p.coherence) < 0 || p.coherence > 1)
    throw new RangeError('Coherence must lie between zero and one');
}
function countWithin(count: number, min: number, max: number) {
  if (!Number.isInteger(count) || count < min || count > max)
    throw new RangeError(`Sample count must be an integer from ${min} to ${max}`);
}
export function doubleSlitSinc(x: number) {
  finite(x);
  if (Math.abs(x) < 1e-4) {
    const square = x * x;
    return 1 - square / 6 + (square * square) / 120;
  }
  const result = Math.sin(x) / x;
  return Math.abs(result) < 1e-15 ? 0 : result;
}
function sample(p: DoubleSlitParameters, yM: number): DoubleSlitSample {
  finite(yM);
  const theta = Math.atan2(yM, p.distanceM),
    sinTheta = Math.sin(theta),
    beta = finite(((Math.PI * p.slitWidthM) / p.wavelengthM) * sinTheta),
    pathDifferenceM = p.separationM * sinTheta,
    phaseDifference = finite((2 * Math.PI * pathDifferenceM) / p.wavelengthM),
    singleAmplitude = doubleSlitSinc(beta),
    envelope = singleAmplitude * singleAmplitude;
  // Equivalent to 2 + 2 gamma cos(delta), but avoids cancellation near a null.
  const interferenceFactor =
    p.slit === 'one'
      ? 1
      : 2 * (1 - p.coherence) + 4 * p.coherence * Math.cos(phaseDifference / 2) ** 2;
  return {
    yM,
    theta,
    beta,
    pathDifferenceM,
    phaseDifference,
    singleAmplitude,
    envelope,
    interferenceFactor,
    intensity: envelope * interferenceFactor,
  };
}
export function doubleSlitAt(p: DoubleSlitParameters, yM: number): DoubleSlitSample {
  validate(p);
  return sample(p, yM);
}
export function doubleSlitProfile(p: DoubleSlitParameters, count = 801, halfSpanM = 0.01) {
  validate(p);
  countWithin(count, 3, 16385);
  positive(halfSpanM);
  return Array.from({ length: count }, (_, i) =>
    sample(p, halfSpanM * ((2 * i) / (count - 1) - 1)),
  );
}
/** Near-axis spacing only. The envelope shifts the actual composite maxima. */
export function doubleSlitFringeSpacing(p: DoubleSlitParameters) {
  validate(p);
  return finite((p.wavelengthM * p.distanceM) / p.separationM);
}
/** Plane-screen position where d sin(theta) / lambda = cycles. Integers mark
 * constructive PHASE conditions; half-integers mark coherent interference
 * nulls. Integers are not exact maxima of the envelope-modulated intensity.
 * null denotes a grazing or unreachable direction on a finite plane screen.
 */
export function doubleSlitPhasePosition(p: DoubleSlitParameters, cycles: number) {
  validate(p);
  const sine = finite((finite(cycles) * p.wavelengthM) / p.separationM);
  if (Math.abs(sine) >= 1) return null;
  return finite((p.distanceM * sine) / Math.sqrt(1 - sine * sine));
}
/** Exact geometric centre-to-point distance difference, lower slit minus upper
 * slit, rationalized to avoid subtracting nearly identical metre-long paths.
 * This helper is explanatory only: the Fraunhofer pattern uses d sin(theta).
 */
export function doubleSlitExactPathDifference(p: DoubleSlitParameters, yM: number) {
  validate(p);
  finite(yM);
  const upper = Math.hypot(p.distanceM, yM - p.separationM / 2),
    lower = Math.hypot(p.distanceM, yM + p.separationM / 2);
  return finite(((2 * yM) / (lower + upper)) * p.separationM);
}
/** Diagnostic sizes of omitted terms, not a sharp physical validity boundary.
 * The full aperture spans d+a; its omitted on-axis edge phase includes a
 * common phase that does not itself change intensity. No near-field solution
 * is implied by accepting other positive dimensions in the algebraic model.
 */
export function doubleSlitValidity(p: DoubleSlitParameters, halfSpanM = 0.01) {
  validate(p);
  positive(halfSpanM);
  const halfAperture = (p.separationM + p.slitWidthM) / 2,
    edgeExtraPath =
      (halfAperture * halfAperture) / (Math.hypot(p.distanceM, halfAperture) + p.distanceM);
  return {
    fullApertureFresnel: finite(
      (p.separationM + p.slitWidthM) ** 2 / (p.wavelengthM * p.distanceM),
    ),
    omittedEdgePhase: finite((2 * Math.PI * edgeExtraPath) / p.wavelengthM),
    slitWavelengths: finite(p.slitWidthM / p.wavelengthM),
    screenSlope: finite(halfSpanM / p.distanceM),
  };
}
export type DoubleSlitDistribution = {
  readonly halfSpanM: number;
  readonly yM: readonly number[];
  /** Conditional probability density with respect to screen distance y, m^-1. */
  readonly densityPerM: readonly number[];
  readonly cdf: readonly number[];
  /** Integral of normalized intensity over this window, in metres. */
  readonly integralM: number;
};
/** Linear density between grid nodes, integrated exactly by trapezoids.
 * Conditional on a detection falling inside [-halfSpanM,+halfSpanM]. Equal
 * sample counts across settings therefore do NOT compare transmitted power.
 * This is a one-dimensional marginal for long slits with uniform detection;
 * it omits detector resolution, dark counts, efficiency and arrival times.
 */
export function doubleSlitDistribution(
  p: DoubleSlitParameters,
  halfSpanM = 0.01,
  bins = 2048,
): DoubleSlitDistribution {
  validate(p);
  positive(halfSpanM);
  countWithin(bins, 128, 16384);
  const stepM = (2 * halfSpanM) / bins;
  // At least eight samples per fastest central interference period, so an
  // undersampled request cannot silently alias away entire fringes.
  if ((stepM * p.separationM) / (p.wavelengthM * p.distanceM) > 1 / 8)
    throw new RangeError('Detection grid is too coarse to resolve the fringes');
  const points = Array.from({ length: bins + 1 }, (_, i) =>
    sample(p, halfSpanM * ((2 * i) / bins - 1)),
  );
  const accumulated = [0];
  for (let i = 0; i < bins; i++)
    accumulated.push(
      accumulated[i] + ((points[i].intensity + points[i + 1].intensity) * stepM) / 2,
    );
  const integralM = positive(accumulated[bins]);
  return {
    halfSpanM,
    yM: points.map((point) => point.yM),
    densityPerM: points.map((point) => point.intensity / integralM),
    cdf: accumulated.map((value, i) => (i === bins ? 1 : value / integralM)),
    integralM,
  };
}
/** Invert the integrated piecewise-linear density, not just a bin-centre pick. */
export function doubleSlitQuantile(distribution: DoubleSlitDistribution, u: number) {
  if (finite(u) < 0 || u > 1) throw new RangeError('A CDF quantile lies between zero and one');
  const { yM, densityPerM, cdf } = distribution;
  if (u === 0) return yM[0];
  if (u === 1) return yM[yM.length - 1];
  let lo = 0,
    hi = cdf.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    if (cdf[mid] <= u) lo = mid;
    else hi = mid;
  }
  const width = yM[hi] - yM[lo],
    first = densityPerM[lo],
    change = densityPerM[hi] - first,
    massPerWidth = (u - cdf[lo]) / width;
  const denominator = first + Math.sqrt(Math.max(0, first * first + 2 * change * massPerWidth));
  const fraction = massPerWidth === 0 ? 0 : (2 * massPerWidth) / denominator;
  return yM[lo] + width * Math.max(0, Math.min(1, fraction));
}
/** Counter-based 32-bit hash: order-independent educational pseudorandomness,
 * not a physical source of quantum randomness or cryptographic randomness.
 */
export function doubleSlitUnitRandom(index: number, seed = DOUBLE_SLIT_SEED, stream = 0) {
  for (const value of [index, seed, stream])
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
      throw new RangeError('Random counters and seed must be unsigned 32-bit integers');
  let word = (index ^ seed ^ Math.imul(stream, 0x9e3779b9)) >>> 0;
  word = Math.imul(word ^ (word >>> 16), 0x7feb352d);
  word = Math.imul(word ^ (word >>> 15), 0x846ca68b);
  word = (word ^ (word >>> 16)) >>> 0;
  return (word + 0.5) / 0x100000000;
}
export function doubleSlitDetection(
  distribution: DoubleSlitDistribution,
  index: number,
  seed = DOUBLE_SLIT_SEED,
) {
  return { index, yM: doubleSlitQuantile(distribution, doubleSlitUnitRandom(index, seed)) };
}
export function doubleSlitDetections(
  distribution: DoubleSlitDistribution,
  count: number,
  seed = DOUBLE_SLIT_SEED,
) {
  countWithin(count, 0, 100000);
  return Array.from({ length: count }, (_, i) => doubleSlitDetection(distribution, i, seed));
}
