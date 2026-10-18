const finite = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback);
const clamp = (n: number, lo: number, hi: number, fallback = lo) =>
  Math.max(lo, Math.min(hi, finite(n, fallback)));
const smooth = (n: number) => {
  const p = clamp(n, 0, 1);
  return p * p * (3 - 2 * p);
};
const phase = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
export type HydrogenOrbital = '1s' | '2s' | '2p';
export function radialProbability(orbital: HydrogenOrbital, r: number) {
  const x = clamp(r, 0, 1000, r === Infinity ? 1000 : 0);
  return orbital === '1s'
    ? 4 * x * x * Math.exp(-2 * x)
    : orbital === '2s'
      ? (x * x * (2 - x) ** 2 * Math.exp(-x)) / 8
      : (x ** 4 * Math.exp(-x)) / 24;
}
export function radialCdf(orbital: HydrogenOrbital, r: number) {
  const x = clamp(r, 0, 1000, r === Infinity ? 1000 : 0);
  return Math.max(
    0,
    Math.min(
      1,
      orbital === '1s'
        ? 1 - Math.exp(-2 * x) * (1 + 2 * x + 2 * x * x)
        : orbital === '2s'
          ? 1 - (Math.exp(-x) * (x ** 4 + 4 * x * x + 8 * x + 8)) / 8
          : 1 - Math.exp(-x) * (1 + x + (x * x) / 2 + x ** 3 / 6 + x ** 4 / 24),
    ),
  );
}
export function orbitalRadius(orbital: HydrogenOrbital, probability = 0.9) {
  const p = clamp(probability, 0.001, 0.999, 0.9);
  let lo = 0,
    hi = 40;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (radialCdf(orbital, m) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
function radicalInverse(i: number, base: number) {
  let x = 0,
    f = 1 / base;
  while (i) {
    x += (i % base) * f;
    i = Math.floor(i / base);
    f /= base;
  }
  return x;
}
/** Deterministic samples of 3D |psi|², not positions along one trajectory. Distances in a0. */
export function orbitalSamples(orbital: HydrogenOrbital, count = 900) {
  return Array.from({ length: Math.round(clamp(count, 0, 3000, 900)) }, (_, i) => {
    const r = orbitalRadius(orbital, radicalInverse(i + 1, 2)),
      u = 2 * radicalInverse(i + 1, 3) - 1,
      c = orbital === '2p' ? Math.cbrt(u) : u,
      s = Math.sqrt(1 - c * c),
      phi = 2 * Math.PI * radicalInverse(i + 1, 5);
    return { r, x: r * s * Math.cos(phi), y: r * c, z: r * s * Math.sin(phi) };
  });
}
export const ORBITAL_SAMPLES = {
  '1s': orbitalSamples('1s'),
  '2s': orbitalSamples('2s'),
  '2p': orbitalSamples('2p'),
};
export function projectOrbital(
  p: { x: number; y: number; z: number },
  axis: 'x' | 'y' | 'z' = 'y',
) {
  const v =
    axis === 'x' ? { x: p.y, y: p.x, z: p.z } : axis === 'z' ? { x: p.x, y: p.z, z: p.y } : p;
  const cy = Math.cos(0.6),
    sy = Math.sin(0.6),
    cp = Math.cos(0.4),
    sp = Math.sin(0.4);
  return { x: cy * v.x - sy * v.z, y: sp * sy * v.x + cp * v.y + sp * cy * v.z };
}
export function bohrHydrogen(n: number) {
  const level = Math.round(clamp(n, 1, 4, 1));
  return { n: level, radius: level ** 2, energy: -13.605693 / level ** 2 };
}
export function atomicDirector(chapter: number, progress: number) {
  const p = clamp(progress, 0, 1);
  chapter = Math.round(clamp(chapter, 0, 7));
  return {
    chapter,
    progress: p,
    orbital: (chapter === 6 ? '2s' : chapter === 7 ? '2p' : '1s') as HydrogenOrbital,
    probability: chapter === 5 ? 0.5 + 0.4 * p : 0.9,
    count: chapter === 4 ? Math.max(1, Math.round(900 * p)) : 900,
    contour: chapter === 5 || chapter === 6,
    bohrN: chapter === 3 && p < 0.5 ? 2 : 1,
  };
}

/** Immutable transcription of Thomson's second-method table. Values are raw historical m/e ×10⁻⁷, not SI. */
export const THOMSON_RECORDS = Object.freeze(
  [
    { id: 'T1', gas: 'air', cathode: 'Al', massCharge: 1.3 },
    { id: 'T2', gas: 'air', cathode: 'Al', massCharge: 1.1 },
    { id: 'T3', gas: 'air', cathode: 'Al', massCharge: 1.2 },
    { id: 'T4', gas: 'hydrogen', cathode: 'Al', massCharge: 1.5 },
    { id: 'T5', gas: 'carbon-dioxide', cathode: 'Al', massCharge: 1.5 },
    { id: 'T6', gas: 'air', cathode: 'Pt', massCharge: 1.3 },
    { id: 'T7', gas: 'air', cathode: 'Pt', massCharge: 1.1 },
  ].map((row) => Object.freeze(row)),
);
export const HYDROGEN_LINE_RECORDS = Object.freeze(
  [
    { id: 'Halpha', upper: 3, airNm: 656.28518, colour: '#bb6554' },
    { id: 'Hbeta', upper: 4, airNm: 486.13615, colour: '#3a8e97' },
    { id: 'Hgamma', upper: 5, airNm: 434.0462, colour: '#6a71a2' },
  ].map((row) => Object.freeze(row)),
);
export const ATOMIC_CONSTANTS = Object.freeze({
  electronCharge: 1.602176634e-19,
  electronMass: 9.1093837139e-31,
  h: 6.62607015e-34,
  c: 299792458,
  rydberg: 10973731.568157,
  electronProtonMassRatio: 5.446170214889e-4,
  coulombMeVFm: 1.4399645469,
});
/** SI coordinates: x along beam, y up. polarity +1 means upper plate positive, electric field down. */
export function cathodeRayAt(xMetres: number, polarity = 1, chargeSign = -1, speed = 15e6) {
  const x = clamp(xMetres, -0.025, 0.14),
    fieldPolarity = clamp(polarity, -1, 1),
    q = clamp(chargeSign, -1, 1, -1),
    vx = clamp(speed, 12e6, 20e6, 15e6),
    length = 0.05,
    acceleration =
      (-q * fieldPolarity * 1000 * ATOMIC_CONSTANTS.electronCharge) / ATOMIC_CONSTANTS.electronMass,
    t = Math.max(0, Math.min(x, length)) / vx,
    vy = acceleration * t,
    y = (acceleration * t * t) / 2 + (vy * Math.max(0, x - length)) / vx;
  return {
    x,
    y,
    vx,
    vy,
    acceleration,
    polarity: fieldPolarity,
    chargeSign: q,
    plateLength: length,
    screenX: 0.14,
    gap: 0.015,
  };
}
export function cathodeRay(polarity = 1, chargeSign = -1, speed = 15e6) {
  const points = Array.from({ length: 81 }, (_, i) =>
    cathodeRayAt(-0.025 + (0.165 * i) / 80, polarity, chargeSign, speed),
  );
  return { points, spot: cathodeRayAt(0.14, polarity, chargeSign, speed) };
}

/** Transverse distance has its own enlarged scale, independent of horizontal viewport width. */
export function cathodeView(viewWidth: number) {
  const width = clamp(viewWidth, 260, 780, 278);
  return {
    width,
    x: (metres: number) => 32 + ((metres + 0.025) / 0.165) * (width - 66),
    y: (metres: number) => 107 - metres * 6000,
    tubeTop: 42,
    tubeBottom: 170,
    screenTop: 54,
    screenBottom: 160,
  };
}
/** Controlled modern comparison, not a fit to the 1911 experiment. E is asymptotic total kinetic energy. */
export function scatteringAccount(energyMeV = 5) {
  const energy = clamp(energyMeV, 1, 10, 5),
    chargeProduct = 2 * 79,
    coulomb = ATOMIC_CONSTANTS.coulombMeVFm * chargeProduct,
    diffuseRadiusFm = 100_000,
    barrierMeV = (1.5 * coulomb) / diffuseRadiusFm,
    turningFm = coulomb / energy;
  return {
    energyMeV: energy,
    chargeProduct,
    coulomb,
    diffuseRadiusFm,
    barrierMeV,
    barrierFraction: barrierMeV / energy,
    turningFm,
    chargeE: 79,
  };
}
function diffusePotential(x: number, eta: number) {
  return Math.abs(x) <= 1 ? (eta * (3 - x * x)) / 2 : eta / Math.abs(x);
}
/** Continuous time parameter from integrating dx/sqrt(1-U/E); no discontinuous centre snap. */
export function diffuseHeadOn(progress: number, energyMeV = 5) {
  const a = scatteringAccount(energyMeV),
    eta = a.coulomb / (a.diffuseRadiusFm * a.energyMeV),
    p = clamp(progress, 0, 1),
    step = 4 / 512;
  const nodes = [{ x: -2, t: 0 }];
  for (let i = 1; i <= 512; i++) {
    const x = -2 + i * step,
      previous = nodes[i - 1];
    const dt =
      (step / 2) *
      (1 / Math.sqrt(1 - diffusePotential(previous.x, eta)) +
        1 / Math.sqrt(1 - diffusePotential(x, eta)));
    nodes.push({ x, t: previous.t + dt });
  }
  const duration = nodes[512].t,
    time = p * duration;
  let hi = nodes.findIndex((n) => n.t >= time);
  if (hi < 1) hi = 1;
  const lo = nodes[hi - 1],
    up = nodes[hi],
    w = (time - lo.t) / (up.t - lo.t),
    x = lo.x + w * (up.x - lo.x),
    potentialMeV = diffusePotential(x, eta) * a.energyMeV;
  return {
    ...a,
    progress: p,
    xFm: x * a.diffuseRadiusFm,
    xRadius: x,
    potentialMeV,
    kineticMeV: a.energyMeV - potentialMeV,
    velocityFraction: Math.sqrt(1 - potentialMeV / a.energyMeV),
    duration,
  };
}
function pointElapsed(ratio: number) {
  return Math.sqrt(ratio * (ratio - 1)) + Math.acosh(Math.sqrt(ratio));
}
/** Exact fixed-centre Coulomb head-on radial time law, view from 4 r_min to turn and back. */
export function pointHeadOn(progress: number, energyMeV = 5) {
  const a = scatteringAccount(energyMeV),
    p = clamp(progress, 0, 1),
    elapsed = Math.abs(2 * p - 1) * pointElapsed(4);
  let lo = 1,
    hi = 4;
  for (let i = 0; i < 55; i++) {
    const m = (lo + hi) / 2;
    if (pointElapsed(m) < elapsed) lo = m;
    else hi = m;
  }
  const r = p === 0.5 ? 1 : (lo + hi) / 2,
    potentialMeV = a.energyMeV / r,
    kineticMeV = a.energyMeV - potentialMeV;
  return {
    ...a,
    progress: p,
    xFm: -r * a.turningFm,
    potentialMeV,
    kineticMeV,
    velocityFraction:
      (p < 0.5 ? 1 : p > 0.5 ? -1 : 0) * Math.sqrt(Math.max(0, kineticMeV / a.energyMeV)),
  };
}
/** Nonrelativistic hydrogen reduced-mass prediction. This is not a fitted observed line. */
export function hydrogenLine(upper = 3, lower = 2) {
  const n = Math.round(clamp(upper, 2, 6, 3)),
    m = Math.round(clamp(lower, 1, n - 1, 2)),
    R = ATOMIC_CONSTANTS.rydberg / (1 + ATOMIC_CONSTANTS.electronProtonMassRatio),
    energyUnit = (ATOMIC_CONSTANTS.h * ATOMIC_CONSTANTS.c * R) / ATOMIC_CONSTANTS.electronCharge,
    upperEV = -energyUnit / n ** 2,
    lowerEV = -energyUnit / m ** 2,
    photonEV = upperEV - lowerEV,
    vacuumNm = 1e9 / (R * (1 / m ** 2 - 1 / n ** 2));
  return { upper: n, lower: m, upperEV, lowerEV, photonEV, vacuumNm };
}
/** The transition glyph transfers an energy account, not an electron on a classical path. */
export function spectralEnergyTransfer(progress: number, upper = 3) {
  const line = hydrogenLine(upper, 2),
    p = clamp(progress, 0, 1),
    released = p >= 0.5;
  return {
    ...line,
    eventId: `H-${line.upper}-2`,
    released,
    atomEV: released ? line.lowerEV : line.upperEV,
    photonEV: released ? line.photonEV : 0,
    initialEV: line.upperEV,
    photonTravel: phase(p, 0.5, 1),
  };
}
/** Chapter seconds include the measured 0.45 s lead-in before each spoken cue. */
export const ATOMIC_HISTORY_TIMING = {
  zh: {
    beam: 8.15,
    field: [10.9, 12.3],
    reverse: [13.55, 15.35],
    negative: 20.55,
    records: [6.8, 11.9],
    neutrality: 23.75,
    neutralSpread: [25.6, 27.7],
    comparison: 6.85,
    diffuse: [13.3, 20.4],
    pointApproach: [20.4, 24],
    pointReturn: [24.8, 26],
    energyQuestion: 26.05,
    energyAnswer: 29.9,
    levels: 5.25,
    red: [11.2, 15.6],
    blueQuestion: 17.8,
    blueAnswer: 21.3,
    blue: [21.3, 25],
  },
  en: {
    beam: 7.4,
    field: [10.3, 12.1],
    reverse: [13.4, 15.6],
    negative: 20.7,
    records: [4.8, 9],
    neutrality: 19.8,
    neutralSpread: [22.8, 25],
    comparison: 6.65,
    diffuse: [11.2, 19.8],
    pointApproach: [20.2, 24.65],
    pointReturn: [25.8, 27.5],
    energyQuestion: 27.63,
    energyAnswer: 30.97,
    levels: 4.75,
    red: [10.7, 15.3],
    blueQuestion: 16.75,
    blueAnswer: 21,
    blue: [21, 24.4],
  },
} as const;
const timedPhase = (time: number, range: readonly [number, number]) =>
  phase(time, range[0], range[1]);
export function atomicHistoryShot(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.round(clamp(chapter, 0, 3)),
    t = clamp(chapterTime, 0, 300),
    cuts = ATOMIC_HISTORY_TIMING[locale];
  if (c === 0)
    return {
      shot: t < cuts.beam ? 'hypothesis' : 'beam',
      polarity:
        t < cuts.reverse[0] ? timedPhase(t, cuts.field) : 1 - 2 * timedPhase(t, cuts.reverse),
      negative: t >= cuts.negative,
      progress: phase(t, cuts.beam, cuts.field[0]),
      records: 0,
      reveal: t >= cuts.negative,
    };
  if (c === 1)
    return {
      shot: t < cuts.neutrality ? 'materials' : 'neutrality',
      polarity: 1,
      negative: true,
      progress: timedPhase(t, cuts.neutralSpread),
      records:
        t < cuts.records[0]
          ? 0
          : Math.min(
              7,
              Math.floor((6 * (t - cuts.records[0])) / (cuts.records[1] - cuts.records[0])) + 1,
            ),
      reveal: t >= cuts.records[1],
    };
  if (c === 2)
    return {
      shot:
        t < cuts.comparison
          ? 'observation'
          : t < cuts.energyQuestion
            ? 'charge-compare'
            : 'energy-predict',
      polarity: 0,
      negative: false,
      progress: timedPhase(t, cuts.diffuse),
      records: 0,
      reveal: t >= cuts.energyAnswer,
    };
  const blue = t >= cuts.blueQuestion;
  return {
    shot: t < cuts.levels ? 'fixed-spectrum' : blue ? 'blue-predict' : 'red-gap',
    polarity: 0,
    negative: false,
    progress: timedPhase(t, blue ? cuts.blue : cuts.red),
    records: 3,
    reveal: !blue || t >= cuts.blueAnswer,
  };
}
/** Separate slow views, deliberately not synchronized physical flight times. Hold the zero-speed turn. */
export function scatteringSequence(chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const t = clamp(chapterTime, 0, 300),
    cuts = ATOMIC_HISTORY_TIMING[locale];
  return {
    diffuseProgress: timedPhase(t, cuts.diffuse),
    pointProgress:
      t < cuts.pointApproach[1]
        ? 0.5 * timedPhase(t, cuts.pointApproach)
        : t < cuts.pointReturn[0]
          ? 0.5
          : 0.5 + 0.5 * timedPhase(t, cuts.pointReturn),
  };
}
