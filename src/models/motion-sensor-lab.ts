export const SOUND_SPEED = 343;
export const LIGHT_SPEED = 299792458;
export type SensorMethod = 'active' | 'reflection';
export function sonicMeasurement(
  method: SensorMethod,
  emission: number,
  velocity = 0.3,
  start = 1.2,
  sound = SOUND_SPEED,
) {
  if (
    ![emission, velocity, start, sound].every(Number.isFinite) ||
    start + velocity * emission <= 0 ||
    sound <= 0 ||
    Math.abs(velocity) >= sound
  )
    throw new RangeError('Positive range and subsonic trajectory required.');
  const distance = start + velocity * emission;
  if (method === 'active') {
    const light = distance / LIGHT_SPEED,
      flight = distance / sound,
      delay = flight - light;
    return {
      method,
      emission,
      reflection: emission,
      received: emission + flight,
      flight,
      delay,
      light,
      distance,
      measured: delay / (1 / sound - 1 / LIGHT_SPEED),
      textbookApproximation: sound * delay,
      positionTime: emission,
      reflectionDistance: distance,
    };
  }
  const outbound = distance / (sound - velocity),
    flight = 2 * outbound,
    reflection = emission + outbound,
    reflectionDistance = start + velocity * reflection;
  return {
    method,
    emission,
    reflection,
    received: emission + flight,
    flight,
    delay: flight,
    light: 0,
    distance,
    measured: (sound * flight) / 2,
    textbookApproximation: (sound * flight) / 2,
    positionTime: reflection,
    reflectionDistance,
  };
}
export function sonicPulse(
  method: SensorMethod,
  emission: number,
  elapsed: number,
  velocity = 0.3,
  start = 1.2,
) {
  const s = sonicMeasurement(method, emission, velocity, start),
    time = Math.max(0, Math.min(s.flight, elapsed)),
    world = emission + time;
  return {
    ...s,
    time,
    world,
    target: start + velocity * world,
    wave:
      method === 'active'
        ? s.distance - SOUND_SPEED * time
        : time <= s.flight / 2
          ? SOUND_SPEED * time
          : s.reflectionDistance - SOUND_SPEED * (time - s.flight / 2),
    arrived: time >= s.flight - 1e-12,
  };
}
export function sensorVelocity(
  method: SensorMethod,
  emission: number,
  velocity = 0.3,
  interval = 0.02,
) {
  if (!(interval > 0) || !Number.isFinite(interval))
    throw new RangeError('Positive sampling interval required');
  const a = sonicMeasurement(method, emission, velocity),
    b = sonicMeasurement(method, emission + interval, velocity);
  return { a, b, velocity: (b.measured - a.measured) / (b.positionTime - a.positionTime) };
}
