/** PEP Required Book 1, printed p118. Frame period T0 is not supplied. */
export const BALLOON_DATA = Object.freeze(
  [
    { weight: 0.045, stepCm: 13.6 },
    { weight: 0.055, stepCm: 16.3 },
    { weight: 0.065, stepCm: 19.8 },
    { weight: 0.075, stepCm: 23.8 },
    { weight: 0.085, stepCm: 26.6 },
    { weight: 0.095, stepCm: 28.8 },
    { weight: 0.105, stepCm: 32.8 },
  ].map((record) => Object.freeze(record)),
);
export function balloonFit(power: 1 | 2, buoyancy = 0) {
  if (
    (power !== 1 && power !== 2) ||
    !Number.isFinite(buoyancy) ||
    buoyancy < 0 ||
    buoyancy >= BALLOON_DATA[0].weight
  )
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
  const drag = weight - buoyancy - mass * acceleration;
  if (!Number.isFinite(drag)) throw new RangeError('Force balance exceeds the numerical range.');
  return { mass, drag };
}

export type BalloonView = 'apparatus' | 'frames' | 'records' | 'fit' | 'balance';
export function balloonFilm(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  if (![chapter, chapterTime].every(Number.isFinite))
    throw new RangeError('Finite chapter clock required');
  const c = Math.max(0, Math.min(4, Math.floor(chapter))),
    t = Math.max(0, chapterTime),
    p = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const cuts =
    locale === 'en'
      ? { steady: 6.61, correction: 11.59, line: 8, quadratic: 9.8, result: 11.33 }
      : { steady: 7.39, correction: 14.83, line: 7, quadratic: 8.8, result: 11.05 };
  const view: BalloonView =
    c === 0
      ? 'apparatus'
      : c === 1
        ? 'frames'
        : c === 2
          ? 'records'
          : c === 3
            ? 'fit'
            : t < cuts.correction
              ? 'balance'
              : 'fit';
  return {
    view,
    trial: c === 2 ? Math.min(6, Math.floor(t / (locale === 'en' ? 0.95 : 1.05))) : 2,
    frame: c === 0 ? 0 : 6 * p(0, 11),
    accelerating: c === 4 && t < cuts.steady,
    power: 1 as 1 | 2,
    buoyancy: c === 4 ? 0.012 * p(cuts.steady, cuts.steady + 2) : 0,
    visible: c === 2 ? Math.min(7, Math.floor(t / (locale === 'en' ? 0.95 : 1.05)) + 1) : 7,
    showFits: c !== 3 || t >= cuts.line,
    showQuadratic: c !== 3 || t >= cuts.quadratic,
    reveal: c !== 3 || t >= cuts.result,
    locale,
  };
}
