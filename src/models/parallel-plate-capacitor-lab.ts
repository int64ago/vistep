export const EPSILON_0 = 8.8541878128e-12;
export const PLATE_SIDE = 0.14;
export const PLATE_REFERENCE_GAP = 0.01;
export const PLATE_REFERENCE_VOLTAGE = 100;
export const PLATE_REFERENCE_CHARGE =
  ((EPSILON_0 * PLATE_SIDE ** 2) / PLATE_REFERENCE_GAP) * PLATE_REFERENCE_VOLTAGE;
export function plateCapacitor(
  gap = 0.01,
  overlap = 1,
  dielectric = 1,
  insertion = 1,
  connected = false,
  isolatedCharge = PLATE_REFERENCE_CHARGE,
) {
  if (
    ![gap, overlap, dielectric, insertion, isolatedCharge].every(Number.isFinite) ||
    isolatedCharge < 0 ||
    gap <= 0 ||
    overlap <= 0 ||
    overlap > 1 ||
    dielectric < 1 ||
    insertion < 0 ||
    insertion > 1
  )
    throw new RangeError('Physical plate geometry and dielectric required.');
  const area = PLATE_SIDE ** 2 * overlap,
    shift = PLATE_SIDE * (1 - overlap),
    effectiveDielectric = 1 + (dielectric - 1) * insertion,
    capacitance = ((EPSILON_0 * area) / gap) * effectiveDielectric;
  const voltage = connected ? PLATE_REFERENCE_VOLTAGE : isolatedCharge / capacitance,
    charge = connected ? capacitance * voltage : isolatedCharge,
    energy = (charge * voltage) / 2;
  // Ideal high-impedance electrometer: electric torque ∝ U²; restoring torque ∝ angle.
  const meterAngle = 1e-5 * voltage ** 2;
  return {
    gap,
    overlap,
    area,
    shift,
    dielectric,
    insertion,
    effectiveDielectric,
    capacitance,
    voltage,
    charge,
    energy,
    meterAngle,
    connected,
    field: voltage / gap,
  };
}
export function plateProjection(x: number, y: number, z: number) {
  return { x: 145 + x * 2800 + y * 650, y: 295 - y * 340 - z * 800 };
}
