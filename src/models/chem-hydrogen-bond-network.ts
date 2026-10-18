/** Coordinates are Å. Ideal hexagonal ice oxygen framework, one allowed ice-rule
 * proton arrangement, and a constructed (not MD) rearrangement. */
export type V = { x: number; y: number; z: number };
export const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const sub = (a: V, b: V) => add(a, mul(b, -1));
export const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z;
export const length = (a: V) => Math.hypot(a.x, a.y, a.z);
export const unit = (a: V) => mul(a, 1 / (length(a) || 1));
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  const q = clamp(v);
  return q * q * (3 - 2 * q);
};
export const OO = 2.76,
  OH = 0.96,
  HOH = 104.5;
const A = OO / Math.sqrt(3 / 8),
  C = A * Math.sqrt(8 / 3);
const basis = [
  [0, 0, 0],
  [2 / 3, 1 / 3, 0.5],
  [0, 0, 0.375],
  [2 / 3, 1 / 3, 0.875],
];
export type Water = { id: string; o: V; h: [V, V]; donorIds: [string, string]; basis: number };
type Site = { id: string; o: V; basis: number; i: number; j: number; k: number };
const sites: Site[] = [];
for (let i = -2; i <= 3; i++)
  for (let j = -2; j <= 3; j++)
    for (let k = -1; k <= 1; k++)
      basis.forEach(([u, v, w], b) =>
        sites.push({
          id: `${i}:${j}:${k}:${b}`,
          basis: b,
          i,
          j,
          k,
          o: {
            x: A * (i + u - (j + v) / 2),
            y: ((A * Math.sqrt(3)) / 2) * (j + v),
            z: C * (k + w),
          },
        }),
      );
const donates = (a: Site, b: Site) =>
  a.basis < 2 ? b.o.z > a.o.z || b.o.x > a.o.x + 0.1 : !(a.o.z > b.o.z || a.o.x > b.o.x + 0.1);
function makeWater(a: Site): Water {
  const ds = sites.filter((b) => Math.abs(length(sub(a.o, b.o)) - OO) < 1e-7 && donates(a, b));
  if (ds.length !== 2) throw new Error(`Ice-rule donor count ${a.id}: ${ds.length}`);
  const u = unit(sub(ds[0].o, a.o)),
    v = unit(sub(ds[1].o, a.o)),
    bis = unit(add(u, v)),
    dif = unit(sub(u, v));
  const co = Math.cos((HOH * Math.PI) / 360),
    si = Math.sin((HOH * Math.PI) / 360);
  return {
    id: a.id,
    basis: a.basis,
    o: a.o,
    h: [
      add(a.o, mul(add(mul(bis, co), mul(dif, si)), OH)),
      add(a.o, mul(add(mul(bis, co), mul(dif, -si)), OH)),
    ],
    donorIds: [ds[0].id, ds[1].id],
  };
}
export const ice = sites
  .filter((a) => a.i >= 0 && a.i < 3 && a.j >= 0 && a.j < 3 && a.k === 0)
  .map(makeWater);
