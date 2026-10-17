/** Frictionless puck over a uniformly rotating flat table. Metres, seconds, radians.
 * The table exerts no horizontal force after release; the two cameras see one worldline.
 */
export type RotationPoint = { x: number; y: number };
export type CoriolisConfig = { omega: number; speed: number; offset: number };
export const rotatePoint = (p: RotationPoint, a: number): RotationPoint => ({
  x: p.x * Math.cos(a) - p.y * Math.sin(a),
  y: p.x * Math.sin(a) + p.y * Math.cos(a),
});
export function coriolisFrame(c: CoriolisConfig, time: number) {
  if (
    ![c.omega, c.speed, c.offset, time].every(Number.isFinite) ||
    Math.abs(c.omega) > 1 ||
    c.speed < 0 ||
    c.speed > 0.15 ||
    Math.abs(c.offset) > 0.35 ||
    time < 0 ||
    time > 8
  )
    throw new RangeError('Outside the finite turntable teaching domain.');
  const initial = { x: 0, y: c.offset };
  // A push along the table's initial x axis inherits Ω × r₀ in the laboratory.
  const velocity = { x: c.speed - c.omega * c.offset, y: 0 };
  const laboratory = { x: initial.x + velocity.x * time, y: initial.y };
  const angle = c.omega * time;
  const table = rotatePoint(laboratory, -angle);
  const rotatedVelocity = rotatePoint(velocity, -angle);
  const relativeVelocity = {
    x: rotatedVelocity.x + c.omega * table.y,
    y: rotatedVelocity.y - c.omega * table.x,
  };
  const coriolis = { x: 2 * c.omega * relativeVelocity.y, y: -2 * c.omega * relativeVelocity.x };
  const centrifugal = { x: c.omega ** 2 * table.x, y: c.omega ** 2 * table.y };
  return {
    time,
    angle,
    initial,
    velocity,
    laboratory,
    table,
    relativeVelocity,
    coriolis,
    centrifugal,
    acceleration: { x: coriolis.x + centrifugal.x, y: coriolis.y + centrifugal.y },
  };
}
export function coriolisTrail(config: CoriolisConfig, time: number, frame: 'laboratory' | 'table') {
  return Array.from({ length: 81 }, (_, i) => coriolisFrame(config, (time * i) / 80)[frame]);
}
export function coriolisShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const q = p * p * (3 - 2 * p);
  const config: CoriolisConfig = { omega: 0.42, speed: 0.105, offset: 0 };
  if (chapter === 0) config.omega = 0;
  if (chapter === 3) config.omega = 0.12 + 0.55 * q;
  if (chapter === 4) config.omega = -0.42;
  if (chapter === 5) {
    config.offset = 0.3;
    config.omega = 0.24;
  }
  if (chapter === 7) config.omega = 0.42 * (1 - q);
  const time = chapter === 3 || chapter === 7 ? 6 : 8 * q;
  return {
    config,
    time,
    primary: chapter === 0 || chapter === 5 ? ('laboratory' as const) : ('table' as const),
  };
}
