export type WaxMode = 'vertical' | 'uniform' | 'accelerated';
/** Terminal-rise teaching regime after the initial settling transient. */
export function waxMotion(
  time: number,
  mode: WaxMode = 'uniform',
  horizontal = 0.12,
  vertical = 0.1,
  acceleration = 0.08,
) {
  if (
    ![time, horizontal, vertical, acceleration].every(Number.isFinite) ||
    vertical <= 0 ||
    horizontal < 0 ||
    acceleration < 0
  )
    throw new RangeError('Finite nonnegative horizontal motion and positive rise speed required');
  const duration = Math.min(5, 0.78 / vertical),
    t = Math.max(0, Math.min(duration, time)),
    x =
      mode === 'vertical'
        ? 0
        : mode === 'accelerated'
          ? 0.5 * acceleration * t * t
          : horizontal * t,
    y = vertical * t,
    vx = mode === 'vertical' ? 0 : mode === 'accelerated' ? acceleration * t : horizontal,
    vy = vertical;
  return {
    time: t,
    x,
    y,
    vx,
    vy,
    ax: mode === 'accelerated' ? acceleration : 0,
    speed: Math.hypot(vx, vy),
    angle: Math.atan2(vy, vx),
    duration,
  };
}
/** Illustrative buoyancy-minus-linear-drag transient, not measured wax data. */
export function waxRise(time: number, terminal = 0.1, tau = 0.25) {
  if (![time, terminal, tau].every(Number.isFinite) || terminal <= 0 || tau <= 0)
    throw new RangeError('Positive terminal speed and settling time required');
  const t = Math.max(0, time),
    e = Math.exp(-t / tau);
  return { y: terminal * (t - tau * (1 - e)), v: terminal * (1 - e), a: (terminal / tau) * e };
}
