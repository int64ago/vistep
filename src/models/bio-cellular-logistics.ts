export type Point3 = { x: number; y: number; z: number };
export type CargoCompartment = 'er' | 'golgi' | 'vesicle' | 'outside';
const clamp = (x: number) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
const mix = (a: Point3, b: Point3, p: number): Point3 => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  z: a.z + (b.z - a.z) * p,
});
export const CELL_RX = 143,
  CELL_RY = 108 / 0.88,
  VESICLE_RADIUS = 7;
export function erLumen(lane: number, u: number): Point3 {
  const p = clamp(u);
  return { x: -100 + 75 * p, y: -32 + lane * 14 - 36 * p * (1 - p), z: -5 + 10 * p };
}
export function golgiLumen(lane: number, u: number): Point3 {
  const p = clamp(u);
  return { x: 35 + lane * 4 + 80 * p * (1 - p), y: -32 + 64 * p, z: 3 };
}
export function membranePoint(theta: number): Point3 {
  return { x: CELL_RX * Math.cos(theta), y: CELL_RY * Math.sin(theta), z: 0 };
}
export function membraneMetric(p: Point3) {
  return (p.x / CELL_RX) ** 2 + (p.y / CELL_RY) ** 2;
}
export function fusionPort(group: number) {
  const theta = -0.35 + group * 0.25,
    boundary = membranePoint(theta),
    nx = boundary.x / CELL_RX ** 2,
    ny = boundary.y / CELL_RY ** 2,
    n = Math.hypot(nx, ny),
    normal = { x: nx / n, y: ny / n, z: 0 },
    tangent = { x: -ny / n, y: nx / n, z: 0 };
  return { theta, boundary, normal, tangent };
}
function shifted(a: Point3, b: Point3, k: number): Point3 {
  return { x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k };
}
export function groupTime(group: number, minutes: number) {
  return Math.max(0, (Number.isFinite(minutes) ? minutes : 0) - group * 0.2);
}
export function transportCenter(group: number, minutes: number): Point3 {
  const time = groupTime(group, minutes),
    entry = golgiLumen(group, 0.15),
    exit = golgiLumen(group, 0.94),
    port = fusionPort(group),
    dock = shifted(port.boundary, port.normal, -VESICLE_RADIUS);
  if (time < 8) return erLumen(group, 1);
  if (time < 14) {
    const p = (time - 8) / 6,
      q = mix(erLumen(group, 1), entry, p);
    return { ...q, y: q.y - 18 * Math.sin(Math.PI * p) };
  }
  if (time < 35) return golgiLumen(group, 0.15 + (0.79 * (time - 14)) / 21);
  if (time < 108) {
    const p = (time - 35) / 73,
      q = mix(exit, dock, p);
    return { ...q, y: q.y - 15 * Math.sin(Math.PI * p) };
  }
  return shifted(port.boundary, port.normal, -VESICLE_RADIUS * (1 - clamp((time - 108) / 6)));
}
/** Circle/ellipse intersections define both the opening and the retained vesicle membrane. */
export function fusionGeometry(group: number, minutes: number) {
  const time = groupTime(group, minutes),
    port = fusionPort(group),
    progress = clamp((time - 108) / 6),
    center = transportCenter(group, minutes),
    active = time > 108;
  if (!active)
    return {
      group,
      active,
      progress,
      center,
      low: port.theta,
      high: port.theta,
      arc: [] as Point3[],
    };
  const distance = (theta: number) => {
    const p = membranePoint(theta);
    return Math.hypot(p.x - center.x, p.y - center.y) - VESICLE_RADIUS;
  };
  const root = (sign: number) => {
    let inner = port.theta,
      outer = port.theta + sign * 0.25;
    for (let i = 0; i < 55; i++) {
      const mid = (inner + outer) / 2;
      if (distance(mid) > 0) outer = mid;
      else inner = mid;
    }
    return (inner + outer) / 2;
  };
  const low = root(-1),
    high = root(1),
    a = membranePoint(low),
    b = membranePoint(high),
    start = Math.atan2(a.y - center.y, a.x - center.x),
    end = Math.atan2(b.y - center.y, b.x - center.x);
  let delta = end - start;
  while (delta > 0) delta -= 2 * Math.PI;
  while (delta < -2 * Math.PI) delta += 2 * Math.PI;
  const relax = clamp((time - 114) / 6),
    arc = Array.from({ length: 65 }, (_, i) => {
      const p = i / 64,
        angle = start + delta * p,
        circle = {
          x: center.x + VESICLE_RADIUS * Math.cos(angle),
          y: center.y + VESICLE_RADIUS * Math.sin(angle),
          z: 0,
        };
      return mix(circle, membranePoint(low + (high - low) * p), relax);
    });
  return { group, active, progress, center, low, high, arc };
}
export function membraneSegments(minutes: number) {
  const gaps = Array.from({ length: 4 }, (_, g) => fusionGeometry(g, minutes)).filter(
      (g) => g.active,
    ),
    segments: Point3[][] = [];
  let start = -Math.PI;
  for (const gap of gaps) {
    segments.push(sampleMembrane(start, gap.low));
    start = gap.high;
  }
  segments.push(sampleMembrane(start, Math.PI));
  return segments;
}
function sampleMembrane(start: number, end: number) {
  const n = Math.max(2, Math.ceil((end - start) * 80));
  return Array.from({ length: n + 1 }, (_, i) => membranePoint(start + ((end - start) * i) / n));
}
export function secretoryCargo(id: number, minutes: number) {
  const group = Math.floor(id / 6),
    member = id % 6,
    time = groupTime(group, minutes),
    port = fusionPort(group);
  let q: Point3,
    compartment: CargoCompartment = 'er',
    vesicle = false;
  if (time < 8)
    q = erLumen(group, 0.2 + member * 0.1 + (1 - (0.2 + member * 0.1)) * clamp(time / 8));
  else if (time < 14) {
    q = shifted(
      transportCenter(group, minutes),
      port.tangent,
      (member - 2.5) * Math.sin((Math.PI * (time - 8)) / 6),
    );
    compartment = 'vesicle';
    vesicle = true;
  } else if (time < 35) {
    const p = (time - 14) / 21;
    q = golgiLumen(group, 0.15 + 0.79 * p + (member - 2.5) * 0.025 * Math.sin(Math.PI * p));
    compartment = 'golgi';
  } else if (time < 108) {
    const p = (time - 35) / 73;
    q = shifted(transportCenter(group, minutes), port.tangent, (member - 2.5) * Math.min(1, p * 8));
    compartment = 'vesicle';
    vesicle = true;
  } else {
    const p = clamp((time - 108) / 6);
    q = shifted(shifted(port.boundary, port.normal, -7 + 30 * p), port.tangent, member - 2.5);
    compartment = membraneMetric(q) > 1 ? 'outside' : 'vesicle';
    vesicle = compartment === 'vesicle';
  }
  return { id, ...q, compartment, vesicle, group };
}
export function secretoryPopulation(minutes: number) {
  const cargo = Array.from({ length: 24 }, (_, i) => secretoryCargo(i, minutes));
  return {
    cargo,
    counts: cargo.reduce(
      (a, c) => {
        a[c.compartment]++;
        return a;
      },
      { er: 0, golgi: 0, vesicle: 0, outside: 0 },
    ),
  };
}
export function cellProjection(x: number, y: number, z: number, angle: number) {
  const a = (angle * Math.PI) / 180;
  return {
    x: x * Math.cos(a) + z * Math.sin(a),
    y: y * 0.88 - (z * Math.cos(a) - x * Math.sin(a)) * 0.25,
    depth: z * Math.cos(a) - x * Math.sin(a),
  };
}
export const organelleStructure = [
  { id: 'nucleus', x: -62, y: 45, z: 0, r: 32 },
  { id: 'golgi', x: 40, y: 0, z: 3, r: 27 },
  { id: 'mitochondrion', x: 15, y: 65, z: 15, r: 16 },
] as const;

