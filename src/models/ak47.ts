/** A generic, dimensionless one-pulse mass–spring teaching model.
 * This is NOT a firearm dynamics model: no geometry, pressure, rate, ammunition,
 * locking or firing-system parameters are represented or configurable.
 * x'' = drive(τ) - x - 0.16 x'. A non-rebounding boundary ends the one excursion.
 * Work and dissipation are integrated with the same RK4 stages as the motion.
 */
export type Ak47Sample = {
  tau: number;
  x: number;
  velocity: number;
  input: number;
  loss: number;
  kinetic: number;
  elastic: number;
  drive: number;
  complete: boolean;
};
type Vector = [number, number, number, number];
const damping = 0.16;
export function ak47Drive(tau: number) {
  if (!Number.isFinite(tau)) throw new RangeError('Finite model time required');
  return tau > 0 && tau < 0.55 ? 4 * Math.sin((Math.PI * tau) / 0.55) ** 2 : 0;
}
function derivative(tau: number, s: Vector): Vector {
  const force = ak47Drive(tau);
  return [s[1], force - s[0] - damping * s[1], force * s[1], damping * s[1] ** 2];
}
function step(t: number, s: Vector, h: number): Vector {
  const add = (a: Vector, b: Vector, scale: number): Vector =>
    a.map((v, i) => v + b[i] * scale) as Vector;
  const k1 = derivative(t, s),
    k2 = derivative(t + h / 2, add(s, k1, h / 2)),
    k3 = derivative(t + h / 2, add(s, k2, h / 2)),
    k4 = derivative(t + h, add(s, k3, h));
  return s.map((v, i) => v + (h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6) as Vector;
}
function sample(tau: number, s: Vector, complete = false): Ak47Sample {
  return {
    tau,
    x: s[0],
    velocity: s[1],
    input: s[2],
    loss: s[3],
    kinetic: s[1] ** 2 / 2,
    elastic: s[0] ** 2 / 2,
    drive: ak47Drive(tau),
    complete,
  };
}
function solve() {
  const h = 1 / 1200,
    result: Ak47Sample[] = [sample(0, [0, 0, 0, 0])];
  let s: Vector = [0, 0, 0, 0];
  for (let i = 1; i < 12000; i++) {
    const t = (i - 1) * h,
      next = step(t, s, h);
    if (i > 700 && next[0] <= 0) {
      // Locate the front boundary using the same integrator, not an arbitrary snapped path.
      let low = 0,
        high = h;
      for (let j = 0; j < 40; j++) {
        const middle = (low + high) / 2;
        if (step(t, s, middle)[0] > 0) low = middle;
        else high = middle;
      }
      const final = step(t, s, (low + high) / 2);
      result.push(
        sample(t + (low + high) / 2, [0, 0, final[2], final[3] + final[1] ** 2 / 2], true),
      );
      return result;
    }
    s = next;
    result.push(sample(i * h, s));
  }
  throw new Error('Teaching trajectory did not return');
}
const trajectory = solve();
export const AK47_MODEL = Object.freeze({
  duration: trajectory.at(-1)!.tau,
  maximumX: Math.max(...trajectory.map((v) => v.x)),
  peakProgress:
    trajectory.reduce((best, v, i) => (v.x > trajectory[best].x ? i : best), 0) /
    (1200 * trajectory.at(-1)!.tau),
  input: trajectory.at(-1)!.input,
  driveEndProgress: 0.55 / trajectory.at(-1)!.tau,
});
export function ak47State(progress: number): Ak47Sample {
  if (!Number.isFinite(progress)) throw new RangeError('Finite progress required');
  const p = Math.max(0, Math.min(1, progress));
  if (p === 1) return { ...trajectory.at(-1)! };
  const tau = p * AK47_MODEL.duration;
  const index = Math.min(trajectory.length - 2, Math.floor(tau * 1200));
  const a = trajectory[index];
  return sample(tau, step(a.tau, [a.x, a.velocity, a.input, a.loss], tau - a.tau));
}
export const ak47Clamp = (v: number) => Math.max(0, Math.min(1, v));
// Beyond the end of the energy pulse, both passes have received the same work.
// Earlier equal-position pairs are valid motion states but do not isolate dissipation.
export const AK47_COMPARE_RANGE = Object.freeze({ min: 0.3, max: 0.9 });
const smooth = (v: number) => {
  const p = ak47Clamp(v);
  return p * p * (3 - 2 * p);
};
const ramp = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
export type Ak47View = 'object' | 'drive' | 'linked' | 'store' | 'return' | 'compare' | 'cycle';
const views: Ak47View[] = ['object', 'drive', 'linked', 'store', 'return', 'compare', 'cycle'];
export function ak47Shot(chapter: number, progress: number) {
  if (![chapter, progress].every(Number.isFinite))
    throw new RangeError('Finite film position required');
  const c = Math.max(0, Math.min(6, Math.floor(chapter))),
    p = ak47Clamp(progress);
  const peak = AK47_MODEL.peakProgress,
    drive = AK47_MODEL.driveEndProgress;
  const phase = [
    0,
    drive * ramp(p, 0.12, 0.7),
    peak * ramp(p, 0.12, 0.8),
    drive + (peak - drive) * ramp(p, 0.12, 0.75),
    peak + (1 - peak) * ramp(p, 0.12, 0.8),
    peak,
    ramp(p, 0.1, 0.78),
  ][c];
  return {
    view: views[c],
    progress: phase,
    reveal: c === 0 ? ramp(p, 0.23, 0.48) : 1,
    comparePosition: AK47_COMPARE_RANGE.min + 0.45 * ramp(p, 0.15, 0.7),
  };
}
/** The two independently reconstructed times at one displacement. */
export function ak47Compare(position: number) {
  if (!Number.isFinite(position)) throw new RangeError('Finite comparison position required');
  const wanted = ak47Clamp(position) * AK47_MODEL.maximumX;
  const locate = (a: number, b: number, increasing: boolean) => {
    for (let i = 0; i < 45; i++) {
      const mid = (a + b) / 2;
      if (ak47State(mid).x < wanted === increasing) a = mid;
      else b = mid;
    }
    return ak47State((a + b) / 2);
  };
  return {
    outward: locate(0, AK47_MODEL.peakProgress, true),
    returning: locate(AK47_MODEL.peakProgress, 1, false),
  };
}
