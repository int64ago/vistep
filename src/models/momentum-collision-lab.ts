export function collision1D(m1: number, m2: number, u1: number, u2: number, restitution = 1) {
  if (
    ![m1, m2, u1, u2, restitution].every(Number.isFinite) ||
    m1 <= 0 ||
    m2 <= 0 ||
    restitution < 0 ||
    restitution > 1
  )
    throw new RangeError('Positive masses and restitution in [0,1] required');
  const total = m1 + m2,
    pBefore = m1 * u1 + m2 * u2,
    v1 = (pBefore - m2 * restitution * (u1 - u2)) / total,
    v2 = (pBefore + m1 * restitution * (u1 - u2)) / total,
    kBefore = (m1 * u1 * u1 + m2 * u2 * u2) / 2,
    kAfter = (m1 * v1 * v1 + m2 * v2 * v2) / 2;
  return {
    m1,
    m2,
    u1,
    u2,
    v1,
    v2,
    restitution,
    pBefore,
    pAfter: m1 * v1 + m2 * v2,
    kBefore,
    kAfter,
    lost: kBefore - kAfter,
  };
}
export const TEXTBOOK_STICKY = [
  { m1: 0.519, m2: 0.519, u: 0.628, v: 0.307 },
  { m1: 0.519, m2: 0.718, u: 0.656, v: 0.265 },
  { m1: 0.718, m2: 0.519, u: 0.572, v: 0.321 },
] as const;
export function textbookSticky(index = 0) {
  const row = TEXTBOOK_STICKY[index];
  if (!row) throw new RangeError('Textbook row0–2 required');
  const pBefore = row.m1 * row.u,
    pAfter = (row.m1 + row.m2) * row.v;
  return {
    ...row,
    pBefore,
    pAfter,
    residual: (pAfter - pBefore) / pBefore,
    kBefore: (row.m1 * row.u * row.u) / 2,
    kAfter: ((row.m1 + row.m2) * row.v * row.v) / 2,
  };
}
export function flagTransit(
  position: number,
  velocity: number,
  gate: number,
  width = 0.02,
  originTime = 0,
) {
  if (velocity === 0) return null;
  const center = originTime + (gate - position) / velocity,
    half = width / (2 * Math.abs(velocity)),
    entry = center - half,
    exit = center + half;
  return entry >= originTime - 1e-12
    ? { entry, exit, duration: 2 * half, speed: width / (2 * half), velocity }
    : null;
}
export type CartMode = 'elastic' | 'sticky' | 'textbook' | 'release' | 'tape';
export function cartCollisionRun(mode: CartMode, time: number, speed = 0.6, row = 0) {
  if (!Number.isFinite(time) || time < 0 || !Number.isFinite(speed) || speed <= 0)
    throw new RangeError('Nonnegative time and positive speed required');
  const data = textbookSticky(row),
    m1 = mode === 'textbook' ? data.m1 : 0.4,
    m2 = mode === 'textbook' ? data.m2 : 0.8,
    u = mode === 'textbook' ? data.u : speed,
    result = collision1D(m1, m2, u, 0, mode === 'elastic' ? 1 : 0),
    v1 = mode === 'textbook' ? data.v : result.v1,
    v2 = mode === 'textbook' ? data.v : result.v2,
    impact = 0.7 / u,
    after = Math.max(0, time - impact),
    x1 = time < impact ? 0.35 + u * time : 1.05 + v1 * after,
    x2 = 1.25 + v2 * after;
  return {
    m1,
    m2,
    u,
    v1,
    v2,
    impact,
    time,
    x1,
    x2,
    hit: time >= impact,
    velocity1: time < impact ? u : v1,
    velocity2: time < impact ? 0 : v2,
    pBefore: m1 * u,
    pAfter: m1 * v1 + m2 * v2,
    kBefore: (m1 * u * u) / 2,
    kAfter: (m1 * v1 * v1 + m2 * v2 * v2) / 2,
    beforeGate: flagTransit(0.35, u, 0.88),
    afterGate1: flagTransit(1.05, v1, v1 < 0 ? 0.88 : 1.45, 0.02, impact),
    afterGate2: flagTransit(1.25, v2, 1.45, 0.02, impact),
  };
}
export function cartRunDuration(mode: CartMode, speed = 0.6, row = 0) {
  if (mode === 'release') return 3;
  const s = cartCollisionRun(mode, 0, speed, row);
  return s.impact + (mode === 'elastic' ? 2 : 0.45 / s.v1 + 0.2);
}
export function springSeparation(time: number) {
  if (!Number.isFinite(time) || time < 0) throw new RangeError('Nonnegative finite time required');
  const m1 = 0.4,
    m2 = 0.8,
    k = 4,
    compression = 0.12,
    total = m1 + m2,
    reduced = (m1 * m2) / total,
    omega = Math.sqrt(k / reduced),
    release = Math.PI / (2 * omega),
    u = Math.min(time, release),
    delta = compression * (1 - Math.cos(omega * u)),
    relativeSpeed = compression * omega * Math.sin(omega * u),
    extra = Math.max(0, time - release),
    v1 = (-m2 / total) * relativeSpeed,
    v2 = (m1 / total) * relativeSpeed,
    x1 = 0.95 - (m2 / total) * delta + v1 * extra,
    x2 = 1.25 + (m1 / total) * delta + v2 * extra,
    remaining = time < release ? compression * Math.cos(omega * time) : 0,
    elastic = (k * remaining * remaining) / 2,
    kinetic = (m1 * v1 * v1 + m2 * v2 * v2) / 2;
  return {
    m1,
    m2,
    k,
    compression,
    release,
    time,
    x1,
    x2,
    v1,
    v2,
    elastic,
    kinetic,
    totalEnergy: (k * compression * compression) / 2,
    p: m1 * v1 + m2 * v2,
    springLength: x2 - x1 - 0.2,
    detached: time >= release,
    gate1: flagTransit(
      0.95 - (m2 / total) * compression,
      (-m2 / total) * compression * omega,
      0.5,
      0.02,
      release,
    ),
    gate2: flagTransit(
      1.25 + (m1 / total) * compression,
      (m1 / total) * compression * omega,
      1.6,
      0.02,
      release,
    ),
  };
}
export function pendulumQuarter(angle: number, length = 0.5) {
  let a = 1,
    b = Math.cos(angle / 2);
  for (let i = 0; i < 12; i++) {
    const next = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = next;
  }
  return (Math.PI / (2 * a)) * Math.sqrt(length / 9.81);
}
function pendulumStep(angularVelocity: number, time: number, length = 0.5) {
  let x = 0,
    v = angularVelocity;
  const n = Math.max(1, Math.ceil(Math.abs(time) / 0.002)),
    h = time / n,
    f = (a: number) => (-9.81 / length) * Math.sin(a);
  for (let i = 0; i < n; i++) {
    const k1x = v,
      k1v = f(x),
      k2x = v + (h * k1v) / 2,
      k2v = f(x + (h * k1x) / 2),
      k3x = v + (h * k2v) / 2,
      k3v = f(x + (h * k2x) / 2),
      k4x = v + h * k3v,
      k4v = f(x + h * k3x);
    x += (h * (k1x + 2 * k2x + 2 * k3x + k4x)) / 6;
    v += (h * (k1v + 2 * k2v + 2 * k3v + k4v)) / 6;
  }
  return { angle: x, angularVelocity: v };
}
export function hangingCollision(progress: number, ratio = 1) {
  if (
    !Number.isFinite(progress) ||
    progress < 0 ||
    progress > 1 ||
    !Number.isFinite(ratio) ||
    ratio < 1 ||
    ratio > 2
  )
    throw new RangeError('Progress0–1 and mass ratio1–2 required');
  const length = 0.5,
    initialAngle = 0.5,
    m2 = 0.519,
    m1 = m2 * ratio,
    u = Math.sqrt(2 * 9.81 * length * (1 - Math.cos(initialAngle))),
    impact = collision1D(m1, m2, u, 0, 1),
    beforeTime = pendulumQuarter(initialAngle, length),
    angle2 = Math.acos(1 - (impact.v2 * impact.v2) / (2 * 9.81 * length)),
    afterTime = pendulumQuarter(angle2, length),
    time = progress * (beforeTime + afterTime) - beforeTime,
    a =
      time < 0
        ? pendulumStep(u / length, time, length)
        : pendulumStep(impact.v1 / length, time, length),
    b =
      time < 0 ? { angle: 0, angularVelocity: 0 } : pendulumStep(impact.v2 / length, time, length);
  return {
    a,
    b,
    length,
    time,
    initialAngle,
    initialHeight: length * (1 - Math.cos(initialAngle)),
    height2: length * (1 - Math.cos(angle2)),
    ...impact,
  };
}
export function tapeDots(speed = 0.6) {
  const impact = 0.7 / speed,
    s = cartCollisionRun('tape', 0, speed),
    end = cartRunDuration('tape', speed);
  return Array.from({ length: Math.floor(end / 0.02) + 1 }, (_, i) => {
    const time = i * 0.02;
    return { time, x: time < impact ? speed * time : 0.7 + s.v1 * (time - impact) };
  });
}
