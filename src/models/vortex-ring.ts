/** Circular Rosenhead-regularized vortex filament; ideal inviscid teaching model. */
export function ellipticKE(m: number) {
  if (!Number.isFinite(m) || m < 0 || m >= 1)
    throw new RangeError('Elliptic parameter must lie in [0,1)');
  let a = 1,
    b = Math.sqrt(1 - m),
    sum = m / 2,
    factor = 1;
  for (let i = 0; i < 20; i++) {
    const c = (a - b) / 2;
    sum += factor * c * c;
    const next = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = next;
    factor *= 2;
    if (Math.abs(c) < 1e-15) break;
  }
  const K = Math.PI / (2 * a);
  return { K, E: K * (1 - sum) };
}
export interface VortexOptions {
  radius?: number;
  circulation?: number;
  coreRatio?: number;
}
export function vortexRing(o: VortexOptions = {}) {
  const radius = o.radius ?? 0.02,
    circulation = o.circulation ?? 0.001,
    coreRatio = o.coreRatio ?? 0.12;
  if (
    !Number.isFinite(radius) ||
    radius <= 0 ||
    !Number.isFinite(circulation) ||
    !Number.isFinite(coreRatio) ||
    coreRatio < 0.06 ||
    coreRatio > 0.25
  )
    throw new RangeError(
      'Positive ring radius, finite circulation and core ratio .06–.25 required',
    );
  const core = radius * coreRatio,
    self = vortexField(0, radius, 0, { radius, circulation, coreRatio }).axial;
  return { radius, circulation, coreRatio, core, self };
}
/** Lab-frame field. x is ring axis; y,z span the plane of the circular filament. */
export function vortexField(x: number, y: number, z = 0, o: VortexOptions = {}) {
  const R = o.radius ?? 0.02,
    G = o.circulation ?? 0.001,
    a = R * (o.coreRatio ?? 0.12),
    r = Math.hypot(y, z),
    A = (R + r) ** 2 + x * x + a * a,
    B = (R - r) ** 2 + x * x + a * a;
  if (r < R * 1e-7)
    return { axial: (G * R * R) / (2 * (R * R + x * x + a * a) ** 1.5), radial: 0, vy: 0, vz: 0 };
  const { K, E } = ellipticKE((4 * R * r) / A),
    factor = G / (2 * Math.PI * Math.sqrt(A)),
    axial = factor * (K + ((R * R - r * r - x * x - a * a) / B) * E),
    radial = ((factor * x) / r) * (-K + ((R * R + r * r + x * x + a * a) / B) * E);
  return { axial, radial, vy: (radial * y) / r, vz: (radial * z) / r };
}
/** Dimensionless co-moving tracer history; no closure or endpoint snapping. */
export function vortexTrail(
  seed: { x: number; y: number },
  coreRatio = 0.12,
  end = 32,
  dt = 0.02,
  sign = 1,
) {
  const o = { radius: 1, circulation: sign, coreRatio },
    self = vortexField(0, 1, 0, o).axial,
    field = (x: number, y: number) => {
      const f = vortexField(x, y, 0, o);
      return { x: f.axial - self, y: f.vy };
    };
  const points = [{ ...seed, time: 0 }];
  let { x, y } = seed;
  const n = Math.ceil(end / dt),
    step = end / n;
  for (let i = 0; i < n; i++) {
    const a = field(x, y),
      b = field(x + (a.x * step) / 2, y + (a.y * step) / 2),
      c = field(x + (b.x * step) / 2, y + (b.y * step) / 2),
      d = field(x + c.x * step, y + c.y * step);
    x += (step * (a.x + 2 * b.x + 2 * c.x + d.x)) / 6;
    y += (step * (a.y + 2 * b.y + 2 * c.y + d.y)) / 6;
    points.push({ x, y, time: (i + 1) * step });
  }
  return points;
}
export function vortexMarker(trail: ReturnType<typeof vortexTrail>, time: number) {
  const t = Math.max(0, Math.min(trail.at(-1)!.time, time)),
    i = Math.min(trail.length - 2, Math.floor(t / trail[1].time)),
    a = trail[i],
    b = trail[i + 1],
    q = (t - a.time) / (b.time - a.time);
  return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q };
}
export function vortexShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = { radius: 0.02, circulation: 0.001, coreRatio: 0.12, angle: 0, slice: true, lab: false };
  if (chapter === 0) return { ...base, angle: ((1 - p) * Math.PI) / 2, slice: p > 0.6 };
  if (chapter === 2) return { ...base, circulation: 0.0005 + 0.0015 * p };
  if (chapter === 3) return { ...base, radius: 0.015 + 0.015 * p };
  if (chapter === 4) return { ...base, lab: true };
  if (chapter === 5) return { ...base, coreRatio: p < 0.5 ? 0.08 : 0.2 };
  return base;
}
