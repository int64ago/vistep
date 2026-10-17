/** Linear damped oscillator. SI units; exact underdamped initial-value solution. */
export type ResonanceInput = { ratio: number; damping: number; force: number; initial: number };
const omega0 = 2 * Math.PI;
export const resonanceAmplitude = (ratio: number, damping: number, force = 0.2) =>
  force / Math.hypot(1 - ratio * ratio, 2 * damping * ratio);
export function resonanceFrame(input: ResonanceInput, time: number) {
  const { ratio, damping: z, force: f, initial } = input;
  if (
    ![ratio, z, f, initial, time].every(Number.isFinite) ||
    ratio < 0 ||
    z <= 0 ||
    z >= 1 ||
    time < 0
  )
    throw new RangeError('Finite underdamped oscillator required');
  const w = ratio * omega0,
    alpha = z * omega0,
    wd = omega0 * Math.sqrt(1 - z * z);
  const amplitude = resonanceAmplitude(ratio, z, f),
    phase = Math.atan2(2 * z * ratio, 1 - ratio * ratio);
  const xp = amplitude * Math.cos(w * time - phase),
    vp = -amplitude * w * Math.sin(w * time - phase);
  const c = initial - amplitude * Math.cos(phase),
    d = (-amplitude * w * Math.sin(phase) + alpha * c) / wd;
  const e = Math.exp(-alpha * time),
    co = Math.cos(wd * time),
    si = Math.sin(wd * time);
  const x = xp + e * (c * co + d * si),
    v = vp + e * ((-alpha * c + wd * d) * co + (-alpha * d - wd * c) * si);
  const applied = f * omega0 * omega0 * Math.cos(w * time),
    loss = 2 * alpha * v * v;
  return {
    x,
    v,
    amplitude,
    phase,
    applied,
    power: applied * v,
    loss,
    energy: 0.5 * (v * v + omega0 * omega0 * x * x),
    ratio,
    damping: z,
    time,
  };
}
export function resonanceShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const settings: ResonanceInput[] = [
    { ratio: 1, damping: 0.04, force: 0, initial: 0.8 },
    { ratio: 0.45, damping: 0.08, force: 0.2, initial: 0 },
    { ratio: 1, damping: 0.08, force: 0.2, initial: 0 },
    { ratio: 1, damping: 0.08, force: 0.2, initial: 0 },
    { ratio: 1, damping: 0.25, force: 0.2, initial: 0 },
    { ratio: 0.35 + 1.35 * p, damping: 0.08, force: 0.2, initial: 0 },
    { ratio: 1.65, damping: 0.08, force: 0.2, initial: 0 },
    { ratio: 1, damping: 0.08, force: 0.2, initial: 0 },
  ];
  const i = Math.max(0, Math.min(7, chapter));
  return resonanceFrame(settings[i], (i === 3 || i === 5 || i === 6 || i === 7 ? 24 : 0) + p * 12);
}
export function springPoints(start: number, end: number, y: number, turns = 12) {
  return Array.from({ length: turns * 2 + 4 }, (_, i) => {
    const n = turns * 2 + 3;
    return { x: start + ((end - start) * i) / n, y: y + (i < 2 || i > n - 2 ? 0 : i % 2 ? 9 : -9) };
  });
}
