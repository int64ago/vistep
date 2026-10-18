export function movingPaper(time: number, duration = 0.35) {
  if (![time, duration].every(Number.isFinite) || duration <= 0)
    throw new RangeError('Finite time and positive pull duration required.');
  const t = Math.max(0, Math.min(time, duration)),
    u = (Math.PI * t) / duration;
  return {
    position: 0.25 * (1 - Math.cos(u)),
    velocity: time < 0 || time >= duration ? 0 : ((0.25 * Math.PI) / duration) * Math.sin(u),
    acceleration: time < 0 || time >= duration ? 0 : 0.25 * (Math.PI / duration) ** 2 * Math.cos(u),
  };
}
/** Coulomb contact with static sticking of a solid sphere's contact point. Units m, s. */
export function paperBall(time: number, duration = 0.35, coefficient = 0.03) {
  if (
    ![time, duration, coefficient].every(Number.isFinite) ||
    time < 0 ||
    time > 5 ||
    duration <= 0 ||
    coefficient < 0 ||
    coefficient > 0.2
  )
    throw new RangeError('Finite bounded pull conditions required.');
  const steps = Math.max(1, Math.ceil(time / 0.0005)),
    dt = time / steps;
  let position = 0,
    velocity = 0,
    spinSpeed = 0,
    angle = 0,
    acceleration = 0,
    onPaper = true;
  const inertiaRatio = 0.4,
    radius = 0.03;
  for (let i = 0; i < steps; i++) {
    const current = i * dt,
      paper = movingPaper(current, duration),
      next = movingPaper(current + dt, duration);
    onPaper = position >= paper.position - 0.3 && position <= paper.position + 0.3;
    const surfaceVelocity = onPaper ? next.velocity : 0,
      mu = onPaper ? coefficient : 0.1,
      needed = (surfaceVelocity - (velocity - spinSpeed)) / (1 + 1 / inertiaRatio),
      limit = mu * 1.3 * 9.8 * dt;
    const impulse = Math.abs(needed) <= limit ? needed : Math.sign(needed) * mu * 9.8 * dt,
      previous = velocity,
      oldSpin = spinSpeed;
    velocity += impulse;
    spinSpeed -= impulse / inertiaRatio;
    position += ((previous + velocity) * dt) / 2;
    angle += ((oldSpin + spinSpeed) * dt) / (2 * radius);
    acceleration = dt ? impulse / dt : 0;
  }
  const paper = movingPaper(time, duration);
  return {
    position,
    velocity,
    acceleration,
    angle,
    spinSpeed,
    paper,
    onPaper,
    relativePosition: position - paper.position,
    relativeVelocity: velocity - paper.velocity,
    relativeAcceleration: acceleration - paper.acceleration,
  };
}
