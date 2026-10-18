import coordinates from './bio-dna-coordinates.json';
export type Base = 'A' | 'T' | 'G' | 'C';
export type Vec3 = [number, number, number];
export type Residue = {
  id: string;
  chain: string;
  index: number;
  base: Base;
  atoms: Record<string, Vec3>;
};
export const dnaResidues = coordinates.residues as unknown as Residue[];
export const dnaSequence = dnaResidues
  .filter((r) => r.chain === 'A')
  .map((r) => r.base)
  .join('');
export const complement = (base: Base): Base =>
  (({ A: 'T', T: 'A', G: 'C', C: 'G' }) as const)[base];
export function pairedSequence(sequence: string) {
  return [...sequence].map((b) => complement(b as Base)).join('');
}
export function basePair(a: Base, b: Base) {
  const valid = complement(a) === b;
  return {
    valid,
    rings: [a === 'A' || a === 'G' ? 2 : 1, b === 'A' || b === 'G' ? 2 : 1],
    hydrogenBonds: valid ? (a === 'G' || a === 'C' ? 3 : 2) : 0,
  };
}
export function dnaCounts(sequence: string) {
  const counts = { A: 0, T: 0, G: 0, C: 0 };
  for (const b of sequence) counts[b as Base]++;
  return counts;
}
export function verifyDuplex(top: string, bottom: string, antiparallel: boolean) {
  return {
    lengthMatches: top.length === bottom.length,
    pairErrors: [...top].flatMap((b, i) => (complement(b as Base) === bottom[i] ? [] : [i])),
    antiparallel,
    valid: antiparallel && top.length === bottom.length && pairedSequence(top) === bottom,
  };
}
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalized = (a: Vec3) => scale(a, 1 / Math.hypot(...a));
const start = scale(add(dnaResidues[0].atoms["C1'"], dnaResidues[23].atoms["C1'"]), 0.5),
  end = scale(add(dnaResidues[11].atoms["C1'"], dnaResidues[12].atoms["C1'"]), 0.5);
const center = scale(add(start, end), 0.5),
  axis = normalized(sub(end, start)),
  right = normalized(cross(axis, [0, 0, 1])),
  depth = cross(right, axis);
export function projectDna(point: Vec3, rotation: number) {
  const p = sub(point, center),
    a = dot(p, right),
    b = dot(p, depth),
    c = dot(p, axis);
  return {
    x: 175 + 6.1 * (a * Math.cos(rotation) + b * Math.sin(rotation)),
    y: 165 + 6.1 * c,
    z: -a * Math.sin(rotation) + b * Math.cos(rotation),
  };
}
export function backboneSegments() {
  const lines: { id: string; chain: string; a: Vec3; b: Vec3 }[] = [];
  for (const r of dnaResidues) {
    const order = ['P', "O5'", "C5'", "C4'", "C3'", "O3'"].filter((n) => r.atoms[n]);
    for (let i = 1; i < order.length; i++)
      lines.push({
        id: `${r.id}-${order[i]}`,
        chain: r.chain,
        a: r.atoms[order[i - 1]],
        b: r.atoms[order[i]],
      });
    const next = dnaResidues.find((n) => n.chain === r.chain && n.index === r.index + 1);
    if (next)
      lines.push({ id: `${r.id}-bridge`, chain: r.chain, a: r.atoms["O3'"], b: next.atoms.P });
  }
  return lines;
}
export function residueRings(r: Residue) {
  return [
    { kind: 'sugar', atoms: ["C1'", "C2'", "C3'", "C4'", "O4'"] },
    {
      kind: 'base',
      atoms:
        r.base === 'A' || r.base === 'G'
          ? ['N1', 'C2', 'N3', 'C4', 'C5', 'C6']
          : ['N1', 'C2', 'N3', 'C4', 'C5', 'C6'],
    },
    ...(r.base === 'A' || r.base === 'G'
      ? [{ kind: 'base', atoms: ['C4', 'C5', 'N7', 'C8', 'N9'] }]
      : []),
  ].map((ring, i) => ({
    id: `${r.id}-ring-${i}`,
    kind: ring.kind,
    points: ring.atoms.map((n) => r.atoms[n]),
  }));
}
export function pairHydrogenBonds(index: number) {
  const first = dnaResidues[index],
    second = dnaResidues[23 - index];
  const purine = first.base === 'A' || first.base === 'G' ? first : second,
    pyrimidine = purine === first ? second : first;
  const pairs =
    purine.base === 'A'
      ? [
          ['N6', 'O4'],
          ['N1', 'N3'],
        ]
      : [
          ['O6', 'N4'],
          ['N1', 'N3'],
          ['N2', 'O2'],
        ];
  return pairs.map(([a, b]) => ({
    a: purine.atoms[a],
    b: pyrimidine.atoms[b],
    distance: Math.hypot(...sub(purine.atoms[a], pyrimidine.atoms[b])),
  }));
}
/** Equal point scatterers on two ideal strands, Å units. This is not a reconstruction of Photo 51. */
export function idealScatterers(twist = 36, count = 40) {
  return Array.from({ length: count * 2 }, (_, id) => {
    const i = Math.floor(id / 2),
      angle = ((i * twist + (id % 2) * 144) * Math.PI) / 180;
    return [10 * Math.cos(angle), 10 * Math.sin(angle), (i - (count - 1) / 2) * 3.4] as Vec3;
  });
}
export function scatteringIntensity(qx: number, qz: number, twist = 36, orientations = 8) {
  const points = idealScatterers(twist);
  let intensity = 0;
  for (let n = 0; n < orientations; n++) {
    const rotation = (n * Math.PI * 2) / orientations;
    let re = 0,
      im = 0;
    for (const p of points) {
      const phase =
        2 * Math.PI * (qx * (p[0] * Math.cos(rotation) + p[1] * Math.sin(rotation)) + qz * p[2]);
      re += Math.cos(phase);
      im += Math.sin(phase);
    }
    intensity += re * re + im * im;
  }
  return intensity / orientations / points.length ** 2;
}

