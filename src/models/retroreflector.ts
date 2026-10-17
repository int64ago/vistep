export type CornerVector = [number, number, number];
export const cornerDot = (a: CornerVector, b: CornerVector) =>
  a.reduce((s, v, i) => s + v * b[i], 0);
export const cornerLength = (v: CornerVector) => Math.hypot(...v);
export const cornerUnit = (v: CornerVector): CornerVector => {
  const l = cornerLength(v);
  if (!l) throw new RangeError('Zero direction');
  return v.map((x) => x / l) as CornerVector;
};
const cross = (a: CornerVector, b: CornerVector): CornerVector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
/** Three finite mirrors on x/y/z=0, trimmed by the triangular entrance x+y+z=1. */
export function cornerTrace(
  entry: CornerVector = [0.15, 0.45, 0.4],
  direction: CornerVector = [-1.2, -1.1, -0.7],
  mirrors: [boolean, boolean, boolean] = [true, true, true],
) {
  if (
    ![...entry, ...direction].every(Number.isFinite) ||
    entry.some((x) => x <= 0) ||
    Math.abs(entry.reduce((s, v) => s + v, 0) - 1) > 1e-9 ||
    direction.some((x) => x >= 0)
  )
    throw new RangeError('Invalid finite corner input');
  const initial = cornerUnit(direction);
  let d = [...initial] as CornerVector,
    p = [...entry] as CornerVector;
  const points: CornerVector[] = [
      entry.map((v, i) => v - initial[i] * 0.9) as CornerVector,
      [...entry],
    ],
    events: {
      point: CornerVector;
      axes: number[];
      direction: CornerVector;
      kind: 'mirror' | 'exit' | 'open';
    }[] = [];
  let internalLength = 0,
    exit = [...entry] as CornerVector;
  for (let step = 0; step < 8; step++) {
    const times = p.map((v, i) => (d[i] < -1e-12 ? -v / d[i] : Infinity));
    const sum = d.reduce((s, v) => s + v, 0),
      exitTime = sum > 1e-12 ? (1 - p.reduce((s, v) => s + v, 0)) / sum : Infinity;
    const distance = Math.min(...times, exitTime);
    if (!Number.isFinite(distance) || distance < -1e-8)
      throw new Error('Corner trace lost its boundary');
    p = p.map((v, i) => Math.max(0, v + d[i] * Math.max(0, distance))) as CornerVector;
    internalLength += Math.max(0, distance);
    points.push([...p]);
    const axes = times
      .map((v, i) => (Math.abs(v - distance) < 1e-9 ? i : -1))
      .filter((i) => i >= 0);
    if (exitTime <= distance + 1e-9) {
      exit = [...p];
      events.push({ point: [...p], axes: [], direction: [...d], kind: 'exit' });
      break;
    }
    if (axes.some((i) => !mirrors[i])) {
      exit = [...p];
      events.push({ point: [...p], axes, direction: [...d], kind: 'open' });
      break;
    }
    for (const axis of axes) d[axis] = -d[axis];
    events.push({ point: [...p], axes, direction: [...d], kind: 'mirror' });
  }
  const reflections = events.reduce((n, e) => n + (e.kind === 'mirror' ? e.axes.length : 0), 0),
    externalExtent = reflections === 3 ? 1.3 : 0.9;
  points[0] = entry.map((v, i) => v - initial[i] * externalExtent) as CornerVector;
  points.push(exit.map((v, i) => v + d[i] * externalExtent) as CornerVector);
  const error =
    (Math.atan2(cornerLength(cross(initial, d)), -cornerDot(initial, d)) * 180) / Math.PI;
  const shift = exit.map((v, i) => v - entry[i]) as CornerVector;
  return {
    entry,
    initial,
    outgoing: d,
    exit,
    points,
    events,
    internalLength,
    reflections,
    error,
    offset: cornerLength(cross(shift, initial)),
  };
}
/** Fixed oblique camera: all three faces visible and sourceward paths separated on screen. */
const camera = cornerUnit([1, 3, 10]),
  nominal: CornerVector = [12, 11, 7];
const horizontal = cornerUnit(
  nominal.map((v, i) => -(v - cornerDot(nominal, camera) * camera[i])) as CornerVector,
);
const vertical = cross(camera, horizontal);
export function cornerProjection(p: CornerVector) {
  return { x: cornerDot(p, horizontal), y: cornerDot(p, vertical) };
}
export function cornerShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const entry: CornerVector =
    chapter === 4
      ? [0.15 + 0.1 * p, 0.45, 0.4 - 0.1 * p]
      : chapter === 5
        ? [0.8, 0.12, 0.08]
        : [0.15, 0.45, 0.4];
  const direction: CornerVector =
    chapter === 3
      ? [-1 - 0.22 * Math.sin(p * 2 * Math.PI), -1 - 0.22 * Math.cos(p * 2 * Math.PI), -1]
      : chapter === 5
        ? [-1, -1, -1]
        : [-1.2, -1.1, -0.7];
  const mirrors: [boolean, boolean, boolean] =
    chapter === 0 ? [true, false, false] : chapter === 1 ? [true, true, false] : [true, true, true];
  return { entry, direction, mirrors };
}

export function cornerAim(degrees: number): CornerVector {
  const r = (degrees * Math.PI) / 180;
  return [-1.2 * Math.cos(r) + 1.1 * Math.sin(r), -1.2 * Math.sin(r) - 1.1 * Math.cos(r), -0.7];
}
export function cornerPulse(points: CornerVector[], fraction: number) {
  const lengths = points
    .slice(1)
    .map((p, i) => cornerLength(p.map((v, j) => v - points[i][j]) as CornerVector));
  let distance = Math.max(0, Math.min(1, fraction)) * lengths.reduce((s, v) => s + v, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const q = lengths[i] ? distance / lengths[i] : 0;
      return points[i].map((v, j) => v + (points[i + 1][j] - v) * q) as CornerVector;
    }
    distance -= lengths[i];
  }
  return points[0];
}
