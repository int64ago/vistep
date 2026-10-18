export const ELEMENTARY_CHARGE = 1.602176634e-19;
export const ELECTRON_MASS = 9.1093837139e-31;
export const ATOMIC_MASS_UNIT = 1.66053906892e-27;
export const LIGHT_SPEED = 299792458;
export type ParticleExperiment = 'beam' | 'orbit' | 'mass' | 'positron';
export function acceleratedSpeed(
  voltage: number,
  mass = ELECTRON_MASS,
  charge = ELEMENTARY_CHARGE,
) {
  if (!(mass > 0) || voltage < 0)
    throw new RangeError('Positive mass and nonnegative accelerating potential required.');
  return Math.sqrt((2 * Math.abs(charge) * voltage) / mass);
}
/** Exact nonrelativistic Lorentz trajectory in a uniform +z field, from the origin. */
export function magneticTrajectory({
  charge = -ELEMENTARY_CHARGE,
  mass = ELECTRON_MASS,
  field = 0.001,
  speed = 8e6,
  angle = Math.PI / 2,
  time = 0,
} = {}) {
  if (!(mass > 0) || ![charge, mass, field, speed, angle, time].every(Number.isFinite))
    throw new RangeError('Finite particle parameters required.');
  const perpendicular = speed * Math.sin(angle),
    parallel = speed * Math.cos(angle),
    omega = (charge * field) / mass,
    t = Math.max(0, time);
  if (Math.abs(omega * t) < 1e-8)
    return {
      x: perpendicular * t,
      y: (-perpendicular * omega * t * t) / 2,
      z: parallel * t,
      vx: perpendicular,
      vy: -perpendicular * omega * t,
      vz: parallel,
      radius: field === 0 ? Infinity : Math.abs(perpendicular / omega),
      speed,
    };
  return {
    x: (perpendicular * Math.sin(omega * t)) / omega,
    y: (perpendicular * (Math.cos(omega * t) - 1)) / omega,
    z: parallel * t,
    vx: perpendicular * Math.cos(omega * t),
    vy: -perpendicular * Math.sin(omega * t),
    vz: parallel,
    radius: Math.abs(perpendicular / omega),
    speed,
  };
}
export function isotopeRadius(massNumber: number, voltage = 1000, field = 0.25) {
  const mass = massNumber * ATOMIC_MASS_UNIT,
    speed = acceleratedSpeed(voltage, mass);
  return {
    radius: (mass * speed) / (ELEMENTARY_CHARGE * Math.abs(field)),
    speed,
    mass,
    chargeToMass: ELEMENTARY_CHARGE / mass,
  };
}
/** Relativistic radius, kinetic energy in MeV. */
export function relativisticRadius(kineticMeV: number, field = 1.5) {
  const k = Math.max(0, kineticMeV) * 1e6 * ELEMENTARY_CHARGE,
    rest = ELECTRON_MASS * LIGHT_SPEED ** 2;
  const momentum = Math.sqrt(k * (k + 2 * rest)) / LIGHT_SPEED;
  return momentum / (ELEMENTARY_CHARGE * Math.abs(field));
}
/** Tangent-continuous schematic track around a thin energy-loss plate. */
export function positronTrack(
  signedAngle: number,
  beforeMeV = 6,
  afterMeV = 3,
  field = 1.5,
  sign = 1,
) {
  const radius = relativisticRadius(signedAngle < 0 ? beforeMeV : afterMeV, field);
  return {
    x: sign * Math.sign(field) * radius * (1 - Math.cos(signedAngle)),
    y: radius * Math.sin(signedAngle),
    radius,
  };
}
export function particleShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    experiment: ParticleExperiment =
      chapter < 2 ? 'beam' : chapter < 4 ? 'orbit' : chapter < 6 ? 'mass' : 'positron';
  return {
    experiment,
    field:
      chapter === 0
        ? 0
        : chapter === 1
          ? p < 0.5
            ? 0.0015
            : -0.0015
          : chapter === 2
            ? 0.0018
            : 0.0012,
    voltage: chapter === 3 ? 100 + 250 * p : 200,
    angle: chapter === 3 ? Math.PI / 2 - (p * Math.PI) / 4 : Math.PI / 2,
    progress: p,
    phase: p * 1.9,
    positive: chapter < 7 || p > 0.4,
  };
}
