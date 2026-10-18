export type VernierDivisions = 10 | 20 | 50;
export function vernierReading(length: number, divisions: VernierDivisions = 10, zeroError = 0) {
  if (
    ![length, zeroError].every(Number.isFinite) ||
    length < 0 ||
    ![10, 20, 50].includes(divisions)
  )
    throw new RangeError('Nonnegative length and supported vernier required.');
  const count = Math.round((length + zeroError) * divisions),
    indicated = count / divisions,
    main = Math.floor(count / divisions),
    aligned = count - main * divisions,
    fraction = aligned / divisions;
  return {
    length,
    divisions,
    resolution: 1 / divisions,
    indicated,
    main,
    aligned,
    fraction,
    zeroError,
    corrected: indicated - zeroError,
    vernierPitch: (divisions - 1) / divisions,
  };
}
export function micrometerReading(length: number, zeroError = 0) {
  if (![length, zeroError].every(Number.isFinite) || length < 0 || length > 25)
    throw new RangeError('Micrometer range is 0–25 mm.');
  const indicated = length + zeroError,
    halfSteps = Math.floor((indicated + 1e-10) / 0.5),
    sleeve = halfSteps * 0.5,
    thimble = (indicated - sleeve) / 0.01;
  return {
    length,
    indicated,
    zeroError,
    sleeve,
    thimble,
    pitch: 0.5,
    divisions: 50,
    resolution: 0.01,
    estimatedResolution: 0.001,
    turns: length / 0.5,
    angle: (length / 0.5) * Math.PI * 2,
    corrected: indicated - zeroError,
  };
}
export function micrometerContact(requestedOpening: number, objectSize: number) {
  if (
    ![requestedOpening, objectSize].every(Number.isFinite) ||
    requestedOpening < 0 ||
    objectSize < 0
  )
    throw new RangeError('Nonnegative gap and specimen size required.');
  const opening = Math.max(requestedOpening, objectSize);
  return {
    opening,
    contact: requestedOpening <= objectSize,
    slipTurns: (opening - requestedOpening) / 0.5,
  };
}
export function accumulatedWire(turns: number, diameter = 1.3, gap = 0, totalReadingError = 0.1) {
  if (
    ![turns, diameter, gap, totalReadingError].every(Number.isFinite) ||
    !Number.isInteger(turns) ||
    turns < 1 ||
    turns > 30 ||
    diameter <= 0 ||
    gap < 0 ||
    totalReadingError < 0
  )
    throw new RangeError('Physical wire and integral turn count required.');
  const span = turns * diameter + (turns - 1) * gap,
    estimate = span / turns;
  return {
    turns,
    diameter,
    gap,
    span,
    estimate,
    diameterError: totalReadingError / turns,
    bias: estimate - diameter,
    relativeError: totalReadingError / span,
  };
}
