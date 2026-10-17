/** Eccentric circular cam and a centered translating roller. The roller centre
 * follows exact circle tangency; its guide carries lateral force. SI units. */
export interface CamParameters {
  radius: number;
  roller: number;
  eccentricity: number;
  rpm: number;
  mass: number;
  spring: number;
  preload: number;
}
export const camDefaults = (): CamParameters => ({
  radius: 0.025,
  roller: 0.008,
  eccentricity: 0.008,
  rpm: 120,
  mass: 0.2,
  spring: 400,
  preload: 0.006,
});
export function camConstraint(p: CamParameters, angle: number) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.radius <= 0 ||
    p.roller <= 0 ||
    p.eccentricity < 0 ||
    p.eccentricity >= p.radius ||
    p.rpm <= 0 ||
    p.mass <= 0 ||
    p.spring < 0 ||
    p.preload < 0 ||
    !Number.isFinite(angle)
  )
    throw new RangeError('Positive geometry, speed and mass; offset smaller than cam radius');
  const d = p.radius + p.roller,
    a = p.eccentricity * Math.cos(angle),
    b = p.eccentricity * Math.sin(angle),
    h = Math.sqrt(d * d - a * a),
    height = b + h,
    d1 = a + (a * b) / h,
    d2 = -b + (a * a - b * b) / h - (a * a * b * b) / h ** 3,
    w = (p.rpm * Math.PI) / 30,
    min = d - p.eccentricity,
    springForce = p.spring * (height - min + p.preload),
    vertical = p.mass * d2 * w * w + p.mass * 9.81 + springForce;
  return {
    angle,
    cam: { x: a, y: b },
    height,
    velocity: d1 * w,
    acceleration: d2 * w * w,
    normalCos: h / d,
    requiredNormal: (vertical * d) / h,
    springForce,
    contact: { x: (a * p.roller) / d, y: b + (p.radius * h) / d },
    min,
    max: d + p.eccentricity,
    stroke: 2 * p.eccentricity,
  };
}
export interface CamPoint {
  time: number;
  height: number;
  velocity: number;
  contact: boolean;
  normal: number;
  gap: number;
}
function free(p: CamParameters, y: number, v: number, dt: number) {
  if (!p.spring) return { height: y + v * dt - 0.5 * 9.81 * dt * dt, velocity: v - 9.81 * dt };
  const w = Math.sqrt(p.spring / p.mass),
    eq = p.radius + p.roller - p.eccentricity - p.preload - (p.mass * 9.81) / p.spring,
    c = Math.cos(w * dt),
    s = Math.sin(w * dt);
  return { height: eq + (y - eq) * c + (v * s) / w, velocity: -(y - eq) * w * s + v * c };
}
/** Unilateral contact with inelastic re-contact. Free-flight propagation is exact;
 * event resolution is bounded by the requested angular time step. */
export function camTrajectory(p: CamParameters, cycles = 2, stepsPerTurn = 1440): CamPoint[] {
  if (
    !Number.isInteger(stepsPerTurn) ||
    stepsPerTurn < 180 ||
    stepsPerTurn > 5760 ||
    !Number.isFinite(cycles) ||
    cycles <= 0 ||
    cycles > 4
  )
    throw new RangeError('Bounded trajectory required');
  const w = (p.rpm * Math.PI) / 30,
    h = 60 / p.rpm / stepsPerTurn,
    first = camConstraint(p, 0),
    points: CamPoint[] = [
      {
        time: 0,
        height: first.height,
        velocity: first.velocity,
        contact: first.requiredNormal >= 0,
        normal: Math.max(0, first.requiredNormal),
        gap: 0,
      },
    ];
  for (let i = 1; i <= Math.ceil(cycles * stepsPerTurn); i++) {
    const prev = points[i - 1],
      time = i * h,
      q = camConstraint(p, time * w);
    let y = q.height,
      v = q.velocity,
      contact = prev.contact && q.requiredNormal >= 0;
    if (!contact) {
      const f = free(p, prev.height, prev.velocity, h);
      y = f.height;
      v = f.velocity;
      if (y <= q.height) {
        y = q.height;
        v = q.velocity;
        contact = q.requiredNormal >= 0;
      }
    }
    points.push({
      time,
      height: y,
      velocity: v,
      contact,
      normal: contact ? Math.max(0, q.requiredNormal) : 0,
      gap: Math.max(0, y - q.height),
    });
  }
  return points;
}
export function camSample(points: CamPoint[], time: number) {
  const h = points[1].time,
    index = Math.max(0, Math.min(points.length - 1, Math.round(time / h)));
  return points[index];
}
export function camShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = camDefaults();
  let angle = u * Math.PI * 2;
  if (chapter === 0) p.eccentricity = 0;
  if (chapter === 1) {
    p.eccentricity = 0.008 * u;
    angle = Math.PI / 2;
  }
  if (chapter === 2) p.rpm = 30;
  if (chapter >= 4) {
    p.rpm = 600;
    p.spring = chapter === 4 ? 0 : 400;
    angle = u * Math.PI * 4;
  }
  return { parameters: p, angle, time: angle / ((p.rpm * Math.PI) / 30) };
}
