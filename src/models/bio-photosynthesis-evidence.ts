export type Illumination = 'spot' | 'full' | 'spectrum' | 'dark';
const finite = (x: number, fallback = 0) => (Number.isFinite(x) ? x : fallback);
const clamp = (x: number) => Math.max(0, Math.min(1, finite(x)));
const between = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, finite(x)));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
const phase = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
export function oxygenSource(x: number, mode: Illumination, spot = 0.4) {
  x = clamp(x);
  spot = clamp(spot);
  if (mode === 'dark') return 0;
  if (mode === 'full') return 1;
  if (mode === 'spot') return Math.exp(-(((x - spot) / 0.06) ** 2));
  return (
    0.08 + 0.9 * Math.exp(-(((x - 0.14) / 0.12) ** 2)) + 0.85 * Math.exp(-(((x - 0.88) / 0.1) ** 2))
  );
}
/** Deterministic quantile transport visualizes aerotaxis; density is qualitative. */
export function engelmannBacteria(progress: number, mode: Illumination, spot = 0.4) {
  const weights = Array.from({ length: 201 }, (_, i) => 0.025 + oxygenSource(i / 200, mode, spot)),
    total = weights.reduce((a, b) => a + b, 0);
  return Array.from({ length: 60 }, (_, id) => {
    const startX = ((id * 37) % 61) / 61,
      startY = id % 2 === 0 ? 65 + ((id * 11) % 25) : 173 + ((id * 7) % 25);
    let targetX = startX,
      sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (sum / total > (id + 0.5) / 60) {
        targetX = i / 200;
        break;
      }
    }
    const p = mode === 'dark' ? 0 : clamp(progress);
    return {
      id,
      x: 30 + (startX + (targetX - startX) * p) * 300,
      y: startY + ((id % 2 === 0 ? 91 : 169) - startY) * p,
    };
  });
}
export function hillReaction(progress: number, light = true, acceptor = true) {
  const reaction = light && acceptor ? clamp(progress) : 0;
  return { oxygen: reaction, reducedAcceptor: 4 * reaction, waterConsumed: 2 * reaction };
}
export function oxygenIsotope(waterLabeled: boolean, carbonDioxideLabeled: boolean) {
  return {
    oxygenAtoms: [
      { id: 'water-0', mass: waterLabeled ? 18 : 16 },
      { id: 'water-1', mass: waterLabeled ? 18 : 16 },
    ],
    co2OxygenMass: carbonDioxideLabeled ? 18 : 16,
  };
}
/** Small resource reservoir: carbon reduction can continue briefly after the lamp goes dark. */
export function photosynthesisCoupling(time: number, lightOffAt = Infinity, co2 = true) {
  let atp = 0,
    nadph = 0,
    triose = 0;
  const dt = 0.025;
  for (let t = 0; t < between(time, 0, 20); t += dt) {
    const light = t < lightOffAt;
    if (light) {
      atp = Math.min(18, atp + 3.6 * dt);
      nadph = Math.min(12, nadph + 2.4 * dt);
    }
    const rate = co2 ? Math.min(0.3, atp / 9, nadph / 6) : 0;
    atp -= 9 * rate * dt;
    nadph -= 6 * rate * dt;
    triose += rate * dt;
  }
  return { atp, nadph, triose, co2Fixed: triose * 3, light: time < lightOffAt };
}
/** Available-CO₂ supply is a teaching input: this short model omits dissolved
 * and respiratory CO₂ stores. Setting it to zero is not a claim that a real
 * leaf's oxygen release instantly vanishes when external CO₂ is removed. */
export function leafDiscs(time: number, intensity: number, infiltrated = true, co2 = 1) {
  const gross =
      ((between(intensity, 0, 10) / (between(intensity, 0, 10) + 0.35)) * between(co2, 0, 10)) /
      (between(co2, 0, 10) + 0.3),
    respiration = 0.12,
    net = gross - respiration,
    gas = Math.max(0, (infiltrated ? 0 : 1) + net * between(time, 0, 100) * 0.18),
    discs = Array.from({ length: 10 }, (_, id) => ({
      id,
      gas,
      threshold: 0.45 + id * 0.035,
      rise: clamp((gas - (0.45 + id * 0.035)) * 5),
    }));
  return { gross, respiration, net, discs, floating: discs.filter((d) => d.rise > 0.95).length };
}

