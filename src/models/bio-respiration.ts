/** Net accounts and bounded teaching dynamics; no rates below are fitted to yeast cultures. */
export type RespirationRoute = 'aerobic' | 'ethanol' | 'lactate';
export const respirationChapters = [
  'atp',
  'air',
  'sealed',
  'assay',
  'glycolysis',
  'aerobic',
  'fermentation',
] as const;
export type RespirationChapter = (typeof respirationChapters)[number];
const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
export const respirationClamp = (v: number) => Math.min(1, Math.max(0, finite(v)));
const smooth = (v: number) => {
  const p = respirationClamp(v);
  return p * p * (3 - 2 * p);
};
const phase = (t: number, a: number, b: number) => smooth((finite(t) - a) / (b - a));
export function respirationBalance(route: RespirationRoute, glucose = 1) {
  const g = Math.min(1e6, Math.max(0, finite(glucose)));
  return {
    glucose: g,
    oxygen: route === 'aerobic' ? 6 * g : 0,
    carbonDioxide: route === 'aerobic' ? 6 * g : route === 'ethanol' ? 2 * g : 0,
    ethanol: route === 'ethanol' ? 2 * g : 0,
    lactate: route === 'lactate' ? 2 * g : 0,
    netGlycolyticATP: 2 * g,
    waterNet: route === 'aerobic' ? 6 * g : 0,
  };
}
/** id is zero-based; position is the original glucose carbon number, not arbitrary reassignment. */
export function carbonDestinations(route: RespirationRoute) {
  return Array.from({ length: 6 }, (_, id) => ({
    id,
    position: id + 1,
    product:
      route === 'aerobic' || (route === 'ethanol' && (id === 2 || id === 3))
        ? 'CO₂'
        : route === 'ethanol'
          ? 'ethanol'
          : 'lactate',
    group: route === 'aerobic' ? id : id < 3 ? 0 : 1,
  }));
}
export function carbonGeometry(route: RespirationRoute | 'pyruvate', progress: number) {
  const p = respirationClamp(progress);
  return [1, 2, 3, 6, 5, 4].map((position, i) => {
    const group = Math.floor(i / 3),
      slot = i % 3,
      start = { x: 45 + (position - 1) * 42, y: 48 },
      py = { x: 70 + slot * 70, y: 112 + group * 80 },
      released = slot === 2 && route === 'ethanol',
      end =
        route === 'aerobic'
          ? { x: 45 + (i % 3) * 105, y: 105 + group * 80 }
          : released
            ? { x: 260, y: 100 + group * 80 }
            : py;
    const k = phase(p, 0, 0.48),
      q = phase(p, 0.48, 1);
    return {
      id: `C${position}`,
      position,
      group,
      slot,
      product:
        route === 'aerobic' || released
          ? 'CO₂'
          : route === 'ethanol'
            ? 'ethanol'
            : route === 'lactate'
              ? 'lactate'
              : 'pyruvate',
      x: start.x + (py.x - start.x) * k + (end.x - py.x) * q,
      y: start.y + (py.y - start.y) * k + (end.y - py.y) * q,
    };
  });
}
export const textbookRespirationObservations = Object.freeze(
  [
    { id: 'A', route: 'ideal aerobic', co2: true, ethanol: false },
    { id: 'B', route: 'ideal ethanol fermentation', co2: true, ethanol: true },
  ].map(Object.freeze),
);
export function yeastAssay(
  progress: number,
  oxygen: boolean,
  scrubber = true,
  connectedAfterDepletion = true,
) {
  const p = respirationClamp(progress),
    glucoseRemaining = Math.max(0, 1 - p * 1.25),
    balance = respirationBalance(oxygen ? 'aerobic' : 'ethanol', 1 - glucoseRemaining),
    airContamination = oxygen && !scrubber ? 0.6 : 0;
  return {
    ...balance,
    glucoseRemaining,
    detectedCO2: balance.carbonDioxide + airContamination,
    ethanolColorValid: glucoseRemaining < 0.001,
    anaerobicConditionValid: oxygen || connectedAfterDepletion,
    cloudiness: 1 - Math.exp(-(balance.carbonDioxide + airContamination) / 3),
  };
}
export function oxygenInventory(time: number) {
  const t = Math.max(0, finite(time)),
    remaining = Math.max(0, 1 - t / 10);
  return {
    remaining,
    depleted: remaining === 0,
    earlyGas: Math.min(t, 10) * 0.12,
    laterGas: Math.max(0, t - 10) * 0.08,
  };
}
export type RespirationAtom = { id: string; element: string; x: number; y: number; group: string };
/** Net phosphoryl transfer. Bond weights interpolate endpoints, not transition-state bond orders.
 * Glucose O6 stays; beta bridge O stays in ADP. Mg/acid-base catalysis are not resolved.
 */
