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
  if (!(mass > 0) || !(stiffness > 0) || !Number.isFinite(acceleration))
    throw new RangeError('Finite acceleration and positive instrument parameters required.');
  const force = mass * (PHONE_G + acceleration);
  return { mass, force, extension: force / stiffness };
}
