export const GALILEO_G = 9.8;
export const ROLLING_INERTIA = 1.4;
export function rollingIncline(time: number, degrees = 6, distance = 1.6) {
  if (
    ![time, degrees, distance].every(Number.isFinite) ||
    degrees <= 0 ||
    degrees >= 60 ||
    distance <= 0
  )
    throw new RangeError('Finite shallow incline required.');
  const acceleration = (GALILEO_G * Math.sin((degrees * Math.PI) / 180)) / ROLLING_INERTIA,
    endTime = Math.sqrt((2 * distance) / acceleration),
    t = Math.max(0, Math.min(time, endTime));
  return {
    time: t,
    position: 0.5 * acceleration * t * t,
    velocity: acceleration * t,
    acceleration,
    endTime,
    waterMass: 0.015 * t,
    arrived: time >= endTime,
  };
}
export function doubleInclineGeometry(rightDegrees = 25) {
  if (!Number.isFinite(rightDegrees) || rightDegrees < 0 || rightDegrees > 60)
    throw new RangeError('Right incline must be between zero and sixty degrees.');
  const alpha = (35 * Math.PI) / 180,
    beta = (rightDegrees * Math.PI) / 180,
    radius = 0.35,
    height = 0.7,
    leftLength = (height - radius * (1 - Math.cos(alpha))) / Math.sin(alpha),
    arcLength = radius * (alpha + beta),
    rightLength = beta > 0 ? (height - radius * (1 - Math.cos(beta))) / Math.sin(beta) : 3.5;
  const at = (s: number) => {
    if (s < leftLength) {
      const d = leftLength - s;
      return {
        x: -radius * Math.sin(alpha) - d * Math.cos(alpha),
        y: radius * (1 - Math.cos(alpha)) + d * Math.sin(alpha),
        angle: -alpha,
      };
    }
    if (s < leftLength + arcLength) {
      const phi = -alpha + (s - leftLength) / radius;
      return { x: radius * Math.sin(phi), y: radius * (1 - Math.cos(phi)), angle: phi };
    }
    const d = s - leftLength - arcLength;
    return {
      x: radius * Math.sin(beta) + d * Math.cos(beta),
      y: radius * (1 - Math.cos(beta)) + d * Math.sin(beta),
      angle: beta,
    };
  };
  return {
    at,
    height,
    leftLength,
    arcLength,
    rightLength,
    length: leftLength + arcLength + rightLength,
  };
}
/** Smooth joined track for the ball center; no dissipative bottom-corner impulse. */
export function doubleInclineState(time: number, rightDegrees = 25) {
  if (!Number.isFinite(time) || time < 0 || time > 12)
    throw new RangeError('Time must lie in 0…12 seconds.');
  const geometry = doubleInclineGeometry(rightDegrees),
    steps = Math.max(1, Math.ceil(time / 0.0005)),
    dt = time / steps;
  let position = 0,
    velocity = 0;
  const acc = (s: number) => (-GALILEO_G / ROLLING_INERTIA) * Math.sin(geometry.at(s).angle);
  for (let i = 0; i < steps; i++) {
    const a1 = acc(position),
      v2 = velocity + (a1 * dt) / 2,
      s2 = position + (velocity * dt) / 2,
      a2 = acc(s2),
      v3 = velocity + (a2 * dt) / 2,
      s3 = position + (v2 * dt) / 2,
      a3 = acc(s3),
      v4 = velocity + a3 * dt,
      s4 = position + v3 * dt,
      a4 = acc(s4);
    position += (dt * (velocity + 2 * v2 + 2 * v3 + v4)) / 6;
    velocity += (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
  }
  const point = geometry.at(position),
    potential = GALILEO_G * point.y,
    kinetic = 0.5 * ROLLING_INERTIA * velocity ** 2;
  return {
    ...point,
    position,
    velocity,
    potential,
    kinetic,
    energy: potential + kinetic,
    geometry,
  };
}

/** Camera scale never shrinks the physical sphere to fit a distant return point. */
export function galileoTrackView(time: number, rightDegrees: number) {
  const state = doubleInclineState(time, rightDegrees),
    geometry = state.geometry;
  const first = geometry.at(0),
    last = geometry.at(geometry.length);
  const scale = Math.max(110, Math.min(130, 330 / (last.x - first.x)));
  const unshiftedX = 15 + (state.x - first.x) * scale;
  const camera = Math.max(0, unshiftedX - 270);
  const map = (x: number, y: number) => ({
    x: 15 + (x - first.x) * scale - camera,
    y: 156 - y * scale,
  });
  const points = [
    0,
    geometry.leftLength,
    ...Array.from({ length: 41 }, (_, i) => geometry.leftLength + (geometry.arcLength * i) / 40),
    geometry.length,
  ];
  // The horizontal ideal track extends beyond the finite display window.
  if (rightDegrees === 0) points.push(Math.max(geometry.length, state.position + 2));
  const rail = points.map((s) => {
    const q = geometry.at(s);
    return map(q.x + 0.065 * Math.sin(q.angle), q.y - 0.065 * Math.cos(q.angle));
  });
  return {
    state,
    scale,
    camera,
    first: map(first.x, first.y),
    center: map(state.x, state.y),
    radius: 0.065 * scale,
    rail,
    referenceY: map(0, geometry.height).y,
    continuesRight: map(last.x, last.y).x > 345 || rightDegrees === 0,
    returnDistance: geometry.rightLength,
    ticks: Array.from({ length: Math.ceil(Math.max(2, state.x + 2)) + 1 }, (_, worldX) => ({
      ...map(worldX, 0),
      worldX,
    })),
  };
}
/** Physical construction points share one ramp equation, including support feet. */
export function galileoTimingGeometry(degrees: number) {
  if (!Number.isFinite(degrees) || degrees < 3 || degrees > 18)
    throw new RangeError('Supported timing ramp is3…18degrees.');
  rollingIncline(0, degrees);
  const phi = (degrees * Math.PI) / 180,
    tableY = 190;
  const at = (s: number) => ({ x: 35 + s * 175 * Math.cos(phi), y: 80 + s * 175 * Math.sin(phi) });
  const supports = [0.06, 1.55].map((s) => {
    const q = at(s);
    return { x: q.x, top: q.y + 8, bottom: tableY - 1 };
  });
  return { at, phi, tableY, end: at(1.6), supports };
}
export function galileoFilmState(chapter: number, seconds: number, locale: 'zh' | 'en') {
  if (![chapter, seconds].every(Number.isFinite))
    throw new RangeError('Finite film position required.');
  const c = Math.max(0, Math.min(5, Math.floor(chapter))),
    t = Math.max(0, seconds),
    zh = locale === 'zh';
  const r = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const angle = c === 2 ? 12 : 6;
  const trial = c === 4 ? (t < (zh ? 5.7 : 5.2) ? 0 : t < (zh ? 10.2 : 8.9) ? 1 : 2) : 0;
  const right = c === 4 ? [35, 15, 0][trial] : c === 5 ? 25 : 35;
  const run =
    c === 4
      ? trial === 0
        ? 1.7 * r(0.4, zh ? 5 : 4.8)
        : trial === 1
          ? 2.6 * r(zh ? 5.8 : 5.3, zh ? 9.8 : 8.6)
          : 1.9 * r(zh ? 10.6 : 9.2, zh ? 15.1 : 14.5)
      : c === 5
        ? 2.1 * r(zh ? 3.8 : 4.1, zh ? 12.1 : 12.7)
        : 1.7 * r(zh ? 2.7 : 1.8, zh ? 10.5 : 10.1);
  const end = rollingIncline(0, angle).endTime;
  const timingTime =
    c === 0
      ? end * r(zh ? 7.5 : 6.5, zh ? 15.1 : 12.6)
      : c === 1
        ? end * r(zh ? 4.5 : 4.6, zh ? 12.9 : 13.2)
        : end * r(2.5, zh ? 7.5 : 6.9);
  return {
    kind: c < 3 ? 'timing' : c === 5 ? 'energy' : 'double',
    angle,
    right,
    run,
    timingTime,
    trial,
  } as const;
}
