/** Food-test models: net chemical accounting, reversible phase exchange and a
 * coarse binding equilibrium. They do not predict assay kinetics or nutrition. */
export const foodChapters = [
  'reducing-sugar',
  'negative-control',
  'stain',
  'wash',
  'protein',
] as const;
export type FoodChapter = (typeof foodChapters)[number];
export type SugarCase = 'glucose' | 'fructose' | 'sucrose' | 'hydrolyzed';
export type Point = { x: number; y: number };
export const clamp01 = (x: number) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
export const smooth = (x: number) => {
  const p = clamp01(x);
  return p * p * (3 - 2 * p);
};
export const foodRamp = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
/** Shared visual anchors in chapter seconds, checked against both recorded voices.
 * The chemical models keep their own progress variables; changing a chapter's
 * trailing narration must not stretch a reaction or delay its evidence. */
export function foodDirector(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const time = Math.max(0, Number.isFinite(chapterTime) ? chapterTime : 0);
  const shot =
    chapter === 0
      ? time < 7.8 || time >= 28.5
        ? 'sugar-observation'
        : 'copper'
      : chapter === 1
        ? time < 4.2
          ? 'sucrose-observation'
          : time < 10.8
            ? 'glucose'
            : time < 15
              ? 'sucrose'
              : time < 20.9
                ? 'hydrolysis'
                : 'sugar-prediction'
        : chapter === 2
          ? time >= 3 && time < 7.8
            ? 'dye-affinity'
            : 'dye-exchange'
          : chapter === 3
            ? 'rinse'
            : time < 6.6
              ? 'protein-observation'
              : time < 25
                ? 'peptide'
                : 'three-causes';
  return {
    shot,
    copperProgress: foodRamp(time, 7.8, 22),
    observationProgress: foodRamp(time, 0.3, 5.5),
    glucoseOpening: foodRamp(time, 5.7, 9),
    hydrolysisProgress: foodRamp(time, 15, 19.8),
    predictionProgress: foodRamp(time, 20.9, 24),
    dyeTime: 18 * foodRamp(time, 8, 24),
    rinseTime: time < 20 ? 2 * foodRamp(time, 7.8, 15) : 2 + 16 * foodRamp(time, 20, 26),
    peptideProgress: foodRamp(time, 9, 17),
    causeIndex:
      time < (locale === 'zh' ? 26.6 : 29.7) ? 0 : time < (locale === 'zh' ? 28.5 : 31.5) ? 1 : 2,
  };
}
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const mixPoint = (a: Point, b: Point, p: number): Point => ({
  x: mix(a.x, b.x, p),
  y: mix(a.y, b.y, p),
});

export function assayEvidence(
  sample: SugarCase | 'water',
  controlsValid = true,
  hydrolysisProgress = 1,
) {
  const reducing =
    sample !== 'water' && graphFreeCenters(sugarGraph(sample, hydrolysisProgress)).length > 0;
  return {
    reducing,
    result: !controlsValid
      ? ('inconclusive' as const)
      : reducing
        ? ('positive' as const)
        : ('negative' as const),
    sugarPresent: sample !== 'water',
  };
}

/** A copper endpoint ledger, NOT a per-sugar yield or an elementary mechanism. */
export function copperNetLedger(extent: number, totalUnits = 6) {
  const n = Math.max(0, Math.floor(totalUnits));
  const completedUnits = Array.from({ length: n }, (_, i) => i).filter(
    (i) => clamp01(extent) >= 0.45 + i * 0.07,
  ).length;
  return {
    totalCopper: n * 2,
    reagentCopperII: (n - completedUnits) * 2,
    solidCopperI: completedUnits * 2,
    oxideOxygen: completedUnits,
    netElectronsAccepted: completedUnits * 2,
    productUnits: completedUnits,
  };
}
export function copperMapping(id: number, progress: number) {
  const unit = Math.floor(id / 2),
    side = id % 2;
  const a = { x: 40 + (id % 3) * 31, y: 57 + Math.floor(id / 3) * 29 };
  const center = { x: 234 + (unit % 2) * 65, y: 59 + Math.floor(unit / 2) * 46 };
  const b = { x: center.x + (side ? 15 : -15), y: center.y + (side ? -7 : 7) };
  const phase = foodRamp(progress, 0.1 + unit * 0.07, 0.45 + unit * 0.07);
  return { id, a, b, point: mixPoint(a, b, phase), phase, product: phase >= 1, oxygen: center };
}

