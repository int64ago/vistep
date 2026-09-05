export type PendulumState = { angle: number; velocity: number; time: number };
export function stepPendulum(
  s: PendulumState,
  dt: number,
  length: number,
  gravity: number,
  damping: number,
): PendulumState {
  const a = (angle: number, velocity: number) =>
    (-gravity / length) * Math.sin(angle) - damping * velocity;
  const k1v = a(s.angle, s.velocity),
    k1a = s.velocity;
  const k2v = a(s.angle + (k1a * dt) / 2, s.velocity + (k1v * dt) / 2),
    k2a = s.velocity + (k1v * dt) / 2;
  const k3v = a(s.angle + (k2a * dt) / 2, s.velocity + (k2v * dt) / 2),
    k3a = s.velocity + (k2v * dt) / 2;
  const k4v = a(s.angle + k3a * dt, s.velocity + k3v * dt),
    k4a = s.velocity + k3v * dt;
  return {
    angle: s.angle + (dt * (k1a + 2 * k2a + 2 * k3a + k4a)) / 6,
    velocity: s.velocity + (dt * (k1v + 2 * k2v + 2 * k3v + k4v)) / 6,
    time: s.time + dt,
  };
}
export function pendulumEnergy(s: PendulumState, l: number, g: number, m: number) {
  return {
    potential: m * g * l * (1 - Math.cos(s.angle)),
    kinetic: 0.5 * m * (l * s.velocity) ** 2,
  };
}
export const smallAnglePeriod = (length: number, gravity: number) =>
  2 * Math.PI * Math.sqrt(length / gravity);
