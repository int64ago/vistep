import { fullereneCoordinates } from './chem-host-guest-coordinates';
export type V = { x: number; y: number; z: number };
export type Atom = { id: string; element: 'C' | 'O'; p: V };
export type Molecule = { atoms: Atom[]; bonds: [number, number][] };
export const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const sub = (a: V, b: V) => add(a, mul(b, -1));
export const norm = (v: V) => Math.hypot(v.x, v.y, v.z);
export const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z;
export const unit = (v: V) => mul(v, 1 / (norm(v) || 1));
const cross = (a: V, b: V): V => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
export function rotate(v: V, yaw: number, pitch: number): V {
  const x = v.x * Math.cos(yaw) + v.z * Math.sin(yaw),
    z = -v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
  return {
    x,
    y: v.y * Math.cos(pitch) - z * Math.sin(pitch),
    z: v.y * Math.sin(pitch) + z * Math.cos(pitch),
  };
}
export function fullerene(n: 60 | 70): Molecule {
  const s = fullereneCoordinates[String(n) as '60' | '70'];
  let vs: V[] = s.atoms.map(([x, y, z]) => ({ x, y, z }));
  if (n === 70) {
    let axis = unit({ x: 1, y: 2, z: 3 });
    for (let i = 0; i < 80; i++)
      axis = unit(vs.reduce((a, p) => add(a, mul(p, dot(p, axis))), { x: 0, y: 0, z: 0 }));
    const u = unit(cross(axis, { x: 1, y: 0, z: 0 })),
      v = cross(axis, u);
    vs = vs.map((p) => ({ x: dot(p, u), y: dot(p, v), z: dot(p, axis) }));
  }
  return {
    atoms: vs.map((p, i) => ({ id: `C${n}-${i}`, element: 'C', p })),
    bonds: s.bonds.map(([a, b]) => [a, b] as [number, number]),
  };
}
export const C60 = fullerene(60),
  C70 = fullerene(70);
/** Idealized cone-like calix[8]arene skeleton. H and para substituents omitted.
 * Benzene hexagons 1.40 Å; bridge bonds 1.51 Å. Not an experimental conformation. */