type Atom = Point & { id: string; element: 'C' | 'O' | 'H'; label?: string };
type Bond = { a: string; b: string; order?: number; role?: 'ring' | 'glycosidic' | 'hydrolysis' };
export type SugarGraph = {
  atoms: Atom[];
  bonds: Bond[];
  anomeric: string[];
  freeCenters: string[];
};
function glucoseRing(cx: number, cy: number, r: number): SugarGraph {
  const vertices = ['G1', 'G2', 'G3', 'G4', 'G5', 'GO5'];
  const atoms: Atom[] = vertices.map((id, i) => ({
    id,
    element: id === 'GO5' ? 'O' : 'C',
    x: cx + r * Math.cos((i * Math.PI) / 3),
    y: cy + r * Math.sin((i * Math.PI) / 3),
    label: id === 'GO5' ? 'O' : undefined,
  }));
  const c5 = atoms[4];
  atoms.push({ id: 'G6', element: 'C', x: c5.x - 10, y: c5.y - 27 });
  return {
    atoms,
    bonds: [
      ...vertices.map((id, i) => ({ a: id, b: vertices[(i + 1) % 6], role: 'ring' as const })),
      { a: 'G5', b: 'G6' },
    ],
    anomeric: ['G1'],
    freeCenters: ['G1'],
  };
}
function fructoseRing(cx: number, cy: number, r: number): SugarGraph {
  const ids = ['F2', 'F3', 'F4', 'F5', 'FO5'];
  const atoms: Atom[] = ids.map((id, i) => ({
    id,
    element: id === 'FO5' ? 'O' : 'C',
    x: cx + r * Math.cos(Math.PI - (i * 2 * Math.PI) / 5),
    y: cy + r * Math.sin(Math.PI - (i * 2 * Math.PI) / 5),
    label: id === 'FO5' ? 'O' : undefined,
  }));
  atoms.push(
    { id: 'F1', element: 'C', x: atoms[0].x - 8, y: atoms[0].y - 29 },
    { id: 'F6', element: 'C', x: atoms[3].x + 14, y: atoms[3].y - 25 },
  );
  return {
    atoms,
    bonds: [
      ...ids.map((id, i) => ({ a: id, b: ids[(i + 1) % 5], role: 'ring' as const })),
      { a: 'F2', b: 'F1' },
      { a: 'F5', b: 'F6' },
    ],
    anomeric: ['F2'],
    freeCenters: ['F2'],
  };
}
/** The sugar view is a labelled skeleton: most side groups are intentionally omitted. */
export function sugarGraph(
  kind: SugarCase,
  hydrolysisProgress = 0,
  openingProgress = 0,
): SugarGraph {
  if (kind === 'glucose' || kind === 'fructose') {
    const g = kind === 'glucose' ? glucoseRing(165, 101, 51) : fructoseRing(180, 101, 51);
    const c = g.atoms.find((a) => a.id === g.anomeric[0])!;
    g.atoms.push({
      id: 'freeO',
      element: 'O',
      x: c.x + (kind === 'glucose' ? 38 : -38),
      y: c.y,
      label: 'OH',
    });
    g.bonds.push({ a: c.id, b: 'freeO' });
    if (kind === 'glucose' && openingProgress > 0) {
      const p = clamp01(openingProgress);
      const targets: Record<string, Point> = {
        G1: { x: 265, y: 82 },
        G2: { x: 225, y: 105 },
        G3: { x: 185, y: 82 },
        G4: { x: 145, y: 105 },
        G5: { x: 105, y: 82 },
        G6: { x: 65, y: 105 },
        GO5: { x: 105, y: 40 },
        freeO: { x: 302, y: 61 },
      };
      g.atoms = g.atoms.map((a) => ({
        ...a,
        ...mixPoint(a, targets[a.id], p),
        label: p > 0.5 && a.id === 'GO5' ? 'OH' : p > 0.5 && a.id === 'freeO' ? 'O' : a.label,
      }));
      if (p > 0.5) {
        g.bonds = g.bonds.filter((b) => !(b.a === 'GO5' && b.b === 'G1'));
        g.bonds = g.bonds.map((b) => (b.b === 'freeO' ? { ...b, order: 2 } : b));
      }
    }
    return g;
  }
  const p = kind === 'hydrolyzed' ? clamp01(hydrolysisProgress) : 0;
  const a = glucoseRing(91 - 11 * p, 105, 38),
    b = fructoseRing(265 + 11 * p, 105, 38);
  // One valid net atom mapping: the original bridge oxygen stays on the glucose;
  // water oxygen goes to fructose. This is not an acid/enzyme elementary pathway.
  const atoms: Atom[] = [
    ...a.atoms,
    ...b.atoms,
    { id: 'bridgeO', element: 'O', x: mix(178, 143, p), y: 105, label: 'O' },
    {
      id: 'waterO',
      element: 'O',
      x: mix(178, 209, p),
      y: mix(36, 105, p),
      label: 'O',
    },
    { id: 'waterH1', element: 'H', x: mix(162, 153, p), y: mix(20, 93, p) },
    { id: 'waterH2', element: 'H', x: mix(194, 201, p), y: mix(20, 93, p) },
  ];
  const bonds: Bond[] = [...a.bonds, ...b.bonds, { a: 'G1', b: 'bridgeO', role: 'glycosidic' }];
  if (p < 0.5)
    bonds.push(
      { a: 'bridgeO', b: 'F2', role: 'glycosidic' },
      { a: 'waterO', b: 'waterH1' },
      { a: 'waterO', b: 'waterH2' },
    );
  else
    bonds.push(
      { a: 'F2', b: 'waterO', role: 'hydrolysis' },
      { a: 'bridgeO', b: 'waterH1' },
      { a: 'waterO', b: 'waterH2' },
    );
  return { atoms, bonds, anomeric: ['G1', 'F2'], freeCenters: p >= 0.5 ? ['G1', 'F2'] : [] };
}
export function graphFreeCenters(graph: SugarGraph) {
  return graph.anomeric.filter(
    (id) =>
      !graph.bonds.some((b) => {
        if (b.role !== 'glycosidic' || (b.a !== id && b.b !== id)) return false;
        const oxygen = b.a === id ? b.b : b.a;
        return graph.bonds.some(
          (c) =>
            c !== b &&
            c.role === 'glycosidic' &&
            ((c.a === oxygen && graph.anomeric.includes(c.b)) ||
              (c.b === oxygen && graph.anomeric.includes(c.a))),
        );
      }),
  );
}

