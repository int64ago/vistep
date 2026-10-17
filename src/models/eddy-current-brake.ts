export interface EddyEdge {
  a: number;
  b: number;
  conductance: number;
  emf: number;
  current: number;
}
export interface EddySheet {
  nx: number;
  ny: number;
  length: number;
  width: number;
  dx: number;
  dy: number;
  lanes: number;
  potential: number[];
  edges: EddyEdge[];
  stream: number[][];
  loss: number;
  residual: number;
}
const sheets = new Map<string, EddySheet>();
export function eddyFieldProfile(x: number, y: number) {
  return Math.exp(-((x / 0.04) ** 4 + (y / 0.055) ** 4));
}
/** Unit conductivity-thickness, speed and field. Insulated graph faces enforce closed current paths. */
export function eddySheet(lanes = 1, shape: 'patch' | 'uniform' = 'patch'): EddySheet {
  if (![1, 2, 4, 8].includes(lanes))
    throw new RangeError('The sheet supports 1, 2, 4 or 8 longitudinal lanes');
  const cacheKey = `${lanes}:${shape}`;
  const old = sheets.get(cacheKey);
  if (old) return old;
  const nx = 33,
    ny = 24,
    length = 0.32,
    width = 0.16,
    dx = length / nx,
    dy = width / ny,
    N = nx * ny,
    edges: EddyEdge[] = [],
    rhs = Array(N).fill(0),
    potential = Array(N).fill(0);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * nx + i;
      if (i < nx - 1) edges.push({ a, b: a + 1, conductance: dy / dx, emf: 0, current: 0 });
      if (j < ny - 1 && (j + 1) % (ny / lanes) !== 0) {
        const x = -length / 2 + (i + 0.5) * dx,
          y = -width / 2 + (j + 1) * dy;
        edges.push({
          a,
          b: a + nx,
          conductance: dx / dy,
          emf: -(shape === 'uniform' ? 1 : eddyFieldProfile(x, y)) * dy,
          current: 0,
        });
      }
    }
  for (const e of edges) {
    rhs[e.a] -= e.conductance * e.emf;
    rhs[e.b] += e.conductance * e.emf;
  }
  const apply = (v: number[]) => {
      const out = Array(N).fill(0);
      for (const e of edges) {
        const d = e.conductance * (v[e.a] - v[e.b]);
        out[e.a] += d;
        out[e.b] -= d;
      }
      return out;
    },
    dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  let r = rhs.slice(),
    direction = r.slice(),
    rr = dot(r, r);
  const initial = rr;
  for (let n = 0; n < 3000 && rr > initial * 1e-22; n++) {
    const ad = apply(direction),
      step = rr / dot(direction, ad);
    for (let i = 0; i < N; i++) {
      potential[i] += step * direction[i];
      r[i] -= step * ad[i];
    }
    const next = dot(r, r),
      beta = next / rr;
    direction = r.map((v, i) => v + beta * direction[i]);
    rr = next;
  }
  const divergence = Array(N).fill(0),
    vertical = Array.from({ length: ny - 1 }, () => Array(nx).fill(0));
  let loss = 0;
  for (const e of edges) {
    e.current = e.conductance * (potential[e.a] - potential[e.b] + e.emf);
    divergence[e.a] += e.current;
    divergence[e.b] -= e.current;
    loss += e.current ** 2 / e.conductance;
    if (e.b - e.a === nx) vertical[Math.floor(e.a / nx)][e.a % nx] = e.current;
  }
  const stream = Array.from({ length: ny + 1 }, () => Array(nx + 1).fill(0));
  for (let j = 0; j < ny - 1; j++)
    for (let i = 0; i < nx; i++) stream[j + 1][i + 1] = stream[j + 1][i] - vertical[j][i];
  const solution = {
    nx,
    ny,
    length,
    width,
    dx,
    dy,
    lanes,
    potential,
    edges,
    stream,
    loss,
    residual: Math.max(...divergence.map(Math.abs)),
  };
  sheets.set(cacheKey, solution);
  return solution;
}
export interface EddyParameters {
  velocity: number;
  field: number;
  conductivity: number;
  thickness: number;
  lanes: number;
  fieldShape: 'patch' | 'uniform';
}
export const eddyDefaults = (): EddyParameters => ({
  velocity: 0.03,
  field: 0.2,
  conductivity: 3.5e7,
  thickness: 0.001,
  lanes: 1,
  fieldShape: 'patch',
});
export function eddyBrake(p: EddyParameters) {
  if (
    ![p.velocity, p.field, p.conductivity, p.thickness].every(Number.isFinite) ||
    p.conductivity <= 0 ||
    p.thickness <= 0 ||
    Math.abs(p.velocity) > 0.05 ||
    Math.abs(p.field) > 0.3
  )
    throw new RangeError('Low-speed thin-sheet approximation required');
  const sheet = eddySheet(p.lanes, p.fieldShape),
    scale = p.conductivity * p.thickness * p.velocity * p.field,
    conductanceScale = p.conductivity * p.thickness,
    currents = sheet.edges.map((e) => e.current * scale),
    joule = sheet.edges.reduce(
      (sum, e, i) => sum + currents[i] ** 2 / (conductanceScale * e.conductance),
      0,
    ),
    force = sheet.edges.reduce((sum, e, i) => sum - currents[i] * p.field * e.emf, 0),
    dragCoefficient = conductanceScale * p.field ** 2 * sheet.loss;
  return {
    ...p,
    sheet,
    currents,
    joule,
    force,
    dragCoefficient,
    brakingPower: -force * p.velocity,
    currentScale: scale,
  };
}
export function eddyShot(chapter: number, progress: number) {
  const p = eddyDefaults(),
    u = Math.max(0, Math.min(1, progress));
  if (chapter === 0) p.fieldShape = 'uniform';
  if (chapter === 2) p.velocity = 0.03 * (1 - 2 * u);
  if (chapter === 3) p.velocity = 0.03 * (1 - u);
  if (chapter === 4) p.lanes = 8;
  if (chapter === 5) p.field = 0.1 * (1 - u) + 0.3 * u;
  return eddyBrake(p);
}
export function eddyTravel(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress));
  return 0.24 * (chapter === 2 ? u - u * u : chapter === 3 ? u - 0.5 * u * u : u);
}

