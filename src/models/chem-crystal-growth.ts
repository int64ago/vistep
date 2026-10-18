/** Teaching state models. Amounts are normalized, not fitted to laboratory yields or times. */
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (x: number) => {
  const q = clamp(x);
  return q * q * (3 - 2 * q);
};
export type Point = { x: number; y: number };
export type Vec = { x: number; y: number; z: number };
export function sulfurState(progress: number) {
  const p = clamp(progress),
    melt = smooth(p / 0.38),
    crystallized = smooth((p - 0.55) / 0.45);
  return {
    melted: melt * (1 - crystallized),
    powder: 1 - melt,
    crystallized,
    heating: 1 - smooth((p - 0.4) / 0.12),
  };
}
export const iodineLid = (x: number) => 48 + 14 * (1 - ((x - 160) / 70) ** 2);
/** Each marker represents a retained parcel, not one molecule. Its path is illustrative. */
export function iodineParcels(progress: number, cooled = true) {
  const p = clamp(progress);
  return Array.from({ length: 48 }, (_, i) => {
    const a = (i * 0.61803398875) % 1,
      start = { x: 119 + (i % 8) * 11.5, y: 187 - Math.floor(i / 8) * 3.2 };
    const end = { x: 104 + a * 112, y: iodineLid(104 + a * 112) + 3 + (i % 3) * 3 };
    const u = clamp((p - (0.62 * i) / 47) / 0.28);
    let point: Point;
    if (u < 1) {
      const v = smooth(u);
      point = {
        x: start.x + (end.x - start.x) * v + 15 * Math.sin(Math.PI * v) * Math.sin(i * 2.4),
        y: start.y + (end.y - start.y) * v,
      };
    } else if (cooled) point = end;
    else {
      const time = (p - (0.62 * i) / 47 - 0.28) * 6;
      point = {
        x: end.x + 12 * Math.sin(time) * Math.sin(i * 2.1),
        y: end.y + (90 * (1 - Math.cos(time))) / 2,
      };
    }
    return {
      id: i,
      point,
      phase: u === 0 ? 'source' : u === 1 && cooled ? 'deposit' : 'vapor',
      fraction: u,
      start,
      end,
    };
  });
}
/** Idealized 1:1 salt, K=1. Acid concentration is a dimensionless illustrative value 4.
 * Concentrated NaCl/HCl requires activities; these numbers do NOT predict that mixture. */
export function saltEquilibrium(acidVolume: number, waterVolume: number) {
  const acid = clamp(acidVolume, 0, 0.4),
    water = clamp(waterVolume, 0, 1),
    volume = 1 + acid + water;
  const sodium = 1,
    chloride = 1 + 4 * acid,
    K = 1;
  const precipitate = Math.max(
    0,
    (sodium + chloride - Math.sqrt((sodium - chloride) ** 2 + 4 * K * volume ** 2)) / 2,
  );
  return {
    sodium,
    chloride,
    volume,
    precipitate,
    dissolvedNa: sodium - precipitate,
    dissolvedCl: chloride - precipitate,
    quotient: ((sodium - precipitate) * (chloride - precipitate)) / volume ** 2,
    initialQuotient: (sodium * chloride) / volume ** 2,
  };
}
/** Relaxation to a mass-balanced equilibrium, with arbitrary dimensionless progression. */
export function alumGrowth(capacity: number, progress: number, seed = 0.06, total = 1) {
  const cap = clamp(capacity, 0.3, 1.2),
    equilibrium = clamp(total - cap, 0, total),
    q = 1 - Math.exp(-6 * clamp(progress));
  const crystal = seed + (equilibrium - seed) * q;
  return {
    crystal,
    solution: total - crystal,
    total,
    equilibrium,
    capacity: cap,
    relativeRadius: Math.cbrt(crystal / seed),
    initialSeed: seed,
  };
}
export function seedTransfer(progress: number) {
  const p = clamp(progress),
    q = smooth((p - 0.3) / 0.65);
  return {
    x: 78 + 154 * q,
    y: 180 - 90 * Math.sin(Math.PI * q) - 46 * q,
    selected: p > 0.15,
    thread: smooth((p - 0.88) / 0.1),
  };
}
export function liftedTransfer(start: number, end: number, p: number): Point {
  const q = clamp(p);
  if (q < 0.25) return { x: start, y: 205 - 90 * smooth(q / 0.25) };
  if (q < 0.75) return { x: start + (end - start) * smooth((q - 0.25) / 0.5), y: 115 };
  return { x: end, y: 115 + 90 * smooth((q - 0.75) / 0.25) };
}
export function shellState(progress: number) {
  const p = clamp(progress);
  let point: Point, purple: number, clear: number, bath: number;
  if (p < 0.25) {
    point = liftedTransfer(58, 160, p / 0.25);
    purple = 0;
    clear = 0;
    bath = p === 0 ? 0 : -1;
  } else if (p < 0.55) {
    point = { x: 160, y: 205 };
    purple = smooth((p - 0.25) / 0.3);
    clear = 0;
    bath = 1;
  } else if (p < 0.8) {
    point = liftedTransfer(160, 262, (p - 0.55) / 0.25);
    purple = 1;
    clear = 0;
    bath = -1;
  } else {
    point = { x: 262, y: 205 };
    purple = 1;
    clear = smooth((p - 0.8) / 0.2);
    bath = 2;
  }
  // Additive volumes: the original core persists, rather than recolouring the whole crystal.
  const core = 1,
    middle = core + 0.9 * purple,
    outer = middle + 0.9 * clear;
  return {
    point,
    purple,
    clear,
    bath,
    coreRadius: Math.cbrt(core),
    purpleRadius: Math.cbrt(middle),
    outerRadius: Math.cbrt(outer),
    coreVolume: core,
    purpleVolume: 0.9 * purple,
    clearVolume: 0.9 * clear,
  };
}
const vertices: Vec[] = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];
export function octahedron(radius: number, angle = 0.42) {
  const v = vertices.map((p) => {
    const x = p.x * Math.cos(angle) + p.z * Math.sin(angle),
      z = -p.x * Math.sin(angle) + p.z * Math.cos(angle);
    return {
      x: x * radius,
      y: (p.y * Math.cos(0.27) - z * Math.sin(0.27)) * radius,
      z: (p.y * Math.sin(0.27) + z * Math.cos(0.27)) * radius,
    };
  });
  const faces = [];
  for (const x of [0, 1])
    for (const y of [2, 3])
      for (const z of [4, 5]) {
        const ps = [v[x], v[y], v[z]];
        faces.push({
          points: ps,
          depth: ps.reduce((n, p) => n + p.z, 0) / 3,
          light:
            0.58 + 0.11 * (x === 0 ? 1 : 0) + 0.16 * (y === 3 ? 1 : 0) + 0.1 * (z === 4 ? 1 : 0),
        });
      }
  return { vertices: v, faces: faces.sort((a, b) => a.depth - b.depth) };
}
