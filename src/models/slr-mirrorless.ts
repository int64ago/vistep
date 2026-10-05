/** A sagittal teaching section. Lengths use one shared arbitrary scene unit.
 * It preserves mirror, prism and curtain geometry; it is not a lens prescription.
 */
export type CameraMode = 'dslr' | 'live-view' | 'mirrorless';
export type CameraPoint = { x: number; y: number };
const clamp = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
const ramp = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const ease = (v: number) => v * v * (3 - 2 * v);
export const cameraGeometry = {
  axis: 1,
  lensFront: -3.45,
  lensBack: -1.16,
  sensor: 1.17,
  shutter: 1.02,
  screen: 1.85,
  mirrorPivot: { x: 0.6, y: 1.6 },
  mirrorLength: 1.2 * Math.SQRT2,
  drivePivot: { x: 0.9, y: 1.25 },
  crankLength: 0.2,
  linkLength: 0.55,
  prismFirst: { x: 0, y: 3 },
  prismSecond: { x: -0.65, y: 2.35 },
  prismExit: { x: 1.2, y: 2.35 },
} as const;
export const prismSlopes = [-Math.tan(Math.PI / 8), -Math.tan((3 * Math.PI) / 8)];
const prismSecondIntercept = 2.35 + 0.65 * prismSlopes[1];
const prismCornerX = (prismSecondIntercept - 3) / (prismSlopes[0] - prismSlopes[1]);
export const cameraPrism: CameraPoint[] = [
  { x: -0.4, y: 2 },
  { x: 1.2, y: 2 },
  { x: 1.2, y: 3 + 1.2 * prismSlopes[0] },
  { x: prismCornerX, y: 3 + prismCornerX * prismSlopes[0] },
  { x: -0.6, y: prismSecondIntercept - 0.6 * prismSlopes[1] },
];
export function reflectCameraRay(direction: CameraPoint, tangentAngle: number): CameraPoint {
  const normal = { x: -Math.sin(tangentAngle), y: Math.cos(tangentAngle) };
  const dot = direction.x * normal.x + direction.y * normal.y;
  return { x: direction.x - 2 * dot * normal.x, y: direction.y - 2 * dot * normal.y };
}
export function cameraMirror(angle: number) {
  const theta = Math.max(0, Math.min(Math.PI / 4, angle));
  const pivot = cameraGeometry.mirrorPivot;
  const end = {
    x: pivot.x - cameraGeometry.mirrorLength * Math.cos(theta),
    y: pivot.y - cameraGeometry.mirrorLength * Math.sin(theta),
  };
  const attachment = { x: pivot.x - 0.28 * Math.cos(theta), y: pivot.y - 0.28 * Math.sin(theta) };
  const drive = cameraGeometry.drivePivot;
  const dx = attachment.x - drive.x,
    dy = attachment.y - drive.y;
  const distance = Math.hypot(dx, dy);
  const cosine =
    (distance ** 2 + cameraGeometry.crankLength ** 2 - cameraGeometry.linkLength ** 2) /
    (2 * distance * cameraGeometry.crankLength);
  const crankAngle = Math.atan2(dy, dx) - Math.acos(Math.max(-1, Math.min(1, cosine)));
  const joint = {
    x: drive.x + cameraGeometry.crankLength * Math.cos(crankAngle),
    y: drive.y + cameraGeometry.crankLength * Math.sin(crankAngle),
  };
  return { angle: theta, pivot, end, attachment, drive, joint };
}
/** A slow curtain traversal with a longer exposure than its travel time.
 * Row coordinates go from top (0) to bottom (1). Both curtains travel down.
 */
