import {
  helicopterSolids,
  helicopterWorldPoint,
  HELI_ART,
  type HelicopterVisual,
  type HeliPoint,
} from './helicopter-geometry';
import { HELICOPTER_HOVER_PITCH, helicopterSolve, helicopterElement } from './helicopter';
const cross = (a: number[], b: number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  unit = (v: number[]) => {
    const l = Math.hypot(...v);
    return v.map((x) => x / (l || 1));
  },
  dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0),
  rotate = (p: number[], a: number) => [
    p[0] * Math.cos(a) + p[2] * Math.sin(a),
    p[1],
    -p[0] * Math.sin(a) + p[2] * Math.cos(a),
  ];
export const HELICOPTER_COVER_VISUAL: HelicopterVisual = {
  phase: 0.48,
  collectiveDeg: HELICOPTER_HOVER_PITCH,
  cyclicDeg: 0,
  tailBalance: 1,
  torque: false,
};
const solids = helicopterSolids();
function clippedFace(points: HeliPoint[], radius: number) {
  const output: HeliPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      ai = a[0] <= radius,
      bi = b[0] <= radius;
    if (ai) output.push(a);
    if (ai !== bi) {
      const f = (radius - a[0]) / (b[0] - a[0]);
      output.push(a.map((v, j) => v + f * (b[j] - v)) as HeliPoint);
    }
  }
  return output;
}
/** Actual shared aircraft surfaces, including matching real blade close-ups.
 * Ordinary views use a fixed swept envelope. The exported cover has its own fit. */
