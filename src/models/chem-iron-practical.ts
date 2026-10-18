/** PEP Required 1 p90. Net-composition and electron-credit explanations, not kinetics.
 * Phase paths preserve identities; credits are an accounting rail, not solvated electrons.
 * MnO4 reduction is the declared acidic Mn(II) branch. No pH/speciation solver is implied. */
export const IRON_PRACTICAL_CASES = [
  'iron-copper',
  'ferric-copper',
  'ferric-iodide',
  'ferrous-zinc',
  'permanganate',
  'ferric-test',
  'iron-test',
] as const;
export type IronPracticalCase = (typeof IRON_PRACTICAL_CASES)[number];
export const PRACTICAL_IDS = [
  'iron-displaces-copper',
  'ferric-attacks-copper',
  'iodide-starch',
  'zinc-reduces-iron',
  'permanganate-then-test',
  'ferric-positive',
  'iron-before-test',
] as const;
export const PRACTICAL_SECONDS = [26, 29, 28, 26, 38, 25, 35] as const;
export const practicalBound = (x: number, lo = 0, hi = 1, fallback = lo) =>
  Math.max(lo, Math.min(hi, Number.isFinite(x) ? x : fallback));
export const practicalEase = (x: number) => {
  const p = practicalBound(x);
  return p * p * (3 - 2 * p);
};
export const practicalRamp = (t: number, a: number, b: number) =>
  practicalEase((t - a) / Math.max(0.001, b - a));
const index = (chapter: number) => Math.floor(practicalBound(chapter, 0, 6));
export type PracticalSpecies =
  | 'Fe0'
  | 'FeII'
  | 'FeIII'
  | 'Cu0'
  | 'CuII'
  | 'Zn0'
  | 'ZnII'
  | 'Iminus'
  | 'I2'
  | 'MnO4'
  | 'MnII'
  | 'Hplus'
  | 'water'
  | 'SCN'
  | 'FeSCN';
export type PracticalComposition = Partial<Record<PracticalSpecies, number>>;
export const PRACTICAL_SPECIES: Record<
  PracticalSpecies,
  { label: string; charge: number; atoms: Record<string, number> }
