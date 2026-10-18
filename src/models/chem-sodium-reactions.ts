/** Bounded textbook net accounts. No rate, phase equilibrium or elementary mechanism. */
export type SodiumView =
  'surface' | 'air' | 'water' | 'peroxide' | 'potassium-air' | 'potassium-water';
export type SodiumForm = 'metal' | 'oxide' | 'peroxide';
export const sodiumClamp = (x: number, max = 1) =>
  Number.isFinite(x) ? Math.max(0, Math.min(max, x)) : 0;
const smooth = (x: number) => {
  const p = sodiumClamp(x);
  return p * p * (3 - 2 * p);
};
const phase = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
export function alkaliWater(extent: number, metal: 'Na' | 'K' = 'Na') {
  const x = sodiumClamp(extent),
    atomicMass = metal === 'Na' ? 22.98977 : 39.0983;
  return {
    extent: x,
    metal,
    remainingMoles: 1 - x,
    hydrogenMoles: x / 2,
    hydroxideMoles: x,
    metalMass: atomicMass * (1 - x),
    waterConsumed: 18.01528 * x,
    hydroxideMass: (atomicMass + 17.00734) * x,
    hydrogenMass: (2.01588 * x) / 2,
    radiusFraction: Math.cbrt(1 - x),
    density: metal === 'Na' ? 0.97 : 0.89,
  };
}
export function peroxideWater(extent: number) {
  const x = sodiumClamp(extent);
  return { extent: x, remainingMoles: 1 - x, hydroxideMoles: 2 * x, oxygenMoles: x / 2 };
}
/** Volume of a submerged spherical cap, not a linear depth approximation. */
export function immersedSphere(densityRatio: number) {
  const target = sodiumClamp(densityRatio);
  if (target === 0 || target === 1) return target;
  let lo = 0,
    hi = 2;
  for (let i = 0; i < 60; i++) {
    const h = (lo + hi) / 2;
    if ((3 * h * h - h * h * h) / 4 < target) lo = h;
    else hi = h;
  }
  return (lo + hi) / 4;
}
export function sodiumDirector(chapter: number, progress: number) {
  const c = Math.floor(sodiumClamp(chapter, 7)),
    p = sodiumClamp(progress),
    views: SodiumView[] = [
      'surface',
      'air',
      'water',
      'water',
      'peroxide',
      'peroxide',
      'potassium-air',
      'potassium-water',
    ];
  return {
    view: views[c],
    progress: p,
    extent: c === 2 ? Math.min(0.65, p * 0.65) : c === 3 ? 0.65 + p * 0.35 : c === 5 ? 1 : p,
    evidence: c === 3 || c === 5,
    cut: Math.min(1, p / 0.35),
    oxidation: Math.max(0, (p - 0.4) / 0.6),
    melt: c === 1 ? Math.min(1, p / 0.3) : Math.min(1, p / 0.25),
  };
}
export function surfaceExposure(previousLayer: number, oxygenContact: boolean, increment: number) {
  return sodiumClamp(sodiumClamp(previousLayer) + (oxygenContact ? sodiumClamp(increment) : 0));
}
export function oxidationAccount(form: 'oxide' | 'peroxide', sodiumAmount = 4, extent = 1) {
  const sodium = sodiumClamp(sodiumAmount, 100),
    x = sodiumClamp(extent),
    reacted = sodium * x;
  return {
    form,
    initialNa: sodium,
    remainingNa: sodium - reacted,
    sodiumI: reacted,
    formulaUnits: reacted / 2,
    oxygenMolecules: reacted / (form === 'oxide' ? 4 : 2),
    oxygenAtoms: reacted / (form === 'oxide' ? 2 : 1),
    oxygenState: form === 'oxide' ? -2 : -1,
    electronsLost: reacted,
    electronsGained: reacted,
  };
}
export function sodiumWaterAccount(
  form: SodiumForm,
  sodiumAmount = 4,
  extent = 1,
  waterPresent = true,
) {
  const n = sodiumClamp(sodiumAmount, 100),
    x = waterPresent ? sodiumClamp(extent) : 0,
    reacted = n * x;
  const initialSolidO = form === 'metal' ? 0 : form === 'oxide' ? n / 2 : n,
    initialWater = waterPresent ? (form === 'metal' ? n : n / 2) : 0;
  return {
    form,
    extent: x,
    initialNa: n,
    remainingNa: n - reacted,
    remainingSolidO: initialSolidO * (1 - x),
    remainingWater: initialWater * (1 - x),
    initialSolidO,
    initialWater,
    aqueousSodium: reacted,
    totalSodiumI: form === 'metal' ? reacted : n,
    hydroxide: reacted,
    hydrogen: form === 'metal' ? reacted / 2 : 0,
    oxygen: form === 'peroxide' ? reacted / 4 : 0,
    lostElectrons: form === 'metal' ? reacted : form === 'peroxide' ? reacted / 2 : 0,
    gainedElectrons: form === 'metal' ? reacted : form === 'peroxide' ? reacted / 2 : 0,
    netCharge: 0,
    totals: { Na: n, O: initialSolidO + initialWater, H: initialWater * 2 },
  };
}
export const ALKALI_ATOMS = [
  { symbol: 'Li', shells: [2, 1], metallicRadiusNm: 0.152, ionizationEV: 5.391719 },
  { symbol: 'Na', shells: [2, 8, 1], metallicRadiusNm: 0.186, ionizationEV: 5.139076 },
  { symbol: 'K', shells: [2, 8, 8, 1], metallicRadiusNm: 0.227, ionizationEV: 4.3406633 },
] as const;
export function alkaliHydrogen(metalMoles: number) {
  return sodiumClamp(metalMoles, 100) / 2;
}
export function dropletGeometry(
  width: number,
  extent: number,
  metal: 'Na' | 'K' = 'Na',
  shape: 'sphere' | 'cube' = 'sphere',
) {
  const w = Math.max(240, Number.isFinite(width) ? width : 240),
    s = alkaliWater(extent, metal),
    r = 34 * s.radiusFraction * (shape === 'cube' ? Math.cbrt(Math.PI / 6) : 1),
    level = 80;
  return {
    state: s,
    width: w,
    level,
    radius: r,
    x: w / 2 + Math.sin(s.extent * 9) * 25 * s.extent,
    y: level + r * (2 * (shape === 'cube' ? s.density : immersedSphere(s.density)) - 1),
    shape,
    immersedVolumeFraction: s.density,
  };
}
/** Bubbles remain in liquid; an escaped gas marker has a separately identified headspace phase. */
export function gasEscape(progress: number, liquidLevel: number, bottom: number) {
  const p = sodiumClamp(progress),
    level = Number.isFinite(liquidLevel) ? liquidLevel : 80,
    b = Math.max(level + 1, Number.isFinite(bottom) ? bottom : 160);
  return p <= 0.7
    ? { phase: 'liquid' as const, y: b - (b - level) * (p / 0.7), opacity: 1 }
    : { phase: 'gas' as const, y: level - 50 * ((p - 0.7) / 0.3), opacity: 1 - (p - 0.7) / 0.3 };
}
export type SodiumAtom = {
  id: string;
  element: 'Na' | 'O' | 'H';
  x: number;
  y: number;
  tracked: boolean;
  label: string;
};
type Point = { x: number; y: number };
type AtomSpec = {
  id: string;
  element: SodiumAtom['element'];
  from: Point;
  to: Point;
  tracked?: boolean;
};
/** Continuous identity mapping is one valid net allocation, not isotope provenance. */
export function waterAtomGeometry(kind: SodiumForm, width: number, progress: number) {
  const w = Math.max(240, Math.min(760, Number.isFinite(width) ? width : 240)),
    p = sodiumClamp(progress),
    q = smooth(p),
    gasProgress = kind === 'peroxide' ? phase(p, 0, 0.53) : p,
    compact = w < 560,
    h = compact ? 194 : 268;
  const atoms: AtomSpec[] = [],
    before: [string, string][] = [],
    after: [string, string][] = [],
    add = (id: string, element: SodiumAtom['element'], from: Point, to: Point, tracked = false) =>
      atoms.push({ id, element, from, to, tracked });
  const point = (f: number, y: number) => ({ x: w * f, y }),
    top = compact ? 27 : 38,
    mid = compact ? 81 : 110,
    low = compact ? 137 : 195;
  if (kind === 'metal') {
    for (let i = 0; i < 2; i++) {
      const f = i === 0 ? 0.24 : 0.76;
      add(`Na-${i}`, 'Na', point(f, top), point(f, top));
      add(`water-O-${i}`, 'O', point(f, mid), point(f, low));
      add(`water-H-${2 * i}`, 'H', point(f - 0.09, mid + 28), point(0.45 + i * 0.1, mid), i === 0);
      add(`water-H-${2 * i + 1}`, 'H', point(f + 0.09, mid + 28), point(f + 0.08, low + 24));
      before.push([`water-O-${i}`, `water-H-${2 * i}`], [`water-O-${i}`, `water-H-${2 * i + 1}`]);
      after.push([`water-O-${i}`, `water-H-${2 * i + 1}`]);
    }
    after.push(['water-H-0', 'water-H-2']);
  } else if (kind === 'oxide') {
    add('oxide-O', 'O', point(0.25, mid), point(0.24, low), true);
    add('water-O', 'O', point(0.75, mid), point(0.76, low));
    add('water-H-0', 'H', point(0.64, mid + 26), point(0.33, low + 24), true);
    add('water-H-1', 'H', point(0.86, mid + 26), point(0.85, low + 24));
    for (let i = 0; i < 2; i++)
      add(`Na-${i}`, 'Na', point(0.25 + i * 0.5, top), point(0.25 + i * 0.5, top));
    before.push(['water-O', 'water-H-0'], ['water-O', 'water-H-1']);
    after.push(['oxide-O', 'water-H-0'], ['water-O', 'water-H-1']);
  } else {
    for (let i = 0; i < 4; i++) {
      const f = 0.14 + i * 0.24;
      add(`Na-${i}`, 'Na', point(f, top), point(f, top));
      add(
        `peroxide-O-${i}`,
        'O',
        point(f, mid),
        i < 2 ? point(0.45 + i * 0.1, mid) : point(0.14 + (i - 2) * 0.24, low),
        i === 0,
      );
    }
    before.push(['peroxide-O-0', 'peroxide-O-1'], ['peroxide-O-2', 'peroxide-O-3']);
    after.push(['peroxide-O-0', 'peroxide-O-1']);
    for (let i = 0; i < 2; i++) {
      const f = 0.27 + i * 0.46;
      add(`water-O-${i}`, 'O', point(f, low), point(0.62 + i * 0.24, low));
      for (let j = 0; j < 2; j++) {
        const id = `water-H-${2 * i + j}`;
        add(
          id,
          'H',
          point(f + (j === 0 ? -0.09 : 0.09), low + 25),
          point(0.14 + (2 * i + j) * 0.24, low + 26),
        );
        before.push([`water-O-${i}`, id]);
      }
    }
    after.push(
      ['peroxide-O-2', 'water-H-0'],
      ['peroxide-O-3', 'water-H-1'],
      ['water-O-0', 'water-H-2'],
      ['water-O-1', 'water-H-3'],
    );
  }
  const moving = atoms.map((a) => {
    // Explanatory order follows the spoken net account, not measured reaction kinetics.
    const position =
      kind === 'peroxide' && ['peroxide-O-0', 'peroxide-O-1'].includes(a.id)
        ? smooth(gasProgress)
        : q;
    return {
      id: a.id,
      element: a.element,
      x: a.from.x + (a.to.x - a.from.x) * position,
      y: a.from.y + (a.to.y - a.from.y) * position,
      tracked: !!a.tracked,
      label: a.element === 'Na' && (kind !== 'metal' || p === 1) ? 'Na⁺' : a.element,
    };
  });
  const bonds = (pairs: [string, string][], opacity: number) =>
    pairs.map(([a, b]) => ({
      a: moving.find((x) => x.id === a)!,
      b: moving.find((x) => x.id === b)!,
      opacity,
    }));
  const electronTransfers =
    kind === 'oxide'
      ? []
      : [0, 1].map((i) => {
          const donor = moving.find(
            (a) => a.id === (kind === 'metal' ? `Na-${i}` : `peroxide-O-${i}`),
          )!;
          const recipient = moving.find(
            (a) => a.id === (kind === 'metal' ? `water-H-${2 * i}` : `peroxide-O-${i + 2}`),
          )!;
          const fraction = phase(p, 0.15, 0.85),
            from = { x: donor.x, y: donor.y + 23 },
            to = { x: recipient.x, y: recipient.y - 22 };
          return {
            id: `e-${i}`,
            from,
            to,
            x: from.x + (to.x - from.x) * fraction,
            y: from.y + (to.y - from.y) * fraction,
            opacity: phase(p, 0, 0.1) * (1 - phase(p, 0.9, 1)),
          };
        });
  return {
    width: w,
    height: h,
    progress: p,
    atoms: moving,
    electronTransfers,
    bonds: [...bonds(before, 1 - phase(p, 0, 0.25)), ...bonds(after, phase(p, 0.75, 1))].map(
      (b, i) =>
        kind === 'peroxide' && b.a.id === 'peroxide-O-0' && b.b.id === 'peroxide-O-1'
          ? { ...b, opacity: i === 0 ? 1 : 0 }
          : b,
    ),
    gasComplete: gasProgress === 1,
    complete: p === 1,
    totals: {
      Na: kind === 'peroxide' ? 4 : 2,
      O: kind === 'peroxide' ? 6 : 2,
      H: kind === 'oxide' ? 2 : 4,
    },
    electronUnits: kind === 'oxide' ? 0 : 2,
  };
}
export const SODIUM_CHAPTER_SECONDS = [29, 35.5, 29, 36, 36.5, 34, 29, 37.5] as const;
/** Seconds within each chapter, including the 0.45 s lead. Independently transcribed final tracks. */
export const SODIUM_MEASURED_EVENTS = {
  zh: {
    exposure: [9.4, 13.0],
    contactOff: 16.55,
    compound: 6.0,
    peroxide: 13.3,
    oxygenQuestion: 19.5,
    oxygenReveal: 22.5,
    melt: 7.1,
    motion: 11.7,
    hydrogenStart: 5.8,
    hydrogenTransfer: [6.2, 14.2],
    indicator: 23.4,
    amount: 28.2,
    amountReveal: 30.6,
    peroxideAtoms: 4.7,
    peroxideTransfer: [15.1, 21.5],
    waterOxygen: 25.6,
    oxideQuestion: 6.6,
    oxideProton: 13.25,
    protonTransfer: [13.4, 18.7],
    comparison: 20.1,
    potassiumBurn: 11.7,
    potassiumLimit: 15.5,
    energy: 6.1,
    lithium: 21.7,
    equalMoles: 25.45,
    hydrogenReveal: 29.6,
  },
  en: {
    exposure: [10.5, 14.3],
    contactOff: 18.65,
    compound: 6.1,
    peroxide: 15.0,
    oxygenQuestion: 21.0,
    oxygenReveal: 24.6,
    melt: 7.85,
    motion: 12.0,
    hydrogenStart: 6.6,
    hydrogenTransfer: [7.0, 17.0],
    indicator: 26.1,
    amount: 30.2,
    amountReveal: 33.2,
    peroxideAtoms: 4.5,
    peroxideTransfer: [16.6, 24.3],
    waterOxygen: 26.8,
    oxideQuestion: 6.55,
    oxideProton: 14.1,
    protonTransfer: [14.2, 19.7],
    comparison: 21.0,
    potassiumBurn: 10.8,
    potassiumLimit: 15.8,
    energy: 6.45,
    lithium: 21.6,
    equalMoles: 25.45,
    hydrogenReveal: 30.9,
  },
} as const;
export function sodiumFilm(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.floor(sodiumClamp(chapter, 7)),
    t = sodiumClamp(time, 300),
    e = SODIUM_MEASURED_EVENTS[locale],
    duration = SODIUM_CHAPTER_SECONDS[c];
  const beat =
    c === 0
      ? t < 3
        ? 'cut'
        : t < e.contactOff
          ? 'contact'
          : 'stop'
      : c === 1
        ? t < e.compound
          ? 'burn'
          : t < e.oxygenQuestion
            ? 'units'
            : t < e.oxygenReveal
              ? 'predict'
              : 'reveal'
        : c === 2
          ? t < e.melt
            ? 'float'
            : t < e.motion
              ? 'melt'
              : 'motion'
          : c === 3
            ? t < e.hydrogenStart
              ? 'predict'
              : t < e.indicator
                ? 'atoms'
                : t < e.amount
                  ? 'evidence'
                  : 'amount'
            : c === 4
              ? t < e.peroxideAtoms
                ? 'test'
                : 'atoms'
              : c === 5
                ? t < e.oxideQuestion
                  ? 'evidence'
                  : t < e.oxideProton
                    ? 'predict'
                    : t < e.comparison
                      ? 'proton'
                      : 'compare'
                : c === 6
                  ? t < e.potassiumBurn
                    ? 'shells'
                    : t < e.potassiumLimit
                      ? 'burn'
                      : 'limit'
                  : t < e.energy
                    ? 'motion'
                    : t < e.lithium
                      ? 'energy'
                      : t < e.equalMoles
                        ? 'lithium'
                        : 'amount';
  const interval = c === 3 ? e.hydrogenTransfer : c === 4 ? e.peroxideTransfer : e.protonTransfer;
  return {
    chapter: c,
    time: t,
    progress: sodiumClamp(t / duration),
    beat,
    transfer: phase(t, interval[0], interval[1]),
    exposure: phase(t, e.exposure[0], e.exposure[1]) * 0.8,
    extent: c === 2 ? phase(t, e.melt, 27) * 0.8 : c === 7 ? 0.55 : 1,
    oxideForm: t < e.peroxide ? ('oxide' as const) : ('peroxide' as const),
    highlightWater: c === 4 && t >= e.waterOxygen,
    reveal:
      c === 1
        ? t >= e.oxygenReveal
        : c === 3
          ? t >= e.amountReveal
          : c === 5
            ? t >= e.comparison
            : c === 7
              ? t >= e.hydrogenReveal
              : true,
  };
}

