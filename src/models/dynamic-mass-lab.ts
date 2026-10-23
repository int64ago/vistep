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
    pitch <= 0 ||
    distance / pitch > 10000 ||
    !Number.isFinite(mass + tare)
  )
    throw new RangeError('Finite positive mass and nonnegative force required.');
  const acceleration = force / (mass + tare),
    endTime = acceleration > 0 ? Math.sqrt((2 * distance) / acceleration) : Infinity,
    t = Math.max(0, Math.min(time, endTime)),
    position = 0.5 * acceleration * t * t,
    velocity = acceleration * t;
  if (
    ![acceleration, t, position, velocity].every(Number.isFinite) ||
    (force > 0 && (!Number.isFinite(endTime) || acceleration === 0))
  )
    throw new RangeError('Parameters exceed the numerical range of this model.');
  const count = Math.floor((position + Math.min(1e-10, pitch * 1e-8)) / pitch) + 1;
  if (!Number.isFinite(count) || count > 10001) throw new RangeError('Too many grating records.');
  const crossings = Array.from({ length: count }, (_, i) => ({
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
/** Freeze both mass trials at one common observation time. The first 0.25 m
 * stroke endpoint limits the pair; the other trial must not continue on a later clock.
 * This is a sampled stop-frame rule, not a model of collision or braking at the endpoint. */
export function dynamicMassComparison(requestedTime: number, force = 25) {
  if (!Number.isFinite(requestedTime)) throw new RangeError('Finite comparison time required.');
  const masses = [62, 82] as const,
    limit = Math.min(...masses.map((mass) => dynamicMassState(0, mass, force).endTime)),
    requested = Math.max(0, requestedTime),
    time = Math.min(requested, limit);
  return {
    requestedTime: requested,
    time,
    limit,
    limited: time < requested,
    states: masses.map((mass) => ({ mass, ...dynamicMassState(time, mass, force) })),
  };
}

export function foldingSupport(distance: number, linkLength = 0.36) {
  if (
    ![distance, linkLength].every(Number.isFinite) ||
    linkLength <= 0 ||
    distance < 0 ||
    distance > 2 * linkLength
  )
    throw new RangeError('Endpoint separation must fit two rigid links.');
  const rise = Math.sqrt(linkLength ** 2 - (distance / 2) ** 2);
  if (!Number.isFinite(rise)) throw new RangeError('Link geometry exceeds the numerical range.');
  return { midpoint: distance / 2, rise };
}

export type DynamicMassView = 'apparatus' | 'encoder' | 'velocity' | 'mass' | 'comparison';
export function dynamicMassFilm(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  if (![chapter, chapterTime].every(Number.isFinite))
    throw new RangeError('Finite film clock required');
  const c = Math.max(0, Math.min(3, Math.floor(chapter))),
    t = Math.max(0, chapterTime);
  const progress = (start: number, end: number) =>
    Math.max(0, Math.min(1, (t - start) / (end - start)));
  const end = dynamicMassState(0).endTime;
  const cuts =
    locale === 'en'
      ? { velocity: 9.99, slope: 20.89, subtract: 5.59, compare: 10.07, reveal: 12.5 }
      : { velocity: 12.05, slope: 22.39, subtract: 6.07, compare: 11.55, reveal: 14.0 };
  let view: DynamicMassView = 'apparatus',
    time = 0,
    reveal = true;
  if (c === 1) time = progress(1, 18) * end;
  if (c === 2) {
    view = t < cuts.velocity ? 'encoder' : 'velocity';
    time = progress(0, cuts.velocity) * end;
    reveal = t >= cuts.slope;
  }
  if (c === 3) {
    view = t < cuts.compare ? 'mass' : 'comparison';
    time = view === 'mass' ? end : progress(cuts.compare, cuts.reveal + 3);
    reveal = t < cuts.compare || t >= cuts.reveal;
  }
  return {
    view,
    time,
    mass: 62,
    force: 25,
    reveal,
    subtract: c !== 3 || t >= cuts.subtract,
    locale,
  };
}
/** Actual fixed grating and a head fixed to the moving platform share this SI projection. */
export function dynamicMassGeometry(position: number) {
  if (!Number.isFinite(position) || position < 0 || position > 0.25 + 1e-12)
    throw new RangeError('Measurement stroke is 0–0.25 m');
  const separation = 0.65 - Math.min(0.25, position),
    arm = foldingSupport(separation);
  return {
    separation,
    arm,
    wall: 60,
    platformX: 60 + 300 * separation,
    jointX: 60 + 300 * arm.midpoint,
    marks: Array.from({ length: 13 }, (_, i) => ({ distance: i * 0.02, x: 255 - i * 6 })),
  };
}
