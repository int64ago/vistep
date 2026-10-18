/** Upward world axis. Ideal calibrated raw accelerometer = coordinate acceleration - gravity. */
export const PHONE_G = 9.8;
export type PhoneTrial = 'drop' | 'lift';
export function phoneMotion(trial: PhoneTrial, time: number) {
  const duration = trial === 'drop' ? 1.2 : 8,
    t = Math.max(0, Math.min(duration, Number.isFinite(time) ? time : 0));
  let z = 1.4,
    v = 0,
    a = 0,
    phase: 'held' | 'falling' | 'catching' | 'rest' | 'speeding' | 'cruising' | 'braking' = 'held';
  if (trial === 'drop') {
    if (t < 0.4) phase = 'held';
    else if (t < 0.7) {
      const u = t - 0.4;
      z = 1.4 - (PHONE_G * u * u) / 2;
      v = -PHONE_G * u;
      a = -PHONE_G;
      phase = 'falling';
    } else if (t < 0.86) {
      const u = t - 0.7,
        A = (PHONE_G * 0.3) / 0.16;
      z = 1.4 - (PHONE_G * 0.3 ** 2) / 2 - PHONE_G * 0.3 * u + (A * u * u) / 2;
      v = -PHONE_G * 0.3 + A * u;
      a = A;
      phase = 'catching';
    } else {
      z = 1.4 - (PHONE_G * 0.3 ** 2) / 2 - (PHONE_G * 0.3 * 0.16) / 2;
      phase = 'rest';
    }
  } else {
    z = 0;
    if (t < 1) phase = 'rest';
    else if (t < 3) {
      const u = t - 1;
      a = 1;
      v = u;
      z = (u * u) / 2;
      phase = 'speeding';
    } else if (t < 5) {
      v = 2;
      z = 2 + 2 * (t - 3);
      phase = 'cruising';
    } else if (t < 7) {
      const u = t - 5;
      a = -1;
      v = 2 - u;
      z = 6 + 2 * u - (u * u) / 2;
      phase = 'braking';
    } else {
      z = 8;
      phase = 'rest';
    }
  }
  return { t, z, v, a, raw: a + PHONE_G, corrected: a, phase, duration };
}
export function phoneSamples(trial: PhoneTrial, hz = 100) {
  if (!Number.isFinite(hz) || hz <= 0 || hz > 1000)
    throw new RangeError('Bounded positive sample frequency required.');
  const duration = trial === 'drop' ? 1.2 : 8;
  return Array.from({ length: Math.round(duration * hz) + 1 }, (_, i) =>
    phoneMotion(trial, i / hz),
  );
}
export function phoneShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    trial: (chapter >= 3 ? 'lift' : 'drop') as PhoneTrial,
    time:
      chapter === 0
        ? 0.2
        : chapter === 1
          ? 0.4 + 0.299 * Math.min(1, p / 0.72)
          : chapter === 2
            ? 0.7 + 0.5 * Math.min(1, p / 0.72)
            : 8 * Math.min(1, p / 0.82),
    corrected: chapter === 2 || chapter === 4,
  };
}
/** Quasistatic spring-meter reading; its internal vibration is omitted. */
export function phoneForceMeter(acceleration: number, mass = 0.2, stiffness = 20) {
  if (
    ![mass, stiffness, acceleration].every(Number.isFinite) ||
    !(mass > 0) ||
    !(stiffness > 0) ||
    acceleration < -PHONE_G
  )
    throw new RangeError('Finite acceleration and positive instrument parameters required.');
  const force = mass * (PHONE_G + acceleration);
  return { mass, force, extension: force / stiffness };
}

/** Illustrative equivalent sensor, not specifications of any particular handset. */
export const PHONE_SENSOR_OMEGA = 2 * Math.PI * 500;
export const PHONE_SENSOR_GAP = 4e-6;
export const PHONE_SENSOR_THICKNESS = 1.6e-6;

/** Exact critically damped response to piecewise-constant casing acceleration.
 * q is upward proof-mass displacement relative to the case, in metres.
 * The prescribed case trajectory neglects the microscopic mass's back-reaction.
 */
