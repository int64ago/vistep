import type { KeyboardSwitchState } from './keyboard-switch';

/** Original teaching cutaway, in display millimetres. These proportions preserve
 * connected parts and a visible section; they are not a manufacturer's CAD data. */
export type SwitchPoint = [number, number, number];
export type SwitchMaterial =
  | 'stem'
  | 'cap'
  | 'housing'
  | 'base'
  | 'steel'
  | 'gold'
  | 'pcb'
  | 'copper'
  | 'silicone'
  | 'magnet'
  | 'sensor'
  | 'light';
export type SwitchSolid = {
  id: string;
  material: SwitchMaterial;
  color: string;
  vertices: SwitchPoint[];
  faces: number[][];
  opacity?: number;
  /** Average normals only along genuine curved surfaces; planar cut faces stay hard. */
  smooth?: boolean;
};
export type SwitchDetail = 'high' | 'reduced';
export type KeyboardSwitchVisual = {
  state: KeyboardSwitchState;
  chapter: number;
  chapterProgress: number;
  active: boolean;
  allowOrbit?: boolean;
};
export const SWITCH_GEOMETRY = Object.freeze({
  springBottom: 2,
  springRestTop: 11,
  contactX: 5.35,
  contactY: 6.7,
  contactZ: 2.1,
  shellWidth: 14,
  shellTop: 12,
  pcbTop: 0,
});
const C = {
  cap: '#d8d4c7',
  housing: '#a6bbba',
  base: '#303d40',
  steel: '#a4a9a4',
  gold: '#bd984e',
  pcb: '#3c7365',
  copper: '#c6ad75',
  silicone: '#767e79',
  magnet: '#554b64',
  sensor: '#38454d',
  light: '#be6c53',
};
export const switchStemColor = (variant: string) =>
  ({
    red: '#b95150',
    black: '#41454b',
    brown: '#966842',
    blue: '#4e87b0',
    silver: '#aab1b4',
    'silent-red': '#ce8585',
    hall: '#bc9b60',
    optical: '#9174a7',
  })[variant] ?? '#b95150';
