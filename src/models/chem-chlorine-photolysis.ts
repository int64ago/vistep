/** Textbook net account, not a kinetic fit or reconstruction of the 150 s experiment. */
const clamp = (value: number, low: number, high: number, fallback = low) =>
  Math.max(low, Math.min(high, Number.isFinite(value) ? value : fallback));
const smooth = (value: number) => {
  const p = clamp(value, 0, 1);
  return p * p * (3 - 2 * p);
};
const during = (time: number, start: number, end: number) => smooth((time - start) / (end - start));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const PHOTOLYSIS_CHAPTERS = [
  'sensors',
  'light-entry',
  'illuminate',
  'stoichiometry',
  'headspace-predict',
] as const;
/** Original chapter windows, now confirmed by both assembled 156 s recordings. */
export const PHOTOLYSIS_PLANNED_SECONDS = [26, 32, 34, 30, 34] as const;
export const TEXTBOOK_PHOTOLYSIS_DIRECTIONS = Object.freeze([
  Object.freeze({ channel: 'pH', phase: 'liquid', direction: -1 }),
  Object.freeze({ channel: 'chloride', phase: 'liquid', direction: 1 }),
  Object.freeze({ channel: 'oxygenFraction', phase: 'headspace', direction: 1 }),
]);

export function chlorinePhotolysis(extent: number, headspaceMl = 500, illuminated = true) {
  const p = illuminated ? clamp(extent, 0, 1) : 0;
  const liquidLitres = 0.1,
    initialHOCl = 0.018,
    initialH = 0.008,
    initialCl = 0.008;
  const decomposed = initialHOCl * liquidLitres * p,
    oxygen = decomposed / 2,
    headspace = clamp(headspaceMl, 50, 1000, 500) / 1000,
    initialGasMoles = headspace / (0.082057366 * 298.15),
    initialOxygen = initialGasMoles * 0.18,
    hydrogen = initialH + decomposed / liquidLitres,
    chloride = initialCl + decomposed / liquidLitres;
  return {
    p,
    headspaceMl: headspace * 1000,
    liquidLitres,
    decomposed,
    oxygen,
    remainingHOCl: initialHOCl * liquidLitres - decomposed,
    hydrogen,
    chloride,
    pH: -Math.log10(hydrogen),
    chlorideMgL: chloride * 35.45 * 1000,
    oxygenPercent: (100 * (initialOxygen + oxygen)) / (initialGasMoles + oxygen),
    chlorineTotal: initialCl * liquidLitres + initialHOCl * liquidLitres,
    initialHOClMoles: initialHOCl * liquidLitres,
    initialGasMoles,
    initialOxygen,
    finalGasMoles: initialGasMoles + oxygen,
  };
}
export function photolysisTrace(extent: number, headspaceMl = 500, illuminated = true) {
  return Array.from({ length: 61 }, (_, i) =>
    chlorinePhotolysis((clamp(extent, 0, 1) * i) / 60, headspaceMl, illuminated),
  );
}
export function photolysisHeadspaces(extent = 1, secondMl = 1000, illuminated = true) {
  return {
    A: chlorinePhotolysis(extent, 500, illuminated),
    B: chlorinePhotolysis(extent, secondMl, illuminated),
  };
}
export type PhotoElement = 'H' | 'O' | 'Cl';
export type PhotoAtom = {
  id: string;
  element: PhotoElement;
  x: number;
  y: number;
  radius: number;
  charge: number;
};
export const PHOTO_ATOM_IDS = [
  'sample-A-H0',
  'sample-A-O0',
  'sample-A-Cl0',
  'sample-A-H1',
  'sample-A-O1',
  'sample-A-Cl1',
] as const;
export type PhotoBond = { a: string; b: string; opacity: number };
const radius = (element: PhotoElement, narrow: boolean) =>
  element === 'H' ? (narrow ? 14 : 18) : element === 'O' ? (narrow ? 17 : 22) : narrow ? 20 : 25;
