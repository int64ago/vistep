import { landmineWeather } from './landmine';
import {
  LANDMINE_SHELL_PROFILE,
  LANDMINE_COVER_PROFILE,
  LANDMINE_HANDLE,
  LANDMINE_GROUND as G,
  landmineProfilePoint,
  landmineSurface,
  landmineCut,
  landmineNoise,
  landmineDirt,
  LANDMINE_DIRT_COUNT,
  landminePlant,
  type LandminePoint,
} from './landmine-geometry';
export type LandminePath = {
  d: string;
  fill: string;
  stroke?: string;
  width?: number;
  opacity?: number;
  part: string;
};
type Face = LandminePath & { depth: number };
function shade(base: [number, number, number], light: number) {
  return `rgb(${base.map((n) => Math.round(Math.max(0, Math.min(255, n * light)))).join(',')})`;
}
/** Shared external mesh profiles drive the WebGL view and this original projected
 * artwork. Projection has display units only and shows no internal construction. */
export function landmineExteriorArt(
  width: number,
  height: number,
  reveal = 1,
  season = 0.12,
  closeup = 0,
) {
  const scale = Math.min(width / (7.0 - 3.9 * closeup), height / (4.9 - 2.5 * closeup));
  const target = 0.7 + closeup * 0.06;
  const project = ([x, y, z]: LandminePoint) => [
    width / 2 + (x * 0.86 - z * 0.51) * scale,
    height * 0.5 - ((y - target) * 0.85 - x * 0.275 - z * 0.46) * scale,
  ];
  const depth = ([x, y, z]: LandminePoint) => x * 0.435 + y * 0.54 + z * 0.72;
  const faces: Face[] = [];
  const add = (
    points: LandminePoint[],
    fill: string,
    part: string,
    stroke?: string,
    weight?: number,
    closed = true,
    opacity = 1,
  ) =>
    faces.push({
      d:
        points
          .map(
            (p, i) =>
              `${i ? 'L' : 'M'}${project(p)
                .map((n) => n.toFixed(2))
                .join(',')}`,
          )
          .join(' ') + (closed ? 'Z' : ''),
      fill,
      stroke: stroke ?? (closed ? fill : undefined),
      width: weight ?? (closed ? 0.9 : undefined),
      part,
      opacity,
      depth: part.startsWith('contact-soil')
        ? -1e6
        : points.reduce((sum, p) => sum + depth(p), 0) / points.length,
    });
  const cut = landmineCut(reveal);
  if (closeup < 0.985) {
    const W = G.halfWidth;
    const support = LANDMINE_SHELL_PROFILE[0][1];
    add(
      [
        [-W, support, G.back],
        [W, support, G.back],
        [W, support, G.front],
        [-W, support, G.front],
      ],
      '#89714e',
      'contact-soil-layer',
    );
    add(
      [
        [-W, 0, G.front],
        [W, 0, G.front],
        [W, support, G.front],
        [-W, support, G.front],
      ],
      '#7c6444',
      'contact-soil-front',
    );
    add(
      [
        [W, 0, G.back],
        [W, 0, G.front],
        [W, support, G.front],
        [W, support, G.back],
      ],
      '#796444',
      'contact-soil-side',
    );
    for (let i = 0; i < 28; i++)
      for (let j = 0; j < 7; j++) {
        const x0 = -W + (i / 28) * W * 2,
          x1 = -W + ((i + 1) / 28) * W * 2,
          z0 = G.back + (j / 7) * (cut - G.back),
          z1 = G.back + ((j + 1) / 7) * (cut - G.back);
        const color = shade([125, 113, 81], 0.92 + landmineNoise(i, j) * 0.08);
        add(
          [
            [x0, landmineSurface(x0, z0), z0],
            [x1, landmineSurface(x1, z0), z0],
            [x1, landmineSurface(x1, z1), z1],
            [x0, landmineSurface(x0, z1), z1],
          ],
          color,
          'soil-top',
        );
      }
    for (let i = 0; i < 28; i++)
      for (let j = 0; j < 10; j++) {
        const x0 = -W + (i / 28) * W * 2,
          x1 = -W + ((i + 1) / 28) * W * 2,
          lo = j / 10,
          hi = (j + 1) / 10;
        add(
          [
            [x0, lo * landmineSurface(x0, cut), cut],
            [x1, lo * landmineSurface(x1, cut), cut],
            [x1, hi * landmineSurface(x1, cut), cut],
            [x0, hi * landmineSurface(x0, cut), cut],
          ],
          shade([139, 107, 69], 0.86 + landmineNoise(i, j, 3) * 0.035 + j * 0.009),
          'soil-cut',
        );
      }
    add(
      [
        [W, 0, G.back],
        [W, 0, cut],
        [W, landmineSurface(W, cut), cut],
        [W, landmineSurface(W, G.back), G.back],
      ],
      '#88704c',
      'soil-side',
    );
    const coverState = landmineWeather(season),
      growth = coverState.grass;
    for (let i = 0; i < 190; i++) {
      const p = landminePlant(i);
      if (p.z > cut) continue;
      for (let j = 0; j < 2; j++)
        add(
          [
            [p.x, p.y, p.z],
            [p.x + (j ? 0.025 : -0.025), p.y + p.height * growth * 0.55, p.z],
            [p.x + (j ? 0.07 : -0.08), p.y + p.height * growth, p.z + 0.04],
          ],
          'none',
          'grass',
          '#657048',
          0.8,
          false,
        );
    }
    for (let i = 0; i < 95; i++) {
      const p = landminePlant(i + 1200),
        s = coverState.leafSize,
        c = Math.cos(p.angle),
        a = Math.sin(p.angle);
      const leaf: LandminePoint[] = Array.from({ length: 12 }, (_, j) => {
        const q = (j / 12) * Math.PI * 2,
          dx = Math.cos(q) * s,
          dz = Math.sin(q) * s * 0.46;
        return [p.x + c * dx + a * dz, p.y + 0.02, p.z - a * dx + c * dz];
      });
      // Use the same observation cut as the 3D material, including leaves that
      // straddle it; do not make a half-visible leaf disappear as a whole.
      const clipped: LandminePoint[] = [];
      for (let j = 0; j < leaf.length; j++) {
        const u = leaf[j],
          v = leaf[(j + 1) % leaf.length],
          inside = u[2] <= cut,
          nextInside = v[2] <= cut;
        if (inside) clipped.push(u);
        if (inside !== nextInside) {
          const q = (cut - u[2]) / (v[2] - u[2]);
          clipped.push([u[0] + q * (v[0] - u[0]), u[1] + q * (v[1] - u[1]), cut]);
        }
      }
      if (clipped.length >= 3) add(clipped, '#8c663a', `leaf-litter-${i}`);
    }
  }
  if (closeup >= 0.985 || cut < Math.max(...LANDMINE_SHELL_PROFILE.map((p) => p[0]))) {
    for (const [name, profile] of [
      ['shell', LANDMINE_SHELL_PROFILE],
      ['cover', LANDMINE_COVER_PROFILE],
    ] as const) {
      for (let i = 0; i < profile.length - 1; i++)
        for (let j = 0; j < 80; j++) {
          const a = (j / 80) * Math.PI * 2,
            b = ((j + 1) / 80) * Math.PI * 2,
            [r0, y0] = profile[i],
            [r1, y1] = profile[i + 1];
          const dr = r1 - r0,
            dy = y1 - y0,
            n = Math.hypot(dr, dy) || 1;
          const lit = Math.max(
            0.37,
            0.7 + (((0.45 * Math.cos(a) + 0.65 * Math.sin(a)) * dy) / n) * 0.24 - (dr / n) * 0.2,
          );
          const rust = landmineNoise(i, j, 3) > 0.985;
          add(
            [
              landmineProfilePoint(r0, y0, a),
              landmineProfilePoint(r0, y0, b),
              landmineProfilePoint(r1, y1, b),
              landmineProfilePoint(r1, y1, a),
            ],
            shade(rust ? [108, 103, 65] : [124, 129, 83], lit),
            `exterior-${name}`,
          );
        }
    }
    for (let i = 0; i < LANDMINE_DIRT_COUNT; i++) {
      const d = landmineDirt(i),
        ring: LandminePoint[] = Array.from({ length: 12 }, (_, j) => {
          const q = (j / 12) * Math.PI * 2;
          return d.position.map(
            (n, k) =>
              n +
              d.normal[k] * d.size[1] +
              d.radial[k] * Math.cos(q) * d.size[0] +
              d.lateral[k] * Math.sin(q) * d.size[2],
          ) as LandminePoint;
        });
      add(ring, '#786748', `shell-soil-trace-${i}`, undefined, 0.25);
    }
    add([...LANDMINE_HANDLE], 'none', 'carry-handle', '#605d3f', Math.max(1, scale * 0.045), false);
    for (const z of [-0.27, 0.33])
      add(
        [
          [-1.03, 0.59, z],
          [-1.1, 0.59, z],
          [-1.1, 0.69, z],
          [-1.03, 0.69, z],
        ],
        '#5f603e',
        'handle-lug',
      );
  }
  faces.sort((a, b) => a.depth - b.depth);
  return {
    width,
    height,
    paths: faces.map(({ depth: _, ...path }) => path),
    object: { x: width / 2, y: height * 0.5, size: scale * 1.11 },
  };
}
export function landmineCover() {
  return landmineExteriorArt(400, 230, 1, 0.3, 0);
}
