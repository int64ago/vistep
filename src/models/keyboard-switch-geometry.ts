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
};
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
  return loft(id, material, rings, color);
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
  return loft(
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
  );
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
  return solid(id, material, vertices, faces, color);
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
  return solid(id, material, vertices, faces, color);
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

/** Fixed housing section has actual closed cut edges. The missing front wall is
 * a teaching section, never a transparent box through several opaque surfaces. */
function fixedParts(): SwitchSolid[] {
  const a: SwitchSolid[] = [];
  a.push(box('pcb', 'pcb', [21.5, 1.1, 18.6], [0, -0.55, 0], 0.18));
  for (const side of [-1, 1]) {
    a.push(box(`pcb-pad-${side}`, 'gold', [1.6, 0.055, 2.0], [side * 5.2, 0.025, 4.9], 0.03));
    a.push(box(`pcb-trace-${side}`, 'copper', [0.36, 0.045, 4.8], [side * 5.2, 0.04, 7.15], 0.015));
    a.push(
      box(`pcb-trace-turn-${side}`, 'copper', [4.7, 0.045, 0.36], [side * 7.3, 0.04, 8.2], 0.015),
    );
    a.push(box(`housing-side-${side}`, 'base', [1.15, 5.7, 8.6], [side * 6.4, 4.35, -2.7], 0.18));
    a.push(box(`upper-side-${side}`, 'housing', [0.82, 5.1, 7.2], [side * 6.45, 9.45, -3.1], 0.14));
    a.push(
      box(`upper-shoulder-${side}`, 'housing', [4.5, 0.86, 7.4], [side * 4.55, 12.1, -3.05], 0.2),
    );
    a.push(
      box(`upper-latch-${side}`, 'housing', [0.84, 3.35, 1.8], [side * 7.08, 7.4, -3.8], 0.09),
    );
    a.push(box(`latch-hook-${side}`, 'housing', [0.92, 0.6, 2.0], [side * 6.85, 5.7, -3.8], 0.07));
    a.push(box(`mould-seam-${side}`, 'base', [0.1, 0.11, 8.8], [side * 6.99, 5.0, -2.7], 0.02));
    a.push(box(`stem-guide-${side}`, 'base', [0.65, 8.3, 1.25], [side * 3.4, 6.2, -0.9], 0.08));
    a.push(
      box(`spring-guide-rib-${side}`, 'base', [0.55, 1.7, 3.5], [side * 2.8, 2.4, -0.9], 0.08),
    );
  }
  a.push(box('housing-bottom', 'base', [14, 1.45, 14], [0, 0.775, 0], 0.18));
  a.push(box('housing-back', 'base', [12, 5.7, 1.1], [0, 4.35, -6.45], 0.13));
  a.push(box('upper-back', 'housing', [12.8, 5.1, 0.85], [0, 9.45, -6.28], 0.15));
  a.push(box('upper-roof-back', 'housing', [5.3, 0.86, 4.05], [0, 12.1, -4.72], 0.12));
  a.push(box('section-base-lip', 'base', [14, 0.48, 1.0], [0, 1.55, 6.5], 0.1));
  a.push(cylinder('lower-spring-seat', 'base', 2.55, 1.45, 2));
  a.push(cylinder('central-guide-post', 'base', 0.66, 1.55, 5.45));
  // The outer front skin is intentionally absent; these cap-cut faces remain solid.
  a.push(box('contact-terminal-a', 'gold', [0.48, 3.4, 0.68], [5.5, 1.05, 2.1], 0.04));
  a.push(box('contact-terminal-b', 'gold', [0.48, 3.4, 0.68], [3.65, 1.05, 2.1], 0.04));
  return a;
}
const housing = fixedParts();
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
        [3.05, 9.7],
        [3.5, 9.45],
        [4.03, 9.05],
        [3.72, 8.75],
        [3.15, 8.1],
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