/** Jagendorf & Uribe 1966 Table 1, luciferase TOTAL assay, not net yield.
 * Historical mμmol = modern nmol. Both groups entered the same alkaline stage;
 * no illumination. These observations are immutable, not fitted by our motor model. */
export const ACID_BASE_ATP = Object.freeze([
  Object.freeze({ id: 'acid-3.8', acidPH: 3.8, alkalinePH: 8, totalATP: 141 }),
  Object.freeze({ id: 'control-7.0', acidPH: 7, alkalinePH: 8, totalATP: 12 }),
]);

/** Positive available energy for a mole of protons moving lumen→stroma, kJ/mol.
 * voltage = ψ_lumen − ψ_stroma in volts. Activity approximation at given T. */
export function protonEnergy(lumenPH: number, stromaPH: number, voltage = 0, temperature = 298.15) {
  const T = between(temperature, 250, 350);
  return (
    (8.314462618 * T * Math.LN10 * (between(stromaPH, 0, 14) - between(lumenPH, 0, 14)) +
      96485.33212 * between(voltage, -0.3, 0.3)) /
    1000
  );
}

export type GradientOptions = {
  deltaPH?: number;
  leak?: number;
  adp?: boolean;
  phosphate?: boolean;
};
/** A finite, buffered energy reservoir; pedagogical kinetics, NOT the 1966 assay.
 * q=Cμ, U=q²/(2C). q is scaled proton amount, C is a chosen teaching capacitance.
 * A c14 chloroplast rotor couples 14 H+ per turn to 3 catalytic sites. The
 * continuous pool is an ensemble expectation; drawn molecules are selected IDs.
 * ATP synthesis cost 45 kJ/mol is a declared example, not a universal constant.
 * Each step accounts for reservoir loss, chemical work and dissipation. No light
 * switch creates ATP: the initial gradient supplies the work, including in dark.
 */
export function gradientCoupling(time: number, options: GradientOptions = {}) {
  const capacity = 2,
    protonsPerATP = 14 / 3,
    synthesisCost = 45;
  const initialMu = Math.max(0, protonEnergy(7 - between(options.deltaPH ?? 3, 0, 5), 7));
  const initialQ = capacity * initialMu,
    initialEnergy = (initialQ * initialQ) / (2 * capacity);
  const leak = between(options.leak ?? 0, 0, 2),
    stock = 6;
  let q = initialQ,
    atp = 0,
    passed = 0,
    leaked = 0,
    dissipated = 0;
  const end = between(time, 0, 120),
    dt = 0.01;
  for (let t = 0; t < end; t += dt) {
    const h = Math.min(dt, end - t),
      mu = q / capacity;
    const flux =
      options.adp === false || options.phosphate === false
        ? 0
        : Math.min((stock - atp) / h, 0.028 * Math.max(0, protonsPerATP * mu - synthesisCost));
    const productive = Math.min(q, protonsPerATP * flux * h);
    const bypass = Math.min(q - productive, leak * 0.18 * mu * h);
    const before = (q * q) / (2 * capacity);
    q -= productive + bypass;
    const made = productive / protonsPerATP;
    atp += made;
    passed += productive;
    leaked += bypass;
    dissipated += before - (q * q) / (2 * capacity) - synthesisCost * made;
  }
  return {
    atp,
    adp: options.adp === false ? 0 : stock - atp,
    phosphate: options.phosphate === false ? 0 : stock - atp,
    initialQ,
    q,
    passed,
    leaked,
    initialEnergy,
    storedEnergy: (q * q) / (2 * capacity),
    chemicalWork: atp * synthesisCost,
    dissipated,
    mu: q / capacity,
    turns: passed / 14,
    protonsPerATP,
    synthesisCost,
  };
}

/** Unrolled explanatory cutaway of separated entry/exit half-channels.
 * The selected H stays bound to a rotor site for almost a full rotation.
 * Other proton/site events are omitted; one tracked H does NOT mean one ATP. */
export const SYNTHASE_GEOMETRY = {
  cx: 135,
  cy: 120,
  r: 35,
  entry: 'M110 35Q108 63 141.9534 85.6977',
  exit: 'M128.0466 85.6977Q70 110 75 205',
} as const;