/** The retained geometric route uses arbitrary internal units, never biological minutes. */
export const logisticsChapters = ['pulse', 'golgi', 'vesicles', 'release', 'model'] as const;
export type LogisticsChapter = (typeof logisticsChapters)[number];
export const logisticsDurations = [32, 31, 32, 39, 36] as const;
const finite = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback);
export const logisticsRamp = (t: number, a: number, b: number) => {
  const q = clamp((finite(t) - a) / (b - a));
  return q * q * (3 - 2 * q);
};
export type LocalizationSpot = Point3 & {
  id: string;
  location: 'er' | 'golgi' | 'near-surface' | 'outside';
};
/** Separate fixed sample reconstructions: number and intensity of marks are not measurements. */
export function historicalLocalization(sample: number) {
  const i = Math.min(2, Math.max(0, Math.floor(finite(sample))));
  const spots: LocalizationSpot[] = Array.from({ length: i === 2 ? 14 : 12 }, (_, n) => {
    const lane = (n * 3 + i) % 4;
    let p: Point3, location: LocalizationSpot['location'];
    if (i === 0) {
      p = erLumen(lane, 0.13 + ((n * 7) % 11) * 0.07);
      location = 'er';
    } else if (i === 1) {
      p = golgiLumen(lane, 0.16 + ((n * 5) % 11) * 0.06);
      location = 'golgi';
    } else {
      const port = fusionPort(n % 4),
        outside = n >= 7;
      p = shifted(
        shifted(port.boundary, port.normal, outside ? 13 + (n % 3) * 4 : -VESICLE_RADIUS),
        port.tangent,
        (n % 3) - 1,
      );
      location = outside ? 'outside' : 'near-surface';
    }
    return { id: `sample-${i}-${n}`, ...p, location };
  });
  return {
    sampleId: ['sample-A', 'sample-B', 'sample-C'][i],
    minutes: [3, 17, 117][i],
    spots,
    locations: [...new Set(spots.map((p) => p.location))],
  };
}
export type ExportGate = { closeAt?: number; reopenAt?: number };
/** Only arrivals at the ER exit are held. Previously exported cargo keeps its clock. */
export function gatedProgress(group: number, teachingTime: number, gate: ExportGate = {}) {
  const t = Math.max(0, finite(teachingTime)),
    delay = Math.min(3, Math.max(0, Math.floor(finite(group)))) * 0.03;
  const arrival = delay + 0.2,
    close = gate.closeAt === undefined ? Infinity : Math.max(0, finite(gate.closeAt));
  const reopen = gate.reopenAt === undefined ? Infinity : Math.max(close, finite(gate.reopenAt));
  const held = arrival >= close ? Math.max(0, Math.min(t, reopen) - arrival) : 0;
  const blocked = t >= arrival && arrival >= close && t < reopen;
  return { progress: clamp(t - delay - held), blocked, arrival, hold: held };
}
/** A piecewise clock preserves every existing 3-D position and all fusion intersections. */
export function routeClock(progress: number) {
  const q = clamp(finite(progress)),
    x = [0, 0.2, 0.36, 0.6, 0.88, 1],
    y = [0, 8, 14, 35, 108, 120];
  let i = 0;
  while (i < x.length - 2 && q > x[i + 1]) i++;
  return y[i] + ((y[i + 1] - y[i]) * (q - x[i])) / (x[i + 1] - x[i]);
}
export function transportModel(teachingTime: number, gate: ExportGate = {}, fusionAllowed = true) {
  const groups = Array.from({ length: 4 }, (_, g) => {
    const state = gatedProgress(g, teachingTime, gate),
      clock = Math.min(fusionAllowed ? 120 : 108, routeClock(state.progress));
    return { ...state, group: g, clock, legacyTime: clock + g * 0.2 };
  });
  const cargo = Array.from({ length: 24 }, (_, id) => {
    const state = groups[Math.floor(id / 6)],
      c = secretoryCargo(id, state.legacyTime);
    return {
      ...c,
      compartment: state.blocked ? ('er' as const) : c.compartment,
      vesicle: !state.blocked && c.vesicle,
      blocked: state.blocked,
    };
  });
  const fusions = groups.map((g) => fusionGeometry(g.group, g.legacyTime));
  const counts = cargo.reduce(
    (a, c) => {
      a[c.compartment]++;
      return a;
    },
    { er: 0, golgi: 0, vesicle: 0, outside: 0 },
  );
  return { groups, cargo, fusions, counts, membranes: membraneSegmentsFromFusions(fusions) };
}
export function membraneSegmentsFromFusions(fusions: ReturnType<typeof fusionGeometry>[]) {
  const gaps = fusions.filter((g) => g.active).toSorted((a, b) => a.low - b.low),
    segments: Point3[][] = [];
  let start = -Math.PI;
  for (const gap of gaps) {
    segments.push(sampleMembrane(start, gap.low));
    start = gap.high;
  }
  segments.push(sampleMembrane(start, Math.PI));
  return segments;
}
/** The cytosol fill follows the same retained arcs as the visible membrane.
 * Filling the old ellipse after fusion would incorrectly color the open lumen as cytosol. */
