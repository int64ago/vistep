const bounded = (n: number, low: number, high: number, fallback = low) =>
  Math.max(low, Math.min(high, Number.isFinite(n) ? n : fallback));
const radians = (degrees: number) => (degrees * Math.PI) / 180;
const smooth = (n: number) => {
  const x = bounded(n, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Dilute, nonabsorbing Rayleigh spheres, NOT measured iron-hydroxide parameters.
 * T is the unscattered fraction; 1-T is power removed at its first scattering.
 * Further scattering is deliberately not propagated. */
export function colloidOptics(radiusNm = 18, volumePpm = 120, wavelengthNm = 633, pathCm = 10) {
  const radius = bounded(radiusNm, 1, 24, 18) * 1e-9;
  const fraction = bounded(volumePpm, 0, 500, 120) * 1e-6;
  const wavelength = bounded(wavelengthNm, 450, 680, 633) * 1e-9;
  const length = bounded(pathCm, 0, 30, 10) / 100;
  const mediumIndex = 1.333,
    particleIndex = 1.59;
  const relativeIndex = particleIndex / mediumIndex;
  const polarizability = ((relativeIndex ** 2 - 1) / (relativeIndex ** 2 + 2)) ** 2;
  const crossSection =
    ((8 * Math.PI) / 3) *
    ((2 * Math.PI * mediumIndex) / wavelength) ** 4 *
    radius ** 6 *
    polarizability;
  const numberDensity = fraction / ((4 * Math.PI * radius ** 3) / 3);
  const coefficient = numberDensity * crossSection;
  const opticalDepth = coefficient * length;
  const transmitted = Math.exp(-opticalDepth);
  return {
    crossSection,
    numberDensity,
    coefficient,
    opticalDepth,
    transmitted,
    scattered: -Math.expm1(-opticalDepth),
    sizeParameter: (2 * Math.PI * mediumIndex * radius) / wavelength,
    singleScatteringReliable: opticalDepth <= 0.2,
  };
}
/** Relative unpolarized pattern. A viewing direction is not all scattered power. */
export function rayleighSideIntensity(angleDegrees: number) {
  const angle = radians(bounded(angleDegrees, 0, 180, 90));
  return (1 + Math.cos(angle) ** 2) / 2;
}

/** Exact integral of 3(1+cos²θ)/(16π) over a circular collection cone.
 * This implementation uses a FULL-SPHERE unit normalization. */
export function rayleighCollection(angleDegrees = 90, halfAngleDegrees = 8) {
  const theta = radians(bounded(angleDegrees, 0, 180, 90));
  const c = Math.cos(radians(bounded(halfAngleDegrees, 0, 180, 8)));
  const axial = (2 * Math.PI * (1 - c ** 3)) / 3;
  const transverse = Math.PI * (2 / 3 - c + c ** 3 / 3);
  return bounded(
    (3 / (16 * Math.PI)) *
      (2 * Math.PI * (1 - c) + Math.cos(theta) ** 2 * axial + Math.sin(theta) ** 2 * transverse),
    0,
    1,
  );
}

export function colloidObservation({
  radiusNm = 18,
  volumePpm = 120,
  wavelengthNm = 633,
  blocked = false,
  sourceOn = true,
}: {
  radiusNm?: number;
  volumePpm?: number;
  wavelengthNm?: number;
  blocked?: boolean;
  sourceOn?: boolean;
} = {}) {
  const optics = colloidOptics(radiusNm, volumePpm, wavelengthNm);
  const input = sourceOn ? 1 : 0;
  const towardEye = optics.scattered * rayleighCollection();
  return {
    ...optics,
    input,
    forwardPower: input * optics.transmitted,
    eyePower: blocked ? 0 : input * towardEye,
    blockerPower: blocked ? input * towardEye : 0,
    otherScatteredPower: input * (optics.scattered - towardEye),
  };
}

export type ColloidShot = 'samples' | 'path' | 'dipole' | 'dilution' | 'wavelength' | 'transfer';
export function colloidDirector(chapter: number, progress: number) {
  const p = bounded(progress, 0, 1);
  const c = Math.round(bounded(chapter, 0, 3));
  const shot: ColloidShot =
    c === 0
      ? 'samples'
      : c === 1
        ? 'path'
        : c === 2
          ? 'dipole'
          : p < 0.4
            ? 'dilution'
            : p < 0.6
              ? 'wavelength'
              : 'transfer';
  const blockerInsertion = c === 1 ? smooth((p - 0.4) / 0.08) * (1 - smooth((p - 0.72) / 0.06)) : 0;
  // The source, charge and last received wave share one retarded clock.
  // Knots align the measured speech's source-off, response-stop and eye-dark cues.
  const knots = [
    [0, 0],
    [0.11, 1.5],
    [0.57, 7.3],
    [0.67, 8.8],
    [0.77, 11.1],
    [1, 12],
  ];
  const next = knots.findIndex(([at]) => at >= p);
  const [p0, t0] = knots[Math.max(0, next - 1)],
    [p1, t1] = knots[Math.max(0, next)];
  const microTime = p1 === p0 ? t0 : t0 + ((p - p0) / (p1 - p0)) * (t1 - t0);
  return {
    shot,
    progress: p,
    radiusNm: 18,
    wavelengthNm: 633,
    volumePpm: c === 3 ? 120 * (1 - 0.75 * smooth((p - 0.06) / 0.32)) : 120,
    blockerInsertion,
    blocked: blockerInsertion >= 0.75,
    microTime,
    sourceOn: c !== 2 || microTime < 7.3,
    routeProgress: c === 1 ? bounded(p / 0.28, 0, 1) : 1,
  };
}

/** Slow-motion illustration, not optical-frequency timing.
 * Incident propagation is +x; the one displayed polarization is z; the eye is +y.
 * All outgoing field samples share the retarded source, so no glow survives it. */
export function dipoleField(time: number, distanceFromParticle = 0) {
  const t = bounded(time, 0, 20);
  const retarded = t - 1.5 - bounded(distanceFromParticle, 0, 10);
  const envelope = smooth(retarded / 0.4) * (1 - smooth((retarded - 6.9) / 0.4));
  return { envelope, field: envelope * Math.sin(2 * Math.PI * 0.8 * retarded) };
}
export function incidentField(time: number, travelDelay: number) {
  return dipoleField(time + 1.5 - bounded(travelDelay, 0, 10));
}
/** A dipole has a radiation zero along its polarization axis. */
export function dipoleRadiation(direction: readonly [number, number, number]) {
  const [x, y, z] = direction;
  const squared = x * x + y * y + z * z;
  return squared > 0 && Number.isFinite(squared) ? bounded(1 - (z * z) / squared, 0, 1) : 0;
}
export function colloidPathGeometry(width: number) {
  const w = bounded(width, 240, 1200, 640);
  const compact = w < 560;
  const particle = { x: w * 0.5, y: compact ? 104 : 126 };
  const eye = { x: particle.x, y: compact ? 254 : 294 };
  const blocker = { x: particle.x, y: particle.y + (eye.y - particle.y) * 0.53 };
  return {
    width: w,
    height: compact ? 300 : 340,
    particle,
    eye,
    blocker,
    source: { x: 23, y: particle.y },
    screen: { x: w - 23, y: particle.y },
  };
}
/** Paths end at the blocker, not behind an opaque obstruction. */
export function observedRoute(width: number, blocked: boolean) {
  const geometry = colloidPathGeometry(width);
  return { ...geometry, outgoingEnd: blocked ? geometry.blocker : geometry.eye };
}