/** Coordinates describe a slowed selected event, not measured molecular trajectories. */
export function photolysisEvent(time: number, width = 258, absorbed = true) {
  const t = clamp(time, 0, 32),
    w = clamp(width, 250, 760, 258),
    narrow = w < 500,
    cleavage = absorbed ? during(t, 11.5, 17) : 0,
    height = narrow ? 206 : 248,
    y0 = narrow ? 80 : 92,
    y1 = narrow ? 166 : 196,
    positions = [
      [0.16 * w, y0],
      [0.34 * w, y0],
      [mix(0.55 * w, 0.84 * w, cleavage), y0],
      [0.42 * w, y1],
      [0.6 * w, y1],
      [0.81 * w, y1],
    ];
  const atoms: PhotoAtom[] = PHOTO_ATOM_IDS.map((id, i) => {
    const element = (['H', 'O', 'Cl'] as const)[i % 3];
    return {
      id,
      element,
      x: positions[i][0],
      y: positions[i][1],
      radius: radius(element, narrow),
      charge: 0,
    };
  });
  const middle = (atoms[1].x + 0.55 * w) / 2;
  const electrons = [
    {
      id: 'selected-bond-e0',
      x: mix(middle - 4, atoms[1].x + 9, cleavage),
      y: mix(y0, y0 - atoms[1].radius - 10, cleavage),
      owner: cleavage === 1 ? atoms[1].id : 'selected-bond',
    },
    {
      id: 'selected-bond-e1',
      x: mix(middle + 4, atoms[2].x - 9, cleavage),
      y: mix(y0, y0 - atoms[2].radius - 10, cleavage),
      owner: cleavage === 1 ? atoms[2].id : 'selected-bond',
    },
  ];
  const photonProgress = during(t, 4, absorbed ? 8 : 12),
    targetX = absorbed ? middle : w + 25,
    photon = {
      visible: t >= 4 && t < (absorbed ? 8 : 12),
      x: mix(12, targetX, photonProgress),
      y: mix(20, absorbed ? y0 : 120, photonProgress),
      absorbed: absorbed && t >= 8,
      absorptionHalo:
        absorbed && t >= 8 && t < 11.5 ? Math.sin(Math.PI * clamp((t - 8) / 3.5, 0, 1)) : 0,
      targetX: middle,
      targetY: y0,
    };
  const bonds: PhotoBond[] = [
    { a: atoms[0].id, b: atoms[1].id, opacity: 1 },
    { a: atoms[1].id, b: atoms[2].id, opacity: 1 - cleavage },
    { a: atoms[3].id, b: atoms[4].id, opacity: 1 },
    { a: atoms[4].id, b: atoms[5].id, opacity: 1 },
  ];
  return {
    t,
    width: w,
    height,
    atoms,
    electrons,
    bonds,
    cleavage,
    photon,
    radicals: absorbed && t >= 17,
    absorbed,
  };
}

/** Net element allocation after the separately shown initial channel; no intermediate mechanism. */
export function photolysisNet(time: number, width = 258) {
  const t = clamp(time, 0, 34),
    start = photolysisEvent(32, width),
    w = start.width,
    narrow = w < 500,
    allocation = during(t, 8, 16),
    productReady = t >= 16,
    liquidY = narrow ? 76 : 88,
    oxygenRadius = radius('O', narrow),
    oxygenY =
      t < 20
        ? liquidY + 42
        : t <= 26
          ? mix(liquidY + 42, liquidY - oxygenRadius, during(t, 20, 26))
          : mix(liquidY - oxygenRadius, liquidY - 42, during(t, 26, 28)),
    ionY = narrow ? 174 : 211,
    gap = oxygenRadius + 2,
    targets = [
      [w * 0.13, ionY],
      [w / 2 - gap, oxygenY],
      [w * 0.63, ionY],
      [w * 0.35, ionY],
      [w / 2 + gap, oxygenY],
      [w * 0.85, ionY],
    ];
  const atoms: PhotoAtom[] = start.atoms.map((a, i) => ({
    ...a,
    x: mix(a.x, targets[i][0], i === 2 ? during(t, 11.5, 16) : during(t, 8, 12.5)),
    y: mix(a.y, targets[i][1], i === 2 ? during(t, 11.5, 16) : during(t, 8, 12.5)),
    charge: productReady ? (a.element === 'H' ? 1 : a.element === 'Cl' ? -1 : 0) : 0,
  }));
  // Count the representative O2 only after the ENTIRE glyph clears the liquid surface.
  // A tolerance only absorbs floating-point equality at the boundary, not arrival time.
  const oxygenPair = atoms.filter((a) => a.element === 'O'),
    inHeadspace = productReady && oxygenPair.every((a) => a.y + a.radius <= liquidY + 1e-10),
    produced = productReady ? 1 : 0,
    headspace = inHeadspace ? 1 : 0;
  const bonds: PhotoBond[] =
    t < 8
      ? start.bonds.map((b) => ({ ...b, opacity: b.opacity * (1 - during(t, 4, 8)) }))
      : productReady
        ? [{ a: atoms[1].id, b: atoms[4].id, opacity: 1 }]
        : [];
  return {
    t,
    width: w,
    height: narrow ? 194 : start.height,
    atoms,
    bonds,
    electrons: start.electrons,
    showSelectedElectrons: t < 4,
    lens: t < 4 ? 'initial-channel' : 'net-account',
    allocation,
    productReady,
    liquidY,
    showPhase: t >= 16,
    oxygen: {
      produced,
      notHeadspace: produced - headspace,
      headspace,
      unallocatedAtoms: 2 - 2 * produced,
    },
    charge: atoms.reduce((sum, a) => sum + a.charge, 0),
  };
}