export type EddyPoint = [number, number];
/** Streamfunction contours preserve the closed loops of the conservative face-current solution. */
export function eddyContours(sheet: EddySheet, levels: number[]) {
  const paths: EddyPoint[][] = [];
  const key = (p: EddyPoint) => `${p[0].toFixed(9)},${p[1].toFixed(9)}`;
  for (const level of levels) {
    const segments: [EddyPoint, EddyPoint][] = [];
    for (let j = 0; j < sheet.ny; j++)
      for (let i = 0; i < sheet.nx; i++) {
        const values = [
            sheet.stream[j][i],
            sheet.stream[j][i + 1],
            sheet.stream[j + 1][i + 1],
            sheet.stream[j + 1][i],
          ],
          corners: EddyPoint[] = [
            [i, j],
            [i + 1, j],
            [i + 1, j + 1],
            [i, j + 1],
          ],
          crossings: { edge: number; point: EddyPoint }[] = [];
        let bits = 0;
        for (let k = 0; k < 4; k++) {
          if (values[k] >= level) bits |= 1 << k;
          const next = (k + 1) % 4;
          if (values[k] >= level !== values[next] >= level) {
            const f = (level - values[k]) / (values[next] - values[k]);
            crossings.push({
              edge: k,
              point: [
                corners[k][0] + f * (corners[next][0] - corners[k][0]),
                corners[k][1] + f * (corners[next][1] - corners[k][1]),
              ],
            });
          }
        }
        if (crossings.length === 2) segments.push([crossings[0].point, crossings[1].point]);
        else if (crossings.length === 4) {
          const middle = values.reduce((a, b) => a + b, 0) / 4;
          const pairs =
            (bits === 5) === middle >= level
              ? [
                  [0, 1],
                  [2, 3],
                ]
              : [
                  [0, 3],
                  [1, 2],
                ];
          for (const [a, b] of pairs) segments.push([crossings[a].point, crossings[b].point]);
        }
      }
    const adjacency = new Map<string, { segment: number; end: number }[]>();
    segments.forEach((seg, index) =>
      seg.forEach((point, end) => {
        const k = key(point),
          list = adjacency.get(k) ?? [];
        list.push({ segment: index, end });
        adjacency.set(k, list);
      }),
    );
    const used = new Set<number>();
    for (let index = 0; index < segments.length; index++) {
      if (used.has(index)) continue;
      used.add(index);
      const path = [segments[index][0], segments[index][1]],
        start = key(path[0]);
      let tail = key(path[1]);
      while (tail !== start) {
        const next = adjacency.get(tail)?.find((entry) => !used.has(entry.segment));
        if (!next) break;
        used.add(next.segment);
        const point = segments[next.segment][1 - next.end];
        path.push(point);
        tail = key(point);
      }
      if (path.length > 3 && tail === start)
        paths.push(
          path.map(([x, y]) => [-sheet.length / 2 + x * sheet.dx, -sheet.width / 2 + y * sheet.dy]),
        );
    }
  }
  return paths;
}

export function eddyStreamDirection(sheet: EddySheet, x: number, y: number): EddyPoint {
  const gx = Math.max(0, Math.min(sheet.nx - 1e-9, (x + sheet.length / 2) / sheet.dx)),
    gy = Math.max(0, Math.min(sheet.ny - 1e-9, (y + sheet.width / 2) / sheet.dy)),
    i = Math.floor(gx),
    j = Math.floor(gy),
    u = gx - i,
    v = gy - j,
    a = sheet.stream[j][i],
    b = sheet.stream[j][i + 1],
    c = sheet.stream[j + 1][i + 1],
    d = sheet.stream[j + 1][i];
  return [
    ((d - a) * (1 - u) + (c - b) * u) / sheet.dy,
    -((b - a) * (1 - v) + (c - d) * v) / sheet.dx,
  ];
}
