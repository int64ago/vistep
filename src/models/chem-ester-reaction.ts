/** Illustrative, dimensionless reaction/transport accounts; no experimental rate or yield claim. */
const limit = (n: number, max = 1) => (Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0);
export function esterPreparation(progress: number, heated = true, catalyst = true, collect = true) {
  let acid = 1,
    alcohol = 1,
    ester = 0,
    water = 0.2,
    extent = 0;
  const receiver = { acid: 0, alcohol: 0, ester: 0, water: 0 };
  const steps = Math.round(limit(progress) * 1600),
    dt = 0.005,
    rate = (heated ? 1 : 0.12) * (catalyst ? 1 : 0.18);
  for (let i = 0; i < steps; i++) {
    const delta = Math.max(
      -Math.min(ester, water),
      Math.min(acid, alcohol, (0.7 * acid * alcohol - 0.175 * ester * water) * rate * dt),
    );
    acid -= delta;
    alcohol -= delta;
    ester += delta;
    water += delta;
    extent += delta;
    if (collect) {
      const k = heated ? 1 : 0.02;
      const a = 0.01 * acid * k * dt,
        e = 0.03 * alcohol * k * dt,
        p = 0.25 * ester * k * dt,
        w = 0.03 * water * k * dt;
      acid -= a;
      alcohol -= e;
      ester -= p;
      water -= w;
      receiver.acid += a;
      receiver.alcohol += e;
      receiver.ester += p;
      receiver.water += w;
    }
  }
  const neutralized = Math.min(receiver.acid, 0.6),
    carbonateUsed = neutralized / 2;
  return {
    acid,
    alcohol,
    ester,
    water,
    extent,
    receiver,
    washed: {
      acid: receiver.acid - neutralized,
      acetate: neutralized,
      carbonate: 0.3 - carbonateUsed,
      carbonDioxide: carbonateUsed,
      water: receiver.water + carbonateUsed,
      alcohol: receiver.alcohol,
      oil: receiver.ester * 0.93,
      dissolvedEster: receiver.ester * 0.07,
    },
    rate,
  };
}
export const UNCATALYSED_ESTER_RATE = 0.18;
export type HydrolysisMedium = 'neutral' | 'acid' | 'base';
export function esterHydrolysis(
  progress: number,
  medium: HydrolysisMedium = 'acid',
  temperature = 75,
  base = 1.2,
) {
  const p = limit(progress),
    temp = 25 + limit(temperature - 25, 55),
    b = limit(base, 3);
  const factor = Math.exp((30000 / 8.314) * (1 / 298.15 - 1 / (temp + 273.15)));
  // The bath and closed comparison use the SAME reversible material balance.
  // Only the observation-time/rate coordinate is rescaled; K_ester remains 4.
  const closedRate = (0.08 / 1.75) * factor * (medium === 'acid' ? 1 : UNCATALYSED_ESTER_RATE);
  let x = medium === 'base' ? 0 : closedEsterHydrolysis(5 * p, closedRate, 10).extent;
  if (medium === 'base') {
    const steps = Math.round(p * 1000),
      dt = 0.005;
    for (let i = 0; i < steps; i++) {
      const rate = 0.24 * (1 - x) * (b - x);
      x = Math.max(0, Math.min(1, b, x + rate * factor * dt));
    }
  }
  return {
    medium,
    temperature: temp,
    extent: x,
    ester: 1 - x,
    alcohol: x,
    acid: medium === 'base' ? 0 : x,
    acetate: medium === 'base' ? x : 0,
    hydroxide: medium === 'base' ? b - x : b,
    water: medium === 'base' ? 10 : 10 - x,
    initialBase: b,
    oilLayer: Math.max(0, 1 - x - 0.08) / 0.92,
    temperatureFactor: factor,
  };
}
export function ethanolBurn(progress: number, amount = 0.2) {
  const used = limit(progress) * limit(amount, 3);
  return {
    used,
    oxygen: 3 * used,
    water: 3 * used,
    carbonDioxide: 2 * used,
    calciumCarbonate: Math.min(0.3, 2 * used),
  };
}
export function aceticCarbonate(progress: number, acid = 2, carbonate = 1) {
  const a = limit(acid, 10),
    c = limit(carbonate, 10);
  const extent = Math.min(a / 2, c) * limit(progress);
  return {
    extent,
    acid: a - 2 * extent,
    carbonate: c - extent,
    acetate: 2 * extent,
    water: extent,
    carbonDioxide: extent,
  };
}
export function esterDirector(chapter: number, progress: number) {
  const c = Math.floor(limit(chapter, 9)),
    p = limit(progress);
  return {
    chapter: c,
    progress: p,
    preparation: c === 3 ? p * 0.55 : c === 4 ? 0.55 + 0.45 * p : 1,
    hydrolysis: c === 6 ? p : c === 9 ? p : 1,
  };
}

