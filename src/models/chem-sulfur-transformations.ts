const clamp = (x: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, Number.isFinite(x) ? x : 0));
/** Amounts use arbitrary common molar units, not laboratory quantities. */
export function copperSulfuric(extent: number, contact = true, heated = true, concentrated = true) {
  const x = contact && heated && concentrated ? clamp(extent) : 0;
  return {
    extent: x,
    copper: 1 - x,
    acid: 2 - 2 * x,
    copperSulfate: x,
    sulfurDioxide: x,
    water: 2 * x,
    electrons: 2 * x,
    sulfurInAcid: 2 - 2 * x,
    sulfurInSalt: x,
    sulfurInGas: x,
  };
}
export function sulfurComproportionation(extent: number) {
  const x = clamp(extent);
  return { sulfide: 2 * (1 - x), sulfurIV: 1 - x, sulfur: 3 * x, donated: 4 * x, accepted: 4 * x };
}
/** Two admissible redox balances; endpoint selection is a teaching hypothesis, not a kinetic prediction. */
export function sulfidePermanganate(endpoint: 'sulfur' | 'sulfate', extent: number) {
  const x = clamp(extent),
    electronPerS = endpoint === 'sulfur' ? 2 : 8,
    permanganatePerS = electronPerS / 5;
  return {
    endpoint,
    extent: x,
    sulfide: 1 - x,
    sulfur: endpoint === 'sulfur' ? x : 0,
    sulfate: endpoint === 'sulfate' ? x : 0,
    permanganateInitial: permanganatePerS,
    permanganateRemaining: permanganatePerS * (1 - x),
    manganeseII: permanganatePerS * x,
    donated: electronPerS * x,
    accepted: 5 * permanganatePerS * x,
  };
}
export type SulfurHeatFrame = { time: number; temperature: number[]; reacted: number[] };
/** Dimensionless reaction-diffusion teaching model: one local ignition pulse, diffusion,
 * threshold reaction, exothermic feedback and heat loss. No measured Fe/S rate fit. */
export function simulateIronSulfur({ ironRatio = 1.15, ignition = true, heatRelease = 1.4 } = {}) {
  const n = 36,
    dt = 0.01,
    availability = clamp(ironRatio, 0, 1),
    release = Math.max(0, Math.min(2, Number.isFinite(heatRelease) ? heatRelease : 1.4)),
    frames: SulfurHeatFrame[] = [];
  let temperature = Array(n).fill(0) as number[],
    reacted = Array(n).fill(0) as number[];
  for (let step = 0; step <= 2000; step++) {
    const t = step * dt;
    if (step % 10 === 0)
      frames.push({ time: t, temperature: [...temperature], reacted: [...reacted] });
    const next = temperature.map((v, i) => {
      const dr =
        v > 0.5 ? Math.min(availability - reacted[i], 5 * (availability - reacted[i]) * dt) : 0;
      const diffusion = 4 * ((temperature[i - 1] ?? v) + (temperature[i + 1] ?? v) - 2 * v);
      reacted[i] += Math.max(0, dr);
      return Math.max(0, v + (diffusion - 0.15 * v) * dt + release * Math.max(0, dr));
    });
    if (ignition && t < 0.7) {
      next[0] = Math.max(1.2, next[0]);
      next[1] = Math.max(1.2, next[1]);
    }
    temperature = next;
  }
  return frames;
}
export function heatFrameAt(frames: SulfurHeatFrame[], time: number) {
  if (frames.length < 2)
    return {
      time: 0,
      temperature: Array(36).fill(0) as number[],
      reacted: Array(36).fill(0) as number[],
    };
  const t = clamp(time, 0, Math.min(20, frames[frames.length - 1].time)),
    index = Math.min(frames.length - 2, Math.floor(t * 10)),
    p = t * 10 - index,
    a = frames[index],
    b = frames[index + 1];
  return {
    time: t,
    temperature: a.temperature.map((v, i) => v + (b.temperature[i] - v) * p),
    reacted: a.reacted.map((v, i) => v + (b.reacted[i] - v) * p),
  };
}
export function ironSulfurInventory(ironRatio: number, meanReacted: number) {
  const iron = clamp(ironRatio, 0, 2),
    x = clamp(meanReacted, 0, Math.min(iron, 1));
  return { iron: iron - x, sulfur: 1 - x, ironSulfide: x, electrons: 2 * x };
}
export function sulfurTransformDirector(chapter: number, progress: number, practical = false) {
  const c = Math.max(0, Math.min(8, chapter)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    view:
      c === 0 || c === 8
        ? 'map'
        : c === 1 || c === 2
          ? 'sulfide'
          : c === 5
            ? 'copper-solution'
            : c === 6 || c === 7
              ? 'iron'
              : 'copper',
    sulfideRoute: c === 2 ? 'permanganate' : 'sulfurIV',
    extent: Math.min(1, p / 0.8),
    lift: c === 4 && !practical ? Math.min(1, p / 0.55) : 0,
    heated: c === 3,
    practical,
    time: c === 6 ? p * 1.1 : c === 7 ? 1.1 + p * 18.9 : 0,
  };
}

