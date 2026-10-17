/** Jurin equilibrium and a high-viscosity, quasi-steady Washburn rise model. */
export type CapillaryConfig = {
  radius: number;
  angle: number;
  tension: number;
  density: number;
  viscosity: number;
};
export const capillaryDefault: CapillaryConfig = {
  radius: 0.00035,
  angle: 20,
  tension: 0.072,
  density: 1000,
  viscosity: 0.02,
};
export function capillaryEquilibrium(c: CapillaryConfig) {
  if (
    !Object.values(c).every(Number.isFinite) ||
    c.radius <= 0 ||
    c.tension <= 0 ||
    c.density <= 0 ||
    c.viscosity <= 0 ||
    c.angle < 0 ||
    c.angle > 180
  )
    throw new RangeError('Positive liquid properties and 0–180 degree contact angle required');
  const cosine = Math.cos((c.angle * Math.PI) / 180),
    height = (2 * c.tension * cosine) / (c.density * 9.81 * c.radius),
    up = 2 * Math.PI * c.radius * c.tension * cosine;
  return {
    height,
    cosine,
    capillaryForce: up,
    columnWeight: c.density * 9.81 * Math.PI * c.radius * c.radius * height,
    laplace: (2 * c.tension * cosine) / c.radius,
  };
}
export function capillaryFrame(c: CapillaryConfig, time: number) {
  if (!Number.isFinite(time) || time < 0 || time > 120)
    throw new RangeError('0–120 seconds required');
  const eq = capillaryEquilibrium(c),
    target = Math.abs(eq.height);
  let squared = 0;
  const steps = Math.max(1, Math.ceil(time / 0.002)),
    dt = time / steps,
    pressure = Math.abs(eq.laplace);
  for (let i = 0; i < steps; i++) {
    const derivative = (q: number) =>
      ((c.radius * c.radius) / (4 * c.viscosity)) *
      (pressure - c.density * 9.81 * Math.sqrt(Math.max(0, q)));
    const a = derivative(squared),
      b = derivative(Math.max(0, squared + (a * dt) / 2));
    squared = Math.max(0, Math.min(target * target, squared + dt * b));
  }
  const height = Math.sign(eq.height) * Math.sqrt(squared);
  return {
    ...eq,
    height,
    equilibriumHeight: eq.height,
    weight: c.density * 9.81 * Math.PI * c.radius * c.radius * height,
    time,
    config: c,
  };
}
/** Spherical meniscus section in an isotropically scaled close-up, relative to its center. */
export function capillaryMeniscus(radius: number, angle: number, count = 81) {
  const co = Math.cos((angle * Math.PI) / 180);
  return Array.from({ length: count }, (_, i) => {
    const x = radius * ((2 * i) / (count - 1) - 1);
    if (Math.abs(co) < 1e-7) return { x, z: 0 };
    const R = radius / Math.abs(co),
      root = Math.sqrt(Math.max(0, R * R - x * x));
    return { x, z: (Math.sign(co) * x * x) / (R + root) };
  });
}
export function capillaryShot(chapter: number, progress: number) {
  const i = Math.max(0, Math.min(7, chapter)),
    p = Math.max(0, Math.min(1, progress)),
    config = { ...capillaryDefault };
  let time = p * 18;
  if (i === 1 || i === 2) time = 18;
  if (i === 3) {
    config.radius = 0.0007 - 0.00045 * p;
    time = 25;
  }
  if (i === 4) time = p * 20;
  if (i === 5) {
    config.tension = 0.035 + 0.037 * p;
    time = 25;
  }
  if (i === 6) {
    config.angle = 20 + 95 * p;
    time = 25;
  }
  if (i === 7) time = 25;
  return { ...capillaryFrame(config, time), focus: i };
}