/** Selected transport episode, not electron/proton stoichiometry or a Q-cycle
 * mechanism. The electron marker stays on the membrane transport path; light
 * changes its energy state, and coupled transfer supports lumen H+ accumulation.
 */
export function lightGradientEpisode(progress: number) {
  const p = clamp(progress),
    excited = phase(p, 0.12, 0.3),
    transfer = phase(p, 0.3, 0.75),
    pump = phase(p, 0.4, 0.88);
  return {
    photon: {
      x: mix(15, 55, phase(p, 0, 0.15)),
      y: mix(15, 110, phase(p, 0, 0.15)),
      opacity: 1 - phase(p, 0.12, 0.2),
    },
    electron: {
      id: 'e-transport',
      x: 55 + 160 * transfer,
      y: 140 - 30 * excited * (1 - transfer),
      excited: excited * (1 - transfer),
    },
    proton: { id: 'H-pumped', x: 172, y: mix(205, 45, pump) },
    pump,
    energyState: excited * (1 - transfer),
  };
}
export function synthaseProton(turns: number, entryProgress = 1) {
  const turn = Math.max(0, finite(turns)),
    entry = clamp(entryProgress),
    theta0 = -Math.PI / 2 + 0.2;
  const end = 1 - 0.4 / (2 * Math.PI),
    theta = theta0 + Math.min(turn, end) * 2 * Math.PI;
  const bound = { x: 135 + 35 * Math.cos(theta), y: 120 + 35 * Math.sin(theta) };
  const bez = (a: number, b: number, c: number, u: number) =>
    (1 - u) ** 2 * a + 2 * (1 - u) * u * b + u * u * c;
  if (entry < 1) {
    const u = smooth(entry);
    return {
      id: 'H-tracked',
      x: bez(110, 108, bound.x, u),
      y: bez(35, 63, bound.y, u),
      phase: 'entry' as const,
    };
  }
  if (turn <= end) return { id: 'H-tracked', ...bound, phase: 'bound' as const };
  const u = smooth((turn - end) / 0.1);
  return {
    id: 'H-tracked',
    x: bez(bound.x, 70, 75, u),
    y: bez(bound.y, 110, 205, u),
    phase: 'exit' as const,
  };
}

/** Selected qualitative features from Calvin 1961, Figs 5 (30s) and 6 (5s).
 * The sheets are separate quenched samples. Presence is recorded, sizes and
 * positions below are approximate manual readings of the published diagram
 * (about ±0.05 of sheet width/height), not measured migration coordinates.
 * The selected labeled compounds are a subset; dot counts and drawn sizes
 * do NOT imply total product counts, intensity or abundance. */
const calvinSpots = (points: readonly (readonly [string, number, number])[]) =>
  Object.freeze(points.map(([name, x, y]) => Object.freeze({ name, x, y })));
export const CALVIN_RECORDS = Object.freeze([
  Object.freeze({
    id: 'sample-5s',
    exposureSeconds: 5,
    figure: 6,
    pga: true,
    triose: true,
    sugarPhosphates: true,
    spots: calvinSpots([
      ['PGA', 0.81, 0.73],
      ['triose', 0.57, 0.76],
      ['sugar-P', 0.76, 0.81],
      ['sugar-PP', 0.91, 0.88],
      ['PEPA', 0.79, 0.64],
      ['malate', 0.65, 0.43],
      ['alanine', 0.05, 0.51],
    ]),
  }),
  Object.freeze({
    id: 'sample-30s',
    exposureSeconds: 30,
    figure: 5,
    pga: true,
    triose: true,
    sugarPhosphates: true,
    spots: calvinSpots([
      ['PGA', 0.79, 0.73],
      ['triose', 0.54, 0.74],
      ['sugar-P', 0.74, 0.81],
      ['sugar-PP', 0.92, 0.89],
      ['PEPA', 0.77, 0.63],
      ['malate', 0.6, 0.38],
      ['alanine', 0.04, 0.49],
      ['glycine', 0.2, 0.54],
      ['serine', 0.3, 0.55],
      ['aspartate', 0.6, 0.55],
      ['glutamate', 0.42, 0.48],
      ['citrate', 0.72, 0.44],
      ['sucrose', 0.22, 0.65],
      ['UDPG', 0.75, 0.92],
    ]),
  }),
]);
/** Carbon-only net map, not the full O/H mechanism. Modern mapping independently
 * checked against Fig3A and text of Plant Physiology (2025), kiaf020.
 * PGA A: CO2→C1, RuBP C2→C2, C1→C3. PGA B: RuBP C3/C4/C5→C1/C2/C3.
 * Incoming 14C is a tracer identity; isotope does not set the reaction rate. */
