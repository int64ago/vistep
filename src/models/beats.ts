/** Linear pressure superposition at one receiver; normalized amplitudes, SI seconds. */
export type BeatsConfig = { f1: number; f2: number; phase: number; amplitude: number };
export const beatsDefault: BeatsConfig = { f1: 220, f2: 222, phase: 0, amplitude: 1 };
export function beatsSample(c: BeatsConfig, time: number) {
  if (
    ![c.f1, c.f2, c.phase, c.amplitude, time].every(Number.isFinite) ||
    c.f1 <= 0 ||
    c.f2 <= 0 ||
    c.amplitude < 0
  )
    throw new RangeError('Positive finite frequencies required');
  const a = Math.sin(2 * Math.PI * c.f1 * time),
    b = c.amplitude * Math.sin(2 * Math.PI * c.f2 * time + c.phase);
  const relative = 2 * Math.PI * (c.f2 - c.f1) * time + c.phase;
  const envelope = Math.sqrt(
    Math.max(0, 1 + c.amplitude * c.amplitude + 2 * c.amplitude * Math.cos(relative)),
  );
  return { a, b, sum: a + b, envelope, relative, beatFrequency: Math.abs(c.f2 - c.f1) };
}
export function beatsShot(chapter: number, progress: number) {
  const i = Math.max(0, Math.min(7, chapter)),
    p = Math.max(0, Math.min(1, progress));
  const config = { ...beatsDefault };
  let time = p * 1.5;
  if (i === 0) config.amplitude = 0;
  if (i === 1) config.f2 = 220;
  if (i === 3) time = 0.5 + 0.04 * p;
  if (i === 4) time = 0.25 + 0.02 * p;
  if (i === 6) config.f2 = 224;
  if (i === 7) config.f2 = 222 - 2 * p;
  return { config, time, focus: i, ...beatsSample(config, time) };
}
export function beatsCurve(c: BeatsConfig, start: number, duration: number, count = 500) {
  return Array.from({ length: count }, (_, i) =>
    beatsSample(c, start + (duration * i) / (count - 1)),
  );
}
