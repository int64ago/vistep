import { BFS, type BfsShot } from './body-fat-scale';
export type BfsPoint = readonly [number, number, number];
/** Coordinates are a common 10 cm illustration unit. Routes are an
 * equivalent electrical path, not a reconstruction of current density. */
export const BFS_GEOMETRY = {
  base: { size: [3.7, 0.25, 2.9], at: [0, 0.23, 0] },
  deck: { size: [3.58, 0.08, 2.78], at: [0, 0.39, 0] },
  padSize: [0.7, 0.03, 0.7],
  padY: 0.445,
  electrodes: [
    { id: 'I+', at: [-0.82, 0.445, -0.65], role: 'current' },
    { id: 'I−', at: [0.82, 0.445, -0.65], role: 'current' },
    { id: 'V+', at: [-0.82, 0.445, 0.6], role: 'voltage' },
    { id: 'V−', at: [0.82, 0.445, 0.6], role: 'voltage' },
  ],
  source: { at: [0, 0.22, 0.52], size: [0.6, 0.12, 0.4] },
  amplifier: { at: [0, 0.22, 1.08], size: [0.6, 0.12, 0.32] },
  sourcePorts: [
    [-0.34, 0.22, 0.52],
    [0.34, 0.22, 0.52],
  ],
  pinSize: [0.09, 0.04, 0.055],
  voltagePorts: [
    [-0.34, 0.22, 1.08],
    [0.34, 0.22, 1.08],
  ],
  board: { size: [1.55, 0.04, 1.2], at: [0, 0.14, 0.66] },
} as const;
const leftBody: BfsPoint[] = [
  [-0.82, 0.445, -0.65],
  [-0.82, 0.48, 0.6],
  [-0.82, 0.95, 0.6],
  [-0.68, 2.1, 0.5],
  [-0.6, 3.05, 0.35],
  [0, 3.4, 0.3],
];
export function bfsCurrentPath(): BfsPoint[] {
  const source = BFS_GEOMETRY.sourcePorts;
  return [
    source[0],
    [-0.82, 0.24, 0.52],
    [-0.82, 0.24, -0.65],
    ...leftBody,
    ...leftBody
      .slice(0, -1)
      .reverse()
      .map(([x, y, z]): BfsPoint => [-x, y, z]),
    [0.82, 0.24, -0.65],
    [0.82, 0.24, 0.52],
    source[1],
    source[0],
  ];
}
export function bfsSensePaths(): BfsPoint[][] {
  return ([-1, 1] as const).map((s, i): BfsPoint[] => [
    [s * 0.82, 0.445, 0.6],
    [s * 0.82, 0.24, 0.6],
    [s * 0.6, 0.24, 1.08],
    BFS_GEOMETRY.voltagePorts[i],
  ]);
}
export function bfsPathPoint(points: BfsPoint[], fraction: number): BfsPoint {
  const lengths = points.slice(1).map((p, i) => Math.hypot(...p.map((v, j) => v - points[i][j])));
  let d = Math.max(0, Math.min(1, fraction)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? d / lengths[i] : 0;
      return points[i].map((v, j) => v + (points[i + 1][j] - v) * t) as unknown as BfsPoint;
    }
    d -= lengths[i];
  }
  return points[0];
}
/** A slowed signal marker, not a charge trajectory. Its pathwise velocity
 * has the sign of I(t)=sin(2π phase), so both views reverse together. */
export function bfsMarkerFraction(index: number, count: number, phaseCycles: number) {
  return (index + 0.5) / count - 0.016 * Math.cos(2 * Math.PI * phaseCycles);
}
export function bfsFootEllipsoids(side: number) {
  return [
    { at: [0, 0.675, -0.14], size: [0.34, 0.23, 0.74] },
    { at: [0, 0.655, 0.65], size: [0.31, 0.21, 0.39] },
    ...Array.from({ length: 5 }, (_, toe) => {
      const r = 0.135 - toe * 0.012;
      return {
        at: [-side * (0.235 - toe * 0.115), 0.445 + r, -0.91 + toe * 0.025],
        size: [r, r, r * 1.26],
      };
    }),
    { at: [0, 0.95, 0.6], size: [0.22, 0.52, 0.22] },
  ];
}
export function bfsFramePoints(view: BfsShot['view'], explode = 0): BfsPoint[] {
  const corners: BfsPoint[] = [];
  for (const x of [-1.85, 1.85])
    for (const z of [-1.45, 1.45]) for (const y of [0, 0.5 + explode]) corners.push([x, y, z]);
  if (view === 'route') corners.push([-1.25, 3.75, 0.3], [1.25, 3.75, 0.3]);
  else if (view === 'object') {
    for (const side of [-1, 1])
      for (const part of bfsFootEllipsoids(side)) {
        for (const x of [-1, 1])
          for (const y of [-1, 1])
            for (const z of [-1, 1]) {
              corners.push([
                side * 0.82 + part.at[0] + x * part.size[0],
                part.at[1] + y * part.size[1],
                part.at[2] + z * part.size[2],
              ]);
            }
      }
  } else if (view === 'weight') {
    for (const x of [-1.42, 1.42]) for (const z of [-1.1, 1.1]) corners.push([x, 1.14, z]);
  }
  return corners;
}
export function bfsCameraFrame(aspect: number, view: BfsShot['view'], explode = 0) {
  if (!Number.isFinite(aspect) || aspect <= 0) throw new RangeError('BIA aspect');
  const target: BfsPoint = [0, view === 'route' ? 1.7 : 0.48, 0];
  const direction = view === 'route' ? [0.28, 0.2, 1] : [0.35, 0.95, 1];
  const length = Math.hypot(...direction),
    eye = direction.map((v) => v / length);
  const right = [eye[2], 0, -eye[0]],
    rlen = Math.hypot(...right),
    r = right.map((v) => v / rlen);
  const up = [eye[1] * r[2], eye[2] * r[0] - eye[0] * r[2], -eye[1] * r[0]];
  const tan = Math.tan((34 * Math.PI) / 360);
  let distance = 0;
  for (const p of bfsFramePoints(view, explode)) {
    const d = p.map((v, i) => v - target[i]),
      dx = d.reduce((sum, v, i) => sum + v * r[i], 0),
      dy = d.reduce((sum, v, i) => sum + v * up[i], 0),
      dz = d.reduce((sum, v, i) => sum + v * eye[i], 0);
    distance = Math.max(
      distance,
      dz + Math.abs(dx) / (tan * aspect * 0.86),
      dz + Math.abs(dy) / (tan * 0.84),
    );
  }
  return { target, position: target.map((v, i) => v + eye[i] * distance) as unknown as BfsPoint };
}
export const BFS_WATER_REFERENCE = BFS.waterL;
