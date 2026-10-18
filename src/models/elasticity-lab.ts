export const ELASTIC_GRAVITY = 9.8;
export const SPRING_K = 30;
export const RUBBER_MAX_EXTENSION = 0.12;
export function springExtension(mass: number, stiffness = SPRING_K) {
  if (![mass, stiffness].every(Number.isFinite) || mass < 0 || stiffness <= 0)
    throw new RangeError('Finite nonnegative mass and positive stiffness required.');
  return {
    force: mass * ELASTIC_GRAVITY,
    extension: (mass * ELASTIC_GRAVITY) / stiffness,
    length: 0.16 + (mass * ELASTIC_GRAVITY) / stiffness,
  };
}
/** Explicit illustrative constitutive law, not a fitted universal model of rubber. */
export function rubberResponse(
  extension: number,
  branch: 'loading' | 'unloading' = 'loading',
  cycles = 0,
  maxExtension = RUBBER_MAX_EXTENSION,
) {
  if (
    ![extension, cycles, maxExtension].every(Number.isFinite) ||
    extension < 0 ||
    extension > maxExtension + 1e-10 ||
    maxExtension <= 0 ||
    maxExtension > 0.12 ||
    cycles < 0
  )
    throw new RangeError('Rubber extension outside the calibrated teaching range.');
  const softening = 1 - 0.12 * (1 - Math.exp(-cycles / 2));
  const loading = softening * (30 * extension + 2200 * extension ** 3);
  const hysteresis = branch === 'unloading' ? 200 * extension * (maxExtension - extension) : 0;
  const force = loading - hysteresis;
  return {
    force,
    extension,
    length: 0.16 + extension,
    mass: force / ELASTIC_GRAVITY,
    widthScale: 1 / Math.sqrt(1 + extension / 0.16),
    softening,
  };
}
export function rubberCycleLoss(maxExtension = RUBBER_MAX_EXTENSION) {
  return (200 * maxExtension ** 3) / 6;
}
export function springWire(length: number, turns = 11, width = 10) {
  const n = turns * 16;
  return Array.from({ length: n + 1 }, (_, i) => ({
    x: Math.sin((i / n) * turns * 2 * Math.PI) * width,
    y: (i / n) * length,
  }));
}