const point = (x: number, y: number, z: number): SwitchPoint => [x, y, z];
const add = (a: SwitchPoint, b: SwitchPoint): SwitchPoint => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
const scale = (a: SwitchPoint, s: number): SwitchPoint => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: SwitchPoint, b: SwitchPoint): SwitchPoint => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: SwitchPoint): SwitchPoint => scale(a, 1 / (Math.hypot(...a) || 1));
function solid(
  id: string,
  material: SwitchMaterial,
  vertices: SwitchPoint[],
  faces: number[][],
  color = C[material as keyof typeof C] ?? '#888',
) {
  return { id, material, vertices, faces, color } as SwitchSolid;
}
/** Closed loft with identical corner topology, including real bevel faces. */
function loft(id: string, material: SwitchMaterial, rings: SwitchPoint[][], color?: string) {
  const n = rings[0].length,
    faces: number[][] = [Array.from({ length: n }, (_, i) => n - 1 - i)];
  for (let j = 0; j < rings.length - 1; j++)
    for (let i = 0; i < n; i++)
      faces.push([j * n + i, j * n + ((i + 1) % n), (j + 1) * n + ((i + 1) % n), (j + 1) * n + i]);
  faces.push(Array.from({ length: n }, (_, i) => (rings.length - 1) * n + i));
  return solid(id, material, rings.flat(), faces, color);
}
function corners(w: number, d: number, y: number, b: number, at: SwitchPoint) {
  return [
    [-w / 2 + b, -d / 2],
    [w / 2 - b, -d / 2],
    [w / 2, -d / 2 + b],
    [w / 2, d / 2 - b],
    [w / 2 - b, d / 2],
    [-w / 2 + b, d / 2],
    [-w / 2, d / 2 - b],
    [-w / 2, -d / 2 + b],
  ]
    .reverse()
    .map(([x, z]) => add([x, y, z], at));
}
function box(
  id: string,
  material: SwitchMaterial,
  size: SwitchPoint,
  at: SwitchPoint,
  b = 0.1,
  color?: string,
) {
  const [w, h, d] = size,
    bevel = Math.min(b, w * 0.15, h * 0.25, d * 0.15);
  return loft(
    id,
    material,
    [
      corners(w - bevel * 2, d - bevel * 2, -h / 2, bevel, at),
      corners(w, d, -h / 2 + bevel, bevel, at),
      corners(w, d, h / 2 - bevel, bevel, at),
      corners(w - bevel * 2, d - bevel * 2, h / 2, bevel, at),
    ],
    color,
  );
}
function prism(
  id: string,
  material: SwitchMaterial,
  profile: [number, number][],
  z: number,
  depth: number,
  color?: string,
) {
  const signedArea = profile.reduce((sum, p, i) => {
    const q = profile[(i + 1) % profile.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
  if (signedArea < 0) profile = [...profile].reverse();
  const vertices = profile.flatMap(
      ([x, y]) =>
        [
          [x, y, z - depth / 2],
          [x, y, z + depth / 2],
        ] as SwitchPoint[],
    ),
    n = profile.length,
    faces: number[][] = [
      Array.from({ length: n }, (_, i) => (n - 1 - i) * 2),
      Array.from({ length: n }, (_, i) => i * 2 + 1),
    ];
  for (let i = 0; i < n; i++)
    faces.push([i * 2, ((i + 1) % n) * 2, ((i + 1) % n) * 2 + 1, i * 2 + 1]);
  return solid(id, material, vertices, faces, color);
}
function tube(
  id: string,
  material: SwitchMaterial,
  path: SwitchPoint[],
  radius: number,
  sides = 8,
  color?: string,
) {
  const rings = path.map((p, i) => {
    const before = path[Math.max(0, i - 1)],
      after = path[Math.min(path.length - 1, i + 1)],
      tangent = unit([after[0] - before[0], after[1] - before[1], after[2] - before[2]]),
      u = unit(cross(tangent, Math.abs(tangent[1]) > 0.85 ? [1, 0, 0] : [0, 1, 0])),
      v = cross(tangent, u);
    return Array.from({ length: sides }, (_, j) =>
      add(
        p,
        add(
          scale(u, Math.cos((j / sides) * Math.PI * 2) * radius),
          scale(v, Math.sin((j / sides) * Math.PI * 2) * radius),
        ),
      ),
    );
  });
  return { ...loft(id, material, rings, color), smooth: true };
}
function cylinder(
  id: string,
  material: SwitchMaterial,
  r: number,
  y0: number,
  y1: number,
  x = 0,
  z = 0,
  color?: string,
) {
  return {
    ...loft(
      id,
      material,
      [y0, y1].map((y) =>
        Array.from({ length: 24 }, (_, i) =>
          point(
            x + r * Math.cos((i / 24) * Math.PI * 2),
            y,
            z - r * Math.sin((i / 24) * Math.PI * 2),
          ),
        ),
      ),
      color,
    ),
    smooth: true,
  };
}
function ring(
  id: string,
  material: SwitchMaterial,
  outer: number,
  inner: number,
  y0: number,
  y1: number,
  color?: string,
) {
  const vertices: SwitchPoint[] = [],
    faces: number[][] = [];
  for (const [y, r] of [
    [y0, outer],
    [y1, outer],
    [y1, inner],
    [y0, inner],
  ])
    for (let i = 0; i < 32; i++)
      vertices.push([
        r * Math.cos((i / 32) * Math.PI * 2),
        y,
        r * Math.sin((i / 32) * Math.PI * 2),
      ]);
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 32; i++)
      faces.push([
        j * 32 + i,
        j * 32 + ((i + 1) % 32),
        ((j + 1) % 4) * 32 + ((i + 1) % 32),
        ((j + 1) % 4) * 32 + i,
      ]);
  return {
    ...solid(
      id,
      material,
      vertices,
      faces.map((face) => [...face].reverse()),
      color,
    ),
    smooth: true,
  };
}
function halfSleeve(
  id: string,
  material: SwitchMaterial,
  outer: number,
  inner: number,
  y0: number,
  y1: number,
  color?: string,
) {
  const vertices: SwitchPoint[] = [],
    faces: number[][] = [],
    n = 17;
  for (const [y, r] of [
    [y0, outer],
    [y1, outer],
    [y1, inner],
    [y0, inner],
  ])
    for (let i = 0; i < n; i++) {
      const q = Math.PI + (i / (n - 1)) * Math.PI;
      vertices.push([r * Math.cos(q), y, r * Math.sin(q)]);
    }
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < n - 1; i++)
      faces.push([j * n + i, j * n + i + 1, ((j + 1) % 4) * n + i + 1, ((j + 1) % 4) * n + i]);
  faces.push([0, n, n * 2, n * 3], [n - 1, n * 4 - 1, n * 3 - 1, n * 2 - 1]);
  return {
    ...solid(
      id,
      material,
      vertices,
      faces.map((face) => [...face].reverse()),
      color,
    ),
    smooth: true,
  };
}
function ribbon(
  id: string,
  path: SwitchPoint[],
  width: number,
  thickness = 0.12,
  material: SwitchMaterial = 'gold',
) {
  const rings = path.map((p, i) => {
    const next = path[Math.min(i + 1, path.length - 1)],
      prev = path[Math.max(0, i - 1)],
      normal = unit([next[1] - prev[1], prev[0] - next[0], 0]);
    return [
      add(add(p, scale(normal, -thickness / 2)), [0, 0, -width / 2]),
      add(add(p, scale(normal, thickness / 2)), [0, 0, -width / 2]),
      add(add(p, scale(normal, thickness / 2)), [0, 0, width / 2]),
      add(add(p, scale(normal, -thickness / 2)), [0, 0, width / 2]),
    ];
  });
  return loft(id, material, rings);
}

/** A continuous U wall, with a real rear corner radius and closed front cut faces.
 * Cross-sections are offset polygons, so draft and shoulder transitions belong
 * to the same molding instead of overlapping rectangular pillars. */
function uWall(
  id: string,
  material: SwitchMaterial,
  levels: {
    y: number;
    outer: number;
    inner: number;
    rear: number;
    insideRear: number;
    front: number;
  }[],
  detail: SwitchDetail,
) {
  const steps = detail === 'high' ? 6 : 3;
  const arc = (width: number, rear: number, front: number, r: number) => {
    const out: [number, number][] = [[-width / 2, front]];
    for (let i = 0; i <= steps; i++) {
      const angle = Math.PI + ((i / steps) * Math.PI) / 2;
      out.push([-width / 2 + r + r * Math.cos(angle), rear + r + r * Math.sin(angle)]);
    }
    for (let i = 0; i <= steps; i++) {
      const angle = -Math.PI / 2 + ((i / steps) * Math.PI) / 2;
      out.push([width / 2 - r + r * Math.cos(angle), rear + r + r * Math.sin(angle)]);
    }
    out.push([width / 2, front]);
    return out;
  };
  const rings = levels.map((l) => {
    const outer = arc(l.outer, l.rear, l.front, 0.62);
    const inner = arc(l.inner, l.insideRear, l.front, 0.38).reverse();
    return [...outer, ...inner].reverse().map(([x, z]) => point(x, l.y, z));
  });
  return { ...loft(id, material, rings), smooth: true };
}
/** Extruded frame with a genuine rectangular opening; the latch is not a bar
 * painted to look hollow. Its inside edges and hook thickness remain visible. */
function latchFrame(side: number) {
  const vertices: SwitchPoint[] = [],
    faces: number[][] = [];
  const outer = [
      [5.35, -4.95],
      [9.45, -4.95],
      [9.45, -2.65],
      [5.35, -2.65],
    ],
    inner = [
      [6.0, -4.52],
      [8.7, -4.52],
      [8.7, -3.08],
      [6.0, -3.08],
    ];
  for (const x of [7.02, 7.4])
    for (const ring of [outer, inner]) for (const [y, z] of ring) vertices.push([side * x, y, z]);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    faces.push(
      [i, j, 4 + j, 4 + i],
      [8 + i, 12 + i, 12 + j, 8 + j],
      [i, 8 + i, 8 + j, j],
      [4 + i, 4 + j, 12 + j, 12 + i],
    );
  }
  if (side > 0) faces.forEach((face) => face.reverse());
  return solid(`upper-latch-${side}`, 'housing', vertices, faces);
}
/** A keycap's curved touch surface, skirt, cavity and cut thickness form one
 * closed shell. The front half is removed with the housing's teaching section. */