export function phosphorylTransfer(progress: number, donor: 'ATP' | 'Pi' = 'ATP') {
  if (donor === 'Pi') {
    const atoms: RespirationAtom[] = [
      { id: 'C6', element: 'C', x: 50, y: 175, group: 'sugar' },
      { id: 'O6', element: 'O', x: 104, y: 175, group: 'sugar' },
      { id: 'H6', element: 'H', x: 104, y: 222, group: 'sugar' },
      { id: 'Pi-P', element: 'P', x: 158, y: 65, group: 'free-phosphate' },
      ...[
        [158, 20],
        [205, 65],
        [158, 110],
        [111, 65],
      ].map(([x, y], i) => ({ id: `Pi-O${i + 1}`, element: 'O', x, y, group: 'free-phosphate' })),
    ];
    return {
      progress: 0,
      eligible: false,
      atoms,
      bonds: [
        { from: 'C6', to: 'O6', weight: 1 },
        { from: 'O6', to: 'H6', weight: 1 },
        ...[1, 2, 3, 4].map((i) => ({ from: 'Pi-P', to: `Pi-O${i}`, weight: 1 })),
      ],
      adp: 0,
      g6p: 0,
      protonToBuffer: 0,
    };
  }
  const p = donor === 'ATP' ? respirationClamp(progress) : 0,
    k = smooth(p),
    gx = 158,
    gy = 65 + 110 * k;
  const atoms: RespirationAtom[] = [
    { id: 'C6', element: 'C', x: 50, y: 175, group: 'sugar' },
    { id: 'O6', element: 'O', x: 104, y: 175, group: 'sugar' },
    {
      id: 'H6',
      element: 'H',
      x: 104 + 164 * k,
      y: 222 - 25 * Math.sin(Math.PI * k),
      group: p === 1 ? 'buffer' : 'sugar',
    },
    { id: 'Pbeta', element: 'P', x: 50, y: 65, group: 'ADP-core' },
    { id: 'Obridge', element: 'O', x: 104, y: 65, group: 'ADP-core' },
    { id: 'Pgamma', element: 'P', x: gx, y: gy, group: p === 1 ? 'sugar' : 'ATP' },
    ...[
      [0, -45],
      [47, 0],
      [0, 45],
    ].map(([dx, dy], i) => ({
      id: `Og${i + 1}`,
      element: 'O',
      x: gx + dx,
      y: gy + dy,
      group: p === 1 ? 'sugar' : 'ATP',
    })),
  ];
  const bonds = [
    { from: 'C6', to: 'O6', weight: 1 },
    { from: 'Pbeta', to: 'Obridge', weight: 1 },
    { from: 'Obridge', to: 'Pgamma', weight: 1 - k },
    { from: 'O6', to: 'Pgamma', weight: k },
    { from: 'O6', to: 'H6', weight: 1 - k },
    ...[1, 2, 3].map((i) => ({ from: 'Pgamma', to: `Og${i}`, weight: 1 })),
  ];
  return {
    progress: p,
    eligible: donor === 'ATP',
    atoms,
    bonds,
    adp: p,
    g6p: p,
    protonToBuffer: p,
  };
}
export function glycolysisLedger(progress: number) {
  const p = respirationClamp(progress),
    stage = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;
  const rows = [
    { ATP: 2, ADP: 2, Pi: 2, organicP: 0 },
    { ATP: 0, ADP: 4, Pi: 2, organicP: 2 },
    { ATP: 0, ADP: 4, Pi: 0, organicP: 4 },
    { ATP: 4, ADP: 0, Pi: 0, organicP: 0 },
  ];
  return {
    stage,
    ...rows[stage],
    adenosineIds: ['A1', 'A2', 'A3', 'A4'],
    invested: stage ? 2 : 0,
    produced: stage === 3 ? 4 : 0,
    net: stage === 3 ? 2 : 0,
    totalP: 12,
  };
}
/** A restricted pool isolates the requirement for oxidized NAD, with adequate other substrates. */
export function carrierCycle(
  time: number,
  recycle = true,
  route: 'ethanol' | 'lactate' = 'ethanol',
) {
  const t = Math.max(0, finite(time)),
    firstReduction = phase(t, 1, 4),
    firstReturn = recycle ? phase(t, 7, 10) : 0,
    secondReduction = recycle ? phase(t, 13, 16) : 0,
    secondReturn = recycle ? phase(t, 19, 22) : 0;
  const reduction = !recycle
    ? firstReduction
    : t < 10
      ? firstReduction - firstReturn
      : secondReduction - secondReturn;
  const firstComplete = t >= 4,
    secondComplete = recycle && t >= 16,
    completed = Number(firstComplete) + Number(secondComplete);
  return {
    carriers: ['N1', 'N2'].map((id, i) => ({
      id,
      index: i,
      reduced: respirationClamp(reduction),
      returnProgress: t < 12 ? firstReturn : secondReturn,
    })),
    completed,
    waiting: !recycle && t >= 7,
    netATP: 2 * completed,
    carbonDioxide:
      route === 'ethanol' ? 2 * (Number(firstReturn >= 1) + Number(secondReturn >= 1)) : 0,
    ethanol: route === 'ethanol' ? 2 * (Number(firstReturn >= 1) + Number(secondReturn >= 1)) : 0,
    recycling: recycle,
    nextAllowed: recycle && t >= 10,
  };
}
/** GAPDH net functional-group view, not a complete atom map or catalytic mechanism.
 * Pi joins the aldehyde carbon as NAD+ accepts a reducing equivalent. A new
 * substrate batch is distinct from the previous product; carrier IDs persist.
 */
