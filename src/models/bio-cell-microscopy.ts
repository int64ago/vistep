/** Physical specimen coordinates are micrometres; stage coordinates never change with magnification. */
export type Specimen = 'cork' | 'cheek' | 'leaf';
const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, finite(v, lo)));
const smooth = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
const between = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
export function microscopeOptics(objective: number, fieldNumber = 18) {
  const m = clamp(finite(objective, 10), 1, 100),
    fn = clamp(finite(fieldNumber, 18), 1, 50);
  return {
    totalMagnification: m * 10,
    fieldUm: (1000 * fn) / m,
    pixelsPerUm: (320 * m) / (1000 * fn),
  };
}
export function leafChloroplast(index: number, seconds: number, streaming = true) {
  index = Math.trunc(finite(index));
  seconds = finite(seconds);
  // The rendered central vacuole is a 131 × 45 μm rounded rectangle.
  // A rounded peripheral path stays in its surrounding cytoplasm; an ellipse
  // would cut through the vacuole between its horizontal and vertical extrema.
  const radius = 13,
    horizontal = 112,
    vertical = 30,
    arc = (Math.PI * radius) / 2;
  const perimeter = 2 * horizontal + 2 * vertical + 4 * arc;
  const turns = index / 18 + (streaming ? (seconds * 0.12) / (2 * Math.PI) : 0);
  let distance = (((turns % 1) + 1) % 1) * perimeter;
  const segments = [
    { length: horizontal, point: (p: number) => ({ x: -56 + p, y: -28, angle: 0 }) },
    {
      length: arc,
      point: (p: number) => ({
        x: 56 + radius * Math.cos(p / radius - Math.PI / 2),
        y: -15 + radius * Math.sin(p / radius - Math.PI / 2),
        angle: ((p / radius) * 180) / Math.PI,
      }),
    },
    { length: vertical, point: (p: number) => ({ x: 69, y: -15 + p, angle: 90 }) },
    {
      length: arc,
      point: (p: number) => ({
        x: 56 + radius * Math.cos(p / radius),
        y: 15 + radius * Math.sin(p / radius),
        angle: 90 + ((p / radius) * 180) / Math.PI,
      }),
    },
    { length: horizontal, point: (p: number) => ({ x: 56 - p, y: 28, angle: 180 }) },
    {
      length: arc,
      point: (p: number) => ({
        x: -56 + radius * Math.cos(p / radius + Math.PI / 2),
        y: 15 + radius * Math.sin(p / radius + Math.PI / 2),
        angle: 180 + ((p / radius) * 180) / Math.PI,
      }),
    },
    { length: vertical, point: (p: number) => ({ x: -69, y: 15 - p, angle: 270 }) },
    {
      length: arc,
      point: (p: number) => ({
        x: -56 + radius * Math.cos(p / radius + Math.PI),
        y: -15 + radius * Math.sin(p / radius + Math.PI),
        angle: 270 + ((p / radius) * 180) / Math.PI,
      }),
    },
  ];
  for (const segment of segments) {
    if (distance <= segment.length) return { id: index, ...segment.point(distance) };
    distance -= segment.length;
  }
  return { id: index, x: -56, y: -28, angle: 0 };
}
export function specimenCells(specimen: Specimen) {
  const cells: { id: number; x: number; y: number; width: number; height: number }[] = [];
  const width = specimen === 'leaf' ? 160 : specimen === 'cork' ? 85 : 65;
  const height = specimen === 'leaf' ? 74 : specimen === 'cork' ? 54 : 55;
  for (let row = -18; row <= 18; row++)
    for (let col = -12; col <= 12; col++) {
      cells.push({
        id: (row + 18) * 25 + col + 12,
        x: col * width + (row % 2) * width * 0.22,
        y: row * height,
        width: width - 5,
        height: height - 5,
      });
    }
  return cells;
}
export function visibleCells(specimen: Specimen, fieldUm: number, offsetX = 0) {
  fieldUm = clamp(finite(fieldUm, 450), 1, 18000);
  offsetX = finite(offsetX);
  return specimenCells(specimen).filter(
    (c) =>
      Math.abs(c.x - offsetX) < fieldUm / 2 + c.width && Math.abs(c.y) < fieldUm / 2 + c.height,
  );
}

