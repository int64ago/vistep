import { HELICOPTER, helicopterBladePitch, helicopterRadians } from './helicopter';
export type HeliPoint = [number, number, number];
export type HeliFrame = 'fixed' | 'hub' | 'blade-a' | 'blade-b' | 'tail';
export type HeliSolid = {
  part: string;
  vertices: HeliPoint[];
  faces: number[][];
  color: string;
  frame: HeliFrame;
};
export type HelicopterVisual = {
  phase: number;
  collectiveDeg: number;
  cyclicDeg: number;
  tailBalance: number;
  torque: boolean;
  diskTiltDeg?: number;
  view?: string;
  tailForce?: number;
  rotorTorque?: number;
  thrust?: number;
  weight?: number;
};
export const HELI_ART = {
  mast: [0, 3.05, 0] as HeliPoint,
  tail: [-4.7, 2.03, 0.25] as HeliPoint,
  tailArm: HELICOPTER.tailArm,
};
const paint = {
  shell: '#e5e0cd',
  glass: '#365d68',
  dark: '#34464c',
  metal: '#9caaa8',
  copper: '#b77d49',
  pale: '#879b9c',
  stripe: '#397c82',
};
function ellipsoid(
  part: string,
  center: HeliPoint,
  radius: HeliPoint,
  color: string,
  lat = 12,
  lon = 24,
): HeliSolid {
  const vertices: HeliPoint[] = [],
    faces: number[][] = [];
  for (let i = 0; i <= lat; i++)
    for (let j = 0; j < lon; j++) {
      const a = (Math.PI * i) / lat,
        b = (Math.PI * 2 * j) / lon;
      vertices.push([
        center[0] + radius[0] * Math.cos(a),
        center[1] + radius[1] * Math.sin(a) * Math.cos(b),
        center[2] + radius[2] * Math.sin(a) * Math.sin(b),
      ]);
    }
  for (let i = 0; i < lat; i++)
    for (let j = 0; j < lon; j++)
      faces.push([
        i * lon + j,
        i * lon + ((j + 1) % lon),
        (i + 1) * lon + ((j + 1) % lon),
        (i + 1) * lon + j,
      ]);
  return { part, vertices, faces, color, frame: 'fixed' };
}
function cylinder(
  part: string,
  a: HeliPoint,
  b: HeliPoint,
  ra: number,
  rb: number,
  color: string,
  frame: HeliFrame = 'fixed',
  count = 12,
): HeliSolid {
  const d = b.map((v, i) => v - a[i]),
    length = Math.hypot(...d),
    n = d.map((v) => v / length),
    helper = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0],
    u0 = [
      n[1] * helper[2] - n[2] * helper[1],
      n[2] * helper[0] - n[0] * helper[2],
      n[0] * helper[1] - n[1] * helper[0],
    ],
    ul = Math.hypot(...u0),
    u = u0.map((v) => v / ul),
    v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const vertices: HeliPoint[] = [],
    faces: number[][] = [];
  for (let k = 0; k < 2; k++)
    for (let j = 0; j < count; j++) {
      const p = k ? b : a,
        r = k ? rb : ra,
        angle = (j * Math.PI * 2) / count;
      vertices.push(
        p.map(
          (value, i) => value + r * (Math.cos(angle) * u[i] + Math.sin(angle) * v[i]),
        ) as HeliPoint,
      );
    }
  faces.push(
    Array.from({ length: count }, (_, i) => count - i - 1),
    Array.from({ length: count }, (_, i) => i + count),
  );
  for (let j = 0; j < count; j++)
    faces.push([j, (j + 1) % count, ((j + 1) % count) + count, j + count]);
  return { part, vertices, faces, color, frame };
}
export function helicopterAirfoil(samples = 24) {
  const upper: [number, number][] = [],
    lower: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const x = (1 - Math.cos((Math.PI * i) / samples)) / 2,
      y =
        5 *
        0.12 *
        (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    upper.push([x, y]);
    lower.push([x, -y]);
  }
  return [...upper, ...lower.slice(1, -1).reverse()];
}
function blade(
  part: string,
  frame: HeliFrame,
  r0: number,
  r1: number,
  chord: number,
  color: string,
): HeliSolid {
  const section = helicopterAirfoil(16),
    n = section.length,
    vertices: HeliPoint[] = [],
    faces: number[][] = [];
  for (const r of [r0, r1])
    for (const [u, v] of section) vertices.push([r, v * chord, (u - 0.25) * chord]);
  faces.push(
    Array.from({ length: n }, (_, i) => n - i - 1),
    Array.from({ length: n }, (_, i) => n + i),
  );
  for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, ((i + 1) % n) + n, i + n]);
  return { part, vertices, faces, color, frame };
}
function prism(
  part: string,
  profile: [number, number][],
  thickness: number,
  color: string,
): HeliSolid {
  const n = profile.length,
    vertices = [-thickness / 2, thickness / 2].flatMap((z) =>
      profile.map(([x, y]) => [x, y, z] as HeliPoint),
    ),
    faces = [
      Array.from({ length: n }, (_, i) => n - i - 1),
      Array.from({ length: n }, (_, i) => n + i),
    ];
  for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, ((i + 1) % n) + n, i + n]);
  return { part, vertices, faces, color, frame: 'fixed' };
}
/** One continuous loft partitions painted fuselage and inset glass; shared boundary
 * vertices avoid intersecting ellipsoids, coplanar noise and white slivers. */
