export const FRICTION_GRAVITY = 9.8;
export function normalFriction(mass = 0.5, extraNormal = 0, muStatic = 0.45, muKinetic = 0.3) {
  if (
    ![mass, extraNormal, muStatic, muKinetic].every(Number.isFinite) ||
    mass <= 0 ||
    extraNormal < 0 ||
    muKinetic < 0 ||
    muStatic <= muKinetic
  )
    throw new RangeError('Positive mass and static coefficient above kinetic required.');
  const normal = mass * FRICTION_GRAVITY + extraNormal;
  return { normal, staticLimit: muStatic * normal, kinetic: muKinetic * normal };
}
/** A force-controlled hand trajectory: static ramp, then a smooth approach to constant speed. */
export function frictionPull(time: number, mass = 0.5, extraNormal = 0) {
  if (!Number.isFinite(time)) throw new RangeError('Finite time required.');
  const t = Math.max(0, time),
    f = normalFriction(mass, extraNormal),
    release = 2,
    cruise = 0.18;
  if (t <= release) {
    const pull = (f.staticLimit * t) / release;
    return {
      ...f,
      time: t,
      position: 0,
      velocity: 0,
      acceleration: 0,
      pull,
      friction: pull,
      peak: pull,
      sliding: false,
      extension: pull / 100,
    };
  }
  const tau = (mass * cruise) / (f.staticLimit - f.kinetic),
    u = t - release,
    e = Math.exp(-u / tau),
    velocity = cruise * (1 - e),
    acceleration = (cruise / tau) * e,
    position = cruise * (u - tau * (1 - e)),
    pull = f.kinetic + mass * acceleration;
  return {
    ...f,
    time: t,
    position,
    velocity,
    acceleration,
    pull,
    friction: f.kinetic,
    peak: f.staticLimit,
    sliding: true,
    extension: pull / 100,
  };
}
export function frictionSteady(time: number, mass = 0.5, extraNormal = 0) {
  if (!Number.isFinite(time)) throw new RangeError('Finite time required.');
  const f = normalFriction(mass, extraNormal),
    t = Math.max(0, time),
    velocity = 0.18;
  return {
    ...f,
    time: t,
    position: velocity * t,
    velocity,
    acceleration: 0,
    pull: f.kinetic,
    friction: f.kinetic,
    peak: f.kinetic,
    sliding: true,
    extension: f.kinetic / 100,
  };
}

/** Presentation seconds follow the recorded explanation; all forces still use one physical clock. */
export function frictionFilmState(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const en = locale === 'en';
  const ramp = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const anchors =
    chapter === 3
      ? en
        ? [
            [0, 0],
            [3.2, 0.4],
            [9.3, 1.75],
            [10.9, 2],
            [14.2, 2.08],
            [17.9, 2.15],
            [20.9, 2.3],
            [25, 3],
            [30, 4.4],
          ]
        : [
            [0, 0],
            [3.3, 0.4],
            [10.7, 1.75],
            [12.3, 2],
            [15.8, 2.08],
            [20.7, 2.15],
            [24, 2.4],
            [27.5, 3],
            [30, 4.4],
          ]
      : [
          [0, 0],
          [2, 0.3],
          [en ? 4.2 : 5.6, 1.85],
          [en ? 5.8 : 7, 2],
          [en ? 8.2 : 10, 3],
          [en ? 12 : 14, 4.4],
        ];
  let physicalTime = anchors.at(-1)![1];
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1],
      b = anchors[i];
    if (t <= b[0]) {
      physicalTime = a[1] + (b[1] - a[1]) * Math.max(0, (t - a[0]) / (b[0] - a[0]));
      break;
    }
  }
  return {
    physicalTime: chapter >= 3 ? physicalTime : t * 0.15,
    mass: chapter === 1 ? 0.5 + 0.5 * ramp(en ? 3.5 : 4, en ? 5 : 5.8) : 0.5,
    pressure: 5 + 15 * ramp(2.8, en ? 7.4 : 9.5),
  };
}
