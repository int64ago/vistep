export type ElectronBond = 'ionic' | 'polar';
export function electronClamp(value: number, min = 0, max = 1) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
}
const smooth = (p: number) => p * p * (3 - 2 * p);
type AllocationPoint = { x: number; y: number };
function allocationArc(from: AllocationPoint, to: AllocationPoint, progress: number, lift: number) {
  const q = smooth(electronClamp(progress));
  return {
    x: from.x + (to.x - from.x) * q,
    y: from.y + (to.y - from.y) * q - Math.sin(Math.PI * q) * lift,
  };
}
function allocationPath(from: AllocationPoint, to: AllocationPoint, lift: number) {
  return Array.from({ length: 41 }, (_, i) => {
    const point = allocationArc(from, to, i / 40, lift);
    return `${i ? 'L' : 'M'}${point.x} ${point.y}`;
  }).join(' ');
}
/** Formal allocation, not a quantum density or a physical partial charge. */
export function electronLedger(bond: ElectronBond, formed: boolean) {
  const leftValence = 1,
    rightValence = 7,
    total = 8;
  const assignedLeft = formed ? 0 : 1,
    assignedRight = total - assignedLeft;
  return {
    bond,
    total,
    assignedLeft,
    assignedRight,
    leftOxidation: leftValence - assignedLeft,
    rightOxidation: rightValence - assignedRight,
    sharedPair: bond === 'polar' && formed ? 2 : 0,
    ionic: bond === 'ionic',
  };
}
export function transferPosition(progress: number) {
  const p = smooth(electronClamp(progress));
  return { x: 163 + 239 * p, y: 103 + 32 * p - 60 * Math.sin(Math.PI * p) };
}
export function bondDensity(x: number, progress: number) {
  const p = electronClamp(progress),
    centre = 0.5 + 0.14 * p;
  return Math.exp(-(((electronClamp(x) - centre) / 0.23) ** 2));
}
export function electronDirector(chapter: number, progress: number) {
  return {
    bond: (chapter === 2 ? 'polar' : 'ionic') as ElectronBond,
    progress: chapter === 1 ? 1 : electronClamp(progress),
    formed: chapter > 0 || progress >= 1,
    ledger: chapter === 1,
  };
}
export type AllocationPhase = 'donor' | 'ledger' | 'recipient';
/** During a transfer picture, the electron sits in an explicit accounting column.
 * These are allocations, not measured free electrons in space or aqueous solution. */
export function ionicAllocation(progress: number, pairs = 1) {
  const n = Math.round(electronClamp(pairs, 1, 2)),
    p = electronClamp(progress);
  const rows = Array.from({ length: n }, (_, i) => {
    const local = n === 1 ? p : electronClamp((p - i * 0.5) / 0.5);
    const phase: AllocationPhase = local === 0 ? 'donor' : local === 1 ? 'recipient' : 'ledger';
    return {
      id: i,
      progress: local,
      phase,
      sodiumCharge: phase === 'donor' ? 0 : 1,
      chlorineCharge: phase === 'recipient' ? -1 : 0,
      donorElectrons: phase === 'donor' ? 1 : 0,
      recipientElectrons: phase === 'recipient' ? 8 : 7,
      ledgerElectrons: phase === 'ledger' ? 1 : 0,
    };
  });
  const sum = (
    key:
      | 'sodiumCharge'
      | 'chlorineCharge'
      | 'donorElectrons'
      | 'recipientElectrons'
      | 'ledgerElectrons',
  ) => rows.reduce((a, row) => a + row[key], 0);
  return {
    rows,
    pairs: n,
    totalElectrons: 8 * n,
    donorElectrons: sum('donorElectrons'),
    recipientElectrons: sum('recipientElectrons'),
    ledgerElectrons: sum('ledgerElectrons'),
    chargeIncludingLedger: sum('sodiumCharge') + sum('chlorineCharge') - sum('ledgerElectrons'),
  };
}
export function ionicGeometry(width: number, progress: number, pairs = 1, short = false) {
  const w = electronClamp(width, 240, 1000),
    compact = w < 560,
    state = ionicAllocation(progress, pairs);
  const height =
    state.pairs === 2 ? (short ? 220 : compact ? 250 : 320) : short ? 190 : compact ? 220 : 280;
  const radius = compact ? 37 : 48,
    left = w * 0.23,
    right = w * 0.77;
  const rows = state.rows.map((row) => {
    const y = state.pairs === 1 ? height * 0.48 : height * (row.id ? 0.7 : 0.31),
      a = -Math.PI / 4;
    const from = { x: left + radius * Math.cos(a), y: y + radius * Math.sin(a) },
      to = { x: right + radius * Math.cos(a), y: y + radius * Math.sin(a) };
    const moving = allocationArc(from, to, row.progress, compact ? 24 : 40),
      path = allocationPath(from, to, compact ? 24 : 40);
    const chlorine = Array.from({ length: 7 }, (_, i) => ({
      id: `Cl-${row.id}-e-${i}`,
      x: right + Math.cos((i * Math.PI) / 4) * radius,
      y: y + Math.sin((i * Math.PI) / 4) * radius,
    }));
    return { ...row, left, right, y, radius, from, to, moving, path, chlorine };
  });
  return { width: w, height, compact, state, rows };
}
/** Near-complete textbook Fe + CuII -> FeII + Cu net account; no kinetics, hydrolysis or complexation. */
export function ironCopperAccount(iron: number, copper: number) {
  const initialIron = Math.round(electronClamp(iron, 0, 2)),
    initialCopper = Math.round(electronClamp(copper, 0, 2)),
    extent = Math.min(initialIron, initialCopper);
  return {
    initialIron,
    initialCopper,
    extent,
    ironRemaining: initialIron - extent,
    ironII: extent,
    copperII: initialCopper - extent,
    copperMetal: extent,
    electronsLost: 2 * extent,
    electronsGained: 2 * extent,
    sulfate: initialCopper,
    totalCharge: 0,
  };
}
/** Visible phases and electron inventory derive from the same paired allocation.
 * A two-electron packet never invents mandatory FeI/CuI intermediates. */
