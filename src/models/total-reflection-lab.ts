import { finiteClamp } from './modern-labs';
import { refractOut, type RayPoint } from './geometric-optics-lab';
const cross = (a: RayPoint, b: RayPoint) => a.x * b.y - a.y * b.x;
const dot = (a: RayPoint, b: RayPoint) => a.x * b.x + a.y * b.y;
const sub = (a: RayPoint, b: RayPoint) => ({ x: a.x - b.x, y: a.y - b.y });
export function interfacePower(angle: number, n1 = 1.5, n2 = 1) {
  const i = finiteClamp(angle, 0, Math.PI / 2),
    s = (n1 / n2) * Math.sin(i);
  if (s >= 1) return { R: 1, T: 0, transmitted: null };
  const r = Math.asin(s),
    ci = Math.cos(i),
    cr = Math.cos(r),
    rs = (n1 * ci - n2 * cr) / (n1 * ci + n2 * cr),
    rp = (n2 * ci - n1 * cr) / (n2 * ci + n1 * cr),
    R = (rs * rs + rp * rp) / 2;
  return { R, T: 1 - R, transmitted: r };
}
export type GuideStep = {
  from: RayPoint;
  to: RayPoint;
  power: number;
  angle: number;
  R: number;
  normal: RayPoint;
  leak: { to: RayPoint; power: number } | null;
};
/** A two-dimensional ray follows the reflected branch. Each escaping branch retains Fresnel power. */
export function traceGuide(polygon: RayPoint[], start: RayPoint, direction: RayPoint, n = 1.49) {
  const steps: GuideStep[] = [],
    area = polygon.reduce((s, p, j) => s + cross(p, polygon[(j + 1) % polygon.length]), 0),
    sign = area > 0 ? 1 : -1;
  let p = { ...start },
    d = { ...direction },
    power = 1;
  const extent = Math.max(...polygon.map((p) => Math.hypot(p.x, p.y)), 0.1);
  for (let k = 0; k < 40 && power > 0.005; k++) {
    let best: { t: number; edge: number; point: RayPoint } | null = null;
    for (let j = 0; j < polygon.length; j++) {
      const a = polygon[j],
        b = polygon[(j + 1) % polygon.length],
        s = sub(b, a),
        q = sub(a, p),
        den = cross(d, s);
      if (Math.abs(den) < 1e-12) continue;
      const t = cross(q, s) / den,
        u = cross(q, d) / den;
      if (t > 1e-7 && u >= -1e-9 && u <= 1 + 1e-9 && (!best || t < best.t))
        best = { t, edge: j, point: { x: p.x + t * d.x, y: p.y + t * d.y } };
    }
    if (!best) break;
    const a = polygon[best.edge],
      b = polygon[(best.edge + 1) % polygon.length],
      s = sub(b, a),
      length = Math.hypot(s.x, s.y),
      normal = { x: (sign * s.y) / length, y: (-sign * s.x) / length },
      cos = Math.max(0, Math.min(1, dot(d, normal))),
      angle = Math.acos(cos),
      f = interfacePower(angle, n, 1),
      out = refractOut(d, normal, n, 1);
    steps.push({
      from: { ...p },
      to: best.point,
      power,
      angle,
      R: f.R,
      normal,
      leak:
        out && f.T > 1e-5
          ? {
              to: {
                x: best.point.x + out.x * extent * 0.35,
                y: best.point.y + out.y * extent * 0.35,
              },
              power: power * f.T,
            }
          : null,
    });
    power *= f.R;
    d = { x: d.x - 2 * cos * normal.x, y: d.y - 2 * cos * normal.y };
    p = { x: best.point.x + d.x * 1e-6, y: best.point.y + d.y * 1e-6 };
  }
  return steps;
}
export function curvedRod(radius = 1.5, entryAngle = 0) {
  const R = finiteClamp(radius, 0.28, 2.5),
    width = 0.3,
    n = 1.49,
    outer = Array.from({ length: 121 }, (_, j) => {
      const a = -Math.PI / 2 + (j * Math.PI) / 240;
      return { x: (R + width / 2) * Math.cos(a), y: (R + width / 2) * Math.sin(a) };
    }),
    inner = Array.from({ length: 121 }, (_, j) => {
      const a = (-j * Math.PI) / 240;
      return { x: (R - width / 2) * Math.cos(a), y: (R - width / 2) * Math.sin(a) };
    }),
    polygon = [...outer, ...inner],
    angle = Math.asin(Math.sin((finiteClamp(entryAngle, -20, 20) * Math.PI) / 180) / n),
    start = { x: 1e-5, y: -R },
    steps = traceGuide(polygon, start, { x: Math.cos(angle), y: Math.sin(angle) }, n);
  return { R, width, n, polygon, steps, start };
}
export function waterJet(speed = 2, entryAngle = 0) {
  const v = finiteClamp(speed, 0.8, 3),
    g = 9.81,
    r0 = 0.012,
    n = 1.333,
    center = (x: number) => ({ x, y: (g * x * x) / (2 * v * v) }),
    side = (x: number, s: number) => {
      const p = center(x),
        slope = (g * x) / (v * v),
        norm = Math.hypot(1, slope),
        r = r0 / (1 + ((g * x) / (v * v)) ** 2) ** 0.25;
      return { x: p.x - ((s * slope) / norm) * r, y: p.y + (s / norm) * r };
    },
    lower = Array.from({ length: 181 }, (_, j) => side((j * 0.35) / 180, 1)),
    upper = Array.from({ length: 181 }, (_, j) => side(((180 - j) * 0.35) / 180, -1)),
    polygon = [...lower, ...upper],
    angle = (finiteClamp(entryAngle, -8, 8) * Math.PI) / 180,
    start = { x: 1e-6, y: 0 },
    steps = traceGuide(polygon, start, { x: Math.cos(angle), y: Math.sin(angle) }, n);
  return { speed: v, n, polygon, steps, start, center };
}
export function corkIndex(depth = 20, radius = 20, index = 1.333) {
  const h = finiteClamp(depth, 5, 45),
    r = finiteClamp(radius, 10, 30),
    n = finiteClamp(index, 1.1, 1.8),
    angle = Math.atan(r / h),
    critical = Math.asin(1 / n),
    boundaryDepth = r * Math.sqrt(n * n - 1);
  return {
    depth: h,
    radius: r,
    index: n,
    angle,
    critical,
    boundaryDepth,
    hidden: angle >= critical,
    inferredAtBoundary: Math.hypot(r, h) / r,
    ray: interfacePower(angle, n, 1),
  };
}
