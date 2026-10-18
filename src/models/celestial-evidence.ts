import { jupiterMoons } from './textbook-astronomy';

/** Fixed evidence and candidate predictions. AU, years and radians in dynamics;
 * displayed direction residuals explicitly carry arcminutes or arcseconds. */
export const evidenceClamp = (v: number, lo: number, hi: number) =>
  Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
export const wrapAngle = (v: number) =>
  Number.isFinite(v) ? Math.atan2(Math.sin(v), Math.cos(v)) : 0;
/** Five fixed synthetic observations at adjacent elapsed days, not Galileo's historical notes.
 * Rewinding changes which records are visible, never their dates or moon coordinates. */
export const JUPITER_RECORDS = Object.freeze(
  [0, 1, 2, 3, 4].map((day) =>
    Object.freeze({
      day,
      moons: Object.freeze(jupiterMoons(day).map((moon, id) => Object.freeze({ ...moon, id }))),
    }),
  ),
);
export function jupiterObservation(progress: number) {
  const day = 4 * evidenceClamp(progress, 0, 1);
  return {
    day,
    moons: jupiterMoons(day).map((moon, id) => ({ ...moon, id })),
    records: JUPITER_RECORDS.filter((record) => record.day <= day + 1e-10),
  };
}
/** The five-day sequence completes with the recorded sentence about five adjacent dates.
 * The remaining narration holds the completed table; no chapter-end-only fifth record. */
export function jupiterRecordProgress(chapterTime: number, locale: 'zh' | 'en') {
  const begin = locale === 'en' ? 2.33 : 2.71,
    complete = locale === 'en' ? 12.13 : 13.19;
  return evidenceClamp((chapterTime - begin) / (complete - begin), 0, 1);
}
/** Historical dates stay fixed; the illustrative 75.3-year orbit never generates them. */
export const HALLEY_RECORD_YEARS = Object.freeze([1531, 1607, 1682, 1758]);
export type CometEvidenceStage = 'past' | 'prediction' | 'observed';
/** Actual chapter-7 word timings plus the 0.45 s speech lead-in:
 * ZH “1758” starts at 6.72 s; EN “rediscovered” starts at 8.16 s. */
export function cometEvidenceStage(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en',
  watch = true,
): CometEvidenceStage {
  if (!watch) return 'observed';
  if (chapter !== 7) return 'past';
  return evidenceClamp(chapterTime, 0, 90) >= (locale === 'en' ? 8.61 : 7.17)
    ? 'observed'
    : 'prediction';
}
const DEG = Math.PI / 180;
export const ARCSEC = 3600 / DEG;
const rms = (values: number[]) =>
  Math.sqrt(values.reduce((s, v) => s + v * v, 0) / Math.max(1, values.length));
export type OrbitCandidate = 'circle' | 'ellipse';
/** Synthetic data generated once in an independent Python bisection benchmark.
 * Chosen phase .12 rad, eccentricity .0934, bounded signed offsets in arcminutes.
 * These are NOT Tycho measurements. Candidates never regenerate this table. */