export function trioseOxidation(time: number, recycle = true) {
  const t = Math.max(0, finite(time)),
    nextBatch = t >= (recycle ? 10 : 7),
    progress = nextBatch ? (recycle ? phase(t, 13, 16) : 0) : phase(t, 1, 4);
  return {
    batch: nextBatch ? 2 : 1,
    progress,
    aldehyde: 1 - progress,
    acylPhosphate: progress,
    freePi: 1 - progress,
    boundPhosphate: 1 + progress,
    pi: { x: 270, y: 35 * (1 - progress) },
    incomingO: { x: 230 + 8 * (1 - progress), y: 35 * (1 - progress) },
    carbonPositions: [
      [1, 2, 3],
      [6, 5, 4],
    ],
    substrate: 'glyceraldehyde-3-phosphate',
    product: '1,3-bisphosphoglycerate',
  };
}
/** Analytic positive reservoir: q'=pump-(synthase+leak)q, dimensionless teaching units.
 * The local scene is not a full respiratory stoichiometry or a fitted membrane-voltage model.
 */
export function respiratoryMembrane(time: number, stopAt = Infinity) {
  const t = Math.min(1e4, Math.max(0, finite(time))),
    cut = Number.isFinite(stopAt) ? Math.max(0, stopAt) : Infinity,
    k = 0.53,
    pumpRate = 0.8,
    steady = pumpRate / k,
    on = Math.min(t, cut),
    off = Math.max(0, t - cut),
    qAt = steady * (1 - Math.exp(-k * on)),
    gradient = qAt * Math.exp(-k * off),
    pump = t < cut ? pumpRate : 0,
    integralOn = steady * (on - (1 - Math.exp(-k * on)) / k),
    integralOff = (qAt * (1 - Math.exp(-k * off))) / k;
  return {
    time: t,
    oxygen: pump > 0,
    pump,
    gradient,
    synthase: 0.45 * gradient,
    leak: 0.08 * gradient,
    atpWork: 0.45 * (integralOn + integralOff),
    carrierReduced: t < cut ? 0 : 1 - Math.exp(-0.8 * off),
  };
}
export function membraneTrajectories(time: number, stopAt = Infinity) {
  const s = respiratoryMembrane(time, stopAt),
    t = s.time;
  const paths = Array.from({ length: 8 }, (_, i) => {
    const q = (s.atpWork * 0.55 + i / 8) % 1;
    return {
      id: `H${i + 1}`,
      x: 215 + Math.sin(q * Math.PI * 2) * 4,
      y: 38 + q * 160,
      visible: s.synthase > 0.003,
    };
  });
  return {
    ...s,
    protons: paths,
    electronPosition: (Math.min(t, Number.isFinite(stopAt) ? stopAt : t) * 0.28) % 1,
  };
}
/** Linear teaching-clock map. It changes presentation pace, never reaction accounts. */
function teachingClock(t: number, anchors: readonly (readonly [number, number])[]) {
  if (t <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [end, value] = anchors[i],
      [start, previous] = anchors[i - 1];
    if (t <= end) return previous + ((value - previous) * (t - start)) / (end - start);
  }
  const [last, value] = anchors[anchors.length - 1];
  return value + t - last;
}
export function respirationDirector(chapter: RespirationChapter, time: number, locale = 'zh') {
  const t = Math.max(0, finite(time)),
    en = locale === 'en';
  if (chapter === 'atp') {
    const begin = en ? 7.2 : 5.5,
      end = en ? 21.2 : 15.2,
      donor = en ? 29 : 21.7,
      recap = en ? 36.3 : 28.9;
    return {
      shot:
        t < begin
          ? 'bind'
          : t < end
            ? 'transfer'
            : t < donor
              ? 'received'
              : t < recap
                ? 'donor'
                : 'received',
      progress: phase(t, begin, end),
      time: t,
      cut: 22,
    };
  }
  if (chapter === 'air') {
    const source = en ? 17.7 : 16.3,
      control = en ? 20.9 : 19.8;
    return {
      shot: t < 5 ? 'both' : t < source ? 'incoming' : t < control ? 'newgas' : 'ambiguous',
      progress: phase(t, 5, 22),
      time: t,
      cut: 22,
    };
  }
  if (chapter === 'sealed')
    return {
      shot: t < 3 ? 'remaining' : t < 10 ? 'depleting' : 'after',
      progress: phase(t, 3, 10),
      time: t * (12.5 / (en ? 10.1 : 10)),
      cut: 22,
    };
  if (chapter === 'assay') {
    const interference = en ? 8.8 : 7.2,
      boundary = en ? 18.2 : 15.7,
      question = en ? 26.7 : 24.5;
    return {
      shot:
        t < (en ? 5 : 4)
          ? 'samples'
          : t < interference
            ? 'gas'
            : t < boundary
              ? 'interference'
              : t < question
                ? 'boundary'
                : 'question',
      progress: phase(t, interference, interference + 4),
      time: t,
      cut: 22,
    };
  }
  if (chapter === 'glycolysis') {
    const ledger = en ? 9.8 : 8.7,
      nad = en ? 16.2 : 13.8,
      blocked = en ? 27.8 : 24.5;
    const carrierTime = en
      ? teachingClock(t, [
          [nad, 0],
          [17, 1],
          [22.4, 4],
          [blocked, 7],
        ])
      : teachingClock(t, [
          [nad, 0],
          [14.8, 1],
          [18.6, 4],
          [blocked, 7],
        ]);
    const ledgerProgress = en
      ? t < 10.4
        ? 0
        : t < 12.6
          ? 0.3
          : t < 13.1
            ? 0.6
            : 1
      : t < ledger + 0.5
        ? 0
        : t < ledger + 2.2
          ? 0.3
          : t < ledger + 2.7
            ? 0.6
            : 1;
    return {
      shot: t < ledger ? 'carbons' : t < nad ? 'ledger' : t < blocked ? 'carriers' : 'blocked',
      progress: t < ledger ? phase(t, en ? 3.3 : 2.7, en ? 6.5 : 6.1) : ledgerProgress,
      time: carrierTime,
      cut: 22,
    };
  }
  if (chapter === 'aerobic') {
    const start = en ? 9.8 : 7.1,
      water = en ? 15.3 : 12.5,
      finishWater = en ? 18.3 : 14.7,
      off = en ? 31 : 25.2;
    return {
      shot: t < start ? 'oxidation' : t < finishWater ? 'electrons' : t < off ? 'gradient' : 'off',
      progress: phase(t, 0.5, en ? 4.1 : 3.6),
      time: teachingClock(t, [
        [start, 0],
        [start + 2, 2],
        [water, 5],
        [finishWater, 10],
        [off, 20],
      ]),
      cut: 20,
    };
  }
  const reduction = en ? 6.7 : 6.9,
    resume = 12.4,
    recap = en ? 18 : 17.2,
    lactate = en ? 23 : 20.9,
    predict = en ? 32 : 28.3;
  const carrierTime =
    t < resume
      ? teachingClock(t, [
          [reduction, 6],
          [reduction + 0.4, 7],
          [11.9, 10],
        ])
      : t < recap
        ? teachingClock(t, [
            [resume, 12],
            [13.2, 13],
            [16.5, 16],
          ])
        : 10;
  return {
    shot:
      t < reduction
        ? 'decarboxylation'
        : t < resume
          ? 'recycle'
          : t < recap
            ? 'resume'
            : t < lactate
              ? 'noextra'
              : t < predict
                ? 'lactate'
                : 'predict',
    progress: phase(t, 3.1, 6.5),
    time: carrierTime,
    cut: 22,
  };
}
/** Net terminal-acceptor account: 2 NADH provide four electrons to O2 + 4H+.
 * Bound oxygen chemistry inside the oxidase is condensed, not free atomic oxygen.
 */