function keycapShell(detail: SwitchDetail) {
  const nx = detail === 'high' ? 24 : 10,
    nz = detail === 'high' ? 10 : 4;
  const vertices: SwitchPoint[] = [],
    faces: number[][] = [];
  const roof = (u: number, v: number, inside = false): SwitchPoint => {
    const z = -8.05 + v * 7.63,
      corner = Math.max(0, 0.7 - (z + 8.05));
    const xmax = 7.85 - 0.7 + Math.sqrt(Math.max(0, 0.7 * 0.7 - corner * corner));
    const x = (u * 2 - 1) * xmax;
    return [
      x,
      18.32 + 0.62 * (x / 7.85) ** 2 + 0.05 * ((z + 4.2) / 4) ** 2 - (inside ? 0.67 : 0),
      z,
    ];
  };
  for (const inside of [false, true])
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) vertices.push(roof(i / nx, j / nz, inside));
  const offset = (nx + 1) * (nz + 1),
    at = (i: number, j: number) => j * (nx + 1) + i;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const f = [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)];
      faces.push(f, f.map((k) => k + offset).reverse());
    }
  // The front cut joins outer and inner surfaces, showing an honest .67 mm roof.
  for (let i = 0; i < nx; i++)
    faces.push([at(i, nz), offset + at(i, nz), offset + at(i + 1, nz), at(i + 1, nz)]);
  const edge: number[] = [];
  for (let j = nz; j >= 0; j--) edge.push(at(0, j));
  for (let i = 1; i <= nx; i++) edge.push(at(i, 0));
  for (let j = 1; j <= nz; j++) edge.push(at(nx, j));
  const bottomOuter: number[] = [],
    bottomInner: number[] = [];
  for (const index of edge) {
    const q = vertices[index],
      x = (q[0] * 8.35) / 7.85,
      z = -0.42 + ((q[2] + 0.42) * 8.15) / 7.63;
    bottomOuter.push(vertices.length);
    vertices.push([x, 14.7, z]);
    bottomInner.push(vertices.length);
    vertices.push([x - Math.sign(x) * 0.73, 14.82, z + (q[2] < -7.3 ? 0.65 : 0)]);
  }
  for (let j = 0; j < edge.length - 1; j++) {
    const k = j + 1,
      a = edge[j],
      b = edge[k],
      ao = bottomOuter[j],
      bo = bottomOuter[k],
      ai = bottomInner[j],
      bi = bottomInner[k];
    faces.push([a, b, bo, ao], [a + offset, ai, bi, b + offset], [ao, bo, bi, ai]);
  }
  for (const j of [0, edge.length - 1]) {
    const f = [edge[j], edge[j] + offset, bottomInner[j], bottomOuter[j]];
    faces.push(j === 0 ? f.reverse() : f);
  }
  return { ...solid('keycap-crown', 'cap', vertices, faces), smooth: true };
}

function moldedCrown(color: string, detail: SwitchDetail) {
  const steps = detail === 'high' ? 6 : 3;
  const profile = (y: number, w: number, d: number, r: number): SwitchPoint[] => {
    const p: SwitchPoint[] = [];
    for (const [cx, cz, angle] of [
      [w / 2 - r, -d / 2 + r, -Math.PI / 2],
      [w / 2 - r, d / 2 - r, 0],
      [-w / 2 + r, d / 2 - r, Math.PI / 2],
      [-w / 2 + r, -d / 2 + r, Math.PI],
    ])
      for (let i = 0; i <= steps; i++)
        p.push([
          cx + r * Math.cos(angle + ((i / steps) * Math.PI) / 2),
          y,
          cz + r * Math.sin(angle + ((i / steps) * Math.PI) / 2) - 0.1,
        ]);
    return p.reverse();
  };
  return {
    ...loft(
      'stem-central',
      'stem',
      [
        profile(11.15, 4.6, 4.15, 0.3),
        profile(11.27, 4.8, 4.35, 0.34),
        profile(12.17, 4.8, 4.35, 0.34),
        profile(12.35, 4.58, 4.13, 0.33),
      ],
      color,
    ),
    smooth: true,
  };
}
const curvedProfile = (pairs: [number, number][], y: number) => {
  let i = 0;
  while (i < pairs.length - 2 && y > pairs[i + 1][0]) i++;
  const a = pairs[i],
    b = pairs[i + 1],
    previous = pairs[Math.max(0, i - 1)],
    next = pairs[Math.min(pairs.length - 1, i + 2)];
  const t = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0]))),
    length = b[0] - a[0];
  const m0 = (b[1] - previous[1]) / (b[0] - previous[0]),
    m1 = (next[1] - a[1]) / (next[0] - a[0]);
  return (
    (2 * t ** 3 - 3 * t * t + 1) * a[1] +
    (t ** 3 - 2 * t * t + t) * length * m0 +
    (-2 * t ** 3 + 3 * t * t) * b[1] +
    (t ** 3 - t * t) * length * m1
  );
};
function contactRivet(id: string, x0: number, x1: number, y: number, z: number) {
  const piece = cylinder(id, 'gold', 0.16, x0, x1);
  return {
    ...piece,
    vertices: piece.vertices.map((p) => [p[1], y + p[0], z - p[2]] as SwitchPoint),
  };
}
/** One molded MX cross rather than two intersecting cuboids. Small lead-in
 * chamfers guide the female socket while retaining the specified clearance. */