export const SULFUR_IDS = [
  'sulfur-state-map',
  'sulfide-sulfurIV',
  'sulfide-permanganate',
  'copper-gas-evidence',
  'stop-and-cool',
  'copper-solution-evidence',
  'iron-sulfur-ignition',
  'iron-sulfur-front',
  'evidence-and-boundaries',
] as const;
export const SULFUR_FILM_SECONDS = [26, 29, 32, 28, 23.5, 38, 25, 28, 33] as const;
/** Legacy export: values now match the measured 262.5-second film windows. */
export const SULFUR_PLANNED_SECONDS = SULFUR_FILM_SECONDS;
const smooth = (q: number) => {
  const p = clamp(q);
  return p * p * (3 - 2 * p);
};
const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const finiteAmount = (x: number, fallback = 0) => clamp(Number.isFinite(x) ? x : fallback, 0, 10);
export type SulfurRoute = 'comproportionation' | 'copper' | 'iron';
export type SulfurPoint = { x: number; y: number };
/** Formal two-electron packets. Transit is a visual accounting interval, not solvated electrons,
 * Cu(I), free S6+, reaction intermediates or a measured travel time. */
export function sulfurElectronLedger(route: SulfurRoute, progress: number, width = 272) {
  const p = clamp(progress),
    w = clamp(width, 256, 720),
    start = route === 'comproportionation' ? [-2, -2, 4] : route === 'copper' ? [0, 6] : [0, 0],
    ends = route === 'comproportionation' ? [0, 0, 0] : route === 'copper' ? [2, 4] : [2, -2],
    ids =
      route === 'comproportionation'
        ? ['s-low-a', 's-low-b', 's-high']
        : route === 'copper'
          ? ['cu', 's-gas']
          : ['fe', 's-iron'],
    symbols =
      route === 'comproportionation'
        ? ['S', 'S', 'S']
        : route === 'copper'
          ? ['Cu', 'S']
          : ['Fe', 'S'],
    points =
      route === 'comproportionation'
        ? [
            { x: w * 0.24, y: 50 },
            { x: w * 0.24, y: 150 },
            { x: w * 0.76, y: 100 },
          ]
        : [
            { x: w * 0.24, y: 100 },
            { x: w * 0.76, y: 100 },
          ],
    donors = route === 'comproportionation' ? [0, 1] : [0],
    receiver = start.length - 1;
  const packets = donors.map((donor, i) => {
    const depart = 0.2 + i * 0.12,
      phase = p <= depart ? 'bound' : p >= 0.8 ? 'accepted' : 'transit',
      q = smooth((p - depart) / (0.8 - depart)),
      a = points[donor],
      b = points[receiver];
    return {
      id: `${route}-2e-${i}`,
      donor: ids[donor],
      receiver: ids[receiver],
      electrons: 2 as const,
      phase,
      x: lerp(a.x + 24, b.x - 24, q),
      y: lerp(a.y, b.y, q) - 20 * Math.sin(Math.PI * q),
    };
  });
  const departed = packets.filter((x) => x.phase !== 'bound').length * 2,
    accepted = packets.filter((x) => x.phase === 'accepted').length * 2,
    inTransit = departed - accepted;
  const centers = ids.map((id, i) => ({
    id,
    symbol: symbols[i],
    ...points[i],
    start: start[i],
    end: ends[i],
    oxidation:
      i === receiver
        ? start[i] - accepted
        : start[i] + (packets.find((x) => x.donor === id)?.phase !== 'bound' ? 2 : 0),
  }));
  return {
    route,
    progress: p,
    centers,
    packets,
    departed,
    accepted,
    inTransit,
    oxidationSum: centers.reduce((a, c) => a + c.oxidation, 0),
    totalWithTransit: centers.reduce((a, c) => a + c.oxidation, 0) - inTransit,
  };
}
/** Selected acid/net endpoint. H2S is the acid-form bookkeeping starting species,
 * not a claim about the entire Na2S solution. Protons are in excess. */
