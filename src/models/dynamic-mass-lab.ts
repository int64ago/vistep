export function dynamicMassState(
  time: number,
  mass = 62,
  force = 25,
  tare = 6,
  distance = 0.25,
  pitch = 0.02,
) {
  if (
    ![time, mass, force, tare, distance, pitch].every(Number.isFinite) ||
    mass <= 0 ||
    force < 0 ||
    tare < 0 ||
    distance <= 0 ||
    pitch <= 0
  )
    throw new RangeError('Finite positive mass and nonnegative force required.');
  const acceleration = force / (mass + tare),
    endTime = acceleration > 0 ? Math.sqrt((2 * distance) / acceleration) : Infinity,
    t = Math.max(0, Math.min(time, endTime)),
    position = 0.5 * acceleration * t * t,
    velocity = acceleration * t;
  const crossings = Array.from({ length: Math.floor((position + 1e-10) / pitch) + 1 }, (_, i) => ({
    distance: i * pitch,
    time: i === 0 ? 0 : Math.sqrt((2 * i * pitch) / acceleration),
  }));
  const intervals = crossings.slice(1).map((b, i) => {
    const a = crossings[i];
    return { time: (a.time + b.time) / 2, velocity: pitch / (b.time - a.time) };
  });
  const first = intervals[0],
    last = intervals.at(-1),
    measuredAcceleration =
      intervals.length >= 2 ? (last!.velocity - first.velocity) / (last!.time - first.time) : null,
    measuredMass =
      measuredAcceleration !== null && measuredAcceleration > 0
        ? force / measuredAcceleration - tare
        : null;
  return {
    time: t,
    position,
    velocity,
    acceleration,
    endTime,
    crossings,
    intervals,
    measuredAcceleration,
    measuredMass,
    totalMass: mass + tare,
    signal: Math.floor(position / (pitch / 2)) % 2 === 0,
  };
}
export function foldingSupport(distance: number, linkLength = 0.36) {
  if (!Number.isFinite(distance) || distance < 0 || distance > 2 * linkLength)
    throw new RangeError('Endpoint separation must fit two rigid links.');
  return { midpoint: distance / 2, rise: Math.sqrt(linkLength ** 2 - (distance / 2) ** 2) };
}
