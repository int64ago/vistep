const TAU = 2 * Math.PI;
export type SamplingInput = {
  frequency: number;
  sampleRate: number;
  phase: number;
  amplitude: number;
  low: boolean;
};
export const SAMPLING_DEFAULT: SamplingInput = {
  frequency: 6,
  sampleRate: 8,
  phase: 0,
  amplitude: 1,
  low: false,
};
function finite(...v: number[]) {
  if (!v.every(Number.isFinite)) throw new RangeError('Finite sampling inputs required');
}
export function aliasFrequency(f: number, fs: number) {
  finite(f, fs);
  if (f < 0 || fs <= 0) throw new RangeError('Positive sampling rate required');
  return f - Math.floor(f / fs + 0.5) * fs;
}
export function samplingValue(s: SamplingInput, time: number, fold = false) {
  finite(s.frequency, s.sampleRate, s.phase, s.amplitude, time);
  const f = fold ? aliasFrequency(s.frequency, s.sampleRate) : s.frequency;
  return (
    s.amplitude * Math.cos(TAU * f * time + s.phase) + (s.low ? 0.5 * Math.cos(TAU * time) : 0)
  );
}
export function samplingPoints(s: SamplingInput, end = 2) {
  finite(end);
  if (end < 0 || end > 10 || s.sampleRate < 1 || s.sampleRate > 100)
    throw new RangeError('Sampling window outside teaching limits');
  return Array.from({ length: Math.floor(end * s.sampleRate + 1e-8) + 1 }, (_, n) => ({
    n,
    time: n / s.sampleRate,
    value: samplingValue(s, n / s.sampleRate),
  }));
}
export function samplingShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress)),
    e = p * p * (3 - 2 * p);
  const input = { ...SAMPLING_DEFAULT };
  let reveal = 1;
  if (c === 0) {
    input.frequency = 2;
    input.sampleRate = 12;
    reveal = e;
  }
  if (c === 1) {
    input.frequency = 2;
    input.sampleRate = 8;
  }
  if (c === 2) {
    input.frequency = 2 + 4 * e;
  }
  if (c === 3) {
    input.frequency = 6;
  }
  if (c === 4) {
    input.sampleRate = 8 + 12 * e;
  }
  if (c === 5) {
    input.frequency = 6;
    input.sampleRate = 12;
    input.phase = (Math.PI / 2) * e;
  }
  if (c === 6) {
    input.frequency = 7;
    input.low = true;
    input.amplitude = 1 - e;
  }
  if (c === 7) {
    input.frequency = 7;
    input.sampleRate = 8 + 12 * e;
    input.low = true;
    input.amplitude = 0.6;
  }
  return { input, reveal, view: c, alias: aliasFrequency(input.frequency, input.sampleRate) };
}
