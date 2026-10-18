export const GALILEO_G = 9.8;
export const ROLLING_INERTIA = 1.4;
export function rollingIncline(time: number, degrees = 6, distance = 1.6) {
  if (
    ![time, degrees, distance].every(Number.isFinite) ||
    degrees <= 0 ||
    degrees >= 60 ||
    distance <= 0
  )
    throw new RangeError('Finite shallow incline required.');
  const acceleration = (GALILEO_G * Math.sin((degrees * Math.PI) / 180)) / ROLLING_INERTIA,
    endTime = Math.sqrt((2 * distance) / acceleration),
    t = Math.max(0, Math.min(time, endTime));
  return {
    time: t,
    position: 0.5 * acceleration * t * t,
    velocity: acceleration * t,
    acceleration,
    endTime,
    waterMass: 0.015 * t,
    arrived: time >= endTime,
  };
}
export function doubleInclineGeometry(rightDegrees = 25) {
  if (!Number.isFinite(rightDegrees) || rightDegrees < 0 || rightDegrees > 60)
    throw new RangeError('Right incline must be between zero and sixty degrees.');
  const alpha = (35 * Math.PI) / 180,
    beta = (rightDegrees * Math.PI) / 180,
    radius = 0.35,
    height = 0.7,
    leftLength = (height - radius * (1 - Math.cos(alpha))) / Math.sin(alpha),
    arcLength = radius * (alpha + beta),
    rightLength = beta > 0 ? (height - radius * (1 - Math.cos(beta))) / Math.sin(beta) : 3.5;
  const at = (s: number) => {
    if (s < leftLength) {
      const d = leftLength - s;
      return {
        x: -radius * Math.sin(alpha) - d * Math.cos(alpha),
        y: radius * (1 - Math.cos(alpha)) + d * Math.sin(alpha),
        angle: -alpha,
      };
    }
    if (s < leftLength + arcLength) {
      const phi = -alpha + (s - leftLength) / radius;
      return { x: radius * Math.sin(phi), y: radius * (1 - Math.cos(phi)), angle: phi };
    }
    const d = s - leftLength - arcLength;
    return {
      x: radius * Math.sin(beta) + d * Math.cos(beta),
      y: radius * (1 - Math.cos(beta)) + d * Math.sin(beta),
      angle: beta,
    };
  };
  return {
    at,
    height,
    leftLength,
    arcLength,
    rightLength,
    length: leftLength + arcLength + rightLength,
  };
}
/** Smooth joined track for the ball center; no dissipative bottom-corner impulse. */
export function doubleInclineState(time: number, rightDegrees = 25) {
  if (!Number.isFinite(time) || time < 0 || time > 12)
    throw new RangeError('Time must lie in 0…12 seconds.');
  const geometry = doubleInclineGeometry(rightDegrees),
    steps = Math.max(1, Math.ceil(time / 0.0005)),
    dt = time / steps;
  let position = 0,
    velocity = 0;
  const acc = (s: number) => (-GALILEO_G / ROLLING_INERTIA) * Math.sin(geometry.at(s).angle);
  for (let i = 0; i < steps; i++) {
    const a1 = acc(position),
      v2 = velocity + (a1 * dt) / 2,
      s2 = position + (velocity * dt) / 2,
      a2 = acc(s2),
      v3 = velocity + (a2 * dt) / 2,
      s3 = position + (v2 * dt) / 2,
      a3 = acc(s3),
      v4 = velocity + a3 * dt,
      s4 = position + v3 * dt,
      a4 = acc(s4);
    position += (dt * (velocity + 2 * v2 + 2 * v3 + v4)) / 6;
    velocity += (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
  }
  const point = geometry.at(position),
    potential = GALILEO_G * point.y,
    kinetic = 0.5 * ROLLING_INERTIA * velocity ** 2;
  return {
    ...point,
    position,
    velocity,
    potential,
    kinetic,
    energy: potential + kinetic,
    geometry,
  };
}