export function helicopterArtwork(
  width: number,
  height: number,
  visual = HELICOPTER_COVER_VISUAL,
  cover = false,
) {
  const section = visual.view === 'section',
    collective = visual.view === 'collective',
    cyclic = visual.view === 'cyclic',
    closeup = section || collective || cyclic,
    spin = collective ? 0 : visual.phase,
    radius = section ? 3.375 : collective ? 0 : 0.4,
    origin: HeliPoint = closeup
      ? [radius * Math.cos(spin), HELI_ART.mast[1], -radius * Math.sin(spin)]
      : [0, 0, 0],
    eye = unit(
      closeup
        ? rotate(section ? [2.5, 0.32, 1.5] : collective ? [2.5, 2.4, 8] : [0.3, 0.85, 3], spin)
        : [4.8, 4.5, 12],
    ),
    right = unit(cross([0, 1, 0], eye)),
    up = unit(cross(eye, right)),
    project = (p: HeliPoint) => {
      const v = p.map((x, i) => x - origin[i]);
      return [dot(v, right), dot(v, up), dot(v, eye)];
    },
    active = solids.filter((s) => s.part !== 'blade-section-face' || section),
    world = active.map((s) => ({
      ...s,
      points: s.vertices.map((p) => project(helicopterWorldPoint(p, s.frame, visual))),
    })),
    all = solids.flatMap((s) =>
      s.frame === 'fixed'
        ? s.vertices.map(project)
        : Array.from({ length: 96 }, (_, i) => {
            const angle = (i * Math.PI * 2) / 96,
              flapHeight = cover ? 0.09 : 2.02;
            return project(
              s.frame === 'tail'
                ? [-4.7 + 0.7 * Math.cos(angle), 2.03 + 0.7 * Math.sin(angle), 0.25]
                : [
                    4.54 * Math.cos(angle),
                    HELI_ART.mast[1] + (i % 2 ? flapHeight : -flapHeight),
                    4.54 * Math.sin(angle),
                  ],
            );
          }),
    ),
    xs = all.map((p) => p[0]),
    ys = all.map((p) => p[1]),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    span = section ? 0.67 : collective ? 2.9 : 1.8,
    frameHeight = section ? 0.48 : collective ? 1.45 : 1.08,
    scale = closeup
      ? Math.min((width - 20) / span, (height - 20) / frameHeight)
      : Math.min((width - 34) / (maxX - minX), (height - 28) / (maxY - minY)),
    cx = closeup ? 0 : (minX + maxX) / 2,
    cy = closeup ? 0 : (minY + maxY) / 2,
    pixel = (p: number[]) =>
      [width / 2 + (p[0] - cx) * scale, height / 2 - (p[1] - cy) * scale] as [number, number],
    place = (p: number[]) =>
      pixel(p)
        .map((v) => v.toFixed(2))
        .join(','),
    paths: { d: string; fill: string; part: string; depth: number }[] = [];
  for (const solid of world)
    for (let j = 0; j < solid.faces.length; j++) {
      const face = solid.faces[j],
        cut = section && (solid.part === 'blade-a' || solid.part === 'blade-a-tip'),
        ps = cut
          ? clippedFace(
              face.map((i) => solid.vertices[i]),
              3.375,
            ).map((p) => project(helicopterWorldPoint(p, solid.frame, visual)))
          : face.map((i) => solid.points[i]);
      if (ps.length < 3) continue;
      const a = ps[0],
        b = ps[1],
        c = ps[2],
        n = unit(
          cross(
            b.map((v, i) => v - a[i]),
            c.map((v, i) => v - a[i]),
          ),
        ),
        light = 0.91 + 0.08 * Math.abs(dot(n, unit([-0.4, 0.7, 0.5]))),
        hex = solid.color.slice(1),
        rgb = [0, 2, 4].map((i) =>
          Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * light)),
        ),
        fill = `rgb(${rgb.join(',')})`;
      paths.push({
        d: ps.map((p, i) => `${i ? 'L' : 'M'}${place(p)}`).join('') + 'Z',
        fill,
        part: `${solid.part}-${j}`,
        depth: ps.reduce((sum, p) => sum + p[2], 0) / ps.length,
      });
    }
  paths.sort((a, b) => a.depth - b.depth);
  const arrow = (a: HeliPoint, b: HeliPoint) => ({ a: pixel(project(a)), b: pixel(project(b)) }),
    tilt = ((visual.diskTiltDeg ?? 0) * Math.PI) / 180,
    length = (visual.thrust ?? 9810) * 0.0001,
    tail = arrow([-4.7, 2.03, 0.25], [-4.7, 2.03, 0.25 + (visual.tailForce ?? 0) / 500]),
    thrust = arrow(HELI_ART.mast, [
      length * Math.sin(tilt),
      HELI_ART.mast[1] + length * Math.cos(tilt),
      0,
    ]),
    weight = arrow([0.25, 1.25, 0.7], [0.25, 1.25 - (visual.weight ?? 9810) * 0.0001, 0.7]);
  const state = section ? helicopterSolve({ collectiveDeg: visual.collectiveDeg }) : null,
    e = state ? helicopterElement(visual.collectiveDeg, state.induced, 3.375) : null,
    sectionLift = e
      ? arrow(
          [3.375, HELI_ART.mast[1], 0],
          [
            3.375,
            HELI_ART.mast[1] + Math.cos(e.inflowAngle) * e.liftPerMetre * 0.00006,
            Math.sin(e.inflowAngle) * e.liftPerMetre * 0.00006,
          ],
        )
      : null,
    sectionFlow = e
      ? arrow(
          [3.375, HELI_ART.mast[1] + 0.12, -0.27],
          [
            3.375,
            HELI_ART.mast[1] + 0.12 - 0.58 * Math.sin(e.inflowAngle),
            -0.27 + 0.58 * Math.cos(e.inflowAngle),
          ],
        )
      : null;
  return {
    width,
    height,
    paths,
    tail,
    thrust,
    weight,
    sectionLift,
    sectionFlow,
    rootLocation: pixel(project(helicopterWorldPoint([0.72, 0, 0], 'blade-a', visual))),
    sectionLocation: pixel(project(helicopterWorldPoint([3.375, 0, 0], 'blade-a', visual))),
  };
}
