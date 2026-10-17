export type RollingInput = { readout: number; exposure: number; velocity: number; flash: boolean };
export const ROLLING_DEFAULT: RollingInput = {
  readout: 0.024,
  exposure: 0.003,
  velocity: 12,
  flash: false,
};
const valid = (s: RollingInput) => {
  if (
    ![s.readout, s.exposure, s.velocity].every(Number.isFinite) ||
    s.readout < 0 ||
    s.readout > 0.1 ||
    s.exposure <= 0 ||
    s.exposure > 0.1 ||
    Math.abs(s.velocity) > 30
  )
    throw new RangeError('Rolling shutter outside teaching range');
};
export function rowWindow(row: number, s: RollingInput, global = false) {
  valid(s);
  if (!Number.isFinite(row) || row < 0 || row > 1)
    throw new RangeError('Normalized sensor row required');
  const start = global ? s.readout / 2 : row * s.readout;
  return { start, end: start + s.exposure, mid: start + s.exposure / 2 };
}
export function rollingPosition(time: number, s: RollingInput) {
  valid(s);
  return 0.5 + s.velocity * (time - (s.readout + s.exposure) / 2);
}
/** Exact time-integrated occupancy of an opaque vertical bar at a pixel center. */
export function rollingPixel(x: number, row: number, s: RollingInput, global = false) {
  const win = rowWindow(row, s, global),
    half = 0.038;
  let enters = -Infinity,
    leaves = Infinity;
  if (Math.abs(s.velocity) < 1e-12) {
    if (Math.abs(x - 0.5) > half) {
      enters = Infinity;
      leaves = -Infinity;
    }
  } else {
    const a = (x - half - 0.5) / s.velocity + (s.readout + s.exposure) / 2,
      b = (x + half - 0.5) / s.velocity + (s.readout + s.exposure) / 2;
    enters = Math.min(a, b);
    leaves = Math.max(a, b);
  }
  const overlap = (start: number, end: number) =>
    Math.max(0, Math.min(win.end, leaves, end) - Math.max(win.start, enters, start)) / s.exposure;
  const occupancy = overlap(-Infinity, Infinity);
  const flashStart = s.readout * 0.52,
    flashEnd = flashStart + 0.0015;
  const light = s.flash
    ? Math.max(0, Math.min(win.end, flashEnd) - Math.max(win.start, flashStart)) / s.exposure
    : 1;
  // The illuminated bar is the joint intersection, not a product of two time averages.
  const litOccupancy = s.flash ? overlap(flashStart, flashEnd) : occupancy;
  return { occupancy: Math.max(0, Math.min(1, occupancy)), light, litOccupancy };
}
export function rollingShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress)),
    e = p * p * (3 - 2 * p),
    input = { ...ROLLING_DEFAULT };
  let reveal = 1;
  if (c === 0) {
    input.velocity = 0;
    reveal = e;
  }
  if (c === 1) reveal = e;
  if (c === 3) input.exposure = 0.002;
  if (c === 4) input.exposure = 0.012 - 0.0115 * e;
  if (c === 5) input.readout = 0.024 - 0.021 * e;
  if (c === 6) input.velocity = 12 - 24 * e;
  if (c === 7) {
    input.velocity = 0;
    input.flash = true;
  }
  return { input, reveal, view: c, time: e * (input.readout + input.exposure) };
}
