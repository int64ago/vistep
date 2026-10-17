/** Ideal taut string with fixed ends. L in m, tension N, density kg/m. */
export type StandingConfig = {
  length: number;
  tension: number;
  density: number;
  mode: number;
  amplitude: number;
};
export const standingDefault: StandingConfig = {
  length: 1,
  tension: 4,
  density: 0.01,
  mode: 2,
  amplitude: 0.03,
};
export function standingWave(c: StandingConfig, x: number, time: number) {
  if (
    ![c.length, c.tension, c.density, c.mode, c.amplitude, x, time].every(Number.isFinite) ||
    c.length <= 0 ||
    c.tension <= 0 ||
    c.density <= 0 ||
    !Number.isInteger(c.mode) ||
    c.mode < 1 ||
    c.mode > 12 ||
    c.amplitude < 0
  )
    throw new RangeError('Finite positive string and integer mode required');
  const speed = Math.sqrt(c.tension / c.density),
    k = (c.mode * Math.PI) / c.length,
    w = speed * k;
  const incident = c.amplitude * Math.sin(k * x - w * time),
    reflected = c.amplitude * Math.sin(k * x + w * time);
  const displacement = incident + reflected,
    velocity = -2 * c.amplitude * w * Math.sin(k * x) * Math.sin(w * time),
    slope = 2 * c.amplitude * k * Math.cos(k * x) * Math.cos(w * time);
  return {
    incident,
    reflected,
    displacement,
    velocity,
    slope,
    energy: 0.5 * c.density * velocity * velocity + 0.5 * c.tension * slope * slope,
    frequency: w / (2 * Math.PI),
    speed,
  };
}
export const standingNodes = (c: StandingConfig) =>
  Array.from({ length: c.mode + 1 }, (_, i) => (i * c.length) / c.mode);
export function standingShot(chapter: number, progress: number) {
  const i = Math.max(0, Math.min(7, chapter)),
    p = Math.max(0, Math.min(1, progress));
  const config = {
    ...standingDefault,
    mode: i < 5 ? 1 : i === 6 ? 3 : 2,
    tension: i === 7 ? 4 + 12 * p : 4,
  };
  const f = standingWave(config, 0, 0).frequency;
  return { config, time: (p * 4) / f, focus: i };
}
