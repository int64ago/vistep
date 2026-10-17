/** Lossless one-dimensional finite-duration contact with two equal series bumper
 * springs (each stiffness 2k). No spring overlap or velocity teleport at contact. */
export interface CollisionParameters {
  m1: number;
  m2: number;
  u1: number;
  u2: number;
  stiffness: number;
}
export const collisionDefaults = (): CollisionParameters => ({
  m1: 1,
  m2: 1,
  u1: 1,
  u2: 0,
  stiffness: 150,
});
export function elasticCollision(p: CollisionParameters, time: number) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.m1 <= 0 ||
    p.m2 <= 0 ||
    p.stiffness <= 0 ||
    p.u1 <= p.u2 ||
    !Number.isFinite(time) ||
    time < 0 ||
    time > 6
  )
    throw new RangeError('Approaching positive masses and bounded time required');
  const x10 = -0.8,
    x20 = 0.5,
    bodyHalf = 0.21,
    bumperLength = 0.1,
    contactDistance = 2 * (bodyHalf + bumperLength),
    mass = p.m1 + p.m2,
    reduced = (p.m1 * p.m2) / mass,
    relative = p.u1 - p.u2,
    frequency = Math.sqrt(p.stiffness / reduced),
    contactAt = (x20 - x10 - contactDistance) / relative,
    contactDuration = Math.PI / frequency,
    releaseAt = contactAt + contactDuration,
    centerInitial = (p.m1 * x10 + p.m2 * x20) / mass,
    centerSpeed = (p.m1 * p.u1 + p.m2 * p.u2) / mass,
    center = centerInitial + centerSpeed * time;
  if (relative / frequency >= 2 * bumperLength)
    throw new RangeError('Compression exceeds the stated bumper travel');
  let compression = 0,
    separation = x20 - x10 - relative * time,
    relativeSpeed = -relative,
    impulse = 0,
    phase: 'approach' | 'compression' | 'release' | 'separated' = 'approach';
  if (time >= contactAt && time <= releaseAt) {
    const angle = (time - contactAt) * frequency;
    compression = Math.max(0, (relative / frequency) * Math.sin(angle));
    separation = contactDistance - compression;
    relativeSpeed = -relative * Math.cos(angle);
    impulse = reduced * relative * (1 - Math.cos(angle));
    phase = angle < Math.PI / 2 ? 'compression' : 'release';
  } else if (time > releaseAt) {
    separation = contactDistance + relative * (time - releaseAt);
    relativeSpeed = relative;
    impulse = 2 * reduced * relative;
    phase = 'separated';
  }
  const x1 = center - (p.m2 / mass) * separation,
    x2 = center + (p.m1 / mass) * separation,
    v1 = centerSpeed - (p.m2 / mass) * relativeSpeed,
    v2 = centerSpeed + (p.m1 / mass) * relativeSpeed,
    force = p.stiffness * compression,
    kinetic = 0.5 * p.m1 * v1 * v1 + 0.5 * p.m2 * v2 * v2,
    springEnergy = 0.5 * p.stiffness * compression ** 2,
    initialEnergy = 0.5 * p.m1 * p.u1 ** 2 + 0.5 * p.m2 * p.u2 ** 2;
  return {
    ...p,
    time,
    x1,
    x2,
    v1,
    v2,
    compression,
    force,
    kinetic,
    springEnergy,
    initialEnergy,
    totalEnergy: kinetic + springEnergy,
    momentum: p.m1 * v1 + p.m2 * v2,
    impulse,
    center,
    centerSpeed,
    centerInitial,
    bodyHalf,
    bumperLength,
    contactDistance,
    contactAt,
    contactDuration,
    releaseAt,
    phase,
    reduced,
    frequency,
  };
}
export type CollisionState = ReturnType<typeof elasticCollision>;
export function elasticCollisionShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = collisionDefaults();
  if (chapter === 3) p.m2 = 3;
  if (chapter === 4) p.m1 = 3;
  if (chapter === 5) {
    p.m2 = 3;
    p.u2 = -0.2;
  }
  const s = elasticCollision(p, 0);
  let time = (s.releaseAt + 0.35) * u;
  if (chapter === 1) time = s.contactAt + s.contactDuration * 0.5 * u;
  if (chapter === 2) time = s.contactAt + s.contactDuration * (0.5 + 0.5 * u);
  return { state: elasticCollision(p, time), frame: chapter === 5 ? 'center' : 'lab' } as const;
}
