export type ForceVector = { x: number; y: number };
export function resultantExperiment(
  leftDegrees = 35,
  rightDegrees = 50,
  length = 0.28,
  stiffness = 20,
) {
  if (
    ![leftDegrees, rightDegrees, length, stiffness].every(Number.isFinite) ||
    leftDegrees <= 0 ||
    rightDegrees <= 0 ||
    leftDegrees >= 85 ||
    rightDegrees >= 85 ||
    length < 0.15 ||
    stiffness <= 0
  )
    throw new RangeError('Two upward taut directions and an extended elastic strip required.');
  const a = (leftDegrees * Math.PI) / 180,
    b = (rightDegrees * Math.PI) / 180,
    required = stiffness * (length - 0.15),
    leftForce = (required * Math.sin(b)) / Math.sin(a + b),
    rightForce = (required * Math.sin(a)) / Math.sin(a + b),
    left = { x: -leftForce * Math.sin(a), y: leftForce * Math.cos(a) },
    right = { x: rightForce * Math.sin(b), y: rightForce * Math.cos(b) },
    sum = { x: left.x + right.x, y: left.y + right.y };
  return {
    left,
    right,
    sum,
    leftForce,
    rightForce,
    required,
    length,
    anchor: { x: 0, y: 0 },
    ring: { x: 0, y: length },
    elastic: { x: 0, y: -required },
  };
}
export function vectorSum(a: ForceVector, b: ForceVector) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function resultantFilmState(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const en = locale === 'en';
  const ramp = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const mode: 'two' | 'one' | 'vectors' =
    chapter === 1
      ? 'one'
      : chapter === 2
        ? 'vectors'
        : chapter === 3 && t < (en ? 5.3 : 7.3)
          ? 'one'
          : 'two';
  return {
    mode,
    leftAngle: chapter === 3 ? 35 + 20 * ramp(en ? 7.8 : 9.4, en ? 12.8 : 14.9) : 35,
    sides: ramp(en ? 3.4 : 4.9, en ? 5.9 : 9),
    parallels: ramp(en ? 6 : 9.1, en ? 8 : 11.9),
    diagonal: ramp(en ? 8.6 : 12.6, en ? 10.2 : 14.2),
  };
}
