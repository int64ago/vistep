/** Ideal unloaded Watt geometry plus an explicitly phenomenological lagged
 * sensor/engine feedback model. SI units; time in seconds. */
export interface GovernorParameters {
  length: number;
  inertia: number;
  drag: number;
  maximumTorque: number;
  referenceRpm: number;
  baseLoad: number;
  loadStep: number;
  gain: number;
  lag: number;
  feedback: boolean;
}
export const governorDefaults = (): GovernorParameters => ({
  length: 0.25,
  inertia: 3,
  drag: 0.2,
  maximumTorque: 12,
  referenceRpm: 72,
  baseLoad: 5,
  loadStep: 2,
  gain: 4,
  lag: 0.4,
  feedback: true,
});
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export function governorGeometry(rise: number, length = 0.25) {
  if (
    !Number.isFinite(rise) ||
    !Number.isFinite(length) ||
    length <= 0 ||
    rise < 0 ||
    rise >= 2 * length
  )
    throw new RangeError('Finite sleeve travel within two link lengths required');
  const height = length - rise / 2,
    radius = Math.sqrt(Math.max(0, length * length - height * height));
  return { height, radius, alpha: Math.acos(height / length), rise, length };
}
export function governorEquilibrium(omega: number, length = 0.25) {
  if (!Number.isFinite(omega) || omega < 0 || !Number.isFinite(length) || length <= 0)
    throw new RangeError('Nonnegative speed and positive link length required');
  const height = clamp(
    omega > 0 ? 9.81 / (omega * omega) : length,
    length * Math.cos((65 * Math.PI) / 180),
    length * Math.cos((12 * Math.PI) / 180),
  );
  return governorGeometry(2 * (length - height), length);
}
export function governorReading(
  omega: number,
  rise: number,
  time: number,
  phase: number,
  p: GovernorParameters,
) {
  const reference = (p.referenceRpm * Math.PI) / 30,
    ref = governorEquilibrium(reference, p.length),
    baseValve = (p.baseLoad + p.drag * reference) / p.maximumTorque,
    valve = clamp(baseValve - (p.feedback ? p.gain * (rise - ref.rise) : 0), 0, 1),
    load = p.baseLoad + (time >= 2 ? p.loadStep : 0);
  return {
    ...governorGeometry(rise, p.length),
    omega,
    rpm: (omega * 30) / Math.PI,
    time,
    phase,
    valve,
    load,
    torque: p.maximumTorque * valve,
    baseValve,
    referenceRise: ref.rise,
    feedback: p.feedback,
  };
}
export function governorTrajectory(p: GovernorParameters, seconds = 35, dt = 0.01) {
  if (
    !Object.values(p)
      .filter((v) => typeof v === 'number')
      .every(Number.isFinite) ||
    p.length <= 0 ||
    p.inertia <= 0 ||
    p.drag < 0 ||
    p.maximumTorque <= 0 ||
    p.referenceRpm < 60 ||
    p.referenceRpm > 85 ||
    p.baseLoad < 0 ||
    Math.abs(p.loadStep) > 3 ||
    p.baseLoad + p.loadStep < 0 ||
    p.gain <= 0 ||
    p.lag < 0.1 ||
    p.lag > 5 ||
    seconds <= 0 ||
    seconds > 60 ||
    dt <= 0 ||
    dt > 0.05
  )
    throw new RangeError('Bounded physical and numerical parameters required');
  let omega = (p.referenceRpm * Math.PI) / 30,
    rise = governorEquilibrium(omega, p.length).rise,
    phase = 0;
  const out = [governorReading(omega, rise, 0, phase, p)],
    steps = Math.ceil(seconds / dt),
    h = seconds / steps;
  const derivative = (w: number, z: number, t: number) => {
    const r = governorReading(Math.max(0, w), z, t, 0, p),
      dw = (r.torque - r.load - p.drag * Math.max(0, w)) / p.inertia;
    return {
      w: w <= 0 ? Math.max(0, dw) : dw,
      z: (governorEquilibrium(Math.max(0, w), p.length).rise - z) / p.lag,
      a: Math.max(0, w),
    };
  };
  for (let i = 1; i <= steps; i++) {
    const time = (i - 1) * h,
      // A step starts at t=2 exactly; left-limit stages avoid integrating a
      // fraction of the discontinuity into the preceding interval.
      limit = (t: number) => (time < 2 && t >= 2 ? 2 - 1e-12 : t),
      a = derivative(omega, rise, limit(time)),
      b = derivative(omega + (a.w * h) / 2, rise + (a.z * h) / 2, limit(time + h / 2)),
      c = derivative(omega + (b.w * h) / 2, rise + (b.z * h) / 2, limit(time + h / 2)),
      d = derivative(omega + c.w * h, rise + c.z * h, limit(time + h));
    omega = Math.max(0, omega + (h * (a.w + 2 * b.w + 2 * c.w + d.w)) / 6);
    rise += (h * (a.z + 2 * b.z + 2 * c.z + d.z)) / 6;
    phase += (h * (a.a + 2 * b.a + 2 * c.a + d.a)) / 6;
    out.push(governorReading(omega, rise, i * h, phase, p));
  }
  return out;
}
export type GovernorState = ReturnType<typeof governorReading>;
export function governorSample(points: GovernorState[], time: number) {
  const h = points[1].time,
    i = Math.min(points.length - 1, Math.max(0, Math.round(time / h)));
  return points[i];
}
