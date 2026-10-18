export type FieldArrangement = 'single' | 'dipole' | 'like' | 'plates';
export type FieldPoint = { x: number; y: number };
export const FIELD_K = 8.9875517923e9;
export const FIELD_CHARGE = 0.8e-9;
export function fieldSources(mode: FieldArrangement) {
  return mode === 'single'
    ? [{ x: 0, y: 0, q: FIELD_CHARGE }]
    : mode === 'plates'
      ? []
      : [
          { x: -0.07, y: 0, q: FIELD_CHARGE },
          { x: 0.07, y: 0, q: mode === 'dipole' ? -FIELD_CHARGE : FIELD_CHARGE },
        ];
}
export function fieldAt(mode: FieldArrangement, x: number, y: number) {
  if (![x, y].every(Number.isFinite)) throw new RangeError('Finite probe coordinates required.');
  if (mode === 'plates') return { ex: 500, ey: 0, potential: -500 * x, valid: Math.abs(x) < 0.11 };
  let ex = 0,
    ey = 0,
    potential = 0;
  for (const s of fieldSources(mode)) {
    const dx = x - s.x,
      dy = y - s.y,
      r = Math.hypot(dx, dy);
    if (r < 0.006) return { ex: 0, ey: 0, potential: 0, valid: false };
    const a = FIELD_K * s.q;
    ex += (a * dx) / r ** 3;
    ey += (a * dy) / r ** 3;
    potential += a / r;
  }
  return { ex, ey, potential, valid: true };
}
export function fragmentAngle(initial: number, ex: number, ey: number, time: number) {
  if (![initial, ex, ey, time].every(Number.isFinite) || time < 0)
    throw new RangeError('Finite orientation inputs and nonnegative time required.');
  const strength = ex * ex + ey * ey;
  if (strength < 1e-12) return initial;
  const target = Math.atan2(ey, ex),
    raw = initial - target,
    delta = Math.atan(Math.tan(raw));
  // Overdamped induced-dipole torque: d(delta)/dt = -a |E|² sin(2 delta).
  const decay = Math.exp(-2e-6 * strength * time);
  return target + Math.atan2(Math.sin(delta) * decay, Math.cos(delta));
}
export function fieldLines(mode: FieldArrangement): FieldPoint[][] {
  if (mode === 'plates')
    return Array.from({ length: 9 }, (_, i) => [
      { x: -0.105, y: -0.12 + i * 0.03 },
      { x: 0.105, y: -0.12 + i * 0.03 },
    ]);
  const sources = fieldSources(mode),
    result: FieldPoint[][] = [];
  for (const source of sources.filter((s) => s.q > 0))
    for (let ray = 0; ray < 20; ray++) {
      const angle = ((ray + 0.5) * Math.PI * 2) / 20;
      let x = source.x + 0.009 * Math.cos(angle),
        y = source.y + 0.009 * Math.sin(angle);
      const path: FieldPoint[] = [{ x, y }];
      for (let n = 0; n < 260; n++) {
        const a = fieldAt(mode, x, y),
          norm = Math.hypot(a.ex, a.ey);
        if (!a.valid || norm < 1e-7) break;
        const step = 0.0022,
          b = fieldAt(mode, x + (step * 0.5 * a.ex) / norm, y + (step * 0.5 * a.ey) / norm),
          normB = Math.hypot(b.ex, b.ey);
        if (!b.valid || normB < 1e-7) break;
        x += (step * b.ex) / normB;
        y += (step * b.ey) / normB;
        if (Math.abs(x) > 0.177 || Math.abs(y) > 0.147) break;
        path.push({ x, y });
        if (sources.some((s) => s.q < 0 && Math.hypot(x - s.x, y - s.y) < 0.01)) break;
      }
      if (path.length > 2) result.push(path);
    }
  return result;
}
export function potentialContours(mode: FieldArrangement, levels = [-100, -50, 0, 50, 100, 200]) {
  const result: { level: number; a: FieldPoint; b: FieldPoint }[] = [],
    nx = 44,
    ny = 34,
    x0 = -0.175,
    y0 = -0.14,
    dx = 0.35 / nx,
    dy = 0.28 / ny;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const corners = [
          { x: x0 + i * dx, y: y0 + j * dy },
          { x: x0 + (i + 1) * dx, y: y0 + j * dy },
          { x: x0 + (i + 1) * dx, y: y0 + (j + 1) * dy },
          { x: x0 + i * dx, y: y0 + (j + 1) * dy },
        ],
        values = corners.map((p) => fieldAt(mode, p.x, p.y));
      if (values.some((v) => !v.valid)) continue;
      for (const level of levels) {
        const crossings: FieldPoint[] = [];
        for (let e = 0; e < 4; e++) {
          const next = (e + 1) % 4,
            a = values[e].potential - level,
            b = values[next].potential - level;
          if ((a < 0 && b >= 0) || (a >= 0 && b < 0)) {
            const u = a / (a - b);
            crossings.push({
              x: corners[e].x + u * (corners[next].x - corners[e].x),
              y: corners[e].y + u * (corners[next].y - corners[e].y),
            });
          }
        }
        if (crossings.length === 2) result.push({ level, a: crossings[0], b: crossings[1] });
      }
    }
  return result;
}
export const fieldFragments = Array.from({ length: 117 }, (_, i) => {
  const col = i % 13,
    row = Math.floor(i / 13),
    jitter = (n: number) => Math.sin(n * 19.731) * 0.0025;
  return {
    x: -0.161 + col * 0.0268 + jitter(i + 3),
    y: -0.12 + row * 0.03 + jitter(i + 91),
    initial: (i * 2.39996) % Math.PI,
  };
});
