export type V = { x: number; y: number; z: number };
export type P = { x: number; y: number };
export const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const phi = (1 + Math.sqrt(5)) / 2;
export const norm = (p: V) => Math.hypot(p.x, p.y, p.z);
export function rotate(p: V, yaw: number, pitch = 0.38): V {
  const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw),
    z = -p.x * Math.sin(yaw) + p.z * Math.cos(yaw);
  return {
    x,
    y: p.y * Math.cos(pitch) - z * Math.sin(pitch),
    z: p.y * Math.sin(pitch) + z * Math.cos(pitch),
  };
}
export function sharedWeight(p: V) {
  return 1 / 2 ** [p.x, p.y, p.z].filter((v) => v === 0 || v === 1).length;
}
export function cellSites(type: 'fcc' | 'nacl' = 'fcc') {
  const a: (V & { species: string; weight: number })[] = [];
  for (let x = 0; x <= 2; x++)
    for (let y = 0; y <= 2; y++)
      for (let z = 0; z <= 2; z++) {
        const even = (x + y + z) % 2 === 0;
        if (type === 'fcc' && !even) continue;
        const p = { x: x / 2, y: y / 2, z: z / 2 };
        a.push({
          ...p,
          species: type === 'fcc' ? 'Cu' : even ? 'Cl' : 'Na',
          weight: sharedWeight(p),
        });
      }
  return a;
}
export function sharingCells(kind: 'corner' | 'edge' | 'face' | 'inside') {
  const site: V = {
    x: kind === 'inside' ? 0.5 : 0,
    y: kind === 'corner' || kind === 'edge' ? 0 : 0.5,
    z: kind === 'corner' ? 0 : 0.5,
  };
  const axes = [site.x, site.y, site.z].map((v) => (v === 0 ? [-1, 0] : [0]));
  const cells: V[] = [];
  for (const x of axes[0])
    for (const y of axes[1]) for (const z of axes[2]) cells.push({ x, y, z });
  return { site, cells, weight: 1 / cells.length };
}
export type Triangle = { kind: 0 | 1; a: P; b: P; c: P };
const mix = (a: P, b: P, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export function penrose(level = 4) {
  let ts: Triangle[] = Array.from({ length: 10 }, (_, i) => {
    let b = {
        x: Math.cos(((2 * i - 1) * Math.PI) / 10),
        y: Math.sin(((2 * i - 1) * Math.PI) / 10),
      },
      c = { x: Math.cos(((2 * i + 1) * Math.PI) / 10), y: Math.sin(((2 * i + 1) * Math.PI) / 10) };
    if (i % 2 === 0) [b, c] = [c, b];
    return { kind: 0, a: { x: 0, y: 0 }, b, c };
  });
  for (let n = 0; n < level; n++) {
    const next: Triangle[] = [];
    for (const t of ts) {
      const { a, b, c } = t;
      if (t.kind === 0) {
        const p = mix(a, b, 1 / phi);
        next.push({ kind: 0, a: c, b: p, c: b }, { kind: 1, a: p, b: c, c: a });
      } else {
        const q = mix(b, a, 1 / phi),
          r = mix(b, c, 1 / phi);
        next.push(
          { kind: 1, a: r, b: c, c: a },
          { kind: 1, a: q, b: r, c: b },
          { kind: 0, a: r, b: q, c: a },
        );
      }
    }
    ts = next;
  }
  return ts;
}
export function penrosePoints(level = 4) {
  const points = new Map<string, P>();
  for (const t of penrose(level))
    for (const p of [t.a, t.b, t.c])
      points.set(`${p.x.toFixed(8)},${p.y.toFixed(8)}`, { x: p.x * 7, y: p.y * 7 });
  return [...points.values()];
}
export const triangleArea = (t: Triangle) =>
  Math.abs((t.b.x - t.a.x) * (t.c.y - t.a.y) - (t.b.y - t.a.y) * (t.c.x - t.a.x)) / 2;
function random(seed: number) {
  let v = seed | 0;
  return () => {
    v ^= v << 13;
    v ^= v >>> 17;
    v ^= v << 5;
    return (v >>> 0) / 4294967296;
  };
}
export function planarPoints(disorder = 0): P[] {
  if (disorder < 0.5)
    return Array.from({ length: 121 }, (_, i) => ({ x: (i % 11) - 5, y: Math.floor(i / 11) - 5 }));
  const r = random(1776),
    a: P[] = [];
  let trials = 0;
  while (a.length < 121 && trials++ < 50000) {
    const p = { x: (r() - 0.5) * 11, y: (r() - 0.5) * 11 };
    if (a.every((v) => Math.hypot(v.x - p.x, v.y - p.y) > 0.58)) a.push(p);
  }
  return a;
}
/** Kinematic equal-point-scatterer intensity, q in cycles per model length. */
export function structureIntensity(points: P[], qx: number, qy: number) {
  let real = 0,
    imag = 0;
  for (const p of points) {
    const ph = 2 * Math.PI * (p.x * qx + p.y * qy);
    real += Math.cos(ph);
    imag += Math.sin(ph);
  }
  return (real * real + imag * imag) / points.length ** 2;
}
export function diffractionGrid(points: P[], size = 96, extent = 2.5) {
  const values = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      values[y * size + x] = structureIntensity(
        points,
        ((x - (size - 1) / 2) * 2 * extent) / (size - 1),
        ((y - (size - 1) / 2) * 2 * extent) / (size - 1),
      );
  return values;
}
/** Finite 3D clusters; jitter is a constructed short-range disorder contrast, not SiO2 coordinates. */
export function powderPoints(disorder = 0): V[] {
  if (disorder < 0.5)
    return Array.from({ length: 125 }, (_, i) => ({
      x: (i % 5) - 2,
      y: (Math.floor(i / 5) % 5) - 2,
      z: Math.floor(i / 25) - 2,
    }));
  const r = random(1982),
    a: V[] = [];
  let trials = 0;
  while (a.length < 125 && trials++ < 50000) {
    const p = { x: (r() - 0.5) * 5, y: (r() - 0.5) * 5, z: (r() - 0.5) * 5 };
    if (a.every((v) => Math.hypot(v.x - p.x, v.y - p.y, v.z - p.z) > 0.65)) a.push(p);
  }
  return a;
}
export function debyeCurve(points: V[], samples = 160) {
  const distances: number[] = [];
  for (let i = 0; i < points.length; i++)
    for (let j = 0; j < i; j++)
      distances.push(
        Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y, points[i].z - points[j].z),
      );
  return Array.from({ length: samples }, (_, i) => {
    const q = 3 + (i / (samples - 1)) * 12;
    let v = points.length;
    for (const d of distances) v += (2 * Math.sin(q * d)) / (q * d);
    return { q, intensity: Math.max(0, v / points.length ** 2) };
  });
}
export const acetateReference = [
  { x: -1.51, y: 0, w: 6, label: 'C' },
  { x: 0, y: 0, w: 6, label: 'C' },
  { x: 0.605, y: -1.04789, w: 8, label: 'O' },
  { x: 0.68, y: 1.17779, w: 8, label: 'O' },
];
export function acetateCandidate(distance: number) {
  return acetateReference.map((p, i) =>
    i === 2 ? { ...p, x: distance * 0.5, y: (-distance * Math.sqrt(3)) / 2 } : p,
  );
}
export const reflections = Array.from({ length: 48 }, (_, i) => ({
  h: (i % 7) - 3,
  k: Math.floor(i / 7) - 3,
})).filter((p) => p.h !== 0 || p.k !== 0);
function molecularFactor(atoms: typeof acetateReference, h: number, k: number) {
  let re = 0,
    im = 0;
  for (const a of atoms) {
    const ph = (2 * Math.PI * (h * a.x + k * a.y)) / 8;
    re += a.w * Math.cos(ph);
    im += a.w * Math.sin(ph);
  }
  return { re, im, intensity: re * re + im * im };
}
export function candidateEvidence(distance: number) {
  const a = acetateCandidate(distance);
  return reflections.map((q) => ({
    ...q,
    reference: molecularFactor(acetateReference, q.h, q.k).intensity,
    candidate: molecularFactor(a, q.h, q.k).intensity,
  }));
}
export function fitLoss(distance: number) {
  const e = candidateEvidence(distance);
  return (
    e.reduce((s, p) => s + (p.candidate - p.reference) ** 2, 0) /
    e.reduce((s, p) => s + p.reference ** 2, 0)
  );
}
export function refineHistory(initial = 1.75, steps = 36) {
  const a = [{ distance: initial, loss: fitLoss(initial) }];
  for (let i = 0; i < steps; i++) {
    const old = a[a.length - 1],
      eps = 1e-5,
      gradient = (fitLoss(old.distance + eps) - fitLoss(old.distance - eps)) / (2 * eps);
    let rate = 0.8,
      next = old.distance;
    for (let n = 0; n < 20; n++) {
      next = clamp(old.distance - rate * gradient, 0.9, 1.9);
      if (fitLoss(next) <= old.loss) break;
      rate *= 0.5;
    }
    a.push({ distance: next, loss: fitLoss(next) });
  }
  return a;
}
/** Heavy-atom coordinates from Fetah et al. (2026), Form I_1, 296 K, 0.3 GPa.
 * DOI 10.1107/S205252062600291X, published coordinate and geometry tables.
 * This modern refined example is not the historical discovery dataset. */
