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

/** Exact hanging mass needed for a specified tension on a compensated cart. */
export function hangerForTension(cartMass: number, tension: number) {
  if (
    !Number.isFinite(cartMass) ||
    !Number.isFinite(tension) ||
    cartMass <= 0 ||
    tension < 0 ||
    tension >= cartMass * 9.8
  )
    throw new RangeError('Require M > 0 and 0 ≤ T < Mg.');
  return tension / (9.8 - tension / cartMass);
}

export type ForceInterval = { duration: number; applied: number; resistance: number };
/** Forward-motion teaching trial. A braking interval stops at rest, never launches backwards. */
export function cartForceSequence(
  time: number,
  mass: number,
  initialVelocity: number,
  intervals: ForceInterval[],
) {
  if (
    ![time, mass, initialVelocity].every(Number.isFinite) ||
    mass <= 0 ||
    initialVelocity < 0 ||
    !intervals.length ||
    intervals.some(
      (s) =>
        ![s.duration, s.applied, s.resistance].every(Number.isFinite) ||
        s.duration <= 0 ||
        s.resistance < 0,
    )
  )
    throw new RangeError('A finite forward-motion trial is required.');
  const duration = intervals.reduce((sum, s) => sum + s.duration, 0);
  let remaining = Math.max(0, Math.min(time, duration)),
    position = 0,
    velocity = initialVelocity,
    phase = 0;
  for (let i = 0; i < intervals.length; i++) {
    const segment = intervals[i],
      dt = Math.min(remaining, segment.duration),
      a = (segment.applied - segment.resistance) / mass;
    const movingTime = a < 0 ? Math.min(dt, velocity / -a) : dt;
    position += velocity * movingTime + 0.5 * a * movingTime ** 2;
    velocity = Math.max(0, velocity + a * movingTime);
    if (velocity < 1e-12) velocity = 0;
    remaining -= dt;
    phase = i;
    if (remaining <= 1e-12) {
      // At a junction the new force applies, while x and v remain continuous.
      if (dt === segment.duration && i < intervals.length - 1) phase = i + 1;
      break;
    }
  }
  const current = intervals[phase],
    requestedNet = current.applied - current.resistance;
  const heldAtRest = velocity === 0 && requestedNet < 0;
  // A braking contact is not a backwards motor: its horizontal force becomes zero at rest.
  const applied = heldAtRest ? Math.max(0, current.applied) : current.applied;
  const resistance = heldAtRest ? applied : current.resistance;
  const netForce = applied - resistance;
  return {
    time: Math.max(0, Math.min(time, duration)),
    duration,
    position,
    velocity,
    phase,
    applied,
    resistance,
    netForce,
    acceleration: netForce / mass,
  };
}

export const releaseTrial: ForceInterval[] = [
  { duration: 0.8, applied: 0.18, resistance: 0 },
  { duration: 1, applied: 0, resistance: 0 },
  { duration: 0.8, applied: -0.18, resistance: 0 },
];
export const balancedTrial: ForceInterval[] = [{ duration: 1.5, applied: 0.18, resistance: 0.18 }];

type RigPoint = { x: number; y: number };
/** Side elevation, metres, screen y down. Cart and hanging mass share displacement s. */
export function newtonRigGeometry(position: number, incline = compensatedAngle()) {
  if (
    ![position, incline].every(Number.isFinite) ||
    position < 0 ||
    position > 0.48 ||
    Math.abs(incline) > 0.1
  )
    throw new RangeError('Rig displacement and inclination exceed the displayed rail.');
  const tangent = { x: Math.cos(incline), y: Math.sin(incline) },
    normal = { x: Math.sin(incline), y: -Math.cos(incline) };
  const onRail = (s: number, height = 0): RigPoint => ({
    x: s * tangent.x + height * normal.x,
    y: s * tangent.y + height * normal.y,
  });
  const radius = 0.035,
    hookHeight = 0.08,
    cartStation = 0.18 + position;
  const hook = onRail(cartStation + 0.11, hookHeight),
    entry = onRail(1, hookHeight);
  const pulley = { x: entry.x - radius * normal.x, y: entry.y - radius * normal.y };
  const exit = { x: pulley.x + radius, y: pulley.y },
    hanger = { x: exit.x, y: exit.y + 0.12 + position };
  const arcLength = radius * (Math.PI / 2 - incline);
  return {
    tangent,
    normal,
    onRail,
    cartStation,
    hook,
    entry,
    pulley,
    exit,
    hanger,
    radius,
    ropeLength: Math.hypot(entry.x - hook.x, entry.y - hook.y) + arcLength + hanger.y - exit.y,
  };
}
