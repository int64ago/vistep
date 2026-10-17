export type FourierInput = { third: number; phase: number; frequency: number };
export const FOURIER_DEFAULT: FourierInput = { third: 0.5, phase: 0, frequency: 3 };
const TAU = 2 * Math.PI;
export function fourierSignal(t: number, s: FourierInput) {
  if (![t, s.third, s.phase, s.frequency].every(Number.isFinite))
    throw new RangeError('Finite Fourier input required');
  return (
    Math.sin(TAU * t) +
    s.third * Math.sin(TAU * s.frequency * t + s.phase) +
    0.25 * Math.cos(TAU * 5 * t)
  );
}
export function fourierSamples(s: FourierInput, n = 64) {
  if (!Number.isInteger(n) || n < 8 || n > 256)
    throw new RangeError('Sample count outside teaching range');
  return Array.from({ length: n }, (_, i) => fourierSignal(i / n, s));
}
export function dft(samples: number[]) {
  if (samples.length < 2 || !samples.every(Number.isFinite))
    throw new RangeError('Finite nonempty record required');
  const n = samples.length;
  return Array.from({ length: Math.floor(n / 2) + 1 }, (_, k) => {
    let re = 0,
      im = 0;
    for (let j = 0; j < n; j++) {
      const a = (TAU * k * j) / n;
      re += samples[j] * Math.cos(a);
      im -= samples[j] * Math.sin(a);
    }
    const factor = k === 0 || k === n / 2 ? 1 / n : 2 / n;
    return { k, re, im, amplitude: Math.hypot(re, im) * factor, phase: Math.atan2(im, re) };
  });
}
export function inverseReal(bins: ReturnType<typeof dft>, n: number, t: number, maxK = Infinity) {
  return bins
    .filter((b) => b.k <= maxK)
    .reduce(
      (sum, b) =>
        sum +
        ((b.k === 0 || b.k === n / 2 ? 1 : 2) / n) *
          (b.re * Math.cos(TAU * b.k * t) - b.im * Math.sin(TAU * b.k * t)),
      0,
    );
}
export function fourierProjection(samples: number[], k: number, end: number) {
  const count = Math.max(0, Math.min(samples.length, Math.floor(end * samples.length)));
  let re = 0,
    im = 0;
  for (let i = 0; i < count; i++) {
    const a = (TAU * k * i) / samples.length;
    re += (samples[i] * Math.cos(a) * 2) / samples.length;
    im -= (samples[i] * Math.sin(a) * 2) / samples.length;
  }
  return { re, im, count };
}
export function fourierShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress)),
    e = p * p * (3 - 2 * p),
    input = { ...FOURIER_DEFAULT };
  let terms = 3,
    k = 3,
    scan = 1;
  if (c === 0) scan = e;
  if (c === 1) terms = 1;
  if (c === 2) terms = 2;
  if (c === 4) {
    k = p < 0.45 ? 2 : 3;
    scan = p < 0.45 ? p / 0.45 : (p - 0.45) / 0.55;
  }
  if (c === 5) input.phase = Math.PI * e;
  if (c === 6) input.third = 0.5 * (1 - e);
  if (c === 7) input.frequency = 3 + 0.4 * e;
  return { input, terms, k, scan, view: c };
}
