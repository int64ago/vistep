import {
  IC,
  IC_CAMERA_GEOMETRY as hardware,
  IC_FEED_MAX,
  icChemistry,
  icFeed,
  icPaperPoint,
  icSubject,
} from './instant-camera';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export type IcArtworkPoint = readonly [number, number, number];
export type IcArtworkPath = {
  d: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  part: string;
  points: readonly IcArtworkPoint[];
};
const unit = (v: IcArtworkPoint): IcArtworkPoint => {
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
};
const dot = (a: IcArtworkPoint, b: IcArtworkPoint) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: IcArtworkPoint, b: IcArtworkPoint): IcArtworkPoint => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const eye = unit([4, 8, 10]),
  right = unit(cross([0, 1, 0], eye)),
  up = cross(eye, right);
const light = unit([-3, 9, 5]);
function convexHull(input: IcArtworkPoint[]) {
  const points = input
    .map((p) => ({ p, at: instantCameraCoverProject(p) }))
    .sort((a, b) => a.at[0] - b.at[0] || a.at[1] - b.at[1]);
  const turn = (
    a: (typeof points)[number],
    b: (typeof points)[number],
    c: (typeof points)[number],
  ) => (b.at[0] - a.at[0]) * (c.at[1] - a.at[1]) - (b.at[1] - a.at[1]) * (c.at[0] - a.at[0]);
  const lower: typeof points = [],
    upper: typeof points = [];
  for (const p of points) {
    while (lower.length > 1 && turn(lower.at(-2)!, lower.at(-1)!, p) <= 1e-8) lower.pop();
    lower.push(p);
  }
  for (const p of [...points].reverse()) {
    while (upper.length > 1 && turn(upper.at(-2)!, upper.at(-1)!, p) <= 1e-8) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)].map(({ p }) => p);
}
export const IC_COVER_FEED = IC_FEED_MAX - 12;
/** A positive-x lens view with a higher eye exposing the attached mirror. All surfaces use one orthographic camera,
 * with the open near side exposing the mirror support and the hollow lens mount.
 * The finished image is still held at its final border by the model's driven nip. */
export function instantCameraCoverProject(p: IcArtworkPoint) {
  const at: IcArtworkPoint = [p[0] + 70, p[1] - 65, p[2]];
  return [185 + 0.95 * dot(at, right), 110 - 0.95 * dot(at, up)];
}
type CoverFace = IcArtworkPath & { order: number; normal: IcArtworkPoint };
/** Vector BSP: a polygon crossing another physical face is split at that
 * face's plane. Traversal from the fixed eye gives a valid painter order;
 * a long sheet cannot be ordered by its centre and cover a nearer nip. */
