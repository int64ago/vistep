export const greenhouseConstants = {
  sigma: 5.670374419e-8,
  surfaceCapacity: 8e7,
  atmosphereCapacity: 1e7,
  yearSeconds: 31557600,
};
function parameters(solar: number, albedo: number, epsilon: number) {
  if (
    !Number.isFinite(solar) ||
    solar < 600 ||
    solar > 1600 ||
    !Number.isFinite(albedo) ||
    albedo < 0 ||
    albedo > 0.9 ||
    !Number.isFinite(epsilon) ||
    epsilon < 0 ||
    epsilon > 1
  )
    throw new RangeError('Invalid gray-layer parameters');
}
export function greenhouseFlux(
  surface: number,
  atmosphere: number | null,
  epsilon = 0.8,
  solar = 1361,
  albedo = 0.3,
) {
  parameters(solar, albedo, epsilon);
  if (
    !Number.isFinite(surface) ||
    surface < 50 ||
    surface > 450 ||
    (atmosphere !== null &&
      (!Number.isFinite(atmosphere) || atmosphere < 50 || atmosphere > 450)) ||
    (epsilon > 0 && atmosphere === null)
  )
    throw new RangeError('Invalid radiative temperatures');
  const incoming = (solar * (1 - albedo)) / 4,
    emission = greenhouseConstants.sigma * surface ** 4,
    atmosphereEmission = atmosphere === null ? 0 : greenhouseConstants.sigma * atmosphere ** 4,
    absorbed = epsilon * emission,
    direct = (1 - epsilon) * emission,
    up = epsilon * atmosphereEmission,
    down = up,
    outgoing = direct + up,
    surfaceNet = incoming + down - emission,
    atmosphereNet = absorbed - up - down,
    net = incoming - outgoing;
  return {
    incoming,
    emission,
    absorbed,
    direct,
    up,
    down,
    outgoing,
    surfaceNet,
    atmosphereNet,
    net,
  };
}
export function greenhouseEquilibrium(epsilon = 0.8, solar = 1361, albedo = 0.3) {
  parameters(solar, albedo, epsilon);
  const incoming = (solar * (1 - albedo)) / 4,
    surface = (incoming / (greenhouseConstants.sigma * (1 - epsilon / 2))) ** 0.25,
    atmosphere = epsilon === 0 ? null : surface / 2 ** 0.25;
  return { surface, atmosphere, ...greenhouseFlux(surface, atmosphere, epsilon, solar, albedo) };
}
/** Step epsilon from initial .4 equilibrium, retaining positive heat capacities; RK4 in SI seconds. */
export function greenhouseTrace(epsilon = 0.8, solar = 1361, albedo = 0.3, years = 5, steps = 400) {
  parameters(solar, albedo, epsilon);
  if (
    !Number.isFinite(years) ||
    years < 0 ||
    years > 20 ||
    !Number.isInteger(steps) ||
    steps < 100 ||
    steps > 4000
  )
    throw new RangeError('Invalid integration interval');
  // Bound the RK4 step across the public interval, including long runs requested with few steps.
  steps = Math.max(steps, Math.ceil((years * 365.25) / 5));
  const initial = greenhouseEquilibrium(0.4, solar, albedo),
    Cs = greenhouseConstants.surfaceCapacity,
    Ca = greenhouseConstants.atmosphereCapacity,
    dt = (years * greenhouseConstants.yearSeconds) / steps;
  const derivative = (s: number, a: number) => {
    const f = greenhouseFlux(s, a, epsilon, solar, albedo);
    return { s: f.surfaceNet / Cs, a: f.atmosphereNet / Ca };
  };
  let surface = initial.surface,
    atmosphere = initial.atmosphere!;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    points.push({
      time: (years * i) / steps,
      surface,
      atmosphere,
      stored: Cs * (surface - initial.surface) + Ca * (atmosphere - initial.atmosphere!),
      ...greenhouseFlux(surface, atmosphere, epsilon, solar, albedo),
    });
    if (i === steps) break;
    const k1 = derivative(surface, atmosphere),
      k2 = derivative(surface + (dt * k1.s) / 2, atmosphere + (dt * k1.a) / 2),
      k3 = derivative(surface + (dt * k2.s) / 2, atmosphere + (dt * k2.a) / 2),
      k4 = derivative(surface + dt * k3.s, atmosphere + dt * k3.a);
    surface += (dt * (k1.s + 2 * k2.s + 2 * k3.s + k4.s)) / 6;
    atmosphere += (dt * (k1.a + 2 * k2.a + 2 * k3.a + k4.a)) / 6;
  }
  return points;
}
