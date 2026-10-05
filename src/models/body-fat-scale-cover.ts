import {
  BFS_GEOMETRY as G,
  bfsCurrentPath,
  bfsFootEllipsoids,
  type BfsPoint,
} from './body-fat-scale-geometry';
export type BfsCoverPath = {
  d: string;
  fill: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  part: string;
  /** Retained physical face vertices and normals for projection auditing. */
  points?: BfsPoint[];
  normal?: BfsPoint;
};
export const bfsCoverProject = ([x, y, z]: BfsPoint) => [
  205 + x * 53 - z * 12,
  191 - y * 42 - z * 16,
];
const line = (p: readonly BfsPoint[]) =>
  'M' +
  p
    .map(bfsCoverProject)
    .map((p) => p.map((v) => v.toFixed(2)).join(','))
    .join(' L');
function hull(input: number[][]) {
  const p = input.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (a: number[], b: number[], c: number[]) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const low: number[][] = [],
    high: number[][] = [];
  for (const q of p) {
    while (low.length > 1 && turn(low.at(-2)!, low.at(-1)!, q) <= 0) low.pop();
    low.push(q);
  }
  for (const q of [...p].reverse()) {
    while (high.length > 1 && turn(high.at(-2)!, high.at(-1)!, q) <= 0) high.pop();
    high.push(q);
  }
  return [...low.slice(0, -1), ...high.slice(0, -1)];
}
export function bodyFatScaleCover(): BfsCoverPath[] {
  const art: BfsCoverPath[] = [];
  const box = (
    size: readonly number[],
    at: readonly number[],
    fill: string,
    part: string,
    opacity = 1,
  ) => {
    const [w, h, d] = size.map((v) => v / 2),
      [x, y, z] = at;
    // The eye is proportional to (-504, 848, -2226), the cross product
    // consistent with this oblique projection. Only x−, z− and y+ faces
    // face the eye. No reversed side planes are painted as visible walls.
    const faces: { points: BfsPoint[]; normal: BfsPoint }[] = [
      {
        normal: [-1, 0, 0],
        points: [
          [x - w, y - h, z - d],
          [x - w, y - h, z + d],
          [x - w, y + h, z + d],
          [x - w, y + h, z - d],
        ],
      },
      {
        normal: [0, 0, -1],
        points: [
          [x - w, y + h, z - d],
          [x + w, y + h, z - d],
          [x + w, y - h, z - d],
          [x - w, y - h, z - d],
        ],
      },
      {
        normal: [0, 1, 0],
        points: [
          [x - w, y + h, z + d],
          [x + w, y + h, z + d],
          [x + w, y + h, z - d],
          [x - w, y + h, z - d],
        ],
      },
    ];
    faces
      .sort((a, b) => {
        const depth = (p: BfsPoint[]) =>
          p.reduce((total, [x, y, z]) => total - 504 * x + 848 * y - 2226 * z, 0) / p.length;
        return depth(a.points) - depth(b.points);
      })
      .forEach(({ points, normal }) =>
        art.push({
          d: line(points) + 'Z',
          fill,
          part,
          opacity,
          stroke: fill,
          strokeWidth: 0.6,
          points,
          normal,
        }),
      );
  };
  box(G.base.size, G.base.at, '#cdd8ce', 'base', 0.75);
  box(G.board.size, G.board.at, '#5d8576', 'board');
  box(G.deck.size, G.deck.at, '#e1e7de', 'deck', 0.76);
  G.electrodes.forEach((e) =>
    box(G.padSize, [e.at[0], e.at[1] - G.padSize[1] / 2, e.at[2]], '#a9bbb3', e.id),
  );
  const current = bfsCurrentPath();
  for (const side of [-1, 1]) {
    art.push({
      d: line(current.slice(side < 0 ? 4 : 8, side < 0 ? 9 : 14)),
      fill: 'none',
      stroke: '#9ebfb3',
      strokeWidth: 22,
      part: 'equivalent-tissue',
      opacity: 0.46,
    });
    bfsFootEllipsoids(side).forEach((f, i) => {
      const points: number[][] = [];
      for (let lat = 0; lat <= 10; lat++)
        for (let lon = 0; lon < 20; lon++) {
          const a = (lat * Math.PI) / 10,
            b = (lon * 2 * Math.PI) / 20;
          points.push(
            bfsCoverProject([
              side * 0.82 + f.at[0] + f.size[0] * Math.sin(a) * Math.cos(b),
              f.at[1] + f.size[1] * Math.cos(a),
              f.at[2] + f.size[2] * Math.sin(a) * Math.sin(b),
            ]),
          );
        }
      art.push({
        d:
          'M' +
          hull(points)
            .map((p) => p.map((v) => v.toFixed(2)).join(','))
            .join(' L') +
          'Z',
        fill: '#c9aaa0',
        opacity: 0.55,
        part: `foot-${side}-${i}`,
      });
    });
  }
  art.push({
    d: line(current.slice(0, -1)),
    fill: 'none',
    stroke: '#b77b32',
    strokeWidth: 1.8,
    part: 'current',
  });
  for (let side = 0; side < 2; side++) {
    const at = G.electrodes[side + 2].at,
      p = G.voltagePorts[side];
    art.push({
      d: line([at, [at[0], 0.24, at[2]], [side ? 0.6 : -0.6, 0.24, 1.08], p]),
      fill: 'none',
      stroke: '#467f8a',
      strokeWidth: 1.25,
      part: 'voltage',
    });
  }
  box(G.source.size, G.source.at, '#426356', 'source');
  box(G.amplifier.size, G.amplifier.at, '#467f8a', 'amplifier');
  [...G.sourcePorts, ...G.voltagePorts].forEach((p, i) => {
    // Clip only the pin surface hidden inside its actual package. This is
    // visible solid geometry, not a different manufactured pin position.
    const chip = i < 2 ? G.source : G.amplifier;
    const outer = Math.abs(p[0]) + G.pinSize[0] / 2,
      inner = chip.size[0] / 2;
    box(
      [outer - inner, G.pinSize[1], G.pinSize[2]],
      [(Math.sign(p[0]) * (outer + inner)) / 2, p[1], p[2]],
      '#b2c3b7',
      'pin',
    );
  });
  const opaque = art
    .filter((p) => p.points && (p.opacity ?? 1) === 1)
    .sort((a, b) => {
      // Board top y=.16; every raised component has y>=.16. With a positive-y
      // eye, the board is behind each of them wherever the projections meet.
      if (a.part === 'board' && b.part !== 'board') return -1;
      if (b.part === 'board' && a.part !== 'board') return 1;
      const depth = (p: BfsPoint[]) =>
        p.reduce((s, [x, y, z]) => s - 504 * x + 848 * y - 2226 * z, 0) / p.length;
      return depth(a.points!) - depth(b.points!);
    });
  const translucent = art.filter((p) => p.points && (p.opacity ?? 1) < 1);
  const overlays = art.filter((p) => !p.points);
  return [...translucent, ...opaque, ...overlays];
}