export function calixarene(): Molecule {
  const atoms: Atom[] = [],
    bonds: [number, number][] = [];
  for (let k = 0; k < 8; k++) {
    const phi = (k * Math.PI) / 4,
      R = { x: Math.cos(phi), y: Math.sin(phi), z: 0 },
      T = { x: -Math.sin(phi), y: Math.cos(phi), z: 0 },
      V = add(mul(R, 0.5), { x: 0, y: 0, z: Math.sqrt(3) / 2 }),
      center = mul(R, 6.5);
    for (let j = 0; j < 6; j++) {
      const a = Math.PI / 2 + (j * Math.PI) / 3;
      atoms.push({
        id: `ring-${k}-${j}`,
        element: 'C',
        p: add(center, add(mul(T, 1.4 * Math.cos(a)), mul(V, 1.4 * Math.sin(a)))),
      });
      bonds.push([k * 6 + j, k * 6 + ((j + 1) % 6)]);
    }
  }
  for (let k = 0; k < 8; k++) {
    const a = k * 6 + 4,
      b = ((k + 1) % 8) * 6 + 2,
      A = atoms[a].p,
      B = atoms[b].p,
      mid = mul(add(A, B), 0.5),
      half = norm(sub(A, B)) / 2;
    const bridge = { x: mid.x, y: mid.y, z: mid.z - Math.sqrt(1.51 ** 2 - half ** 2) };
    const index = atoms.length;
    atoms.push({ id: `bridge-${k}`, element: 'C', p: bridge });
    bonds.push([a, index], [index, b]);
    const bottom = atoms[k * 6 + 3].p,
      phi = (k * Math.PI) / 4,
      V = { x: 0.5 * Math.cos(phi), y: 0.5 * Math.sin(phi), z: Math.sqrt(3) / 2 };
    const oi = atoms.length;
    atoms.push({ id: `oxygen-${k}`, element: 'O', p: add(bottom, mul(V, -1.36)) });
    bonds.push([k * 6 + 3, oi]);
  }
  return { atoms, bonds };
}
export const host = calixarene();
export function guestPosition(progress: number): V {
  return { x: 0, y: 0, z: 11 - 9 * smooth(progress) };
}
/** Competitive 1:1 binding with normalized concentrations; constants illustrative. */
export function competition(K60 = 30, K70 = 3, H = 0.7, A = 0.6, B = 0.4) {
  let lo = 0,
    hi = H;
  for (let i = 0; i < 100; i++) {
    const h = (lo + hi) / 2,
      f = h + (A * K60 * h) / (1 + K60 * h) + (B * K70 * h) / (1 + K70 * h);
    if (f > H) hi = h;
    else lo = h;
  }
  const h = (lo + hi) / 2,
    b60 = (A * K60 * h) / (1 + K60 * h),
    b70 = (B * K70 * h) / (1 + K70 * h);
  return {
    hostFree: h,
    b60,
    b70,
    f60: A - b60,
    f70: B - b70,
    totalHost: H,
    total60: A,
    total70: B,
    purity: b60 / (b60 + b70 || 1),
  };
}
export function release(p: number, K60 = 30, K70 = 3) {
  const s = competition(K60, K70),
    q = smooth(p);
  return {
    ...s,
    retained60: s.b60 * (1 - q),
    retained70: s.b70 * (1 - q),
    released60: s.b60 * q,
    released70: s.b70 * q,
    recoveredHost: (s.b60 + s.b70) * q,
  };
}
export const crownCavities: Record<number, [number, number]> = {
  4: [120, 150],
  5: [170, 220],
  6: [260, 320],
  7: [340, 430],
};
export const ions = { Li: 152, Na: 204, K: 276, Rb: 304, Cs: 334 };
export type Ion = keyof typeof ions;
export function crown(m: 4 | 5 | 6 | 7): Molecule & { holeRadius: number; oxygenRadius: number } {
  const range = crownCavities[m],
    holeRadius = (range[0] + range[1]) / 400,
    oxygenRadius = holeRadius + 1.4,
    atoms: Atom[] = [],
    bonds: [number, number][] = [];
  for (let i = 0; i < m; i++) {
    const phi = (i * 2 * Math.PI) / m;
    atoms.push({
      id: `O${i}`,
      element: 'O',
      p: { x: oxygenRadius * Math.cos(phi), y: oxygenRadius * Math.sin(phi), z: 0 },
    });
  }
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % m,
      A = atoms[i].p,
      B = atoms[j].p,
      mid = mul(add(A, B), 0.5),
      along = unit(sub(B, A)),
      out = unit(mid),
      D = norm(sub(B, A)),
      height = Math.sqrt(1.43 ** 2 - ((D - 1.54) / 2) ** 2),
      center = add(mid, mul(out, height)),
      a = atoms.length;
    atoms.push(
      { id: `C${i}-a`, element: 'C', p: add(center, mul(along, -0.77)) },
      { id: `C${i}-b`, element: 'C', p: add(center, mul(along, 0.77)) },
    );
    bonds.push([i, a], [a, a + 1], [a + 1, j]);
  }
  return { atoms, bonds, holeRadius, oxygenRadius };
}
export function crownFit(m: 4 | 5 | 6 | 7, ion: Ion, progress = 1) {
  const c = crown(m),
    radius = ions[ion] / 200;
  const zContact = Math.sqrt(Math.max(0, (radius + 1.4) ** 2 - c.oxygenRadius ** 2)),
    z = zContact + 5 * (1 - smooth(progress));
  return {
    ...c,
    ionRadius: radius,
    ionPosition: { x: 0, y: 0, z },
    mismatchPm: ions[ion] - (crownCavities[m][0] + crownCavities[m][1]) / 2,
    donorDistance: Math.hypot(c.oxygenRadius, z),
  };
}
export function releasedGuestPosition(progress: number): V {
  const p = clamp(progress);
  if (p < 0.35) return { x: 0, y: 0, z: 2 + 6 * smooth(p / 0.35) };
  if (p < 0.7) return { x: 9.5 * smooth((p - 0.35) / 0.35), y: 0, z: 8 };
  return { x: 9.5, y: 0, z: 8 * (1 - smooth((p - 0.7) / 0.3)) };
}
