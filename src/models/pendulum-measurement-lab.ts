import { stepPendulum } from './pendulum';
export function measuredPendulumPeriod(length: number, gravity = 9.81, angle = 0.08) {
  if (
    ![length, gravity, angle].every(Number.isFinite) ||
    length <= 0 ||
    gravity <= 0 ||
    Math.abs(angle) >= Math.PI
  )
    throw new RangeError('Invalid pendulum');
  let a = 1,
    b = Math.cos(Math.abs(angle) / 2);
  for (let i = 0; i < 12; i++) {
    const next = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = next;
  }
  return (2 * Math.PI * Math.sqrt(length / gravity)) / a;
}
export function measurementPendulum(
  time: number,
  length = 0.7,
  gravity = 9.81,
  angle = 0.08,
  fromCrossing = true,
) {
  if (!Number.isFinite(time) || time < 0) throw new RangeError('Invalid time');
  const period = measuredPendulumPeriod(length, gravity, angle),
    phase = (time + (fromCrossing ? period / 4 : 0)) % period,
    n = Math.max(1, Math.ceil(phase / 0.002));
  let s = { angle, velocity: 0, time: 0 };
  for (let i = 0; i < n; i++) s = stepPendulum(s, phase / n, length, gravity, 0);
  return { ...s, time, period, x: length * Math.sin(s.angle), drop: length * Math.cos(s.angle) };
}
export function gravityMeasurement(
  length = 0.7,
  angle = 0.08,
  cycles = 20,
  timeError = 0,
  lengthError = 0,
  includeRadius = true,
) {
  if (!Number.isInteger(cycles) || cycles <= 0 || ![timeError, lengthError].every(Number.isFinite))
    throw new RangeError('Invalid measurement');
  const radius = 0.015,
    period = measuredPendulumPeriod(length, 9.81, angle),
    elapsed = cycles * period + timeError,
    measuredLength = length + lengthError - (includeRadius ? 0 : radius);
  if (elapsed <= 0 || measuredLength <= 0) throw new RangeError('Invalid measured values');
  return {
    length,
    measuredLength,
    radius,
    cycles,
    elapsed,
    period: elapsed / cycles,
    inferred: (4 * Math.PI * Math.PI * measuredLength) / (elapsed / cycles) ** 2,
  };
}
export function inkDrop(emitted: number) {
  const length = 0.55,
    height = 0.65,
    g = 9.81,
    s = measurementPendulum(emitted, length, g, 0.17, false),
    tip = length + 0.035,
    x = tip * Math.sin(s.angle),
    z = height - tip * Math.cos(s.angle),
    vx = tip * Math.cos(s.angle) * s.velocity,
    vz = tip * Math.sin(s.angle) * s.velocity,
    flight = (vz + Math.sqrt(vz * vz + 2 * g * z)) / g;
  return { emitted, x, z, vx, vz, flight, impact: emitted + flight, landing: x + vx * flight };
}
export function rodGeometry(tiltDegrees: number, phase: number, length = 0.27) {
  if (
    ![tiltDegrees, phase, length].every(Number.isFinite) ||
    tiltDegrees < 0 ||
    tiltDegrees > 60 ||
    length <= 0
  )
    throw new RangeError('Invalid rod geometry');
  const theta = (tiltDegrees * Math.PI) / 180,
    n = [Math.sin(theta), 0, Math.cos(theta)],
    u = [Math.cos(theta), 0, -Math.sin(theta)],
    base = [0, 0, 0.08],
    pivot = base.map((v, i) => v + 0.25 * n[i]),
    upper = base.map((v, i) => v + 0.55 * n[i]),
    bob = pivot.map(
      (v, i) => v + length * (Math.cos(phase) * u[i] + (i === 1 ? Math.sin(phase) : 0)),
    );
  return { n, u, base, pivot, upper, bob, theta, effectiveGravity: 9.8 * Math.sin(theta) };
}
export const EFFECTIVE_DATA = [
  { theta: 11, T: 2.52, a: 1.87, inv: 0.731 },
  { theta: 14.5, T: 2.11, a: 2.45, inv: 0.639 },
  { theta: 19, T: 1.83, a: 3.19, inv: 0.56 },
  { theta: 22.5, T: 1.73, a: 3.75, inv: 0.516 },
  { theta: 25.5, T: 1.62, a: 4.22, inv: 0.487 },
  { theta: 29, T: 1.5, a: 4.75, inv: 0.459 },
];
export function effectiveDataFit() {
  const slope =
    EFFECTIVE_DATA.reduce((s, r) => s + r.inv * r.T, 0) /
    EFFECTIVE_DATA.reduce((s, r) => s + r.inv * r.inv, 0);
  return { slope, residuals: EFFECTIVE_DATA.map((r) => r.T - slope * r.inv) };
}
