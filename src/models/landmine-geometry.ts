/** Dimensionless exterior artwork coordinates. Reference: Smithsonian NMAH
 * nmah_407167, German Model 43 Tellermine. Only the sealed external silhouette is
 * reconstructed. No physical scale, internal mechanism, or operating detail. */
export type LandminePoint = [number, number, number];
export const LANDMINE_SHELL_PROFILE: readonly [number, number][] = [
  [0, 0.44],
  [0.89, 0.44],
  [1.02, 0.465],
  [1.08, 0.5],
  [1.105, 0.55],
  [1.105, 0.76],
  [1.082, 0.8],
  [1.055, 0.82],
  [0.98, 0.9],
  [0.86, 0.96],
  [0.68, 1.005],
  [0.5, 1.025],
  [0, 1.025],
];
export const LANDMINE_COVER_PROFILE: readonly [number, number][] = [
  [0, 1.025],
  [0.49, 1.025],
  [0.5, 1.04],
  [0.55, 1.062],
  [0.56, 1.115],
  [0.55, 1.14],
  [0.46, 1.16],
  [0, 1.16],
];
export const LANDMINE_HANDLE: readonly LandminePoint[] = [
  [-1.05, 0.61, -0.27],
  [-1.23, 0.59, -0.27],
  [-1.4, 0.54, -0.22],
  [-1.42, 0.53, -0.13],
  [-1.42, 0.53, 0.23],
  [-1.37, 0.54, 0.31],
  [-1.2, 0.59, 0.33],
  [-1.04, 0.61, 0.33],
];
export const LANDMINE_GROUND = { halfWidth: 2.65, back: -1.9, front: 1.9, floor: 0.025 };
export function landmineNoise(x: number, y: number, seed = 0) {
  const v = Math.sin(x * 127.1 + y * 311.7 + seed * 17.23) * 43758.5453;
  return v - Math.floor(v);
}
export function landmineSurface(x: number, z: number) {
  return (
    1.28 +
    0.041 * Math.sin(x * 2.3 + z * 1.9) +
    0.025 * Math.sin(x * 7.1 - z * 4.2) +
    0.009 * Math.cos(x * 21 + z * 17)
  );
}
export function landmineCut(reveal: number) {
  const p = Number.isFinite(reveal) ? Math.max(0, Math.min(1, reveal)) : 0;
  return LANDMINE_GROUND.front - p * (LANDMINE_GROUND.front + 0.95);
}
export function landmineProfilePoint(radius: number, y: number, angle: number): LandminePoint {
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
}
export function landminePlant(index: number) {
  const x = (landmineNoise(index, 1) * 2 - 1) * (LANDMINE_GROUND.halfWidth - 0.1);
  const z =
    LANDMINE_GROUND.back +
    0.08 +
    landmineNoise(index, 2) * (LANDMINE_GROUND.front - LANDMINE_GROUND.back - 0.16);
  return {
    x,
    z,
    y: landmineSurface(x, z),
    height: 0.12 + landmineNoise(index, 3) * 0.22,
    angle: landmineNoise(index, 4) * Math.PI * 2,
  };
}

/** Highest exterior-shell profile intersection at one display radius. The slope
 * orients attached dirt to the casing instead of embedding it beneath the dome. */
export function landmineShellTop(radius: number) {
  if (!Number.isFinite(radius)) throw new RangeError('Finite exterior radius required');
  const r = Math.max(0, Math.min(1.105, radius));
  let height = -Infinity,
    slope = 0;
  for (let i = 0; i < LANDMINE_SHELL_PROFILE.length - 1; i++) {
    const [a, ya] = LANDMINE_SHELL_PROFILE[i],
      [b, yb] = LANDMINE_SHELL_PROFILE[i + 1];
    if (r < Math.min(a, b) - 1e-12 || r > Math.max(a, b) + 1e-12) continue;
    const candidate =
      Math.abs(b - a) < 1e-12 ? Math.max(ya, yb) : ya + ((r - a) / (b - a)) * (yb - ya);
    if (candidate > height) {
      height = candidate;
      slope = Math.abs(b - a) < 1e-12 ? 0 : (yb - ya) / (b - a);
    }
  }
  return { height, slope };
}
export const LANDMINE_DIRT_COUNT = 30;
export function landmineDirt(index: number) {
  const angle = landmineNoise(index, 3) * Math.PI * 2;
  let radius = 0.6 + landmineNoise(index, 4) * 0.35;
  // Keep the tiny attached ellipsoids within a smooth part of the exterior
  // profile, rather than bridging a change in the dome's slope.
  for (const joint of [0.68, 0.86])
    if (Math.abs(radius - joint) < 0.021) radius = joint + (radius < joint ? -0.021 : 0.021);
  const { height, slope } = landmineShellTop(radius),
    length = Math.sqrt(1 + slope * slope),
    c = Math.cos(angle),
    s = Math.sin(angle);
  const normal: LandminePoint = [(-slope * c) / length, 1 / length, (-slope * s) / length];
  const radial: LandminePoint = [c / length, slope / length, s / length],
    lateral: LandminePoint = [-s, 0, c];
  const position: LandminePoint = [
    radius * c + normal[0] * 0.001,
    height + normal[1] * 0.001,
    radius * s + normal[2] * 0.001,
  ];
  return {
    position,
    normal,
    radial,
    lateral,
    radius,
    angle,
    size: [0.01 + landmineNoise(index, 5) * 0.008, 0.002, 0.009] as LandminePoint,
  };
}