function orderCoverFaces(input: CoverFace[]): CoverFace[] {
  if (!input.length) return [];
  const paperTop = input.findIndex(
    (f) =>
      f.part === 'transported-sheet' &&
      f.points.every((p) => Math.abs(p[1] - IC.plane - IC.thickness / 2) < 1e-5),
  );
  const pivot = input[paperTop < 0 ? 0 : paperTop];
  const a = pivot.points[0],
    n = pivot.normal;
  const offset = dot(n, a),
    epsilon = 0.0001;
  const back: CoverFace[] = [],
    front: CoverFace[] = [],
    coplanar: CoverFace[] = [];
  const rebuild = (face: CoverFace, points: IcArtworkPoint[]): CoverFace => ({
    ...face,
    points,
    d:
      points
        .map(
          (p, i) =>
            `${i ? 'L' : 'M'}${instantCameraCoverProject(p)
              .map((v) => Number(v.toFixed(3)))
              .join(',')}`,
        )
        .join(' ') + 'Z',
  });
  for (const face of input) {
    if (face === pivot) {
      coplanar.push(face);
      continue;
    }
    const distances = face.points.map((p) => dot(n, p) - offset);
    const positive = distances.some((d) => d > epsilon),
      negative = distances.some((d) => d < -epsilon);
    if (!positive && !negative) {
      coplanar.push(face);
      continue;
    }
    if (!negative) {
      front.push(face);
      continue;
    }
    if (!positive) {
      back.push(face);
      continue;
    }
    const before: IcArtworkPoint[] = [],
      after: IcArtworkPoint[] = [];
    for (let i = 0; i < face.points.length; i++) {
      const p = face.points[i],
        q = face.points[(i + 1) % face.points.length];
      const d = distances[i],
        e = distances[(i + 1) % distances.length];
      if (d <= epsilon) before.push(p);
      if (d >= -epsilon) after.push(p);
      if ((d > epsilon && e < -epsilon) || (d < -epsilon && e > epsilon)) {
        const t = d / (d - e);
        const intersection: IcArtworkPoint = [
          p[0] + (q[0] - p[0]) * t,
          p[1] + (q[1] - p[1]) * t,
          p[2] + (q[2] - p[2]) * t,
        ];
        before.push(intersection);
        after.push(intersection);
      }
    }
    if (before.length >= 3) back.push(rebuild(face, before));
    if (after.length >= 3) front.push(rebuild(face, after));
  }
  coplanar.sort((a, b) => a.order - b.order);
  const far = dot(n, eye) > 0 ? back : front,
    near = dot(n, eye) > 0 ? front : back;
  return [...orderCoverFaces(far), ...coplanar, ...orderCoverFaces(near)];
}
let cached: IcArtworkPath[] | undefined;
export function instantCameraCover() {
  if (cached) return cached;
  const f = icFeed(IC_COVER_FEED);
  const faces: CoverFace[] = [];
  const sections = new Map<string, { points: IcArtworkPoint[]; color: string }>();
  function face(
    points: IcArtworkPoint[],
    normal: IcArtworkPoint,
    color: string,
    part: string,
    opacity = 1,
    illuminate = true,
  ) {
    // A genuine z=0 local cut removes the near front frame, lower near rail
    // and bearing bracket. The far bracket still supports both roller axles.
    // Every retained rounded surface is clipped, and its exposed edge capped.
    if (
      part.startsWith('front-frame-') ||
      ['body-3', 'roller-bracket-1', 'bearing-1-0', 'bearing-1-1'].includes(part)
    ) {
      const clipped: IcArtworkPoint[] = [];
      const section = sections.get(part) ?? { points: [], color };
      for (let i = 0; i < points.length; i++) {
        const p = points[i],
          q = points[(i + 1) % points.length];
        if (p[2] <= 0) clipped.push(p);
        if ((p[2] < 0 && q[2] > 0) || (p[2] > 0 && q[2] < 0)) {
          const t = p[2] / (p[2] - q[2]);
          const at: IcArtworkPoint = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, 0];
          clipped.push(at);
          section.points.push(at);
        }
      }
      sections.set(part, section);
      points = clipped;
    }
    if (points.length < 3) return;
    if (dot(normal, eye) <= 1e-8) return;
    const shade = illuminate ? 0.78 + 0.23 * Math.max(0, dot(normal, light)) : 1;
    const fill = illuminate
      ? '#' +
        color
          .slice(1)
          .match(/../g)!
          .map((v) =>
            Math.round(Math.min(255, parseInt(v, 16) * shade))
              .toString(16)
              .padStart(2, '0'),
          )
          .join('')
      : color;
    faces.push({
      d:
        points
          .map(
            (p, i) =>
              `${i ? 'L' : 'M'}${instantCameraCoverProject(p)
                .map((v) => Number(v.toFixed(3)))
                .join(',')}`,
          )
          .join(' ') + 'Z',
      fill,
      // Matching subpixel edge coverage closes raster antialiasing seams
      // between coplanar SVG fragments; it does not draw a scientific edge.
      stroke: opacity === 1 ? fill : undefined,
      strokeWidth: 0.35,
      opacity,
      part,
      points,
      order: faces.length,
      // Keep the actual polygon plane through later splits. Lighting normals
      // on a sampled frustum describe the curved surface, not its flat facet.
      normal: unit(
        cross(
          [points[1][0] - points[0][0], points[1][1] - points[0][1], points[1][2] - points[0][2]],
          [points[2][0] - points[0][0], points[2][1] - points[0][1], points[2][2] - points[0][2]],
        ),
      ),
    });
  }
  function solid(
    size: readonly number[],
    at: readonly number[],
    color: string,
    part: string,
    rotation = 0,
    radius = 0,
  ) {
    const [w, h, d] = size.map((v) => v / 2);
    const transform = ([x, y, z]: IcArtworkPoint): IcArtworkPoint => [
      at[0] + Math.cos(rotation) * x - Math.sin(rotation) * y,
      at[1] + Math.sin(rotation) * x + Math.cos(rotation) * y,
      at[2] + z,
    ];
    const normal = ([x, y, z]: IcArtworkPoint): IcArtworkPoint => [
      Math.cos(rotation) * x - Math.sin(rotation) * y,
      Math.sin(rotation) * x + Math.cos(rotation) * y,
      z,
    ];
    if (radius) {
      // Same bevel geometry as Three. Merge coplanar triangles into convex
      // faces, keeping the native SVG lightweight and its edges soft.
      const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 1, radius);
      const positions = geometry.getAttribute('position'),
        index = geometry.getIndex();
      const groups = new Map<string, { points: IcArtworkPoint[]; normal: IcArtworkPoint }>();
      const count = index?.count ?? positions.count;
      for (let i = 0; i < count; i += 3) {
        const points = [0, 1, 2].map((j): IcArtworkPoint => {
          const at = index ? index.getX(i + j) : i + j;
          return transform([positions.getX(at), positions.getY(at), positions.getZ(at)]);
        });
        const a = points[0],
          b = points[1],
          c = points[2];
        const n = unit(
          cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]),
        );
        const key = [...n.map((v) => v.toFixed(4)), dot(n, a).toFixed(3)].join(':');
        const group = groups.get(key) ?? { points: [], normal: n };
        group.points.push(...points);
        groups.set(key, group);
      }
      for (const group of groups.values()) {
        const hull = convexHull(group.points);
        if (hull.length >= 3) face(hull, group.normal, color, part);
      }
      geometry.dispose();
      return;
    }
    for (const [points, n] of [
      [
        [
          [w, -h, -d],
          [w, h, -d],
          [w, h, d],
          [w, -h, d],
        ],
        [1, 0, 0],
      ],
      [
        [
          [-w, -h, d],
          [-w, h, d],
          [-w, h, -d],
          [-w, -h, -d],
        ],
        [-1, 0, 0],
      ],
      [
        [
          [-w, h, d],
          [w, h, d],
          [w, h, -d],
          [-w, h, -d],
        ],
        [0, 1, 0],
      ],
      [
        [
          [-w, -h, -d],
          [w, -h, -d],
          [w, -h, d],
          [-w, -h, d],
        ],
        [0, -1, 0],
      ],
      [
        [
          [-w, -h, d],
          [w, -h, d],
          [w, h, d],
          [-w, h, d],
        ],
        [0, 0, 1],
      ],
      [
        [
          [-w, -h, -d],
          [-w, h, -d],
          [w, h, -d],
          [w, -h, -d],
        ],
        [0, 0, -1],
      ],
    ] as [IcArtworkPoint[], IcArtworkPoint][])
      face(points.map(transform), normal(n), color, part);
  }
  function halfTube(
    x: number,
    inner: number,
    outer: number,
    length: number,
    color: string,
    part: string,
  ) {
    const a = x - length / 2,
      b = x + length / 2;
    const point = (at: number, r: number, angle: number): IcArtworkPoint => [
      at,
      IC.lens.y + r * Math.cos(angle),
      -r * Math.sin(angle),
    ];
    for (let i = 0; i < 12; i++) {
      const p = (i * Math.PI) / 12,
        q = ((i + 1) * Math.PI) / 12,
        m = (p + q) / 2;
      face(
        [point(a, outer, p), point(b, outer, p), point(b, outer, q), point(a, outer, q)],
        [0, Math.cos(m), -Math.sin(m)],
        color,
        part + '-outer',
      );
      face(
        [point(a, inner, p), point(a, inner, q), point(b, inner, q), point(b, inner, p)],
        [0, -Math.cos(m), Math.sin(m)],
        color,
        part + '-inner',
      );
      for (const [at, direction] of [
        [a, -1],
        [b, 1],
      ])
        face(
          [point(at, inner, p), point(at, outer, p), point(at, outer, q), point(at, inner, q)],
          [direction, 0, 0],
          color,
          part + '-end',
        );
    }
    for (const sign of [-1, 1])
      face(
        [
          [a, IC.lens.y + sign * inner, 0],
          [b, IC.lens.y + sign * inner, 0],
          [b, IC.lens.y + sign * outer, 0],
          [a, IC.lens.y + sign * outer, 0],
        ],
        [0, 0, 1],
        color,
        part + '-cut',
      );
  }
  function cylinder(
    x: number,
    y: number,
    radius: number,
    length: number,
    color: string,
    part: string,
    z = 0,
  ) {
    const point = (a: number, at: number): IcArtworkPoint => [
      x + radius * Math.cos(a),
      y + radius * Math.sin(a),
      at,
    ];
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12,
        b = ((i + 1) * Math.PI) / 12,
        m = (a + b) / 2;
      face(
        [
          point(a, z - length / 2),
          point(b, z - length / 2),
          point(b, z + length / 2),
          point(a, z + length / 2),
        ],
        [Math.cos(m), Math.sin(m), 0],
        color,
        part + '-wall',
      );
    }
    face(
      Array.from({ length: 24 }, (_, i) => point((i * Math.PI) / 12, z + length / 2)),
      [0, 0, 1],
      color,
      part + '-end',
    );
  }
  hardware.shell.forEach((box, i) =>
    solid(box.size, box.at, '#e2d8c0', `body-${i}`, 0, box.radius),
  );
  hardware.frontFrame.forEach((box, i) =>
    solid(box.size, box.at, '#e2d8c0', `front-frame-${i}`, 0, box.radius),
  );
  solid(
    hardware.cassette.size,
    hardware.cassette.at,
    '#30403a',
    'cassette',
    0,
    hardware.cassette.radius,
  );
  for (let i = 0; i < 4; i++)
    solid(
      [IC.length, 0.45, IC.width],
      [IC.initialLead - IC.length / 2, IC.plane - 1.2 - i * 0.6, 0],
      '#f6efdd',
      `stack-${i}`,
    );
  solid(
    hardware.mirrorSupport.size,
    hardware.mirrorSupport.at,
    '#30403a',
    'mirror-support',
    0,
    hardware.mirrorSupport.radius,
  );
  solid(hardware.mirrorSize, [IC.mirror.x, IC.mirror.y, 0], '#adc5bb', 'mirror', Math.PI / 4);
  halfTube(
    hardware.mount.x,
    hardware.mount.innerRadius,
    hardware.mount.outerRadius,
    hardware.mount.length,
    '#dacbb1',
    'lens-mount',
  );
  hardware.barrels.forEach((b, i) =>
    halfTube(b.x, b.radius - hardware.wallThickness, b.radius, b.length, '#30403a', `barrel-${i}`),
  );
  const glassX = hardware.lens.x + hardware.lens.length / 2;
  const backX = hardware.lens.x - hardware.lens.length / 2;
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12,
      b = ((i + 1) * Math.PI) / 12,
      m = (a + b) / 2;
    face(
      [
        [
          backX,
          IC.lens.y + hardware.lens.backRadius * Math.cos(a),
          hardware.lens.backRadius * Math.sin(a),
        ],
        [
          glassX,
          IC.lens.y + hardware.lens.frontRadius * Math.cos(a),
          hardware.lens.frontRadius * Math.sin(a),
        ],
        [
          glassX,
          IC.lens.y + hardware.lens.frontRadius * Math.cos(b),
          hardware.lens.frontRadius * Math.sin(b),
        ],
        [
          backX,
          IC.lens.y + hardware.lens.backRadius * Math.cos(b),
          hardware.lens.backRadius * Math.sin(b),
        ],
      ],
      unit([
        (hardware.lens.backRadius - hardware.lens.frontRadius) / hardware.lens.length,
        Math.cos(m),
        Math.sin(m),
      ]),
      '#adcfc8',
      'lens-glass-wall',
      0.25,
    );
  }
  face(
    Array.from({ length: 24 }, (_, i): IcArtworkPoint => [
      glassX,
      IC.lens.y + hardware.lens.frontRadius * Math.cos((i * Math.PI) / 12),
      hardware.lens.frontRadius * Math.sin((i * Math.PI) / 12),
    ]),
    [1, 0, 0],
    '#adcfc8',
    'lens-glass',
    0.62,
  );
  solid(
    [IC.length, IC.thickness, IC.width],
    [f.lead - IC.length / 2, IC.plane, 0],
    '#fff6df',
    'transported-sheet',
  );
  const n = 18,
    margin = (IC.width - IC.imageWidth) / 2;
  for (let row = 0; row < n; row++)
    for (let col = 0; col < n; col++) {
      const color = icChemistry(900, icSubject((col + 0.5) / n, (row + 0.5) / n)).rgb;
      const rgb = `rgb(${color.map((v) => Math.round(v * 255)).join(',')})`;
      const ua = IC.imageStart + (1 - (row + 1) / n) * IC.imageLength,
        ub = ua + IC.imageLength / n;
      const va = margin + (col * IC.imageWidth) / n,
        vb = va + IC.imageWidth / n;
      face(
        [
          [ua, va],
          [ua, vb],
          [ub, vb],
          [ub, va],
        ].map(([u, v]): IcArtworkPoint => {
          const p = icPaperPoint(IC_COVER_FEED, u, v);
          return [p.x, p.y + IC.thickness / 2, p.z];
        }),
        [0, 1, 0],
        rgb,
        'image',
        1,
        false,
      );
    }
  for (const [i, c] of [f.bottomCenter, f.topCenter].entries()) {
    cylinder(
      c.x,
      c.y,
      IC.rollerRadius,
      IC.width + hardware.rollerExtraWidth,
      '#b6bcb0',
      `roller-${i}`,
    );
    cylinder(
      c.x,
      c.y,
      hardware.axleRadius,
      IC.width + hardware.axleExtraWidth,
      '#bda574',
      `axle-${i}`,
    );
  }
  for (const [i, b] of hardware.rollerBrackets.entries()) {
    solid(b.size, b.at, '#30403a', `roller-bracket-${i}`, 0, b.radius);
    for (const [j, c] of [f.bottomCenter, f.topCenter].entries())
      solid(
        [7.5, 7.5, 8.5],
        [0, c.y, b.at[2] + Math.sign(b.at[2])],
        '#b6bcb0',
        `bearing-${i}-${j}`,
      );
  }
  cylinder(0, f.bottomCenter.y, 5, 14.5, '#30403a', 'roller-drive', -61.5);
  for (const [part, section] of sections) {
    const cap = convexHull(section.points);
    if (cap.length >= 3)
      face(cap, [0, 0, 1], section.color, part.replace('front-frame-', 'frame-cut-') + '-section');
  }
  cached = orderCoverFaces(faces).map(({ order: _order, normal: _normal, ...path }) => path);
  return cached;
}