> = {
  Fe0: { label: 'Fe', charge: 0, atoms: { Fe: 1 } },
  FeII: { label: 'Fe²⁺', charge: 2, atoms: { Fe: 1 } },
  FeIII: { label: 'Fe³⁺', charge: 3, atoms: { Fe: 1 } },
  Cu0: { label: 'Cu', charge: 0, atoms: { Cu: 1 } },
  CuII: { label: 'Cu²⁺', charge: 2, atoms: { Cu: 1 } },
  Zn0: { label: 'Zn', charge: 0, atoms: { Zn: 1 } },
  ZnII: { label: 'Zn²⁺', charge: 2, atoms: { Zn: 1 } },
  Iminus: { label: 'I⁻', charge: -1, atoms: { I: 1 } },
  I2: { label: 'I₂', charge: 0, atoms: { I: 2 } },
  MnO4: { label: 'MnO₄⁻', charge: -1, atoms: { Mn: 1, O: 4 } },
  MnII: { label: 'Mn²⁺', charge: 2, atoms: { Mn: 1 } },
  Hplus: { label: 'H⁺', charge: 1, atoms: { H: 1 } },
  water: { label: 'H₂O', charge: 0, atoms: { H: 2, O: 1 } },
  SCN: { label: 'SCN⁻', charge: -1, atoms: { S: 1, C: 1, N: 1 } },
  FeSCN: { label: 'FeSCN²⁺', charge: 2, atoms: { Fe: 1, S: 1, C: 1, N: 1 } },
};
export const PRACTICAL_REACTIONS: readonly {
  before: PracticalComposition;
  after: PracticalComposition;
  electrons: number;
}[] = [
  { before: { Fe0: 1, CuII: 1 }, after: { FeII: 1, Cu0: 1 }, electrons: 2 },
  { before: { FeIII: 2, Cu0: 1 }, after: { FeII: 2, CuII: 1 }, electrons: 2 },
  { before: { FeIII: 2, Iminus: 2 }, after: { FeII: 2, I2: 1 }, electrons: 2 },
  { before: { FeII: 1, Zn0: 1 }, after: { Fe0: 1, ZnII: 1 }, electrons: 2 },
  { before: { FeII: 5, MnO4: 1, Hplus: 8 }, after: { FeIII: 5, MnII: 1, water: 4 }, electrons: 5 },
  // One selected ligand-binding event, not the distribution of an entire solution.
  { before: { FeIII: 1, SCN: 1 }, after: { FeSCN: 1 }, electrons: 0 },
  { before: { FeIII: 2, Fe0: 1 }, after: { FeII: 3 }, electrons: 2 },
];
const RECIPES: readonly (readonly PracticalComposition[])[] = [
  [{ Fe0: 1, CuII: 1 }, { Fe0: 1, CuII: 2 }, { CuII: 1 }],
  [{ FeIII: 2, Cu0: 1 }, { FeIII: 4, Cu0: 1 }, { FeIII: 2 }],
  [{ FeIII: 2, Iminus: 3 }, { FeIII: 2, Iminus: 4 }, { FeIII: 2 }],
  [{ FeII: 1, Zn0: 1 }, { FeII: 2, Zn0: 1 }, { FeII: 1 }],
  [
    { FeII: 5, MnO4: 1, Hplus: 8 },
    { FeII: 5, MnO4: 2, Hplus: 16 },
    { FeII: 10, MnO4: 1, Hplus: 8 },
  ],
  [{ FeIII: 1, SCN: 1 }, { FeIII: 1 }, { FeII: 1, SCN: 1 }],
  [
    { FeIII: 5, Fe0: 1 },
    { FeIII: 2, Fe0: 1 },
    { FeIII: 5, Fe0: 2 },
  ],
];
export function practicalRecipe(chapter: number, preset = 0): PracticalComposition {
  return { ...RECIPES[index(chapter)]![Math.floor(practicalBound(preset, 0, 2))]! };
}
export function practicalTotals(composition: PracticalComposition) {
  const atoms: Record<string, number> = {
    Fe: 0,
    Cu: 0,
    Zn: 0,
    I: 0,
    Mn: 0,
    O: 0,
    H: 0,
    S: 0,
    C: 0,
    N: 0,
  };
  let charge = 0;
  for (const [key, raw] of Object.entries(composition)) {
    const n = Number.isFinite(raw) ? raw : 0,
      s = PRACTICAL_SPECIES[key as PracticalSpecies];
    if (!s) continue;
    charge += n * s.charge;
    for (const [a, k] of Object.entries(s.atoms)) atoms[a] = (atoms[a] ?? 0) + n * k;
  }
  return { atoms, charge };
}
export function practicalNet(
  chapter: number,
  progress = 1,
  preset = 0,
  initial?: PracticalComposition,
) {
  const c = index(chapter),
    r = PRACTICAL_REACTIONS[c]!,
    start: PracticalComposition = {};
  for (const [k, v] of Object.entries(initial ?? practicalRecipe(c, preset)))
    if (k in PRACTICAL_SPECIES) start[k as PracticalSpecies] = practicalBound(v ?? 0, 0, 40);
  const maxExtent = Math.max(
    0,
    Math.min(...Object.entries(r.before).map(([k, n]) => (start[k as PracticalSpecies] ?? 0) / n!)),
  );
  const extent = maxExtent * practicalBound(progress),
    state = { ...start };
  for (const [k, n] of Object.entries(r.before))
    state[k as PracticalSpecies] = (state[k as PracticalSpecies] ?? 0) - extent * n!;
  for (const [k, n] of Object.entries(r.after))
    state[k as PracticalSpecies] = (state[k as PracticalSpecies] ?? 0) + extent * n!;
  return {
    chapter: c,
    start,
    state,
    extent,
    maxExtent,
    electronCredits: extent * r.electrons,
    before: practicalTotals(start),
    after: practicalTotals(state),
    acidicBranch: c === 4,
    omittedAcidPath: c === 4 && (start.Hplus ?? 0) === 0,
  };
}
export type PracticalPoint = { x: number; y: number };
export type PracticalActor = {
  id: string;
  element: 'Fe' | 'Cu' | 'Zn' | 'I';
  before: number;
  after: number;
  from: PracticalPoint;
  to: PracticalPoint;
  phaseBefore: 'solid' | 'water';
  phaseAfter: 'solid' | 'water';
  donates: number;
  receives: number;
};
/** Integer event recipes deliberately avoid fractional pictured atoms. All counts come from this recipe. */
function actorsFor(chapter: number, preset: number, width: number) {
  const c = index(chapter),
    net = practicalNet(c, 1, preset),
    w = practicalBound(width, 248, 760, 268),
    phone = w < 440,
    left = phone ? 48 : 140,
    right = phone ? w - 48 : w - 140,
    actors: PracticalActor[] = [];
  const atom = (
    element: PracticalActor['element'],
    n: number,
    charge: number,
    targetCharge: number,
    changed: number,
    side: 'left' | 'right',
    metal = false,
    donates = 0,
    receives = 0,
  ) => {
    for (let i = 0; i < n; i++) {
      const col = i % 3,
        row = Math.floor(i / 3),
        x =
          n === 1
            ? side === 'left'
              ? left
              : right
            : (side === 'left' ? left : right) + (col - Math.min(2, n - 1) / 2) * (phone ? 26 : 42),
        y = metal ? 132 + row * 27 : 86 + row * 32;
      const isChanged = i < changed,
        after = isChanged ? targetCharge : charge;
      const phaseBefore = metal ? 'solid' : 'water',
        phaseAfter = after === 0 && element !== 'I' ? 'solid' : 'water';
      const to = {
        x:
          phaseBefore === phaseAfter
            ? x
            : phaseAfter === 'solid'
              ? left + 16 + col * 20
              : x + (side === 'left' ? (phone ? 43 : 75) : -(phone ? 43 : 75)),
        y: phaseBefore === phaseAfter ? y : phaseAfter === 'water' ? 68 + row * 30 : 145 + row * 27,
      };
      actors.push({
        id: `p${c}-r${preset}-${element}-${i}`,
        element,
        before: charge,
        after,
        from: { x, y },
        to,
        phaseBefore,
        phaseAfter,
        donates: isChanged ? donates : 0,
        receives: isChanged ? receives : 0,
      });
    }
  };
  const n = net.maxExtent,
    s = net.start;
  if (c === 0) {
    atom('Fe', s.Fe0 ?? 0, 0, 2, n, 'left', true, 2);
    atom('Cu', s.CuII ?? 0, 2, 0, n, 'right', false, 0, 2);
  }
  if (c === 1) {
    atom('Cu', s.Cu0 ?? 0, 0, 2, n, 'left', true, 2);
    atom('Fe', s.FeIII ?? 0, 3, 2, 2 * n, 'right', false, 0, 1);
  }
  if (c === 2) {
    atom('I', s.Iminus ?? 0, -1, 0, 2 * n, 'left', false, 1);
    atom('Fe', s.FeIII ?? 0, 3, 2, 2 * n, 'right', false, 0, 1);
  }
  if (c === 3) {
    atom('Zn', s.Zn0 ?? 0, 0, 2, n, 'left', true, 2);
    atom('Fe', s.FeII ?? 0, 2, 0, n, 'right', false, 0, 2);
  }
  if (c === 4) atom('Fe', s.FeII ?? 0, 2, 3, 5 * n, 'left', false, 1);
  if (c === 5)
    atom('Fe', (s.FeIII ?? 0) + (s.FeII ?? 0), s.FeIII ? 3 : 2, s.FeIII ? 3 : 2, 0, 'left');
  if (c === 6) {
    atom('Fe', s.Fe0 ?? 0, 0, 2, n, 'left', true, 2);
    const beforeCount = actors.length;
    atom('Fe', s.FeIII ?? 0, 3, 2, 2 * n, 'right', false, 0, 1);
    for (let i = beforeCount; i < actors.length; i++)
      actors[i]!.id = `p6-r${preset}-Fe-ion-${i - beforeCount}`;
  }
  return { actors, net, width: w };
}
export type PracticalMotion = { donor: number; receiver: number };
export function practicalFrame(
  chapter: number,
  progress = 0,
  preset = 0,
  width = 268,
  motion?: PracticalMotion,
) {
  const c = index(chapter),
    recipe = Math.floor(practicalBound(preset, 0, 2)),
    p = practicalBound(progress),
    base = actorsFor(c, recipe, width);
  const departed = p >= 0.16,
    arrived = p >= 0.68,
    travel = practicalRamp(p, 0.16, 0.68),
    movement = practicalRamp(p, 0.16, 0.92);
  const donors = base.actors.flatMap((a) =>
      Array.from({ length: a.donates }, (_, i) => ({ id: `${a.id}-e${i}`, actor: a, ordinal: i })),
    ),
    receivers = base.actors.flatMap((a) => Array.from({ length: a.receives }, () => a));
  const credits = donors.map((d, i) => {
    const receiver = receivers[i],
      same = receiver ? receivers.filter((a) => a.id === receiver.id) : [],
      ordinal = receiver ? receivers.slice(0, i).filter((a) => a.id === receiver.id).length : 0,
      from = { x: d.actor.from.x, y: 48 + (i % 2) * 11 },
      to = receiver
        ? {
            x: receiver.from.x + (ordinal - (same.length - 1) / 2) * 11,
            y: 48 + (receiver.from.y > 100 ? 11 : 0),
          }
        : {
            x:
              (base.width < 440 ? base.width - 48 : base.width - 140) +
              (i - (donors.length - 1) / 2) * 11,
            y: 54,
          };
    return {
      id: d.id,
      donorId: d.actor.id,
      receiverId: receiver?.id ?? `p4-r${recipe}-acidic-acceptor`,
      phase: arrived ? 'received' : departed ? 'transit' : 'donor',
      x: from.x + (to.x - from.x) * travel,
      y: from.y + (to.y - from.y) * travel - Math.sin(Math.PI * travel) * 12,
    };
  });
  const actors = base.actors.map((a) => {
    const changed = (a.donates > 0 && departed) || (a.receives > 0 && arrived),
      moving = a.phaseBefore !== a.phaseAfter && changed;
    // Spatial presentation may follow each spoken subject separately. Charge changes still
    // gate departure/arrival, so a neutral receiver never deposits before its credits arrive.
    const m = moving
      ? motion
        ? practicalBound(a.donates > 0 ? motion.donor : motion.receiver)
        : movement
      : 0;
    return {
      ...a,
      x: a.from.x + (a.to.x - a.from.x) * m,
      y: a.from.y + (a.to.y - a.from.y) * m,
      formalCharge: changed ? a.after : a.before,
      phase: (!moving || m <= 0 ? a.phaseBefore : m >= 1 ? a.phaseAfter : 'transfer') as
        'solid' | 'water' | 'transfer',
      changed,
    };
  });
  // For MnO4, charge belongs to the entire declared acceptor packet (MnO4 + 8H), never Mn(VII) as a bare ion.
  const extraCharge =
    c === 4
      ? (base.net.start.MnO4 ?? 0) * -1 +
        (base.net.start.Hplus ?? 0) -
        (arrived ? credits.length : 0)
      : c === 5
        ? -(base.net.start.SCN ?? 0)
        : 0;
  const creditCharge = -credits.filter((e) => e.phase === 'transit').length;
  const charge = actors.reduce((s, a) => s + a.formalCharge, 0) + extraCharge + creditCharge;
  const ironPhases = { solid: 0, water: 0, transfer: 0 };
  for (const a of actors) if (a.element === 'Fe') ironPhases[a.phase]++;
  return {
    ...base,
    chapter: c,
    preset: recipe,
    progress: p,
    actors,
    credits,
    departed,
    arrived,
    charge,
    initialCharge: base.net.before.charge,
    creditCharge,
    acceptorCharge: extraCharge,
    ironPhases,
    netExtent: base.net.maxExtent * (arrived ? 1 : 0),
    limits:
      'A net electron-credit event. Transfer paths and timing are not a microscopic rate or mechanism.',
  };
}
/** A selected acidic NET atom allocation. H labels are proton equivalents; solvent waters omitted.
 * Every Mn/O/H ID persists. Endpoint identity allocation is not an isotope/elementary-mechanism claim. */