const safe = (v: number, lo: number, hi: number, fallback = lo) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : fallback));
const smooth = (v: number) => {
  const p = safe(v, 0, 1);
  return p * p * (3 - 2 * p);
};
const between = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
export type ContactRole = 'donor' | 'acceptor' | 'neither';
export type EdgeSite = { atom: string; element: 'N' | 'O' | 'C'; role: ContactRole };
/** Common neutral canonical edges. Positions are a controlled schematic alignment,
 * not measured H coordinates, an energy calculation, or a prohibition of wobble pairs. */
export const canonicalEdges: Record<Base, readonly EdgeSite[]> = {
  A: [
    { atom: 'N6', element: 'N', role: 'donor' },
    { atom: 'N1', element: 'N', role: 'acceptor' },
    { atom: 'C2', element: 'C', role: 'neither' },
  ],
  G: [
    { atom: 'O6', element: 'O', role: 'acceptor' },
    { atom: 'N1', element: 'N', role: 'donor' },
    { atom: 'N2', element: 'N', role: 'donor' },
  ],
  T: [
    { atom: 'O4', element: 'O', role: 'acceptor' },
    { atom: 'N3', element: 'N', role: 'donor' },
    { atom: 'O2', element: 'O', role: 'acceptor' },
  ],
  C: [
    { atom: 'N4', element: 'N', role: 'donor' },
    { atom: 'N3', element: 'N', role: 'acceptor' },
    { atom: 'O2', element: 'O', role: 'acceptor' },
  ],
};
export function canonicalContactGraph(first: Base, second: Base) {
  const bases = [first, second];
  const sites = bases.map((base, side) =>
    canonicalEdges[base].map((site, row) => {
      const x = side ? 213 : 107,
        y = 51 + row * 60;
      return {
        ...site,
        id: `${side ? 'partner' : 'retained'}-${base}-${site.atom}`,
        base,
        side,
        row,
        x,
        y,
        hydrogen:
          site.role === 'donor'
            ? {
                id: `${side}-${base}-${site.atom}-H`,
                x: x + (side ? -26 : 26),
                y,
                attachedTo: `${side ? 'partner' : 'retained'}-${base}-${site.atom}`,
              }
            : null,
      };
    }),
  );
  const contacts = sites[0].map((left, row) => {
    const right = sites[1][row];
    const compatible =
      (left.role === 'donor' && right.role === 'acceptor') ||
      (left.role === 'acceptor' && right.role === 'donor');
    const active = left.role !== 'neither' && right.role !== 'neither';
    const donor = compatible ? (left.role === 'donor' ? left : right) : null;
    const acceptor = compatible ? (left.role === 'acceptor' ? left : right) : null;
    return {
      id: `contact-${row}`,
      row,
      left,
      right,
      compatible,
      conflict: active && !compatible,
      from: donor?.hydrogen ?? null,
      to: acceptor,
      donorAtomId: donor?.id ?? null,
    };
  });
  const rings = bases.map((b) => (b === 'A' || b === 'G' ? 2 : 1));
  return {
    first,
    second,
    sites,
    contacts,
    rings,
    contactCount: contacts.filter((c) => c.compatible).length,
    standard:
      rings[0] + rings[1] === 3 &&
      contacts.filter((c) => c.compatible).length >= 2 &&
      !contacts.some((c) => c.conflict),
  };
}
export const compositionTop = 'AATGCC';
export const compositionPermutation = [0, 4, 1, 2, 3, 5] as const;
export function compositionState(progress: number, single = false) {
  const p = safe(progress, 0, 1),
    bottom = pairedSequence(compositionTop);
  const tokens = [...bottom].map((base, id) => {
    const destination = compositionPermutation.indexOf(id as 0 | 1 | 2 | 3 | 4 | 5);
    return {
      id: `bottom-${id + 1}`,
      label: id + 1,
      base: base as Base,
      source: id,
      destination,
      // Park unit 5 below the row, shift the three neighbors into the vacant
      // position, then move the same parked unit into its destination.
      // Each motion has a vacant destination; the six labels remain separable.
      slot:
        id === 4
          ? 4 - 3 * smooth(between(p, 0.6, 0.85))
          : id >= 1 && id <= 3
            ? id + smooth(between(p, 0.15 + (3 - id) * 0.15, 0.3 + (3 - id) * 0.15))
            : id,
      travel: id === 4 ? 53 * smooth(between(p, 0, 0.15)) * (1 - smooth(between(p, 0.85, 1))) : 0,
    };
  });
  const finalBottom = p >= 1 ? compositionPermutation.map((i) => bottom[i]).join('') : bottom;
  return {
    tokens,
    top: compositionTop,
    originalBottom: bottom,
    finalBottom,
    progress: p,
    counts: dnaCounts(single ? compositionTop : compositionTop + bottom),
    mismatchSlots: p >= 1 ? verifyDuplex(compositionTop, finalBottom, true).pairErrors : [],
  };
}
/** Fixed historical ideal-model dimensions. Candidate outputs never change this evidence. */
export const historicalDnaConstraints = Object.freeze({
  riseNm: 0.34,
  repeatNm: 3.4,
  diameterNm: 2,
});
export function helixConstraint(twist: number) {
  const degrees = safe(twist, 0, 90, 36);
  return {
    twist: degrees,
    repeatNm: degrees > 0 ? (0.34 * 360) / degrees : null,
    agreesWithRepeat: Math.abs(degrees - 36) < 1e-8,
    reference: historicalDnaConstraints,
  };
}
export function idealDuplex(assembly: number, rotation = 0, twist = 36) {
  const a = smooth(assembly),
    rot = Number.isFinite(rotation) ? rotation : 0,
    deg = safe(twist, 0, 90, 36);
  const sequence = 'AATGCCGGAATT';
  return [...sequence].map((base, i) => {
    const angle = (((i - 3) * deg * Math.PI) / 180 + rot) * a;
    return {
      id: `ideal-pair-${i}`,
      base: base as Base,
      partner: complement(base as Base),
      index: i,
      first: {
        x: 160 - 66 * (1 - a + a * Math.cos(angle)),
        y: 26 + 17 * i,
        z: 66 * Math.sin(angle) * a,
      },
      second: {
        x: 160 + 66 * (1 - a + a * Math.cos(angle + 0.2 * Math.PI * a)),
        y: 26 + 17 * i,
        z: -66 * Math.sin(angle + 0.2 * Math.PI * a) * a,
      },
    };
  });
}
/** Prediction leaves the measured A chain and its order intact; revealing is not replication. */
export function retainedStrandPrediction(start = 0, reveal = 0) {
  const first = Math.round(safe(start, 0, 6));
  const n = Math.floor(safe(reveal, 0, 6));
  return dnaResidues.slice(first, first + 6).map((residue, i) => ({
    id: residue.id,
    index: first + i,
    base: residue.base,
    partnerId: dnaResidues[23 - first - i].id,
    partner: dnaResidues[23 - first - i].base,
    revealed: i < n,
    firstDirection: '5′→3′',
    partnerDirection: '3′→5′',
  }));
}
export const dnaChapters = [
  'diffraction',
  'composition',
  'geometry',
  'nucleotide',
  'antiparallel',
  'helix',
] as const;
export type DnaChapter = (typeof dnaChapters)[number];
export const dnaChapterDurations = [29.5, 30, 46, 29.5, 28, 35.5] as const;
/** Measured 198.5 s film. Anchors include the shared 0.45 s speech lead-in. */
export function dnaDirector(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.round(safe(chapter, 0, 5)),
    t = safe(chapterTime, 0, dnaChapterDurations[c]);
  const en = locale === 'en';
  const pattern = t < 11.3 ? 0 : t < 13.8 ? 1 : 2;
  const permutationStart = en ? 6.7 : 8.5,
    permutationEnd = en ? 12.9 : 14.4,
    singleAt = en ? 18.65 : 20.5,
    mismatchAt = en ? 17.4 : 16.3,
    restoreAt = en ? 24.5 : 23,
    gcAt = en ? 27.5 : 24.95,
    assemblyAt = en ? 29 : 27.5,
    assembledAt = en ? 32.4 : 31.2,
    predictionAt = en ? 38.7 : 37.3,
    acrossAt = en ? 18.5 : 19.6,
    viewAt = en ? 19 : 20,
    revealAt = en ? 24.6 : 25.5;
  const geometryShot =
    t < mismatchAt
      ? 'contact-at'
      : t < restoreAt
        ? 'contact-ac'
        : t < gcAt
          ? 'contact-at-restored'
          : t < assemblyAt
            ? 'contact-gc'
            : t < predictionAt
              ? 'whole-ideal'
              : 'predict-partner';
  const pair: [Base, Base] =
    geometryShot === 'contact-ac'
      ? ['A', 'C']
      : geometryShot === 'contact-gc'
        ? ['G', 'C']
        : ['A', 'T'];
  return {
    chapter: c,
    mode: dnaChapters[c],
    t,
    locale,
    shot:
      c === 0
        ? t < 6.4
          ? 'fixed-evidence'
          : 'candidate-scattering'
        : c === 1
          ? t < permutationStart
            ? 'counts'
            : t < permutationEnd
              ? 'same-id-permutation'
              : t < singleAt
                ? 'mismatch'
                : 'single-strand'
          : c === 2
            ? geometryShot
            : c === 3
              ? t < 11.4
                ? 'sugar-anchor'
                : t < acrossAt
                  ? 'backbone-trace'
                  : 'backbone-versus-pair'
              : c === 4
                ? t < 10.3
                  ? 'same-direction'
                  : t < viewAt
                    ? 'opposite-directions'
                    : 'rotated-view'
                : t < 21.1
                  ? 'measured-1bna'
                  : 'retained-strand',
    pattern,
    permutation: between(t, permutationStart, permutationEnd),
    single: c === 1 && t >= singleAt,
    pair,
    contacts: c === 2 ? (t < mismatchAt ? between(t, 3.8, 5.7) : 1) : 1,
    assembly: between(t, assemblyAt, assembledAt),
    idealRotation: between(t, assembledAt, predictionAt - 0.5) * 0.6,
    predictionReveal:
      c === 2 ? between(t, 43, 44) : Math.floor(between(t, revealAt, en ? 28.8 : 29.2) * 6),
    trace: nucleotideTraceAtTime(t),
    parallel: t < 10.3,
    viewRotation: between(t, viewAt, viewAt + 5) * 0.18,
    molecularRotation: 0.3 + between(t, 8.8, 16) * Math.PI * 1.6,
  };
}

