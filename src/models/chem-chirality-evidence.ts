export type V = { x: number; y: number; z: number };
export const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const sub = (a: V, b: V) => add(a, mul(b, -1));
export const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: V, b: V): V => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const length = (a: V) => Math.hypot(a.x, a.y, a.z);
const unit = (a: V) => mul(a, 1 / (length(a) || 1));
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
export const tetra: V[] = [
  { x: 1, y: 1, z: 1 },
  { x: 1, y: -1, z: -1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
];
export const mirror = (p: V): V => ({ ...p, x: -p.x });
export function axisRotate(p: V, axis: V, angle: number): V {
  const u = unit(axis),
    co = Math.cos(angle),
    si = Math.sin(angle);
  return add(add(mul(p, co), mul(cross(u, p), si)), mul(u, dot(u, p) * (1 - co)));
}
export function camera(p: V, yaw = 0.48, pitch = 0.32) {
  return axisRotate(axisRotate(p, { x: 0, y: 1, z: 0 }, yaw), { x: 1, y: 0, z: 0 }, pitch);
}
export function reflected(angle: number) {
  return tetra.map((v) => axisRotate(mirror(v), { x: 0, y: 1, z: 1 }, angle));
}
export function handedness(points: V[]) {
  return dot(
    sub(points[0], points[3]),
    cross(sub(points[1], points[3]), sub(points[2], points[3])),
  );
}
export function matches(points: V[], identical = false) {
  const labels = identical ? ['A', 'B', 'C', 'C'] : ['A', 'B', 'C', 'D'];
  return points.map((p, i) =>
    tetra.some((q, j) => labels[i] === labels[j] && length(sub(p, q)) < 0.08),
  );
}
export type Face = { points: V[]; cap: boolean };
/** Chiral illustrative morphology, not indexed tartrate faces. Unequal box axes
 * plus four alternating corner truncations have point group 222. */
function crystalBase(): Face[] {
  const a = 0.72,
    b = 1.55,
    c = 0.95;
  const vertex = (x: number, y: number, z: number) => ({ x: x * a, y: y * b, z: z * c });
  let fs: Face[] = [
    [
      [-1, -1, -1],
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
    ],
    [
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [1, -1, 1],
    ],
    [
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
      [-1, -1, 1],
    ],
    [
      [-1, 1, -1],
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
    ],
    [
      [-1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
      [1, -1, -1],
    ],
    [
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ],
  ].map((f) => ({ points: f.map((v) => vertex(v[0], v[1], v[2])), cap: false }));
  for (const sign of [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]) {
    const n = { x: sign[0] / a, y: sign[1] / b, z: sign[2] / c },
      boundary = 2.25,
      cut: V[] = [];
    fs = fs.flatMap((f) => {
      const next: V[] = [];
      f.points.forEach((p, i) => {
        const q = f.points[(i + 1) % f.points.length],
          dp = dot(n, p) - boundary,
          dq = dot(n, q) - boundary;
        if (dp <= 1e-10) next.push(p);
        if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
          const r = add(p, mul(sub(q, p), dp / (dp - dq)));
          next.push(r);
          if (!cut.some((v) => length(sub(v, r)) < 1e-8)) cut.push(r);
        }
      });
      return next.length >= 3 ? [{ points: next, cap: f.cap }] : [];
    });
    if (cut.length >= 3) {
      const center = mul(cut.reduce(add, { x: 0, y: 0, z: 0 }), 1 / cut.length),
        u = unit(sub(cut[0], center)),
        v = unit(cross(n, u));
      cut.sort(
        (p, q) =>
          Math.atan2(dot(sub(p, center), v), dot(sub(p, center), u)) -
          Math.atan2(dot(sub(q, center), v), dot(sub(q, center), u)),
      );
      fs.push({ points: cut, cap: true });
    }
  }
  return fs;
}
const baseCrystal = crystalBase();
export function crystal(hand: 1 | -1): Face[] {
  return baseCrystal.map((f) => ({
    ...f,
    points: f.points.map((p) => (hand === 1 ? p : mirror(p))),
  }));
}
export function crystalAt(i: number, progress: number) {
  const hand = (i % 2 === 0 ? 1 : -1) as 1 | -1,
    q = ease(progress * 8 - i),
    index = Math.floor(i / 2);
  const start = { x: 55 + (i % 4) * 70, y: 64 + Math.floor(i / 4) * 62, z: 0 },
    end = {
      x: (hand === 1 ? 82 : 238) + (index % 2 ? 17 : -17),
      y: 226 + (index < 2 ? -13 : 13),
      z: 0,
    };
  return {
    id: i,
    hand,
    q,
    point: {
      x: start.x + (end.x - start.x) * q,
      y: start.y + (end.y - start.y) * q - 55 * 4 * q * (1 - q),
      z: 0,
    },
    sorted: q >= 1,
  };
}
export function optical(plus: number, minus: number, analyzer = 45, path = 1) {
  const angle = 30 * path * (plus - minus),
    transmission = Math.cos(((analyzer - angle) * Math.PI) / 180) ** 2,
    total = plus + minus;
  return { angle, transmission, total, ee: total ? Math.abs(plus - minus) / total : 0 };
}
export function selectiveConsumption(progress: number, selectivity = 1) {
  const usedPlus = clamp(progress),
    usedMinus = clamp(progress) * (1 - clamp(selectivity));
  return { plus: 1 - usedPlus, minus: 1 - usedMinus, usedPlus, usedMinus };
}