function crossPost(color: string) {
  const crossShape = (outer: number, arm: number, y: number): SwitchPoint[] =>
    [
      [-arm, -outer],
      [arm, -outer],
      [arm, -arm],
      [outer, -arm],
      [outer, arm],
      [arm, arm],
      [arm, outer],
      [-arm, outer],
      [-arm, arm],
      [-outer, arm],
      [-outer, -arm],
      [-arm, -arm],
    ]
      .reverse()
      .map(([x, z]) => [x, y, z]);
  return loft(
    'mx-cross-x',
    'stem',
    [crossShape(2.125, 0.64, 12.3), crossShape(2.125, 0.64, 15.08), crossShape(2.045, 0.56, 15.3)],
    color,
  );
}
/** Stamped sheet with two broad shoulders and an actual punched central slot.
 * The same centerline ends at the modeled contact; changing a curve never
 * reconstructs electrical state. Rounded bending is sampled at a common LOD. */
function stampedLeaf(
  id: string,
  center: (y: number) => number,
  width: (y: number) => number,
  top: number,
  thickness: number,
  slot: [number, number],
  detail: SwitchDetail,
) {
  const yValues = [1.45, 1.7, 2.05, slot[0], slot[1], 5.2, 5.65, 6.15, top];
  if (detail === 'high') for (let y = 1.7; y < top; y += 0.24) yValues.push(y);
  const ys = [...new Set(yValues)].sort((a, b) => a - b);
  const vertices: SwitchPoint[] = [],
    faces: number[][] = [];
  const grid: number[][][] = [],
    halfHole = 0.32;
  for (const y of ys) {
    const row: number[][] = [],
      w = width(y) / 2;
    for (const z of [-w, -halfHole, halfHole, w]) {
      const pair: number[] = [];
      for (const side of [-1, 1]) {
        pair.push(vertices.length);
        vertices.push([center(y) + (side * thickness) / 2, y, 2.1 + z]);
      }
      row.push(pair);
    }
    grid.push(row);
  }
  const cells: boolean[][] = ys
    .slice(0, -1)
    .map((y, j) => [true, !(y >= slot[0] - 1e-8 && ys[j + 1] <= slot[1] + 1e-8), true]);
  for (let j = 0; j < ys.length - 1; j++)
    for (let k = 0; k < 3; k++)
      if (cells[j][k]) {
        const a = grid[j][k],
          b = grid[j + 1][k],
          c = grid[j + 1][k + 1],
          d = grid[j][k + 1];
        faces.push([a[0], b[0], c[0], d[0]], [a[1], d[1], c[1], b[1]]);
        if (j === 0 || !cells[j - 1][k]) faces.push([a[0], d[0], d[1], a[1]]);
        if (j === ys.length - 2 || !cells[j + 1][k]) faces.push([b[0], b[1], c[1], c[0]]);
        if (k === 0 || !cells[j][k - 1]) faces.push([a[0], a[1], b[1], b[0]]);
        if (k === 2 || !cells[j][k + 1]) faces.push([d[0], c[0], c[1], d[1]]);
      }
  return {
    ...solid(
      id,
      'gold',
      vertices,
      faces.map((face) => [...face].reverse()),
    ),
    smooth: true,
  };
}
const interpolateProfile = (pairs: [number, number][], y: number) => {
  let i = 0;
  while (i < pairs.length - 2 && y > pairs[i + 1][0]) i++;
  const [a, b] = [pairs[i], pairs[i + 1]],
    t = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0])));
  return a[1] + (b[1] - a[1]) * t;
};
/** Fixed, shared molded geometry: one lower well and one drafted upper shell. */
function fixedParts(detail: SwitchDetail): SwitchSolid[] {
  const a: SwitchSolid[] = [];
  a.push(box('pcb', 'pcb', [21.5, 1.1, 18.6], [0, -0.55, 0], 0.18));
  a.push(
    uWall(
      'housing-shell',
      'base',
      [
        { y: 1.45, outer: 13.5, inner: 11.8, rear: -6.7, insideRear: -5.85, front: 1.6 },
        { y: 1.8, outer: 13.8, inner: 11.9, rear: -6.9, insideRear: -5.95, front: 1.6 },
        { y: 4.9, outer: 14, inner: 12.15, rear: -7, insideRear: -6.05, front: 1.6 },
        { y: 5.08, outer: 14.55, inner: 12.15, rear: -7, insideRear: -6.05, front: 1.6 },
        { y: 5.45, outer: 14.55, inner: 12.15, rear: -7, insideRear: -6.05, front: 1.6 },
        { y: 5.62, outer: 13.7, inner: 12.1, rear: -6.85, insideRear: -6.05, front: 1.6 },
        { y: 6.32, outer: 13.7, inner: 12.1, rear: -6.85, insideRear: -6.05, front: 1.6 },
      ],
      detail,
    ),
  );
  a.push(
    uWall(
      'upper-shell',
      'housing',
      [
        { y: 6.28, outer: 13.5, inner: 11.85, rear: -6.75, insideRear: -5.92, front: 1.6 },
        { y: 9.38, outer: 13.5, inner: 11.85, rear: -6.75, insideRear: -5.92, front: 1.6 },
        { y: 9.62, outer: 13.15, inner: 11.5, rear: -6.62, insideRear: -5.78, front: 1.6 },
        { y: 11.7, outer: 10.7, inner: 9.1, rear: -5.4, insideRear: -4.52, front: 1.6 },
        { y: 11.88, outer: 10.48, inner: 9.02, rear: -5.28, insideRear: -4.48, front: 1.6 },
        { y: 12.14, outer: 10.15, inner: 5.3, rear: -5.1, insideRear: -2.65, front: 1.6 },
        { y: 12.48, outer: 9.95, inner: 5.3, rear: -5, insideRear: -2.65, front: 1.6 },
      ],
      detail,
    ),
  );
  for (const side of [-1, 1]) {
    a.push(box(`pcb-pad-${side}`, 'gold', [1.6, 0.055, 2.0], [side * 5.2, 0.025, 4.9], 0.03));
    a.push(box(`pcb-trace-${side}`, 'copper', [0.36, 0.045, 4.3], [side * 5.2, 0.04, 6.9], 0.015));
    a.push(
      box(`pcb-trace-turn-${side}`, 'copper', [4.7, 0.045, 0.36], [side * 7.3, 0.04, 8.2], 0.015),
    );
    a.push(latchFrame(side));
    a.push(
      prism(
        `latch-hook-${side}`,
        'housing',
        [
          [side * 7.4, 5.8],
          [side * 6.94, 5.65],
          [side * 6.89, 5.4],
          [side * 7.4, 5.35],
        ],
        -3.8,
        2.3,
      ),
    );
    a.push(
      box(`latch-bridge-${side}`, 'housing', [0.8, 0.34, 2.3], [side * 6.98, 9.35, -3.8], 0.06),
    );
    a.push(box(`stem-guide-${side}`, 'base', [0.65, 8.3, 1.25], [side * 3.4, 6.2, -0.9], 0.08));
    a.push(
      box(`spring-guide-rib-${side}`, 'base', [0.55, 1.7, 3.5], [side * 2.8, 2.4, -0.9], 0.08),
    );
    // Molded braces merge with the lower well; no decorative fasteners.
    for (const z of [-5.1, -1.8])
      a.push(
        prism(
          `base-rib-${side}-${z}`,
          'base',
          [
            [side * 6.08, 1.5],
            [side * 5.55, 1.5],
            [side * 6.08, 4.85],
          ],
          z,
          0.45,
        ),
      );
    a.push(
      box(
        `lower-guide-buttress-${side}`,
        'base',
        [0.65, 0.75, 1.25],
        [side * 3.4, 1.75, -0.9],
        0.065,
      ),
    );
  }
  a.push(box('housing-bottom', 'base', [14, 1.45, 14], [0, 0.775, 0], 0.18));
  a.push(box('section-base-lip', 'base', [14, 0.48, 1.0], [0, 1.55, 6.5], 0.1));
  a.push(cylinder('lower-spring-seat', 'base', 2.55, 1.45, 2));
  a.push(cylinder('central-guide-post', 'base', 0.66, 1.55, 5.45));
  a.push(box('contact-terminal-a', 'gold', [0.48, 3.4, 0.68], [5.5, 1.05, 2.1], 0.04));
  a.push(box('contact-terminal-b', 'gold', [0.48, 3.4, 0.68], [3.65, 1.05, 2.1], 0.04));
  return a;
}
const housing = { high: fixedParts('high'), reduced: fixedParts('reduced') };
const keycaps = { high: keycapShell('high'), reduced: keycapShell('reduced') };

