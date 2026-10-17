export type StereoOptions = { baseline?: number; focal?: number; fixation?: number };
export function stereoSetup({
  baseline: B = 64,
  focal: f = 17,
  fixation: Z0 = 800,
}: StereoOptions = {}) {
  if (![B, f, Z0].every(Number.isFinite) || B < 0 || B > 100 || f <= 0 || Z0 <= 0)
    throw new RangeError('Invalid stereo setup');
  return { B, f, Z0, reference: (f * B) / Z0 };
}
/** Virtual rectified image coordinates, registered to a central fixation point, all mm. */
export function stereoPoint(depth: number, x = 0, options: StereoOptions = {}) {
  const s = stereoSetup(options);
  if (!Number.isFinite(depth) || depth <= 0 || !Number.isFinite(x))
    throw new RangeError('Invalid point');
  const rawLeft = (s.f * (x + s.B / 2)) / depth,
    rawRight = (s.f * (x - s.B / 2)) / depth,
    left = rawLeft - s.reference / 2,
    right = rawRight + s.reference / 2;
  return {
    ...s,
    depth,
    x,
    left,
    right,
    rawLeft,
    rawRight,
    disparity: left - right,
    angular:
      ((Math.atan((x + s.B / 2) / depth) -
        Math.atan((x - s.B / 2) / depth) -
        2 * Math.atan(s.B / (2 * s.Z0))) *
        180) /
      Math.PI,
  };
}
export function stereoTriangulate(left: number, right: number, options: StereoOptions = {}) {
  const s = stereoSetup(options),
    d = left - right + s.reference;
  if (!Number.isFinite(left) || !Number.isFinite(right))
    throw new RangeError('Invalid image coordinate');
  return s.B === 0 || d <= 0 ? null : (s.f * s.B) / d;
}
export function stereoMatches(wrong = false, options: StereoOptions = {}, depth = 800) {
  const points = [stereoPoint(depth, -20, options), stereoPoint(depth, 20, options)],
    pairs = wrong
      ? [
          [0, 1],
          [1, 0],
        ]
      : [
          [0, 0],
          [1, 1],
        ];
  return {
    points,
    pairs,
    depths: pairs.map(([l, r]) => stereoTriangulate(points[l].left, points[r].right, options)),
  };
}
export function stereoShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    fixation = chapter === 4 ? 600 + 1000 * p : 800;
  return {
    baseline: chapter === 3 ? 64 * (1 - p) : 64,
    fixation,
    depth:
      chapter === 1
        ? 800 - 400 * p
        : chapter === 2
          ? 800 + 600 * p
          : chapter === 4
            ? fixation + 200
            : 800,
    matching: chapter === 5,
    wrong: chapter === 5 && p > 0.5,
  };
}
