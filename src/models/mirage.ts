export type MirageOptions = {
  groundTemperature?: number;
  topTemperature?: number;
  layer?: number;
  eyeHeight?: number;
  angle?: number;
  extent?: number;
};
/** Constant-pressure refractivity approximation; a thin layer has linear n² and an analytic ray. */
export function mirageRay({
  groundTemperature: Tg = 330,
  topTemperature: Tt = 300,
  layer: H = 0.02,
  eyeHeight: h = 1.2,
  angle = -0.35,
  extent = 600,
}: MirageOptions = {}) {
  if (
    ![Tg, Tt, H, h, angle, extent].every(Number.isFinite) ||
    Tg < 270 ||
    Tg > 370 ||
    Tt < 270 ||
    Tt > 340 ||
    H <= 0 ||
    h <= H ||
    angle >= 0 ||
    angle < -0.8 ||
    extent <= 0
  )
    throw new RangeError('Invalid mirage column');
  const C = 78.6e-6 * 1010,
    n0 = 1 + C / Tg,
    nt = 1 + C / Tt,
    a = (nt * nt - n0 * n0) / H,
    m = Math.tan((angle * Math.PI) / 180),
    p2 = (nt * nt) / (1 + m * m),
    curvature = a / (4 * p2),
    entry = (h - H) / -m;
  const discriminant = m * m - 4 * curvature * H,
    turns = a > 0 && discriminant < 0,
    turnLocal = curvature > 0 ? -m / (2 * curvature) : null,
    turnY = turnLocal === null ? null : H + m * turnLocal + curvature * turnLocal * turnLocal,
    groundLocal = turns
      ? null
      : Math.abs(curvature) < 1e-14
        ? -H / m
        : (2 * H) / (-m + Math.sqrt(discriminant)),
    exitLocal = turns ? -m / curvature : null,
    groundX = groundLocal === null ? null : entry + groundLocal,
    end = Math.min(extent, groundX ?? Infinity);
  const at = (x: number) => {
    if (x <= entry) return { x, y: h + m * x, slope: m };
    const u = x - entry;
    if (exitLocal !== null && u > exitLocal) return { x, y: H - m * (u - exitLocal), slope: -m };
    return { x, y: H + m * u + curvature * u * u, slope: m + 2 * curvature * u };
  };
  const index = (y: number) => (y >= H ? nt : Math.sqrt(n0 * n0 + a * Math.max(0, y)));
  return {
    Tg,
    Tt,
    H,
    h,
    angle,
    extent,
    n0,
    nt,
    a,
    p2,
    m,
    curvature,
    entry,
    turns,
    turnX: turnLocal === null ? null : entry + turnLocal,
    turnY,
    groundX,
    end,
    apparentGround: -h / m,
    index,
    at,
    points: Array.from({ length: 401 }, (_, i) => at((end * i) / 400)),
  };
}
export function mirageShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    groundTemperature: chapter === 0 ? 300 : chapter === 1 ? 300 + 30 * p : 330,
    angle: chapter === 4 ? -0.35 - 0.15 * p : -0.35,
    eyeHeight: chapter === 5 ? 0.8 + 1.4 * p : 1.2,
    close: chapter === 2 || chapter === 4,
    apparent: chapter === 3 || chapter === 5,
  };
}
