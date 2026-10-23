export type UnsaturatedGas = 'ethene' | 'ethyne';
const clamp = (x: number, a: number, b: number) =>
  Number.isFinite(x) ? Math.max(a, Math.min(b, x)) : a;
/** Stoichiometric endpoint book: no time-rate prediction or solution side reactions. */
export function bromineAddition(gas: UnsaturatedGas, bromine = 2, progress = 1) {
  const capacity = gas === 'ethene' ? 1 : 2,
    available = clamp(bromine, 0, 3),
    used = Math.min(capacity, available) * clamp(progress, 0, 1);
  const first = Math.min(1, used),
    second = Math.max(0, used - 1);
  return {
    gas,
    capacity,
    available,
    used,
    first,
    second,
    remaining: available - used,
    bondOrder: capacity + 1 - used,
    products: capacity === 1 ? [1 - first, first] : [1 - first, first - second, second],
    organicAtoms: { C: 2, H: gas === 'ethene' ? 4 : 2, Br: 2 * used },
    totalBromineAtoms: 2 * available,
  };
}
/** One unit carbide; separate trace H2S impurity, scrubber Cu2+ and CuS ledger. */
export function ethynePreparation(progress = 1, copperCapacity = 0.12) {
  const reacted = clamp(progress, 0, 1),
    copper = clamp(copperCapacity, 0, 0.2),
    ethyne = reacted,
    impurity = 0.08 * ethyne,
    captured = Math.min(copper, impurity);
  return {
    reacted,
    carbide: 1 - reacted,
    water: 2.2 - 2 * reacted,
    calciumHydroxide: reacted,
    ethyne,
    impurity,
    captured,
    outletImpurity: impurity - captured,
    copperRemaining: copper - captured,
    copperInitial: copper,
    precipitate: captured,
    acidFormed: 2 * captured,
  };
}
/** Acidic MnO4− requires five electrons per Mn2+. Exposure is an illustrative electron supply. */
export function permanganateEvidence(exposure: number, impurityElectrons = 0) {
  const electrons = clamp(exposure, 0, 1) * 5 + clamp(impurityElectrons, 0, 10),
    reduced = Math.min(1, electrons / 5);
  return { initial: 1, remaining: 1 - reduced, manganeseII: reduced, electronsUsed: reduced * 5 };
}
export function hydrocarbonDirector(chapter: number, progress: number) {
  const c = clamp(Math.floor(chapter), 0, 7),
    p = clamp(progress, 0, 1);
  return {
    chapter: c,
    progress: p,
    gas: (c < 4 ? 'ethene' : 'ethyne') as UnsaturatedGas,
    exposure:
      c === 0 || c === 7
        ? p
        : c === 1 || c === 2
          ? p
          : c === 3
            ? p
            : c === 4
              ? p
              : c === 5
                ? 0.4 + 0.6 * p
                : p,
  };
}
export function completeCombustion(gas: UnsaturatedGas) {
  return {
    fuel: 1,
    oxygen: gas === 'ethene' ? 3 : 2.5,
    carbonDioxide: 2,
    water: gas === 'ethene' ? 2 : 1,
  };
}

