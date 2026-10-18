/** Geometry, normalized Drude response and anisotropic conductivity.
 * Mechanical motion is geometric, not molecular dynamics or a stress solver. */
export type V = { x: number; y: number; z: number };
export const clamp = (q: number) => Math.max(0, Math.min(1, q));
export const smooth = (q: number) => {
  q = clamp(q);
  return q * q * (3 - 2 * q);
};
export const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const norm = (a: V) => Math.hypot(a.x, a.y, a.z);
export const unit = (a: V): V => {
  const n = norm(a) || 1;
  return { x: a.x / n, y: a.y / n, z: a.z / n };
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
export const metalSpacing = 1;
export function metalLayers(progress: number) {
  const shift = smooth(progress),
    dx = Math.abs(((0.5 + shift) % 1) - 0.5); // distance to nearest lattice site, recomputed below
  const nearest = Math.min((0.5 + shift) % 1, 1 - ((0.5 + shift) % 1));
  const lift = Math.sqrt(1 - nearest ** 2) - Math.sqrt(3) / 2;
  const atoms = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 7; col++)
      atoms.push({
        id: `${row}:${col}`,
        row,
        p: {
          x: col - 3 + (row % 2) * 0.5 + (row < 3 ? shift : 0),
          y: ((row - 2.5) * Math.sqrt(3)) / 2 - (row < 3 ? lift : 0),
          z: 0,
        },
      });
  return { atoms, shift, lift, nearest, dx };
}
/** q=|electron charge|=mass=density=1 in teaching units. */
export function drude(time: number, field: number, tau: number) {
  const t = Math.max(0, time),
    T = Math.max(1e-4, tau),
    v = -field * T * -Math.expm1(-t / T);
  return {
    velocity: v,
    current: -v,
    displacement: -field * T * (t - T * -Math.expm1(-t / T)),
    steadyCurrent: field * T,
  };
}
export function velocityDensity(v: number, mean: number, width: number) {
  return Math.exp(-0.5 * ((v - mean) / width) ** 2) / (width * Math.sqrt(2 * Math.PI));
}
export function thermalResponse(relativeT: number, time = 8, field = 1) {
  const temperature = Math.max(0.5, relativeT),
    tau = 1 / temperature;
  return { temperature, tau, width: 1.3 * Math.sqrt(temperature), ...drude(time, field, tau) };
}
export type Carbon = { id: string; p: V; layer: number };
export type Edge = { a: string; b: string };
export const CC = 1.42,
  layerSpacing = 3.35;
export function graphite(shift = 0) {
  const atoms: Carbon[] = [],
    bonds: Edge[] = [];
  for (let layer = -1; layer <= 1; layer++)
    for (let i = -3; i <= 3; i++)
      for (let j = -3; j <= 3; j++)
        for (let b = 0; b < 2; b++) {
          const x = CC * Math.sqrt(3) * (i + j / 2),
            y = CC * (1.5 * j + b);
          if (Math.hypot(x, y) > 4.6) continue;
          // AB stacking: alternate sheet displaced by one nearest-neighbour vector.
          atoms.push({
            id: `${layer}:${i}:${j}:${b}`,
            layer,
            p: {
              x: x + (layer === 1 ? shift : 0),
              y: y + (layer === 0 ? CC : 0),
              z: layer * layerSpacing,
            },
          });
        }
  for (let i = 0; i < atoms.length; i++)
    for (let j = i + 1; j < atoms.length; j++)
      if (
        atoms[i].layer === atoms[j].layer &&
        Math.abs(norm(sub(atoms[i].p, atoms[j].p)) - CC) < 1e-6
      )
        bonds.push({ a: atoms[i].id, b: atoms[j].id });
  return { atoms, bonds };
}
export const graphiteBase = graphite();
export const central = '0:0:0:0';
export function sixRing(): string[] {
  const g = graphiteBase,
    adj = (id: string) => g.bonds.flatMap((b) => (b.a === id ? [b.b] : b.b === id ? [b.a] : []));
  const walk = (path: string[]): string[] | null => {
    if (path.length === 6) return adj(path.at(-1)!).includes(central) ? path : null;
    for (const n of adj(path.at(-1)!)) {
      if (path.includes(n)) continue;
      const hit = walk([...path, n]);
      if (hit) return hit;
    }
    return null;
  };
  return walk([central])!;
}
export const orbitalRing = sixRing();
/** A normalized, illustrative conductivity tensor. Ratio is not fitted to graphite. */
export function conductivity(angleDeg: number, perpendicular = 0.02) {
  const a = (angleDeg * Math.PI) / 180,
    E = { x: Math.cos(a), y: 0, z: Math.sin(a) };
  const J = { x: E.x, y: 0, z: perpendicular * E.z };
  return {
    E,
    J,
    magnitude: norm(J),
    longitudinal: J.x * E.x + J.z * E.z,
    ratio: perpendicular,
    direction: unit(J),
  };
}
/** Positive/negative p_z lobes are phase labels, not opposite charges.
 * Meridional contour of |z| exp(-r/a)=level, numerically solved in Å-like drawing units. */
export function orbitalContour(sign: 1 | -1) {
  const a = 0.72,
    level = 0.12,
    points: V[] = [];
  for (let k = 0; k <= 80; k++) {
    const z = 0.05 + (1.95 * k) / 80,
      r = -a * Math.log(level / z),
      rho2 = r * r - z * z;
    if (r >= z && rho2 >= 0) points.push({ x: Math.sqrt(rho2), y: 0, z: sign * z });
  }
  return [...points, ...[...points].reverse().map((p) => ({ ...p, x: -p.x }))];
}
