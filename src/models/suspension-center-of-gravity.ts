export type Point2 = { x: number; y: number };
export const LAMINA_SHAPES = {
  irregular: [
    { x: -92, y: -72 },
    { x: 38, y: -88 },
    { x: 90, y: -25 },
    { x: 63, y: 70 },
    { x: -20, y: 92 },
    { x: -83, y: 32 },
  ],
  triangle: [
    { x: -85, y: 70 },
    { x: 10, y: -85 },
    { x: 92, y: 70 },
  ],
} satisfies Record<string, Point2[]>;
export function polygonCentroid(points: Point2[]) {
  let crossSum = 0,
    x = 0,
    y = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      q = points[(i + 1) % points.length],
      cross = p.x * q.y - q.x * p.y;
    crossSum += cross;
    x += (p.x + q.x) * cross;
    y += (p.y + q.y) * cross;
  }
  if (Math.abs(crossSum) < 1e-9) throw new RangeError('Nondegenerate polygon required.');
  return { x: x / (3 * crossSum), y: y / (3 * crossSum), area: Math.abs(crossSum) / 2 };
}
export const LAMINA_WEIGHT = { x: 45, y: 20 };
export function laminaCenter(points: Point2[], addedMass = 0) {
  if (!Number.isFinite(addedMass) || addedMass < 0)
    throw new RangeError('Nonnegative added mass required.');
  const c = polygonCentroid(points);
  return {
    x: (c.x + addedMass * LAMINA_WEIGHT.x) / (1 + addedMass),
    y: (c.y + addedMass * LAMINA_WEIGHT.y) / (1 + addedMass),
  };
}
export function suspensionHoles(points: Point2[]) {
  const c = polygonCentroid(points);
  return points.map((p) => ({ x: p.x + 0.08 * (c.x - p.x), y: p.y + 0.08 * (c.y - p.y) }));
}
/** Small-angle damped physical-pendulum settling, using the polygon's actual area inertia. */
export function suspensionOffset(
  points: Point2[],
  pivotIndex: number,
  seconds: number,
  addedMass = 0,
) {
  const state = suspensionState(points, pivotIndex, addedMass),
    centroid = polygonCentroid(points);
  let crossSum = 0,
    moment = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      cross = a.x * b.y - b.x * a.y;
    crossSum += cross;
    moment += cross * (a.x * a.x + a.x * b.x + b.x * b.x + a.y * a.y + a.y * b.y + b.y * b.y);
  }
  const central = moment / (6 * crossSum) - centroid.x ** 2 - centroid.y ** 2;
  const inertia =
    central +
    (centroid.x - state.pivot.x) ** 2 +
    (centroid.y - state.pivot.y) ** 2 +
    addedMass * ((LAMINA_WEIGHT.x - state.pivot.x) ** 2 + (LAMINA_WEIGHT.y - state.pivot.y) ** 2);
  const distance = Math.hypot(state.center.x - state.pivot.x, state.center.y - state.pivot.y),
    omega2 = ((1 + addedMass) * 9.8 * distance) / (inertia * 0.003),
    gamma = 1.2,
    wd = Math.sqrt(Math.max(0.1, omega2 - gamma * gamma)),
    t = Math.max(0, seconds);
  return 0.18 * Math.exp(-gamma * t) * (Math.cos(wd * t) + (gamma / wd) * Math.sin(wd * t));
}
export function suspensionState(points: Point2[], pivotIndex: number, addedMass = 0) {
  const holes = suspensionHoles(points);
  const pivot = holes[((Math.floor(pivotIndex) % points.length) + points.length) % points.length],
    center = laminaCenter(points, addedMass),
    angle = Math.PI / 2 - Math.atan2(center.y - pivot.y, center.x - pivot.x),
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  const transform = (p: Point2) => ({
    x: (p.x - pivot.x) * cos - (p.y - pivot.y) * sin,
    y: (p.x - pivot.x) * sin + (p.y - pivot.y) * cos,
  });
  return { pivot, center, angle, transform, centerWorld: transform(center) };
}
export function plumbTrace(pivot: Point2, center: Point2) {
  const dx = center.x - pivot.x,
    dy = center.y - pivot.y,
    len = Math.hypot(dx, dy);
  if (len < 1e-10) throw new RangeError('Pivot cannot equal center.');
  return [
    { x: pivot.x - (dx / len) * 200, y: pivot.y - (dy / len) * 200 },
    { x: pivot.x + (dx / len) * 300, y: pivot.y + (dy / len) * 300 },
  ];
}
export function lineIntersection(a: Point2, b: Point2, c: Point2, d: Point2) {
  const ux = b.x - a.x,
    uy = b.y - a.y,
    vx = d.x - c.x,
    vy = d.y - c.y,
    den = ux * vy - uy * vx;
  if (Math.abs(den) < 1e-10) return null;
  const q = ((c.x - a.x) * vy - (c.y - a.y) * vx) / den;
  return { x: a.x + q * ux, y: a.y + q * uy };
}
