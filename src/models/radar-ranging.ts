export const RADAR_C = 299792458;
export type RadarInput = { range: number; second: number | null; pulse: number; pri: number };
export const RADAR_DEFAULT: RadarInput = { range: 600, second: null, pulse: 0.4e-6, pri: 8e-6 };
function positive(...v: number[]) {
  if (!v.every((v) => Number.isFinite(v) && v > 0))
    throw new RangeError('Positive finite radar quantities required');
}
export function radarDelay(range: number) {
  positive(range);
  return (2 * range) / RADAR_C;
}
export function radarRange(delay: number) {
  if (!Number.isFinite(delay) || delay < 0) throw new RangeError('Nonnegative delay required');
  return (RADAR_C * delay) / 2;
}
export function radarLimits(pulse: number, pri: number) {
  positive(pulse, pri);
  if (pulse >= pri) throw new RangeError('Pulse must be shorter than PRI');
  return {
    resolution: (RADAR_C * pulse) / 2,
    minRange: (RADAR_C * pulse) / 2,
    unambiguous: (RADAR_C * pri) / 2,
  };
}
export function radarApparentRange(range: number, pri: number) {
  positive(range, pri);
  return radarRange(radarDelay(range) % pri);
}
/** Repeated transmit windows also blank the receiver, including late echoes. */
export function radarTransmitWindows(pulse: number, pri: number, end: number) {
  radarLimits(pulse, pri);
  if (!Number.isFinite(end) || end < 0 || end / pri > 256)
    throw new RangeError('Finite radar timeline of at most 256 intervals required');
  return Array.from({ length: Math.floor(end / pri) + 1 }, (_, index) => ({
    index,
    start: index * pri,
    end: Math.min(end, index * pri + pulse),
  })).filter((window) => window.end > window.start);
}
/** Geometry-only timing of one echo, not a detector or a guarantee of a range estimate. */
export function radarObservation(range: number, pulse: number, pri: number) {
  const limits = radarLimits(pulse, pri),
    delay = radarDelay(range),
    phase = delay % pri;
  let blanked = 0;
  for (let index = Math.floor(delay / pri); index <= Math.floor((delay + pulse) / pri); index++)
    blanked += Math.max(
      0,
      Math.min(delay + pulse, index * pri + pulse) - Math.max(delay, index * pri),
    );
  return {
    range,
    delay,
    apparent: radarRange(phase),
    ambiguous: delay >= pri,
    frontBlanked: phase < pulse,
    visibleFraction: Math.max(0, Math.min(1, 1 - blanked / pulse)),
    ...limits,
  };
}
/** Pulse envelope occupies path arclength [c(t−tau),ct], intersected with the round trip. */
export function radarPulseSegments(range: number, time: number, pulse: number) {
  positive(range, pulse);
  if (!Number.isFinite(time)) throw new RangeError('Finite pulse time required');
  const lo = Math.max(0, RADAR_C * (time - pulse)),
    hi = Math.min(2 * range, RADAR_C * time);
  if (hi <= lo) return [];
  const out: { a: number; b: number; returning: boolean }[] = [];
  if (lo < range) out.push({ a: lo, b: Math.min(range, hi), returning: false });
  if (hi > range)
    out.push({ a: 2 * range - hi, b: 2 * range - Math.max(range, lo), returning: true });
  return out;
}
export function radarEcho(time: number, s: RadarInput, blank = true) {
  radarLimits(s.pulse, s.pri);
  if (!Number.isFinite(time)) throw new RangeError('Finite radar time required');
  if (blank && time >= 0 && time % s.pri < s.pulse) return 0;
  return [s.range, ...(s.second === null ? [] : [s.second])].reduce(
    (sum, r, i) =>
      sum + (time >= radarDelay(r) && time < radarDelay(r) + s.pulse ? (i === 0 ? 1 : 0.8) : 0),
    0,
  );
}
export function radarShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress)),
    e = p * p * (3 - 2 * p),
    input = { ...RADAR_DEFAULT };
  let time = radarDelay(input.range) + input.pulse;
  if (c === 0) time = (e * input.range) / RADAR_C;
  if (c === 1) time = input.range / RADAR_C + e * (input.range / RADAR_C + input.pulse);
  if (c === 2) time = radarDelay(input.range);
  if (c === 3) {
    input.range = 600 + 450 * e;
    time = radarDelay(input.range);
  }
  if (c === 4) {
    input.second = 690;
    input.pulse = 1e-6;
    time = radarDelay(690) + input.pulse;
  }
  if (c === 5) {
    input.second = 690;
    input.pulse = (1 - 0.8 * e) * 1e-6;
    time = radarDelay(690) + input.pulse;
  }
  if (c === 6) {
    input.range = 75;
    input.pulse = 1.5e-6;
    time = radarDelay(input.range) + input.pulse;
  }
  if (c === 7) {
    input.range = 1500;
    time = radarDelay(input.range);
  }
  return { input, time, view: c };
}
