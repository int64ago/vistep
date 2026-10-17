/** Upright prism in a large constant-level, incompressible liquid reservoir. */
export interface BuoyancyOptions {
  mass?: number;
  fluidDensity?: number;
  area?: number;
  height?: number;
  drag?: number;
}
export function buoyancy(depth: number, o: BuoyancyOptions = {}) {
  const mass = o.mass ?? 0.84,
    fluidDensity = o.fluidDensity ?? 1000,
    area = o.area ?? 0.01,
    height = o.height ?? 0.12,
    drag = o.drag ?? 18,
    g = 9.81;
  if (
    !Number.isFinite(depth) ||
    ![mass, fluidDensity, area, height].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isFinite(drag) ||
    drag < 0
  )
    throw new RangeError('Physical prism and fluid parameters required');
  const immersed = Math.max(0, Math.min(height, depth)),
    displaced = area * immersed,
    topPressure = fluidDensity * g * Math.max(0, depth - height),
    bottomPressure = fluidDensity * g * Math.max(0, depth),
    force = (bottomPressure - topPressure) * area,
    weight = mass * g,
    equilibrium = mass / (fluidDensity * area),
    floats = equilibrium <= height;
  return {
    depth,
    mass,
    fluidDensity,
    area,
    height,
    drag,
    g,
    immersed,
    displaced,
    topPressure,
    bottomPressure,
    force,
    weight,
    equilibrium,
    floats,
    netDown: weight - force,
  };
}
/** Deterministic RK4. depth is bottom depth positive downward; damping is phenomenological. */
export function buoyancyMotion(
  time: number,
  o: BuoyancyOptions = {},
  depth0 = 0.16,
  velocity0 = 0,
) {
  if (!Number.isFinite(time) || time < 0 || time > 10)
    throw new RangeError('Motion time must be between zero and ten seconds');
  const b = buoyancy(depth0, o),
    steps = Math.max(1, Math.ceil(time * 600)),
    dt = time / steps;
  let depth = depth0,
    velocity = velocity0;
  const acceleration = (y: number, v: number) => {
    const s = buoyancy(y, o);
    return (s.netDown - b.drag * v) / b.mass;
  };
  for (let i = 0; i < steps; i++) {
    const a1 = acceleration(depth, velocity),
      v2 = velocity + (a1 * dt) / 2,
      y2 = depth + (velocity * dt) / 2,
      a2 = acceleration(y2, v2),
      v3 = velocity + (a2 * dt) / 2,
      y3 = depth + (v2 * dt) / 2,
      a3 = acceleration(y3, v3),
      v4 = velocity + a3 * dt,
      y4 = depth + v3 * dt,
      a4 = acceleration(y4, v4);
    depth += (dt * (velocity + 2 * v2 + 2 * v3 + v4)) / 6;
    velocity += (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
  }
  return { ...buoyancy(depth, o), velocity };
}
export function buoyancyShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = {
      mass: 0.84,
      fluidDensity: 1000,
      area: 0.01,
      height: 0.12,
      drag: 18,
      depth: 0.12 * p,
      velocity: 0,
      held: true,
    };
  if (chapter === 1) return { ...base, depth: 0.14 + 0.1 * p };
  if (chapter === 2) {
    const s = buoyancyMotion(p * 2);
    return { ...base, depth: s.depth, velocity: s.velocity, held: false };
  }
  if (chapter === 3) {
    const mass = 0.84 + 0.3 * p;
    return { ...base, mass, depth: mass / 10, held: false };
  }
  if (chapter === 4) {
    const s = buoyancyMotion(p * 0.5, { mass: 1.44 });
    return { ...base, mass: 1.44, depth: s.depth, velocity: s.velocity, held: false };
  }
  if (chapter === 5) {
    const fluidDensity = 800 + 400 * p;
    return { ...base, fluidDensity, depth: 0.84 / (fluidDensity * 0.01), held: false };
  }
  return base;
}