export const centralId = '1:1:0:1';
export const shellIds = [
  centralId,
  ...sites
    .filter((a) => Math.abs(length(sub(a.o, sites.find((v) => v.id === centralId)!.o)) - OO) < 1e-7)
    .map((a) => a.id),
];
export const center = mul(
  ice.reduce((s, w) => add(s, w.o), { x: 0, y: 0, z: 0 }),
  1 / ice.length,
);
export function rotate(v: V, yaw: number, pitch: number): V {
  const x = v.x * Math.cos(yaw) + v.z * Math.sin(yaw),
    z = -v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
  return {
    x,
    y: v.y * Math.cos(pitch) - z * Math.sin(pitch),
    z: v.y * Math.sin(pitch) + z * Math.cos(pitch),
  };
}
export function rearranged(q: number): Water[] {
  q = clamp(q);
  return ice.map((w, i) => {
    const drift = {
      x: 0.28 * Math.sin(i * 2.31),
      y: 0.28 * Math.cos(i * 1.73),
      z: 0.22 * Math.sin(i * 1.13),
    };
    const o = add(center, add(mul(sub(w.o, center), 1 - 0.027 * q), mul(drift, q)));
    return {
      ...w,
      o,
      h: w.h.map((h) =>
        add(o, rotate(sub(h, w.o), q * 0.38 * Math.sin(i * 1.21), q * 0.32 * Math.cos(i * 1.83))),
      ) as [V, V],
    };
  });
}
/** Smooth pedagogical geometry screen; not an energy, bond order or lifetime. */
export function bondScore(o: V, h: V, a: V) {
  const dist = length(sub(a, o)),
    ha = length(sub(a, h)),
    cos = dot(unit(sub(h, o)), unit(sub(a, h)));
  return smooth((3.3 - dist) / 0.3) * smooth((2.6 - ha) / 0.45) * smooth((cos - 0.72) / 0.2);
}
export function hydrogenLinks(ws: Water[]) {
  return ws.flatMap((w) =>
    w.h.flatMap((h, hi) => {
      const candidates = ws
        .filter((a) => a.id !== w.id)
        .map((a) => ({ a, score: bondScore(w.o, h, a.o) }))
        .sort((a, b) => b.score - a.score);
      const c = candidates[0];
      return c && c.score > 0.01
        ? [{ from: w.id, to: c.a.id, h: hi, a: h, b: c.a.o, score: c.score }]
        : [];
    }),
  );
}
export function pairGeometry(angle: number, distance: number) {
  const rad = (angle * Math.PI) / 180;
  const o = { x: 0, y: 0, z: 0 },
    h = { x: OH, y: 0, z: 0 },
    a = { x: distance * Math.cos(rad), y: distance * Math.sin(rad), z: 0 };
  const angle2 = (HOH * Math.PI) / 180;
  const one: Water = {
    id: 'donor',
    basis: 0,
    o,
    h: [h, { x: OH * Math.cos(angle2), y: OH * Math.sin(angle2), z: 0 }],
    donorIds: ['acceptor', 'outside'],
  };
  const two: Water = {
    id: 'acceptor',
    basis: 1,
    o: a,
    h: [
      add(a, { x: OH * 0.75, y: OH * Math.sqrt(1 - 0.75 ** 2), z: 0 }),
      add(a, {
        x: OH * Math.cos((-HOH * Math.PI) / 180 + Math.acos(0.75)),
        y: OH * Math.sin((-HOH * Math.PI) / 180 + Math.acos(0.75)),
        z: 0,
      }),
    ],
    donorIds: ['outside', 'outside2'],
  };
  return { waters: [one, two], score: bondScore(o, h, a), distance, ha: length(sub(a, h)) };
}
export function bulk(mass = 92, iceDensity = 0.92, waterDensity = 1) {
  if (mass <= 0 || iceDensity <= 0 || waterDensity <= 0)
    throw new Error('Positive mass and density required');
  return {
    iceVolume: mass / iceDensity,
    waterVolume: mass / waterDensity,
    submerged: Math.min(1, iceDensity / waterDensity),
    floats: iceDensity < waterDensity,
  };
}
/** A fixed-depth rectangular vessel: water level changes by displaced area. */
export function floatGeometry(p: number, density = 0.92) {
  const b = bulk(92, density, 1),
    width = 104,
    vesselWidth = 242,
    h = b.iceVolume * 0.9,
    initialWaterY = 145,
    bottom = 237;
  const equilibriumWaterY = initialWaterY - (width * h * b.submerged) / vesselWidth;
  const final = b.floats ? equilibriumWaterY - h * (1 - b.submerged) : bottom - h;
  const y = 25 + (final - 25) * clamp(p);
  let waterY = initialWaterY;
  if (y + h > initialWaterY) {
    waterY = (vesselWidth * initialWaterY - width * (y + h)) / (vesselWidth - width);
    if (waterY <= y) waterY = initialWaterY - (width * h) / vesselWidth;
  }
  const immersed = Math.max(0, Math.min(h, y + h - waterY));
  return {
    y,
    h,
    waterY,
    immersed,
    waterArea: vesselWidth * (bottom - waterY) - width * immersed,
    initialArea: vesselWidth * (bottom - initialWaterY),
  };
}
