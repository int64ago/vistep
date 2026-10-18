export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  const q = clamp(v);
  return q * q * (3 - 2 * q);
};
export function historicalState(temperature: number) {
  const melted = smooth((temperature + 0.06) / 0.12),
    clear = smooth((temperature - 0.94) / 0.12);
  return {
    melted,
    clear,
    cloudy: melted * (1 - clear),
    phase: temperature < 0 ? 'solid' : temperature < 1 ? 'mesophase' : 'isotropic',
  };
}
export type P = { x: number; y: number };
const polygonArea = (p: P[]) =>
  Math.abs(
    p.reduce((s, a, i) => {
      const b = p[(i + 1) % p.length];
      return s + a.x * b.y - a.y * b.x;
    }, 0),
  ) / 2;
function below(p: P[], level: number) {
  const out: P[] = [];
  p.forEach((a, i) => {
    const b = p[(i + 1) % p.length],
      inside = a.y >= level,
      next = b.y >= level;
    if (inside) out.push(a);
    if (inside !== next) {
      const u = (level - a.y) / (b.y - a.y);
      out.push({ x: a.x + u * (b.x - a.x), y: level });
    }
  });
  return out;
}
export function sampleCell(degrees: number) {
  const a = (degrees * Math.PI) / 180,
    point = (x: number, y: number) => ({
      x: 160 + x * Math.cos(a) - y * Math.sin(a),
      y: 122 + x * Math.sin(a) + y * Math.cos(a),
    });
  const boundary = [point(-80, -45), point(80, -45), point(80, 45), point(-80, 45)],
    solid = [point(-72, -10), point(72, -10), point(72, 35), point(-72, 35)],
    target = 6480;
  let lo = 50,
    hi = 195;
  for (let n = 0; n < 60; n++) {
    const mid = (lo + hi) / 2;
    if (polygonArea(below(boundary, mid)) > target) lo = mid;
    else hi = mid;
  }
  const level = (lo + hi) / 2,
    fluid = below(boundary, level);
  return { boundary, solid, fluid, level, area: polygonArea(fluid), target };
}
type Particle = { id: number; x: number; y: number; vx: number; vy: number };
const init: Particle[] = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: 45 + 46 * (i % 6),
  y: 43 + 50 * Math.floor(i / 6),
  vx: 13 * Math.cos(i * 2.399 + 0.1),
  vy: 13 * Math.sin(i * 2.399 + 0.1),
}));
const frames: Particle[][] = [init.map((p) => ({ ...p }))];
/** Bounded hard-centre trajectories only illustrate mobility, not molecular dynamics. */
for (let n = 1; n <= 1000; n++) {
  const ps = frames[n - 1].map((p) => ({ ...p, x: p.x + p.vx * 0.02, y: p.y + p.vy * 0.02 }));
  for (let pass = 0; pass < 3; pass++) {
    ps.forEach((p) => {
      if (p.x < 25) {
        p.x = 50 - p.x;
        p.vx = Math.abs(p.vx);
      }
      if (p.x > 295) {
        p.x = 590 - p.x;
        p.vx = -Math.abs(p.vx);
      }
      if (p.y < 25) {
        p.y = 50 - p.y;
        p.vy = Math.abs(p.vy);
      }
      if (p.y > 225) {
        p.y = 450 - p.y;
        p.vy = -Math.abs(p.vy);
      }
    });
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i],
          b = ps[j],
          dx = b.x - a.x,
          dy = b.y - a.y,
          r = Math.hypot(dx, dy);
        if (r < 27) {
          const nx = dx / r,
            ny = dy / r,
            push = (27 - r) / 2;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
          const v = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (v < 0) {
            a.vx += v * nx;
            a.vy += v * ny;
            b.vx -= v * nx;
            b.vy -= v * ny;
          }
        }
      }
  }
  frames.push(ps);
}
export function microscopic(time: number, disorder = 0) {
  const u = Math.max(0, Math.min(20, time)) / 0.02,
    k = Math.min(999, Math.floor(u)),
    f = u - k;
  return frames[k].map((p, i) => {
    const base = 0.35 + 0.16 * Math.sin(i * 2.19),
      iso = 0.35 + (i * Math.PI) / 24,
      delta = ((iso - base + Math.PI * 1.5) % Math.PI) - Math.PI / 2;
    return {
      ...p,
      x: p.x + (frames[k + 1][i].x - p.x) * f,
      y: p.y + (frames[k + 1][i].y - p.y) * f,
      angle: base + clamp(disorder) * delta,
    };
  });
}
export function order(ps: { x: number; y: number; angle: number }[]) {
  const mean = (fn: (p: (typeof ps)[number]) => number) =>
    ps.reduce((s, p) => s + fn(p), 0) / ps.length;
  const orient = Math.hypot(
    mean((p) => Math.cos(2 * p.angle)),
    mean((p) => Math.sin(2 * p.angle)),
  );
  const px = Math.hypot(
    mean((p) => Math.cos((2 * Math.PI * p.x) / 46)),
    mean((p) => Math.sin((2 * Math.PI * p.x) / 46)),
  );
  const py = Math.hypot(
    mean((p) => Math.cos((2 * Math.PI * p.y) / 50)),
    mean((p) => Math.sin((2 * Math.PI * p.y) / 50)),
  );
  return { orientation: orient, position: (px + py) / 2 };
}
export function ellipticK(k: number) {
  let a = 1,
    b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 30 && Math.abs(a - b) > 1e-14; i++) {
    const c = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = c;
  }
  return Math.PI / (2 * a);
}
/** Constant E, one Frank elastic constant, positive dielectric anisotropy,
 * strong planar anchoring: alpha'' + (pi v)^2 sin(alpha)cos(alpha)=0. */
