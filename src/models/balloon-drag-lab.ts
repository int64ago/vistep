/** PEP Required Book 1, printed p118. Frame period T0 is not supplied. */
export const BALLOON_DATA = [
  { weight: 0.045, stepCm: 13.6 },
  { weight: 0.055, stepCm: 16.3 },
  { weight: 0.065, stepCm: 19.8 },
  { weight: 0.075, stepCm: 23.8 },
  { weight: 0.085, stepCm: 26.6 },
  { weight: 0.095, stepCm: 28.8 },
  { weight: 0.105, stepCm: 32.8 },
] as const;
export function balloonFit(power: 1 | 2, buoyancy = 0) {
  if (!Number.isFinite(buoyancy) || buoyancy < 0 || buoyancy >= BALLOON_DATA[0].weight)
    throw new RangeError('Buoyancy must remain below every total weight.');
  const points = BALLOON_DATA.map((q) => ({ speed: q.stepCm, drag: q.weight - buoyancy })),
    coefficient =
      points.reduce((s, p) => s + p.speed ** power * p.drag, 0) /
      points.reduce((s, p) => s + p.speed ** (2 * power), 0),
    residuals = points.map((p) => p.drag - coefficient * p.speed ** power),
    rmse = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / points.length);
  return { power, coefficient, points, residuals, rmse };
}
export function balloonVideo(trial: number, frame: number, accelerating = false) {
  if (
    !Number.isInteger(trial) ||
    trial < 0 ||
    trial >= BALLOON_DATA.length ||
    !Number.isFinite(frame)
  )
    throw new RangeError('Valid dataset index and finite frame required.');
  const f = Math.max(0, Math.min(6, frame)),
    q = BALLOON_DATA[trial],
    tau = 1.25;
  const position = (n: number) =>
      q.stepCm * (accelerating ? n - tau * (1 - Math.exp(-n / tau)) : n),
    positions = Array.from({ length: Math.floor(f) + 1 }, (_, i) => position(i)),
    spacings = positions.slice(1).map((p, i) => p - positions[i]),
    average = spacings.length ? (positions.at(-1)! - positions[0]) / spacings.length : null;
  return {
    frame: f,
    positionCm: position(f),
    positions,
    spacings,
    average,
    velocityCmPerT0: q.stepCm * (accelerating ? 1 - Math.exp(-f / tau) : 1),
    weight: q.weight,
    terminal: !accelerating,
  };
}
export function balloonBalance(weight: number, buoyancy = 0, acceleration = 0) {
  if (![weight, buoyancy, acceleration].every(Number.isFinite) || weight <= 0 || buoyancy < 0)
    throw new RangeError('Finite physical forces required');
  const mass = weight / 9.8;
  return { mass, drag: weight - buoyancy - mass * acceleration };
}