export function keyboardSwitchSolids(state: KeyboardSwitchState): SwitchSolid[] {
  const variant = state.variant,
    color = switchStemColor(variant),
    dy = state.stemOffsetMm,
    a = housing.map((s) => ({ ...s }));
  const moving: SwitchSolid[] = [];
  // Sliding stem has side runners and a hollow lower spring-centering cylinder.
  moving.push(box('stem-central', 'stem', [4.8, 1.2, 4.35], [0, 11.75, -0.1], 0.16, color));
  // The spring enters a real hollow skirt below the solid cross-stem crown.
  // Its final coils do not disappear into a solid rectangular block.
  for (const side of [-1, 1])
    moving.push(
      box(
        `stem-cavity-wall-${side}`,
        'stem',
        [0.35, 2.1, 4.35],
        [side * 2.225, 10.1, -0.1],
        0.06,
        color,
      ),
    );
  moving.push(box('stem-cavity-back', 'stem', [4.1, 2.1, 0.25], [0, 10.1, -2.15], 0.055, color));
  for (const side of [-1, 1])
    moving.push(
      box(
        `stem-runner-${side}`,
        'stem',
        [0.75, 4.05, 1.05],
        [side * 2.65, 10.65, -0.85],
        0.08,
        color,
      ),
    );
  moving.push(ring('upper-spring-seat', 'stem', 2.45, 0.96, 10.75, 11.15, color));
  moving.push(box('mx-cross-x', 'stem', [4.25, 3.0, 1.28], [0, 13.8, 0], 0.09, color));
  moving.push(box('mx-cross-z', 'stem', [1.28, 3.0, 4.25], [0, 13.8, 0], 0.09, color));
  // A thick-walled keycap section connected around the rear half of the cross.
  moving.push(
    loft('keycap-crown', 'cap', [
      corners(16.9, 7.95, 17.75, 0.65, [0, 0, -4.48]),
      corners(16.45, 7.8, 18.65, 0.72, [0, 0, -4.48]),
      corners(15.2, 7.2, 19.0, 0.8, [0, 0, -4.48]),
    ]),
  );
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
  for (const side of [-1, 1])
    moving.push(
      prism(
        `keycap-skirt-${side}`,
        'cap',
        [
          [side * 8.3, 17.9],
          [side * 8.35, 14.7],
          [side * 7.25, 14.8],
          [side * 7.25, 18.2],
        ],
        -4.55,
        7.7,
      ),
    );
  moving.push(box('keycap-rear-skirt', 'cap', [16.2, 3.1, 1.0], [0, 16.35, -8.08], 0.2));

  // A shaped TLS leg remains attached to the slider. Brown's rounded bump is a
  // visible local feature, not a color-only version of the straight linear leg.
  const ramp = keyboardSwitchCamProfile(state);
  if (state.contact.present && !state.click.present)
    moving.push(prism('tls-stem-leg', 'stem', ramp, 1.75, 0.9, color));
  a.push(...moving.map((s) => translate(s, dy)));
  const springTop = state.springTop[1],
    springBottom = state.springBottom[1];
  const springPath = Array.from({ length: 151 }, (_, i) => {
    const p = i / 150,
      angle = p * Math.PI * 2 * 6.25;
    return point(
      Math.cos(angle) * 1.78,
      springBottom + p * (springTop - springBottom),
      Math.sin(angle) * 1.78,
    );
  });
  a.push(tube('return-spring', 'steel', springPath, 0.18, 8));

  if (state.contact.present) {
    const x = SWITCH_GEOMETRY.contactX - state.contact.gapMm;
    // Two gold crosspoint tips meet geometrically at the modeled gap. Neither
    // contact position nor electrical state is inferred again in this renderer.
    a.push(
      ribbon(
        'fixed-contact-leaf',
        [
          [5.5, 1.45, 2.1],
          [5.5, 3.5, 2.1],
          [5.48, 5.75, 2.1],
          [5.35 + 0.13, 6.7, 2.1],
        ],
        1.05,
        0.18,
      ),
    );
    a.push(
      ribbon(
        'moving-contact-leaf',
        [
          [3.65, 1.45, 2.1],
          [3.72, 3.0, 2.1],
          [4.18, 4.7, 2.1],
          [x - 0.25, 6.1, 2.1],
          [x - 0.13, 6.7, 2.1],
        ],
        0.9,
        0.16,
      ),
    );
    a.push(box('fixed-crosspoint', 'gold', [0.26, 0.48, 0.24], [5.48, 6.7, 2.1], 0.06));
    a.push(box('moving-crosspoint', 'gold', [0.26, 0.24, 0.56], [x - 0.13, 6.7, 2.1], 0.04));
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
      const guide = a.find((p) => p.id === `stem-guide-${side}`)!;
      guide.vertices = guide.vertices.map((p) => [p[0] + side * 1.15, p[1], p[2]]);
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
        box(
          `click-jacket-side-${side}`,
          'cap',
          [0.72, 2.45, 4.7],
          [side * 3.45, 9.1, 0.1],
          0.12,
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
      const guide = a.find((p) => p.id === `stem-guide-${side}`)!;
      guide.vertices = guide.vertices.map((p) => [p[0] + side, p[1], p[2]]);
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
      (chapter === 7 ? [10, 3.5, 7] : detail ? [2.7, 1.6, 11] : [6.2, 4.7, 12]) as SwitchPoint,
    ),
    detail,
    narrow,
  };
}
