import { finiteClamp } from './modern-labs';
export function weberResponse(frequency = 1660, strain = 1e-18) {
  const f = finiteClamp(frequency, 1500, 1800),
    f0 = 1660,
    Q = 1000,
    L = 1.5,
    w = 2 * Math.PI * f,
    w0 = 2 * Math.PI * f0;
  return {
    amplitude: (L * strain * w * w) / (2 * Math.hypot(w0 * w0 - w * w, (w * w0) / Q)),
    frequency: f,
    Q,
    L,
  };
}
export function binaryPulsar(years = 30, phase = 0.2) {
  const m1 = 1.4398,
    m2 = 1.3886,
    e = 0.6171334,
    P = 27906.98,
    Ts = 4.925490947e-6,
    mu = 1.3271244e20 * (m1 + m2),
    a = (mu * (P / (2 * Math.PI)) ** 2) ** (1 / 3),
    n = (2 * Math.PI) / P;
  let E = 2 * Math.PI * phase;
  for (let j = 0; j < 12; j++)
    E -= (E - e * Math.sin(E) - 2 * Math.PI * phase) / (1 - e * Math.cos(E));
  const pdot =
      (((((-192 * Math.PI) / 5) * ((2 * Math.PI * Ts) / P) ** (5 / 3) * (m1 * m2)) /
        (m1 + m2) ** (1 / 3)) *
        (1 + (73 * e * e) / 24 + (37 * e ** 4) / 96)) /
      (1 - e * e) ** 3.5,
    t = finiteClamp(years, 0, 50) * 365.25 * 86400,
    // The illustrated observer is to the right (+x); positive radial velocity is recession.
    vr = (((a * m2) / (m1 + m2)) * Math.sin(E) * n) / (1 - e * Math.cos(E));
  return {
    pdot,
    advance: ((0.5 * pdot) / P) * t * t,
    observedPulseMs: 59.03 * (1 + vr / 299792458),
    x: Math.cos(E) - e,
    y: Math.sqrt(1 - e * e) * Math.sin(E),
    e,
  };
}
/** Leading-order inspiral only. No merger, ringdown, noise or detector antenna response. */
export function inspiral(time: number) {
  const t = finiteClamp(time, 0, 0.295),
    tau = 0.3 - t,
    mc = 28 * 4.925490947e-6,
    f = (5 / (256 * Math.PI ** (8 / 3) * mc ** (5 / 3) * tau)) ** (3 / 8),
    phase = ((-16 * Math.PI) / 5) * f * tau,
    envelope = 1e-21 * (f / 100) ** (2 / 3);
  return { frequency: f, strain: envelope * Math.cos(phase), envelope, phase };
}
export function interferometerStrain(h: number) {
  const L = 4000,
    lambda = 1064e-9;
  return {
    dx: (L * h) / 2,
    dy: (-L * h) / 2,
    difference: L * h,
    phase: (4 * Math.PI * L * h) / lambda,
  };
}
