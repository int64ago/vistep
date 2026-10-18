export type OpticalPoint = { x: number; y: number };
const add = (a: OpticalPoint, b: OpticalPoint, k = 1) => ({ x: a.x + k * b.x, y: a.y + k * b.y });
const cross = (a: OpticalPoint, b: OpticalPoint) => a.x * b.y - a.y * b.x;
export function beamDeflection(x: number, force: number, rigidity = 20000, length = 1) {
  if (
    ![x, force, rigidity, length].every(Number.isFinite) ||
    force < 0 ||
    rigidity <= 0 ||
    length <= 0 ||
    x < 0 ||
    x > length
  )
    throw new RangeError('Finite beam coordinates and nonnegative force required.');
  const u = Math.min(x, length - x);
  const down = (force * u * (3 * length ** 2 - 4 * u ** 2)) / (48 * rigidity);
  const slope =
    ((force * (length ** 2 - 4 * u ** 2)) / (16 * rigidity)) * (x <= length / 2 ? 1 : -1);
  return { down, slope };
}
export function reflectedDirection(direction: OpticalPoint, tangent: number) {
  const t = { x: Math.cos(tangent), y: Math.sin(tangent) },
    dot = direction.x * t.x + direction.y * t.y;
  return { x: 2 * dot * t.x - direction.x, y: 2 * dot * t.y - direction.y };
}
function hit(origin: OpticalPoint, direction: OpticalPoint, center: OpticalPoint, angle: number) {
  const tangent = { x: Math.cos(angle), y: Math.sin(angle) },
    den = cross(direction, tangent);
  if (Math.abs(den) < 1e-10) throw new RangeError('Parallel optical path.');
  const distance = cross({ x: center.x - origin.x, y: center.y - origin.y }, tangent) / den;
  if (distance <= 0) throw new RangeError('Mirror behind the ray.');
  return add(origin, direction, distance);
}
/** Metres; y upward. Fixed source, two material mirrors, exact reflection at both moving lines. */
export function opticalLever(force: number, wallX = 2.3) {
  if (!Number.isFinite(wallX) || wallX < 1.1 || wallX > 5)
    throw new RangeError('Wall must remain beyond the mirrors.');
  const source = { x: -0.2, y: 0.14 },
    m0 = { x: 0.75, y: 0.16 },
    n0 = { x: 0.25, y: 0.24 };
  const a0 = Math.atan2(m0.y - source.y, m0.x - source.x),
    a1 = Math.atan2(n0.y - m0.y, n0.x - m0.x),
    a2 = 0.04;
  const mirror = (p: OpticalPoint, baseline: number) => {
    const beam = beamDeflection(p.x, force),
      tilt = -Math.atan(beam.slope);
    return {
      center: { x: p.x - p.y * Math.sin(tilt), y: -beam.down + p.y * Math.cos(tilt) },
      angle: baseline + tilt,
      base: { x: p.x, y: -beam.down },
    };
  };
  const m = mirror(m0, (a0 + a1) / 2),
    n = mirror(n0, (a1 + a2) / 2),
    d0 = { x: Math.cos(a0), y: Math.sin(a0) },
    p1 = hit(source, d0, m.center, m.angle),
    d1 = reflectedDirection(d0, m.angle),
    p2 = hit(p1, d1, n.center, n.angle),
    d2 = reflectedDirection(d1, n.angle),
    wall = add(p2, d2, (wallX - p2.x) / d2.x);
  const baseline = n0.y + (wallX - n0.x) * Math.tan(a2);
  return {
    source,
    m,
    n,
    p1,
    p2,
    wall,
    d0,
    d1,
    d2,
    baseline,
    shift: wall.y - baseline,
    deflection: beamDeflection(0.5, force).down,
  };
}