export function practicalAcidAtoms(progress: number, width = 268) {
  const p = practicalBound(progress),
    w = practicalBound(width, 248, 760, 268),
    phone = w < 440,
    center = { x: w * 0.5, y: 65 },
    r = phone ? 32 : 46;
  const atoms: {
    id: string;
    element: 'Mn' | 'O' | 'H';
    x: number;
    y: number;
    from: PracticalPoint;
    to: PracticalPoint;
    group: string;
  }[] = [];
  const add = (
    id: string,
    element: 'Mn' | 'O' | 'H',
    from: PracticalPoint,
    to: PracticalPoint,
    group: string,
  ) => {
    // Separate display lanes prevent a tracked hydrogen from passing through an oxygen.
    // This is a legible net allocation, not an elementary reaction order.
    const q = element === 'H' ? practicalRamp(p, 0.55, 0.92) : practicalRamp(p, 0.12, 0.55);
    atoms.push({
      id,
      element,
      from,
      to,
      group: p < 0.94 ? 'net-transfer' : group,
      x: from.x + (to.x - from.x) * q,
      y: from.y + (to.y - from.y) * q,
    });
  };
  add('acid-Mn', 'Mn', center, { x: w / 2, y: 50 }, 'MnII');
  for (let i = 0; i < 4; i++) {
    const from = {
        x: center.x + (i % 2 === 0 ? -1 : 1) * r * 0.8,
        y: center.y + (i < 2 ? -1 : 1) * r * 0.8,
      },
      wx = i % 2 === 0 ? w * 0.25 : w * 0.75,
      wy = 125 + Math.floor(i / 2) * 61;
    add(`acid-O${i}`, 'O', from, { x: wx, y: wy }, `water${i}`);
    for (let j = 0; j < 2; j++) {
      const k = i * 2 + j;
      const columns = [22, w / 2 - 14, w / 2 + 14, w - 22];
      const hf = { x: columns[k % 4]!, y: 151 + Math.floor(k / 4) * 35 };
      add(`acid-H${k}`, 'H', hf, { x: wx + (j ? 19 : -19), y: wy + 13 }, `water${i}`);
    }
  }
  return {
    width: w,
    progress: p,
    atoms,
    mnO: practicalBound(1 - p / 0.25),
    waterBond: practicalRamp(p, 0.8, 0.94),
    chargeBefore: 7,
    receivedCredits: 5,
    chargeAfter: 2,
    atomCounts: { Mn: 1, O: 4, H: 8 },
  };
}
export function practicalIndicator(
  chapter: number,
  preset: number,
  progress: number,
  test: boolean,
) {
  const net = practicalNet(chapter, progress, preset),
    s = net.state,
    c = index(chapter),
    pending = c === 4 && (s.MnO4 ?? 0) > 1e-9;
  const permitted = test && progress >= 0.999 && !pending,
    feIII = (s.FeIII ?? 0) + (s.FeSCN ?? 0);
  return {
    test: permitted,
    requested: test,
    reactionPending: progress < 0.999,
    pending,
    red: permitted && [4, 5, 6].includes(c) && feIII > 1e-9,
    blue: permitted && c === 2 && (s.I2 ?? 0) > 1e-9 && (s.Iminus ?? 0) > 1e-9,
    ironII: s.FeII ?? 0,
    ironIII: feIII,
    iodine: s.I2 ?? 0,
    iodide: s.Iminus ?? 0,
  };
}
export const PRACTICAL_ROUTES = [
  { from: 0, to: 2, partner: 'Cu²⁺' },
  { from: 3, to: 2, partner: 'Cu' },
  { from: 3, to: 2, partner: 'I⁻' },
  { from: 2, to: 0, partner: 'Zn' },
  { from: 2, to: 3, partner: 'MnO₄⁻ / H⁺' },
  { from: 3, to: 3, partner: 'SCN⁻' },
  { from: 3, to: 2, partner: 'Fe' },
] as const;
export function practicalRoutes(chapter: number, reveal = false) {
  const c = index(chapter);
  return PRACTICAL_ROUTES.slice(0, c + (reveal ? 1 : 0)).map((r, i) => ({
    ...r,
    chapter: i,
    kind: r.from === r.to ? 'coordination' : 'redox',
  }));
}
export type PracticalShot =
  'surface' | 'predict' | 'transfer' | 'iodine' | 'acid' | 'test' | 'binding' | 'map';
