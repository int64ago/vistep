import { JELLY, type JellyFrame, type JellyShape } from './jellyfish';
export type JellyPoint = [number, number, number];
export function jellyBellPoint(
  shape: JellyShape,
  theta: number,
  phi: number,
  inner = false,
): JellyPoint {
  const r = shape.radius / JELLY.radius,
    h = shape.height / JELLY.radius;
  const thickness = inner ? 0 : 0.025;
  return [
    (r + thickness) * Math.sin(theta) * Math.cos(phi),
    (h + thickness) * Math.cos(theta),
    (r + thickness) * Math.sin(theta) * Math.sin(phi),
  ];
}
export function jellyBellMesh(shape: JellyShape, rings = 24, sectors = 64, inner = false) {
  const vertices: JellyPoint[] = [],
    indices: number[] = [];
  // Single apex avoids coincident zero-area triangles at the top.
  vertices.push(jellyBellPoint(shape, 0, 0, inner));
  for (let row = 1; row <= rings; row++)
    for (let j = 0; j < sectors; j++)
      vertices.push(
        jellyBellPoint(shape, ((row / rings) * Math.PI) / 2, (j / sectors) * Math.PI * 2, inner),
      );
  for (let j = 0; j < sectors; j++) indices.push(0, 1 + ((j + 1) % sectors), 1 + j);
  for (let row = 1; row < rings; row++)
    for (let j = 0; j < sectors; j++) {
      const a = 1 + (row - 1) * sectors + j,
        b = 1 + (row - 1) * sectors + ((j + 1) % sectors),
        c = a + sectors,
        d = b + sectors;
      indices.push(a, b, c, b, d, c);
    }
  if (inner)
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  return { vertices, indices };
}
export function jellyGonadPoint(arm: number, u: number): JellyPoint {
  const centerAngle = (arm * Math.PI) / 2 + Math.PI / 4,
    arc = -Math.PI * 0.83 + u * Math.PI * 1.66;
  const center = 0.36,
    width = 0.17;
  const localX = center + Math.cos(arc) * width,
    localZ = Math.sin(arc) * width;
  const y = 0.425 * Math.sqrt(1 - (Math.hypot(localX, localZ) / 0.975) ** 2) - 0.008;
  return [
    localX * Math.cos(centerAngle) - localZ * Math.sin(centerAngle),
    y,
    localX * Math.sin(centerAngle) + localZ * Math.cos(centerAngle),
  ];
}
export function jellyOralPoint(
  arm: number,
  u: number,
  across: number,
  frame: JellyFrame,
): JellyPoint {
  const motion = Math.min(1, ((frame.inflow + frame.outflow) * 1e6) / 6 + frame.speed * 60);
  const angle = (arm * Math.PI) / 2 + Math.PI / 4,
    radius = 0.13 + 0.13 * u + 0.035 * motion * Math.sin(u * 5 + frame.phase * 2 * Math.PI),
    width = 0.085 * (0.25 + Math.sin(Math.PI * u));
  const radial = radius + across * width;
  return [
    radial * Math.cos(angle) - across * width * Math.sin(angle),
    0.07 - 0.83 * u + 0.02 * Math.sin(u * 24 + across * 9),
    radial * Math.sin(angle) + across * width * Math.cos(angle),
  ];
}
export function jellyTentaclePoint(
  index: number,
  u: number,
  frame: JellyFrame,
  count = 64,
): JellyPoint {
  const angle = (index / count) * Math.PI * 2,
    r = frame.radius / JELLY.radius;
  const motion = Math.min(1, ((frame.inflow + frame.outflow) * 1e6) / 6 + frame.speed * 60);
  const bend = 0.045 * motion * Math.sin(u * 5 + frame.phase * Math.PI * 2 + angle * 3) * u;
  return [(r + bend) * Math.cos(angle), -0.03 - 0.24 * u, (r + bend) * Math.sin(angle)];
}
export function jellyOutline(shape: JellyShape, scale = 120, cx = 200, cy = 130, inner = false) {
  const tissue = inner ? 0 : 0.025;
  const points = Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * Math.PI;
    return [
      cx + (shape.radius / JELLY.radius + tissue) * scale * Math.cos(a),
      cy - (shape.height / JELLY.radius + tissue) * scale * Math.sin(a),
    ];
  });
  return `M${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L')}`;
}