export const HYDROCARBON_SECONDS = [23, 48, 26, 29, 31, 31, 32, 26.5] as const;
const ease = (p: number) => {
  const t = clamp(p, 0, 1);
  return t * t * (3 - 2 * t);
};
const between = (t: number, a: number, b: number) => ease((t - a) / (b - a));
export type OxidationShot = 'observation' | 'net' | 'question' | 'budget' | 'contrast';
/** Acid in excess; an assigned electron-equivalent budget, NOT a hydrocarbon amount/yield. */
export function acidicManganeseBudget(electronEquivalents = 5, progress = 1) {
  const supply = clamp(electronEquivalents, 0, 10),
    p = clamp(progress, 0, 1);
  const reduced = Math.min(1, supply / 5) * p,
    received = 5 * reduced;
  const remaining = 1 - reduced,
    protonRemaining = 8 - 8 * reduced,
    water = 4 * reduced;
  return {
    supply,
    received,
    unusedElectrons: supply - received,
    permanganate: remaining,
    manganeseII: reduced,
    protonRemaining,
    water,
    atoms: { Mn: remaining + reduced, O: 4 * remaining + water, H: protonRemaining + 2 * water },
    // Net equation includes only the ACCEPTOR half. The other half is deliberately unspecified.
    initialHalfCharge: -1 + 8 - supply,
    finalHalfCharge: -remaining + 2 * reduced + protonRemaining - (supply - received),
  };
}
export function brominationOxidationAccount() {
  return {
    carbonBefore: [-2, -2],
    carbonAfter: [-1, -1],
    bromineBefore: [0, 0],
    bromineAfter: [-1, -1],
    carbonLoss: 2,
    bromineGain: 2,
    netCharge: 0,
  };
}
export type PermanganateAtom = {
  id: string;
  element: 'Mn' | 'O' | 'H';
  x: number;
  y: number;
  group: 'manganese' | 'oxygen' | 'proton' | 'water';
};
/** One selected NET half-reaction. Persistent atoms; paths are accounting interpolation, NOT intermediates. */
export function permanganateNetGeometry(
  progress: number,
  requestedWidth = 280,
  electronProgress = progress,
) {
  const p = clamp(progress, 0, 1),
    width = clamp(requestedWidth, 260, 620),
    compact = width < 440;
  const mn = { x: compact ? width * 0.55 : width * 0.62, y: 64 };
  const waters = compact
    ? [
        { x: width * 0.28, y: 139 },
        { x: width * 0.72, y: 139 },
        { x: width * 0.28, y: 193 },
        { x: width * 0.72, y: 193 },
      ]
    : [0, 1, 2, 3].map((i) => ({ x: width * 0.2 + i * width * 0.2, y: 169 }));
  const oxygens = [
    { x: mn.x - 32, y: mn.y - 30 },
    { x: mn.x + 32, y: mn.y - 30 },
    { x: mn.x - 32, y: mn.y + 30 },
    { x: mn.x + 32, y: mn.y + 30 },
  ];
  // Independent presentation clocks let the spoken Mn account settle before tracking O/H.
  // Atomic paths, endpoints and the five-equivalent ledger do not change.
  const ep = clamp(electronProgress, 0, 1),
    atomMove = between(p, 0.34, 0.92),
    electronMove = between(ep, 0.06, 0.55);
  const atoms: PermanganateAtom[] = [{ id: 'Mn-1', element: 'Mn', ...mn, group: 'manganese' }];
  for (let i = 0; i < 4; i++) {
    const a = oxygens[i],
      b = waters[i];
    const q = compact ? between(p, i < 2 ? 0.34 : 0.61, i < 2 ? 0.59 : 0.92) : atomMove;
    let x = a.x + (b.x - a.x) * q,
      y = a.y + (b.y - a.y) * q;
    if (compact && i >= 2) {
      const edge = i === 2 ? 24 : width - 24;
      const points = [a, { x: edge, y: 108 }, { x: edge, y: 184 }, b];
      const leg = Math.min(2, Math.floor(q * 3)),
        t = ease(q * 3 - leg),
        u = points[leg],
        v = points[leg + 1];
      x = u.x + (v.x - u.x) * t;
      y = u.y + (v.y - u.y) * t;
    }
    atoms.push({ id: `O-${i + 1}`, element: 'O', x, y, group: q >= 1 ? 'water' : 'oxygen' });
    for (let h = 0; h < 2; h++)
      atoms.push({
        id: `H-${i * 2 + h + 1}`,
        element: 'H',
        x: b.x + (h === 0 ? -18 : 18),
        y: b.y + 17,
        group: q >= 1 ? 'water' : 'proton',
      });
  }
  // All five symbols represent electron equivalents of the SAME selected net event.
  // No oxidation-state staircase or solvated free electrons is asserted.
  const phase = ep <= 0.06 ? 'donor' : ep < 0.55 ? 'transfer' : 'acceptor';
  const credits = Array.from({ length: 5 }, (_, i) => ({
    id: `e-${i + 1}`,
    phase,
    x: 32 + (mn.x - 32) * electronMove,
    y: 25 + i * 18 + (mn.y - 25 - i * 18) * electronMove,
  }));
  const donorChange = phase === 'donor' ? 0 : 5,
    inTransit = phase === 'transfer' ? -5 : 0,
    acceptorCharge = phase === 'acceptor' ? 2 : 7;
  return {
    p,
    width,
    compact,
    height: compact ? 226 : 210,
    atoms,
    credits,
    waters,
    mn,
    atomMove,
    electronMove,
    phase,
    endpoint: p >= 0.92,
    manganeseReduced: phase === 'acceptor',
    relativeLedger: {
      donorChange,
      inTransit,
      acceptorCharge,
      total: donorChange + inTransit + acceptorCharge,
    },
    counts: { Mn: 1, O: 4, H: 8, equivalents: 5 },
  };
}
/** Chapter-relative presentation timings, matched to the measured bilingual recordings.
 * The 0.45 s speech lead-in is included. These are net-account cues, not reaction rates.
 */
export function hydrocarbonFilmState(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = clamp(Math.floor(chapter), 0, 7),
    time = clamp(chapterTime, 0, HYDROCARBON_SECONDS[c]);
  const legacy = hydrocarbonDirector(c, time / HYDROCARBON_SECONDS[c]);
  let shot: OxidationShot = 'observation',
    net = 0,
    netElectrons = 0,
    reveal = false,
    budgetProgress = 0,
    electrons = 5;
  if (c === 1) {
    const cuts =
      locale === 'zh'
        ? {
            net: 3.3,
            move: 5.3,
            receive: 6.45,
            reduced: 8.75,
            oxygen: 9.8,
            end: 15.55,
            question: 20.1,
            reveal: 27.7,
            budgetEnd: 29.4,
            contrast: 33.1,
          }
        : {
            net: 3.4,
            move: 5.5,
            receive: 6.6,
            reduced: 9.4,
            oxygen: 10.9,
            end: 16.0,
            question: 21.1,
            reveal: 29.2,
            budgetEnd: 30.5,
            contrast: 33.4,
          };
    shot =
      time < cuts.net
        ? 'observation'
        : time < cuts.question
          ? 'net'
          : time < cuts.reveal
            ? 'question'
            : time < cuts.contrast
              ? 'budget'
              : 'contrast';
    // Preserve the original O/H paths while giving the electron ledger its own cue.
    net =
      time < cuts.oxygen
        ? 0.34 * between(time, cuts.move, cuts.oxygen)
        : 0.34 + 0.66 * between(time, cuts.oxygen, cuts.end);
    netElectrons = 0.55 * between(time, cuts.receive, cuts.reduced);
    reveal = time >= cuts.reveal;
    budgetProgress = between(time, cuts.reveal, cuts.budgetEnd);
    electrons = time >= cuts.question ? 4 : 5;
  }
  // Retained speech names the completed addition well before the chapter ends.
  // Hold that endpoint during the explanation instead of continuing to fade bonds.
  const exposure =
    c === 2
      ? between(time, 4.2, 9.2)
      : c === 3
        ? between(time, locale === 'zh' ? 2.1 : 1.9, locale === 'zh' ? 11.5 : 12.0)
        : legacy.exposure;
  return { ...legacy, exposure, time, shot, net, netElectrons, reveal, budgetProgress, electrons };
}
