export type MoireOptions = { pitch1?: number; pitch2?: number; angle?: number; offset?: number };
export type MoireVector = { x: number; y: number };
export function moireSetup({ pitch1 = 4, pitch2 = 4.4, angle = 0, offset = 0 }: MoireOptions = {}) {
  if (
    ![pitch1, pitch2, angle, offset].every(Number.isFinite) ||
    pitch1 <= 0 ||
    pitch2 <= 0 ||
    Math.abs(angle) > 45
  )
    throw new RangeError('Invalid grating');
  const a = (angle * Math.PI) / 180,
    q1 = { x: 1 / pitch1, y: 0 },
    q2 = { x: Math.cos(a) / pitch2, y: Math.sin(a) / pitch2 },
    difference = { x: q1.x - q2.x, y: -q2.y },
    length = Math.hypot(difference.x, difference.y);
  return {
    pitch1,
    pitch2,
    angle,
    offset,
    q1,
    q2,
    difference,
    period: length < 1e-12 ? null : 1 / length,
  };
}
export function moireAt(x: number, y: number, s: ReturnType<typeof moireSetup>) {
  const A = 2 * Math.PI * (s.q1.x * x + s.q1.y * y),
    B = 2 * Math.PI * (s.q2.x * x + s.q2.y * y - s.offset / s.pitch2),
    first = (1 + Math.cos(A)) / 2,
    second = (1 + Math.cos(B)) / 2,
    slow = (1 + Math.cos(A - B)) / 2;
  return { first, second, product: first * second, slow, A, B };
}
/** Intersections of a grating phase contour q.r+phase=0 with a finite physical viewport. */
export function moireContour(q: MoireVector, phase: number, width = 90, height = 56) {
  const points: MoireVector[] = [];
  if (Math.abs(q.y) > 1e-12)
    for (const x of [-width / 2, width / 2]) {
      const y = (-phase - q.x * x) / q.y;
      if (Math.abs(y) <= height / 2 + 1e-9) points.push({ x, y });
    }
  if (Math.abs(q.x) > 1e-12)
    for (const y of [-height / 2, height / 2]) {
      const x = (-phase - q.y * y) / q.x;
      if (
        Math.abs(x) <= width / 2 + 1e-9 &&
        !points.some((p) => Math.hypot(p.x - x, p.y - y) < 1e-8)
      )
        points.push({ x, y });
    }
  return points.slice(0, 2);
}
export function moireShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    pitch1: 4,
    pitch2: chapter === 2 ? 4.8 - 0.6 * p : chapter === 3 || chapter === 5 ? 4 : 4.4,
    angle: chapter === 3 ? 2 + 10 * p : 0,
    offset: chapter === 4 ? 4.4 * p : 0,
    single: chapter === 0,
    track: chapter === 4,
  };
}