export function cellBoundaryFromFusions(fusions: ReturnType<typeof fusionGeometry>[]) {
  const gaps = fusions.filter((g) => g.active).toSorted((a, b) => a.low - b.low);
  const segments = membraneSegmentsFromFusions(gaps);
  return segments.flatMap((segment, i) => [...segment, ...(gaps[i]?.arc ?? [])]);
}
/** Magnified planar neck section. A carrier's outer arc and both membrane ends
 * share the exact circle/plane intersections. Normal points out of the target lumen. */
export function lumenHandoff(kind: 'bud' | 'fuse', progress: number) {
  const p = clamp(finite(progress)),
    radius = 22,
    wall = kind === 'bud' ? 125 : 205,
    normal = kind === 'bud' ? 1 : -1;
  const q = kind === 'bud' ? p : 1 - p,
    signed = -radius + 2 * radius * q,
    center = { x: wall + normal * signed, y: 128, z: 0 };
  const half = Math.sqrt(Math.max(0, radius * radius - signed * signed)),
    low = 128 - half,
    high = 128 + half;
  const angle = Math.acos(Math.max(-1, Math.min(1, -signed / radius)));
  const arc = Array.from({ length: 65 }, (_, i) => {
    const a = -angle + (2 * angle * i) / 64;
    return {
      x: center.x + normal * radius * Math.cos(a),
      y: center.y + radius * Math.sin(a),
      z: 0,
    };
  });
  const cargo = { id: 0, x: center.x, y: center.y, z: 0 };
  return {
    kind,
    progress: p,
    radius,
    wall,
    normal,
    center,
    low,
    high,
    arc,
    cargo,
    connected: p > 0 && p < 1,
    closedCarrier: kind === 'bud' ? p === 1 : p === 0,
    opening: 2 * half,
  };
}
export function cargoPermittedAtJunction(state: ReturnType<typeof lumenHandoff>, point: Point3) {
  const inLumen = (point.x - state.wall) * state.normal <= 0;
  const inCarrier =
    Math.hypot(point.x - state.center.x, point.y - state.center.y) <= state.radius + 1e-9;
  return inLumen || inCarrier;
}
/** Chapter-relative editorial anchors measured from the final recordings.
 * Word times include the 0.45 s chapter lead-in. The two languages share chapter
 * boundaries, but their explanatory referents need different internal cuts.
 * These seconds never change the transport model's dimensionless route clock. */
