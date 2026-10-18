export function pairedBalances(
  separation: number,
  center = 0,
  leftStiffness = 80,
  rightStiffness = 120,
) {
  if (
    ![separation, center, leftStiffness, rightStiffness].every(Number.isFinite) ||
    separation < 0.4 ||
    leftStiffness <= 0 ||
    rightStiffness <= 0
  )
    throw new RangeError('Taut instruments and positive finite stiffness required.');
  const force = (separation - 0.4) / (1 / leftStiffness + 1 / rightStiffness),
    left = center - separation / 2,
    right = center + separation / 2,
    leftExtension = force / leftStiffness,
    rightExtension = force / rightStiffness,
    joint = left + 0.2 + leftExtension;
  return {
    left,
    right,
    joint,
    force,
    leftExtension,
    rightExtension,
    onLeft: force,
    onRight: -force,
  };
}
export function pairExperiment(
  time: number,
  bothMoving = false,
  leftStiffness = 80,
  rightStiffness = 120,
) {
  if (!Number.isFinite(time)) throw new RangeError('Finite time required.');
  const timeClamped = Math.max(0, time),
    separation = 0.4 + 0.12 * (0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, timeClamped / 3)));
  const center = bothMoving ? 0.025 * Math.sin(timeClamped * 1.7) : (separation - 0.4) / 2;
  return pairedBalances(separation, center, leftStiffness, rightStiffness);
}