export const artemisininCell = { a: 6.2555, b: 9.1513, c: 23.86 };
const fractional: [string, number, number, number][] = [
  ['O1', 0.2018, 0.5627, 0.7323],
  ['O2', 0.3941, 0.5674, 0.6954],
  ['O3', 0.0276, 0.3838, 0.6818],
  ['O4', -0.006, 0.5784, 0.623],
  ['O5', -0.0611, 0.7919, 0.5867],
  ['C1', 0.493, 0.3452, 0.6481],
  ['C2', 0.4023, 0.2409, 0.6913],
  ['C3', 0.3098, 0.3094, 0.7459],
  ['C4', 0.1272, 0.4171, 0.7358],
  ['C5', 0.1244, 0.4504, 0.6354],
  ['C6', 0.3585, 0.4866, 0.6444],
  ['C7', 0.4382, 0.5854, 0.5968],
  ['C8', 0.4372, 0.5061, 0.5407],
  ['C9', 0.5849, 0.373, 0.5456],
  ['C10', 0.5253, 0.2679, 0.5919],
  ['C11', 0.3071, 0.7278, 0.5999],
  ['C12', 0.0697, 0.7032, 0.5998],
  ['C13', 0.3663, 0.8348, 0.5527],
  ['C14', 0.6914, 0.1438, 0.5979],
  ['C15', -0.0457, 0.4187, 0.7789],
];
export const artemisinin = fractional.map(([id, x, y, z]) => ({
  id,
  element: id[0],
  x: x * artemisininCell.a,
  y: y * artemisininCell.b,
  z: z * artemisininCell.c,
}));
/** Connectivity comes from the publication's geometry table, not inferred indiscriminately by proximity. */
export const artemisininBonds = [
  ['O1', 'O2'],
  ['O1', 'C4'],
  ['O2', 'C6'],
  ['O3', 'C4'],
  ['O3', 'C5'],
  ['O4', 'C5'],
  ['O4', 'C12'],
  ['O5', 'C12'],
  ['C1', 'C2'],
  ['C1', 'C6'],
  ['C1', 'C10'],
  ['C2', 'C3'],
  ['C3', 'C4'],
  ['C4', 'C15'],
  ['C5', 'C6'],
  ['C6', 'C7'],
  ['C7', 'C8'],
  ['C7', 'C11'],
  ['C8', 'C9'],
  ['C9', 'C10'],
  ['C10', 'C14'],
  ['C11', 'C12'],
  ['C11', 'C13'],
];
export function atomDistance(a: string, b: string) {
  const p = artemisinin.find((v) => v.id === a)!,
    q = artemisinin.find((v) => v.id === b)!;
  return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
}
export function atomAngle(a: string, b: string, c: string) {
  const p = artemisinin.find((v) => v.id === a)!,
    q = artemisinin.find((v) => v.id === b)!,
    r = artemisinin.find((v) => v.id === c)!;
  const v = { x: p.x - q.x, y: p.y - q.y, z: p.z - q.z },
    w = { x: r.x - q.x, y: r.y - q.y, z: r.z - q.z };
  return (
    (Math.acos(clamp((v.x * w.x + v.y * w.y + v.z * w.z) / (norm(v) * norm(w)), -1, 1)) * 180) /
    Math.PI
  );
}
