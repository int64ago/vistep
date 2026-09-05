export function hypercube(dim: number) {
  const vertices = Array.from({ length: 2 ** dim }, (_, i) =>
    Array.from({ length: dim }, (_, d) => ((i >> d) & 1 ? 1 : -1)),
  );
  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++)
    for (let d = 0; d < dim; d++) {
      const j = i ^ (1 << d);
      if (j > i) edges.push([i, j]);
    }
  return { vertices, edges };
}
export function projectVertex(v: number[], angle: number) {
  const p = [...v, ...Array(4 - v.length).fill(0)];
  const x = p[0] * Math.cos(angle) - p[3] * Math.sin(angle),
    w = p[0] * Math.sin(angle) + p[3] * Math.cos(angle);
  const f = 3.5 / (3.5 - w);
  return [x * f, p[1] * f, p[2] * f];
}
export function sphereSlice(radius: number, height: number) {
  return Math.abs(height) > radius
    ? null
    : Math.sqrt(Math.max(0, radius * radius - height * height));
}