/** Recorded chapter seconds (words are cue-relative + 0.45 s): batch-11-timed-speech.
 * Separate spatial holds follow the named species, not a claim about microscopic residence times. */
export function practicalFilm(chapter: number, time: number, locale = 'zh') {
  const c = index(chapter),
    t = practicalBound(time, 0, PRACTICAL_SECONDS[c]!),
    language = locale === 'en' ? 'en' : 'zh',
    en = language === 'en';
  let shot: PracticalShot = 'transfer',
    progress = 0,
    prediction = false,
    reveal = false,
    test = false;
  let motion: PracticalMotion = { donor: 0, receiver: 0 };
  const ramp = (a: number, b: number) => practicalRamp(t, a, b);
  const stage = (knots: readonly (readonly [number, number])[]) => {
    if (t <= knots[0]![0]) return knots[0]![1];
    for (let i = 1; i < knots.length; i++) {
      const [tb, pb] = knots[i]!,
        [ta, pa] = knots[i - 1]!;
      if (t < tb) return pa + (pb - pa) * ramp(ta, tb);
    }
    return knots.at(-1)![1];
  };
  const transfer = (depart: number, arrive: number, donorEnd: number, receiverEnd: number) => {
    progress = stage([
      [depart - 1, 0],
      [depart, 0.16],
      [arrive, 0.68],
      [Math.max(donorEnd, receiverEnd), 1],
    ]);
    motion = { donor: ramp(depart, donorEnd), receiver: ramp(arrive, receiverEnd) };
  };
  if (c === 0) {
    const follow = en ? 4.07 : 3.91,
      map = en ? 14.57 : 14.25;
    shot = t < follow ? 'surface' : t < map ? 'transfer' : 'map';
    transfer(en ? 6.35 : 5.85, en ? 11.8 : 11.1, en ? 9.95 : 9.25, en ? 14.15 : 13.85);
    reveal = t >= map;
  }
  if (c === 1) {
    const begin = en ? 6.73 : 7.05,
      map = en ? 16.49 : 15.29;
    shot = t < begin ? 'predict' : t < map ? 'transfer' : 'map';
    transfer(en ? 8.2 : 8.35, en ? 12.1 : 11.25, en ? 16.15 : 14.9, en ? 13.95 : 12.9);
    prediction = t < begin;
    reveal = t >= map;
  }
  if (c === 2) {
    const iodine = en ? 9.87 : 9.83;
    shot = t < iodine ? 'transfer' : t < 25 ? 'iodine' : 'map';
    transfer(en ? 4.5 : 5.1, en ? 8.5 : 8.4, 9.4, 9.5);
    test = t >= (en ? 12.65 : 11.25);
    reveal = t >= 25;
  }
  if (c === 3) {
    const begin = en ? 6.55 : 7.45,
      map = en ? 14.87 : 15.31;
    shot = t < begin ? 'predict' : t < map ? 'transfer' : 'map';
    transfer(en ? 7.05 : 7.85, en ? 9.55 : 10.1, en ? 9.4 : 9.8, en ? 14.55 : 14.85);
    prediction = t < begin;
    reveal = t >= map;
  }
  if (c === 4) {
    const acid = en ? 10.29 : 10.41,
      laterTest = en ? 19.55 : 17.65,
      map = en ? 22.67 : 21.43;
    shot = t < acid ? 'transfer' : t < laterTest ? 'acid' : t < map ? 'test' : 'map';
    transfer(en ? 6.2 : 6.05, en ? 8.65 : 8.8, 10.1, 10.2);
    if (shot === 'acid')
      progress = en
        ? stage([
            [10.29, 0],
            [12.5, 0.12],
            [14.65, 0.55],
            [17.25, 0.94],
            [17.55, 1],
          ])
        : stage([
            [10.41, 0],
            [12.1, 0.12],
            [13.6, 0.55],
            [16.1, 0.94],
            [16.5, 1],
          ]);
    test = t >= (en ? 20.5 : 19.2);
    reveal = t >= map;
  }
  if (c === 5) {
    const ask = en ? 9.43 : 8.29;
    shot = t < ask ? 'binding' : t < 12.07 ? 'predict' : 'map';
    progress = en ? ramp(3.55, 6.7) : ramp(2.75, 6.95);
    prediction = t >= ask && t < 12.07;
    test = t >= (en ? 5.15 : 4.9);
    reveal = t >= 12.07;
  }
  if (c === 6) {
    const begin = en ? 9.55 : 7.39,
      laterTest = en ? 21.27 : 18.27,
      map = en ? 23.75 : 21.75;
    shot = t < begin ? 'predict' : t < laterTest ? 'transfer' : t < map ? 'test' : 'map';
    transfer(en ? 10.15 : 8.3, en ? 13.3 : 10.8, en ? 16.35 : 13.85, en ? 16.6 : 14.1);
    prediction = t < begin;
    test = t >= (en ? 22.9 : 19.9);
    reveal = t >= map;
  }
  return {
    chapter: c,
    time: t,
    locale: language,
    shot,
    progress,
    motion,
    preset: 0,
    prediction,
    reveal,
    test,
    timing: 'measured' as const,
  };
}
export const IRON_PRACTICAL_EQUATIONS: Record<IronPracticalCase, string> = {
  'iron-copper': 'Fe + Cu²⁺ → Fe²⁺ + Cu',
  'ferric-copper': '2Fe³⁺ + Cu → 2Fe²⁺ + Cu²⁺',
  'ferric-iodide': '2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂',
  'ferrous-zinc': 'Fe²⁺ + Zn → Fe + Zn²⁺',
  permanganate: '5Fe²⁺ + MnO₄⁻ + 8H⁺ → 5Fe³⁺ + Mn²⁺ + 4H₂O',
  'ferric-test': 'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺',
  'iron-test': '2Fe³⁺ + Fe → 3Fe²⁺',
};
/** Compatibility adapter for historical consumers, with explicit finite guards. New artwork uses event recipes. */
export function ironPractical(kind: IronPracticalCase, extent = 1, partner = 1, test = true) {
  const c = Math.max(0, IRON_PRACTICAL_CASES.indexOf(kind)),
    a = practicalBound(partner, 0, 2),
    p = practicalBound(extent);
  const starts: PracticalComposition[] = [
    { Fe0: 1, CuII: a },
    { FeIII: 1, Cu0: a / 2 },
    { FeIII: 1, Iminus: a },
    { FeII: 1, Zn0: a },
    { FeII: 1, MnO4: a / 5, Hplus: 8 },
    { FeIII: 1, SCN: test ? 1 : 0 },
    { FeIII: 1, Fe0: a / 2 },
  ];
  const m = practicalNet(c, p, 0, starts[c]),
    s = m.state,
    diagnostic = test && (c === 5 || c === 6 || (c === 4 && (s.MnO4 ?? 0) < 1e-10));
  const fe3 = (s.FeIII ?? 0) + (s.FeSCN ?? 0);
  return {
    kind: IRON_PRACTICAL_CASES[c]!,
    fe0: s.Fe0 ?? 0,
    fe2: s.FeII ?? 0,
    fe3,
    cu0: s.Cu0 ?? 0,
    cu2: s.CuII ?? 0,
    zn0: s.Zn0 ?? 0,
    zn2: s.ZnII ?? 0,
    iodide: s.Iminus ?? 0,
    iodine: s.I2 ?? 0,
    mn7: s.MnO4 ?? 0,
    mn2: s.MnII ?? 0,
    electrons: m.electronCredits,
    initialIron: m.before.atoms.Fe!,
    initialCopper: m.before.atoms.Cu!,
    initialZinc: m.before.atoms.Zn!,
    initialIodine: m.before.atoms.I!,
    initialManganese: m.before.atoms.Mn!,
    diagnostic,
    red: diagnostic ? 1 - Math.exp(-3 * fe3) : 0,
    starch: test && c === 2 && (s.I2 ?? 0) > 0,
    colourLimit: 'Qualitative only; not absorbance or a speciation calculation.',
  };
}
export function ironPracticalDirector(chapter: number, progress: number) {
  const c = index(chapter),
    p = practicalBound(progress),
    late = [2, 4, 6].includes(c);
  return {
    kind: IRON_PRACTICAL_CASES[c]!,
    extent: late ? Math.min(1, p / 0.65) : c === 5 ? 1 : p,
    partner: 1,
    test: c === 5 ? p > 0.15 : late ? p > 0.75 : false,
    progress: p,
  };
}

