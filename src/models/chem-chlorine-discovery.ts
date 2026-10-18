/** Dimensionless net-material accounts, not reaction kinetics or historical atom imaging. */
const bounded = (value: number, max: number, fallback = 0) =>
  Math.max(0, Math.min(max, Number.isFinite(value) ? value : fallback));
const unit = (value: number) => bounded(value, 1);
const smooth = (value: number) => {
  const p = unit(value);
  return p * p * (3 - 2 * p);
};
const between = (value: number, start: number, end: number) =>
  unit((value - start) / (end - start));

export const CHLORINE_CHAPTER_SECONDS = [39, 43, 38.5, 31, 32] as const;
export const CHLORINE_HISTORY = Object.freeze([
  Object.freeze({
    id: 'scheele-gas1774',
    year: 1774,
    source: 'Textbook P44; RSC history',
    observation: 'yellow-green gas obtained',
  }),
  Object.freeze({
    id: 'davy-dry-carbon1810',
    year: 1810,
    source: 'Davy 1810, reprint P23',
    observation: 'pretreated charcoal did not produce the expected decomposition',
  }),
  Object.freeze({
    id: 'litharge-water1810',
    year: 1810,
    source: 'Gay-Lussac and Thenard observation discussed by Davy, reprint P27',
    observation: 'water formed when hydrogen chloride contacted lead oxide',
  }),
  Object.freeze({
    id: 'hydrogen-combination1810',
    year: 1810,
    source: 'Davy 1810, reprint P26',
    observation:
      'hydrogen and the gas formed hydrogen chloride; little condensation decreased with reduced impurities',
  }),
]);
export function chlorineHistoryClaim(claim: 'transferable-oxygen' | 'alternative') {
  return {
    claim,
    expectsCarbonTransfer: claim === 'transferable-oxygen',
    records: CHLORINE_HISTORY,
    provesElementAlone: false as const,
  };
}

/** Ideal well-mixed collection vessel of unit gas capacity; no collection efficiency forecast. */
export function chlorineGasTrain(throughput: number, hydroxideCapacity = 8) {
  const generated = bounded(throughput, 4),
    oh = bounded(hydroxideCapacity, 8);
  const collected = -Math.expm1(-generated),
    tail = generated - collected,
    absorbed = Math.min(tail, oh / 2),
    unabsorbed = tail - absorbed;
  return {
    generated,
    collected,
    tail,
    absorbed,
    unabsorbed,
    remainingOH: oh - 2 * absorbed,
    chloride: absorbed,
    hypochlorite: absorbed,
    chlorineAtoms: 2 * (collected + unabsorbed + absorbed),
  };
}
export type PipePoint = [number, number];
export function pipePosition(points: readonly PipePoint[], fraction: number) {
  const valid = points.filter((p) => p.length === 2 && p.every(Number.isFinite));
  if (!valid.length) return { x: 0, y: 0 };
  const lengths = valid.slice(1).map((p, i) => Math.hypot(p[0] - valid[i][0], p[1] - valid[i][1]));
  let remaining = unit(fraction) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i]) {
      const p = remaining / (lengths[i] || 1);
      return {
        x: valid[i][0] + p * (valid[i + 1][0] - valid[i][0]),
        y: valid[i][1] + p * (valid[i + 1][1] - valid[i][1]),
      };
    }
    remaining -= lengths[i];
  }
  return { x: valid.at(-1)![0], y: valid.at(-1)![1] };
}

