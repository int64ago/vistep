export type DescentPoint = {
  step: number;
  x: number;
  y: number;
  loss: number;
  gx: number;
  gy: number;
};
export const descentLoss = (x: number, y: number) => 0.5 * (x * x + 8 * y * y);
export function descentGradient(x: number, y: number) {
  return { x, y: 8 * y };
}
export function descentTrace(
  rate = 0.08,
  steps = 18,
  start: readonly [number, number] = [2.5, 1.5],
) {
  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 0.4 ||
    !Number.isInteger(steps) ||
    steps < 0 ||
    steps > 64 ||
    start.length !== 2 ||
    start.some((v) => !Number.isFinite(v) || Math.abs(v) > 5)
  )
    throw new RangeError('Invalid bounded descent input');
  let [x, y] = start;
  const points: DescentPoint[] = [];
  for (let step = 0; step <= steps; step++) {
    const g = descentGradient(x, y);
    points.push({ step, x, y, loss: descentLoss(x, y), gx: g.x, gy: g.y });
    x -= rate * g.x;
    y -= rate * g.y;
  }
  return { rate, points, stable: rate > 0 && rate < 0.25, critical: rate === 0.25 };
}
export function descentPlot(points: readonly DescentPoint[]) {
  const bound = Math.max(
      3,
      Math.ceil(Math.max(...points.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)])) * 1.15),
    ),
    scale = 106 / bound;
  return {
    bound,
    scale,
    point: (x: number, y: number) => ({ x: 180 + x * scale, y: 140 - y * scale }),
  };
}
