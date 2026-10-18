const mu0 = 4 * Math.PI * 1e-7,
  susceptibility = -9.05e-6,
  density = 1000;
export function magneticLift(z: number, peak = 16, uniform = false) {
  const width = 0.05,
    field = uniform ? peak : peak * Math.exp((-z * z) / (2 * width * width)),
    gradient = uniform ? 0 : (-z / (width * width)) * field;
  return {
    field,
    gradient,
    acceleration: (susceptibility * field * gradient) / (mu0 * density),
    requiredProduct: (density * 9.8 * mu0) / susceptibility,
  };
}
export function levitationEquilibrium(peak: number) {
  const turn = 0.05 / Math.sqrt(2);
  if (magneticLift(turn, peak).acceleration < 9.8) return null;
  let lo = turn,
    hi = 0.2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (magneticLift(mid, peak).acceleration > 9.8) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
/** One-axis dynamics with linear damping. Radial trapping is not inferred. */
export function levitatingSample(time: number, peak = 16, uniform = false, perturb = false) {
  const dt = 1 / 240,
    end = Math.max(0, time),
    eq = uniform ? null : levitationEquilibrium(peak);
  let z = perturb && eq !== null ? eq : 0.025,
    v = 0,
    t = 0,
    kicked = false;
  const acc = (pos: number, vel: number) =>
    magneticLift(pos, peak, uniform).acceleration - 9.8 - 3 * vel;
  while (t < end - 1e-12) {
    const h = Math.min(dt, end - t);
    if (perturb && !kicked && t >= 0.3) {
      v -= 0.12;
      kicked = true;
    }
    const a1 = acc(z, v),
      z2 = z + (v * h) / 2,
      v2 = v + (a1 * h) / 2,
      a2 = acc(z2, v2),
      z3 = z + (v2 * h) / 2,
      v3 = v + (a2 * h) / 2,
      a3 = acc(z3, v3),
      z4 = z + v3 * h,
      v4 = v + a3 * h,
      a4 = acc(z4, v4);
    z += (h * (v + 2 * v2 + 2 * v3 + v4)) / 6;
    v += (h * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
    if (z < 0.006) {
      z = 0.006;
      v = Math.max(0, v);
    }
    t += h;
  }
  return { z, v, equilibrium: eq, ...magneticLift(z, peak, uniform) };
}
