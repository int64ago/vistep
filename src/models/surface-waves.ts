/** First-order Airy gravity waves: inviscid, irrotational, constant finite depth. */
export interface SurfaceWaveOptions {
  wavelength?: number;
  depth?: number;
  amplitude?: number;
}
export function surfaceWave(o: SurfaceWaveOptions = {}) {
  const wavelength = o.wavelength ?? 6,
    depth = o.depth ?? 3,
    amplitude = o.amplitude ?? 0.06;
  if (
    ![wavelength, depth, amplitude].every(Number.isFinite) ||
    wavelength <= 0 ||
    depth <= 0 ||
    amplitude < 0
  )
    throw new RangeError('Positive wavelength/depth and nonnegative amplitude required');
  const k = (2 * Math.PI) / wavelength,
    omega = Math.sqrt(9.81 * k * Math.tanh(k * depth)),
    period = (2 * Math.PI) / omega,
    c = omega / k,
    cg = (c / 2) * (1 + (2 * k * depth) / Math.sinh(2 * k * depth));
  return { wavelength, depth, amplitude, k, omega, period, c, cg };
}
/** Mean-position integration, consistently first order (closed ellipses, no second-order drift). */
export function surfaceParcel(x: number, z: number, time: number, o: SurfaceWaveOptions = {}) {
  const s = surfaceWave(o);
  if (z > 0 || z < -s.depth || ![x, z, time].every(Number.isFinite))
    throw new RangeError('Mean parcel must lie between mean surface and bed');
  const phase = s.k * (x - 2) - s.omega * time,
    a = (s.amplitude * Math.cosh(s.k * (z + s.depth))) / Math.sinh(s.k * s.depth),
    b = (s.amplitude * Math.sinh(s.k * (z + s.depth))) / Math.sinh(s.k * s.depth);
  return {
    x: x - a * Math.sin(phase),
    z: z + b * Math.cos(phase),
    dx: -a * Math.sin(phase),
    dz: b * Math.cos(phase),
    u: s.omega * a * Math.cos(phase),
    w: s.omega * b * Math.sin(phase),
    a,
    b,
  };
}
export function surfaceElevation(x: number, time: number, o: SurfaceWaveOptions = {}) {
  const s = surfaceWave(o);
  return s.amplitude * Math.cos(s.k * (x - 2) - s.omega * time);
}
/** Two exact linear modes: finite-difference envelope speed, not a fabricated travelling bump. */
export function surfaceBeat(x: number, time: number, o: SurfaceWaveOptions = {}) {
  const s = surfaceWave(o),
    k1 = s.k * 0.75,
    k2 = s.k * 1.25,
    w1 = Math.sqrt(9.81 * k1 * Math.tanh(k1 * s.depth)),
    w2 = Math.sqrt(9.81 * k2 * Math.tanh(k2 * s.depth)),
    origin = s.wavelength;
  const one = (s.amplitude / 2) * Math.cos(k1 * (x - origin) - w1 * time),
    two = (s.amplitude / 2) * Math.cos(k2 * (x - origin) - w2 * time),
    envelope = s.amplitude * Math.cos(((k2 - k1) * (x - origin)) / 2 - ((w2 - w1) * time) / 2);
  return {
    one,
    two,
    sum: one + two,
    envelope,
    group: (w2 - w1) / (k2 - k1),
    carrier: (w1 + w2) / (k1 + k2),
    origin,
  };
}
export function surfaceShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = { wavelength: 6, depth: 6, amplitude: 0.06, probe: 0.05, group: false };
  if (chapter === 1) return { ...base, probe: 0.05 + 0.95 * p };
  if (chapter === 2) return { ...base, depth: 6 - 5.4 * p, probe: 0.8 };
  if (chapter === 3) return { ...base, wavelength: 4 + 8 * p };
  if (chapter === 4) return { ...base, group: true };
  if (chapter === 5) return { ...base, wavelength: 12, depth: 0.6, group: true };
  return base;
}
