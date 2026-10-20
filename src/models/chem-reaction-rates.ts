/** Illustrative kinetics, not fitted textbook measurements. Concentrations mol/L, time s. */
export const rateClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export const GAS_ML = ((8.314462618 * 298.15) / 101.325) * 1000;
export const temperatureFactor = (c: number, ea = 35000) =>
  Math.exp(
    (rateClamp(ea, 0, 100000) / 8.314462618) * (1 / 298.15 - 1 / (rateClamp(c, 0, 70) + 273.15)),
  );
export function peroxide(
  seconds: number,
  temperature: number,
  catalyst: 'none' | 'Fe' | 'Mn',
  percent = 5,
) {
  const n0 = (2 * rateClamp(percent, 0, 10)) / 100 / 34.0147;
  // Both catalyst pathways are shown with the SAME illustrative k: no ranking from unequal doses.
  const k = (catalyst === 'none' ? 0.0005 : 0.015) * temperatureFactor(temperature);
  const remaining = n0 * Math.exp(-k * rateClamp(seconds, 0, 1e9));
  return {
    n0,
    remaining,
    oxygen: (n0 - remaining) / 2,
    oxygenMl: ((n0 - remaining) / 2) * GAS_ML,
    initialRate: (k * n0) / 2,
    rate: (k * remaining) / 2,
    k,
  };
}
export function marble(seconds: number, acidM: number, surface = 1) {
  const acid = 0.002 * rateClamp(acidM, 0, 1),
    solid = 0.001;
  const k = 0.04 * rateClamp(surface, 1, 2),
    maximum = Math.min(solid, acid / 2);
  const extent = Math.min(solid, (acid / 2) * (1 - Math.exp(-k * rateClamp(seconds, 0, 1e9))));
  return {
    extent,
    solidLeft: solid - extent,
    acidLeft: acid - 2 * extent,
    maximum,
    volume: extent * GAS_ML,
    initialRate: (acid / 2) * k,
    rate: extent < solid ? (acid / 2) * k * Math.exp(-k * rateClamp(seconds, 0, 1e9)) : 0,
  };
}
export function turbidity(seconds: number, stockMl: number, temperature: number) {
  const c0 = (rateClamp(stockMl, 0, 2) * 0.1) / 4;
  const k = 0.035 * temperatureFactor(temperature, 45000);
  const sulfur = c0 * (1 - Math.exp(-k * rateClamp(seconds, 0, 1e9)));
  const threshold = Math.log(2) / 40;
  return {
    c0,
    k,
    sulfur,
    transmission: Math.exp(-40 * sulfur),
    endpoint: c0 > threshold ? -Math.log(1 - threshold / c0) / k : null,
    volumeMl: 4,
  };
}
export function zincGas(seconds: number, acidM: number, leak = 0) {
  const maximum = Math.min(2 / 65.38, 0.04 * rateClamp(acidM, 0, 4));
  const referenceMaximum = (2 / 65.38) * GAS_ML;
  const k = (-Math.log(1 - 10 / referenceMaximum) / 30) * rateClamp(acidM, 0, 4);
  const produced = maximum * (1 - Math.exp(-k * rateClamp(seconds, 0, 1e9)));
  const fraction = 1 - rateClamp(leak),
    collected = produced * fraction;
  const finalMl = maximum * GAS_ML * fraction;
  const endpoint = k > 0 && finalMl > 10 ? -Math.log(1 - 10 / finalMl) / k : null;
  return {
    produced,
    collected,
    leaked: produced - collected,
    volumeMl: collected * GAS_ML,
    finalMl,
    endpoint,
    k,
  };
}
export function observedRate(time: string) {
  if (!time.trim()) return null;
  const t = Number(time);
  return Number.isFinite(t) && t > 0 ? 10 / t : null;
}
/** Each comparison holds its completed collision before the next trial/chapter. */
export function collisionTrial(progress: number) {
  const p = rateClamp(progress),
    trial = p < 0.5 ? 0 : 1;
  return { trial, progress: rateClamp((trial === 0 ? p * 2 : (p - 0.5) * 2) / 0.84) };
}
export type RateAtom = { id: string; element: 'H' | 'I'; x: number; y: number; r: number };
/** Fixed four atom identities; visible bonds follow the same contact geometry. */
export function collision(width: number, progress: number, enough: boolean, oriented: boolean) {
  width = rateClamp(width, 240, 1200);
  const cx = width / 2,
    p = rateClamp(progress),
    success = enough && oriented;
  const near = oriented ? 13 : 16,
    far = Math.min(70, width / 2 - 28);
  const approach = Math.min(1, p / 0.45);
  const separation = far + (near - far) * approach;
  let left = cx - separation,
    right = cx + separation;
  if (!success && p > 0.45) {
    const q = (p - 0.45) / 0.55;
    left = cx - near - (far - near) * q;
    right = cx + near + (far - near) * q;
  }
  let atoms: RateAtom[] = [
    { id: 'H1', element: 'H', x: left + 7, y: 140, r: 6 },
    { id: 'I1', element: 'I', x: left - 11, y: 140, r: 12 },
    { id: 'H2', element: 'H', x: right + (oriented ? -7 : 11), y: 140, r: 6 },
    { id: 'I2', element: 'I', x: right + (oriented ? 11 : -7), y: 140, r: 12 },
  ];
  if (success && p > 0.45) {
    const q = rateClamp((p - 0.45) / 0.35);
    atoms = [
      { id: 'H1', element: 'H', x: cx - 6, y: 140 - q * 60, r: 6 },
      { id: 'I1', element: 'I', x: cx - 24 - q * 22, y: 140 + q * 48, r: 12 },
      { id: 'H2', element: 'H', x: cx + 6, y: 140 - q * 60, r: 6 },
      { id: 'I2', element: 'I', x: cx + 24 + q * 22, y: 140 + q * 48, r: 12 },
    ];
    if (p > 0.8) {
      const a = (p - 0.8) / 0.2;
      atoms[1].x = cx - 46 + 34 * a;
      atoms[3].x = cx + 46 - 34 * a;
    }
  }
  return {
    atoms,
    hi: !success || p <= 0.45,
    hh: success && p > 0.45,
    ii: success && p >= 1,
    radicals: success && p > 0.45 && p < 1,
  };
}
/** Generic reaction-coordinate profile: not a measured HI energy surface. */
export function energyProfile(q: number, catalyzed: boolean) {
  const x = rateClamp(q);
  return (
    -20 * x +
    (catalyzed
      ? 39 * Math.sin(Math.PI * x) ** 2 + 9 * Math.sin(2 * Math.PI * x) ** 2
      : 70 * Math.sin(Math.PI * x) ** 2)
  );
}
export function syringeGeometry(width: number, volume: number) {
  width = rateClamp(width, 240, 1200);
  const x0 = width / 2 - 60,
    span = 90,
    piston = x0 + (span * rateClamp(volume, 0, 20)) / 20;
  return { x0, span, piston, stop: x0 + span, tick10: x0 + span / 2 };
}

