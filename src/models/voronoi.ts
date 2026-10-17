export type VoronoiPoint = { x: number; y: number };
export type VoronoiSite = VoronoiPoint & { id: string };
export const voronoiSites: VoronoiSite[] = [
  { id: 'A', x: 75, y: 75 },
  { id: 'B', x: 275, y: 150 },
  { id: 'C', x: 130, y: 215 },
  { id: 'D', x: 310, y: 225 },
];
const finite = (p: VoronoiPoint) => Number.isFinite(p.x) && Number.isFinite(p.y);
export const voronoiDistance = (a: VoronoiPoint, b: VoronoiPoint) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export function voronoiOwners(point: VoronoiPoint, sites: readonly VoronoiSite[]) {
  if (!finite(point) || !sites.length || sites.some((s) => !finite(s)))
    throw new RangeError('Finite sites required');
  const distances = sites.map((s) => ({ id: s.id, distance: voronoiDistance(point, s) })),
    minimum = Math.min(...distances.map((s) => s.distance));
  return {
    distances,
    minimum,
    owners: distances.filter((s) => Math.abs(s.distance - minimum) < 1e-8).map((s) => s.id),
  };
}
export function voronoiCells(sites: readonly VoronoiSite[], width = 360, height = 260) {
  if (
    !sites.length ||
    sites.length > 12 ||
    new Set(sites.map((s) => s.id)).size !== sites.length ||
    sites.some((s) => !finite(s)) ||
    ![width, height].every((v) => Number.isFinite(v) && v > 0)
  )
    throw new RangeError('Invalid sites/domain');
  return sites.map((site, index) => {
    let polygon: VoronoiPoint[] = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
    for (let j = 0; j < sites.length; j++) {
      if (j === index) continue;
      const other = sites[j],
        dx = other.x - site.x,
        dy = other.y - site.y;
      if (dx === 0 && dy === 0) {
        if (j < index) polygon = [];
        continue;
      }
      const bound = (other.x ** 2 + other.y ** 2 - site.x ** 2 - site.y ** 2) / 2,
        value = (p: VoronoiPoint) => dx * p.x + dy * p.y - bound,
        next: VoronoiPoint[] = [];
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i],
          b = polygon[(i + 1) % polygon.length],
          va = value(a),
          vb = value(b),
          insideA = va <= 1e-9,
          insideB = vb <= 1e-9;
        if (insideA) next.push(a);
        if (insideA !== insideB) {
          const fraction = va / (va - vb);
          next.push({ x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction });
        }
      }
      polygon = next;
    }
    return { id: site.id, polygon };
  });
}
export function voronoiCircumcenter(
  a: VoronoiPoint,
  b: VoronoiPoint,
  c: VoronoiPoint,
): VoronoiPoint | null {
  if (![a, b, c].every(finite)) throw new RangeError('Finite vertices required');
  const dx = b.x - a.x,
    dy = b.y - a.y,
    ex = c.x - a.x,
    ey = c.y - a.y,
    det = dx * ey - dy * ex;
  if (Math.abs(det) < 1e-10) return null;
  const u = (b.x * b.x + b.y * b.y - a.x * a.x - a.y * a.y) / 2,
    v = (c.x * c.x + c.y * c.y - a.x * a.x - a.y * a.y) / 2;
  return { x: (u * ey - dy * v) / det, y: (dx * v - u * ex) / det };
}
/** Shortest polyline around one zero-thickness vertical segment; its endpoints are passable. */
export function voronoiWallRoute(
  a: VoronoiPoint,
  b: VoronoiPoint,
  wall = { x: 100, top: 20, bottom: 240 },
) {
  if (
    !finite(a) ||
    !finite(b) ||
    ![wall.x, wall.top, wall.bottom].every(Number.isFinite) ||
    wall.top >= wall.bottom
  )
    throw new RangeError('Invalid wall');
  const crosses = (a.x - wall.x) * (b.x - wall.x) < 0;
  const y = crosses ? a.y + ((b.y - a.y) * (wall.x - a.x)) / (b.x - a.x) : NaN;
  if (!crosses || y <= wall.top || y >= wall.bottom)
    return { distance: voronoiDistance(a, b), points: [a, b] };
  const routes = [wall.top, wall.bottom].map((y) => {
    const corner = { x: wall.x, y };
    return {
      distance: voronoiDistance(a, corner) + voronoiDistance(corner, b),
      points: [a, corner, b],
    };
  });
  return routes[0].distance <= routes[1].distance ? routes[0] : routes[1];
}
