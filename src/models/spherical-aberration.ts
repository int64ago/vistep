export type AberrationOptions = {
  radius?: number;
  aperture?: number;
  correction?: number;
  angle?: number;
};
export function aberrationSetup({
  radius: R = 100,
  aperture: A = 40,
  correction = 0,
  angle = 0,
}: AberrationOptions = {}) {
  if (
    ![R, A, correction, angle].every(Number.isFinite) ||
    R <= 0 ||
    A <= 0 ||
    A > R * 0.45 ||
    correction < 0 ||
    correction > 1 ||
    Math.abs(angle) > 5
  )
    throw new RangeError('Invalid mirror');
  return { R, A, correction, angle, focal: R / 2 };
}
export function aberrationSurface(r: number, options: AberrationOptions = {}) {
  const s = aberrationSetup(options);
  if (!Number.isFinite(r) || Math.abs(r) > s.A + 1e-9) throw new RangeError('Outside pupil');
  const root = Math.sqrt(s.R * s.R - r * r),
    z = (1 - s.correction) * (root - s.R) - (s.correction * r * r) / (2 * s.R),
    slope = (-(1 - s.correction) * r) / root - (s.correction * r) / s.R;
  return { r, z, slope };
}
/** Exact 3D specular reflection at a rotationally symmetric spherical/aspheric surface. */
export function aberrationRay(r: number, azimuth = 0, options: AberrationOptions = {}) {
  const s = aberrationSetup(options),
    surface = aberrationSurface(r, options),
    a = (s.angle * Math.PI) / 180,
    c = Math.cos(azimuth),
    si = Math.sin(azimuth),
    length = Math.hypot(1, surface.slope),
    normal = [1 / length, (-surface.slope * c) / length, (-surface.slope * si) / length],
    incoming = [Math.cos(a), Math.sin(a), 0],
    dot = incoming.reduce((v, d, i) => v + d * normal[i], 0),
    outgoing = incoming.map((d, i) => d - 2 * dot * normal[i]),
    hit = { z: surface.z, x: r * c, y: r * si };
  const at = (z: number) => ({
    z,
    x: hit.x + ((z - hit.z) * outgoing[1]) / outgoing[0],
    y: hit.y + ((z - hit.z) * outgoing[2]) / outgoing[0],
  });
  const axisAt = Math.abs(outgoing[1]) < 1e-12 ? null : hit.z - (hit.x * outgoing[0]) / outgoing[1];
  return { surface, hit, normal, incoming, outgoing, at, axisAt };
}
/** On-axis least-squares receiving plane for a uniformly illuminated circular pupil. */
export function aberrationBestScreen(options: AberrationOptions = {}) {
  const s = aberrationSetup(options);
  let numerator = 0,
    denominator = 0;
  for (let i = 0; i < 128; i++) {
    const r = s.A * Math.sqrt((i + 0.5) / 128),
      ray = aberrationRay(r, 0, { ...options, angle: 0 }),
      m = ray.outgoing[1] / ray.outgoing[0];
    numerator += m * (r - ray.hit.z * m);
    denominator += m * m;
  }
  return -numerator / denominator;
}
export function aberrationSpot(
  screen = -50,
  options: AberrationOptions = {},
  radial = 12,
  azimuthal = 20,
) {
  if (!Number.isFinite(screen) || screen >= 0) throw new RangeError('Invalid screen');
  const s = aberrationSetup(options),
    points = Array.from({ length: radial * azimuthal }, (_, i) => {
      const ring = Math.floor(i / azimuthal),
        r = s.A * Math.sqrt((ring + 0.5) / radial),
        angle = (((i % azimuthal) + (ring % 2) * 0.5) * 2 * Math.PI) / azimuthal;
      return aberrationRay(r, angle, options).at(screen);
    }),
    centroid = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    },
    rms = Math.sqrt(
      points.reduce((sum, p) => sum + (p.x - centroid.x) ** 2 + (p.y - centroid.y) ** 2, 0) /
        points.length,
    ),
    chief = aberrationRay(0, 0, options).at(screen);
  return { points, centroid, rms, chief, throughput: (s.A / 40) ** 2 };
}
export function aberrationShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    aperture = chapter === 3 ? 40 - 30 * p : 40,
    correction = chapter === 4 ? p : chapter === 5 ? 1 : 0,
    angle = chapter === 5 ? 3 * p : 0,
    options = { aperture, correction, angle };
  return {
    ...options,
    screen: chapter === 2 ? -50 + 4.5 * p : chapter === 3 ? aberrationBestScreen(options) : -50,
    close: chapter > 0 && chapter !== 3,
  };
}
