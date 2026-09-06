/** Planar teaching excavator. Metres, radians, pascals and newtons. */
// Fixed housing and rod lengths keep the piston inside the housing over the offered poses.
export const EXCAVATOR_CYLINDERS = [
  { housing: 1, rod: 0.8 },
  { housing: 1.05, rod: 1 },
  { housing: 1.1, rod: 0.94 },
] as const;
export const EXCAVATOR_LIMITS = {
  boom: [0.6, 1.05],
  stick: [-1.65, -1.5],
  curl: [0.05, 0.6],
} as const;
export type XY = { x: number; y: number };
export const add = (a: XY, b: XY): XY => ({ x: a.x + b.x, y: a.y + b.y });
export const polar = (length: number, angle: number): XY => ({
  x: length * Math.cos(angle),
  y: length * Math.sin(angle),
});
export const distance = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);
export const mix = (a: XY, b: XY, f: number): XY => ({
  x: a.x + (b.x - a.x) * f,
  y: a.y + (b.y - a.y) * f,
});
export const rotate = (point: XY, angle: number): XY => ({
  x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
  y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
});
const xy = (x: number, y: number): XY => ({ x, y });
const curve = (a: XY, control: XY, b: XY) =>
  Array.from({ length: 12 }, (_, i) => {
    const t = (i + 1) / 12;
    return xy(
      (1 - t) ** 2 * a.x + 2 * (1 - t) * t * control.x + t * t * b.x,
      (1 - t) ** 2 * a.y + 2 * (1 - t) * t * control.y + t * t * b.y,
    );
  });
/** Common local geometry for the physical bucket, section and cover. The teeth
 * point out of the scoop mouth, toward the chassis, rather than through its back. */
