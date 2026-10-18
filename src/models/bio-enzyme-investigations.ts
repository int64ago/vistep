/** Independent teaching models. Parameters are illustrative, not fits to textbook
 * measurements. Chemical inventories and thermal histories remain explicit. */
export const enzymeChapters = [
  'stomach',
  'peroxide',
  'cell-free',
  'urease',
  'specificity',
  'temperature',
  'ph',
  'recovery',
] as const;
export type EnzymeChapter = (typeof enzymeChapters)[number];
export type PeroxideCondition = 'blank' | 'heated' | 'iron' | 'catalase';
export type Point = { x: number; y: number };
export const unit = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
export const smooth = (v: number) => {
  const p = unit(v);
  return p * p * (3 - 2 * p);
};
export const between = (v: number, a: number, b: number) => smooth((v - a) / (b - a));
const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const R = 8.314462618;
export const T_REFERENCE = 298.15;
export const kelvin = (c: number) => Math.max(1, finite(c, 25) + 273.15);
/** Energy unit is R*Tref. The density is a normalized illustrative Boltzmann
 * state coordinate, NOT a Maxwell molecular-speed distribution. */
export function energyDensity(energy: number, temperature = 25) {
  const theta = kelvin(temperature) / T_REFERENCE;
  return !Number.isFinite(energy) || energy < 0 ? 0 : Math.exp(-energy / theta) / theta;
}
export function barrierProbability(barrier: number, temperature = 25) {
  return Math.exp((-Math.max(0, finite(barrier, 14)) * T_REFERENCE) / kelvin(temperature));
}
export const barrierHeights = { blank: 14, iron: 11.1, catalase: 9.6 } as const;
const ATTEMPT_RATE = 0.007 / Math.exp(-barrierHeights.blank);
export function pathRate(temperature: number, barrier: number) {
  return ATTEMPT_RATE * barrierProbability(barrier, temperature);
}
export function reactionPath(u: number, barrier: number) {
  const x = unit(u);
  // Shared start/end; a smooth interpolation reaches exactly `barrier` at midpoint.
  return x < 0.5 ? barrier * smooth(x * 2) : barrier + (-3 - barrier) * smooth((x - 0.5) * 2);
}
export function peroxideReaction(
  time: number,
  condition: PeroxideCondition,
  amount = 1,
  catalystActive = 1,
) {
  const temperature = condition === 'heated' ? 90 : 25;
  const baseline = pathRate(temperature, barrierHeights.blank);
  const extra =
    condition === 'iron' || condition === 'catalase'
      ? unit(catalystActive) *
        Math.max(0, finite(amount, 1)) *
        pathRate(temperature, barrierHeights[condition])
      : 0;
  const k = baseline + extra;
  const substrate = Math.exp(-k * Math.max(0, finite(time)));
  return {
    substrate,
    water: 1 - substrate,
    oxygen: (1 - substrate) / 2,
    rate: k * substrate,
    oxygenFlux: (k * substrate) / 2,
    k,
    temperature,
    theoreticalOxygen: 0.5,
  };
}
export function thermalTurnover(temperature: number, activationEnergy = 45000) {
  return Math.exp((activationEnergy / R) * (1 / T_REFERENCE - 1 / kelvin(temperature)));
}
/** Chosen persistent-damage scenario: time at temperature matters. No universal
 * irreversible-denaturation or enzyme-optimum claim. Units: hazard per second. */
