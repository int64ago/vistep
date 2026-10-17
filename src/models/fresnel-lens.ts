export type FresnelOptions = {
  focal?: number;
  radius?: number;
  pitch?: number;
  index?: number;
  base?: number;
};
export type FresnelDesign = ReturnType<typeof fresnelDesign>;
/** Ideal curved annular refracting surfaces; geometric optics, lengths in mm. */
export function fresnelDesign(options: FresnelOptions = {}) {
  const { focal: F = 100, radius: R = 30, pitch = 3, index: n = 1.49, base = 3 } = options;
  if (
    ![F, R, pitch, n, base].every(Number.isFinite) ||
    F < 70 ||
    R <= 0 ||
    R > 30 ||
    pitch < 1 ||
    pitch > 5 ||
    n < 1.4 ||
    n > 1.7 ||
    base < 2.5 ||
    base >= F / 4
  )
    throw new RangeError('Invalid Fresnel design');
  return { F, R, pitch, n, base, rings: Math.ceil(R / pitch) };
}
/** n*t + distance(exit, focus) = K; stable smaller quadratic root. */
export function fresnelThickness(r: number, K: number, s: FresnelDesign) {
  const A = s.n * s.n - 1,
    B = 2 * s.F - 2 * s.n * K,
    C = K * K - s.F * s.F - r * r,
    discriminant = B * B - 4 * A * C;
  if (discriminant < 0) throw new RangeError('Surface has no real branch');
  return (2 * C) / (-B + Math.sqrt(discriminant));
}
export function fresnelZone(r: number, s: FresnelDesign) {
  if (!Number.isFinite(r) || Math.abs(r) > s.R + 1e-9) throw new RangeError('Outside aperture');
  return Math.min(s.rings - 1, Math.floor(Math.abs(r) / s.pitch));
}
export function fresnelConstant(zone: number, s: FresnelDesign, continuous = false) {
  const mid = continuous ? s.R : zone === 0 ? 0 : Math.min(s.R, (zone + 0.5) * s.pitch);
  return s.n * s.base + Math.hypot(mid, s.F - s.base);
}
export function fresnelSurface(
  r: number,
  s: FresnelDesign,
  continuous = false,
  zoneOverride?: number,
) {
  const zone = zoneOverride ?? fresnelZone(r, s),
    K = fresnelConstant(zone, s, continuous),
    z = fresnelThickness(r, K, s),
    distance = Math.hypot(r, s.F - z),
    slope = -r / (s.n * distance - (s.F - z));
  return { r, z, slope, K, zone };
}
/** Vector Snell refraction at the actual surface normal; index matching is supported. */
export function fresnelRay(r: number, s: FresnelDesign, continuous = false, outsideIndex = 1) {
  if (!Number.isFinite(outsideIndex) || outsideIndex <= 0)
    throw new RangeError('Invalid surrounding index');
  const surface = fresnelSurface(r, s, continuous),
    normalLength = Math.hypot(1, surface.slope),
    normal = { z: 1 / normalLength, r: -surface.slope / normalLength },
    eta = s.n / outsideIndex,
    cos = normal.z,
    discriminant = 1 - eta * eta * (1 - cos * cos);
  if (discriminant < -1e-12) return { surface, normal, outgoing: null, axisAt: null };
  const c = Math.sqrt(Math.max(0, discriminant)),
    outgoing = {
      z: eta * (1 - cos * normal.z) + c * normal.z,
      r: eta * (-cos * normal.r) + c * normal.r,
    },
    axisAt = Math.abs(outgoing.r) < 1e-12 ? null : surface.z - (r * outgoing.z) / outgoing.r;
  return { surface, normal, outgoing, axisAt };
}
/** Exact curved ring samples; resets are connected to form physical riser walls. */
export function fresnelProfile(s: FresnelDesign, continuous = false) {
  if (continuous)
    return Array.from({ length: 161 }, (_, i) =>
      fresnelSurface(-s.R + (2 * s.R * i) / 160, s, true),
    );
  const positive = Array.from({ length: s.rings }, (_, j) =>
    Array.from({ length: 13 }, (_, i) => {
      const lo = j * s.pitch,
        hi = Math.min(s.R, (j + 1) * s.pitch);
      return fresnelSurface(lo + ((hi - lo) * i) / 12, s, false, j);
    }),
  ).flat();
  return [
    ...positive
      .slice(1)
      .reverse()
      .map((p) => ({ ...p, r: -p.r, slope: -p.slope })),
    ...positive,
  ];
}
/** Rotational volume, integrating actual annuli with Simpson quadrature. */
export function fresnelVolume(s: FresnelDesign, continuous = false) {
  let integral = 0;
  for (let j = 0; j < s.rings; j++) {
    const lo = j * s.pitch,
      hi = Math.min(s.R, (j + 1) * s.pitch),
      N = 32,
      h = (hi - lo) / N;
    let sum = 0;
    for (let i = 0; i <= N; i++) {
      const r = lo + h * i,
        z = fresnelSurface(r, s, continuous, j).z;
      sum += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * r * z;
    }
    integral += (sum * h) / 3;
  }
  return (2 * Math.PI * integral) / 1000;
}
export function fresnelShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    continuous: chapter === 0,
    close: chapter === 2,
    compare: chapter === 3,
    outsideIndex: chapter === 4 ? 1 + 0.49 * p : 1,
    phase: chapter === 5,
    pitch: 3,
    focal: 100,
    radius: 22.5,
  };
}
