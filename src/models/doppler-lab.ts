/** Classical sound in still air. Circular motion is evaluated at emission time,
 * not at the source's displayed/current position. SI units throughout. */
export interface BuzzerInput {
  radius: number;
  turnsPerSecond: number;
  sourceFrequency: number;
  soundSpeed: number;
  observerDistance: number;
}
export const BUZZER_DEFAULT: BuzzerInput = {
  radius: 1.2,
  turnsPerSecond: 2,
  sourceFrequency: 600,
  soundSpeed: 340,
  observerDistance: 5,
};
function assertBuzzer(a: BuzzerInput) {
  if (
    !Object.values(a).every(Number.isFinite) ||
    a.radius < 0 ||
    a.turnsPerSecond < 0 ||
    a.sourceFrequency <= 0 ||
    a.soundSpeed <= 0 ||
    a.observerDistance <= a.radius ||
    2 * Math.PI * a.radius * a.turnsPerSecond >= a.soundSpeed
  ) {
    throw new RangeError(
      'A finite subsonic source and an observer outside the circle are required.',
    );
  }
}
export function buzzerSource(time: number, a: BuzzerInput = BUZZER_DEFAULT) {
  const omega = 2 * Math.PI * a.turnsPerSecond,
    angle = -Math.PI / 2 + omega * time;
  return {
    x: a.radius * Math.cos(angle),
    y: a.radius * Math.sin(angle),
    vx: -a.radius * omega * Math.sin(angle),
    vy: a.radius * omega * Math.cos(angle),
    angle,
  };
}
export function buzzerArrival(emissionTime: number, a: BuzzerInput = BUZZER_DEFAULT) {
  const source = buzzerSource(emissionTime, a);
  return emissionTime + Math.hypot(a.observerDistance - source.x, source.y) / a.soundSpeed;
}
export function buzzerObservation(time: number, a: BuzzerInput = BUZZER_DEFAULT) {
  assertBuzzer(a);
  if (!Number.isFinite(time)) throw new RangeError('Finite observation time required.');
  let low = time - (a.observerDistance + a.radius) / a.soundSpeed,
    high = time - (a.observerDistance - a.radius) / a.soundSpeed;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (buzzerArrival(mid, a) < time) low = mid;
    else high = mid;
  }
  const emittedAt = (low + high) / 2,
    source = buzzerSource(emittedAt, a),
    distance = Math.hypot(a.observerDistance - source.x, source.y),
    radialSpeed = (source.vx * (a.observerDistance - source.x) - source.vy * source.y) / distance,
    frequency = a.sourceFrequency / (1 - radialSpeed / a.soundSpeed),
    crestId = Math.floor(emittedAt * a.sourceFrequency + 1e-10),
    arrivedAt = buzzerArrival(crestId / a.sourceFrequency, a),
    nextArrival = buzzerArrival((crestId + 1) / a.sourceFrequency, a);
  return {
    emittedAt,
    source,
    distance,
    radialSpeed,
    frequency,
    crestId,
    arrivedAt,
    nextArrival,
    interval: nextArrival - arrivedAt,
    current: buzzerSource(time, a),
  };
}
/** Historical centres stay at their own emission position as the wave expands. */
export function buzzerFronts(time: number, a: BuzzerInput = BUZZER_DEFAULT) {
  assertBuzzer(a);
  const newest = Math.floor(time * a.sourceFrequency),
    oldest = Math.ceil(
      (time - (a.observerDistance + 2 * a.radius) / a.soundSpeed) * a.sourceFrequency,
    );
  return Array.from({ length: Math.max(0, newest - oldest + 1) }, (_, i) => {
    const id = oldest + i,
      emittedAt = id / a.sourceFrequency,
      source = buzzerSource(emittedAt, a);
    return {
      id,
      emittedAt,
      x: source.x,
      y: source.y,
      radius: a.soundSpeed * Math.max(0, time - emittedAt),
    };
  });
}
/** People stand for travelling crests, not oscillating material particles.
 * Equal spacing 2 m and speed 1 m/s give the textbook's 30 people/minute. */
export function queueDoppler(time: number, observerSpeed = 0) {
  if (!Number.isFinite(time) || time < 0 || !Number.isFinite(observerSpeed) || observerSpeed >= 1)
    throw new RangeError('Use nonnegative time and observer speed below the queue speed.');
  const queueSpeed = 1,
    spacing = 2,
    relativeSpeed = queueSpeed - observerSpeed,
    observerX = observerSpeed * time,
    period = spacing / relativeSpeed;
  return {
    observerX,
    observerSpeed,
    queueSpeed,
    spacing,
    relativeSpeed,
    period,
    perMinute: 60 / period,
    // A person aligned at t=0 establishes the start; count subsequent crossings.
    encounters: Math.floor(time / period + 1e-10),
    people: Array.from({ length: 31 }, (_, j) => {
      const id = j - 15;
      return { id, x: id * spacing + queueSpeed * time };
    }),
    sinceLastEncounter: time % period,
  };
}
