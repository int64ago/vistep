export function cutString(time: number, radius = 0.5, omega = 3, cutAt = 0.8) {
  if (
    ![time, radius, omega, cutAt].every(Number.isFinite) ||
    radius <= 0 ||
    omega <= 0 ||
    cutAt < 0
  )
    throw new RangeError('Positive circular-motion parameters required');
  const t = Math.max(0, time),
    circleTime = Math.min(t, cutAt),
    angle = -Math.PI / 2 + omega * circleTime,
    extra = Math.max(0, t - cutAt),
    vx = -radius * omega * Math.sin(angle),
    vy = radius * omega * Math.cos(angle);
  return {
    x: radius * Math.cos(angle) + vx * extra,
    y: radius * Math.sin(angle) + vy * extra,
    vx,
    vy,
    angle,
    cut: t >= cutAt,
    tension: t < cutAt ? 0.05 * omega * omega * radius : 0,
    fx: t < cutAt ? -0.05 * omega * omega * radius * Math.cos(angle) : 0,
    fy: t < cutAt ? -0.05 * omega * omega * radius * Math.sin(angle) : 0,
  };
}
export function sandbagCone(time: number, mass = 0.08, length = 0.8, omega = 4.5) {
  if (![time, mass, length, omega].every(Number.isFinite) || mass <= 0 || length <= 0 || omega < 0)
    throw new RangeError('Positive conical pendulum parameters required');
  const cos = Math.min(1, 9.8 / (omega * omega * length || Infinity)),
    vertical = omega * omega * length <= 9.8 ? length : length * cos,
    radius = Math.sqrt(Math.max(0, length * length - vertical * vertical)),
    tension = radius > 0 ? mass * omega * omega * length : mass * 9.8,
    force = mass * omega * omega * radius,
    angle = omega * Math.max(0, time);
  return {
    radius,
    vertical,
    tension,
    force,
    gravity: mass * 9.8,
    omega,
    angle,
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
    tensionVector: {
      x: -force * Math.cos(angle),
      y: -force * Math.sin(angle),
      z: mass * 9.8,
    },
  };
}

export type CentripetalSceneState = {
  mode: 'cut' | 'bag' | 'rig' | 'funnel';
  time: number;
  comparison: 'same' | 'mass' | 'radius' | 'speed';
  omega: number;
  length: number;
  radius: number;
};

/** Each chapter starts with its prescribed controlled conditions. */
export function centripetalFilmState(chapter: number, progress: number): CentripetalSceneState {
  return {
    mode: chapter === 0 ? 'cut' : chapter === 1 ? 'bag' : chapter < 6 ? 'rig' : 'funnel',
    time: Math.max(0, Math.min(1, progress / 0.84)) * (chapter === 0 ? 1.25 : 2),
    comparison:
      chapter === 3 ? 'mass' : chapter === 4 ? 'radius' : chapter === 5 ? 'speed' : 'same',
    omega: 4.5,
    length: 0.8,
    radius: 0.2,
  };
}
/** Rigid lever with horizontal sliding clevis at the vertical spring sleeve. Static calibrated reading. */
export function forceLever(force: number) {
  if (!Number.isFinite(force) || force < 0 || force > 4)
    throw new RangeError('Calibrated force range0–4N required');
  const pivot = 0.4,
    zp = 0.16,
    arm = 0.11,
    initial = 0.16,
    length = Math.hypot(pivot, initial),
    alpha = Math.atan2(initial, -pivot),
    k = 12;
  const state = (angle: number) => {
    const endX = pivot + length * Math.cos(alpha + angle),
      endZ = zp + length * Math.sin(alpha + angle),
      extension = zp + initial - endZ,
      stopX = pivot + arm * Math.sin(angle),
      stopZ = zp - arm * Math.cos(angle),
      reaction = k * extension,
      torque = reaction * (-length * Math.cos(alpha + angle));
    return { angle, endX, endZ, extension, stopX, stopZ, reaction, torque, leverLength: length };
  };
  let lo = 0,
    hi = 0.4;
  for (let i = 0; i < 48; i++) {
    const a = (lo + hi) / 2,
      s = state(a);
    if (s.torque < force * arm * Math.cos(a)) lo = a;
    else hi = a;
  }
  return { ...state((lo + hi) / 2), force, pivot, zp, arm, stiffness: k };
}
export function centripetalRig(mass = 0.04, radius = 0.15, omega = 6) {
  if (![mass, radius, omega].every(Number.isFinite) || mass <= 0 || radius <= 0 || omega < 0)
    throw new RangeError('Positive mass and radius required');
  const force = mass * omega * omega * radius;
  return { mass, radius, omega, speed: omega * radius, force, lever: forceLever(force) };
}
export function funnelOrbit(
  time: number,
  radius = 0.2,
  wallAngle = Math.PI / 4,
  mass = 0.03,
  ballRadius = 0.018,
) {
  if (
    ![time, radius, wallAngle, mass, ballRadius].every(Number.isFinite) ||
    radius <= 0 ||
    wallAngle <= 0 ||
    wallAngle >= Math.PI / 2 ||
    mass <= 0 ||
    ballRadius <= 0
  )
    throw new RangeError('Valid cone geometry required');
  const force = mass * 9.8 * Math.tan(wallAngle),
    normal = (mass * 9.8) / Math.cos(wallAngle),
    omega = Math.sqrt((9.8 * Math.tan(wallAngle)) / radius),
    angle = omega * Math.max(0, time),
    height = radius * Math.tan(wallAngle) + ballRadius / Math.cos(wallAngle);
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
    height,
    angle,
    omega,
    normal,
    force,
    gravity: mass * 9.8,
    radius,
    ballRadius,
    wallAngle,
  };
}
