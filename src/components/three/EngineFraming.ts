/** Perspective fit for this engine's actual world-space assembly bounds. */
export type EnginePoint = readonly [number, number, number];
export function engineFrameDistance(
  bounds: readonly EnginePoint[],
  target: EnginePoint,
  direction: EnginePoint,
  aspect: number,
  fov = 34,
  margin = 0.88,
) {
  const norm = Math.hypot(...direction),
    z = direction.map((v) => v / norm);
  const r = Math.hypot(z[0], z[2]);
  const right = [z[2] / r, 0, -z[0] / r];
  const up = [z[1] * right[2], z[2] * right[0] - z[0] * right[2], -z[1] * right[0]];
  const dot = (a: readonly number[], b: readonly number[]) =>
    a.reduce((s, v, i) => s + v * b[i], 0);
  const cot = 1 / Math.tan((fov * Math.PI) / 360);
  return Math.max(
    ...bounds.map((point) => {
      const v = point.map((n, i) => n - target[i]);
      return (
        dot(v, z) +
        Math.max(
          (Math.abs(dot(v, right)) * cot) / (aspect * margin),
          (Math.abs(dot(v, up)) * cot) / margin,
          0.2,
        )
      );
    }),
  );
}
export function engineBoxCorners(min: EnginePoint, max: EnginePoint): EnginePoint[] {
  return [min[0], max[0]].flatMap((x) =>
    [min[1], max[1]].flatMap((y) => [min[2], max[2]].map((z) => [x, y, z] as const)),
  );
}