/** PbO + 2 HCl -> PbCl2 + H2O. External water is a separately tagged input, not newly formed water. */
export function oxygenSourceAccount(oxide: number, acid: number, externalWater = 0, progress = 1) {
  const initial = {
      oxide: bounded(oxide, 4),
      acid: bounded(acid, 8),
      externalWater: bounded(externalWater, 4),
    },
    extent = Math.min(initial.oxide, initial.acid / 2) * unit(progress),
    species = {
      oxide: initial.oxide - extent,
      acid: initial.acid - 2 * extent,
      salt: extent,
      newWater: extent,
      preexistingWater: initial.externalWater,
    },
    initialAtoms = {
      Pb: initial.oxide,
      O: initial.oxide + initial.externalWater,
      H: initial.acid + 2 * initial.externalWater,
      Cl: initial.acid,
    },
    atoms = {
      Pb: species.oxide + species.salt,
      O: species.oxide + species.newWater + species.preexistingWater,
      H: species.acid + 2 * (species.newWater + species.preexistingWater),
      Cl: species.acid + 2 * species.salt,
    };
  return {
    initial,
    extent,
    species,
    initialAtoms,
    atoms,
    oxygenFromOxide: extent,
    oxygenFromExternalWater: initial.externalWater,
    netNewWater: extent,
  };
}
export type ChlorineAtom = {
  id: string;
  element: 'Pb' | 'O' | 'H' | 'Cl';
  origin: 'oxide' | 'acid' | 'external';
  x: number;
  y: number;
  start: PipePoint;
  end: PipePoint;
};
/** Six stable atoms for the single-unit counterexample. Movement is a net allocation, not a path of reaction. */
export function oxygenSourceAtoms(
  progress: number,
  width = 280,
  oxide = true,
  externalWater = false,
): ChlorineAtom[] {
  const w = Math.max(240, bounded(width, 900, 280)),
    p = smooth(oxide ? progress : 0),
    left = w * 0.24,
    right = w * 0.74;
  const rows: {
    id: string;
    element: ChlorineAtom['element'];
    origin: ChlorineAtom['origin'];
    a: PipePoint;
    b: PipePoint;
    bend: number;
  }[] = [
    { id: 'lead-0', element: 'Pb', origin: 'oxide', a: [left - 18, 106], b: [left, 112], bend: 20 },
    {
      id: 'oxygen-oxide-0',
      element: 'O',
      origin: 'oxide',
      a: [left + 18, 106],
      b: [right, 92],
      bend: -65,
    },
    {
      id: 'hydrogen-acid-0',
      element: 'H',
      origin: 'acid',
      a: [right - 19, 69],
      b: [right - 26, 121],
      bend: -12,
    },
    {
      id: 'chlorine-acid-0',
      element: 'Cl',
      origin: 'acid',
      a: [right + 19, 69],
      b: [left - 28, 82],
      bend: -42,
    },
    {
      id: 'hydrogen-acid-1',
      element: 'H',
      origin: 'acid',
      a: [right - 19, 149],
      b: [right + 26, 121],
      bend: 19,
    },
    {
      id: 'chlorine-acid-1',
      element: 'Cl',
      origin: 'acid',
      a: [right + 19, 149],
      b: [left + 28, 142],
      bend: 34,
    },
  ];
  const atoms = rows
    .filter((r) => oxide || r.origin !== 'oxide')
    .map((r) => ({
      id: r.id,
      element: r.element,
      origin: r.origin,
      x: r.a[0] + (r.b[0] - r.a[0]) * p,
      y: r.a[1] + (r.b[1] - r.a[1]) * p + Math.sin(Math.PI * p) * r.bend,
      start: r.a,
      end: r.b,
    }));
  // Diagram layout only: keep separately counted identities readable during a net allocation.
  // This is deterministic at every seek; no molecular forces or physical collision dynamics are implied.
  for (let pass = 0; pass < 24; pass++) {
    for (let i = 0; i < atoms.length; i++)
      for (let j = i + 1; j < atoms.length; j++) {
        const a = atoms[i],
          b = atoms[j],
          dx = b.x - a.x,
          dy = b.y - a.y,
          distance = Math.hypot(dx, dy),
          spacing = 35;
        if (distance >= spacing) continue;
        const ux = distance > 1e-8 ? dx / distance : 1,
          uy = distance > 1e-8 ? dy / distance : 0,
          correction = (spacing - distance) / 2;
        a.x -= ux * correction;
        a.y -= uy * correction;
        b.x += ux * correction;
        b.y += uy * correction;
      }
    for (const a of atoms) {
      a.x = Math.max(18, Math.min(w - 18, a.x));
      a.y = Math.max(20, Math.min(150, a.y));
    }
  }
  if (externalWater)
    for (const [id, element, dx, dy] of [
      ['external-O', 'O', 0, 0],
      ['external-H0', 'H', -25, 22],
      ['external-H1', 'H', 25, 22],
    ] as const) {
      const pos: PipePoint = [left + dx, oxide ? 215 + dy : 169 + dy];
      atoms.push({ id, element, origin: 'external', x: pos[0], y: pos[1], start: pos, end: pos });
    }
  return atoms;
}
export function hydrogenChlorineAtoms(progress: number, width = 280) {
  const w = Math.max(240, bounded(width, 900, 280)),
    p = smooth(progress),
    left = w * 0.26,
    right = w * 0.74;
  return [
    { id: 'hydrogen-0', element: 'H', a: [left - 18, 85], b: [left - 18, 111] },
    { id: 'hydrogen-1', element: 'H', a: [left + 18, 85], b: [right - 18, 111] },
    { id: 'chlorine-0', element: 'Cl', a: [right - 18, 85], b: [left + 18, 111] },
    { id: 'chlorine-1', element: 'Cl', a: [right + 18, 85], b: [right + 18, 111] },
  ].map((r, i) => ({
    id: r.id,
    element: r.element,
    x: r.a[0] + (r.b[0] - r.a[0]) * p,
    y: r.a[1] + (r.b[1] - r.a[1]) * p + Math.sin(Math.PI * p) * (i === 1 ? -35 : i === 2 ? 35 : 0),
  }));
}

