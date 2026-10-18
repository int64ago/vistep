export function motorOscillator(time: number, frequency = 1, k = 12) {
  if (![time, frequency, k].every(Number.isFinite) || time < 0 || frequency <= 0 || k <= 0)
    throw new RangeError('Invalid drive');
  const mass = 0.2,
    beta = 0.6,
    amplitude = 0.012,
    w = 2 * Math.PI * frequency,
    w0 = Math.sqrt(k / mass),
    wd = Math.sqrt(w0 * w0 - beta * beta);
  if (!Number.isFinite(wd)) throw new RangeError('Underdamped spring required');
  const den = Math.hypot(w0 * w0 - w * w, 2 * beta * w),
    Q = (amplitude * w * w) / den,
    phase = Math.atan2(2 * beta * w, w0 * w0 - w * w),
    q0 = Q * Math.cos(phase),
    v0 = Q * w * Math.sin(phase),
    C = -q0,
    D = (-v0 + beta * C) / wd,
    qss = Q * Math.cos(w * time - phase),
    vss = -Q * w * Math.sin(w * time - phase),
    decay = Math.exp(-beta * time),
    q = qss + decay * (C * Math.cos(wd * time) + D * Math.sin(wd * time)),
    v =
      vss +
      decay *
        ((-beta * C + wd * D) * Math.cos(wd * time) + (-beta * D - wd * C) * Math.sin(wd * time)),
    base = amplitude * Math.cos(w * time);
  return {
    mass,
    k,
    beta,
    amplitude,
    w,
    w0,
    frequency,
    naturalFrequency: w0 / (2 * Math.PI),
    q,
    v,
    base,
    absolute: base + q,
    equilibrium: 0.18 + (mass * 9.81) / k,
    steadyRelativeAmplitude: Q,
    phase,
  };
}
export function measuredDriveFrequency(frequency: number, k: number) {
  const crossings: number[] = [];
  let previous = motorOscillator(20, frequency, k).absolute;
  for (let i = 1; i <= 10000; i++) {
    const t = 20 + i * 0.001,
      x = motorOscillator(t, frequency, k).absolute;
    if (previous < 0 && x >= 0) crossings.push(t - 0.001 + (0.001 * -previous) / (x - previous));
    previous = x;
  }
  return crossings.length > 1 ? (crossings.length - 1) / (crossings.at(-1)! - crossings[0]) : null;
}
export const pendulumLengths = [0.35, 0.27, 0.18, 0.35, 0.55, 0.44, 0.35];
export function coupledPendulumTrajectory(driverLength = 0.35, damping = 0.015, duration = 36) {
  if (
    ![driverLength, damping, duration].every(Number.isFinite) ||
    driverLength < 0.18 ||
    driverLength > 0.55 ||
    damping < 0 ||
    damping > 0.1 ||
    duration < 0 ||
    duration > 40
  )
    throw new RangeError('Invalid coupled pendula');
  const L = pendulumLengths.map((l, i) => (i === 3 ? driverLength : l)),
    mass = L.map((_, i) => (i === 3 ? 0.6 : 0.02)),
    beamMass = 0.5,
    K = 1500,
    C = damping * 2,
    g = 9.81,
    dt = 0.0015;
  let y = [0, 0, ...L.map((_, i) => (i === 3 ? 0.18 : 0)), ...L.map(() => 0)];
  const energy = (z: number[]) => {
    let e = 0.5 * beamMass * z[1] ** 2 + 0.5 * K * z[0] ** 2;
    for (let i = 0; i < 7; i++)
      e += 0.5 * mass[i] * (z[1] + L[i] * z[9 + i]) ** 2 + 0.5 * mass[i] * g * L[i] * z[2 + i] ** 2;
    return e;
  };
  const derivative = (z: number[]) => {
      const acceleration =
        (L.reduce(
          (sum, l, i) => sum + mass[i] * g * z[2 + i] + 2 * mass[i] * l * damping * z[9 + i],
          0,
        ) -
          K * z[0] -
          C * z[1]) /
        beamMass;
      return [
        z[1],
        acceleration,
        ...z.slice(9),
        ...L.map((l, i) => (-g / l) * z[2 + i] - acceleration / l - 2 * damping * z[9 + i]),
      ];
    },
    samples = [{ time: 0, beam: 0, angles: y.slice(2, 9), energy: energy(y) }];
  for (let time = 0; time < duration - 1e-9;) {
    const h = Math.min(dt, duration - time),
      a = derivative(y),
      b = derivative(y.map((v, i) => v + (h * a[i]) / 2)),
      c = derivative(y.map((v, i) => v + (h * b[i]) / 2)),
      d = derivative(y.map((v, i) => v + h * c[i]));
    y = y.map((v, i) => v + (h * (a[i] + 2 * b[i] + 2 * c[i] + d[i])) / 6);
    time += h;
    samples.push({ time, beam: y[0], angles: y.slice(2, 9), energy: energy(y) });
  }
  return { samples, L, mass, K, beamMass, dt, duration };
}
export function sampleCoupled(path: ReturnType<typeof coupledPendulumTrajectory>, time: number) {
  const at = Math.max(0, Math.min(path.duration, time)),
    i = Math.min(path.samples.length - 1, Math.floor(at / path.dt)),
    a = path.samples[i],
    b = path.samples[Math.min(i + 1, path.samples.length - 1)],
    u = b.time > a.time ? (at - a.time) / (b.time - a.time) : 0;
  return {
    time: at,
    beam: a.beam + (b.beam - a.beam) * u,
    angles: a.angles.map((v, j) => v + (b.angles[j] - v) * u),
    energy: a.energy + (b.energy - a.energy) * u,
  };
}