/** Oxygen pairs enter as O₂; endpoint geometry and electron targets share the account. */
export function oxidationGeometry(form: 'oxide' | 'peroxide', width: number, progress: number) {
  const w = Math.max(240, Math.min(760, Number.isFinite(width) ? width : 240)),
    p = sodiumClamp(progress),
    q = smooth(p),
    account = oxidationAccount(form),
    n = account.oxygenAtoms;
  const oxygen = Array.from({ length: n }, (_, i) => {
    const pair = Math.floor(i / 2),
      start =
        form === 'oxide'
          ? w / 2 + (i % 2 === 0 ? -16 : 16)
          : w * (0.26 + pair * 0.48) + (i % 2 === 0 ? -16 : 16),
      end = w * (form === 'oxide' ? 0.32 + i * 0.36 : 0.14 + i * 0.24);
    return { id: `O-${i}`, x: start + (end - start) * q, y: 151 };
  });
  const electrons = Array.from({ length: 4 }, (_, i) => {
    const donorX = w * (0.14 + i * 0.24),
      acceptor = oxygen[form === 'oxide' ? Math.floor(i / 2) : i],
      targetX = acceptor.x + (form === 'oxide' ? (i % 2 === 0 ? -6 : 6) : 0);
    return { id: `e-${i}`, donorX, targetX, x: donorX + (targetX - donorX) * q, y: 61 + 71 * q };
  });
  return {
    account,
    oxygen,
    electrons,
    pairOpacity: form === 'oxide' ? 1 - phase(p, 0.2, 0.65) : 1,
  };
}
