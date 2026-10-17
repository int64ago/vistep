export function hohmannPlan(from = 1, to = 1.8, mu = 1) {
  if (
    ![from, to, mu].every((v) => Number.isFinite(v) && v > 0) ||
    from < 0.1 ||
    to < 0.1 ||
    mu < 0.01 ||
    from > 10 ||
    to > 10 ||
    mu > 100
  )
    throw new RangeError('Positive bounded orbit parameters');
  const a = (from + to) / 2,
    e = (to - from) / (to + from),
    b = Math.sqrt(from * to),
    meanMotion = Math.sqrt(mu / a ** 3),
    initialCircular = Math.sqrt(mu / from),
    finalCircular = Math.sqrt(mu / to),
    departure = Math.sqrt(mu * (2 / from - 1 / a)),
    arrival = Math.sqrt(mu * (2 / to - 1 / a));
  return {
    from,
    to,
    mu,
    a,
    e,
    b,
    meanMotion,
    initialCircular,
    finalCircular,
    departure,
    arrival,
    burn1: departure - initialCircular,
    burn2: finalCircular - arrival,
    flightTime: Math.PI / meanMotion,
    energy: -mu / (2 * a),
    angularMomentum: Math.sqrt(mu * a * (1 - e * e)),
  };
}
export type HohmannPlan = ReturnType<typeof hohmannPlan>;
/** Progress 0→1 is outbound half an ellipse; 1→2 continues without the second impulse. */
export function hohmannState(progress: number, plan = hohmannPlan()) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 2)
    throw new RangeError('Transfer progress0–2');
  const mean = progress * Math.PI;
  let lo = 0,
    hi = 2 * Math.PI;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (mid - plan.e * Math.sin(mid) < mean) lo = mid;
    else hi = mid;
  }
  const eccentric = (lo + hi) / 2,
    denom = 1 - plan.e * Math.cos(eccentric),
    x = plan.a * (Math.cos(eccentric) - plan.e),
    y = plan.b * Math.sin(eccentric),
    vx = (-plan.a * Math.sin(eccentric) * plan.meanMotion) / denom,
    vy = (plan.b * Math.cos(eccentric) * plan.meanMotion) / denom,
    r = Math.hypot(x, y),
    speed = Math.hypot(vx, vy);
  return {
    x,
    y,
    vx,
    vy,
    r,
    speed,
    energy: (speed * speed) / 2 - plan.mu / r,
    time: progress * plan.flightTime,
  };
}
export function hohmannCircle(radius: number, angle: number, mu = 1) {
  if (!Number.isFinite(angle)) throw new RangeError('Finite angle required');
  hohmannPlan(radius, radius, mu);
  const speed = Math.sqrt(mu / radius);
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
    vx: -speed * Math.sin(angle),
    vy: speed * Math.cos(angle),
    r: radius,
    speed,
    energy: -mu / (2 * radius),
    time: 0,
  };
}
