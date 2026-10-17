export interface FlywheelParameters {
  mass: number;
  outer: number;
  inner: number;
  density: number;
  meanSpeed: number;
  driveMean: number;
  amplitude: number;
  period: number;
}
export const flywheelDefaults = (): FlywheelParameters => ({
  mass: 20,
  outer: 0.25,
  inner: 0.055,
  density: 7800,
  meanSpeed: 20,
  driveMean: 20,
  amplitude: 18,
  period: 2,
});
export function flywheelGeometry(p: FlywheelParameters) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.mass <= 0 ||
    p.outer <= 0 ||
    p.inner < 0 ||
    p.inner >= p.outer ||
    p.density <= 0 ||
    p.meanSpeed <= 0 ||
    p.driveMean <= 0 ||
    p.amplitude < 0 ||
    p.amplitude > p.driveMean ||
    p.period <= 0
  )
    throw new RangeError('Positive annular geometry and nonnegative input torque required');
  const inertia = 0.5 * p.mass * (p.outer * p.outer + p.inner * p.inner),
    thickness = p.mass / (p.density * Math.PI * (p.outer * p.outer - p.inner * p.inner)),
    frequency = (2 * Math.PI) / p.period,
    ripple = p.amplitude / (inertia * frequency);
  if (ripple >= p.meanSpeed) throw new RangeError('Periodic solution must remain forward rotating');
  return { inertia, thickness, frequency, ripple };
}
export function flywheelPeriodic(p: FlywheelParameters, time: number) {
  if (!Number.isFinite(time) || time < 0 || time > 60)
    throw new RangeError('Bounded nonnegative time required');
  const g = flywheelGeometry(p),
    a = g.ripple,
    f = g.frequency,
    phase = f * time,
    omega = p.meanSpeed - a * Math.cos(phase),
    angle = p.meanSpeed * time - (a / f) * Math.sin(phase),
    energy = 0.5 * g.inertia * omega * omega,
    initialEnergy = 0.5 * g.inertia * (p.meanSpeed - a) ** 2,
    netWork =
      (p.amplitude * p.meanSpeed * (1 - Math.cos(phase))) / f -
      (p.amplitude * a * Math.sin(phase) ** 2) / (2 * f),
    loadWork = p.driveMean * angle,
    driveTorque = p.driveMean + p.amplitude * Math.sin(phase),
    loadTorque = p.driveMean;
  return {
    ...g,
    time,
    omega,
    angle,
    energy,
    initialEnergy,
    netWork,
    inputWork: loadWork + netWork,
    loadWork,
    driveTorque,
    loadTorque,
    power: (driveTorque - loadTorque) * omega,
    mode: 'periodic' as const,
    stopped: false,
  };
}
export function flywheelCoast(p: FlywheelParameters, time: number) {
  if (!Number.isFinite(time) || time < 0 || time > 60)
    throw new RangeError('Bounded nonnegative time required');
  const start = flywheelPeriodic(p, p.period / 2),
    deceleration = p.driveMean / start.inertia,
    stopTime = start.omega / deceleration,
    t = Math.min(time, stopTime),
    omega = Math.max(0, start.omega - deceleration * t),
    travel = start.omega * t - 0.5 * deceleration * t * t,
    energy = 0.5 * start.inertia * omega * omega;
  return {
    ...start,
    time,
    omega,
    angle: start.angle + travel,
    energy,
    initialEnergy: start.energy,
    netWork: energy - start.energy,
    inputWork: 0,
    loadWork: p.driveMean * travel,
    driveTorque: 0,
    loadTorque: omega > 0 ? p.driveMean : 0,
    power: -p.driveMean * omega,
    mode: 'coast' as const,
    stopped: time >= stopTime,
    stopTime,
  };
}
export function flywheelStart(p: FlywheelParameters, time: number) {
  if (!Number.isFinite(time) || time < 0 || time > 60)
    throw new RangeError('Bounded nonnegative time required');
  const g = flywheelGeometry(p),
    omega = (p.driveMean * time) / g.inertia,
    angle = (0.5 * p.driveMean * time * time) / g.inertia,
    energy = 0.5 * g.inertia * omega * omega;
  return {
    ...g,
    time,
    omega,
    angle,
    energy,
    initialEnergy: 0,
    netWork: energy,
    inputWork: p.driveMean * angle,
    loadWork: 0,
    driveTorque: p.driveMean,
    loadTorque: 0,
    power: p.driveMean * omega,
    mode: 'start' as const,
    stopped: false,
  };
}
export type FlywheelState =
  | ReturnType<typeof flywheelPeriodic>
  | ReturnType<typeof flywheelCoast>
  | ReturnType<typeof flywheelStart>;
export function flywheelShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = flywheelDefaults();
  let time = u * 2,
    mode: 'periodic' | 'coast' | 'start' = 'periodic';
  if (chapter === 1) time = u;
  if (chapter === 2) time = 1 + u;
  if (chapter === 3) {
    p.inner = 0.055 + (0.21 - 0.055) * u;
    time = 1;
  }
  if (chapter === 4) {
    mode = 'coast';
    time = 1.2 * flywheelCoast(p, 0).stopTime * u;
  }
  if (chapter === 5) {
    p.inner = 0.21;
    mode = 'start';
    time = u;
  }
  return {
    parameters: p,
    state:
      mode === 'coast'
        ? flywheelCoast(p, time)
        : mode === 'start'
          ? flywheelStart(p, time)
          : flywheelPeriodic(p, time),
  };
}
