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
  if (![down, slope].every(Number.isFinite))
    throw new RangeError('Beam result exceeds finite domain.');
  return { down, slope };
}
export function reflectedDirection(direction: OpticalPoint, tangent: number) {
  if (![direction.x, direction.y, tangent].every(Number.isFinite))
    throw new RangeError('Finite reflection input required.');
  const t = { x: Math.cos(tangent), y: Math.sin(tangent) },
    dot = direction.x * t.x + direction.y * t.y;
  const result = { x: 2 * dot * t.x - direction.x, y: 2 * dot * t.y - direction.y };
  if (![result.x, result.y].every(Number.isFinite))
    throw new RangeError('Reflection result exceeds finite domain.');
  return result;
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
  if (!Number.isFinite(force) || force < 0 || force > 80)
    throw new RangeError('Teaching elastic load is 0–80 N.');
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

const smooth = (x: number) => {
  const u = Math.max(0, Math.min(1, x));
  return u * u * (3 - 2 * u);
};
/** Four retained chapters; the wall remains at 4 m during elastic release. */
export function deformationDirector(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Number.isFinite(chapter) ? Math.max(0, Math.min(3, Math.floor(chapter))) : 0;
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const time =
    chapterTime === undefined
      ? p * ([26, 28, 28, 28.5][c] ?? 28)
      : Number.isFinite(chapterTime)
        ? Math.max(0, chapterTime)
        : 0;
  const en = locale === 'en',
    ramp = (start: number, end: number) => smooth((time - start) / (end - start));
  return {
    force:
      c === 0
        ? 0
        : c === 1
          ? 60 * ramp(0.45, en ? 8.5 : 10.5)
          : c === 2
            ? 60
            : 60 * (1 - ramp(0.45, en ? 7.5 : 6.7)),
    wallX: c < 2 ? 2.3 : c === 2 ? 2.3 + 1.7 * ramp(0.45, en ? 3.3 : 3.7) : 4,
    view: (c === 0
      ? time < (en ? 12.95 : 15.13)
        ? 'path'
        : 'spot'
      : c === 1
        ? 'profile'
        : c === 2
          ? time < (en ? 7.33 : 8.8)
            ? 'path'
            : 'spot'
          : time < (en ? 7.73 : 6.95)
            ? 'profile'
            : 'spot') as DeformationView,
  };
}
export type DeformationView = 'path' | 'bench' | 'profile' | 'spot';
