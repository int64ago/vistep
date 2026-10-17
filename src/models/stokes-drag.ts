/** Rigid sphere, unbounded incompressible Newtonian fluid, steady creeping-flow trial. */
export interface StokesOptions {
  radius?: number;
  viscosity?: number;
  speed?: number;
  fluidDensity?: number;
  sphereDensity?: number;
  terminal?: boolean;
}
export function stokesDrag(o: StokesOptions = {}) {
  const radius = o.radius ?? 0.0003,
    viscosity = o.viscosity ?? 0.1,
    fluidDensity = o.fluidDensity ?? 1000,
    sphereDensity = o.sphereDensity ?? 2500,
    g = 9.81;
  if (![radius, viscosity, fluidDensity, sphereDensity].every((v) => Number.isFinite(v) && v > 0))
    throw new RangeError('Positive physical material parameters required');
  const volume = (4 * Math.PI * radius ** 3) / 3,
    weight = sphereDensity * volume * g,
    buoyancy = fluidDensity * volume * g,
    terminalSpeed = (2 * (sphereDensity - fluidDensity) * g * radius ** 2) / (9 * viscosity),
    speed = o.terminal ? terminalSpeed : (o.speed ?? 0.0005);
  if (!Number.isFinite(speed)) throw new RangeError('Finite signed relative speed required');
  const drag = 6 * Math.PI * viscosity * radius * speed,
    reynolds = (2 * radius * Math.abs(speed) * fluidDensity) / viscosity;
  return {
    radius,
    viscosity,
    fluidDensity,
    sphereDensity,
    volume,
    weight,
    buoyancy,
    terminalSpeed,
    speed,
    drag,
    reynolds,
    valid: reynolds <= 0.1,
  };
}
/** Meridional slice of the full 3D axisymmetric solution, far flow in +y. */
export function stokesField(x: number, y: number, o: StokesOptions = {}) {
  const s = stokesDrag(o),
    r = Math.hypot(x, y);
  if (r < s.radius * (1 - 1e-12)) return { ux: 0, uy: 0, pressure: 0, inside: true };
  const q = s.radius / r,
    f = 1 - 0.75 * q - 0.25 * q ** 3,
    h = -0.75 * q + 0.75 * q ** 3,
    dot = (s.speed * y) / r;
  return {
    ux: (x / r) * dot * h,
    uy: s.speed * f + (y / r) * dot * h,
    pressure: (-1.5 * s.viscosity * s.radius * s.speed * y) / r ** 3,
    inside: false,
  };
}
/** Unit-speed time coordinate on actual axisymmetric streamfunction contours. */
export function stokesStreamline(impact: number, radius = 0.0003) {
  if (impact === 0)
    throw new RangeError('Axis stagnation streamline is not an advected through-line');
  const sign = Math.sign(impact),
    b = Math.abs(impact),
    points = Array.from({ length: 101 }, (_, i) => {
      const y = -0.0013 + (0.0026 * i) / 100;
      let lo = Math.sqrt(Math.max(0, radius ** 2 - y * y)),
        hi = Math.max(0.003, b * 5);
      for (let k = 0; k < 28; k++) {
        const x = (lo + hi) / 2,
          r = Math.hypot(x, y),
          value = x * x * (1 - (1.5 * radius) / r + 0.5 * (radius / r) ** 3);
        if (value < b * b) lo = x;
        else hi = x;
      }
      const x = ((lo + hi) / 2) * sign,
        v = stokesField(x, y, { radius, speed: 1 }).uy;
      return { x, y, clock: 0, unitY: v };
    });
  for (let i = 1; i < points.length; i++)
    points[i].clock =
      points[i - 1].clock +
      (points[i].y - points[i - 1].y) * 0.5 * (1 / points[i].unitY + 1 / points[i - 1].unitY);
  return { points, length: points.at(-1)!.clock };
}
export function stokesMarker(
  line: ReturnType<typeof stokesStreamline>,
  speed: number,
  time: number,
  seed: number,
) {
  const clock = (((seed * line.length + speed * time) % line.length) + line.length) % line.length;
  let lo = 0,
    hi = line.points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (line.points[mid].clock < clock) lo = mid;
    else hi = mid;
  }
  const a = line.points[lo],
    b = line.points[hi],
    q = (clock - a.clock) / (b.clock - a.clock);
  return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q };
}
export function stokesShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = {
      radius: 0.0003,
      viscosity: 0.1,
      speed: 0.0005,
      fluidDensity: 1000,
      sphereDensity: 2500,
      terminal: false,
    };
  if (chapter === 1) return { ...base, speed: 0.0002 + 0.0006 * p };
  if (chapter === 2) return { ...base, viscosity: 0.1 + 0.3 * p };
  if (chapter === 3) return { ...base, radius: 0.00015 + 0.00015 * p };
  if (chapter === 4) return { ...base, terminal: true, sphereDensity: 1500 + 1000 * p };
  if (chapter === 5) return { ...base, terminal: true, viscosity: 0.1 * 10 ** (-2 * p) };
  return base;
}
