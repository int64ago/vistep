export const INDUCTION_MU0 = 4e-7 * Math.PI;
export type InductionExperiment = 'coil' | 'ring' | 'fall' | 'disc';
/** Flux through a circular loop from an on-axis point dipole. z is upward along the loop normal. */
export function dipoleFlux(z: number, moment = 0.03, radius = 0.025) {
  return (INDUCTION_MU0 * moment * radius * radius) / (2 * (radius * radius + z * z) ** 1.5);
}
export function dipoleFluxDerivative(z: number, moment = 0.03, radius = 0.025) {
  return (
    (-3 * INDUCTION_MU0 * moment * radius * radius * z) / (2 * (radius * radius + z * z) ** 2.5)
  );
}
export function coilInduction({
  z = 0.04,
  velocity = -0.4,
  moment = 0.03,
  turns = 80,
  resistance = 8,
  closed = true,
} = {}) {
  if (!(resistance > 0) || turns < 0)
    throw new RangeError('Positive resistance and nonnegative turns required.');
  const flux = dipoleFlux(z, moment),
    gradient = dipoleFluxDerivative(z, moment),
    emf = velocity === 0 || turns === 0 ? 0 : -turns * gradient * velocity,
    current = closed ? emf / resistance : 0;
  const magnetForce = current === 0 ? 0 : turns * current * gradient;
  return {
    z,
    velocity,
    flux,
    emf,
    current,
    magnetForce,
    heatPower: current * current * resistance,
    externalPower: -magnetForce * velocity,
  };
}
export function approachMagnet(progress: number, polarity = 1) {
  const p = Math.max(0, Math.min(1, progress));
  const z = 0.01 + (0.07 * (1 + Math.cos(2 * Math.PI * p))) / 2;
  const velocity = -0.07 * Math.PI * Math.sin(2 * Math.PI * p);
  return coilInduction({ z, velocity, moment: -0.03 * polarity });
}
/** High-impedance sensor: induced emf is measured, while magnetic braking is neglected. */
export function fallingMagnet(time: number, height = 0.18, turns = 80) {
  const stopTime = Math.sqrt((2 * (height + 0.16)) / 9.8),
    t = Math.min(Math.max(0, time), stopTime),
    landed = time >= stopTime;
  const z = height - 4.9 * t * t,
    velocity = landed ? 0 : -9.8 * t;
  return {
    ...coilInduction({ z, velocity, turns, moment: -0.03, closed: false }),
    time: t,
    landed,
    turns,
    height,
  };
}
export function discGenerator(omega: number, field = 0.3, radius = 0.08, resistance = 5) {
  const emf = (field * omega * radius * radius) / 2,
    current = emf / resistance,
    loadPower = current * emf,
    torque = (-field * current * radius * radius) / 2;
  return {
    omega,
    field,
    radius,
    emf,
    current,
    loadPower,
    torque,
    mechanicalPower: -torque * omega,
  };
}
export function inductionShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const experiment: InductionExperiment =
    chapter < 3 ? 'coil' : chapter < 5 ? 'ring' : chapter < 7 ? 'fall' : 'disc';
  return {
    experiment,
    progress: p,
    polarity: chapter === 2 ? -1 : 1,
    closed: chapter !== 4,
    stationary: chapter === 0,
    height: chapter === 5 && p < 0.5 ? 0.1 : 0.26,
    turns: chapter === 6 ? 160 : 80,
    omega: (chapter === 8 ? -1 : 1) * 20,
    time: (chapter === 5 ? (p < 0.5 ? p * 2 : (p - 0.5) * 2) : p) * 0.34,
  };
}