/** Chapter-relative seconds read from both actual 156 s recordings (0.45 s lead-in included).
 * The two microscopic clocks retain the original, tested geometry/event order; only the
 * director maps measured spoken events to them. This is not a chemical rate law.
 */
export const PHOTOLYSIS_SPEECH_CUTS = {
  zh: {
    probes: [4.85, 6.0, 8.65, 10.8],
    event: [
      [0, 0],
      [0.45, 4],
      [2.1, 8],
      [7.35, 11.5],
      [10.9, 17],
      [32, 32],
    ],
    net: [
      [0, 0],
      [5.2, 4],
      [9.25, 8],
      [14.9, 16],
      [24.45, 20],
      [27.3, 26],
      [28.6, 28],
      [34, 34],
    ],
    scales: [11.0, 14.35, 16.55],
    prediction: 8.8,
    mixStart: 11.4,
    mixEnd: 16.7,
    gas: 18.55,
    liquid: 21.9,
  },
  en: {
    probes: [5.7, 6.95, 9.4, 12.0],
    event: [
      [0, 0],
      [0.45, 4],
      [2.7, 8],
      [8.8, 11.5],
      [12.1, 17],
      [32, 32],
    ],
    net: [
      [0, 0],
      [4.2, 4],
      [7.6, 8],
      [14.4, 16],
      [23.5, 20],
      [27.2, 26],
      [28.2, 28],
      [34, 34],
    ],
    scales: [11.45, 14.4, 16.55],
    prediction: 8.7,
    mixStart: 11.65,
    mixEnd: 16.7,
    gas: 18.2,
    liquid: 22.1,
  },
} as const;
const directedTime = (time: number, points: readonly (readonly [number, number])[]) => {
  if (time <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    if (time <= b[0]) return mix(a[1], b[1], (time - a[0]) / (b[0] - a[0]));
  }
  return points[points.length - 1][1];
};
export function photolysisFilm(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.round(clamp(chapter, 0, 4)),
    t = clamp(chapterTime, 0, PHOTOLYSIS_PLANNED_SECONDS[c]),
    cuts = PHOTOLYSIS_SPEECH_CUTS[locale],
    eventTime = directedTime(t, cuts.event),
    netTime = directedTime(t, cuts.net),
    probe =
      t < cuts.probes[0]
        ? -1
        : t < cuts.probes[1]
          ? 0
          : t < cuts.probes[2]
            ? 1
            : t < cuts.probes[3]
              ? 2
              : 3,
    shot =
      c === 0
        ? probe < 0
          ? 'vessel-question'
          : ['probe-pH', 'probe-chloride', 'probe-oxygen', 'three-trends'][probe]
        : c === 1
          ? eventTime < 4
            ? 'molecule'
            : eventTime < 8
              ? 'UV-approach'
              : eventTime < 11.5
                ? 'absorbed'
                : eventTime < 17
                  ? 'cleavage'
                  : 'radicals'
          : c === 2
            ? netTime < 4
              ? 'channel-to-net'
              : netTime < 8
                ? 'net-lens'
                : netTime < 16
                  ? 'allocation'
                  : netTime < 20
                    ? 'products'
                    : netTime < 26
                      ? 'oxygen-transit'
                      : netTime < 28
                        ? 'oxygen-arrived'
                        : 'linked-readings'
            : c === 3
              ? t < cuts.scales[0]
                ? 'count-ratio'
                : t < cuts.scales[1]
                  ? 'pH-scale'
                  : t < cuts.scales[2]
                    ? 'chloride-scale'
                    : 'gas-denominator'
              : t < cuts.prediction
                ? 'comparison-premises'
                : t < cuts.mixStart
                  ? 'prediction'
                  : t < cuts.gas
                    ? 'mixing'
                    : t < cuts.liquid
                      ? 'gas-answer'
                      : 'all-answers';
  return {
    chapter: c,
    time: t,
    eventTime,
    netTime,
    shot,
    probe: c === 0 ? probe : 3,
    revealGas: c === 4 && t >= cuts.gas,
    revealLiquid: c === 4 && t >= cuts.liquid,
    comparisonMix: c === 4 ? during(t, cuts.mixStart, cuts.mixEnd) : 1,
    extent: 1,
    headspace: 500,
    light: true,
    ledger: c >= 2,
  };
}
/** Compatibility helper for normalized seek consumers; all shots still share the same director. */
export function photolysisDirector(chapter: number, progress: number) {
  const c = Math.round(clamp(chapter, 0, 4));
  return photolysisFilm(c, clamp(progress, 0, 1) * PHOTOLYSIS_PLANNED_SECONDS[c]);
}