export function phoneSensor(trial: PhoneTrial, time: number, omega = PHONE_SENSOR_OMEGA) {
  if (!Number.isFinite(omega) || omega < 3000 || omega > 10000)
    throw new RangeError('Illustrative angular frequency must be 3000–10000 s⁻¹.');
  const motion = phoneMotion(trial, time);
  const events =
    trial === 'drop'
      ? [
          [0, 0],
          [0.4, -PHONE_G],
          [0.7, (PHONE_G * 0.3) / 0.16],
          [0.86, 0],
        ]
      : [
          [0, 0],
          [1, 1],
          [3, 0],
          [5, -1],
          [7, 0],
        ];
  let q = -PHONE_G / omega ** 2,
    qVelocity = 0,
    previous = 0,
    input = 0;
  const evolve = (dt: number) => {
    const equilibrium = -(input + PHONE_G) / omega ** 2;
    const A = q - equilibrium,
      B = qVelocity + omega * A,
      decay = Math.exp(-omega * dt);
    q = equilibrium + (A + B * dt) * decay;
    qVelocity = (B - omega * (A + B * dt)) * decay;
  };
  for (const [start, acceleration] of events) {
    if (start > motion.t) break;
    evolve(start - previous);
    previous = start;
    input = acceleration;
  }
  evolve(motion.t - previous);
  const raw = -(omega ** 2) * q;
  const dampingPerMass = -2 * omega * qVelocity;
  const suspensionPerMass = raw + dampingPerMass;
  return {
    ...motion,
    idealRaw: motion.raw,
    raw,
    corrected: raw - PHONE_G,
    q,
    qVelocity,
    elasticPerMass: raw,
    dampingPerMass,
    suspensionPerMass,
    massAcceleration: suspensionPerMass - PHONE_G,
    relativeAcceleration: suspensionPerMass - PHONE_G - motion.a,
    settled: Math.abs(raw - motion.raw) < 0.01,
  };
}

/** Clear surface gaps include the finite moving plate thickness. C values are C/C₀. */
export function phoneElectrodes(q: number, gap = PHONE_SENSOR_GAP) {
  if (!Number.isFinite(q) || !Number.isFinite(gap) || gap <= 0 || Math.abs(q) >= gap)
    throw new RangeError('The moving mass must not contact either fixed electrode.');
  const topGap = gap - q,
    bottomGap = gap + q;
  const topCapacitance = gap / topGap,
    bottomCapacitance = gap / bottomGap;
  return {
    q,
    topGap,
    bottomGap,
    topCapacitance,
    bottomCapacitance,
    imbalance: (topCapacitance - bottomCapacitance) / (topCapacitance + bottomCapacitance),
    massTop: q + PHONE_SENSOR_THICKNESS / 2,
    massBottom: q - PHONE_SENSOR_THICKNESS / 2,
    topElectrode: gap + PHONE_SENSOR_THICKNESS / 2,
    bottomElectrode: -gap - PHONE_SENSOR_THICKNESS / 2,
  };
}

/** Same-time samples; extra millisecond points preserve the release/catch response. */
export function phoneSensorSamples(trial: PhoneTrial) {
  const boundaries = trial === 'drop' ? [0.4, 0.7, 0.86] : [1, 3, 5, 7];
  const times = phoneSamples(trial, trial === 'drop' ? 100 : 25).map((s) => s.t);
  for (const boundary of boundaries)
    for (let i = 0; i <= 50; i++) times.push(boundary + i * 0.0001);
  return [...new Set(times)].sort((a, b) => a - b).map((time) => phoneSensor(trial, time));
}

export function phoneMeterInference(startForce: number, brakeForce: number) {
  if (![startForce, brakeForce].every(Number.isFinite) || startForce <= 0 || brakeForce <= 0)
    throw new RangeError('Positive finite settled force readings required.');
  return {
    acceleration: (PHONE_G * (startForce - brakeForce)) / (startForce + brakeForce),
    mass: (startForce + brakeForce) / (2 * PHONE_G),
  };
}

export type PhoneView = 'handset' | 'sensor' | 'catch' | 'trace' | 'lift' | 'conversion' | 'meter';
const bounded = (p: number) => (Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0);
const between = (p: number, a: number, b: number) => bounded((p - a) / (b - a));
export type PhoneMeterStage =
  'apparatus' | 'readings' | 'known' | 'unknown' | 'sum' | 'difference' | 'ratio' | 'answer';
/** Chapter-relative seconds, including the 0.45 s pre-roll. The two voices share
 * chapter boundaries, while their internal visual events follow measured speech.
 * ASR evidence: artifacts/teaching-principles/batch-3-timed-speech/. */