const translate = (s: SwitchSolid, dy: number): SwitchSolid => ({
  ...s,
  vertices: s.vertices.map((p) => [p[0], p[1] + dy, p[2]]),
});
export function keyboardSwitchCamProfile(state: KeyboardSwitchState): [number, number][] {
  if (state.click.present)
    return [
      [2.2, 9.9],
      [3.08, 9.9],
      [3.86, 8.1],
      [3.35, 7.7],
      [2.2, 7.7],
    ];
  return state.variant === 'brown'
    ? [
        [2.2, 11.8],
        [3.05, 11.8],
        ...Array.from({ length: 9 }, (_, i): [number, number] => {
          const y = 9.7 - (i / 8) * 0.65;
          return [4.03 - 0.98 * ((y - 9.05) / 0.65) ** 2, y];
        }),
        ...Array.from({ length: 8 }, (_, i): [number, number] => {
          const y = 9.05 - ((i + 1) / 8) * 0.95;
          return [4.03 - 0.88 * ((y - 9.05) / 0.95) ** 2, y];
        }),
        [3.05, 6.8],
        [2.2, 6.8],
      ]
    : [
        [2.2, 11.8],
        [3.05, 11.8],
        [3.05, 10.2],
        [3.76, 7.1],
        [3.6, 6.8],
        [2.2, 6.8],
      ];
}
/** Intersection of the actual moving TLS polygon with the stationary follower's
 * height. The rounded metal nose touches this face, including the Brown bump. */
export function keyboardSwitchCamContact(state: KeyboardSwitchState) {
  const profile = keyboardSwitchCamProfile(state),
    offset = state.click.present ? state.click.sleeveOffsetMm : state.stemOffsetMm,
    y = 7.55,
    localY = y - offset;
  let x = -Infinity,
    slope = 0;
  for (let i = 0; i < profile.length; i++) {
    const a = profile[i],
      b = profile[(i + 1) % profile.length];
    if (
      Math.abs(b[1] - a[1]) < 1e-8 ||
      localY < Math.min(a[1], b[1]) - 1e-8 ||
      localY > Math.max(a[1], b[1]) + 1e-8
    )
      continue;
    const q = (b[0] - a[0]) / (b[1] - a[1]),
      candidate = a[0] + q * (localY - a[1]);
    if (candidate > x) {
      x = candidate;
      slope = q;
    }
  }
  if (!Number.isFinite(x))
    return { x: 3.35, y, slope: 0, engaged: false, normal: [1, 0, 0] as SwitchPoint };
  return { x, y, slope, engaged: true, normal: unit([1, -slope, 0]) };
}

