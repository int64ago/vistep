/** Light, uniform Hookean spring; displacement is measured from static equilibrium. */
export function springState(
  time: number,
  mass = 0.2,
  lengthFraction = 1,
  amplitude = 0.05,
  delay = 0,
) {
  if (
    ![time, mass, lengthFraction, amplitude, delay].every(Number.isFinite) ||
    time < 0 ||
    mass <= 0 ||
    lengthFraction <= 0 ||
    amplitude < 0 ||
    delay < 0
  )
    throw new RangeError('Invalid spring state');
  const k = 20 / lengthFraction,
    naturalLength = 0.16 * lengthFraction,
    omega = Math.sqrt(k / mass),
    period = (2 * Math.PI) / omega,
    active = time >= delay,
    phase = omega * Math.max(0, time - delay),
    x = amplitude * Math.cos(phase),
    v = active ? -amplitude * omega * Math.sin(phase) : 0;
  return {
    mass,
    k,
    naturalLength,
    omega,
    period,
    x,
    v,
    held: !active,
    equilibrium: naturalLength + (mass * 9.81) / k,
    force: -k * x,
    energy: 0.5 * mass * v * v + 0.5 * k * x * x,
  };
}
export function springSamples(
  time: number,
  interval: number,
  mass = 0.2,
  lengthFraction = 1,
  amplitude = 0.05,
) {
  if (
    !Number.isFinite(interval) ||
    interval <= 0 ||
    !Number.isFinite(time) ||
    time < 0 ||
    time / interval > 10000
  )
    throw new RangeError('Invalid recording');
  return Array.from({ length: Math.floor(time / interval + 1e-9) + 1 }, (_, i) => ({
    time: i * interval,
    ...springState(i * interval, mass, lengthFraction, amplitude),
  }));
}
export function measuredSpringPeriod(
  mass: number,
  lengthFraction: number,
  cycles = 10,
  timingError = 0,
) {
  if (!Number.isInteger(cycles) || cycles <= 0 || !Number.isFinite(timingError))
    throw new RangeError('Invalid timing');
  const s = springState(0, mass, lengthFraction),
    elapsed = cycles * s.period + timingError;
  return { elapsed, period: elapsed / cycles, cycles, k: s.k };
}
/** Paper moves left; distance from the initial mark to the current pen is speed*time. */
export function pencilTrace(time: number, paperSpeed = 0.05) {
  if (!Number.isFinite(paperSpeed) || paperSpeed <= 0) throw new RangeError('Invalid paper speed');
  const s = springState(time);
  return { paper: paperSpeed * time, x: s.x };
}