export function directorProfile(voltageRatio: number) {
  const v = Math.max(0, Math.min(4, voltageRatio));
  if (v <= 1) return { k: 0, amplitude: 0, at: (_u: number) => 0 };
  let low = 0,
    high = 1 - 1e-12;
  for (let i = 0; i < 55; i++) {
    const m = (low + high) / 2;
    if ((2 * ellipticK(m)) / Math.PI < v) low = m;
    else high = m;
  }
  const k = (low + high) / 2,
    N = 512,
    rows = [{ z: 0, a: 0 }];
  let F = 0;
  const integrand = (p: number) => 1 / Math.sqrt(1 - k * k * Math.sin(p) ** 2);
  for (let i = 1; i <= N; i++) {
    const a = ((i - 1) * Math.PI) / (2 * N),
      b = (i * Math.PI) / (2 * N);
    F += ((b - a) / 6) * (integrand(a) + 4 * integrand((a + b) / 2) + integrand(b));
    rows.push({ z: F, a: Math.asin(k * Math.sin(b)) });
  }
  rows.forEach((r) => (r.z /= 2 * F));
  const at = (u: number) => {
    const z = Math.min(clamp(u), 1 - clamp(u));
    let lo = 0,
      hi = N;
    while (hi - lo > 1) {
      const m = Math.floor((lo + hi) / 2);
      if (rows[m].z < z) lo = m;
      else hi = m;
    }
    const f = (z - rows[lo].z) / (rows[hi].z - rows[lo].z);
    return rows[lo].a + (rows[hi].a - rows[lo].a) * f;
  };
  return { k, amplitude: Math.asin(k), at };
}
export function fieldCell(v: number) {
  const profile = directorProfile(v),
    no = 1.5,
    ne = 1.7,
    d = 1.375,
    lambda = 0.55,
    N = 80;
  let deltaN = 0;
  for (let i = 0; i <= N; i++) {
    const a = profile.at(i / N),
      n = 1 / Math.sqrt(Math.cos(a) ** 2 / ne ** 2 + Math.sin(a) ** 2 / no ** 2);
    deltaN += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * (n - no);
  }
  deltaN /= 3 * N;
  const retardance = (2 * Math.PI * d * deltaN) / lambda,
    intensity = Math.sin(retardance / 2) ** 2;
  return { ...profile, deltaN, retardance, intensity };
}