export const MARS_RECORDS = Object.freeze(
  [
    [-80, 2.635680552956225],
    [-40, 22.49571556232441],
    [0, 28.53893164028039],
    [40, 18.916408232736305],
    [80, 21.78601818041733],
    [120, 38.756507128528526],
    [160, 61.13869616529391],
  ].map(([day, longitudeDegrees], index) =>
    Object.freeze({ id: `mars-${day}`, day, longitudeDegrees, training: index < 5 }),
  ),
);
function orbitPoint(a: number, e: number, mean: number) {
  const m = wrapAngle(mean);
  let E = m;
  for (let i = 0; i < 16; i++) E -= (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
  return { x: a * (Math.cos(E) - e), y: a * Math.sqrt(1 - e * e) * Math.sin(E) };
}
export function marsDirection(day: number, candidate: OrbitCandidate, phase: number) {
  const t = evidenceClamp(day, -1000, 1000),
    p = evidenceClamp(phase, -0.5, 0.5),
    earth = orbitPoint(1, 0, (2 * Math.PI * t) / 365.25),
    mars = orbitPoint(1.5237, candidate === 'circle' ? 0 : 0.0934, (2 * Math.PI * t) / 686.98 + p);
  return { earth, mars, longitude: Math.atan2(mars.y - earth.y, mars.x - earth.x) };
}
export function marsComparison(candidate: OrbitCandidate, phase: number) {
  const records = MARS_RECORDS.map((r) => {
    const predictionDegrees = marsDirection(r.day, candidate, phase).longitude / DEG;
    return {
      ...r,
      predictionDegrees,
      residualArcmin: (wrapAngle((r.longitudeDegrees - predictionDegrees) * DEG) / DEG) * 60,
    };
  });
  return {
    candidate,
    phase,
    records,
    trainingRMSE: rms(records.filter((r) => r.training).map((r) => r.residualArcmin)),
    heldOutRMSE: rms(records.filter((r) => !r.training).map((r) => r.residualArcmin)),
  };
}
/** Identical grid and training rows for both candidates. Held-out values are never used. */
export function fitMars(candidate: OrbitCandidate) {
  let best = marsComparison(candidate, -0.08);
  for (let i = 1; i <= 800; i++) {
    const trial = marsComparison(candidate, -0.08 + i * 0.0005);
    if (trial.trainingRMSE < best.trainingRMSE) best = trial;
  }
  return best;
}
export const MARS_FITS = Object.freeze({ circle: fitMars('circle'), ellipse: fitMars('ellipse') });

/** Frozen teaching residuals from independent RK4 (.025 year step) plus specified
 * offsets <= .2 arcsec. Heliocentric directions, NOT Earth-observed 1846 records. */
export const URANUS_RECORDS = Object.freeze(
  [
    [10, 2.4978087831163203],
    [20, -4.444088085269721],
    [30, -56.053730667367454],
    [40, -146.2697001402694],
    [50, -221.9232061645006],
    [60, -234.51934195473495],
    [70, -168.00615910351974],
    [80, -53.63748113538647],
  ].map(([year, residualArcsec], i) =>
    Object.freeze({ id: `uranus-${year}`, year, residualArcsec, training: i < 5 }),
  ),
);
export type Vector = { x: number; y: number };
const MU = 4 * Math.PI ** 2,
  RU = 19.2,
  RN = 30.1;
/** Both bodies are pulled by N. Relative acceleration subtracts the Sun's pull. */
export function differentialGravity(
  uranus: Vector,
  year: number,
  massScale: number,
  phase: number,
) {
  const mass = evidenceClamp(massScale, 0, 1.5) * 5.15e-5,
    angle =
      (2 * Math.PI * evidenceClamp(year, 0, 80)) / RN ** 1.5 + evidenceClamp(phase, -0.4, 1.6),
    neptune = { x: RN * Math.cos(angle), y: RN * Math.sin(angle) },
    x = evidenceClamp(uranus.x, -1000, 1000),
    y = evidenceClamp(uranus.y, -1000, 1000),
    dx = neptune.x - x,
    dy = neptune.y - y,
    distance = Math.max(1e-6, Math.hypot(dx, dy)),
    solar = { x: (MU * mass * neptune.x) / RN ** 3, y: (MU * mass * neptune.y) / RN ** 3 },
    direct = { x: (MU * mass * dx) / distance ** 3, y: (MU * mass * dy) / distance ** 3 };
  return { neptune, solar, direct, relative: { x: direct.x - solar.x, y: direct.y - solar.y } };
}
export function uranusTrajectory(massScale: number, phase: number, step = 0.025) {
  const dt = evidenceClamp(step, 0.005, 0.05),
    stepsPerYear = Math.ceil(1 / dt),
    n = 80 * stepsPerYear,
    h = 1 / stepsPerYear,
    mass = evidenceClamp(massScale, 0, 1.5),
    p = evidenceClamp(phase, -0.4, 1.6);
  let state = [RU, 0, 0, Math.sqrt(MU / RU)];
  const derivative = (s: number[], t: number) => {
    const [x, y, vx, vy] = s,
      r = Math.max(1e-6, Math.hypot(x, y)),
      perturbation = differentialGravity({ x, y }, t, mass, p).relative;
    return [vx, vy, (-MU * x) / r ** 3 + perturbation.x, (-MU * y) / r ** 3 + perturbation.y];
  };
  const history: { year: number; x: number; y: number; residualArcsec: number }[] = [];
  // Annual outputs keep the evidence years exactly addressable for all valid steps.
  for (let i = 0; i <= n; i++) {
    const t = i * h;
    if (i % stepsPerYear === 0) {
      history.push({
        year: i / stepsPerYear,
        x: state[0],
        y: state[1],
        residualArcsec:
          wrapAngle(Math.atan2(state[1], state[0]) - (2 * Math.PI * t) / RU ** 1.5) * ARCSEC,
      });
    }
    if (i === n) break;
    const k1 = derivative(state, t),
      k2 = derivative(
        state.map((v, j) => v + (h * k1[j]) / 2),
        t + h / 2,
      ),
      k3 = derivative(
        state.map((v, j) => v + (h * k2[j]) / 2),
        t + h / 2,
      ),
      k4 = derivative(
        state.map((v, j) => v + h * k3[j]),
        t + h,
      );
    state = state.map((v, j) => v + (h * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) / 6);
  }
  return history;
}
export function uranusComparison(massScale: number, phase: number) {
  const history = uranusTrajectory(massScale, phase);
  const records = URANUS_RECORDS.map((r) => {
    const predictionArcsec = history[r.year].residualArcsec;
    return { ...r, predictionArcsec, errorArcsec: r.residualArcsec - predictionArcsec };
  });
  return {
    massScale,
    phase,
    history,
    records,
    trainingRMSE: rms(records.filter((r) => r.training).map((r) => r.errorArcsec)),
    heldOutRMSE: rms(records.filter((r) => !r.training).map((r) => r.errorArcsec)),
  };
}
export const URANUS_CANDIDATES = Object.freeze(
  [-0.4, 0.6, 1.6].flatMap((phase) =>
    [0, 0.5, 1, 1.5].map((mass) => uranusComparison(mass, phase)),
  ),
);
export const URANUS_BEST = [...URANUS_CANDIDATES].sort(
  (a, b) => a.trainingRMSE - b.trainingRMSE,
)[0];

/** Encke, Astronomische Nachrichten 25, no.580 (1846), columns49–52.
 * Original mean Berlin time and angular-degree RA; no silent UTC/J2000 conversion. */
export const NEPTUNE_RECORDS = Object.freeze([
  Object.freeze({
    id: 'neptune-23',
    date: '1846-09-23',
    time: '12:00:14.6',
    day: (12 + 14.6 / 3600) / 24,
    ra: 328 + 19 / 60 + 16 / 3600,
    dec: -(13 + 24 / 60 + 8.2 / 3600),
  }),
  Object.freeze({
    id: 'neptune-24',
    date: '1846-09-24',
    time: '08:54:40.9',
    day: 1 + (8 + 54 / 60 + 40.9 / 3600) / 24,
    ra: 328 + 18 / 60 + 14.3 / 3600,
    dec: -(13 + 24 / 60 + 29.7 / 3600),
  }),
  Object.freeze({
    id: 'neptune-25',
    date: '1846-09-25',
    time: '09:44:45.0',
    day: 2 + (9 + 44 / 60 + 45 / 3600) / 24,
    ra: 328 + 16 / 60 + 59.8 / 3600,
    dec: -(13 + 24 / 60 + 55.4 / 3600),
  }),
]);
export const NEPTUNE_LONGITUDE = Object.freeze({
  epoch: '1846-09-23.5',
  predictionDegrees: 324 + 58 / 60,
  observationDegrees: 325 + 52.75 / 60,
});
export function localSky(ra: number, dec: number) {
  const origin = NEPTUNE_RECORDS[0],
    d = evidenceClamp(dec, -90, 90),
    r = evidenceClamp(ra, -720, 720),
    deltaRA = wrapAngle((r - origin.ra) * DEG) * ARCSEC;
  return { x: deltaRA * Math.cos(((d + origin.dec) / 2) * DEG), y: (d - origin.dec) * 3600 };
}
export function neptuneLinearPrediction() {
  const [a, b, third] = NEPTUNE_RECORDS,
    ratio = (third.day - b.day) / (b.day - a.day),
    ra = b.ra + (wrapAngle((b.ra - a.ra) * DEG) / DEG) * ratio,
    dec = b.dec + (b.dec - a.dec) * ratio;
  return {
    ra,
    dec,
    sky: localSky(ra, dec),
    error: { raArcsec: (third.ra - ra) * 3600, decArcsec: (third.dec - dec) * 3600 },
  };
}
export const CELESTIAL_EVIDENCE_DURATIONS = { 0: 34.5, 1: 37.5, 4: 44, 5: 46 } as const;
/** Chapter seconds include the 0.45 s speech lead-in. Word evidence is in
 * artifacts/teaching-principles/batch-5-timed-speech/celestial-observations-*.json.
 * Shared chapter starts remain identical; internal cuts follow each language. */
export const CELESTIAL_EVIDENCE_EVENTS = Object.freeze({
  zh: Object.freeze({
    overlay: 16.87,
    ellipse: 11.77,
    marsLock: 15.69,
    marsReveal: 24.49,
    force: 10.33,
    residual: 19.91,
    fullMass: 24.07,
    uranusLock: 26.73,
    uranusReveal: 30.25,
    sky: 14.29,
    secondNight: 18.33,
    nightLock: 28.85,
    nightReveal: 31.25,
  }),
  en: Object.freeze({
    overlay: 16.01,
    ellipse: 11.01,
    marsLock: 15.17,
    marsReveal: 22.47,
    force: 11.69,
    residual: 20.11,
    fullMass: 24.21,
    uranusLock: 27.19,
    uranusReveal: 30.51,
    sky: 15.13,
    secondNight: 19.61,
    nightLock: 29.31,
    nightReveal: 31.89,
  }),
});
export function celestialEvidenceShot(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const t = evidenceClamp(chapterTime, 0, 90),
    e = CELESTIAL_EVIDENCE_EVENTS[locale];
  if (chapter === 0)
    return {
      view: 'records' as const,
      count: Math.min(5, 1 + Math.floor(t / 1.8)),
      candidate: 'circle' as OrbitCandidate,
      overlay: t >= e.overlay,
      locked: false,
      revealed: false,
    };
  if (chapter === 1)
    return {
      view: 'mars' as const,
      count: 5,
      candidate: (t < e.ellipse ? 'circle' : 'ellipse') as OrbitCandidate,
      overlay: true,
      locked: t >= e.marsLock,
      revealed: t >= e.marsReveal,
    };
  if (chapter === 4)
    return {
      view: (t >= e.force && t < e.residual ? 'force' : 'uranus') as 'force' | 'uranus',
      count: 5,
      mass: t < e.force ? 0 : t < e.residual ? 1 : t < e.fullMass ? 0.5 : 1,
      phase: 0.6,
      locked: t >= e.uranusLock,
      revealed: t >= e.uranusReveal,
    };
  return {
    view: (t < e.sky ? 'longitude' : 'sky') as 'longitude' | 'sky',
    count: t < e.secondNight ? 1 : t < e.nightReveal ? 2 : 3,
    locked: t >= e.nightLock,
    revealed: t >= e.nightReveal,
  };
}