export function cameraCurtains(mode: CameraMode, phase: number) {
  const p = clamp(phase);
  if (mode === 'live-view') return { first: 1, second: 0, open: 1 };
  const mirrorless = mode === 'mirrorless';
  const start = mirrorless ? 0.3 : 0.28;
  const close = mirrorless ? 0.62 : 0.6;
  let first = ramp(p, start, start + 0.17),
    second = ramp(p, close, close + 0.17);
  if (mirrorless && p < 0.18) first = 1 - ramp(p, 0.06, 0.18);
  if (p >= 0.88) {
    if (mirrorless) second = 1 - ramp(p, 0.88, 1);
    else {
      first = 1 - ramp(p, 0.88, 1);
      second = first;
    }
  }
  return { first, second, open: Math.max(0, first - second) };
}
export function cameraRowExposure(mode: CameraMode, phase: number, row: number) {
  if (mode === 'live-view') return 0;
  const start = (mode === 'mirrorless' ? 0.3 : 0.28) + 0.17 * clamp(row);
  const end = start + 0.32;
  return clamp((Math.min(clamp(phase), end) - start) / (end - start));
}
export function cameraPose(mode: CameraMode, phase = 0, compensation = 0) {
  const p = clamp(phase);
  const lift =
    mode === 'live-view'
      ? 1
      : mode === 'mirrorless'
        ? 0
        : ease(ramp(p, 0.08, 0.22)) * (1 - ease(ramp(p, 0.8, 0.88)));
  const mirror = cameraMirror((Math.PI / 4) * (1 - lift));
  const curtains = cameraCurtains(mode, p);
  const optical = mode === 'dslr' && Math.abs(mirror.angle - Math.PI / 4) < 1e-6;
  const live =
    mode !== 'dslr' && curtains.open === 1 && (p < 0.06 || p >= 0.88 || mode === 'live-view');
  const brightness =
    2 ** Math.max(-2, Math.min(2, Number.isFinite(compensation) ? compensation : 0));
  const path: CameraPoint[] = [
    { x: -3.7, y: 1 },
    { x: cameraGeometry.lensBack, y: 1 },
  ];
  if (mode === 'dslr' && mirror.end.y <= 1) {
    const x = mirror.pivot.x - (mirror.pivot.y - 1) / Math.tan(mirror.angle);
    const hit = { x, y: 1 };
    path.push(hit);
    const direction = reflectCameraRay({ x: 1, y: 0 }, mirror.angle);
    if (optical)
      path.push(
        { x: 0, y: cameraGeometry.screen },
        cameraGeometry.prismFirst,
        cameraGeometry.prismSecond,
        cameraGeometry.prismExit,
        { x: 1.75, y: 2.35 },
      );
    else {
      const distance = Math.min(
        (cameraGeometry.screen - 1) / direction.y,
        (1.15 - x) / direction.x,
      );
      path.push({ x: x + distance * direction.x, y: 1 + distance * direction.y });
    }
  } else
    path.push({
      x:
        curtains.first >= 0.5 && curtains.second < 0.5
          ? cameraGeometry.sensor
          : cameraGeometry.shutter,
      y: 1,
    });
  return {
    mode,
    phase: p,
    mirror,
    curtains,
    optical,
    live,
    brightness,
    path,
    rows: Array.from({ length: 16 }, (_, row) => cameraRowExposure(mode, p, (row + 0.5) / 16)),
  };
}
export type CameraPose = ReturnType<typeof cameraPose>;
export function cameraPathPoint(path: CameraPoint[], progress: number) {
  const lengths = path
    .slice(1)
    .map((point, i) => Math.hypot(point.x - path[i].x, point.y - path[i].y));
  let distance = clamp(progress) * lengths.reduce((sum, n) => sum + n, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const q = lengths[i] ? distance / lengths[i] : 0;
      return {
        x: path[i].x + (path[i + 1].x - path[i].x) * q,
        y: path[i].y + (path[i + 1].y - path[i].y) * q,
      };
    }
    distance -= lengths[i];
  }
  return path[0];
}
export function cameraShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(6, Math.floor(chapter))),
    p = clamp(progress);
  const phase = c === 2 || c === 5 ? p : c === 3 ? 1 : 0;
  const liveView = c === 3 && p >= 0.45;
  const compensation = c === 6 ? -2 + 4 * ease(p) : c === 4 ? 1.5 * ease(ramp(p, 0.55, 0.9)) : 0;
  return {
    chapter: c,
    dslr: cameraPose(liveView ? 'live-view' : 'dslr', c === 5 ? 0 : phase, compensation),
    mirrorless: cameraPose('mirrorless', c === 2 || c === 3 ? 0 : phase, compensation),
    active: (c === 0 || c === 6 ? 'both' : c <= 3 ? 'dslr' : 'mirrorless') as
      'both' | 'dslr' | 'mirrorless',
    phone: (c === 0 || c === 6
      ? p < 0.5
        ? 'dslr'
        : 'mirrorless'
      : c <= 3
        ? 'dslr'
        : 'mirrorless') as 'dslr' | 'mirrorless',
    trace: c === 1 ? ease(ramp(p, 0.1, 0.82)) : 1,
    signal: c >= 4 || liveView,
    compensation,
  };
}
