export type Vec2 = { x: number; y: number };
export type ArmMode =
  'flick' | 'vectors' | 'measure' | 'radius' | 'phone' | 'compare' | 'javelin' | 'research';
export type ArmSceneState = { mode: ArmMode; time: number; wrist: boolean; run: number };
export function armFilmState(
  chapter: number,
  progress: number,
  chapterTime = progress * 28,
): ArmSceneState {
  const mode = (
    [
      'flick',
      'vectors',
      'measure',
      'radius',
      'phone',
      'compare',
      'javelin',
      'research',
    ] as ArmMode[]
  )[Math.min(7, Math.max(0, chapter))];
  const p = Math.min(1, Math.max(0, progress) / 0.8);
  return {
    mode,
    time:
      mode === 'vectors'
        ? 0.12 + 0.24 * p
        : mode === 'javelin'
          ? 0.22 + 0.07 * p
          : mode === 'research'
            ? 0.29
            : mode === 'phone'
              ? 0.1 + 0.28 * p
              : mode === 'flick'
                ? // Both measured recordings begin the detached-drop explanation at about 11.7 s.
                  chapterTime <= 11.7
                  ? (0.36 * Math.max(0, chapterTime)) / 11.7
                  : 0.36 + 0.1 * Math.min(1, (chapterTime - 11.7) / 6)
                : 0.46 * p,
    wrist: mode !== 'phone',
    run: mode === 'research' ? 4 * p : 0,
  };
}
const add = (a: Vec2, b: Vec2) => ({ x: a.x + b.x, y: a.y + b.y });
/** Prescribed illustrative joint motion, not fitted to textbook photographs. */
function joint(time: number, start: number, end: number, from: number, to: number) {
  const u = Math.max(0, Math.min(1, (time - start) / (end - start))),
    d = to - from,
    T = end - start,
    q = from + d * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5),
    v = time > start && time < end ? (d * (30 * u * u - 60 * u ** 3 + 30 * u ** 4)) / T : 0,
    a = time > start && time < end ? (d * (60 * u - 180 * u * u + 120 * u ** 3)) / T ** 2 : 0;
  return { q, v, a };
}
export function armKinematics(time: number, wrist = true, shoulderSpeed = 0, orientation = 0) {
  if (!Number.isFinite(time) || !Number.isFinite(shoulderSpeed) || !Number.isFinite(orientation))
    throw new RangeError('Finite time and transport speed required');
  const t = Math.max(0, Math.min(0.55, time)),
    j = [
      joint(t, 0, 0.5, 1.9, 0.3),
      joint(t, 0.08, 0.48, 0.6, -0.7),
      wrist ? joint(t, 0.22, 0.48, 0.6, -0.7) : { q: 0, v: 0, a: 0 },
    ],
    lengths = [0.25, 0.23, 0.17],
    origin = { x: shoulderSpeed * t, y: 0 };
  let q = orientation,
    w = 0,
    a = 0,
    position = origin,
    velocity = { x: shoulderSpeed, y: 0 },
    acceleration = { x: 0, y: 0 };
  const points = [position],
    velocities = [velocity],
    accelerations = [acceleration],
    components: Vec2[] = [];
  for (let i = 0; i < 3; i++) {
    q += j[i].q;
    w += j[i].v;
    a += j[i].a;
    const x = lengths[i] * Math.cos(q),
      y = lengths[i] * Math.sin(q),
      v = { x: -w * y, y: w * x },
      ac = { x: -a * y - w * w * x, y: a * x - w * w * y };
    position = add(position, { x, y });
    velocity = add(velocity, v);
    acceleration = add(acceleration, ac);
    points.push(position);
    velocities.push(velocity);
    accelerations.push(acceleration);
    components.push(v);
  }
  const tangent = velocity,
    speed = Math.hypot(tangent.x, tangent.y),
    cross = tangent.x * acceleration.y - tangent.y * acceleration.x,
    normalAcceleration = speed > 1e-12 ? Math.abs(cross) / speed : 0,
    curvatureRadius = normalAcceleration > 1e-12 ? (speed * speed) / normalAcceleration : Infinity;
  return {
    time: t,
    points,
    velocities,
    accelerations,
    components,
    angles: j,
    tip: position,
    velocity,
    acceleration,
    speed,
    normalAcceleration,
    curvatureRadius,
  };
}
export const ARM_RELEASE = 0.36;
export function flickDrop(time: number, wrist = true) {
  const release = armKinematics(ARM_RELEASE, wrist),
    dt = Math.max(0, time - ARM_RELEASE),
    held = time < ARM_RELEASE,
    s = held ? armKinematics(time, wrist) : release;
  return {
    released: !held,
    x: s.tip.x + release.velocity.x * dt,
    y: s.tip.y + release.velocity.y * dt - 4.9 * dt * dt,
    vx: held ? s.velocity.x : release.velocity.x,
    vy: held ? s.velocity.y : release.velocity.y - 9.8 * dt,
  };
}
/** Textbook p103–104 numerical estimates, deliberately separate from illustrative joint motion. */
export function textbookFlick(
  frameRate = 25,
  separation = 0.26,
  radius = 0.17,
  wristAcceleration = 32,
) {
  if (
    ![frameRate, separation, radius, wristAcceleration].every(Number.isFinite) ||
    frameRate <= 0 ||
    separation <= 0 ||
    radius <= 0 ||
    wristAcceleration < 0
  )
    throw new RangeError('Positive measurement inputs required');
  const interval = 1 / frameRate,
    speed = separation / interval,
    normal = (speed * speed) / radius,
    ratio = 2.2 ** 2 / (3 / 5);
  return {
    interval,
    speed,
    normal,
    gMultiple: normal / 9.8,
    ratio,
    scaledWrist: ratio * wristAcceleration,
    textbookRounded: 8 * wristAcceleration,
  };
}
/** A phone's raw accelerometer is proper acceleration expressed in its rotating body axes. */
export function wristPhone(time: number) {
  const s = armKinematics(time, false),
    a = s.accelerations[2],
    q = s.angles[0].q + s.angles[1].q,
    ex = { x: Math.cos(q), y: Math.sin(q) },
    ey = { x: -Math.sin(q), y: Math.cos(q) },
    specific = { x: a.x, y: a.y + 9.8 };
  return {
    state: s,
    angle: q,
    coordinateAlong: a.x * ex.x + a.y * ex.y,
    coordinateAcross: a.x * ey.x + a.y * ey.y,
    rawAlong: specific.x * ex.x + specific.y * ex.y,
    rawAcross: specific.x * ey.x + specific.y * ey.y,
  };
}
export function javelinRelease(runSpeed = 4, releaseTime = 0.29) {
  const s = armKinematics(releaseTime, true, runSpeed, Math.PI / 3),
    relative = armKinematics(releaseTime, true, 0, Math.PI / 3);
  return { state: s, relative, transport: { x: runSpeed, y: 0 }, speed: s.speed };
}
