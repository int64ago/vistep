/** Plane elastic body waves in a homogeneous isotropic teaching medium. */
export type SeismicMaterial = { bulk: number; shear: number; density: number };
export const seismicRock: SeismicMaterial = { bulk: 50e9, shear: 30e9, density: 2700 };
export function seismicSpeeds(m: SeismicMaterial) {
  if (
    ![m.bulk, m.shear, m.density].every(Number.isFinite) ||
    m.bulk <= 0 ||
    m.shear < 0 ||
    m.density <= 0
  )
    throw new RangeError('Positive bulk modulus and density; nonnegative shear modulus required');
  return {
    p: Math.sqrt((m.bulk + (4 * m.shear) / 3) / m.density),
    s: Math.sqrt(m.shear / m.density),
  };
}
export function seismicPulse(t: number) {
  if (t <= 0 || t >= 6) return 0;
  return Math.sin((Math.PI * t) / 6) ** 2 * Math.sin(2 * Math.PI * 0.2 * t);
}
export function seismicParticle(m: SeismicMaterial, kind: 'p' | 's', x: number, time: number) {
  const speed = seismicSpeeds(m)[kind],
    arrival = speed > 0 ? x / speed : Infinity,
    signal = speed > 0 ? seismicPulse(time - arrival) : 0;
  return { x: kind === 'p' ? signal : 0, y: kind === 's' ? signal : 0, signal, arrival };
}
export function seismicArrival(m: SeismicMaterial, distance: number) {
  if (!Number.isFinite(distance) || distance < 0)
    throw new RangeError('Nonnegative distance required');
  const v = seismicSpeeds(m);
  return {
    p: distance / v.p,
    s: v.s ? distance / v.s : null,
    gap: v.s ? distance / v.s - distance / v.p : null,
  };
}
export function seismicShot(chapter: number, progress: number) {
  const i = Math.max(0, Math.min(7, chapter)),
    p = Math.max(0, Math.min(1, progress));
  const material = { ...seismicRock, shear: i === 6 ? 0 : 30e9 };
  const distance = i === 5 ? 60000 + 100000 * p : 120000;
  let time = p * 49;
  if (i === 1) time = 9 + p * 6;
  if (i === 2) time = 10 + p * 15;
  if (i === 3) time = 12 + p * 18;
  if (i === 4) time = 18 + p * 25;
  if (i === 6) time = p * 49;
  return { material, distance, time, focus: i, ...seismicArrival(material, distance) };
}
