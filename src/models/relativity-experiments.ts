import { finiteClamp } from './modern-labs';
export const LIGHT_SPEED = 299792458;
export const MUON_MEAN_LIFE = 2.1969811e-6;
const bound = (v: number, lo: number, hi: number, fallback: number) =>
  Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
const ramp = (p: number, start: number, end: number) => bound((p - start) / (end - start), 0, 1, 0);

/** Classical stationary ether, no Lorentz contraction. L is one effective arm. */
export function etherFringes(angle: number, velocity = 30000, length = 11, wavelength = 500e-9) {
  const a = bound(angle, -1e5, 1e5, 0),
    b = bound(velocity, 0, 100000, 30000) / LIGHT_SPEED,
    L = bound(length, 0, 1000, 11),
    lambda = bound(wavelength, 1e-9, 1, 500e-9);
  // Rationalizing the square-root difference avoids cancellation at small speeds.
  const x = 1 - b * b * Math.sin(a) ** 2,
    y = 1 - b * b * Math.cos(a) ** 2;
  return (2 * L * b * b * Math.cos(2 * a)) / ((1 - b * b) * lambda * (Math.sqrt(x) + Math.sqrt(y)));
}
/** Legacy distinct experiment, kept for consumers. New textbook view uses centralFlashEvents. */
export function simultaneity(beta = 0.6) {
  const b = finiteClamp(beta, 0, 0.8),
    gamma = 1 / Math.sqrt(1 - b * b);
  return {
    beta: b,
    gamma,
    arrivalRight: 0.5 / (1 + b),
    arrivalLeft: 0.5 / (1 - b),
    emissionLeftPrime: (gamma * b) / 2,
    emissionRightPrime: (-gamma * b) / 2,
  };
}
export type TrainFrame = 'ground' | 'train';
/** c=1; lengths in L0 and times in L0/c. Both emitted photons originate at (0,0). */
export function centralFlashEvents(beta = 0.6, restLength = 1) {
  const b = bound(beta, -0.8, 0.8, 0.6),
    L0 = bound(restLength, 0.1, 10, 1),
    gamma = 1 / Math.sqrt(1 - b * b),
    length = L0 / gamma;
  const events = ([-1, 1] as const).map((side) => {
    const t = length / (2 * (1 - side * b)),
      x = side * t;
    return {
      id: side === -1 ? 'left-arrival' : 'right-arrival',
      side,
      t,
      x,
      tPrime: gamma * (t - b * x),
      xPrime: gamma * (x - b * t),
    };
  });
  return {
    beta: b,
    gamma,
    restLength: L0,
    length,
    events,
    endGround: Math.max(...events.map((e) => e.t)),
    endTrain: L0 / 2,
  };
}
export function trainFlashState(beta: number, frame: TrainFrame, progress: number) {
  const model = centralFlashEvents(beta),
    p = bound(progress, 0, 1, 0),
    time = p * (frame === 'train' ? model.endTrain : model.endGround),
    center = frame === 'train' ? 0 : model.beta * time,
    length = frame === 'train' ? model.restLength : model.length;
  const pulses = model.events.map((e) => {
    const arrival = frame === 'train' ? e.tPrime : e.t,
      received = time + 1e-12 >= arrival;
    // Stop at the actual encounter; after arrival the wall carries the event marker.
    return {
      id: e.id,
      side: e.side,
      received,
      arrival,
      wallX: center + (e.side * length) / 2,
      lightX: e.side * Math.min(time, arrival),
      eventX: frame === 'train' ? e.xPrime : e.x,
    };
  });
  return { ...model, frame, progress: p, time, center, length, pulses };
}
export function muonCohort(properAge: number, population = 100) {
  const age = bound(properAge, 0, 1, 0),
    n = Math.round(bound(population, 1, 500, 100));
  return Array.from({ length: n }, (_, id) => {
    const quantile = (id + 0.5) / n,
      lifetime = -MUON_MEAN_LIFE * Math.log(quantile);
    return { id, quantile, lifetime, alive: age < lifetime };
  });
}
/** Uniform straight flight in vacuum. Zero speed with nonzero distance has no arrival. */
export function muonFlight(beta = 0.995, height = 10000, progress = 1) {
  const b = bound(Math.abs(beta), 0, 0.999, 0.995),
    h = bound(height, 0, 20000, 10000),
    p = bound(progress, 0, 1, 0),
    gamma = 1 / Math.sqrt(1 - b * b),
    arrives = h === 0 || b > 0;
  // Zero placeholders are not physical transit durations when arrives=false.
  const duration = arrives && b > 0 ? h / (b * LIGHT_SPEED) : 0,
    labTime = duration * p,
    properTime = labTime / gamma;
  const classicalCohort = muonCohort(labTime),
    relativeCohort = muonCohort(properTime);
  return {
    beta: b,
    distance: h,
    progress: p,
    arrives,
    gamma,
    duration,
    labTime,
    properTime,
    survival: Math.exp(-properTime / MUON_MEAN_LIFE),
    classical: Math.exp(-labTime / MUON_MEAN_LIFE),
    height: h * (1 - (arrives ? p : 0)),
    contractedHeight: h / gamma,
    meanLabLife: gamma * MUON_MEAN_LIFE,
    classicalCohort,
    relativeCohort,
    classicalCount: classicalCohort.filter((x) => x.alive).length,
    relativeCount: relativeCohort.filter((x) => x.alive).length,
  };
}
/** A transverse light-clock analogy; not microscopic muon anatomy. Mirror separation d=1,c=1. */
export function lightClock(beta = 0.6, progress = 1) {
  const b = bound(beta, -0.8, 0.8, 0.6),
    p = bound(progress, 0, 1, 0),
    gamma = 1 / Math.sqrt(1 - b * b),
    properTime = 2 * p,
    groundTime = gamma * properTime,
    y = properTime <= 1 ? properTime : 2 - properTime;
  return {
    beta: b,
    gamma,
    properTime,
    groundTime,
    x: b * groundTime,
    y,
    bounceX: b * gamma,
    endX: 2 * b * gamma,
    pathLength: groundTime,
  };
}
/** Slow-speed weak-field equatorial interval, not the historical flight paths or duration. */
export function flightClock(direction = 1, height = 10000, hours = 40, speed = 250) {
  const t = bound(hours, 0, 48, 40) * 3600,
    h = bound(height, 0, 15000, 10000),
    u = bound(speed, 0, 350, 250),
    sign = direction < 0 ? -1 : 1,
    ground = 465.1,
    air = ground + sign * u;
  const gravity = ((9.80665 * h * t) / LIGHT_SPEED ** 2) * 1e9,
    kinetic = ((-(air ** 2 - ground ** 2) * t) / (2 * LIGHT_SPEED ** 2)) * 1e9;
  return {
    gravity,
    kinetic,
    total: gravity + kinetic,
    groundSpeed: ground,
    airSpeed: air,
    height: h,
    speed: u,
    hours: t / 3600,
    direction: sign,
  };
}
export type RelativityShot =
  | 'ether'
  | 'train'
  | 'events'
  | 'muon-records'
  | 'muon-cohort'
  | 'light-clock'
  | 'muon-frame'
  | 'clock-vectors'
  | 'clock-height'
  | 'clock-records'
  | 'clock-model';