export const nucleotideTraceNodes = [
  { id: 'sugar-1-C3', x: 84, y: 83 },
  { id: 'sugar-1-O3', x: 84, y: 112 },
  { id: 'phosphate-2-P', x: 55, y: 139 },
  { id: 'sugar-2-O5', x: 55, y: 159 },
  { id: 'sugar-2-C5', x: 55, y: 169 },
  { id: 'sugar-2-C4', x: 74, y: 178 },
] as const;
export function nucleotideTrace(progress: number) {
  const lengths = nucleotideTraceNodes
    .slice(1)
    .map((v, i) => Math.hypot(v.x - nucleotideTraceNodes[i].x, v.y - nucleotideTraceNodes[i].y));
  const total = lengths.reduce((a, b) => a + b, 0);
  let distance = safe(progress, 0, 1) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const p = distance / lengths[i],
        a = nucleotideTraceNodes[i],
        b = nucleotideTraceNodes[i + 1];
      return {
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
        fromId: a.id,
        toId: b.id,
        totalLength: total,
      };
    }
    distance -= lengths[i];
  }
  return {
    ...nucleotideTraceNodes[0],
    fromId: 'sugar-1-C3',
    toId: 'sugar-1-O3',
    totalLength: total,
  };
}

/** Word-aligned continuous travel: O3′ at12.55s, phosphate at13.75s,
 * next sugar5′ side at15.4s. Fractions derive from the same rendered path. */
export function nucleotideTraceAtTime(time: number) {
  const lengths = nucleotideTraceNodes
    .slice(1)
    .map((p, i) => Math.hypot(p.x - nucleotideTraceNodes[i].x, p.y - nucleotideTraceNodes[i].y));
  const total = lengths.reduce((a, b) => a + b, 0);
  const stations = [
    0,
    lengths[0] / total,
    (lengths[0] + lengths[1]) / total,
    lengths.slice(0, 4).reduce((a, b) => a + b, 0) / total,
    1,
  ];
  const anchors = [11.4, 12.55, 13.75, 15.4, 16.3];
  const t = safe(time, 0, 40);
  for (let i = 0; i < anchors.length - 1; i++)
    if (t < anchors[i + 1])
      return (
        stations[i] +
        (stations[i + 1] - stations[i]) * smooth(between(t, anchors[i], anchors[i + 1]))
      );
  return 1;
}