export function ironCopperTransfer(iron: number, copper: number, progress: number) {
  const end = ironCopperAccount(iron, copper),
    p = electronClamp(progress);
  const rows = Array.from({ length: end.extent }, (_, i) => {
    const local = end.extent === 1 ? p : electronClamp((p - i * 0.5) / 0.5);
    const phase: AllocationPhase = local === 0 ? 'donor' : local === 1 ? 'recipient' : 'ledger';
    return {
      id: i,
      progress: local,
      phase,
      ironOxidized: phase !== 'donor',
      copperReduced: phase === 'recipient',
      ledgerElectrons: phase === 'ledger' ? 2 : 0,
    };
  });
  const ironII = rows.filter((r) => r.ironOxidized).length,
    copperMetal = rows.filter((r) => r.copperReduced).length,
    ledgerElectrons = rows.reduce((n, r) => n + r.ledgerElectrons, 0);
  return {
    ...end,
    rows,
    ironII,
    ironRemaining: end.initialIron - ironII,
    copperMetal,
    copperII: end.initialCopper - copperMetal,
    ledgerElectrons,
    chargeIncludingLedgerAndSulfate:
      2 * ironII + 2 * (end.initialCopper - copperMetal) - ledgerElectrons - 2 * end.sulfate,
  };
}
export function ironCopperGeometry(
  width: number,
  iron: number,
  copper: number,
  progress: number,
  short = false,
) {
  const w = electronClamp(width, 240, 1000),
    compact = w < 560,
    height = short ? 210 : compact ? 240 : 300,
    state = ironCopperTransfer(iron, copper, progress);
  const left = w * 0.23,
    right = w * 0.77,
    rowY = [height * 0.3, height * 0.69];
  const atoms = [
    ...Array.from({ length: state.initialIron }, (_, i) => ({
      id: `Fe-${i}`,
      kind: 'Fe' as const,
      x: left,
      y: rowY[i],
      charge: state.rows[i]?.ironOxidized ? 2 : 0,
    })),
    ...Array.from({ length: state.initialCopper }, (_, i) => ({
      id: `Cu-${i}`,
      kind: 'Cu' as const,
      x: right,
      y: rowY[i],
      charge: state.rows[i]?.copperReduced ? 0 : 2,
    })),
  ];
  const packets = state.rows.map((r) => {
    const from = { x: left + 29, y: rowY[r.id] },
      to = { x: right - 29, y: rowY[r.id] },
      point = allocationArc(from, to, r.progress, compact ? 25 : 40);
    return {
      ...r,
      ...point,
      path: allocationPath(from, to, compact ? 25 : 40),
    };
  });
  return { width: w, height, compact, left, right, rowY, state, atoms, packets };
}
export const ELECTRON_CHAPTER_IDS = ['transfer', 'balance', 'sharing', 'predict-iron'] as const;
export const ELECTRON_PLANNED_DURATIONS = [30, 32, 35, 40] as const;
/** Chapter-relative seconds measured against the final 137 s bilingual recordings.
 * Voice starts 0.45 s into each chapter. These are authored allocation motions,
 * not electron flight times or reaction kinetics. */
export const ELECTRON_MEASURED_EVENTS = {
  zh: {
    local: [6.45, 10.65],
    whole: [10.9, 15.3],
    sharing: [3.7, 7.5],
    formal: 11.5,
    predict: [18.4, 21.5],
    secondIron: 24.95,
    secondTransfer: [25.45, 28.7],
  },
  en: {
    local: [7.1, 10.45],
    whole: [11, 15.3],
    sharing: [3.35, 7.6],
    formal: 12.25,
    predict: [18.15, 20.6],
    secondIron: 24.55,
    secondTransfer: [25.05, 28.15],
  },
} as const;
export function electronFilm(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.round(electronClamp(chapter, 0, 3)),
    t = electronClamp(chapterTime, 0, ELECTRON_PLANNED_DURATIONS[c]),
    events = ELECTRON_MEASURED_EVENTS[locale];
  const phase = (range: readonly [number, number]) =>
    electronClamp((t - range[0]) / (range[1] - range[0]));
  return {
    chapter: c,
    id: ELECTRON_CHAPTER_IDS[c],
    progress:
      c === 0
        ? phase(events.local)
        : c === 1
          ? phase(events.whole)
          : c === 2
            ? phase(events.sharing)
            : t < events.secondIron
              ? phase(events.predict)
              : 0.5 + 0.5 * phase(events.secondTransfer),
    formal: c === 2 && t >= events.formal,
    predictReveal: c === 3 && t >= events.predict[0],
    iron: c === 3 && t >= events.secondIron ? 2 : 1,
    copper: 2,
    hint:
      c === 3 && t < events.predict[0]
        ? 'question'
        : c === 3 && t >= events.secondIron
          ? 'second-iron'
          : 'one-iron',
  };
}