export function damageRate(temperature: number) {
  return 0.0003 * Math.exp(Math.min(35, (finite(temperature, 25) - 45) / 8));
}
export type Exposure = { temperature: number; seconds: number };
export function foldedFraction(history: readonly Exposure[]) {
  const hazard = history.reduce(
    (s, h) => s + damageRate(h.temperature) * Math.max(0, finite(h.seconds)),
    0,
  );
  return Math.exp(-hazard);
}
export function ionization(ph: number, pKaA = 5, pKaB = 9) {
  const p = Math.max(-10, Math.min(24, finite(ph, 7)));
  const aDeprotonated = 1 / (1 + 10 ** (pKaA - p));
  const bProtonated = 1 / (1 + 10 ** (p - pKaB));
  return {
    aDeprotonated,
    aProtonated: 1 - aDeprotonated,
    bProtonated,
    bDeprotonated: 1 - bProtonated,
    competent: aDeprotonated * bProtonated,
  };
}
export function enzymeAssay(
  seconds: number,
  temperature: number,
  history: readonly Exposure[] = [],
  ph = 7,
) {
  const t = Math.max(0, finite(seconds)),
    f0 = foldedFraction(history),
    kd = damageRate(temperature);
  const charge = ionization(ph).competent;
  const thermal = thermalTurnover(temperature);
  const integratedActive = kd > 1e-14 ? (f0 * -Math.expm1(-kd * t)) / kd : f0 * t;
  const exponent = 0.035 * thermal * charge * integratedActive;
  const remaining = Math.exp(-exponent),
    folded = f0 * Math.exp(-kd * t);
  return {
    remaining,
    converted: 1 - remaining,
    folded,
    foldedAtStart: f0,
    thermal,
    charge,
    rate: 0.035 * thermal * charge * folded * remaining,
  };
}
export function conditionComparison(
  kind: 'temperature' | 'recovery',
  seconds: number,
  pretreatSeconds = 120,
  hotTemperature = 85,
) {
  const temperatures = kind === 'temperature' ? [5, 40, hotTemperature] : [5, 25, hotTemperature];
  return temperatures.map((previous) => ({
    previous,
    assayTemperature: kind === 'recovery' ? 25 : previous,
    ...enzymeAssay(seconds, kind === 'recovery' ? 25 : previous, [
      { temperature: previous, seconds: pretreatSeconds },
    ]),
  }));
}
/** Activity distribution for a generic two-group enzyme, not liver-catalase pKas.
 * Both no-enzyme blanks and catalyst samples use the same chosen background. */