const smooth = (x: number) => {
  const p = limit(x);
  return p * p * (3 - 2 * p);
};

/** Net atom correspondence, NOT a one-collision mechanism or a proton-tracing claim.
 * CH3/C2H5 are intact groups; every oxygen and both shown hydrogens retains its ID.
 * The alcohol 18O endpoint is the textbook isotope evidence. Proton relays and
 * reversible oxygen exchange in real acidic mixtures are outside this diagram. */
export function esterAtomMap(progress: number) {
  const u = limit(progress),
    p = smooth(u / 0.6),
    bend = Math.sin(Math.PI * p);
  const points = [
    { id: 'acid-methyl', label: 'CH₃', atoms: [1, 3, 0], from: [38, 65], to: [36, 65] },
    { id: 'acyl-carbon', label: 'C', atoms: [1, 0, 0], from: [105, 65], to: [101, 65] },
    { id: 'carbonyl-oxygen', label: 'O', atoms: [0, 0, 1], from: [105, 24], to: [101, 24] },
    { id: 'acid-oxygen', label: 'O', atoms: [0, 0, 1], from: [177, 65], to: [155, 160] },
    { id: 'acid-hydrogen', label: 'H', atoms: [0, 1, 0], from: [237, 65], to: [115, 198] },
    { id: 'alcohol-hydrogen', label: 'H', atoms: [0, 1, 0], from: [76, 174], to: [195, 198] },
    { id: 'alcohol-oxygen', label: '¹⁸O', atoms: [0, 0, 1], from: [140, 174], to: [172, 65] },
    { id: 'ethyl-group', label: 'C₂H₅', atoms: [2, 5, 0], from: [238, 174], to: [260, 65] },
  ].map((a) => {
    let x = a.from[0] + (a.to[0] - a.from[0]) * p,
      y = a.from[1] + (a.to[1] - a.from[1]) * p;
    // A net correspondence, not a reaction trajectory: move the connected groups
    // through separate viewing lanes, then bring the remaining H into the water.
    if (a.id === 'acid-oxygen') {
      x += 100 * bend;
      y += 50 * bend;
    }
    if (a.id === 'acid-hydrogen') {
      x += 100 * bend;
      y += 60 * bend;
    }
    if (a.id === 'alcohol-oxygen' || a.id === 'ethyl-group') {
      x -= 65 * bend;
      y += 30 * bend;
    }
    if (a.id === 'alcohol-hydrogen') {
      if (u < 0.1) {
        x = 76 - 46 * smooth(u / 0.1);
        y = 174;
      } else if (u < 0.6) {
        x = 30;
        y = 174;
      } else if (u < 0.72) {
        x = 30;
        y = 174 - 54 * smooth((u - 0.6) / 0.12);
      } else if (u < 0.88) {
        x = 30 + 165 * smooth((u - 0.72) / 0.16);
        y = 120;
      } else {
        x = 195;
        y = 120 + 78 * smooth((u - 0.88) / 0.12);
      }
    }
    return {
      ...a,
      x,
      y,
      product: a.id === 'acid-oxygen' || a.id.endsWith('hydrogen') ? 'water' : 'ester',
    };
  });
  const bond = (id: string, a: string, b: string, order: number, opacity: number) => ({
    id,
    a,
    b,
    order,
    opacity,
  });
  const bonds = [
    bond('methyl-carbonyl', 'acid-methyl', 'acyl-carbon', 1, 1),
    bond('carbonyl', 'acyl-carbon', 'carbonyl-oxygen', 2, 1),
    bond('acid-OH', 'acid-oxygen', 'acid-hydrogen', 1, 1),
    bond('alcohol-CO', 'alcohol-oxygen', 'ethyl-group', 1, 1),
    bond('acid-leaving', 'acyl-carbon', 'acid-oxygen', 1, 1 - smooth(u / 0.2)),
    bond('alcohol-OH', 'alcohol-oxygen', 'alcohol-hydrogen', 1, 1 - smooth(u / 0.2)),
    bond('ester-link', 'acyl-carbon', 'alcohol-oxygen', 1, smooth((u - 0.5) / 0.1)),
    bond('water-new-OH', 'acid-oxygen', 'alcohol-hydrogen', 1, smooth((u - 0.94) / 0.06)),
  ];
  const total = points.reduce((s, a) => s.map((v, i) => v + a.atoms[i]), [0, 0, 0]);
  return {
    progress: limit(progress),
    atoms: points,
    bonds,
    total,
    isotope: 'alcohol-oxygen',
    isotopeDestination: 'ester',
    protonAssignments: 'representative-net-bookkeeping' as const,
  };
}

