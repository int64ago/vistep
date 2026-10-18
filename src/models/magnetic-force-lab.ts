/** SI models for four textbook magnetic-force apparatuses. */
export const MU0 = 4e-7 * Math.PI;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export type MagneticForceExperiment = 'wire' | 'solenoid' | 'parallel' | 'spring';
export function conductorForce(current: number, field: number, length = 0.12) {
  // +x current and +z field give -y force.
  return current === 0 || field === 0 ? 0 : -current * field * length;
}
export function parallelForcePerLength(i1: number, i2: number, separation = 0.03) {
  if (!(separation > 0)) throw new RangeError('Wire separation must be positive.');
  return (MU0 * i1 * i2) / (2 * Math.PI * separation);
}
/** Finite solenoid axial field; x is measured from the coil centre. */
export function axialSolenoidField(
  x: number,
  current: number,
  turns = 14,
  length = 0.08,
  radius = 0.012,
) {
  const end = (z: number) => z / Math.hypot(radius, z);
  return ((MU0 * turns * current) / (2 * length)) * (end(x + length / 2) - end(x - length / 2));
}
/** Linear induced-dipole teaching approximation: effective susceptibility, not saturated iron. */
export function nailForce(x: number, current: number) {
  const dx = 1e-5,
    b0 = axialSolenoidField(x - dx, current),
    b1 = axialSolenoidField(x + dx, current);
  return (((120 * 8e-9) / (2 * MU0)) * (b1 * b1 - b0 * b0)) / (2 * dx);
}
export function suspendedWire(current: number, field: number, time: number) {
  const force = conductorForce(current, field),
    stiffness = 0.8,
    mass = 0.025;
  const omega0 = Math.sqrt(stiffness / mass),
    zeta = 0.42,
    omega = omega0 * Math.sqrt(1 - zeta * zeta);
  const t = Math.max(0, time);
  const response =
    1 -
    Math.exp(-zeta * omega0 * t) *
      (Math.cos(omega * t) + ((zeta * omega0) / omega) * Math.sin(omega * t));
  return { force, displacement: (force / stiffness) * response };
}
/** Deterministic contact–spring simulation, x upward from zero-current equilibrium. */
export function currentSpring(time: number, current = 2) {
  const mass = 0.012,
    stiffness = 1.2,
    damping = 0.012,
    threshold = 0.002;
  let x = 0,
    velocity = 0,
    closed = true;
  const dt = 1 / 2000,
    steps = Math.ceil(clamp(time, 0, 16) / dt);
  let force = 0;
  for (let i = 0; i < steps; i++) {
    if (closed && x > threshold) closed = false;
    if (!closed && x < 0.0001 && velocity < 0) closed = true;
    force = closed ? 0.0036 * current * current : 0;
    velocity += ((force - stiffness * x - damping * velocity) / mass) * dt;
    x += velocity * dt;
  }
  return { displacement: x, velocity, closed, current: closed ? current : 0, magneticForce: force };
}
export function magneticForceShot(chapter: number, progress: number) {
  const p = clamp(progress, 0, 1),
    chapterIndex = clamp(chapter, 0, 6);
  const experiment: MagneticForceExperiment =
    chapterIndex < 3
      ? 'wire'
      : chapterIndex < 5
        ? 'solenoid'
        : chapterIndex === 5
          ? 'parallel'
          : 'spring';
  const current = chapterIndex === 1 || chapterIndex === 4 ? -2 : 2;
  const field = chapterIndex === 2 ? -0.18 : 0.18;
  const secondCurrent = chapterIndex === 5 && p > 0.5 ? -2 : 2;
  return {
    experiment,
    current,
    field,
    secondCurrent,
    time: p * (experiment === 'spring' ? 8 : 2.8),
    progress: p,
  };
}