export const logisticsSpeechAnchors = {
  zh: {
    samples: [12.1, 14.4, 16.8, 21.8],
    inference: [5.8, 12.5, 23],
    inferenceReveal: [12.5, 18],
    modelTravel: [23, 29.8],
    handoffCuts: [5.7, 11.7, 18.2],
    bud: [2.2, 5.2],
    fuse: [5.8, 10.6],
    carrier: [18.2, 22.5],
    blockCuts: [8.6, 17.8, 28.5],
    earlyRun: [18.8, 27.7],
    lateRun: [28.5, 32.7],
    structureCuts: [12.6, 21.2],
    opening: [12.6, 16.8],
    rotation: [17.3, 20.6],
    relaxation: [20.6, 21.2],
  },
  en: {
    samples: [11.1, 13.8, 15.3, 20.8],
    inference: [5.3, 9.9, 18.2],
    inferenceReveal: [9.9, 14.3],
    modelTravel: [18.2, 25.6],
    handoffCuts: [5.6, 10.9, 17.5],
    bud: [2.2, 5.1],
    fuse: [5.7, 10.2],
    carrier: [17.5, 21.1],
    blockCuts: [9.5, 18, 27.3],
    earlyRun: [18, 27],
    lateRun: [27.3, 31.5],
    structureCuts: [14, 22.2],
    opening: [14, 17.8],
    rotation: [18, 21.6],
    relaxation: [21.6, 22.2],
  },
} as const;
export function logisticsDirector(chapter: number, seconds: number, locale = 'zh') {
  const t = Math.max(0, finite(seconds)),
    a = logisticsSpeechAnchors[locale === 'en' ? 'en' : 'zh'],
    ramp = (range: readonly [number, number]) => logisticsRamp(t, ...range);
  const shot =
    chapter === 0
      ? t < a.samples[0]
        ? 'pulse-label'
        : t < a.samples[1]
          ? 'sample-A'
          : t < a.samples[2]
            ? 'sample-B'
            : t < a.samples[3]
              ? 'sample-C'
              : 'sample-summary'
      : chapter === 1
        ? t < a.inference[0]
          ? 'chase'
          : t < a.inference[1]
            ? 'fresh-label-counterexample'
            : t < a.inference[2]
              ? 'inferred-route'
              : 'explanatory-cargo'
        : chapter === 2
          ? t < a.handoffCuts[0]
            ? 'budding'
            : t < a.handoffCuts[1]
              ? 'golgi-fusion'
              : t < a.handoffCuts[2]
                ? 'separate-compartments'
                : 'secretory-carrier'
          : chapter === 3
            ? t < a.blockCuts[0]
              ? 'surface-fusion'
              : t < a.blockCuts[1]
                ? 'block-question'
                : t < a.blockCuts[2]
                  ? 'early-block'
                  : 'late-block'
            : t < a.structureCuts[0]
              ? 'closed-contact'
              : t < a.structureCuts[1]
                ? 'connected-fusion'
                : 'model-carriers';
  return {
    shot,
    sample: t < a.samples[1] ? 0 : t < a.samples[2] ? 1 : 2,
    label: logisticsRamp(t, 2, 7),
    inference: ramp(a.inferenceReveal),
    handoff: chapter === 2 ? ramp(t < a.handoffCuts[0] ? a.bud : a.fuse) : 0,
    route:
      chapter === 1
        ? 0.05 + 0.14 * ramp(a.modelTravel)
        : chapter === 2
          ? 0.6 + 0.27 * ramp(a.carrier)
          : 0.16,
    fusion: 0.88 + 0.12 * logisticsRamp(t, 0.7, a.blockCuts[0] - 0.2),
    comparison: ramp(a.earlyRun) * 1.3,
    lateComparison: 0.2 + ramp(a.lateRun) * 1.1,
    structureFusion: 0.88 + 0.06 * ramp(a.opening) + 0.06 * ramp(a.relaxation),
    rotation: chapter === 4 ? -28 + 56 * ramp(a.rotation) : 0,
  };
}
