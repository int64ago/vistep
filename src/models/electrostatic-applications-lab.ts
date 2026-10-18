import { foilAngle, ELECTROSTATIC_K as K } from './electrostatic-induction';
export type CageMaterial = 'none' | 'metal' | 'plastic';
const R = 0.15;
function pointField(x: number, y: number, q: number, sx: number) {
  const dx = x - sx,
    r = Math.hypot(dx, y);
  if (r < 1e-8) return { potential: 0, ex: 0, ey: 0 };
  return { potential: (K * q) / r, ex: (K * q * dx) / r ** 3, ey: (K * q * y) / r ** 3 };
}
export function cageField(
  x: number,
  y: number,
  charge = 20e-9,
  distance = 0.3,
  material: CageMaterial = 'metal',
) {
  if (![x, y, charge, distance].every(Number.isFinite) || distance <= R)
    throw new RangeError('Finite coordinates; external source must remain outside cage.');
  const direct = pointField(x, y, charge, -distance);
  if (material !== 'metal') return direct;
  if (Math.hypot(x, y) < R) return { potential: (K * charge) / distance, ex: 0, ey: 0 };
  const image = pointField(x, y, (-charge * R) / distance, (-R * R) / distance),
    center = pointField(x, y, (charge * R) / distance, 0);
  return {
    potential: direct.potential + image.potential + center.potential,
    ex: direct.ex + image.ex + center.ex,
    ey: direct.ey + image.ey + center.ey,
  };
}
export function cageSurfaceDensity(theta: number, charge = 20e-9, distance = 0.3) {
  if (![theta, charge, distance].every(Number.isFinite) || distance <= R)
    throw new RangeError('External charge geometry required.');
  const s = Math.sqrt(distance ** 2 + R ** 2 + 2 * distance * R * Math.cos(theta));
  return (
    (-charge * (distance ** 2 - R ** 2)) / (4 * Math.PI * R * s ** 3) +
    charge / (4 * Math.PI * distance * R)
  );
}
export function shieldingState(distance = 0.3, charge = 20e-9, material: CageMaterial = 'metal') {
  const top = cageField(0, -0.03, charge, distance, material),
    lower = cageField(0, 0.06, charge, distance, material),
    leavesCharge = 25e-12 * (top.potential - lower.potential),
    angle = foilAngle(leavesCharge, 0.035, 1e-7);
  return { top, lower, leavesCharge, angle, radius: R, distance, charge, material };
}
export type SmokeParticle = {
  id: number;
  x: number;
  y: number;
  charge: number;
  collected: boolean;
  exited: boolean;
  age: number;
};
export function smokeState(time: number, voltage = 5000, charging = true) {
  if (
    ![time, voltage].every(Number.isFinite) ||
    time < 0 ||
    time > 60 ||
    voltage < 0 ||
    voltage > 10000
  )
    throw new RangeError('Bounded nonnegative model time and voltage required.');
  const onStart = 8,
    onEnd = 20,
    gap = 0.1,
    viscosity = 1.81e-5,
    radius = 1e-6,
    qmax = 600 * 1.602176634e-19,
    tau = 0.65,
    drift = ((qmax * voltage) / gap / (6 * Math.PI * viscosity * radius)) * (charging ? 1 : 0),
    rise = 0.0065,
    plate = 0.1,
    particles: SmokeParticle[] = [];
  const displacement = (t: number) => drift * (t + tau * Math.expm1(-t / tau));
  for (let id = 0; id < 150; id++) {
    const born = -8 + id * 0.45;
    if (born > time) break;
    const age = time - born,
      x0 = 0.015 + 0.04 * (((id * 37) % 101) / 100),
      start = Math.max(born, onStart),
      active = Math.max(0, Math.min(time, onEnd) - start),
      q = charging && voltage > 0 ? -qmax * -Math.expm1(-active / tau) : 0,
      dx = displacement(active),
      collected = x0 + dx >= plate;
    let hit = time;
    if (collected) {
      let lo = 0,
        hi = active;
      for (let i = 0; i < 45; i++) {
        const m = (lo + hi) / 2;
        if (x0 + displacement(m) < plate) lo = m;
        else hi = m;
      }
      hit = start + (lo + hi) / 2;
    }
    const exitAt = born + 0.2 / rise,
      exited = exitAt < Math.min(time, hit),
      y = rise * (Math.min(time, hit, exitAt) - born);
    particles.push({
      id,
      x: Math.min(plate, x0 + dx),
      y,
      charge: q,
      collected: collected && !exited,
      exited,
      age,
    });
  }
  return {
    time,
    voltage,
    on: time >= onStart && time < onEnd && voltage > 0,
    field: time >= onStart && time < onEnd ? -voltage / gap : 0,
    drift,
    particles,
    suspended: particles.filter((x) => !x.collected && !x.exited).length,
    collected: particles.filter((x) => x.collected).length,
    exited: particles.filter((x) => x.exited).length,
  };
}
