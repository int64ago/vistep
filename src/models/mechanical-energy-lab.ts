export const ENERGY_G = 9.8;
export type EnergyMode = 'fall' | 'incline' | 'hanger' | 'pendulum';
export type EnergySceneState = {
  mode: EnergyMode;
  resistance: number;
  width: number;
  time: number;
  tape: boolean;
};
/** Capture both the physical state and the selected observation, including a tape close-up. */
export function energyFilmState(chapter: number, progress: number): EnergySceneState {
  const mode: EnergyMode =
    chapter < 3 ? 'fall' : chapter < 5 ? 'incline' : chapter < 7 ? 'hanger' : 'pendulum';
  const resistance = chapter === 2 ? 0.12 : 0;
  const width = 0.02;
  const limit =
    mode === 'fall'
      ? 0.42
      : mode === 'incline'
        ? inclinedEnergy(100, resistance / 3, width).endTime
        : mode === 'hanger'
          ? hangerEnergy(100, width).endTime
          : 3;
  return {
    mode,
    resistance,
    width,
    time: [1, 2, 4, 6].includes(chapter)
      ? limit
      : limit * Math.min(1, Math.max(0, progress) / 0.76),
    tape: mode === 'fall' && chapter > 0,
  };
}
function finite(...values: number[]) {
  if (!values.every(Number.isFinite)) throw new RangeError('Finite inputs required');
}
export function fallingEnergy(time: number, resistance = 0, mass = 0.2) {
  finite(time, resistance, mass);
  if (mass <= 0 || resistance < 0 || resistance >= mass * ENERGY_G)
    throw new RangeError('Falling regime required');
  const t = Math.max(0, Math.min(0.42, time)),
    a = ENERGY_G - resistance / mass,
    x = 0.5 * a * t * t,
    v = a * t;
  return {
    time: t,
    x,
    v,
    a,
    mass,
    resistance,
    potentialLoss: mass * ENERGY_G * x,
    kinetic: 0.5 * mass * v * v,
    dissipation: resistance * x,
  };
}
export function tapeEnergy(resistance = 0) {
  const dt = 0.02,
    t1 = 0.12,
    t2 = 0.34,
    at = (t: number) => fallingEnergy(t, resistance),
    measure = (t: number) => (at(t + dt).x - at(t - dt).x) / (2 * dt),
    v1 = measure(t1),
    v2 = measure(t2),
    height = at(t2).x - at(t1).x;
  return {
    dt,
    t1,
    t2,
    v1,
    v2,
    height,
    potentialLoss: ENERGY_G * height,
    kineticGain: 0.5 * (v2 * v2 - v1 * v1),
    mass: at(0).mass,
    dots: Array.from({ length: 22 }, (_, i) => at(i * dt)),
  };
}
/** Gate location is the flag CENTER coordinate; edge times are computed, never inferred from energy. */
export function gateMeasurement(location: number, width: number, acceleration: number) {
  finite(location, width, acceleration);
  if (width <= 0 || location <= width / 2 || acceleration <= 0)
    throw new RangeError('Flag must start outside the gate');
  const enter = Math.sqrt((2 * (location - width / 2)) / acceleration),
    exit = Math.sqrt((2 * (location + width / 2)) / acceleration),
    duration = exit - enter,
    meanSpeed = width / duration,
    trueSpeed = Math.sqrt(2 * acceleration * location),
    centerCorrection = Math.sqrt(meanSpeed ** 2 + ((acceleration * duration) / 2) ** 2);
  return { location, width, enter, exit, duration, meanSpeed, trueSpeed, centerCorrection };
}
export function inclinedEnergy(time: number, friction = 0.0, width = 0.02) {
  finite(time, friction, width);
  if (friction < 0 || friction > 0.12)
    throw new RangeError('Friction coefficient outside teaching range');
  const angle = (12 * Math.PI) / 180,
    mass = 0.2,
    a = ENERGY_G * (Math.sin(angle) - friction * Math.cos(angle)),
    endTime = Math.sqrt((2 * 1.05) / a),
    t = Math.max(0, Math.min(time, endTime)),
    x = 0.5 * a * t * t,
    v = a * t,
    gates = [gateMeasurement(0.3, width, a), gateMeasurement(0.9, width, a)],
    height = 0.6 * Math.sin(angle);
  return {
    time: t,
    endTime,
    angle,
    a,
    x,
    v,
    mass,
    gates,
    height,
    potentialLoss: mass * ENERGY_G * height,
    kineticGain: 0.5 * mass * (gates[1].meanSpeed ** 2 - gates[0].meanSpeed ** 2),
    trueGain: mass * a * 0.6,
    frictionLoss: friction * mass * ENERGY_G * Math.cos(angle) * 0.6,
  };
}
export function hangerEnergy(time: number, width = 0.02, cartMass = 0.25, hangerMass = 0.05) {
  finite(time, width, cartMass, hangerMass);
  if (cartMass <= 0 || hangerMass <= 0) throw new RangeError('Positive masses required');
  const totalMass = cartMass + hangerMass,
    a = (hangerMass * ENERGY_G) / totalMass,
    endTime = Math.sqrt((2 * 0.82) / a),
    t = Math.max(0, Math.min(time, endTime)),
    x = 0.5 * a * t * t,
    v = a * t,
    gate = gateMeasurement(0.65, width, a),
    speed = gate.meanSpeed;
  return {
    time: t,
    endTime,
    a,
    x,
    v,
    cartMass,
    hangerMass,
    totalMass,
    gate,
    potentialLoss: hangerMass * ENERGY_G * gate.location,
    kineticGain: 0.5 * totalMass * speed * speed,
    cartOnly: 0.5 * cartMass * speed * speed,
    tension: cartMass * a,
  };
}
/** Independent nonlinear pendulum dynamics, not an energy-law lookup. */
export function energyPendulum(time: number) {
  finite(time);
  const t = Math.max(0, Math.min(3, time)),
    length = 0.7,
    mass = 0.15,
    initial = 0.7,
    steps = Math.max(1, Math.ceil(t / 0.001)),
    dt = t / steps;
  let theta = initial,
    omega = 0;
  const acc = (q: number) => (-ENERGY_G / length) * Math.sin(q);
  for (let i = 0; i < steps; i++) {
    const k1 = acc(theta),
      w2 = omega + (k1 * dt) / 2,
      q2 = theta + (omega * dt) / 2,
      k2 = acc(q2),
      w3 = omega + (k2 * dt) / 2,
      q3 = theta + (w2 * dt) / 2,
      k3 = acc(q3),
      w4 = omega + k3 * dt,
      q4 = theta + w3 * dt,
      k4 = acc(q4);
    theta += (dt * (omega + 2 * w2 + 2 * w3 + w4)) / 6;
    omega += (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
  }
  const height = length * (1 - Math.cos(theta)),
    initialHeight = length * (1 - Math.cos(initial)),
    speed = length * Math.abs(omega);
  return {
    time: t,
    length,
    mass,
    theta,
    omega,
    x: length * Math.sin(theta),
    y: -length * Math.cos(theta),
    height,
    initialHeight,
    speed,
    potential: mass * ENERGY_G * height,
    kinetic: 0.5 * mass * speed * speed,
    total: mass * ENERGY_G * initialHeight,
  };
}
