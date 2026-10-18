/** Uniform upright wood rod; compact iron ballast remains submerged over the offered domain. */
export const floatConstants = {
  rho: 1000,
  rhoWood: 500,
  rhoIron: 7800,
  radius: 0.003,
  length: 0.24,
  ironMass: 0.001,
  g: 9.81,
};
export function floatParameters() {
  const a = floatConstants,
    area = Math.PI * a.radius * a.radius,
    mass = a.rhoWood * area * a.length + a.ironMass,
    wireVolume = a.ironMass / a.rhoIron,
    immersion = (mass / a.rho - wireVolume) / area,
    k = a.rho * a.g * area;
  return { ...a, area, mass, wireVolume, immersion, k, period: 2 * Math.PI * Math.sqrt(mass / k) };
}
export function floatForce(x: number, v = 0, damping = 0) {
  if (![x, v, damping].every(Number.isFinite) || damping < 0)
    throw new RangeError('Invalid float force');
  const p = floatParameters(),
    h = Math.max(0, Math.min(p.length, p.immersion - x)),
    buoyancy = p.rho * p.g * (p.area * h + p.wireVolume),
    weight = p.mass * p.g;
  return {
    h,
    buoyancy,
    weight,
    drag: -damping * v,
    net: buoyancy - weight - damping * v,
    partial: h > 0 && h < p.length,
  };
}
export function floatState(time: number, amplitude = 0.04, damping = 0.003) {
  if (
    ![time, amplitude, damping].every(Number.isFinite) ||
    time < 0 ||
    time > 15 ||
    amplitude < 0 ||
    amplitude > 0.12 ||
    damping < 0 ||
    damping > 0.02
  )
    throw new RangeError('Invalid float state');
  const p = floatParameters(),
    steps = Math.max(1, Math.ceil(time / 0.001)),
    dt = time / steps;
  let x = amplitude,
    v = 0;
  const f = (z: number, u: number) => floatForce(z, u, damping).net / p.mass;
  for (let i = 0; i < steps; i++) {
    const a1 = v,
      b1 = f(x, v),
      a2 = v + (b1 * dt) / 2,
      b2 = f(x + (a1 * dt) / 2, v + (b1 * dt) / 2),
      a3 = v + (b2 * dt) / 2,
      b3 = f(x + (a2 * dt) / 2, v + (b2 * dt) / 2),
      a4 = v + b3 * dt,
      b4 = f(x + a3 * dt, v + b3 * dt);
    x += (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
    v += (dt * (b1 + 2 * b2 + 2 * b3 + b4)) / 6;
  }
  return { time, x, v, ...floatForce(x, v, damping), ...p };
}
/** Potential integral of the clipped hydrostatic force, relative to equilibrium. */
export function floatPotential(x: number) {
  const p = floatParameters(),
    low = p.immersion - p.length,
    high = p.immersion;
  if (x < low) return 0.5 * p.k * low * low - p.k * low * (low - x);
  if (x > high) return 0.5 * p.k * high * high + p.k * high * (x - high);
  return 0.5 * p.k * x * x;
}