/** Book recipes and qualitative claims only: its observation/time cells are blank. */
export const RATE_BOOK_EVIDENCE = Object.freeze({
  peroxide: Object.freeze({
    ml: 2,
    percent: 5,
    catalystDrops: 2,
    observation: 'Warming usually increases the rate; no measured times supplied.',
  }),
  thiosulfate: Object.freeze({
    stockM: 0.1,
    stockMl: Object.freeze([2, 1]),
    waterMl: Object.freeze([0, 1]),
    acidMl: 2,
    acidM: 0.1,
    totalMl: 4,
  }),
  zinc: Object.freeze({ grams: 2, acidMl: 40, acidM: Object.freeze([1, 4]), endpointMl: 10 }),
});
export const RATE_IDS = [
  'rate-temperature',
  'rate-concentration',
  'rate-thio-concentration',
  'rate-thio-temperature',
  'rate-catalysts',
  'rate-design',
  'rate-syringe',
  'rate-curves',
  'rate-collision-energy',
  'rate-collision-orientation',
  'rate-catalytic-path',
] as const;
export const RATE_SECONDS = [27, 27, 25, 25, 27, 20.5, 20, 20.5, 20, 19.5, 19.5] as const;
const cut = (t: number, a: number, b: number) => rateClamp((t - a) / (b - a));
/** Chapter-local seconds read from the final bilingual word timings. Values already
 * include the 0.45 s leading silence; the scientific model clock remains separate. */