/** Each tube and each tracer uses these exact vertices, including re-entry into the long collection tube. */
export function chlorineTrainGeometry(width = 280) {
  const w = Math.max(240, bounded(width, 1000, 280)),
    a = w * 0.14,
    b = w * 0.5,
    c = w * 0.86;
  const generator: PipePoint[] = [
      [a + 9, 80],
      [a + 9, 31],
      [b - 12, 31],
      [b - 12, 144],
    ],
    tail: PipePoint[] = [
      [b + 12, 76],
      [b + 12, 44],
      [c, 44],
      [c, 142],
    ];
  return {
    width: w,
    height: 186,
    centres: [a, b, c],
    generator,
    tail,
    generatorPath: generator.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' '),
    tailPath: tail.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' '),
  };
}

/** Measured 183.5 s tracks. Local cue times include the 0.45 s lead-in.
 * ASR locates words; it is not subjective listening. Allocation timing is pedagogic, not kinetics.
 */
export function chlorineFilm(chapter: number, elapsed: number, locale: 'zh' | 'en' = 'zh') {
  const ch = Math.floor(bounded(chapter, 4)),
    time = bounded(elapsed, 120),
    en = locale === 'en',
    p = between(time, 0, CHLORINE_CHAPTER_SECONDS[ch]),
    observation = en ? [5.25, 10.2, 16.3, 24.3] : [5.85, 10.15, 17.8, 26.25],
    oxygen = en ? [15.25, 18.05, 23.3, 28.1, 34.37] : [13.5, 16.2, 20.25, 24.95, 33.09],
    interpretation = en
      ? [6.25, 10.45, 20.6, 25.05, 27.65, 31.8]
      : [4.9, 8.9, 18.5, 23.55, 25.9, 29.15],
    flow = ch === 3 ? between(time, 2.8, en ? 22.2 : 26.1) : between(time, 0.45, en ? 28.8 : 30.15);
  return {
    chapter: ch,
    time,
    progress: p,
    history: ch < 3,
    observationBeat:
      time < observation[0]
        ? 'gas'
        : time < observation[1]
          ? 'claim'
          : time < observation[2]
            ? 'prediction'
            : time < observation[3]
              ? 'record'
              : 'limit',
    oxygenBeat:
      time < oxygen[0]
        ? 'record'
        : time < oxygen[1]
          ? 'source'
          : time < oxygen[2]
            ? 'allocation'
            : time < oxygen[3]
              ? 'explanation'
              : time < oxygen[4]
                ? 'predict'
                : 'reveal',
    oxygenProgress: between(time, oxygen[1], oxygen[2]),
    interpretationBeat:
      time < interpretation[2] ? 'evidence' : time < interpretation[3] ? 'judgment' : 'modern',
    evidenceCount: time < interpretation[0] ? 1 : time < interpretation[1] ? 2 : 3,
    hydrogenProgress: between(time, interpretation[4], interpretation[5]),
    throughput: ch === 3 ? 2 * flow : ch === 4 ? 2 + 2 * flow : 0,
    flowProgress: flow,
    hydroxide: 8,
    ledger: ch === 4,
    modernMoleculeLabel: en ? 'Modern net account' : '现代净物料账本',
  };
}
export function chlorineDiscoveryDirector(chapter: number, progress: number) {
  const ch = Math.floor(bounded(chapter, 4));
  return chlorineFilm(ch, unit(progress) * CHLORINE_CHAPTER_SECONDS[ch]);
}