export function phComparison(ph: number, seconds: number) {
  const background = 0.003 * (1 + 0.02 * (finite(ph, 7) - 7) ** 2);
  const competence = ionization(ph).competent;
  const t = Math.max(0, finite(seconds));
  return {
    blank: (1 - Math.exp(-background * t)) / 2,
    enzyme: (1 - Math.exp(-(background + 0.35 * competence) * t)) / 2,
    competence,
    blankFlux: (background * Math.exp(-background * t)) / 2,
    enzymeFlux:
      ((background + 0.35 * competence) * Math.exp(-(background + 0.35 * competence) * t)) / 2,
  };
}
/** Intact peptide trace: the same 29 vertices rearrange; no chain cleavage. */
export function proteinTrace(unfolding: number): Point[] {
  const p = unit(unfolding);
  return Array.from({ length: 29 }, (_, i) => {
    const a = (i / 28) * Math.PI * 5.8;
    const folded = {
      x: 160 + Math.cos(a) * (40 + 10 * Math.sin(i * 0.7)),
      y: 100 + Math.sin(a) * 33,
    };
    const open = { x: 30 + i * 9.3, y: 95 + Math.sin(i * 0.72) * 21 };
    return { x: mix(folded.x, open.x, p), y: mix(folded.y, open.y, p) };
  });
}
export function proteinMember(id: number, fractionFolded: number, cohortSize = 24) {
  const threshold = (id + 0.5) / cohortSize;
  return unit((1 - unit(fractionFolded) - threshold) / (1 / cohortSize) + 0.5);
}
export type Linkage = 'alpha1-4' | 'alpha1-6' | 'alpha1-beta2';
export function productiveBinding(linkage: Linkage, contactDistances: readonly number[]) {
  const contacts = contactDistances.filter((d) => Number.isFinite(d) && d >= 0 && d <= 7).length;
  return {
    contactCount: contacts,
    productive: linkage === 'alpha1-4' && contactDistances.length >= 3 && contacts >= 3,
  };
}
export type SkeletonAtom = Point & { id: string; element: 'C' | 'O' | 'H'; label?: string };
export type SkeletonBond = { a: string; b: string; role?: string; opacity?: number };
export function glucanHydrolysis(progress: number) {
  const p = unit(progress),
    split = between(p, 0.48, 0.95);
  const atoms: SkeletonAtom[] = [],
    bonds: SkeletonBond[] = [];
  for (let ring = 0; ring < 3; ring++) {
    const cx = 58 + ring * 102 + (ring === 0 ? -14 : 14) * split,
      cy = 85;
    const ids = [1, 2, 3, 4, 5, 'O'].map((n) => `g${ring}-${n}`);
    ids.forEach((id, j) =>
      atoms.push({
        id,
        element: j === 5 ? 'O' : 'C',
        label: j === 5 ? 'O' : undefined,
        x: cx + 25 * Math.cos((j * Math.PI) / 3),
        y: cy + 25 * Math.sin((j * Math.PI) / 3),
      }),
    );
    ids.forEach((id, j) => bonds.push({ a: id, b: ids[(j + 1) % 6], role: 'ring' }));
    atoms.push({ id: `g${ring}-6`, element: 'C', x: cx - 22, y: cy - 43 });
    bonds.push({ a: `g${ring}-5`, b: `g${ring}-6` });
  }
  atoms.push({ id: 'bridge', element: 'O', label: 'O', x: 109 + 14 * split, y: 110 });
  atoms.push({ id: 'bridge-2', element: 'O', label: 'O', x: 211 + 14 * split, y: 110 });
  bonds.push(
    { a: 'g0-1', b: 'bridge', role: 'cleavage', opacity: 1 - between(p, 0.35, 0.48) },
    { a: 'bridge', b: 'g1-4' },
    { a: 'g1-1', b: 'bridge-2' },
    { a: 'bridge-2', b: 'g2-4' },
  );
  const oStart = { x: 95, y: 24 },
    h1Start = { x: 79, y: 15 };
  const oEnd = { x: 81 - 14 * split, y: 114 },
    h1End = { x: 109 + 14 * split + 16, y: 128 };
  const travel = between(p, 0.18, 0.72);
  const waterO = { x: mix(oStart.x, oEnd.x, travel), y: mix(oStart.y, oEnd.y, travel) };
  // Keep the retained O—H pair connected. Route the transferred H around it so
  // the displayed atom labels never merge; these are net-change teaching paths.
  const h2Angle = mix(Math.atan2(-9, 16), Math.atan2(18, -15), travel);
  const h2Length = mix(Math.hypot(16, 9), Math.hypot(15, 18), travel);
  const h1 = {
    x: (1 - travel) ** 2 * h1Start.x + 2 * (1 - travel) * travel * 140 + travel ** 2 * h1End.x,
    y: (1 - travel) ** 2 * h1Start.y + 2 * (1 - travel) * travel * -40 + travel ** 2 * h1End.y,
  };
  atoms.push(
    {
      id: 'waterO',
      element: 'O',
      label: 'O',
      x: waterO.x,
      y: waterO.y,
    },
    {
      id: 'waterH1',
      element: 'H',
      label: 'H',
      x: h1.x,
      y: h1.y,
    },
    {
      id: 'waterH2',
      element: 'H',
      label: 'H',
      x: waterO.x + h2Length * Math.cos(h2Angle),
      y: waterO.y + h2Length * Math.sin(h2Angle),
    },
  );
  bonds.push(
    { a: 'waterO', b: 'waterH2' },
    { a: 'waterO', b: 'waterH1', opacity: 1 - between(p, 0.35, 0.48) },
    { a: 'waterO', b: 'g0-1', opacity: between(p, 0.48, 0.72) },
    { a: 'bridge', b: 'waterH1', opacity: between(p, 0.48, 0.72) },
  );
  return {
    atoms,
    bonds,
    cleaved: p >= 0.72,
    waterAtoms: ['waterO', 'waterH1', 'waterH2'],
    linkedFragments: p >= 0.72 ? 2 : 1,
  };
}
export function sucroseSkeleton(): { atoms: SkeletonAtom[]; bonds: SkeletonBond[] } {
  const atoms: SkeletonAtom[] = [],
    bonds: SkeletonBond[] = [];
  for (const [prefix, cx, r, n] of [
    ['g', 95, 32, 6],
    ['f', 229, 32, 5],
  ] as const) {
    const ids = Array.from({ length: n }, (_, i) => `${prefix}${i}`);
    ids.forEach((id, i) =>
      atoms.push({
        id,
        element: i === n - 1 ? 'O' : 'C',
        label: i === n - 1 ? 'O' : undefined,
        x: cx + r * Math.cos((prefix === 'f' ? Math.PI : 0) + (i * Math.PI * 2) / n),
        y: 88 + r * Math.sin((prefix === 'f' ? Math.PI : 0) + (i * Math.PI * 2) / n),
      }),
    );
    ids.forEach((id, i) => bonds.push({ a: id, b: ids[(i + 1) % n], role: 'ring' }));
  }
  atoms.push({ id: 'sucroseO', element: 'O', label: 'O', x: 162, y: 116 });
  bonds.push({ a: 'g0', b: 'sucroseO' }, { a: 'sucroseO', b: 'f0' });
  return { atoms, bonds };
}
export function starchAssay(
  converted: number,
  validEnzyme = true,
  substrate: 'starch' | 'sucrose' = 'starch',
) {
  const c = validEnzyme && substrate === 'starch' ? unit(converted) : 0;
  return {
    converted: c,
    reducingSignal: c,
    longChainSignal: 1 - c,
    conclusion: c > 0.2 ? 'detected' : 'not-detected',
  };
}
export function cellFreeFermentation(time: number, extractActive = true, glucose = true) {
  const consumed = extractActive && glucose ? -Math.expm1(-0.22 * Math.max(0, finite(time))) : 0;
  return { glucose: 1 - consumed, ethanol: 2 * consumed, carbonDioxide: 2 * consumed };
}
export function cagedMeat(progress: number, gastricFluid = true) {
  return {
    fraction: gastricFluid ? Math.exp(-4 * Math.max(0, finite(progress))) : 1,
    mechanicalAccess: false,
  };
}
export function ureaseEvidence(progress: number, active = true) {
  const converted = active ? 1 - Math.exp(-3 * unit(progress)) : 0;
  return {
    urea: 1 - converted,
    ammoniaEquivalents: 2 * converted,
    carbonEquivalents: converted,
    proteinPositive: true,
    catalytic: converted > 0.05,
  };
}
/** Chapter-local seconds aligned to measured speech plus the shared 0.45s onset.
 * Both languages keep the same chapter clock, but their internal evidence cuts differ. */