export function permanganateBudget(
  endpoint: 'sulfur' | 'sulfate',
  sulfide = 5,
  permanganate = 2,
  progress = 1,
) {
  const s0 = finiteAmount(sulfide),
    mn0 = finiteAmount(permanganate),
    e = endpoint === 'sulfur' ? 2 : 8,
    max = Math.min(s0, (mn0 * 5) / e),
    x = max * clamp(progress),
    mn = (x * e) / 5;
  return {
    endpoint,
    sulfideInitial: s0,
    permanganateInitial: mn0,
    maxConverted: max,
    sulfideRemaining: s0 - x,
    sulfur: endpoint === 'sulfur' ? x : 0,
    sulfate: endpoint === 'sulfate' ? x : 0,
    permanganateRemaining: mn0 - mn,
    manganeseII: mn,
    electrons: x * e,
    protonsConsumed: x * (endpoint === 'sulfur' ? 6 / 5 : 14 / 5),
    water: x * (endpoint === 'sulfur' ? 8 / 5 : 12 / 5),
    electronPerS: e,
    conversion: x,
  };
}
/** This is a limiting-reagent endpoint calculation, not a concentration/rate law. */
export function copperSulfurInventory(copper = 1, acid = 2, progress = 1, stopAt = 1) {
  const cu0 = finiteAmount(copper),
    a0 = finiteAmount(acid),
    p = Math.min(clamp(progress), clamp(stopAt)),
    x = Math.min(cu0, a0 / 2) * p;
  return {
    copperInitial: cu0,
    acidInitial: a0,
    extent: x,
    copper: cu0 - x,
    acid: a0 - 2 * x,
    copperSulfate: x,
    sulfurDioxide: x,
    water: 2 * x,
    electrons: 2 * x,
    sulfurInAcid: a0 - 2 * x,
    sulfurInSalt: x,
    sulfurInGas: x,
  };
}
export type SulfurAtom = SulfurPoint & {
  id: string;
  element: 'Cu' | 'S' | 'O' | 'H';
  oxidation: number;
  origin: string;
  destination: string;
  phase: 'initial' | 'transfer' | 'final';
};
/** One admissible atom allocation of Cu+2H2SO4→CuSO4+SO2+2H2O.
 * Groups are composition inventories, not molecular structures or isotope-resolved mechanisms. */
