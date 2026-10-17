export type PcaPoint = { x: number; y: number };
export function pcaData(isotropic = false): PcaPoint[] {
  if (isotropic)
    return [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
  const angle = Math.PI / 6,
    c = Math.cos(angle),
    s = Math.sin(angle);
  return [-3, -1, 1, 3].flatMap((u) =>
    [-0.5, 0.5].map((v) => ({ x: 4 + c * u - s * v, y: 3 + s * u + c * v })),
  );
}
export function pcaFit(points: readonly PcaPoint[], scaleX = 1) {
  if (
    !points.length ||
    points.length > 128 ||
    !Number.isFinite(scaleX) ||
    scaleX <= 0 ||
    scaleX > 20 ||
    points.some((p) => ![p.x, p.y].every((v) => Number.isFinite(v) && Math.abs(v) <= 1000))
  )
    throw new RangeError('Invalid bounded PCA input');
  const data = points.map((p) => ({ x: p.x * scaleX, y: p.y })),
    mean = {
      x: data.reduce((sum, p) => sum + p.x, 0) / data.length,
      y: data.reduce((sum, p) => sum + p.y, 0) / data.length,
    },
    centered = data.map((p) => ({ x: p.x - mean.x, y: p.y - mean.y })),
    a = centered.reduce((sum, p) => sum + p.x * p.x, 0) / data.length,
    b = centered.reduce((sum, p) => sum + p.x * p.y, 0) / data.length,
    c = centered.reduce((sum, p) => sum + p.y * p.y, 0) / data.length,
    gap = Math.hypot(a - c, 2 * b),
    total = a + c,
    lambda1 = (total + gap) / 2,
    lambda2 = Math.max(0, (total - gap) / 2),
    angle = 0.5 * Math.atan2(2 * b, a - c);
  return {
    data,
    mean,
    centered,
    covariance: { xx: a, xy: b, yy: c },
    lambda1,
    lambda2,
    total,
    angle,
    degenerate: gap <= 1e-12 * Math.max(1, total),
    ratio: total > 0 ? lambda1 / total : null,
  };
}
export function pcaProject(fit: ReturnType<typeof pcaFit>, angle: number) {
  if (!Number.isFinite(angle)) throw new RangeError('Invalid projection angle');
  const direction = { x: Math.cos(angle), y: Math.sin(angle) },
    items = fit.centered.map((p, index) => {
      const score = p.x * direction.x + p.y * direction.y,
        reconstruction = { x: score * direction.x, y: score * direction.y },
        error = (p.x - reconstruction.x) ** 2 + (p.y - reconstruction.y) ** 2;
      return { index, point: p, score, reconstruction, error };
    });
  return {
    direction,
    items,
    variance: items.reduce((sum, p) => sum + p.score * p.score, 0) / items.length,
    error: items.reduce((sum, p) => sum + p.error, 0) / items.length,
  };
}
