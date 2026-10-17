/** IAU parsec in astronomical units; angular conversion is arcseconds per radian. */
export const PARALLAX_AU_PER_PC = 648000 / Math.PI;
export function parallaxModel(distance = 1, baseline = 1, latitude = 90, motion = 0) {
  if (
    !Number.isFinite(distance) ||
    distance < 0.2 ||
    distance > 10 ||
    !Number.isFinite(baseline) ||
    baseline < 0 ||
    baseline > 2 ||
    !Number.isFinite(latitude) ||
    latitude < 0 ||
    latitude > 90 ||
    !Number.isFinite(motion) ||
    Math.abs(motion) > 1
  )
    throw new RangeError('Invalid parallax parameters');
  const angle = Math.atan2(baseline, distance * PARALLAX_AU_PER_PC),
    arcseconds = angle * PARALLAX_AU_PER_PC;
  return { distance, baseline, latitude, motion, angle, arcseconds };
}
export function parallaxState(year: number, model = parallaxModel()) {
  if (!Number.isFinite(year) || year < 0 || year > 2) throw new RangeError('Epoch0–2 years');
  const phase = year * 2 * Math.PI,
    beta = (model.latitude * Math.PI) / 180,
    observer = { x: model.baseline * Math.cos(phase), y: model.baseline * Math.sin(phase) },
    depth = model.distance * PARALLAX_AU_PER_PC - observer.x * Math.cos(beta),
    u = Math.atan2(-observer.y, depth) * PARALLAX_AU_PER_PC,
    v = Math.atan2(observer.x * Math.sin(beta), depth) * PARALLAX_AU_PER_PC;
  return { year, observer, parallaxX: u, parallaxY: v, x: u + model.motion * year, y: v };
}
export function parallaxDistance(baseline: number, arcseconds: number) {
  if (!Number.isFinite(baseline) || baseline < 0 || !Number.isFinite(arcseconds) || arcseconds < 0)
    throw new RangeError('Invalid baseline/parallax');
  return baseline === 0 || arcseconds === 0
    ? null
    : baseline / Math.tan(arcseconds / PARALLAX_AU_PER_PC) / PARALLAX_AU_PER_PC;
}