export function keyboardSwitchSolids(
  state: KeyboardSwitchState,
  detail: SwitchDetail = 'high',
): SwitchSolid[] {
  const variant = state.variant,
    color = switchStemColor(variant),
    dy = state.stemOffsetMm,
    a = housing[detail].map((s) => ({ ...s }));
  const moving: SwitchSolid[] = [];

  // The crown and hollow U skirt are drafted moldings, not a filled central box.
  // Their cut face exposes the spring-centering cavity without inventing a gap.
  moving.push(moldedCrown(color, detail));
  moving.push({
    ...uWall(
      'stem-cavity-shell',
      'stem',
      [
        { y: 9.05, outer: 4.72, inner: 4.1, rear: -2.25, insideRear: -1.98, front: 2.075 },
        { y: 9.2, outer: 4.8, inner: 4.1, rear: -2.275, insideRear: -1.98, front: 2.075 },
        { y: 11.27, outer: 4.8, inner: 4.1, rear: -2.275, insideRear: -1.98, front: 2.075 },
      ],
      detail,
    ),
    color,
  });
  for (const side of [-1, 1])
    moving.push(
      box(
        `stem-runner-${side}`,
        'stem',
        [0.75, 3.225, 1.05],
        [side * 2.65, 10.2375, -0.85],
        0.08,
        color,
      ),
    );
  moving.push(ring('upper-spring-seat', 'stem', 2.45, 0.96, 11, 11.15, color));
  moving.push(crossPost(color));
  moving.push(keycaps[detail]);
  // The female MX socket has a cross-shaped void with clearance around the male
  // stem. Its front half is sectioned together with the keycap, not filled solid.
  moving.push(box('keycap-socket-back', 'cap', [5, 3, 0.3], [0, 16.25, -2.35], 0.04));
  for (const side of [-1, 1]) {
    moving.push(
      box(`keycap-socket-side-${side}`, 'cap', [0.3, 3, 2.2], [side * 2.35, 16.25, -1.1], 0.04),
    );
    moving.push(
      box(`keycap-socket-corner-${side}`, 'cap', [1.5, 3, 1.5], [side * 1.45, 16.25, -1.45], 0.04),
    );
  }

  // Thin ribs are physically connected to the socket, rear wall and underside
  // of the cap. Their low leading edges keep the removed front section open.
  for (const side of [-1, 1]) {
    const count = detail === 'high' ? 13 : 6;
    const top = Array.from({ length: count }, (_, i): [number, number] => {
      const x = 2.35 + (i / (count - 1)) * 5.44;
      return [side * x, 17.68 + 0.62 * (x / 7.85) ** 2 + 0.05 * (2.7 / 4) ** 2];
    });
    const profile = [...top, ...top.map(([x, y]): [number, number] => [x, y - 1.0]).reverse()];
    moving.push(prism(`keycap-inner-rib-${side}`, 'cap', profile, -1.5, 0.36));
  }
  moving.push(box('keycap-socket-rear-rib', 'cap', [0.36, 1.4, 5.3], [0, 17.05, -5.0], 0.035));

  // A shaped TLS leg remains attached to the slider. Brown's rounded bump is a
  // visible local feature, not a color-only version of the straight linear leg.
  const ramp = keyboardSwitchCamProfile(state);
  if (state.contact.present && !state.click.present)
    moving.push(prism('tls-stem-leg', 'stem', ramp, 1.75, 0.9, color));
  a.push(...moving.map((s) => translate(s, dy)));
  const springTop = state.springTop[1],
    springBottom = state.springBottom[1];

  // The MX2A barrel spring also appears in Speed Silver and Silent Red.
  // Blue is the documented exception; generic Hall/optical keep equal radii.
  // Silent retains its separate damped stem molding rather than standard ribs.
  const barrel = ['red', 'black', 'brown', 'silver', 'silent-red'].includes(variant),
    turns = 6.25,
    samples = detail === 'high' ? 250 : 112;
  const springPath = Array.from({ length: samples + 1 }, (_, i) => {
    const t = (i / samples) * turns,
      angle = t * Math.PI * 2;
    const length = springTop - springBottom - 0.36;
    const rise =
      t < 1
        ? 0.37 * t
        : t > turns - 1
          ? length - 0.37 * (turns - t)
          : 0.37 + ((t - 1) * (length - 0.74)) / (turns - 2);
    const middle = Math.max(0, Math.min(1, (t - 0.65) / (turns - 1.3)));
    const radius = barrel ? 1.55 + 0.23 * Math.sin(middle * Math.PI) ** 2 : 1.72;
    return point(Math.cos(angle) * radius, springBottom + 0.18 + rise, Math.sin(angle) * radius);
  });
  a.push(tube('return-spring', 'steel', springPath, 0.18, detail === 'high' ? 12 : 8));

  if (state.contact.present) {
    const x = SWITCH_GEOMETRY.contactX - state.contact.gapMm;
    // Two gold crosspoint tips meet geometrically at the modeled gap. Neither
    // contact position nor electrical state is inferred again in this renderer.

    const fixedX = (y: number) =>
      curvedProfile(
        [
          [1.45, 5.5],
          [4.85, 5.5],
          [5.5, 5.48],
          [6.7, 5.48],
        ],
        y,
      );
    const movingX = (y: number) =>
      curvedProfile(
        [
          [1.45, 3.65],
          [3, 3.72],
          [4.7, 4.18],
          [6.1, x - 0.25],
          [6.7, x - 0.13],
        ],
        y,
      );
    const stampingWidth = (y: number) =>
      interpolateProfile(
        [
          [1.45, 0.68],
          [2.05, 1.85],
          [4.5, 2.15],
          [5.2, 1.85],
          [5.65, 1.0],
          [6.7, 0.86],
        ],
        y,
      );
    a.push(
      stampedLeaf('fixed-contact-leaf', fixedX, stampingWidth, 6.7, 0.18, [2.65, 4.45], detail),
    );
    a.push(
      stampedLeaf('moving-contact-leaf', movingX, stampingWidth, 6.7, 0.16, [2.75, 4.4], detail),
    );
    a.push(box('fixed-crosspoint', 'gold', [0.26, 0.48, 0.24], [5.48, 6.7, 2.1], 0.06));
    a.push(box('moving-crosspoint', 'gold', [0.26, 0.24, 0.56], [x - 0.13, 6.7, 2.1], 0.04));
    a.push(contactRivet('fixed-contact-rivet', 5.47, 5.68, 6.7, 2.1));
    a.push(contactRivet('moving-contact-rivet', x - 0.39, x - 0.12, 6.7, 2.1));
    const cam = keyboardSwitchCamContact(state),
      bend = state.contact.leafDeflectionMm;
    const nose = add([cam.x, cam.y, 2.1], scale(cam.normal, 0.15));
    a.push(
      ribbon(
        'leaf-follower',
        [[x - 0.3, 6.15, 2.1], [cam.x + 0.25 + bend * 0.08, 7.0, 2.1], nose],
        0.8,
        0.13,
      ),
    );
    a.push(
      tube(
        'leaf-folded-contact-nose',
        'gold',
        [
          [nose[0], nose[1], 1.68],
          [nose[0], nose[1], 2.52],
        ],
        0.15,
        12,
      ),
    );
  }
  if (state.click.present) {
    for (const side of [-1, 1]) {
      for (const id of [`stem-guide-${side}`, `lower-guide-buttress-${side}`]) {
        const guide = a.find((p) => p.id === id)!;
        guide.vertices = guide.vertices.map((p) => [p[0] + side * 1.15, p[1], p[2]]);
      }
    }
    const jy = state.click.sleeveOffsetMm;
    // The white click jacket is a separate U-shaped molded component, constrained
    // by the same stem rails. Its skirt and shoulder survive both macro and 2D.
    const jacket: SwitchSolid[] = [];
    jacket.push(box('click-jacket-front', 'cap', [7.6, 1.15, 0.8], [0, 8.5, 2.5], 0.12, '#d9ddd7'));
    for (const side of [-1, 1]) {
      a.push(
        translate(
          box(
            `click-stem-downrail-${side}`,
            'stem',
            [0.65, 1.5, 1.3],
            [side * 2.65, 8.4, -0.85],
            0.06,
            color,
          ),
          dy,
        ),
      );
      jacket.push(
        prism(
          `click-jacket-side-${side}`,
          'cap',
          [
            [side * 3.09, 7.875],
            [side * 3.55, 7.875],
            [side * 3.78, 8.3],
            [side * 3.81, 9.9],
            [side * 3.66, 10.325],
            [side * 3.13, 10.325],
            [side * 3.09, 9.95],
            [side * 3.18, 8.55],
          ],
          0.1,
          4.7,
          '#d9ddd7',
        ),
      );
      jacket.push(
        box(
          `click-jacket-shoulder-${side}`,
          'cap',
          [1.13, 0.5, 1.5],
          [side * 3.64, 10.55, -0.85],
          0.08,
          '#d9ddd7',
        ),
      );
      a.push(
        translate(
          box(
            `click-upper-stop-${side}`,
            'stem',
            [1.7, 0.35, 1.8],
            [side * 3.15, 11.625, -0.85],
            0.07,
            color,
          ),
          dy,
        ),
      );
      a.push(
        translate(
          box(
            `click-lower-stop-${side}`,
            'stem',
            [1.7, 0.35, 1.8],
            [side * 3.15, 7.7, -0.85],
            0.07,
            color,
          ),
          dy,
        ),
      );
    }
    jacket.push(
      prism('click-jacket-cam', 'cap', keyboardSwitchCamProfile(state), 1.75, 0.8, '#d9ddd7'),
    );
    a.push(...jacket.map((s) => translate(s, jy)));
  }
  if (variant === 'silent-red') {
    for (const side of [-1, 1]) {
      for (const id of [`stem-guide-${side}`, `lower-guide-buttress-${side}`]) {
        const guide = a.find((p) => p.id === id)!;
        guide.vertices = guide.vertices.map((p) => [p[0] + side, p[1], p[2]]);
      }
      const x = side * 3.15;
      const bottom = 0.5 - state.silent.bottomCompressionMm,
        top = 0.5 - state.silent.topCompressionMm;
      // Bottom shoe first reaches the pad at 3.45 mm; the upper shoulder first
      // reaches its pad at 0.2 mm. Then the same model compression preserves contact.
      a.push(
        box(
          `silent-bottom-pad-${side}`,
          'silicone',
          [1.6, bottom, 1.8],
          [x, 4.0 + bottom / 2, 0.6],
          0.07,
        ),
      );
      a.push(
        translate(
          box(`silent-bottom-shoe-${side}`, 'stem', [1.45, 0.4, 1.65], [x, 8.15, 0.6], 0.07, color),
          dy,
        ),
      );
      a.push(
        box(`silent-top-pad-${side}`, 'silicone', [1.55, top, 1.6], [x, 11.5 - top / 2, 0.6], 0.07),
      );
      a.push(
        translate(
          box(
            `silent-top-shoulder-${side}`,
            'stem',
            [1.65, 0.4, 1.55],
            [x, 11.0, 0.6],
            0.07,
            color,
          ),
          dy,
        ),
      );
      a.push(box(`silent-bottom-mount-${side}`, 'base', [1.7, 2.5, 1.9], [x, 2.75, 0.6], 0.08));
      a.push(box(`silent-top-mount-${side}`, 'housing', [1.7, 0.55, 1.9], [x, 11.775, 0.6], 0.07));
      a.push(
        translate(
          box(
            `silent-stem-downrail-${side}`,
            'stem',
            [0.9, 1.2, 2.0],
            [side * 3.0, 8.8, 0.35],
            0.06,
            color,
          ),
          dy,
        ),
      );
    }
  }
  if (variant === 'hall') {
    for (const id of [
      'central-guide-post',
      'lower-spring-seat',
      'housing-bottom',
      'section-base-lip',
    ]) {
      const index = a.findIndex((s) => s.id === id);
      if (index >= 0) a.splice(index, 1);
    }
    a.push(ring('hall-open-spring-seat', 'base', 2.55, 1.05, 1.45, 2));
    for (const side of [-1, 1]) {
      a.push(box(`hall-cut-base-${side}`, 'base', [5.4, 1.45, 14], [side * 4.3, 0.775, 0], 0.18));
      a.push(box(`hall-cut-lip-${side}`, 'base', [5.4, 0.48, 1.0], [side * 4.3, 1.55, 6.5], 0.1));
    }
    a.push(box('hall-cut-base-back', 'base', [3.2, 1.45, 5.4], [0, 0.775, -4.3], 0.15));
    a.push(
      cylinder('stem-magnet', 'magnet', 0.72, state.hall.magnetYmm - 1, state.hall.magnetYmm + 1),
    );
    a.push(
      translate(halfSleeve('magnet-retaining-sleeve', 'stem', 0.98, 0.73, 6.2, 9.3, color), dy),
    );
    a.push(box('hall-package', 'sensor', [1.5, 0.65, 1.15], [0, state.hall.sensorYmm, 0], 0.1));
    for (const side of [-1, 1])
      a.push(box(`hall-solder-${side}`, 'gold', [0.35, 0.18, 0.85], [side * 0.84, 0.1, 0], 0.035));
    a.push(box('hall-trace', 'copper', [0.22, 0.05, 7.9], [0, 0.03, 4.4], 0.02));
  }
  if (variant === 'optical') {
    // The shutter's lower tail travels into a deliberately sectioned slot in
    // both support and PCB. It never passes through an uncut opaque solid.
    for (const id of ['housing-bottom', 'pcb']) {
      const i = a.findIndex((p) => p.id === id);
      if (i >= 0) a.splice(i, 1);
    }
    for (const side of [-1, 1]) {
      a.push(
        box(`optical-pcb-wing-${side}`, 'pcb', [10, 1.1, 18.6], [side * 5.75, -0.55, 0], 0.15),
      );
      a.push(
        box(`optical-base-wing-${side}`, 'base', [6.25, 1.45, 14], [side * 3.875, 0.775, 0], 0.15),
      );
    }
    a.push(box('optical-pcb-rear', 'pcb', [1.5, 1.1, 11.5], [0, -0.55, -3.55], 0.1));
    a.push(box('optical-pcb-front', 'pcb', [1.5, 1.1, 4.1], [0, -0.55, 7.25], 0.1));
    a.push(box('optical-base-rear', 'base', [1.5, 1.45, 9.2], [0, 0.775, -2.4], 0.1));
    a.push(box('optical-base-front', 'base', [1.5, 1.45, 1.8], [0, 0.775, 6.1], 0.1));
    // Light travels across a hole in the moving shutter. Only transmitted light
    // reaches the receiver; the incident segment persists when the port is closed.
    const beamY = state.optical.beamYmm,
      portY = beamY + state.optical.apertureCenterMm,
      half = state.optical.apertureHalfHeightMm;
    // The shutter lies in the yz plane. Its opening traverses the entire x
    // thickness, and its long y slot remains clear after actuation to bottom-out.
    for (const side of [-1, 1])
      a.push(
        box(
          `optical-shutter-edge-${side}`,
          'stem',
          [0.72, 2 * half + 1.1, 0.48],
          [0, portY, 3.7 + side * 0.75],
          0.08,
          color,
        ),
      );
    a.push(
      box(
        'optical-shutter-top',
        'stem',
        [0.72, 0.72, 1.98],
        [0, portY + half + 0.36, 3.7],
        0.06,
        color,
      ),
    );
    a.push(
      box(
        'optical-shutter-bottom',
        'stem',
        [0.72, 2.9, 1.98],
        [0, portY - half - 1.45, 3.7],
        0.06,
        color,
      ),
    );
    a.push(
      translate(
        box('shutter-stem-bridge', 'stem', [0.72, 0.8, 3.1], [0, 11.65, 2.45], 0.1, color),
        dy,
      ),
    );
    a.push(box('optical-emitter', 'sensor', [1.65, 1.55, 1.75], [-3.25, beamY, 3.7], 0.12));
    a.push(box('optical-receiver', 'sensor', [1.65, 1.55, 1.75], [3.25, beamY, 3.7], 0.12));
    a.push(box('optical-emitter-lens', 'light', [0.14, 0.65, 0.62], [-2.37, beamY, 3.7], 0.05));
    a.push(
      box(
        'optical-receiver-window',
        'sensor',
        [0.14, 0.65, 0.62],
        [2.37, beamY, 3.7],
        0.05,
        '#7c697f',
      ),
    );
    for (const side of [-1, 1])
      a.push(
        box(`optical-support-${side}`, 'base', [1.65, 2.95, 1.75], [side * 3.25, 2.25, 3.7], 0.12),
      );
    a.push(
      tube(
        'incident-light',
        'light',
        [
          [-2.25, beamY, 3.7],
          [-0.37, beamY, 3.7],
        ],
        state.optical.beamRadiusMm,
        8,
        '#d48c72',
      ),
    );
    if (state.optical.transmission > 0.01) {
      const transmitted = tube(
        'transmitted-light',
        'light',
        [
          [-0.36, beamY, 3.7],
          [2.25, beamY, 3.7],
        ],
        state.optical.beamRadiusMm,
        8,
        '#d48c72',
      );
      transmitted.opacity = 0.25 + 0.75 * state.optical.transmission;
      a.push(transmitted);
    }
  }
  if (!state.contact.present) return a.filter((s) => !s.id.startsWith('contact-terminal'));
  return a;
}