export function copperNetAtoms(progress: number, width = 272) {
  const p = clamp(progress),
    w = clamp(width, 256, 720),
    q = smooth((p - 0.15) / 0.7),
    ax = w * 0.25,
    bx = w * 0.75,
    initialA = { x: ax, y: 79 },
    initialB = { x: bx, y: 79 },
    finalA = { x: ax, y: 79 },
    finalB = { x: bx, y: 52 },
    waterY = 183;
  const atoms: SulfurAtom[] = [];
  const add = (
    id: string,
    element: SulfurAtom['element'],
    a: SulfurPoint,
    b: SulfurPoint,
    origin: string,
    destination: string,
    oxidation: number,
  ) =>
    atoms.push({
      id,
      element,
      x: lerp(a.x, b.x, q),
      y: lerp(a.y, b.y, q) + 16 * Math.sin(Math.PI * q),
      origin,
      destination,
      oxidation,
      phase: q === 0 ? 'initial' : q === 1 ? 'final' : 'transfer',
    });
  const credits = sulfurElectronLedger('copper', p, w);
  add(
    'cu',
    'Cu',
    { x: w / 2, y: 183 },
    { x: ax, y: 137 },
    'metal',
    'CuSO4',
    credits.centers[0].oxidation,
  );
  add('s-salt', 'S', initialA, finalA, 'acid-a', 'CuSO4', 6);
  add('s-gas', 'S', initialB, finalB, 'acid-b', 'SO2', credits.centers[1].oxidation);
  const offsets = [
    { x: 0, y: -27 },
    { x: 27, y: 0 },
    { x: 0, y: 27 },
    { x: -27, y: 0 },
  ];
  offsets.forEach((o, i) => {
    add(
      `oa-${i}`,
      'O',
      { x: ax + o.x, y: 79 + o.y },
      { x: ax + o.x, y: 79 + o.y },
      'acid-a',
      'CuSO4',
      -2,
    );
    const end =
      i < 2 ? { x: bx + (i === 0 ? -25 : 25), y: 81 } : { x: bx + (i === 2 ? -33 : 33), y: waterY };
    add(
      `ob-${i}`,
      'O',
      { x: bx + o.x, y: 79 + o.y },
      end,
      'acid-b',
      i < 2 ? 'SO2' : `water-${i - 2}`,
      -2,
    );
  });
  for (let i = 0; i < 4; i++) {
    const center = i < 2 ? ax : bx,
      j = i % 2;
    add(
      `h-${i}`,
      'H',
      { x: center + (j === 0 ? -37 : 37), y: 119 },
      { x: bx + (i < 2 ? -33 : 33) + (j === 0 ? -19 : 19), y: waterY + 20 },
      i < 2 ? 'acid-a' : 'acid-b',
      `water-${i < 2 ? 0 : 1}`,
      1,
    );
  }
  return {
    atoms,
    progress: p,
    credits,
    totals: { Cu: 1, S: 2, O: 8, H: 4 },
    sumOxidation: atoms.reduce((a, b) => a + b.oxidation, 0),
    transitElectrons: credits.inTransit,
  };
}
/** Source masses can be compared without making black appearance a purity assay. */
export function ironSulfurMass(ironG = 1, sulfurG = 0.5) {
  const iron = finiteAmount(ironG),
    sulfur = finiteAmount(sulfurG),
    feM = 55.845,
    sM = 32.06,
    fe = iron / feM,
    s = sulfur / sM,
    x = Math.min(fe, s);
  return {
    ironG: iron,
    sulfurG: sulfur,
    ironMol: fe,
    sulfurMol: s,
    reactedMol: x,
    ironSulfideG: x * (feM + sM),
    ironLeftG: iron - x * feM,
    sulfurLeftG: sulfur - x * sM,
    ratio: s > 0 ? fe / s : null,
    totalG: iron + sulfur,
  };
}
/** Chapter-relative presentation cuts from the final bilingual voiced segments.
 * Includes the measured 0.45 s chapter lead. These are not reaction kinetics. */
