/** Renderer geometry, independent of the unchanged ideal hydraulic/4:1 force model. */
export const BRAKE_LINK = {
  pivot: [-0.99, 0.11] as const,
  attachment: [-0.14, -0.25] as const,
  pistonZero: -0.55,
  scale: 0.025,
  length: Math.hypot(0.58, 0.14),
};
/** Circle/circle intersection: a fixed-length pin-jointed rod meets the piston axis. */
export function brakeLinkage(stroke: number) {
  const b: [number, number, number] = [
    BRAKE_LINK.pistonZero + Math.max(0, Math.min(4, stroke)) * BRAKE_LINK.scale,
    0,
    0,
  ];
  const [px, py] = BRAKE_LINK.pivot,
    [ax, ay] = BRAKE_LINK.attachment;
  const dx = b[0] - px,
    dy = -py,
    d = Math.hypot(dx, dy),
    r = Math.hypot(ax, ay);
  const cosine = (r * r + d * d - BRAKE_LINK.length ** 2) / (2 * r * d);
  const arm = Math.atan2(dy, dx) - Math.acos(Math.max(-1, Math.min(1, cosine)));
  const angle = arm - Math.atan2(ay, ax);
  return {
    angle,
    start: [px + r * Math.cos(arm), py + r * Math.sin(arm), 0] as const,
    end: b,
    length: BRAKE_LINK.length,
  };
}
export type BrakePoint = readonly [number, number, number];
/** Fit all actual near/far assembly corners, rather than nominal width/height. */
export function brakeFrameDistance(
  bounds: readonly BrakePoint[],
  target: BrakePoint,
  direction: BrakePoint,
  aspect: number,
  fov = 34,
  margin = 0.88,
) {
  const norm = Math.hypot(...direction),
    z = direction.map((v) => v / norm),
    r = Math.hypot(z[0], z[2]);
  const right = [z[2] / r, 0, -z[0] / r],
    up = [z[1] * right[2], z[2] * right[0] - z[0] * right[2], -z[1] * right[0]];
  const dot = (a: readonly number[], b: readonly number[]) =>
      a.reduce((s, v, i) => s + v * b[i], 0),
    cot = 1 / Math.tan((fov * Math.PI) / 360);
  return Math.max(
    ...bounds.map((p) => {
      const v = p.map((n, i) => n - target[i]);
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
export function brakeBoxCorners(min: BrakePoint, max: BrakePoint): BrakePoint[] {
  return [min[0], max[0]].flatMap((x) =>
    [min[1], max[1]].flatMap((y) => [min[2], max[2]].map((z) => [x, y, z] as const)),
  );
}