/** Fixed framing by chapter, never auto-normalized from a changing displacement. */
export function keyboardSwitchView(
  chapter: number,
  narrow: boolean,
  variant?: KeyboardSwitchState['variant'],
) {
  if (chapter === 5 && variant === 'silent-red')
    return {
      focus: [0.3, 7.85, 0.6] as SwitchPoint,
      span: 9.4,
      height: 10.6,
      direction: unit([2.7, 1.6, 11]),
      detail: true,
      narrow,
    };
  const detail = chapter === 2 || chapter === 3 || chapter === 4 || chapter === 6 || chapter === 7;
  const focus: SwitchPoint =
    chapter === 2
      ? [3.65, 7.55, 2.1]
      : chapter === 3
        ? [0.65, 7.7, 1.4]
        : chapter === 4
          ? [4.8, 6.25, 2.1]
          : chapter === 6
            ? [0, 3.7, 0.3]
            : chapter === 7
              ? [0, 5.0, 3.1]
              : [0, 8.9, 0];
  const span =
    chapter === 4
      ? 7.7
      : chapter === 2
        ? 8.0
        : chapter === 3
          ? 9.0
          : chapter === 6
            ? 8.8
            : chapter === 7
              ? 9.5
              : 25.5;
  return {
    focus,
    span,
    height: detail ? (chapter === 4 ? 8.2 : chapter === 3 ? 10.0 : 9.3) : 25.5,
    direction: unit(
      (chapter === 7
        ? [10, 3.5, 7]
        : chapter === 2 || chapter === 4
          ? [8, 2.7, 10]
          : detail
            ? [2.7, 1.6, 11]
            : [6.2, 4.7, 12]) as SwitchPoint,
    ),
    detail,
    narrow,
  };
}
