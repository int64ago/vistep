export type CartConditions = {
  cartMass: number;
  hangerMass: number;
  resistance?: number;
  incline?: number;
  initialVelocity?: number;
  distance?: number;
};
export function compensatedAngle(resistance = 0.025) {
  return Math.atan(resistance);
}
export function newtonCart(time: number, conditions: CartConditions) {
  const {
    cartMass: M,
    hangerMass: m,
    resistance = 0.025,
    incline = compensatedAngle(resistance),
    initialVelocity = 0,
    distance = 0.28,
  } = conditions;
  if (
    ![time, M, m, resistance, incline, initialVelocity, distance].every(Number.isFinite) ||
    M <= 0 ||
    m < 0 ||
    resistance < 0 ||
    initialVelocity < 0 ||
    distance <= 0 ||
    incline < 0 ||
    incline > 0.1
  )
    throw new RangeError('Finite positive cart setup required.');
  const normal = M * 9.8 * Math.cos(incline),
    gravityAlong = M * 9.8 * Math.sin(incline),
    kineticResistance = resistance * normal,
    drive = m * 9.8 + gravityAlong;
  const rawAcceleration = (drive - kineticResistance) / (M + m),
    stuck = initialVelocity === 0 && rawAcceleration <= 0,
    acceleration = stuck ? 0 : rawAcceleration;
  const stopTime = acceleration < 0 ? -initialVelocity / acceleration : Infinity;
  const discriminant = initialVelocity ** 2 + 2 * acceleration * distance;
  const endTime =
    acceleration === 0
      ? initialVelocity > 0
        ? distance / initialVelocity
        : Infinity
      : discriminant >= 0
        ? (2 * distance) / (initialVelocity + Math.sqrt(discriminant))
        : Infinity;
  const elapsed = Math.max(0, Math.min(time, stopTime, endTime)),
    position = initialVelocity * elapsed + 0.5 * acceleration * elapsed ** 2,
    velocity = Math.max(0, initialVelocity + acceleration * elapsed),
    stopped = stuck || (time >= stopTime && stopTime < endTime),
    a = stopped ? 0 : acceleration,
    tension = m * (9.8 - a),
    resistanceForce = stopped ? drive : kineticResistance;
  return {
    time: elapsed,
    position,
    velocity,
    acceleration: a,
    tension,
    hangerWeight: m * 9.8,
    normal,
    gravityAlong,
    resistanceForce,
    cartNet: tension + gravityAlong - resistanceForce,
    endTime,
    arrived: time >= endTime && endTime <= stopTime,
    stopped,
    approximationError: m > 0 ? (m * 9.8 - tension) / (m * 9.8) : 0,
  };
}
export function cartTapeAcceleration(a: number, period = 0.1) {
  if (![a, period].every(Number.isFinite) || period <= 0)
    throw new RangeError('Finite acceleration and positive period required.');
  const distances = Array.from({ length: 5 }, (_, i) => 0.5 * a * (i * period) ** 2);
  return {
    distances,
    reconstructed: (distances[3] - 2 * distances[2] + distances[1]) / period ** 2,
  };
}