export type RelativityDirection = {
  shot: RelativityShot;
  progress: number;
  beta: number;
  frame: TrainFrame;
  reveal: boolean;
  prediction: boolean;
  direction: number;
  height: number;
};
/** Chapter-relative seconds, including the 0.45 s audio lead-in. Derived from the
 * final independent ASR word times, not a fraction of the bilingual chapter length.
 * Both photons and all walls share one simulation clock even when its playback rate
 * slows around an encounter. Fixed observations are never recomputed by this clock.
 */
export const RELATIVITY_SPEECH_CUTS = {
  zh: {
    rotation: [12.57, 16.15],
    train: [3.13, 8.29, 9.25, 10.77, 18.47, 19.77],
    events: [16.23, 20.93, 23.3, 23.75, 24.2, 26.7],
    muons: [8.81, 12.89, 19.03, 26.6],
    frames: [2.77, 12.1, 16.39, 18.67, 22.8, 25.07, 33.17, 37.89],
    east: [19.21, 22.27, 26.73],
    west: [10.79, 12.51, 14.91, 18.59, 21.91, 24.65, 27.39],
  },
  en: {
    rotation: [12.31, 15.23],
    train: [3.29, 8.4, 9.89, 11.35, 20.83, 23.15],
    events: [17.43, 20.51, 23.45, 24.23, 25.2, 28.25],
    muons: [7.73, 13.19, 20.05, 27.75],
    frames: [4.01, 13.6, 17.69, 19.15, 23.99, 25.37, 34.07, 38.2],
    east: [16.27, 19.27, 24.29],
    west: [9.17, 11.07, 13.29, 18.39, 21.37, 25.49, 28.19],
  },
} as const;
export function relativityDirector(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
): RelativityDirection {
  const ch = Math.round(bound(chapter, 0, 7, 0)),
    t = bound(chapterTime, 0, 60, 0),
    cuts = RELATIVITY_SPEECH_CUTS[locale],
    d: RelativityDirection = {
      shot: 'ether',
      progress: 0,
      beta: 0.6,
      frame: 'ground',
      reveal: false,
      prediction: false,
      direction: 1,
      height: 10000,
    };
  if (ch <= 1)
    return {
      ...d,
      reveal: ch === 1,
      progress: ch === 0 ? ramp(t, cuts.rotation[0], cuts.rotation[1]) : ramp(t, 4.8, 10.8),
    };
  if (ch === 2) {
    const [start, arrive, ground, groundStart, rear, front] = cuts.train;
    return {
      ...d,
      shot: 'train',
      frame: t < ground ? 'train' : 'ground',
      progress:
        t < ground
          ? ramp(t, start, arrive)
          : t <= rear
            ? 0.25 * ramp(t, groundStart, rear)
            : 0.25 + 0.75 * ramp(t, rear, front),
    };
  }
  if (ch === 3) {
    const [predict, release, reversedEnd, stationary, restart, stationaryEnd] = cuts.events;
    return t < predict
      ? { ...d, shot: 'events', progress: 1 }
      : {
          ...d,
          shot: 'train',
          beta: t < stationary ? -0.6 : 0,
          prediction: t < release,
          progress:
            t < stationary ? ramp(t, release, reversedEnd) : ramp(t, restart, stationaryEnd),
        };
  }
  if (ch === 4) {
    const [recordsReveal, cohort, start, arrive] = cuts.muons;
    return t < cohort
      ? { ...d, shot: 'muon-records', reveal: t >= recordsReveal }
      : { ...d, shot: 'muon-cohort', beta: 0.99, progress: ramp(t, start, arrive) };
  }
  if (ch === 5) {
    const [lightStart, tick, frame, groundStart, groundArrival, predict, release, fasterArrival] =
      cuts.frames;
    if (t < frame) return { ...d, shot: 'light-clock', progress: ramp(t, lightStart, tick) };
    if (t < predict)
      return {
        ...d,
        shot: 'muon-frame',
        beta: 0.99,
        progress: ramp(t, groundStart, groundArrival),
      };
    return {
      ...d,
      shot: 'muon-cohort',
      beta: 0.995,
      prediction: t < release,
      progress: ramp(t, release, fasterArrival),
    };
  }
  if (ch === 6) {
    const [height, records, reveal] = cuts.east;
    if (t < height) return { ...d, shot: 'clock-vectors' };
    if (t < records) return { ...d, shot: 'clock-height' };
    return { ...d, shot: 'clock-records', reveal: t >= reveal, progress: 1 };
  }
  const [answer, heightPositive, records, reveal, model, lower, zero] = cuts.west;
  if (t < records)
    return {
      ...d,
      shot: 'clock-vectors',
      direction: -1,
      prediction: t < answer,
      progress: t >= heightPositive ? 1 : 0,
    };
  if (t < model)
    return { ...d, shot: 'clock-records', direction: -1, reveal: t >= reveal, progress: 1 };
  return {
    ...d,
    shot: 'clock-model',
    direction: -1,
    height: 10000 * (1 - ramp(t, lower, zero)),
    progress: 1,
  };
}
