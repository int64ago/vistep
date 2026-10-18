import { finiteClamp } from './modern-labs';
export type RayPoint = { x: number; y: number };
const dot = (a: RayPoint, b: RayPoint) => a.x * b.x + a.y * b.y;
export function refractOut(direction: RayPoint, normal: RayPoint, n1: number, n2: number) {
  const cos = dot(direction, normal),
    eta = n1 / n2,
    tx = eta * (direction.x - cos * normal.x),
    ty = eta * (direction.y - cos * normal.y),
    q = 1 - tx * tx - ty * ty;
  if (q < 0) return null;
  return { x: tx + Math.sqrt(q) * normal.x, y: ty + Math.sqrt(q) * normal.y };
}
function circleExit(p: RayPoint, d: RayPoint, r: number) {
  const b = dot(p, d),
    root = b * b + r * r - dot(p, p);
  if (root < 0) return null;
  const t = -b + Math.sqrt(root);
  if (t < 1e-8) return null;
  return { x: p.x + t * d.x, y: p.y + t * d.y };
}
function traceCylinder(source: RayPoint, angle: number) {
  const d = { x: Math.cos(angle), y: Math.sin(angle) },
    water = circleExit(source, d, 1);
  if (!water) return null;
  const glassDirection = refractOut(d, water, 1.333, 1.5);
  if (!glassDirection) return null;
  const glass = circleExit(water, glassDirection, 1.06);
  if (!glass) return null;
  const airDirection = refractOut(glassDirection, { x: glass.x / 1.06, y: glass.y / 1.06 }, 1.5, 1);
  if (!airDirection || airDirection.x <= 0) return null;
  const eye = { x: 3, y: glass.y + ((3 - glass.x) * airDirection.y) / airDirection.x };
  return { source, water, glass, eye, direction: airDirection };
}
export function cylinderRay(source: RayPoint, eyeY = 0) {
  let previous: { angle: number; error: number } | null = null;
  for (let i = 0; i <= 240; i++) {
    const angle = -1.4 + (i * 2.8) / 240,
      ray = traceCylinder(source, angle);
    if (!ray) {
      previous = null;
      continue;
    }
    const error = ray.eye.y - eyeY;
    if (previous && previous.error * error <= 0) {
      let lo = previous.angle,
        hi = angle;
      for (let j = 0; j < 42; j++) {
        const mid = (lo + hi) / 2,
          r = traceCylinder(source, mid);
        if (!r) return null;
        if ((r.eye.y - eyeY) * previous.error > 0) lo = mid;
        else hi = mid;
      }
      return traceCylinder(source, (lo + hi) / 2);
    }
    previous = { angle, error };
  }
  return null;
}
export function cylinderImage(offset = 0.2) {
  const source = { x: -0.35, y: finiteClamp(offset, -0.35, 0.35) },
    rays = [cylinderRay(source, -0.025), cylinderRay(source, 0.025)];
  if (!rays[0] || !rays[1]) return null;
  const a = rays[0],
    b = rays[1],
    den = a.direction.x * b.direction.y - a.direction.y * b.direction.x;
  if (Math.abs(den) < 1e-8) return null;
  const delta = { x: b.glass.x - a.glass.x, y: b.glass.y - a.glass.y },
    t = (delta.x * b.direction.y - delta.y * b.direction.x) / den;
  return {
    source,
    rays: [a, b],
    image: { x: a.glass.x + t * a.direction.x, y: a.glass.y + t * a.direction.y },
  };
}
export function chopstickImage(offset = 0.2, diameter = 0.05) {
  const center = cylinderImage(offset),
    a = cylinderImage(offset - diameter / 2),
    b = cylinderImage(offset + diameter / 2);
  return center && a && b
    ? {
        ...center,
        projectedY: (center.image.y * 3.35) / (3 - center.image.x),
        width: Math.abs(
          (b.image.y * 3.35) / (3 - b.image.x) - (a.image.y * 3.35) / (3 - a.image.x),
        ),
        magnification:
          Math.abs((b.image.y * 3.35) / (3 - b.image.x) - (a.image.y * 3.35) / (3 - a.image.x)) /
          diameter,
      }
    : null;
}
export function slabPins(angle = 45, index = 1.5, pinOffset = 0) {
  const i = (finiteClamp(angle, 20, 60) * Math.PI) / 180,
    n = finiteClamp(index, 1.3, 1.8),
    r = Math.asin(Math.sin(i) / n),
    entry = { x: 135, y: 130 },
    exit = { x: 135 + 75 * Math.tan(r), y: 205 },
    before = (d: number) => ({ x: entry.x - d * Math.sin(i), y: entry.y - d * Math.cos(i) }),
    after = (d: number) => ({ x: exit.x + d * Math.sin(i), y: exit.y + d * Math.cos(i) }),
    A = before(105),
    B = before(50),
    D = after(80),
    eye = after(115),
    C = { ...after(38), x: after(38).x + finiteClamp(pinOffset, -25, 25) },
    baseline = Math.atan2(D.x - eye.x, D.y - eye.y),
    view = Math.atan2(C.x - eye.x, C.y - eye.y) - baseline;
  return {
    i,
    r,
    n,
    entry,
    exit,
    A,
    B,
    C,
    D,
    eye,
    viewOffset: view * 130,
    inferred: Math.sin(i) / Math.sin(r),
    shift: (75 * Math.sin(i - r)) / Math.cos(r),
  };
}
export function apparentPlate(depth = 80, index = 1.5, angle = 25) {
  const d = finiteClamp(depth, 20, 120),
    n = finiteClamp(index, 1.3, 1.8),
    i = (finiteClamp(angle, 0, 50) * Math.PI) / 180,
    r = Math.asin(Math.sin(i) / n),
    apparent = i < 1e-6 ? d / n : (d * Math.tan(r)) / Math.tan(i);
  return { depth: d, index: n, angle: i, inside: r, apparent };
}