export function carbonFixation(progress: number) {
  const p = clamp(progress),
    join = phase(p, 0.08, 0.38),
    split = phase(p, 0.55, 0.94);
  const start = [
    { id: 'co2-C', x: 45, y: 60 },
    { id: 'RuBP-C1', x: 75, y: 150 },
    { id: 'RuBP-C2', x: 125, y: 150 },
    { id: 'RuBP-C3', x: 175, y: 150 },
    { id: 'RuBP-C4', x: 225, y: 150 },
    { id: 'RuBP-C5', x: 275, y: 150 },
  ];
  const dest = [
    { x: 55, y: 88 },
    { x: 155, y: 88 },
    { x: 105, y: 88 },
    { x: 175, y: 188 },
    { x: 225, y: 188 },
    { x: 275, y: 188 },
  ];
  const nodes = start.map((s, i) => {
    const joined = i === 0 ? { x: 125, y: 95 } : s;
    return {
      ...s,
      x: mix(mix(s.x, joined.x, join), dest[i].x, split),
      y: mix(mix(s.y, joined.y, join), dest[i].y, split),
      labeled: i === 0,
      product: i === 0 || i === 1 || i === 2 ? 'PGA-A' : 'PGA-B',
      productPosition: [1, 3, 2, 1, 2, 3][i],
    };
  });
  // Rotate the C1–C2 fragment around C2; a straight interpolation would
  // make the two persistent atoms cross through one another.
  nodes[1].x = nodes[2].x + 50 * Math.cos(Math.PI * (1 - split));
  nodes[1].y = nodes[2].y + 50 * Math.sin(Math.PI * (1 - split));
  const edges = [
    { a: 'RuBP-C1', b: 'RuBP-C2', opacity: 1 },
    { a: 'RuBP-C2', b: 'RuBP-C3', opacity: 1 - split },
    { a: 'RuBP-C3', b: 'RuBP-C4', opacity: 1 },
    { a: 'RuBP-C4', b: 'RuBP-C5', opacity: 1 },
    { a: 'co2-C', b: 'RuBP-C2', opacity: join },
  ];
  return { nodes, edges, joined: join, split };
}

/** Closed carrier path, including the turns at both reaction compartments.
 * Progress is accumulated productive carbon-reaction turnover, so depletion
 * slows this route instead of resetting an identity when a clock wraps. */
export function carrierPosition(turns: number, id: number) {
  const q = (((Math.max(0, finite(turns)) + id * 0.5) % 1) + 1) % 1;
  const bez = (a: number, b: number, c: number, u: number) =>
    (1 - u) ** 2 * a + 2 * (1 - u) * u * b + u * u * c;
  if (q < 0.4) {
    const u = q / 0.4;
    return { id, x: 90 + 115 * u, y: bez(92, 7, 92, u), loaded: true };
  }
  if (q < 0.5) {
    const a = -Math.PI / 2 + ((q - 0.4) / 0.1) * Math.PI;
    return { id, x: 205 + 20 * Math.cos(a), y: 117 + 25 * Math.sin(a), loaded: q < 0.45 };
  }
  if (q < 0.9) {
    const u = (q - 0.5) / 0.4;
    return { id, x: 205 - 115 * u, y: bez(142, 218, 142, u), loaded: false };
  }
  const a = Math.PI / 2 + ((q - 0.9) / 0.1) * Math.PI;
  return { id, x: 90 + 20 * Math.cos(a), y: 117 + 25 * Math.sin(a), loaded: q > 0.95 };
}

export const PHOTO_CHAPTERS = [
  'local',
  'spectrum',
  'hill',
  'isotope',
  'atp',
  'coupling',
  'carbon',
  'prepare',
  'discs',
] as const;
export type PhotoMode = (typeof PHOTO_CHAPTERS)[number];
export const PHOTO_PLANNED_SECONDS = [24, 23, 26, 25, 45, 28, 39, 23, 27] as const;
/** Measured 285.5 s film. Anchors include the 0.45 s cue lead-in. These
 * presentation seconds are not historical exposure or chemical reaction times.
 * Locale-specific words select the shot; the scientific state functions remain
 * shared. Fresh counterexamples are new model preparations, never a subtraction
 * from oxygen already collected in a historical sample. */