export const SULFUR_MEASURED_CUTS = {
  zh: {
    map: 11.5,
    evidenceEnd: 4.2,
    electronStart: 6.7,
    electronEnd: 13.1,
    mnStart: 6.8,
    mnFillStart: 8.8,
    mnFillEnd: 11.6,
    budgetQuestion: 12.1,
    firstAnswer: 19.1,
    secondAnswer: 23.2,
    copperElectrons: 17.0,
    copperElectronStart: 17.4,
    copperElectronEnd: 23.0,
    liftStart: 5.8,
    liftEnd: 10.3,
    netStart: 5.5,
    atomStart: 7.5,
    atomEnd: 17.1,
    copperQuestion: 17.5,
    copperAnswer: 23.7,
    contact: 3.65,
    localGlow: 9.2,
    removal: 17.2,
    removed: 18.7,
    ironElectrons: 12.3,
    ironElectronStart: 12.3,
    ironElectronEnd: 16.8,
    massAnswer: 10.7,
    air: 17.8,
  },
  en: {
    map: 11.8,
    evidenceEnd: 5.1,
    electronStart: 8.2,
    electronEnd: 15.1,
    mnStart: 5.6,
    mnFillStart: 8.1,
    mnFillEnd: 11.3,
    budgetQuestion: 11.65,
    firstAnswer: 19.5,
    secondAnswer: 24.0,
    copperElectrons: 18.7,
    copperElectronStart: 18.7,
    copperElectronEnd: 23.0,
    liftStart: 4.75,
    liftEnd: 8.0,
    netStart: 6.75,
    atomStart: 9.3,
    atomEnd: 19.05,
    copperQuestion: 19.3,
    copperAnswer: 25.9,
    contact: 4.15,
    localGlow: 9.9,
    removal: 16.25,
    removed: 17.8,
    ironElectrons: 12.4,
    ironElectronStart: 12.4,
    ironElectronEnd: 18.1,
    massAnswer: 10.0,
    air: 21.05,
  },
} as const;
export function sulfurFilmState(
  chapter: number,
  progress: number,
  chapterTime?: number,
  practical = false,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.round(clamp(chapter, 0, 8)),
    t = Number.isFinite(chapterTime)
      ? clamp(chapterTime!, 0, SULFUR_FILM_SECONDS[c])
      : clamp(progress) * SULFUR_FILM_SECONDS[c],
    cut = SULFUR_MEASURED_CUTS[locale],
    eventBetween = (start: number, end: number) => smooth((t - start) / (end - start));
  let shot = 'observations',
    event = 0,
    reveal = true,
    secondReveal = true,
    extent = 0.7,
    heatTime = 0;
  if (c === 0) {
    shot = t < cut.map ? 'observations' : 'state-map';
    event = eventBetween(cut.map, cut.map + 5);
  }
  if (c === 1) {
    shot = t < cut.evidenceEnd ? 'sulfide-evidence' : 'comproportionation';
    event = eventBetween(cut.electronStart, cut.electronEnd);
  }
  if (c === 2) {
    shot =
      t < cut.mnStart
        ? 'permanganate-evidence'
        : t < cut.budgetQuestion
          ? 'mn-electrons'
          : t < cut.firstAnswer
            ? 'budget-question'
            : 'budget-answer';
    reveal = t >= cut.firstAnswer;
    secondReveal = t >= cut.secondAnswer;
    event = eventBetween(cut.mnFillStart, cut.mnFillEnd);
  }
  if (c === 3) {
    shot = t < cut.copperElectrons ? 'copper-apparatus' : 'copper-electrons';
    event = eventBetween(cut.copperElectronStart, cut.copperElectronEnd);
    extent = 0.7 * eventBetween(1.5, 8.5);
  }
  if (c === 4) {
    shot = 'stop';
    event = eventBetween(cut.liftStart, cut.liftEnd);
  }
  if (c === 5) {
    shot =
      t < cut.netStart
        ? 'blue-evidence'
        : t < cut.copperQuestion
          ? 'copper-net'
          : t < cut.copperAnswer
            ? 'copper-question'
            : 'copper-answer';
    event = eventBetween(cut.atomStart, cut.atomEnd);
    reveal = t >= cut.copperAnswer;
  }
  if (c === 6) {
    shot = 'ignition';
    heatTime =
      t < cut.localGlow
        ? 0.4 * eventBetween(cut.contact, cut.localGlow)
        : t < cut.removal
          ? 0.4 + 0.25 * eventBetween(cut.localGlow, cut.removal)
          : 0.65 + 0.45 * eventBetween(cut.removal, cut.removed);
  }
  if (c === 7) {
    shot = t < cut.ironElectrons ? 'heat-front' : 'iron-electrons';
    heatTime = 1.1 + 18.9 * eventBetween(0, cut.ironElectrons);
    event = eventBetween(cut.ironElectronStart, cut.ironElectronEnd);
  }
  if (c === 8) {
    shot = t < cut.massAnswer ? 'purity-question' : t < cut.air ? 'mass-answer' : 'air-boundary';
    reveal = t >= cut.massAnswer;
    event = eventBetween(cut.massAnswer, cut.massAnswer + 5);
  }
  return {
    chapter: c,
    time: t,
    shot,
    event,
    reveal,
    secondReveal,
    extent,
    heatTime,
    practical,
    lift: c === 4 && !practical ? event : 0,
    heated: c === 3,
  };
}