export function practicalBinding(progress: number, width = 268, preset = 0) {
  const w = practicalBound(width, 248, 760, 268),
    recipe = practicalRecipe(5, preset),
    p = practicalEase(progress),
    active = !!recipe.FeIII && !!recipe.SCN;
  const fe = { id: 'binding-Fe', x: w * 0.35, y: 96, oxidation: recipe.FeIII ? 3 : 2 };
  const ligand = {
    id: 'binding-SCN',
    present: !!recipe.SCN,
    x: w * 0.8 - (active ? w * 0.8 - (fe.x + 60) : 0) * p,
    y: 96,
  };
  const water = {
    id: 'binding-water',
    x: fe.x + 42 + (active ? 34 * p : 0),
    y: 96 - (active ? 50 * p : 0),
  };
  return {
    fe,
    ligand,
    water,
    active,
    progress: p,
    bound: active && p >= 1,
    red: active && p > 0.5,
    chargeBefore: (recipe.FeIII ? 3 : 2) - (recipe.SCN ? 1 : 0),
    centreOxidation: fe.oxidation,
  };
}
export function practicalRouteGeometry(chapter: number, reveal: boolean, width = 268) {
  const w = practicalBound(width, 248, 760, 268),
    nodes = [
      { oxidation: 0, x: w * 0.17, y: 106 },
      { oxidation: 2, x: w * 0.5, y: 106 },
      { oxidation: 3, x: w * 0.83, y: 106 },
    ];
  return {
    width: w,
    nodes,
    records: practicalRoutes(chapter, reveal).map((r) => {
      const a = nodes.find((n) => n.oxidation === r.from)!,
        b = nodes.find((n) => n.oxidation === r.to)!;
      return { ...r, fromPoint: a, toPoint: b, controlY: r.from < r.to ? 45 : 164 };
    }),
  };
}
