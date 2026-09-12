import {
  NUCLIDES,
  bindingCurve,
  bindingPerNucleon,
  chainAt,
  criticalRadius,
  multiplication,
} from './atomic-bomb';
import { atomicBombChains, chainHorizon } from './atomic-bomb-film';

export type CoverPoint = { x: number; y: number };
export const coverPath = (points: readonly CoverPoint[], close = false) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') +
  (close ? 'Z' : '');

/** The 400×230 cover: the film's large-sphere walk projected onto its section, with the
 * multiplication curve beside it. Every track and burst comes from the same chain the film draws. */
export function atomicBombCover() {
  const chain = atomicBombChains().large,
    time = chainHorizon(chain) * 0.72,
    state = chainAt(chain, time);
  const sphere = { cx: 132, cy: 118, r: 84 },
    scale = sphere.r / chain.radius;
  const project = (p: readonly [number, number, number]) => ({
    x: sphere.cx + p[0] * scale,
    y: sphere.cy - p[1] * scale,
    depth: (p[2] + chain.radius) / (2 * chain.radius),
  });
  const tracks: { points: CoverPoint[]; opacity: number }[] = [],
    bursts: { x: number; y: number; r: number; opacity: number }[] = [],
    leaks: CoverPoint[] = [],
    heads: CoverPoint[] = [];
  for (const path of state.paths) {
    if (!path) continue;
    const points = path.points.map(project);
    const depth = points.at(-1)!.depth;
    tracks.push({ points, opacity: 0.3 + 0.55 * depth });
    const last = points.at(-1)!;
    if (!path.finished) heads.push(last);
    else if (path.fate === 'fission')
      bursts.push({
        x: last.x,
        y: last.y,
        r: 1.8 + 2.6 * Math.max(0, 1 - path.since / 3),
        opacity: 0.55 + 0.4 * depth,
      });
    else if (path.fate === 'leak') leaks.push(last);
  }
  const graph = { left: 262, right: 384, top: 58, base: 176, maxR: 6, maxK: 2.2 };
  const gx = (r: number) => graph.left + (r / graph.maxR) * (graph.right - graph.left),
    gy = (k: number) => graph.base - (k / graph.maxK) * (graph.base - graph.top);
  const curve = Array.from({ length: 49 }, (_, i) => 0.25 + (i / 48) * (graph.maxR - 0.25)).map(
    (r) => ({
      x: gx(r),
      y: gy(multiplication(r)),
    }),
  );
  const marker = { x: gx(chain.radius), y: gy(multiplication(chain.radius)) },
    critical = { x: gx(criticalRadius()), y: gy(1) },
    unity = { x1: graph.left, x2: graph.right, y: gy(1) };
  const binding = bindingCurve(250, 5);
  const bx = (A: number) => graph.left + (A / 250) * (graph.right - graph.left),
    by = (b: number) => 214 - (b / 9) * 22;
  const bindingLine = binding.map((p) => ({ x: bx(p.A), y: by(p.perNucleon) }));
  const bindingMarks = [NUCLIDES.u235, NUCLIDES.ba141, NUCLIDES.kr92].map((n) => ({
    x: bx(n.A),
    y: by(bindingPerNucleon(n)),
  }));
  return {
    chain,
    time,
    sphere,
    tracks,
    bursts,
    leaks,
    heads,
    graph,
    curve,
    marker,
    critical,
    unity,
    bindingLine,
    bindingMarks,
  };
}
