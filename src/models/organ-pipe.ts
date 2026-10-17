export type OrganOptions = {
  length?: number;
  radius?: number;
  stopped?: boolean;
  mode?: number;
  endFactor?: number;
};
export function organPipe({
  length: L = 0.6,
  radius = 0.025,
  stopped = false,
  mode = 1,
  endFactor = 0,
}: OrganOptions = {}) {
  if (
    ![L, radius, mode, endFactor].every(Number.isFinite) ||
    L <= 0 ||
    radius <= 0 ||
    !Number.isInteger(mode) ||
    mode < 1 ||
    mode > 5 ||
    endFactor < 0 ||
    endFactor > 1
  )
    throw new RangeError('Invalid cylindrical pipe');
  const c = 343,
    rho = 1.225,
    Z = rho * c,
    e = endFactor * radius,
    topExtension = stopped ? 0 : e,
    effectiveLength = L + e + topExtension,
    harmonic = stopped ? 2 * mode - 1 : mode,
    k = stopped
      ? (harmonic * Math.PI) / (2 * effectiveLength)
      : (harmonic * Math.PI) / effectiveLength,
    frequency = (c * k) / (2 * Math.PI),
    omega = 2 * Math.PI * frequency;
  return {
    L,
    radius,
    stopped,
    mode,
    c,
    rho,
    Z,
    e,
    topExtension,
    effectiveLength,
    harmonic,
    k,
    frequency,
    omega,
  };
}
/** Ideal pressure and longitudinal particle fields; phase=omega*t, unit peak pressure. */
export function organField(x: number, phase: number, options: OrganOptions = {}) {
  const s = organPipe(options),
    space = s.k * (x + s.e),
    pressure = Math.sin(space) * Math.cos(phase),
    velocity = (-Math.cos(space) * Math.sin(phase)) / s.Z,
    displacement = (Math.cos(space) * Math.cos(phase)) / (s.Z * s.omega);
  return { pressure, velocity, displacement };
}
export function organNodes(options: OrganOptions = {}) {
  const s = organPipe(options),
    count = s.stopped ? s.mode : s.mode + 1;
  return Array.from({ length: count }, (_, j) => (j * Math.PI) / s.k - s.e);
}
export function organShot(chapter: number, progress: number, seconds: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    length: chapter === 4 ? 0.4 + 0.4 * p : 0.6,
    radius: 0.025,
    stopped: chapter >= 2 && chapter <= 4,
    mode: chapter === 3 ? 2 : 1,
    endFactor: chapter === 5 ? 0.61 * p : 0,
    phase: chapter === 5 ? 0 : chapter === 1 ? (p * Math.PI) / 2 : (2 * Math.PI * seconds) / 6,
    close: chapter === 5,
    arrows: chapter === 1,
  };
}