export type DyeParameters = { K: number; Vb: number; Vl: number; k: number; q: number };
export const dyeParameters: DyeParameters = { K: 8, Vb: 4, Vl: 1, k: 0.6, q: 0 };
export type DyeState = { bath: number; lipid: number; collected: number };
/** Analytic two-compartment linear solution. Time and parameters are teaching units. */
export function partitionStateAt(
  time: number,
  initial: DyeState = { bath: 60, lipid: 0, collected: 0 },
  options: Partial<DyeParameters> = {},
) {
  const p = { ...dyeParameters, ...options };
  const t = Math.max(0, Number.isFinite(time) ? time : 0);
  const total = initial.bath + initial.lipid + initial.collected;
  if (p.Vb <= 0 || p.K <= 0 || p.k < 0 || p.q < 0 || p.Vl < 0)
    throw new RangeError('Invalid phase-exchange parameter');
  if (p.Vl === 0) {
    const bath = initial.bath * Math.exp((-p.q / p.Vb) * t);
    return { bath, lipid: initial.lipid, collected: total - bath - initial.lipid };
  }
  const a = p.k / p.Vb,
    b = p.k / (p.K * p.Vl),
    r = p.q / p.Vb;
  const half = -(a + r + b) / 2;
  const d = Math.sqrt(Math.max(0, half * half - b * r));
  // exp(half*t)cosh(dt) and exp(half*t)sinh(dt)/d, evaluated without overflow.
  const hi = Math.exp((half + d) * t),
    lo = Math.exp((half - d) * t);
  const C = (hi + lo) / 2,
    S = d < 1e-12 ? t * Math.exp(half * t) : (hi - lo) / (2 * d);
  const bath = Math.max(
    0,
    C * initial.bath + S * ((-a - r - half) * initial.bath + b * initial.lipid),
  );
  const lipid = Math.max(
    0,
    C * initial.lipid + S * (a * initial.bath + (-b - half) * initial.lipid),
  );
  return { bath, lipid, collected: Math.max(0, total - bath - lipid) };
}
export function partitionFluxes(state: DyeState, options: Partial<DyeParameters> = {}) {
  const p = { ...dyeParameters, ...options };
  const into = p.Vl > 0 ? (p.k * state.bath) / p.Vb : 0,
    out = p.Vl > 0 ? (p.k * state.lipid) / (p.K * p.Vl) : 0;
  return { into, out, net: into - out, carriedAway: (p.q * state.bath) / p.Vb };
}
export const stainEndpoint = 18;
export function dyeFilmState(time: number, rinsing = false) {
  return rinsing
    ? partitionStateAt(time, partitionStateAt(stainEndpoint), { q: 1 })
    : partitionStateAt(time);
}
const noise = (id: number) => {
  const n = Math.sin(id * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
export const lipidGeometry = { cx: 246, cy: 91, rx: 75, ry: 56 };
function bathAnchor(id: number, event: number): Point {
  return { x: 23 + noise(id * 19 + event * 7) * 111, y: 37 + noise(id * 43 + event * 11) * 105 };
}
function lipidAnchor(id: number, event: number): Point {
  const angle = noise(id * 13 + event * 3) * Math.PI * 2,
    r = 0.25 + 0.5 * noise(id * 17 + event * 5);
  return {
    x: lipidGeometry.cx + Math.cos(angle) * lipidGeometry.rx * r,
    y: lipidGeometry.cy + Math.sin(angle) * lipidGeometry.ry * r,
  };
}
/** Stable illustrative tracer paths, independent from the quantitative amount ledger.
 * A two-state jump process has the same rates as the compartment model; short
 * continuous paths expose each transfer, rather than teleporting the marker. */
export function dyeTracer(
  id: number,
  elapsed: number,
  rinsing = false,
): Point & { id: number; phase: 'bath' | 'lipid' | 'collected' } {
  const end = Math.max(0, elapsed) + (rinsing ? stainEndpoint : 0);
  let time = 0,
    phase: 'bath' | 'lipid' | 'collected' = 'bath',
    point = bathAnchor(id, 0),
    event = 0;
  const wandering = (anchor: Point, t: number) => ({
    x: anchor.x + Math.sin(t * 1.2 + id) * 2,
    y: anchor.y + Math.cos(t * 0.9 + id) * 2,
  });
  while (event < 1000) {
    const rinseNow = rinsing && time >= stainEndpoint;
    const base = phase === 'bath' ? 0.15 : 0.075;
    const rate = base + (phase === 'bath' && rinseNow ? 0.25 : 0);
    const wait = -Math.log(Math.max(0.000001, noise(id * 31 + event * 97 + 8))) / rate;
    const next = time + wait;
    // The preset staining interval ends at the same state for standalone viewing
    // and direct entry to rinse. Resampling an exponential wait is memoryless.
    if (time < stainEndpoint && next > stainEndpoint) {
      if (end <= stainEndpoint) return { ...wandering(point, end), id, phase };
      time = stainEndpoint;
      event++;
      continue;
    }
    const duration = Math.min(0.65, wait / 2),
      transitionStart = next - duration;
    if (end < transitionStart) return { ...wandering(point, end), id, phase };
    let dest: 'bath' | 'lipid' | 'collected' = phase === 'bath' ? 'lipid' : 'bath';
    if (phase === 'bath' && rinseNow && noise(id * 67 + event * 37) > 0.15 / 0.4)
      dest = 'collected';
    const to =
      dest === 'lipid'
        ? lipidAnchor(id, event)
        : dest === 'bath'
          ? bathAnchor(id, event)
          : { x: 25 + noise(id * 11) * 106, y: 203 + noise(id * 23) * 8 };
    if (end < next) {
      const fraction = smooth((end - transitionStart) / duration);
      const from = wandering(point, transitionStart),
        target = dest === 'collected' ? to : wandering(to, next);
      if (dest === 'collected') {
        const outlet = { x: 42, y: 170 };
        return {
          ...(fraction < 0.55
            ? mixPoint(from, outlet, fraction / 0.55)
            : mixPoint(outlet, target, (fraction - 0.55) / 0.45)),
          id,
          phase,
        };
      }
      return { ...mixPoint(from, target, fraction), id, phase };
    }
    point = to;
    phase = dest;
    time = next;
    event++;
    if (phase === 'collected') return { ...point, id, phase };
  }

  return { ...point, id, phase };
}

export function coarseCopperBinding(copper: number, sites: number, kd = 0.2) {
  const M = Math.max(0, copper),
    S = Math.max(0, sites),
    K = Math.max(1e-8, kd);
  if (!M || !S) return { bound: 0, free: M, oxidationState: 2 as const };
  const a = M + S + K,
    bound = (2 * M * S) / (a + Math.sqrt(Math.max(0, a * a - 4 * M * S)));
  return { bound, free: M - bound, oxidationState: 2 as const };
}
/** A representative connected peptide segment with four nitrogen donors.
 * Chain continuation, side groups, hydrogens and acid-base species are omitted.
 * This is not a unique protein structure or an egg-white speciation calculation. */
export function peptideMotif(binding: number) {
  const p = clamp01(binding);
  // Bend an ordered chain along a circular arc. Directly interpolating a line
  // into four corners makes the last two donors collide halfway through.
  const bend = Math.max(0.00001, p),
    angleStep = (Math.PI / 2) * bend;
  const radius = 80 / (2 * Math.sin(angleStep / 2));
  const yCenter = 93 + (radius * (Math.cos(1.5 * angleStep) + Math.cos(0.5 * angleStep))) / 2;
  const donors = Array.from({ length: 4 }, (_, i) => {
    const angle = (i - 1.5) * angleStep;
    return {
      id: `N${i + 1}`,
      x: 178 + radius * Math.sin(angle),
      y: yCenter - radius * Math.cos(angle),
    };
  });
  const carbons: Point[] = [],
    oxygens: Point[] = [];
  for (let i = 0; i < 3; i++) {
    const a = donors[i],
      b = donors[i + 1],
      dx = b.x - a.x,
      dy = b.y - a.y;
    const norm = Math.hypot(dx, dy) || 1,
      nx = dy / norm,
      ny = -dx / norm;
    carbons.push(
      { x: a.x + dx * 0.34 + nx * 19, y: a.y + dy * 0.34 + ny * 19 },
      { x: a.x + dx * 0.68 + nx * 19, y: a.y + dy * 0.68 + ny * 19 },
    );
    oxygens.push({ x: a.x + dx * 0.68 + nx * 39, y: a.y + dy * 0.68 + ny * 39 });
  }
  return {
    donors,
    carbons,
    oxygens,
    copper: { x: 178, y: mix(177, 93, foodRamp(p, 0.25, 0.9)) },
    oxidationState: 2 as const,
  };
}