export const enzymeDurations = [22, 42, 22, 24.5, 38, 34, 36, 32.5] as const;
export function enzymeDirector(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const t = Math.max(0, finite(seconds)),
    en = locale === 'en';
  const a = en
    ? {
        heat: 5.2,
        catalyticView: 10.15,
        lowerStart: 12.3,
        lowerEnd: 16.3,
        endpoint: 20.2,
        damaged: 27.65,
        extractEnd: 5.4,
        ferment: 5.7,
        fermentEnd: 10,
        protein: 4.9,
        proteinEnd: 6.8,
        urea: 6.97,
        ureaEnd: 9,
        zoom: 7.65,
        dock: 15.2,
        hydro: 16.3,
        cleaved: 20.3,
        release: 19.8,
        sucrose: 22.6,
        prediction: 30.45,
        cold: 6.8,
        hot: 12,
        hotEnd: 17.2,
        chargeView: 6.4,
        acid: 9.3,
        neutral: 11.8,
        alkaline: 15.7,
        phDamage: 17.35,
        common: 2.1,
        assay: 7.1,
        recovered: 11,
        treatEnd: 2,
      }
    : {
        heat: 5.05,
        catalyticView: 11.6,
        lowerStart: 13,
        lowerEnd: 17.3,
        endpoint: 22.15,
        damaged: 29.5,
        extractEnd: 6.8,
        ferment: 7.25,
        fermentEnd: 11,
        protein: 4.1,
        proteinEnd: 6.1,
        urea: 6.45,
        ureaEnd: 9.4,
        zoom: 7.2,
        dock: 13.9,
        hydro: 15.7,
        cleaved: 18.8,
        release: 18.5,
        sucrose: 20,
        prediction: 29.5,
        cold: 9.15,
        hot: 14.1,
        hotEnd: 20.2,
        chargeView: 8,
        acid: 8.8,
        neutral: 11.5,
        alkaline: 15.5,
        phDamage: 17.7,
        common: 3.3,
        assay: 5.8,
        recovered: 10.1,
        treatEnd: 3.2,
      };
  const shot =
    chapter === 0
      ? 'cage'
      : chapter === 1
        ? t < a.heat
          ? 'four-tubes'
          : t < a.catalyticView
            ? 'heat-energy'
            : t < a.endpoint
              ? 'catalyst-path'
              : t < a.damaged
                ? 'same-endpoint'
                : 'damaged-path'
        : chapter === 2
          ? t < a.ferment
            ? 'extract'
            : 'cell-free-activity'
          : chapter === 3
            ? 'crystal-evidence'
            : chapter === 4
              ? t < a.zoom
                ? 'specificity-assay'
                : t < a.sucrose
                  ? 'glucan'
                  : t < a.prediction
                    ? 'sucrose'
                    : 'specificity-prediction'
              : chapter === 5
                ? t < a.cold
                  ? 'temperature-assay'
                  : t < a.hot
                    ? 'cold-turnover'
                    : 'heat-fold'
                : chapter === 6
                  ? t < a.chargeView
                    ? 'ph-assay'
                    : t < a.phDamage
                      ? 'protonation'
                      : 'ph-damage'
                  : 'recovery';
  return {
    shot,
    cage: between(t, en ? 3.6 : 3.8, en ? 6.8 : 7.8),
    observation: between(t, 1, chapter === 5 ? (en ? 5.9 : 7.8) : chapter === 4 ? 5.8 : 4.3),
    heat: between(t, a.heat + 0.3, a.catalyticView - 0.4),
    catalyst: between(t, a.lowerStart, a.lowerEnd),
    endpoint: between(t, a.endpoint, a.damaged - 0.3),
    damaged: between(t, a.damaged, a.damaged + 2),
    extraction: between(t, 0.5, a.extractEnd),
    fermentation: between(t, a.ferment, a.fermentEnd),
    proteinEvidence: between(t, a.protein, a.proteinEnd),
    crystal: between(t, a.urea, a.ureaEnd),
    binding: between(t, a.zoom, a.dock),
    hydrolysis: between(t, a.hydro, a.cleaved),
    release: between(t, a.release, a.sucrose - 0.1),
    sucrose: between(t, a.sucrose, a.sucrose + 2.5),
    prediction: between(t, a.prediction, a.prediction + 3),
    coldTurnover: between(t, a.cold, a.hot - 0.3),
    tempHistory: between(t, a.hot + 0.1, a.hotEnd),
    modelPh:
      t < a.neutral
        ? 3 + 4 * between(t, a.acid, a.neutral)
        : 7 + 4 * between(t, a.neutral + 0.5, a.alkaline),
    phDamage: between(t, a.phDamage, a.phDamage + 4.4),
    treatment: between(t, 0.5, a.treatEnd),
    recoveryCommon: t >= a.common,
    recoveryAssay: between(t, a.assay, a.recovered),
  };
}
export function amylaseDocking(progress: number, linkage: Linkage = 'alpha1-4') {
  const initial = glucanHydrolysis(0);
  const reference = initial.atoms.find((a) => a.id === 'g0-3')!;
  const displacement = -25 + (145 - reference.y + 25) * unit(progress);
  const contacts = Array.from({ length: 3 }, (_, i) => {
    const atom = initial.atoms.find((a) => a.id === `g${i}-3`)!;
    return {
      atomId: atom.id,
      substrate: { x: atom.x, y: atom.y + displacement },
      site: { x: atom.x, y: 145 },
    };
  });
  const distances = contacts.map((c) =>
    Math.hypot(c.substrate.x - c.site.x, c.substrate.y - c.site.y),
  );
  return { displacement, contacts, distances, ...productiveBinding(linkage, distances) };
}
/** One coordinate state for docking, net cleavage and release. Contact endpoints follow the
 * displayed atoms; separation makes the contact disappear rather than stretching a bond. */
