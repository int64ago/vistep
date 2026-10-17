/** Single-phase sinusoidal, in-phase RMS currents; ideal RMS detector plus a teaching delay. */
export interface GroundFaultInput {
  loadA: number;
  earthMA: number;
  testMA: number;
  seconds: number;
  thresholdMA?: number;
  delaySeconds?: number;
  faultAt?: number;
  clearAt?: number | null;
  resetAt?: number | null;
  phase?: number;
}
export function groundFaultBreaker(input: GroundFaultInput) {
  const {
    loadA,
    earthMA,
    testMA,
    seconds,
    thresholdMA = 30,
    delaySeconds = 0.02,
    faultAt = 0.04,
    clearAt = null,
    resetAt = null,
    phase = Math.PI / 4,
  } = input;
  if (
    ![loadA, earthMA, testMA, seconds, thresholdMA, delaySeconds, faultAt, phase].every(
      Number.isFinite,
    ) ||
    loadA < 0 ||
    loadA > 100 ||
    earthMA < 0 ||
    earthMA > 1000 ||
    testMA < 0 ||
    testMA > 1000 ||
    seconds < 0 ||
    seconds > 10 ||
    thresholdMA <= 0 ||
    thresholdMA > 1000 ||
    delaySeconds <= 0 ||
    delaySeconds > 1 ||
    faultAt < 0 ||
    faultAt > 10 ||
    (clearAt !== null && (!Number.isFinite(clearAt) || clearAt < faultAt || clearAt > 10)) ||
    (resetAt !== null && (!Number.isFinite(resetAt) || resetAt < 0 || resetAt > 10))
  )
    throw new RangeError('Unsupported residual-current model input');
  const activeAt = (time: number) => time >= faultAt && (clearAt === null || time < clearAt);
  const boundaries = [
    ...new Set(
      [0, faultAt, clearAt, resetAt, seconds].filter(
        (v): v is number => v !== null && v >= 0 && v <= seconds,
      ),
    ),
  ].sort((a, b) => a - b);
  let closed = true,
    held = 0;
  const trips: number[] = [];
  for (let n = 0; n < boundaries.length; n++) {
    const start = boundaries[n],
      end = boundaries[n + 1] ?? start;
    if (resetAt !== null && start === resetAt) {
      closed = true;
      held = 0;
    }
    if (!closed) continue;
    if (activeAt(start) && Math.abs(earthMA - testMA) >= thresholdMA) {
      const trip = start + delaySeconds - held;
      if (trip <= end + 1e-12) {
        closed = false;
        held = 0;
        trips.push(trip);
      } else held += end - start;
    } else held = 0;
  }
  const active = activeAt(seconds),
    earth = closed && active ? earthMA / 1000 : 0,
    test = closed && active ? testMA / 1000 : 0;
  const lineA = closed ? loadA + earth : 0,
    neutralA = closed ? loadA + test : 0;
  const signedResidualA = earth - test,
    residualMA = Math.abs(signedResidualA) * 1000;
  const lineInstant = Math.SQRT2 * lineA * Math.sin(phase),
    neutralInstant = -Math.SQRT2 * neutralA * Math.sin(phase);
  return {
    closed,
    trips,
    heldSeconds: held,
    active,
    lineA,
    neutralA,
    earthA: earth,
    testA: test,
    signedResidualA,
    residualMA,
    lineInstant,
    neutralInstant,
    ampereTurns: lineInstant + neutralInstant,
    residualDerivative: Math.SQRT2 * signedResidualA * 2 * Math.PI * 50 * Math.cos(phase),
    thresholdMA,
    delaySeconds,
    potentialResidualMA: active ? Math.abs(earthMA - testMA) : 0,
    detectedResidualMA: trips.length ? Math.abs(earthMA - testMA) : residualMA,
  };
}