export const EXCAVATOR_BUCKET = {
  pin: xy(0, 0.55),
  tip: xy(0.3, -0.92),
  center: xy(0.52, -0.24),
  side: [
    xy(0, 0.12),
    xy(0.42, 0.18),
    ...curve(xy(0.42, 0.18), xy(0.95, 0.05), xy(0.94, -0.63)),
    xy(0.65, -0.73),
    ...curve(xy(0.65, -0.73), xy(0.55, -0.25), xy(0, -0.14)),
  ],
  shell: [
    xy(0.38, 0.18),
    ...curve(xy(0.38, 0.18), xy(0.95, 0.05), xy(0.94, -0.63)),
    xy(0.65, -0.73),
    xy(0.61, -0.66),
    xy(0.87, -0.57),
    ...curve(xy(0.87, -0.57), xy(0.88, 0), xy(0.38, 0.11)),
  ],
  ear: [
    xy(-0.13, -0.12),
    xy(-0.12, 0.55),
    ...curve(xy(-0.12, 0.55), xy(0, 0.72), xy(0.13, 0.55)),
    xy(0.38, 0.14),
  ],
  tooth: [xy(0.76, -0.64), xy(0.63, -0.72), xy(0.32, -0.95), xy(0.28, -0.89)],
} as const;
export const bucketPath = (points: readonly XY[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + 'Z';

export function circleJoint(a: XY, b: XY, ra: number, rb: number): XY {
  const d = distance(a, b);
  if (
    ![a.x, a.y, b.x, b.y, ra, rb, d].every(Number.isFinite) ||
    ra <= 0 ||
    rb <= 0 ||
    d >= ra + rb ||
    d <= Math.abs(ra - rb)
  )
    throw new RangeError('Unreachable bucket linkage');
  const along = (ra * ra - rb * rb + d * d) / (2 * d),
    h = Math.sqrt(Math.max(0, ra * ra - along * along));
  const point = {
    x: a.x + (along * (b.x - a.x)) / d - (h * (b.y - a.y)) / d,
    y: a.y + (along * (b.y - a.y)) / d + (h * (b.x - a.x)) / d,
  };
  if (![point.x, point.y, h].every(Number.isFinite) || h <= 0)
    throw new RangeError('Degenerate bucket linkage');
  return point;
}
export function excavatorPose(boom = 0.75, stick = -1.55, curl = 0.3) {
  [boom, stick, curl] = (
    [
      [boom, EXCAVATOR_LIMITS.boom],
      [stick, EXCAVATOR_LIMITS.stick],
      [curl, EXCAVATOR_LIMITS.curl],
    ] as const
  ).map(([value, limits]) => {
    if (!Number.isFinite(value) || value < limits[0] - 1e-12 || value > limits[1] + 1e-12)
      throw new RangeError('Pose outside the teaching excavator range');
    return Math.max(limits[0], Math.min(limits[1], value));
  });
  const origin = { x: 0, y: 1.5 },
    elbow = add(origin, polar(3.2, boom)),
    wrist = add(elbow, polar(2.4, boom + stick));
  // Increasing curl is clockwise toward the chassis in this side view. The
  // ordinary backhoe bucket cylinder therefore extends to excavate (Komatsu
  // Technical Report 174, paper 04, §2.6), rather than retracting to scoop.
  const bucketAngle = boom + stick - curl;
  const bucketPin = add(wrist, rotate(EXCAVATOR_BUCKET.pin, bucketAngle));
  const rockerPin = add(wrist, polar(-0.62, boom + stick));
  const joint = circleJoint(rockerPin, bucketPin, 0.65, 0.6);
  const cylinders = [
    { a: { x: 0.65, y: 1.25 }, b: add(origin, polar(1.65, boom)) },
    { a: add(origin, polar(1.75, boom + 0.13)), b: add(elbow, polar(0.58, boom + stick + 0.48)) },
    { a: add(elbow, polar(0.28, boom + stick + 0.4)), b: joint },
  ];
  return {
    origin,
    elbow,
    wrist,
    bucketAngle,
    bucketPin,
    rockerPin,
    joint,
    cylinders,
    // Welded lugs connect the off-axis stick-cylinder eyes to the actual beams.
    cylinderMounts: [
      { a: add(origin, polar(1.75 * Math.cos(0.13), boom)), b: cylinders[1].a },
      { a: add(elbow, polar(0.58 * Math.cos(0.48), boom + stick)), b: cylinders[1].b },
    ],
    boomCenter: mix(origin, elbow, 0.5),
    stickCenter: mix(elbow, wrist, 0.5),
    bucketCenter: add(wrist, rotate(EXCAVATOR_BUCKET.center, bucketAngle)),
    tip: add(wrist, rotate(EXCAVATOR_BUCKET.tip, bucketAngle)),
  };
}
export function excavatorHydraulics(
  boom: number,
  payload: number,
  flow: number,
  bore = 100,
  stick = -1.55,
  curl = 0.3,
) {
  if (
    ![boom, payload, flow, bore, stick, curl].every(Number.isFinite) ||
    payload < 0 ||
    flow < 0 ||
    bore < 70 ||
    bore > 140
  )
    throw new RangeError('Invalid hydraulic input');
  const pose = excavatorPose(boom, stick, curl),
    { a, b } = pose.cylinders[0];
  const length = distance(a, b),
    ux = (b.x - a.x) / length,
    uy = (b.y - a.y) / length;
  const lever = (b.x - pose.origin.x) * uy - (b.y - pose.origin.y) * ux;
  // Lump each steel member's mass at its modeled center. The payload is an
  // equivalent downward point load at the actual center tooth, not a lift chart.
  const moment =
    9.81 *
    (800 * (pose.boomCenter.x - pose.origin.x) +
      400 * (pose.stickCenter.x - pose.origin.x) +
      180 * (pose.bucketCenter.x - pose.origin.x) +
      payload * (pose.tip.x - pose.origin.x));
  const area = (Math.PI * (bore / 1000) ** 2) / 4,
    annulus = area - (Math.PI * 0.06 ** 2) / 4;
  const requiredPressure = moment / (2 * area * lever),
    pressure = Math.min(24e6, requiredPressure),
    stalled = requiredPressure > 24e6;
  const q = flow / 60000,
    velocity = stalled ? 0 : q / (2 * area);
  if (![moment, requiredPressure, pressure * q, velocity].every(Number.isFinite))
    throw new RangeError('Hydraulic input exceeds the finite calculation range');
  return {
    area,
    annulus,
    lever,
    moment,
    requiredPressure,
    pressure,
    stalled,
    force: 2 * pressure * area,
    velocity,
    power: pressure * q,
    mechanicalPower: 2 * pressure * area * velocity,
    reliefPower: stalled ? pressure * q : 0,
    strokeLength: length,
  };
}
export function excavatorShot(chapter: number, p: number, chapterSeconds = 25) {
  if (
    !Number.isInteger(chapter) ||
    chapter < 0 ||
    chapter > 6 ||
    !Number.isFinite(p) ||
    !Number.isFinite(chapterSeconds) ||
    chapterSeconds <= 0
  )
    throw new RangeError('Invalid excavator chapter');
  p = Math.max(0, Math.min(1, p));
  // The flow chapter integrates a finite demonstration stroke, so an overlong
  // timeline must not silently move its piston through the closed cylinder end.
  if (
    chapter === 4 &&
    0.1 + (chapterSeconds * 20) / (60000 * 2 * ((Math.PI * 0.1 ** 2) / 4) * 0.8) > 1
  )
    throw new RangeError('Flow chapter exceeds the demonstration stroke');
  const s = (x: number) => {
    const v = Math.max(0, Math.min(1, x));
    return v * v * (3 - 2 * v);
  };
  const u = s(p);
  return {
    boom: chapter === 0 ? 0.6 + 0.24 * s((p - 0.35) / 0.65) : chapter === 2 ? 0.6 + 0.24 * u : 0.75,
    stick: chapter === 0 ? -1.5 - 0.15 * s((p - 0.35) / 0.65) : -1.55,
    curl: chapter === 0 ? 0.05 + 0.55 * s(p * 2) : chapter === 6 ? 0.05 + 0.55 * u : 0.3,
    payload: chapter === 3 ? 300 + 1500 * u : chapter === 5 && p > 0.5 ? 9000 : 800,
    flow: chapter === 4 ? 10 + 20 * u : 40,
    piston:
      chapter === 1
        ? 0.18 + 0.6 * u
        : chapter === 4
          ? 0.1 +
            (chapterSeconds * (10 * p + 20 * p ** 3 - 10 * p ** 4)) /
              (60000 * 2 * ((Math.PI * 0.1 ** 2) / 4) * 0.8)
          : 0.55,
    valve: chapter === 5 ? (p > 0.5 ? 'relief' : 'hold') : 'extend',
  };
}