export function glucanCatalyticScene(binding: number, hydrolysis: number, release: number) {
  const dock = amylaseDocking(binding);
  const graph = glucanHydrolysis(dock.productive ? hydrolysis : 0);
  const dy = dock.displacement - 34 * unit(release);
  const atoms = graph.atoms.map((a) => ({ ...a, y: a.y + dy }));
  const contacts = dock.contacts.map((c) => {
    const substrate = atoms.find((a) => a.id === c.atomId)!;
    const distance = Math.hypot(substrate.x - c.site.x, substrate.y - c.site.y);
    return { ...c, substrate, distance, opacity: unit(1 - distance / 8) };
  });
  return { ...graph, atoms, contacts, productiveAtDock: dock.productive };
}
/** A representative conformational transition driven by accumulated hazard.
 * The separate folded fraction is the population state, not the shape's scale. */
export function thermalConformation(temperature: number, seconds: number) {
  const hazard = damageRate(temperature) * Math.max(0, finite(seconds));
  return { hazard, folded: Math.exp(-hazard), unfolding: between(hazard, 0.2, 2) };
}
/** Optional persistent structural injury in an extreme-pH teaching scenario.
 * Deliberately not a fitted liver-catalase stability law. */
export function chemicalConformation(ph: number, seconds: number) {
  const hazard =
    0.02 * Math.max(0, Math.abs(finite(ph, 7) - 7) - 2) ** 2 * Math.max(0, finite(seconds));
  return { hazard, folded: Math.exp(-hazard), unfolding: between(hazard, 0.2, 2) };
}