/** Closed, isothermal, ideal mass-action counterfactual: E+W ⇌ A+L.
 * Chosen illustrative k_h=.175, k_e=.7 => K_ester=4. The multiplier changes BOTH
 * rates, never equilibrium. Exact Riccati solution avoids a false numerical endpoint.
 * Time is a model coordinate, not seconds of the laboratory experiment. */
export function closedEsterHydrolysis(time: number, multiplier = 1, initialWater = 10) {
  const t = limit(time, 80),
    speed = limit(multiplier, 8),
    w = limit(initialWater, 20);
  const a = 0.525,
    b = 0.175 * (1 + w),
    c = 0.175 * w;
  const disc = Math.sqrt(b * b + 4 * a * c);
  const equilibrium = c === 0 ? 0 : (2 * c) / (b + disc);
  const negativeRoot = (-b - disc) / (2 * a);
  const e = Math.exp(-disc * speed * t);
  const extent =
    equilibrium === 0 ? 0 : (equilibrium * (1 - e)) / (1 - (equilibrium / negativeRoot) * e);
  const ester = 1 - extent,
    water = w - extent,
    acid = extent,
    alcohol = extent;
  return {
    time: t,
    multiplier: speed,
    initialWater: w,
    extent,
    equilibrium,
    ester,
    water,
    acid,
    alcohol,
    hydrolysisRate: 0.175 * ester * water * speed,
    esterificationRate: 0.7 * acid * alcohol * speed,
    equilibriumConstantEster: 4,
    catalystInitial: 1,
    catalystFinal: 1,
  };
}

/** Chapter-local seconds from the final c3 voice word timings, including 0.45 s lead-in.
 * The 50 s window is shared; speech and inspection holds remain locale-specific. */
export const ESTER_C3_CUTS = {
  zh: {
    atoms: 6.31,
    question: 9.03,
    result: 13.33,
    follow: 15.17,
    moved: 23.71,
    net: 19.07,
    water: 20.69,
    ester: 23.71,
    limit: 26.25,
    catalyst: 30.45,
    collection: 34.05,
  },
  en: {
    atoms: 5.99,
    question: 9.29,
    result: 13.55,
    follow: 15.09,
    moved: 24.95,
    net: 19.17,
    water: 20.65,
    ester: 24.95,
    limit: 27.47,
    catalyst: 32.35,
    collection: 37.33,
  },
} as const;
export function esterFilmState(chapter: number, progress: number, locale: 'zh' | 'en' = 'zh') {
  const d = esterDirector(chapter, progress),
    p = d.progress,
    seconds = p * 50,
    cuts = ESTER_C3_CUTS[locale];
  const atomBeat =
    seconds >= cuts.collection
      ? 'collection'
      : seconds >= cuts.catalyst
        ? 'catalyst'
        : seconds >= cuts.limit
          ? 'limit'
          : seconds >= cuts.ester
            ? 'ester'
            : seconds >= cuts.water
              ? 'water'
              : seconds >= cuts.net
                ? 'net'
                : seconds >= cuts.follow
                  ? 'bond'
                  : 'result';
  return {
    ...d,
    shot:
      d.chapter === 3
        ? seconds < cuts.atoms
          ? 'apparatus'
          : 'atoms'
        : d.chapter === 7
          ? p < 0.3
            ? 'reverse-atoms'
            : 'closed-comparison'
          : 'retained',
    atomProgress:
      d.chapter === 7
        ? 1 - smooth(p / 0.3)
        : smooth((seconds - cuts.follow) / (cuts.moved - cuts.follow)),
    atomBeat,
    question:
      d.chapter === 3
        ? seconds >= cuts.question && seconds < cuts.result
        : d.chapter === 7 && p >= 0.3 && p < 0.54,
    revealed: d.chapter === 3 ? seconds >= cuts.result : d.chapter === 7 && p >= 0.54,
    closedTime: p < 0.3 ? 0 : p < 0.54 ? 4 : 4 + 12 * smooth((p - 0.54) / 0.46),
  };
}