export const PHONE_SPEECH_EVENTS = {
  zh: {
    sensor: 6.05,
    release: [2.71, 4.9, 9.67, 16.57, 28.71],
    catch: [3.59, 10.79, 17.79, 22.01, 23.41, 25.39, 29.21, 33.57],
    lift: [7.81, 11.03, 15.43, 17.89, 20.35, 24.55, 26.61],
    conversion: [8.07, 13.39, 19.45],
    meter: [12.35, 20.81, 28.93, 33.95, 36.75, 39.83, 41.75],
  },
  en: {
    sensor: 5.85,
    release: [2.47, 5.01, 10.55, 18.05, 29.69],
    catch: [3.43, 10.05, 16.99, 20.99, 22.49, 25.59, 29.57, 33.83],
    lift: [6.63, 10.71, 15.97, 18.6, 21.43, 24.99, 27.27],
    conversion: [8.47, 14.55, 21.01],
    meter: [12.87, 22.13, 30.73, 36.81, 38.85, 42.31, 45.29],
  },
} as const;
export function phoneCausalShot(
  chapter: number,
  progress: number,
  locale: 'zh' | 'en' = 'zh',
  chapterTime?: number,
) {
  const p = bounded(progress);
  const durations = [30.5, 33.5, 39.5, 35.5, 36.5, 51];
  const t = chapterTime === undefined ? p * (durations[chapter] ?? 51) : Math.max(0, chapterTime);
  const e = PHONE_SPEECH_EVENTS[locale];
  let view: PhoneView = 'sensor',
    time = 0.2,
    slowed = false,
    prediction = false,
    liftDetail = false,
    traceDetail = false,
    meterStage: PhoneMeterStage = 'apparatus';
  const trial: PhoneTrial = chapter >= 3 ? 'lift' : 'drop';
  if (chapter === 0) view = t < e.sensor ? 'handset' : 'sensor';
  else if (chapter === 1) {
    const [internal, release, relax, world, predict] = e.release;
    time =
      t < internal
        ? 0.34 + 0.06 * between(t, 0.45, internal)
        : t < release
          ? 0.4
          : t < relax
            ? 0.4 + 0.00004 * between(t, release, relax)
            : t < world
              ? 0.40004 + 0.00346 * between(t, relax, world)
              : 0.4035 + 0.2465 * between(t, world, predict);
    slowed = t >= internal && t < world;
    view = slowed ? 'sensor' : 'handset';
    prediction = t >= predict;
  } else if (chapter === 2) {
    const [internal, arrows, trace, rest, fall, peak, lag, finish] = e.catch;
    if (t < internal) time = 0.69 + 0.01 * between(t, 0.45, internal);
    else if (t < arrows) time = 0.7 + 0.0035 * between(t, internal, arrows);
    else if (t < rest) time = 0.78;
    else if (t < fall) time = 0.2;
    else if (t < peak) time = 0.55;
    else if (t < lag) time = 0.78;
    else if (t < finish) time = 0.7 + 0.0035 * between(t, lag, finish);
    else time = 0.78;
    traceDetail = t >= lag && t < finish;
    slowed = (t >= internal && t < arrows) || traceDetail;
    view = t < internal || (t >= arrows && t < trace) ? 'catch' : t < arrows ? 'sensor' : 'trace';
  } else if (chapter === 3) {
    const [start, startDetail, cruise, cruiseDetail, brake, brakeDetail, recap] = e.lift;
    time =
      t < start
        ? 0.5
        : t < cruise
          ? 1.02 + 1.7 * between(t, start, cruise)
          : t < brake
            ? 3.02 + 1.7 * between(t, cruise, brake)
            : 5.02 + 1.7 * between(t, brake, recap + 2);
    view = t < start ? 'sensor' : 'lift';
    liftDetail =
      (t >= startDetail && t < cruise) ||
      (t >= cruiseDetail && t < brake) ||
      (t >= brakeDetail && t < recap);
  } else if (chapter === 4) {
    const [cruise, brake, reveal] = e.conversion;
    time = t < cruise ? 2 : t < brake ? 4 : 6;
    view = 'conversion';
    prediction = t >= brake && t < reveal;
  } else {
    const [readings, known, unknown, sum, difference, ratio, answer] = e.meter;
    time = 2;
    view = 'meter';
    meterStage =
      t < readings
        ? 'apparatus'
        : t < known
          ? 'readings'
          : t < unknown
            ? 'known'
            : t < sum
              ? 'unknown'
              : t < difference
                ? 'sum'
                : t < ratio
                  ? 'difference'
                  : t < answer
                    ? 'ratio'
                    : 'answer';
    prediction = meterStage === 'ratio';
  }
  return {
    trial,
    time,
    view,
    slowed,
    prediction,
    progress: p,
    liftDetail,
    traceDetail,
    meterStage,
  };
}

/** World drawing geometry in CSS-pixel units; all contacts share the same trajectory. */
export function phoneWorldGeometry(trial: PhoneTrial, time: number, compact: boolean) {
  const state = phoneMotion(trial, time),
    base = compact ? 40 : 55,
    scale = compact ? 105 : 145;
  const phoneY = base + (1.4 - state.z) * scale;
  const contactY = base + (1.4 - phoneMotion('drop', 0.7).z) * scale;
  const smooth = (v: number) => {
    const p = bounded(v);
    return p * p * (3 - 2 * p);
  };
  return {
    phoneY,
    contactY,
    phoneBottom: phoneY + 12,
    catchHandY: state.t < 0.7 ? contactY : phoneY,
    catchHandTop: (state.t < 0.7 ? contactY : phoneY) + 12,
    catchHandX: 180 * (1 - smooth((state.t - 0.4) / 0.25)),
    supportHandX: -114 * smooth((state.t - 0.34) / 0.06) - Math.max(0, state.t - 0.4) * 1200,
    supportHandY: base + Math.max(0, state.t - 0.4) * 100,
    cabinY: compact ? 62 - state.z * 6.5 : 102 - state.z * 9,
  };
}
