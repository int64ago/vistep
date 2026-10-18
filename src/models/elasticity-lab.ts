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

/** Spoken-time direction only; equilibrium and constitutive calculations stay independent. */
export function elasticityFilmState(chapter: number, seconds: number, locale: 'zh' | 'en') {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const en = locale === 'en';
  const ramp = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const weights =
    chapter === 0
      ? t >= (en ? 7.2 : 9.5)
        ? 2
        : 0
      : chapter === 1
        ? Math.min(6, 1 + Math.floor(ramp(1, 21) * 6))
        : t >= (en ? 8.4 : 13)
          ? 6
          : 3;
  return {
    weights,
    extension:
      chapter === 3
        ? 0.12 * ramp(en ? 4 : 5.5, en ? 13 : 15)
        : chapter === 4
          ? 0.12 * (1 - ramp(1, en ? 9 : 12))
          : 0.12,
    cycles: chapter === 5 ? Math.min(4, Math.floor(ramp(3, 10) * 4)) : 0,
    plotView:
      chapter === 2 ||
      chapter === 5 ||
      (chapter === 1 && t >= (en ? 13.2 : 14.4)) ||
      (chapter === 3 && t >= (en ? 8.1 : 9.4)) ||
      (chapter === 4 && t >= (en ? 3.3 : 6.2)),
  };
}
