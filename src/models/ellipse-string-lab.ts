/** Ideal point pins and a taut, inextensible thread with its two ends pinned. */
export function stringEllipse(angle: number, length = 1, separation = 0.6) {
  if (
    ![angle, length, separation].every(Number.isFinite) ||
    length <= 0 ||
    separation < 0 ||
    separation >= length
  )
    throw new RangeError('Pin separation must be smaller than thread length');
  const a = length / 2,
    c = separation / 2,
    b = Math.sqrt(a * a - c * c),
    x = a * Math.cos(angle),
    y = b * Math.sin(angle);
  return {
    a,
    b,
    c,
    x,
    y,
    length,
    separation,
    left: Math.hypot(x + c, y),
    right: Math.hypot(x - c, y),
    eccentricity: c / a,
  };
}
export function ellipseTrace(progress: number, length = 1, separation = 0.6) {
  const end = Math.max(0, Math.min(1, progress)) * Math.PI * 2,
    n = Math.max(1, Math.ceil(end * 32));
  return Array.from({ length: n + 1 }, (_, i) => stringEllipse((end * i) / n, length, separation));
}

export type EllipseSceneState = { distance: number; trace: number; closing: boolean };

/** Chapter-relative geometry, independent of manual exploration and wall-clock time. */
export function ellipseFilmState(chapter: number, progress: number): EllipseSceneState {
  const p = Math.max(0, Math.min(1, progress * 1.25));
  return {
    distance: chapter === 3 ? 0.6 * (1 - p) : 0.6,
    trace:
      chapter === 0 ? 0.13 : chapter === 1 ? 0.13 + 0.38 * p : chapter === 2 ? p : 0.2 + 0.3 * p,
    closing: chapter === 3,
  };
}
