/** Quasi-static lumped-conductor teaching model. SI units; no charge is created. */
export const ELECTROSTATIC_K = 8.9875517923e9;
export const electroClamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const electroSmooth = (x: number) => {
  const p = electroClamp(x);
  return p * p * (3 - 2 * p);
};
export function conductorChargeSplit(
  total: number,
  source: number,
  near: number,
  far: number,
  radiusA = 0.045,
  radiusB = 0.045,
  separation = 0.17,
) {
  if (
    ![total, source, near, far, radiusA, radiusB, separation].every(Number.isFinite) ||
    Math.min(near, far, radiusA, radiusB) <= 0 ||
    separation <= radiusA + radiusB
  )
    throw new RangeError('Finite charges and separated positive conductor geometry required.');
  const denominator = 1 / radiusA + 1 / radiusB - 2 / separation;
  const a = (total * (1 / radiusB - 1 / separation) + source * (1 / far - 1 / near)) / denominator;
  return { a, b: total - a, total };
}
/** Point charges at foil tips balance gravity. A geometry surrogate, not an electroscope calibration. */
export function foilAngle(charge: number, length = 0.06, mass = 0.00001) {
  if (!Number.isFinite(charge) || !(length > 0) || !(mass > 0))
    throw new RangeError('Finite charge and positive foil geometry required.');
  if (charge === 0) return 0;
  let lo = 0,
    hi = Math.PI / 2 - 1e-6;
  for (let i = 0; i < 60; i++) {
    const a = (lo + hi) / 2;
    const residual =
      mass * 9.8 * Math.tan(a) * (2 * length * Math.sin(a)) ** 2 -
      ELECTROSTATIC_K * (charge / 2) ** 2;
    if (residual < 0) lo = a;
    else hi = a;
  }
  return (lo + hi) / 2;
}
export function inductionProtocol(progress: number, polarity = 1) {
  const p = electroClamp(progress, 0, 4),
    source = Math.sign(polarity || 1) * 1e-9;
  const approach = p < 1 ? electroSmooth(p) : p < 2 ? 1 : p < 3 ? 1 - electroSmooth(p - 2) : 0;
  const gap =
    p < 1 ? 0 : p < 2 ? electroSmooth(p - 1) : p < 3 ? 1 : 1 - electroSmooth((p - 3) / 0.7);
  const held = conductorChargeSplit(0, source, 0.1, 0.27).a;
  const a =
    p <= 1
      ? conductorChargeSplit(
          0,
          source,
          0.1 / Math.max(approach, 1e-8),
          0.1 / Math.max(approach, 1e-8) + 0.17,
        ).a
      : p < 3.7
        ? held
        : held * (1 - electroSmooth((p - 3.7) / 0.3));
  return {
    progress: p,
    source,
    approach,
    gap,
    a: p === 0 || p === 4 ? 0 : a,
    b: p === 0 || p === 4 ? 0 : -a,
    connected: gap < 1e-7,
    transfer: Math.abs(a / held),
  };
}
export function electroscopeState(proximity: number, netCharge: number, source = 1e-9) {
  const p = electroClamp(proximity),
    near = 0.14 / Math.max(p, 1e-8);
  const split = conductorChargeSplit(
    netCharge,
    p === 0 ? 0 : source,
    near,
    near + 0.16,
    0.03,
    0.025,
    0.16,
  );
  return { top: split.a, leaves: split.b, netCharge, angle: foilAngle(split.b) };
}
/** Eight charged elastic filaments: equilibrium of Coulomb forces, gravity and root stiffness. */
export function chargedHair(totalCharge: number) {
  const count = 8,
    length = 0.09,
    stiffness = 3e-6,
    mass = 1e-6;
  const roots = Array.from({ length: count }, (_, i) => ({
    x: (i - 3.5) * 0.012,
    y: -0.035 * Math.sqrt(Math.max(0, 1 - ((i - 3.5) / 4.5) ** 2)),
  }));
  const angles = roots.map((_, i) => (i - 3.5) * 0.018);
  const q = totalCharge / count;
  for (let n = 0; n < 240; n++) {
    const tips = roots.map((r, i) => ({
      x: r.x + length * Math.sin(angles[i]),
      y: r.y - length * Math.cos(angles[i]),
    }));
    const next = angles.map((theta, i) => {
      let fx = 0,
        fy = 0;
      for (let j = 0; j < count; j++)
        if (j !== i) {
          const dx = tips[i].x - tips[j].x,
            dy = tips[i].y - tips[j].y,
            r = Math.hypot(dx, dy);
          const f = (ELECTROSTATIC_K * q * q) / (r * r * r);
          fx += f * dx;
          fy += f * dy;
        }
      const gradient =
        stiffness * (theta - (i - 3.5) * 0.018) +
        mass * 9.8 * length * Math.sin(theta) -
        length * (fx * Math.cos(theta) + fy * Math.sin(theta));
      return electroClamp(
        theta - electroClamp((gradient / stiffness) * 0.04, -0.025, 0.025),
        -1.4,
        1.4,
      );
    });
    angles.splice(0, count, ...next);
  }
  return roots.map((root, i) => ({
    root,
    angle: angles[i],
    tip: { x: root.x + length * Math.sin(angles[i]), y: root.y - length * Math.cos(angles[i]) },
    charge: q,
  }));
}
export type ElectrostaticMode = 'friction' | 'induction' | 'electroscope' | 'hair';
export function electrostaticModeForVariant(variant?: string): ElectrostaticMode {
  return variant?.includes('electroscope')
    ? 'electroscope'
    : variant?.includes('hair')
      ? 'hair'
      : variant?.includes('friction') || variant?.includes('franklin')
        ? 'friction'
        : 'induction';
}
