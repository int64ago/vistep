/** Ideal Kepler ellipse in AU and normalized solar years: μ = 4π² AU³/year².
 * The central focus is fixed; no perturbations, barycentric wobble or relativity. */
export const KEPLER_MU = 4 * Math.PI ** 2;
const TAU = 2 * Math.PI;
export function keplerE(meanAnomaly: number, eccentricity: number) {
  if (
    !Number.isFinite(meanAnomaly) ||
    !Number.isFinite(eccentricity) ||
    eccentricity < 0 ||
    eccentricity >= 1
  )
    throw new RangeError('Elliptic orbit requires 0 ≤ e < 1');
  const turns = Math.floor((meanAnomaly + Math.PI) / TAU),
    m = meanAnomaly - turns * TAU;
  let e = m + eccentricity * Math.sin(m);
  for (let i = 0; i < 30; i++) {
    const change = (e - eccentricity * Math.sin(e) - m) / (1 - eccentricity * Math.cos(e));
    e -= change;
    if (Math.abs(change) < 1e-13) break;
  }
  return e + turns * TAU;
}
export function keplerAt(eccentricity: number, semiMajorAU = 1, phase = 0) {
  if (!Number.isFinite(semiMajorAU) || semiMajorAU <= 0 || !Number.isFinite(phase))
    throw new RangeError('Invalid orbital size or phase');
  const E = keplerE(TAU * phase, eccentricity),
    a = semiMajorAU,
    b = a * Math.sqrt(1 - eccentricity ** 2);
  const x = a * (Math.cos(E) - eccentricity),
    y = b * Math.sin(E),
    radius = a * (1 - eccentricity * Math.cos(E));
  const angularRate = Math.sqrt(KEPLER_MU / a ** 3) / (1 - eccentricity * Math.cos(E));
  const vx = -a * Math.sin(E) * angularRate,
    vy = b * Math.cos(E) * angularRate;
  return {
    x,
    y,
    vx,
    vy,
    radius,
    speed: Math.hypot(vx, vy),
    relativeSpeed: Math.hypot(vx, vy) / Math.sqrt(KEPLER_MU / a),
    period: a ** 1.5,
    E,
    a,
    b,
    energy: -KEPLER_MU / (2 * a),
    angularMomentum: x * vy - y * vx,
  };
}
export function keplerSector(
  eccentricity: number,
  semiMajorAU: number,
  startPhase: number,
  durationPhase: number,
  segments = 120,
) {
  if (
    !Number.isFinite(durationPhase) ||
    durationPhase < 0 ||
    durationPhase > 1 ||
    !Number.isInteger(segments) ||
    segments < 2
  )
    throw new RangeError('Invalid sector interval');
  const first = keplerAt(eccentricity, semiMajorAU, startPhase),
    last = keplerAt(eccentricity, semiMajorAU, startPhase + durationPhase);
  const points = Array.from({ length: segments + 1 }, (_, i) => {
    const point = keplerAt(eccentricity, semiMajorAU, startPhase + (durationPhase * i) / segments);
    return { x: point.x, y: point.y };
  });
  const area =
    ((first.a * first.b) / 2) *
    (last.E - first.E - eccentricity * (Math.sin(last.E) - Math.sin(first.E)));
  return {
    points,
    area,
    fraction: area / (Math.PI * first.a * first.b),
    duration: durationPhase * first.period,
  };
}