export const RATE_CUTS = {
  zh: [
    { mechanism: 6.9, move: 11.0, moved: 15.0, question: 18.85, answer: 23.85 },
    { mechanism: 8.3, move: 8.8, moved: 13.7, question: 17.35, answer: 21.8 },
    { mechanism: 6.9, move: 7.0, moved: 9.5, return: 9.65, question: 14.5, answer: 20.25 },
    { mechanism: 7.2, move: 10.9, moved: 13.6, question: 16.55, answer: 20.15 },
    { mechanism: 12.8, move: 13.7, moved: 18.8, question: 19.45, answer: 23.45 },
  ],
  en: [
    { mechanism: 6.15, move: 9.7, moved: 13.75, question: 16.95, answer: 21.6 },
    { mechanism: 8.65, move: 9.1, moved: 13.75, question: 17.25, answer: 21.8 },
    { mechanism: 6.95, move: 7.0, moved: 9.45, return: 9.7, question: 14.05, answer: 19.25 },
    { mechanism: 5.55, move: 9.9, moved: 13.0, question: 16.2, answer: 19.2 },
    { mechanism: 12.7, move: 13.4, moved: 18.3, question: 18.85, answer: 22.2 },
  ],
} as const;
/** Piecewise progression exposes an intermediate before the next narrated event.
 * These are director intervals, never residence times or a measured collision law. */
function collisionBeat(t: number, start: number, split: number, join: number) {
  if (t <= split) return 0.45 * cut(t, start, split);
  if (t <= join - 1.25) return 0.45 + 0.35 * cut(t, split, join - 1.25);
  return 0.8 + 0.2 * cut(t, join - 1.25, join);
}
export function rateFilm(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const ch = Math.round(rateClamp(chapter, 0, 10)),
    t = rateClamp(time, 0, 90);
  const en = locale === 'en';
  let shot = 'observation',
    progress = 0,
    question = false,
    reveal = false,
    trial = 0,
    trialProgress = 0,
    syringeAcid = 1,
    syringeProgress = 0;
  if (ch < 5) {
    const c = RATE_CUTS[locale][ch];
    progress = cut(t, 0.45, c.mechanism - 0.4);
    if (t >= c.mechanism) {
      shot = ['thermal', 'encounters', 'encounters', 'thermal', 'pathway'][ch];
      progress = cut(t, c.move, c.moved);
    }
    if ('return' in c && t >= c.return) {
      shot = 'observation';
      progress = 0.65 + 0.35 * cut(t, c.return, c.question - 0.5);
    }
    if (t >= c.question) {
      shot = 'prediction';
      question = true;
      reveal = t >= c.answer;
      progress = reveal ? 1 : 0;
    }
  } else if (ch === 5) {
    shot = 'design';
    progress = cut(t, 0.45, en ? 13.15 : 14.8);
  } else if (ch === 6) {
    shot = 'syringe';
    // Two independent sample clocks, each reaches the same 10 mL and holds.
    syringeAcid = t < 7 ? 1 : 4;
    syringeProgress = t < 7 ? cut(t, 0.8, 6.2) : cut(t, 7.0, 11.5);
    progress = syringeProgress;
  } else if (ch === 7) {
    const leakAt = en ? 11.1 : 12.45;
    shot = t < leakAt ? 'curves' : 'leak';
    progress = t < leakAt ? cut(t, 0.45, en ? 7.8 : 7.75) : cut(t, leakAt, leakAt + 3.1);
  } else if (ch === 8 || ch === 9) {
    shot = 'collision';
    const secondAt = ch === 8 ? (en ? 7.65 : 6.8) : en ? 7.2 : 5.0;
    trial = t < secondAt ? 0 : 1;
    if (trial === 0) trialProgress = cut(t, 0.6, ch === 8 ? (en ? 6.4 : 5.8) : en ? 6.8 : 4.8);
    else
      trialProgress =
        ch === 8
          ? collisionBeat(t, secondAt, en ? 11.2 : 9.9, en ? 15.15 : 13.9)
          : collisionBeat(t, secondAt, en ? 8.1 : 6.0, en ? 10.65 : 9.2);
    progress = (trial + trialProgress * 0.84) / 2;
  } else {
    shot = 'pathway';
    progress = cut(t, 2.6, en ? 11.5 : 10.55);
  }
  return {
    chapter: ch,
    shot,
    progress,
    question,
    reveal,
    trial,
    trialProgress,
    syringeAcid,
    syringeProgress,
  };
}
/** Selected near-threshold cases. Not a representative sample or measured liquid mechanism.
 * Energy scales with absolute T as a pedagogical one-coordinate ensemble rescaling.
 * These countable cases are NOT used to fit the macroscopic Arrhenius constants. */