export function terminalOxygenEvent(time: number) {
  const p = phase(time, 2, 8),
    q = phase(time, 5, 10);
  const start = [
      { id: 'Oa', element: 'O', x: 125, y: 151 },
      { id: 'Ob', element: 'O', x: 147, y: 151 },
      { id: 'Ha', element: 'H', x: 68, y: 155 },
      { id: 'Hb', element: 'H', x: 68, y: 186 },
      { id: 'Hc', element: 'H', x: 182, y: 133 },
      { id: 'Hd', element: 'H', x: 182, y: 203 },
    ],
    end = [
      { x: 117, y: 172 },
      { x: 158, y: 172 },
      { x: 105, y: 160 },
      { x: 105, y: 184 },
      { x: 170, y: 160 },
      { x: 170, y: 184 },
    ];
  return {
    progress: q,
    donated: p,
    carriers: ['N1', 'N2'].map((id) => ({ id, reduced: 1 - p })),
    atoms: start.map((a, i) => ({
      ...a,
      x: a.x + (end[i].x - a.x) * q,
      y: a.y + (end[i].y - a.y) * q,
    })),
    electrons: 4,
    oxygenAtoms: 2,
    hydrogens: 4,
  };
}
/** Selected synthesis turnover in teaching-work units, not a proton/ATP stoichiometry. */
export function synthaseTurnover(time: number, stopAt = Infinity) {
  const s = respiratoryMembrane(time, stopAt),
    work = s.atpWork * 0.65,
    index = Math.floor(work),
    p = work - index,
    join = phase(p, 0.12, 0.55),
    release = phase(p, 0.6, 1);
  return {
    id: `adenosine-${index}`,
    progress: p,
    formed: p >= 0.55,
    label: p >= 0.55 ? 'ATP' : 'ADP',
    phosphates: [
      { id: `alpha-${index}`, x: 204, y: 170 + 43 * release },
      { id: `beta-${index}`, x: 220, y: 170 + 43 * release },
      {
        id: `pi-${index}`,
        x: 267 + (236 - 267) * join,
        y: 140 + (170 - 140) * join + 43 * release,
      },
    ],
    rotation: work * 120,
  };
}
export const respirationGasPaths = {
  incoming: [
    { x: 8, y: 75 },
    { x: 8, y: 20 },
    { x: 62, y: 20 },
    { x: 62, y: 155 },
  ],
  transfer: [
    { x: 78, y: 70 },
    { x: 78, y: 17 },
    { x: 220, y: 17 },
    { x: 220, y: 155 },
  ],
  exhaust: [
    { x: 236, y: 70 },
    { x: 236, y: 20 },
    { x: 291, y: 20 },
  ],
};
export function gasPathPosition(points: readonly { x: number; y: number }[], progress: number) {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y)),
    total = lengths.reduce((a, b) => a + b, 0);
  let d = respirationClamp(progress) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const p = lengths[i] ? d / lengths[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * p,
        y: points[i].y + (points[i + 1].y - points[i].y) * p,
      };
    }
    d -= lengths[i];
  }
  return points[0];
}
