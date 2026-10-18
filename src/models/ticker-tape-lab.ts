/** Deterministic measurements: dots are generated at acquisition times, not evenly spaced. */
export type TapePath = 'timer' | 'velocity' | 'cart' | 'fall';
export const TAPE_FREQUENCY = 50;
export const tapeLimit = (mode: TapePath) => (mode === 'fall' ? 0.5 : 1);
export function tapeMotion(mode: TapePath, time: number, acceleration = 0.6) {
  const t = Math.max(0, Math.min(tapeLimit(mode), time));
  if (mode === 'fall') return { t, x: 4.9 * t * t, v: 9.8 * t, a: 9.8 };
  if (mode === 'cart')
    return {
      t,
      x: 0.12 * t + (acceleration * t * t) / 2,
      v: 0.12 + acceleration * t,
      a: acceleration,
    };
  if (mode === 'velocity')
    return {
      t,
      x: 0.12 * t + 0.12 * t * t + 0.08 * t ** 3,
      v: 0.12 + 0.24 * t + 0.24 * t * t,
      a: 0.24 + 0.48 * t,
    };
  return { t, x: 0.3 * t, v: 0.3, a: 0 };
}
export function tapeDots(
  mode: TapePath,
  until: number,
  frequency = TAPE_FREQUENCY,
  acceleration = 0.6,
) {
  if (!Number.isFinite(frequency) || frequency <= 0 || frequency > 1000)
    throw new RangeError('Frequency must be positive and bounded.');
  const count = Math.floor(Math.max(0, Math.min(until, tapeLimit(mode))) * frequency + 1e-8);
  return Array.from({ length: count + 1 }, (_, index) => ({
    index,
    ...tapeMotion(mode, index / frequency, acceleration),
  }));
}
export function tapeInterval(mode: TapePath, start: number, end: number, acceleration = 0.6) {
  const a = tapeMotion(mode, start, acceleration),
    b = tapeMotion(mode, end, acceleration);
  if (b.t <= a.t) throw new RangeError('Measurement needs a nonzero time interval.');
  return { start: a, end: b, dx: b.x - a.x, dt: b.t - a.t, average: (b.x - a.x) / (b.t - a.t) };
}
export function tapeAcceleration(mode: TapePath, center: number, dt = 0.1, acceleration = 0.6) {
  const left = tapeMotion(mode, center - dt, acceleration),
    middle = tapeMotion(mode, center, acceleration),
    right = tapeMotion(mode, center + dt, acceleration);
  if (Math.abs(middle.t - left.t - dt) > 1e-9 || Math.abs(right.t - middle.t - dt) > 1e-9)
    throw new RangeError('All three sampling times must be in range.');
  return (right.x - 2 * middle.x + left.x) / dt ** 2;
}
export function tapeShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    mode: TapePath =
      chapter === 0 ? 'timer' : chapter <= 2 ? 'velocity' : chapter === 3 ? 'cart' : 'fall';
  return {
    mode,
    time: chapter === 1 || chapter === 2 ? 1 : tapeLimit(mode) * Math.min(1, p / 0.72),
    start: chapter === 2 ? 0.5 : 0.2,
    end: chapter === 2 ? 0.5 + Math.max(0.02, 0.4 * (1 - Math.min(1, p / 0.75))) : 0.8,
  };
}
