export type PrismPoint = { x: number; y: number };
const cross = (a: PrismPoint, b: PrismPoint) => a.x * b.y - a.y * b.x;
const sub = (a: PrismPoint, b: PrismPoint) => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: PrismPoint, b: PrismPoint) => a.x * b.x + a.y * b.y;
/** SCHOTT N-BK7 Sellmeier coefficients, wavelength nm; visible-range use only. */
export function bk7(wavelength = 550) {
  if (!Number.isFinite(wavelength) || wavelength < 400 || wavelength > 750)
    throw new RangeError('Wavelength outside this scene range');
  const l = (wavelength / 1000) ** 2;
  return Math.sqrt(
    1 +
      (1.03961212 * l) / (l - 0.00600069867) +
      (0.231792344 * l) / (l - 0.0200179144) +
      (1.01046945 * l) / (l - 103.560653),
  );
}
export function prismVertices(rotation = -20): PrismPoint[] {
  const r = (rotation * Math.PI) / 180;
  return [
    { x: -1, y: -Math.sqrt(3) / 2 },
    { x: 1, y: -Math.sqrt(3) / 2 },
    { x: 0, y: Math.sqrt(3) / 2 },
  ].map((p) => ({
    x: p.x * Math.cos(r) - p.y * Math.sin(r),
    y: p.x * Math.sin(r) + p.y * Math.cos(r),
  }));
}
export function prismDirection(direction: PrismPoint, normal: PrismPoint, n1: number, n2: number) {
  const eta = n1 / n2,
    ci = -dot(direction, normal),
    radicand = 1 - eta * eta * (1 - ci * ci);
  if (radicand < 0) return null;
  const q = eta * ci - Math.sqrt(Math.max(0, radicand));
  return { x: eta * direction.x + q * normal.x, y: eta * direction.y + q * normal.y };
}
function intersection(origin: PrismPoint, direction: PrismPoint, vertices: PrismPoint[]) {
  let best: null | { point: PrismPoint; normal: PrismPoint; distance: number } = null;
  for (let j = 0; j < 3; j++) {
    const a = vertices[j],
      e = sub(vertices[(j + 1) % 3], a),
      den = cross(direction, e);
    if (Math.abs(den) < 1e-12) continue;
    const relative = sub(a, origin),
      distance = cross(relative, e) / den,
      u = cross(relative, direction) / den;
    if (distance > 1e-8 && u >= -1e-10 && u <= 1 + 1e-10 && (!best || distance < best.distance)) {
      const length = Math.hypot(e.x, e.y);
      best = {
        point: { x: origin.x + distance * direction.x, y: origin.y + distance * direction.y },
        normal: { x: e.y / length, y: -e.x / length },
        distance,
      };
    }
  }
  return best;
}
export function prismRay(wavelength = 550, rotation = -20, dispersive = true) {
  if (!Number.isFinite(rotation) || rotation < -30 || rotation > -10)
    throw new RangeError('Rotation outside scene range');
  const index = bk7(dispersive ? wavelength : 550),
    vertices = prismVertices(rotation),
    source = { x: -3, y: 0 },
    incident = { x: 1, y: 0 },
    entry = intersection(source, incident, vertices);
  if (!entry) throw new Error('Ray missed prism');
  const inside = prismDirection(incident, entry.normal, 1, index)!;
  const exit = intersection(entry.point, inside, vertices);
  if (!exit) throw new Error('Ray missed exit');
  const outgoing = prismDirection(inside, { x: -exit.normal.x, y: -exit.normal.y }, index, 1);
  if (!outgoing)
    return {
      wavelength,
      index,
      vertices,
      points: [source, entry.point, exit.point],
      entry,
      exit,
      inside,
      outgoing: null,
      deviation: null,
    };
  const end = { x: 3, y: exit.point.y + ((3 - exit.point.x) * outgoing.y) / outgoing.x };
  return {
    wavelength,
    index,
    vertices,
    points: [source, entry.point, exit.point, end],
    entry,
    exit,
    inside,
    outgoing,
    deviation: (-Math.atan2(outgoing.y, outgoing.x) * 180) / Math.PI,
  };
}
export const prismColor = (w: number) =>
  w < 470
    ? '#839fcf'
    : w < 510
      ? '#84bccc'
      : w < 560
        ? '#acc77e'
        : w < 600
          ? '#dec974'
          : w < 640
            ? '#dba26c'
            : '#cb7a6d';
export function prismShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    wavelength: chapter === 2 ? 650 - 200 * p : 550,
    rotation: chapter === 4 ? -15 - 10 * p : -20,
    white: chapter === 1 || chapter === 3 || chapter === 4,
    dispersive: chapter !== 3 || p > 0.45,
  };
}
