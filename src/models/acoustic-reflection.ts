export type AcousticInterfaceOptions = { ratio?: number; speedRatio?: number };
export function acousticInterface({ ratio = 4, speedRatio = 1 }: AcousticInterfaceOptions = {}) {
  if (![ratio, speedRatio].every(Number.isFinite) || ratio <= 0 || speedRatio <= 0)
    throw new RangeError('Positive acoustic properties required');
  const c1 = 343,
    Z1 = 420,
    c2 = c1 * speedRatio,
    Z2 = Z1 * ratio,
    r = (Z2 - Z1) / (Z2 + Z1),
    tp = 1 + r,
    R = r * r,
    T = (tp * tp * Z1) / Z2;
  return { c1, c2, Z1, Z2, r, tp, R, T, density1: Z1 / c1, density2: Z2 / c2 };
}
export function acousticPacket(q: number) {
  return (1 - 2 * q * q) * Math.exp(-q * q);
}
/** Linear, lossless normal-incidence plane pulse. x in m, time in seconds, pressure in Pa. */
export function acousticField(x: number, time: number, options: AcousticInterfaceOptions = {}) {
  const s = acousticInterface(options),
    w = 0.08,
    incident = acousticPacket((x + 0.6 - s.c1 * time) / w),
    reflected = s.r * acousticPacket((-x + 0.6 - s.c1 * time) / w),
    transmitted = s.tp * acousticPacket(((s.c1 / s.c2) * x + 0.6 - s.c1 * time) / w),
    pressure = x <= 0 ? incident + reflected : transmitted,
    velocity = x <= 0 ? (incident - reflected) / s.Z1 : transmitted / s.Z2;
  return {
    incident: x <= 0 ? incident : 0,
    reflected: x <= 0 ? reflected : 0,
    transmitted: x >= 0 ? transmitted : 0,
    pressure,
    velocity,
  };
}
export function acousticShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    ratio: chapter === 3 ? 0.25 : chapter === 4 ? 1 : 4,
    speedRatio: chapter === 4 ? 1 - 0.5 * p : 1,
    time:
      chapter === 0
        ? 0.0002 + 0.0012 * p
        : chapter === 1 || chapter === 3
          ? 0.0014 + 0.002 * p
          : 0.0028,
    velocity: chapter === 5,
  };
}
