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
  const contact = requestedOpening <= objectSize + 1e-10,
    opening = contact ? objectSize : requestedOpening;
  return {
    opening,
    contact,
    slipTurns: Math.max(0, (opening - requestedOpening) / 0.5),
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

/** Directed motion is timed to the retained recordings, including the packing-gap counterexample. */
export function lengthFilmState(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  if (!Number.isInteger(chapter) || chapter < 0 || chapter > 6 || !Number.isFinite(time))
    throw new RangeError('A known chapter and finite film time are required.');
  const ease = (v: number) => {
    const p = Math.max(0, Math.min(1, v));
    return p * p * (3 - 2 * p);
  };
  const t = Math.max(0, time),
    english = locale === 'en';
  const insertAt = english ? 7.99 : 7.15,
    contactAt = english ? 13.03 : 11.89;
  const object = chapter === 3 ? 0 : chapter === 4 ? 6.725 : t < insertAt ? 0 : 0.105;
  return {
    inside: chapter === 2,
    sample: chapter === 2 ? 18.6 : 23.7,
    jawGap:
      chapter === 0
        ? 30 - 6.3 * ease((t - 0.45) / (english ? 6.64 : 8.88))
        : chapter === 2
          ? 14 + 4.6 * ease((t - 1) / 8)
          : 23.7,
    caliperFocus:
      chapter === 1 || (chapter === 0 && t >= (english ? 13.01 : 15.43))
        ? ('scale' as const)
        : ('instrument' as const),
    kind: chapter === 5 ? 'paper' : 'block',
    object,
    opening:
      chapter === 3
        ? 2 - 0.5 * ease((t - 1) / 9.2)
        : chapter === 4
          ? 8 - 1.275 * ease(t / 2.1)
          : t < insertAt
            ? 0
            : 0.4 - 0.295 * ease((t - insertAt) / (contactAt - insertAt)),
    zeroError: chapter === 5 ? 0.03 : 0,
    turns: Math.max(1, Math.round(1 + 9 * ease((t - 4.75) / 3.1))),
    gap: 0.1 * ease((t - (english ? 21.05 : 19.11)) / 1.5),
  };
}