export const microscopyChapters = [
  'cork',
  'common-structure',
  'locate',
  'magnify',
  'chloroplasts',
  'stream',
] as const;
export const microscopyDurations = [25.5, 40.5, 27, 34, 24.5, 30] as const;
export const TARGET_CELL_ID = 462;
export const LEAF_GEOMETRY = Object.freeze({
  width: 155,
  height: 69,
  vacuoleWidth: 131,
  vacuoleHeight: 45,
  vacuoleRadius: 16,
});
export const WALL_LANDMARK = Object.freeze({ x: -77.5, y: -34.5 });

/** Conservative whole-outline tests, not a center-only visibility test. */
export function targetVisibility(objective: number, fieldCenterX: number) {
  const cell = specimenCells('leaf').find((c) => c.id === TARGET_CELL_ID)!;
  const r = microscopeOptics(objective).fieldUm / 2;
  const dx = Math.abs(cell.x - finite(fieldCenterX));
  const nearest = Math.max(0, dx - cell.width / 2);
  const farthest = Math.hypot(dx + cell.width / 2, cell.height / 2);
  return {
    id: cell.id,
    radiusUm: r,
    distanceUm: dx,
    fullyInside: farthest < r,
    fullyOutside: nearest > r,
  };
}

/** Late cytokinesis only. Nuclear division has already finished before t=0.
 * The original wall is unchanged; the plate grows centrally toward that wall.
 * It is a modern explanatory relationship, not a historical time-lapse. */
export function cellPlate(progress: number) {
  const p = clamp(progress);
  return {
    parentId: 'A',
    parent: { x: -90, y: -50, width: 180, height: 100, radius: 14 },
    nuclei: [
      { id: 'n1', x: -45, y: 0, radius: 11 },
      { id: 'n2', x: 45, y: 0, radius: 11 },
    ],
    plate: { x: 0, y1: -50 * p, y2: 50 * p, connected: p === 1 },
    childIds: p === 1 ? ['A1', 'A2'] : [],
    // Ideal section area, including rounded outer corners; wall thickness omitted.
    parentArea: 180 * 100 - (4 - Math.PI) * 14 * 14,
    separatedArea: p === 1 ? (180 * 100 - (4 - Math.PI) * 14 * 14) / 2 : null,
  };
}

/** A single frozen low-pass sampled teaching image. The two original point
 * features are not resolved at this chosen blur width. Not a calibrated PSF.
 * Display enlargement repeats these exact pixels; no new optical sampling. */
export const fixedMicroscopyImage = (() => {
  const width = 24,
    height = 18,
    sigma = 3.2;
  const raw = Array.from({ length: width * height }, (_, i) => {
    const x = i % width,
      y = Math.floor(i / width);
    return [-1.5, 1.5].reduce(
      (sum, dx) => sum + Math.exp(-((x - 11.5 - dx) ** 2 + (y - 8.5) ** 2) / (2 * sigma * sigma)),
      0,
    );
  });
  const peak = Math.max(...raw);
  return Object.freeze({
    width,
    height,
    pixels: Object.freeze(raw.map((v) => Math.round((v / peak) * 255))),
    sigma,
    sourcePoints: Object.freeze([
      { x: 10, y: 8.5 },
      { x: 13, y: 8.5 },
    ]),
  });
})();
export function enlargeRecordedImage(factor: number) {
  const zoom = Math.round(clamp(finite(factor, 1), 1, 6)),
    src = fixedMicroscopyImage;
  const width = src.width * zoom,
    height = src.height * zoom;
  return {
    width,
    height,
    zoom,
    pixels: Array.from(
      { length: width * height },
      (_, i) =>
        src.pixels[
          Math.floor(Math.floor(i / width) / zoom) * src.width + Math.floor((i % width) / zoom)
        ],
    ),
  };
}

export type MovementCondition = 'drift' | 'flow' | 'both';
/** One shared displacement is added to every boundary and marker.
 * Relative motion is computed after that transform, never hand-labelled. */
export function registeredStreaming(
  seconds: number,
  condition: MovementCondition,
  driftOverride?: { x: number; y: number },
) {
  const time = clamp(seconds, 0, 120),
    flowing = condition !== 'drift';
  const drift = driftOverride
    ? { x: finite(driftOverride.x), y: finite(driftOverride.y) }
    : condition === 'flow'
      ? { x: 0, y: 0 }
      : { x: 14 * Math.sin(time * 0.18), y: 4 * Math.sin(time * 0.11) };
  const wall = { x: WALL_LANDMARK.x + drift.x, y: WALL_LANDMARK.y + drift.y };
  const chloroplasts = Array.from({ length: 18 }, (_, i) => {
    const local = leafChloroplast(i, time, flowing);
    return {
      ...local,
      localX: local.x,
      localY: local.y,
      x: local.x + drift.x,
      y: local.y + drift.y,
    };
  });
  const tracked = chloroplasts[3],
    initial = leafChloroplast(3, 0, false);
  const relative = { x: tracked.x - wall.x, y: tracked.y - wall.y };
  const displacement = {
    x: relative.x - (initial.x - WALL_LANDMARK.x),
    y: relative.y - (initial.y - WALL_LANDMARK.y),
  };
  return {
    time,
    drift,
    wall,
    chloroplasts,
    relative,
    displacement,
    distance: Math.hypot(displacement.x, displacement.y),
    initial: { x: initial.x + drift.x, y: initial.y + drift.y, angle: initial.angle },
  };
}