export const PHOTO_MEASURED_SECONDS = [29.5, 26.5, 31, 25, 50.5, 28, 39, 27.5, 28.5] as const;
function keyedTime(t: number, points: readonly (readonly [number, number])[]) {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i][0]) {
      const [a, av] = points[i - 1],
        [b, bv] = points[i];
      return mix(av, bv, phase(t, a, b));
    }
  }
  return points[points.length - 1][1];
}
export function photoDirector(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.round(between(chapter, 0, 8)),
    t = between(time, 0, 90),
    en = locale === 'en',
    recordAt = en ? 5.85 : 7.33,
    chargeAt = en ? 15.57 : 15.77,
    motorAt = en ? 25.49 : 23.89,
    leakAt = en ? 42.41 : 38.39,
    offAt = en ? 12.65 : 11.6,
    identityAt = en ? 12.75 : 13.05,
    mapAt = en ? 21.91 : 22.35,
    predictionAt = en ? 33.45 : 33.43,
    noCO2At = en ? 15.19 : 15.43,
    trappedAirAt = en ? 17.13 : 17.21,
    progressEnds = en
      ? [12, 11, 9.5, 9.8, 40, 20, 30, 15, 12]
      : [13, 12, 9.5, 12.4, 37, 20, 30, 15, 12];
  return {
    mode: PHOTO_CHAPTERS[c],
    time: t,
    locale,
    progress: phase(t, c === 0 ? 4 : c === 3 ? (en ? 6.71 : 7.03) : 3, progressEnds[c]),
    expansion: phase(t, en ? 17.11 : 17.95, en ? 21.4 : 21.71),
    hillAcceptor: t < (en ? 20.85 : 20.59),
    atpShot:
      t < recordAt
        ? 'observation'
        : t < chargeAt
          ? 'record'
          : t < motorAt
            ? 'charge'
            : t < leakAt
              ? 'motor'
              : 'leak',
    chargeProgress: keyedTime(
      t,
      en
        ? [
            [chargeAt, 0],
            [17, 0.12],
            [19.39, 0.3],
            [20.8, 0.4],
            [motorAt, 1],
          ]
        : [
            [chargeAt, 0],
            [17.2, 0.12],
            [18.97, 0.3],
            [20.1, 0.4],
            [motorAt, 1],
          ],
    ),
    motorTime: keyedTime(
      t,
      en
        ? [
            [motorAt, 0],
            [28.3, 1],
            [30.7, 8],
            [32, 14],
            [40, 24],
          ]
        : [
            [motorAt, 0],
            [26.3, 1],
            [28.9, 8],
            [30.3, 14],
            [37.5, 24],
          ],
    ),
    leakTime: keyedTime(t, [
      [leakAt, 0],
      [leakAt + 2, 6],
      [en ? 49 : 44.2, 18],
    ]),
    carbonShot:
      t < identityAt ? 'records' : t < mapAt ? 'identity' : t < predictionAt ? 'map' : 'prediction',
    carbonProgress: keyedTime(
      t,
      en
        ? [
            [mapAt, 0],
            [23.71, 0.08],
            [26.5, 0.55],
            [28.3, 0.94],
            [29.5, 1],
          ]
        : [
            [mapAt, 0],
            [24, 0.08],
            [26.45, 0.55],
            [28.05, 0.94],
            [29, 1],
          ],
    ),
    prepPressure: phase(t, en ? 7.27 : 6.79, 10.2) * (1 - phase(t, 10.7, 13.2)),
    prepWater: phase(t, 10.7, en ? 14.77 : 13.65),
    coupleTime: keyedTime(t, [
      [1, 0],
      [offAt, 7],
      [offAt + 3, 10],
      [offAt + 6.8, 18],
    ]),
    discCase: t < noCO2At ? 'baseline' : t < trappedAirAt ? 'no-co2' : 'trapped-air',
    discTime: t < noCO2At ? phase(t, 3, 12) * 15 : t < trappedAirAt ? 15 : 0,
  };
}
