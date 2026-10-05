import { EAR_GEOMETRY, earProbePoint, type EarPoint } from './ear-thermometer-geometry';

/** Ideal rectangular 8–14 µm response, black surfaces, equilibrium sensor package.
 * Radiance is integrated over this finite band; no Stefan–Boltzmann full-spectrum
 * substitution and no commercial clinical correction algorithm are used. */
export const EAR_IR = {
  lowM: 8e-6,
  highM: 14e-6,
  h: 6.62607015e-34,
  c: 299792458,
  k: 1.380649e-23,
  gainMvPerRadiance: 0.075,
  referenceC: 22,
  rayCount: 61,
} as const;
export const EAR_HALF_FOV_DEG =
  (Math.atan(EAR_GEOMETRY.apertureRadiusMm / EAR_GEOMETRY.guideLengthMm) * 180) / Math.PI;
export type EarInput = {
  angleDeg: number;
  drumC: number;
  outerWallC: number;
  innerWallC: number;
  sensorC: number;
};
export const EAR_DEFAULT: EarInput = {
  angleDeg: 0,
  drumC: 37,
  outerWallC: 32,
  innerWallC: 36.3,
  sensorC: 22,
};
export type EarRay = {
  relativeAngleDeg: number;
  weight: number;
  region: 'drum' | 'wall';
  surfaceC: number;
  /** In emitted-light order: tissue → entrance stop/window → absorber. */
  points: [EarPoint, EarPoint, EarPoint];
};
export type EarFrame = EarInput & {
  rays: EarRay[];
  drumFraction: number;
  drumSignalFraction: number;
  radiance: number;
  referenceRadiance: number;
  signalMv: number;
  compensatedC: number;
  uncompensatedC: number;
};
export function earSpectralRadiance(celsius: number, wavelengthM: number) {
  if (
    !Number.isFinite(celsius) ||
    celsius <= -273.15 ||
    !Number.isFinite(wavelengthM) ||
    wavelengthM <= 0
  )
    throw new RangeError('Positive absolute temperature and wavelength required');
  const { h, c, k } = EAR_IR,
    T = celsius + 273.15;
  return (2 * h * c * c) / (wavelengthM ** 5 * Math.expm1((h * c) / (wavelengthM * k * T)));
}
export function earBandRadiance(celsius: number) {
  const n = 96,
    step = (EAR_IR.highM - EAR_IR.lowM) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++)
    sum +=
      (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) *
      earSpectralRadiance(celsius, EAR_IR.lowM + i * step);
  return (sum * step) / 3;
}
export function earInvertRadiance(radiance: number) {
  const lowBound = earBandRadiance(-40),
    highBound = earBandRadiance(100);
  if (!Number.isFinite(radiance) || radiance < lowBound || radiance > highBound)
    throw new RangeError('Radiance outside teaching inversion range');
  let low = -40,
    high = 100;
  for (let i = 0; i < 42; i++) {
    const mid = (low + high) / 2;
    if (earBandRadiance(mid) < radiance) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
const cross = (a: EarPoint, b: EarPoint) => a.x * b.y - a.y * b.x;
export function earFirstHit(origin: EarPoint, direction: EarPoint) {
  const segments: { a: EarPoint; b: EarPoint; region: 'drum' | 'wall' }[] = [];
  for (const boundary of [EAR_GEOMETRY.upper, EAR_GEOMETRY.lower])
    boundary.slice(1).forEach((b, i) => segments.push({ a: boundary[i], b, region: 'wall' }));
  segments.push({ a: EAR_GEOMETRY.upper.at(-1)!, b: EAR_GEOMETRY.lower.at(-1)!, region: 'drum' });
  let nearest: { point: EarPoint; region: 'drum' | 'wall'; distance: number } | undefined;
  for (const { a, b, region } of segments) {
    const edge = { x: b.x - a.x, y: b.y - a.y },
      offset = { x: a.x - origin.x, y: a.y - origin.y },
      denominator = cross(direction, edge);
    if (Math.abs(denominator) < 1e-12) continue;
    const distance = cross(offset, edge) / denominator,
      u = cross(offset, direction) / denominator;
    if (
      distance > 1e-8 &&
      u >= -1e-10 &&
      u <= 1 + 1e-10 &&
      (!nearest || distance < nearest.distance)
    )
      nearest = {
        point: { x: origin.x + distance * direction.x, y: origin.y + distance * direction.y },
        region,
        distance,
      };
  }
  if (!nearest) throw new RangeError('Ray leaves supported ear section');
  return nearest;
}
export function earMeasure(input: Partial<EarInput> = {}): EarFrame {
  const state = { ...EAR_DEFAULT, ...input };
  if (
    !Object.values(state).every(Number.isFinite) ||
    Math.abs(state.angleDeg) > 24 ||
    state.drumC < 34 ||
    state.drumC > 40 ||
    state.outerWallC < 28 ||
    state.outerWallC > 40 ||
    state.innerWallC < 28 ||
    state.innerWallC > 40 ||
    state.sensorC < 15 ||
    state.sensorC > 35
  )
    throw new RangeError('Unsupported teaching measurement');
  const detector = earProbePoint({ x: -EAR_GEOMETRY.guideLengthMm, y: 0 }, state.angleDeg),
    rawWeights = Array.from({ length: EAR_IR.rayCount }, (_, i) => {
      const a = (((2 * i) / (EAR_IR.rayCount - 1) - 1) * EAR_HALF_FOV_DEG * Math.PI) / 180;
      return Math.cos(a) * (i === 0 || i === EAR_IR.rayCount - 1 ? 0.5 : 1);
    }),
    totalWeight = rawWeights.reduce((a, b) => a + b, 0);
  const rays: EarRay[] = rawWeights.map((weight, i) => {
    const relativeAngleDeg = ((2 * i) / (EAR_IR.rayCount - 1) - 1) * EAR_HALF_FOV_DEG,
      relative = (relativeAngleDeg * Math.PI) / 180,
      directionAngle = ((state.angleDeg + relativeAngleDeg) * Math.PI) / 180,
      entry = earProbePoint(
        { x: 0, y: EAR_GEOMETRY.guideLengthMm * Math.tan(relative) },
        state.angleDeg,
      ),
      hit = earFirstHit(entry, { x: Math.cos(directionAngle), y: Math.sin(directionAngle) });
    const surfaceC =
      hit.region === 'drum'
        ? state.drumC
        : state.outerWallC +
          (state.innerWallC - state.outerWallC) * Math.max(0, Math.min(1, hit.point.x / 26));
    return {
      relativeAngleDeg,
      weight: weight / totalWeight,
      region: hit.region,
      surfaceC,
      points: [hit.point, entry, detector],
    };
  });
  // Repeated surface temperatures share one spectral integration per measurement.
  const surfaceRadiance = new Map<number, number>();
  const radiance = rays.reduce((sum, ray) => {
      let band = surfaceRadiance.get(ray.surfaceC);
      if (band === undefined) {
        band = earBandRadiance(ray.surfaceC);
        surfaceRadiance.set(ray.surfaceC, band);
      }
      return sum + ray.weight * band;
    }, 0),
    referenceRadiance = earBandRadiance(state.sensorC),
    signalMv = EAR_IR.gainMvPerRadiance * (radiance - referenceRadiance),
    reconstructedRadiance = signalMv / EAR_IR.gainMvPerRadiance + referenceRadiance;
  return {
    ...state,
    rays,
    radiance,
    referenceRadiance,
    signalMv,
    drumFraction: rays.reduce((sum, ray) => sum + (ray.region === 'drum' ? ray.weight : 0), 0),
    drumSignalFraction:
      rays.reduce(
        (sum, ray) =>
          sum + (ray.region === 'drum' ? ray.weight * surfaceRadiance.get(ray.surfaceC)! : 0),
        0,
      ) / radiance,
    compensatedC: earInvertRadiance(reconstructedRadiance),
    uncompensatedC: earInvertRadiance(
      signalMv / EAR_IR.gainMvPerRadiance + earBandRadiance(EAR_IR.referenceC),
    ),
  };
}
export const EAR_CALIBRATION = [34, 37, 40].map((temperatureC) => ({
  temperatureC,
  signalMv:
    EAR_IR.gainMvPerRadiance * (earBandRadiance(temperatureC) - earBandRadiance(EAR_IR.referenceC)),
}));
export type EarView = 'emission' | 'ear' | 'probe' | 'reference' | 'calibration' | 'mix';
const smooth = (x: number) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
export function earShot(chapter: number, progress: number) {
  if (!Number.isInteger(chapter) || chapter < 0 || chapter > 6 || !Number.isFinite(progress))
    throw new RangeError('Unsupported chapter or progress');
  const p = Math.max(0, Math.min(1, progress)),
    view: EarView =
      chapter === 0
        ? 'emission'
        : chapter === 2
          ? 'probe'
          : chapter === 3
            ? 'reference'
            : chapter === 4
              ? 'calibration'
              : chapter === 5
                ? 'mix'
                : 'ear',
    angleDeg =
      chapter === 5
        ? 20 * smooth((p - 0.15) / 0.55)
        : chapter === 6
          ? 20 * (1 - smooth(p / 0.55))
          : 0,
    sensorC = chapter === 3 ? 22 + 8 * smooth((p - 0.12) / 0.6) : 22,
    calibrationC = 34 + 6 * smooth((p - 0.1) / 0.7);
  // Direction is inexpensive. The presentation memoizes earMeasure by these
  // scalar inputs, so pulse/reveal changes cannot repeat spectral work.
  return {
    view,
    input: { ...EAR_DEFAULT, angleDeg, sensorC },
    calibrationC,
    reveal: smooth(p / 0.3),
    pulse: p * 4,
    chapter,
    progress: p,
  };
}