/** Cuts are chapter-relative seconds from the independently transcribed final
 * recording (181.5 s). Language-specific cuts preserve the evidence order;
 * they never change specimen geometry or the independent scientific models.
 * All states reconstruct deterministically after a paused seek. */
export function microscopyDirector(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const index = Math.trunc(clamp(chapter, 0, 5)),
    t = clamp(seconds, 0, microscopyDurations[index]),
    en = locale === 'en';
  if (index === 0)
    return {
      shot:
        t < (en ? 5.4 : 6.4) ? 'cork-field' : t < (en ? 11 : 14.2) ? 'cork-detail' : 'cork-limit',
      t,
      objective: 40,
      center: 0,
      progress: between(t, 4, 8),
      clock: 0,
      drift: { x: 0, y: 0 },
    };
  if (index === 1)
    return {
      shot:
        t < (en ? 15.4 : 14.1) ? 'tissues' : t < (en ? 19.2 : 18.3) ? 'former-idea' : 'division',
      t,
      objective: 40,
      center: 0,
      // Establish the existing parent and already-separated nuclei first.
      // Grow the new plate only when the voice names that partition.
      progress: between(t, en ? 24.2 : 22.3, en ? 26.7 : 25.8),
      clock: 0,
      drift: { x: 0, y: 0 },
    };
  if (index === 2) {
    const lostStart = en ? 3.4 : 4.65,
      lostEnd = en ? 4.2 : 5.55,
      diagram = en ? 7.2 : 9,
      returnLow = en ? 13.7 : 15.85,
      centerStart = en ? 15.3 : 16.95,
      centerEnd = en ? 16.15 : 18,
      highAgain = en ? 16.5 : 18.15,
      highEnd = en ? 17.3 : 19;
    const objective =
      t < returnLow
        ? 10 + 30 * between(t, lostStart, lostEnd)
        : t < highAgain
          ? 40 - 30 * between(t, returnLow, returnLow + 0.6)
          : 10 + 30 * between(t, highAgain, highEnd);
    return {
      shot: t >= diagram && t < returnLow ? 'nested-fields' : 'target-field',
      t,
      objective,
      center: -480 * (1 - between(t, centerStart, centerEnd)),
      progress: t / microscopyDurations[index],
      clock: 0,
      drift: { x: 0, y: 0 },
    };
  }
  if (index === 3)
    return {
      shot:
        t < (en ? 13.4 : 12.8)
          ? 'cell-scale'
          : t < (en ? 20.05 : 22.05)
            ? 'tissues'
            : 'fixed-image',
      t,
      objective: 10 + 30 * between(t, 1.4, 3.4),
      center: 0,
      progress: between(t, en ? 20.7 : 23.4, en ? 23.1 : 26),
      clock: 0,
      drift: { x: 0, y: 0 },
    };
  if (index === 4)
    return {
      shot: t < 1.85 ? 'selected-cell' : 'cell-closeup',
      t,
      objective: 40,
      center: 0,
      progress: between(t, 1.85, 4),
      clock: 0,
      drift: { x: 0, y: 0 },
    };
  const flowStart = en ? 8.8 : 10.25,
    registrationStart = en ? 6.05 : 7.05,
    registrationEnd = en ? 8.6 : 9.65,
    sharedStart = en ? 18.1 : 21.2,
    sharedEnd = en ? 21.9 : 25.8,
    clock = Math.max(0, t - flowStart),
    startDrift =
      14 *
      between(t, 0, registrationStart - 0.4) *
      (1 - between(t, registrationStart, registrationEnd));
  return {
    shot: t < flowStart ? 'drift-only' : t < sharedStart ? 'relative-flow' : 'shared-drift',
    t,
    objective: 40,
    center: 0,
    progress: t / microscopyDurations[index],
    clock,
    drift: { x: startDrift + 14 * between(t, sharedStart, sharedEnd), y: 0 },
  };
}
