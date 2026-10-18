export const COULOMB_K = 8.9875517923e9;
export const TORSION_ARM = 0.08;
export const TORSION_STIFFNESS = 5e-6;
export const clampCoulomb = (p: number, a = 0, b = 1) => Math.max(a, Math.min(b, p));
export function coulombForce(q1: number, q2: number, distance: number) {
  if (![q1, q2, distance].every(Number.isFinite) || distance <= 0)
    throw new RangeError('Finite charge and positive separation required.');
  return (COULOMB_K * q1 * q2) / distance ** 2;
}
export function torsionState(distance = 0.08, chargeFraction = 1, nullFraction = 1, charge = 3e-9) {
  if (
    ![distance, chargeFraction, nullFraction, charge].every(Number.isFinite) ||
    distance < 0.03 ||
    distance > 0.3 ||
    chargeFraction < 0 ||
    chargeFraction > 1 ||
    charge < 0 ||
    charge > 1e-8
  )
    throw new RangeError('Outside the point-charge apparatus range.');
  const qa = charge * chargeFraction,
    qc = charge;
  const targetForce = coulombForce(qa, qc, distance),
    targetTwist = (TORSION_ARM * targetForce) / TORSION_STIFFNESS;
  const topAngle = targetTwist * clampCoulomb(nullFraction);
  const forceAt = (angle: number) => {
    const x = TORSION_ARM * Math.cos(angle),
      y = TORSION_ARM * Math.sin(angle),
      dx = x - TORSION_ARM,
      dy = y - distance,
      r = Math.hypot(dx, dy);
    const scale = (COULOMB_K * qa * qc) / r ** 3,
      fx = scale * dx,
      fy = scale * dy;
    return { x, y, fx, fy, r, torque: x * fy - y * fx };
  };
  let lo = -1.5,
    hi = 0;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2,
      s = forceAt(mid),
      residual = TORSION_STIFFNESS * (topAngle - mid) + s.torque;
    if (residual > 0) lo = mid;
    else hi = mid;
  }
  const angle = nullFraction >= 1 || qa === 0 ? 0 : (lo + hi) / 2,
    s = forceAt(angle);
  return {
    ...s,
    angle,
    topAngle,
    targetTwist,
    distance,
    qa,
    qc,
    targetForce,
    restoringTorque: TORSION_STIFFNESS * (topAngle - angle),
    pointApproximation: distance / 0.003 >= 10,
  };
}
export function suspendedCharge(baseSeparation = 0.1, chargeFraction = 1) {
  if (
    ![baseSeparation, chargeFraction].every(Number.isFinite) ||
    baseSeparation < 0.03 ||
    baseSeparation > 0.3 ||
    chargeFraction < 0 ||
    chargeFraction > 1
  )
    throw new RangeError('Outside the suspended-charge range.');
  const length = 0.12,
    mass = 1e-5,
    q = 4e-9;
  const forceAt = (theta: number) => {
    const dx = baseSeparation + length * Math.sin(theta),
      dy = length * (Math.cos(theta) - 1),
      r = Math.hypot(dx, dy),
      scale = (COULOMB_K * q * q * chargeFraction) / r ** 3;
    const fx = scale * dx,
      fy = scale * dy;
    return {
      x: dx,
      y: dy,
      fx,
      fy,
      r,
      torque: length * (Math.cos(theta) * fx - Math.sin(theta) * fy),
    };
  };
  let lo = 0,
    hi = 1.3;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2,
      s = forceAt(mid);
    if (s.torque > mass * 9.8 * length * Math.sin(mid)) lo = mid;
    else hi = mid;
  }
  const angle = chargeFraction === 0 ? 0 : (lo + hi) / 2;
  return { ...forceAt(angle), angle, length, mass, charge: q * chargeFraction, baseSeparation };
}
export function chargeSharing(progress: number, initial = 3e-9) {
  if (![progress, initial].every(Number.isFinite) || initial < 0)
    throw new RangeError('Finite nonnegative charge required.');
  const p = clampCoulomb(progress),
    u = clampCoulomb((p - 0.4) / 0.2),
    smooth = u * u * (3 - 2 * u);
  return {
    a: initial * (1 - 0.5 * smooth),
    probe: initial * 0.5 * smooth,
    contact: p >= 0.4 && p <= 0.6,
    approach: p < 0.4 ? p / 0.4 : p <= 0.6 ? 1 : 1 - (p - 0.6) / 0.4,
  };
}