export function thermalTrials(temperature: number, progress = 1) {
  const target = rateClamp(temperature, 0, 70) + 273.15;
  const t = 293.15 + (target - 293.15) * rateClamp(progress);
  return [29, 30, 31, 32, 33, 34, 35, 36].map((e, i) => ({
    id: `E${i + 1}`,
    energy: (e * t) / 293.15,
    threshold: 35,
    eligible: (e * t) / 293.15 >= 35,
  }));
}
/** A fixed area/time window, with doubled representative encounter opportunities.
 * Outcome rule is identical in both lanes; no claim of a universal measured rate law. */
export function encounterWindow(concentration: 1 | 2, progress: number) {
  const count = concentration === 2 ? 12 : 6,
    p = rateClamp(progress);
  const events = Array.from({ length: count }, (_, i) => {
    const at = 0.15 + (0.7 * (i + 0.5)) / count,
      phase = rateClamp((p - at + 0.12) / 0.24);
    return { id: `A${i + 1}`, at, phase, eligible: i % 3 === 0, arrived: phase === 1 };
  });
  return {
    events,
    arrived: events.filter((e) => e.arrived).length,
    effective: events.filter((e) => e.arrived && e.eligible).length,
    fraction: 1 / 3,
  };
}
export function opticalCriterion(stockMl: number, temperature: number, threshold = 0.5) {
  const sample = turbidity(0, stockMl, temperature),
    target = -Math.log(rateClamp(threshold, 0.05, 0.95)) / 40;
  return {
    target,
    maximum: sample.c0,
    reachable: sample.c0 > target,
    time: sample.c0 > target ? -Math.log(1 - target / sample.c0) / sample.k : null,
  };
}
/** Equal-amount asymptote rather than the rate at a single late instant. */
export function ratePrediction(chapter: number) {
  switch (Math.round(rateClamp(chapter, 0, 4))) {
    case 0:
      return {
        kind: 'same-yield',
        a: peroxide(1e9, 20, 'Fe').oxygenMl,
        b: peroxide(1e9, 50, 'Fe').oxygenMl,
      };
    case 1:
      return {
        kind: 'same-yield-surface',
        a: marble(1e9, 1, 1).volume,
        b: marble(1e9, 1, 2).volume,
      };
    case 2:
      return { kind: 'too-dilute', ...opticalCriterion(0.1, 25) };
    case 3:
      return { kind: 'same-energy-threshold', a: 35, b: 35 };
    default:
      return {
        kind: 'same-yield-catalyst',
        a: peroxide(1e9, 25, 'none', 10).oxygenMl,
        b: peroxide(1e9, 25, 'Fe', 10).oxygenMl,
      };
  }
}
