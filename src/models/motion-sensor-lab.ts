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
  if (!Number.isFinite(elapsed)) throw new RangeError('Finite pulse time required');
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
  const dt = b.positionTime - a.positionTime;
  if (!(dt > 0)) throw new RangeError('Sampling interval is below time resolution');
  return { a, b, velocity: (b.measured - a.measured) / dt };
}

/** Language-specific presentation seconds calibrated to the unchanged narration.
 * Physical propagation is still solved by sonicMeasurement/sonicPulse. */
export function motionSensorShot(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const phase = (start: number, end: number) =>
    Math.max(0, Math.min(1, (t - start) / (end - start)));
  const en = locale === 'en';
  let fraction = 0;
  if (chapter === 0) fraction = phase(en ? 7.7 : 10.2, en ? 12.7 : 16.8);
  else if (chapter === 1) fraction = phase(0.5, en ? 11.4 : 12.8);
  else if (chapter === 3) {
    // Reach the reflector, then return. Hold the physical endpoint for the formula.
    fraction = phase(2.7, 7.3);
  }
  return {
    method: (chapter === 3 ? 'reflection' : 'active') as SensorMethod,
    fraction,
    recordTime: phase(0.5, en ? 6.4 : 6.0) * 1.5,
  };
}