function fuselage() {
  const stations = [
      [-1.55, 1.3, 0.12, 0.09],
      [-1.35, 1.32, 0.38, 0.33],
      [-0.9, 1.34, 0.61, 0.55],
      [-0.25, 1.32, 0.7, 0.65],
      [0.35, 1.28, 0.71, 0.63],
      [0.95, 1.23, 0.66, 0.56],
      [1.45, 1.2, 0.49, 0.43],
      [1.78, 1.18, 0.3, 0.26],
      [1.94, 1.16, 0.03, 0.03],
    ],
    count = 32;
  const vertices: HeliPoint[] = [],
    painted: number[][] = [],
    glass: number[][] = [];
  for (const [x, cy, ry, rz] of stations)
    for (let j = 0; j < count; j++) {
      const a = (j / count) * Math.PI * 2;
      vertices.push([x, cy + ry * Math.cos(a), rz * Math.sin(a)]);
    }
  for (let i = 0; i < stations.length - 1; i++)
    for (let j = 0; j < count; j++) {
      const cosine = Math.cos(((j + 0.5) / count) * Math.PI * 2),
        face = [
          i * count + j,
          i * count + ((j + 1) % count),
          (i + 1) * count + ((j + 1) % count),
          (i + 1) * count + j,
        ],
        window = (i >= 4 && cosine > -0.1) || (i === 3 && cosine > -0.1 && cosine < 0.82);
      (window ? glass : painted).push(face);
    }
  painted.push(
    Array.from({ length: count }, (_, j) => count - j - 1),
    Array.from({ length: count }, (_, j) => (stations.length - 1) * count + j),
  );
  const s: HeliSolid[] = [
    { part: 'cabin', vertices, faces: painted, color: '#b8c6bf', frame: 'fixed' },
    { part: 'canopy', vertices, faces: glass, color: '#244956', frame: 'fixed' },
  ];
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (const f of glass)
    for (let j = 0; j < f.length; j++) {
      const a = f[j],
        b = f[(j + 1) % f.length],
        key = [a, b].sort((x, y) => x - y).join('/'),
        e = edges.get(key);
      if (e) e.count++;
      else edges.set(key, { a, b, count: 1 });
    }
  for (const [key, edge] of edges)
    if (edge.count === 1)
      s.push(
        cylinder(
          `window-rim-${key}`,
          vertices[edge.a],
          vertices[edge.b],
          0.021,
          0.021,
          '#c6d0c6',
          'fixed',
          8,
        ),
      );
  // Windshield mullion follows the loft centerline, with actual pane boundaries.
  for (let i = 4; i < stations.length - 1; i++)
    s.push(
      cylinder(
        `windshield-center-${i}`,
        vertices[i * count],
        vertices[(i + 1) * count],
        0.024,
        0.024,
        '#bac7bd',
        'fixed',
        10,
      ),
    );
  for (const side of [-1, 1]) {
    // Door seam is on the skin below the rear side window; it terminates at its sill.
    const js = side > 0 ? [9, 10, 11, 12, 13] : [23, 22, 21, 20, 19];
    for (let k = 0; k < js.length - 1; k++)
      s.push(
        cylinder(
          `door-seam-${side}-${k}`,
          vertices[3 * count + js[k]],
          vertices[3 * count + js[k + 1]],
          0.007,
          0.007,
          '#59716d',
          'fixed',
          6,
        ),
      );
    s.push(
      cylinder(
        `door-handle-${side}`,
        [-0.1, 1.15, side * 0.633],
        [0.1, 1.15, side * 0.625],
        0.018,
        0.018,
        paint.metal,
      ),
    );
  }
  return s;
}
export function helicopterSolids(): HeliSolid[] {
  const s: HeliSolid[] = [
    ...fuselage(),
    ellipsoid('instrument-panel', [1.23, 1.27, 0], [0.4, 0.1, 0.36], paint.dark, 8, 16),
    ellipsoid('seat-a', [0.35, 1.25, 0.25], [0.28, 0.3, 0.17], paint.dark, 8, 12),
    ellipsoid('seat-b', [0.35, 1.25, -0.25], [0.28, 0.3, 0.17], paint.dark, 8, 12),
    prism(
      'engine-cover',
      [
        [-1.05, 1.95],
        [-0.8, 2.33],
        [0.05, 2.38],
        [0.45, 2.15],
        [0.3, 1.96],
      ],
      0.76,
      '#aebeb6',
    ),
    cylinder('tail-boom', [-0.8, 1.68, 0], [-4.7, 2.03, 0], 0.28, 0.09, paint.shell, 'fixed', 16),
    prism(
      'tail-fin',
      [
        [-4.65, 1.91],
        [-4.94, 2.85],
        [-4.45, 2.72],
        [-4.12, 1.87],
      ],
      0.09,
      paint.stripe,
    ),
    cylinder('mast', [0, 2.04, 0], HELI_ART.mast, 0.075, 0.075, paint.metal),
    {
      ...ellipsoid('teeter-bearing', [0, 0, 0], [0.21, 0.14, 0.16], paint.metal, 10, 16),
      frame: 'hub',
    },
    cylinder('hub', [-0.33, 0, 0], [0.33, 0, 0], 0.085, 0.085, paint.dark, 'hub'),
    cylinder('mast-cap', [0, -0.02, 0], [0, 0.15, 0], 0.15, 0.11, paint.metal, 'hub'),
    cylinder('tail-axle', [-4.7, 2.03, 0], HELI_ART.tail, 0.07, 0.07, paint.dark),
  ];
  for (const side of [-1, 1]) {
    for (let j = 0; j < 6; j++) {
      const x = -0.65 + j * 0.105;
      s.push(
        cylinder(
          `engine-vent-${side}-${j}`,
          [x, 2.1, side * 0.383],
          [x + 0.04, 2.25, side * 0.383],
          0.013,
          0.013,
          paint.dark,
          'fixed',
          6,
        ),
      );
    }
    const z = side * 0.85,
      line: HeliPoint[] = [
        [-1.3, 0.2, z],
        [1.4, 0.2, z],
        [1.65, 0.25, z],
        [1.83, 0.42, z],
      ];
    for (let i = 0; i < line.length - 1; i++)
      s.push(cylinder(`skid-${side}-${i}`, line[i], line[i + 1], 0.045, 0.045, paint.dark));
    for (const x of [-0.7, 0.9])
      s.push(
        cylinder(
          `skid-strut-${side}-${x}`,
          [x, 0.2, z],
          [x - 0.16, 0.93, side * 0.43],
          0.034,
          0.034,
          paint.metal,
        ),
      );
  }
  for (const [frame, color] of [
    ['blade-a', paint.copper],
    ['blade-b', paint.pale],
  ] as const) {
    s.push(
      cylinder(
        `${frame}-grip`,
        [0.22, 0, 0],
        [HELICOPTER.rootRadius + 0.04, 0, 0],
        0.055,
        0.042,
        paint.metal,
        frame,
      ),
    );
    s.push(blade(frame, frame, HELICOPTER.rootRadius, HELICOPTER.radius, HELICOPTER.chord, color));
    s.push(
      blade(
        `${frame}-tip`,
        frame,
        HELICOPTER.radius - 0.2,
        HELICOPTER.radius + 0.001,
        HELICOPTER.chord,
        paint.shell,
      ),
    );
  }
  s.push({
    part: 'blade-section-face',
    vertices: helicopterAirfoil(32).map(
      ([u, v]) =>
        [
          HELICOPTER.radius * 0.75,
          v * HELICOPTER.chord,
          (u - 0.25) * HELICOPTER.chord,
        ] as HeliPoint,
    ),
    faces: [Array.from({ length: 64 }, (_, i) => i)],
    color: '#c3a17b',
    frame: 'blade-a',
  });
  s.push(
    blade('tail-blade-a', 'tail', -0.68, -0.07, 0.12, paint.dark),
    blade('tail-blade-b', 'tail', 0.07, 0.68, 0.12, paint.dark),
  );
  return s;
}
export function helicopterFrame(frame: HeliFrame, visual: HelicopterVisual) {
  const rotor = frame === 'blade-a' || frame === 'blade-b',
    azimuth = visual.phase + (frame === 'blade-b' ? Math.PI : 0),
    pitch = rotor
      ? helicopterRadians(helicopterBladePitch(visual.collectiveDeg, visual.cyclicDeg, azimuth))
      : 0;
  return {
    position:
      frame === 'fixed'
        ? ([0, 0, 0] as HeliPoint)
        : frame === 'tail'
          ? HELI_ART.tail
          : HELI_ART.mast,
    spin:
      frame === 'tail' ? visual.phase * 3.1 : frame === 'hub' ? visual.phase : rotor ? azimuth : 0,
    pitch,
    flap:
      frame === 'fixed' || frame === 'tail'
        ? 0
        : -Math.atan(
            Math.tan(helicopterRadians(visual.diskTiltDeg ?? 0)) *
              Math.cos(frame === 'hub' ? visual.phase : azimuth),
          ),
    tail: frame === 'tail',
  };
}
export function helicopterWorldPoint(
  point: HeliPoint,
  frame: HeliFrame,
  visual: HelicopterVisual,
): HeliPoint {
  const f = helicopterFrame(frame, visual),
    c = Math.cos(f.pitch),
    s = Math.sin(f.pitch),
    pitchedY = point[1] * c - point[2] * s,
    x = point[0] * Math.cos(f.flap) - pitchedY * Math.sin(f.flap),
    y = point[0] * Math.sin(f.flap) + pitchedY * Math.cos(f.flap),
    z = point[1] * s + point[2] * c,
    ca = Math.cos(f.spin),
    sa = Math.sin(f.spin);
  // Tail rotor uses the same airfoil local x/y/z but maps its disk from x/z to x/y.
  const p = f.tail ? [x * ca - z * sa, x * sa + z * ca, y] : [x * ca + z * sa, y, -x * sa + z * ca];
  return p.map((v, i) => v + f.position[i]) as HeliPoint;
}
export function helicopterMeshData(solid: HeliSolid) {
  const positions: number[] = [],
    indices: number[] = [];
  // Separate each face for flat facets, then soften ellipsoid normals in the renderer.
  for (const face of solid.faces) {
    const base = positions.length / 3;
    for (const i of face) positions.push(...solid.vertices[i]);
    for (let i = 1; i < face.length - 1; i++) indices.push(base, base + i, base + i + 1);
  }
  return { positions, indices };
}
