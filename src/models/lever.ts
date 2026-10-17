/** Massless rigid lever, fixed frictionless pivot, SI units. Force direction is
 * measured away from vertical down, toward the left; positive rotation is CCW.
 * Motion is prescribed quasi-statically, not an inertial dynamics prediction. */
export interface LeverInput {
  effortArm: number;
  loadArm: number;
  load: number;
  effort: number;
  direction: number;
  rotation: number;
}
export function leverState(p: LeverInput) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.effortArm <= 0 ||
    p.loadArm <= 0 ||
    p.load < 0 ||
    p.effort < 0
  )
    throw new RangeError('Finite lengths > 0 and forces ≥ 0 required');
  const a = (p.direction * Math.PI) / 180,
    q = p.rotation;
  const point = { x: -p.effortArm * Math.cos(q), y: -p.effortArm * Math.sin(q) };
  const loadPoint = { x: p.loadArm * Math.cos(q), y: p.loadArm * Math.sin(q) };
  const unit = { x: -Math.sin(a), y: -Math.cos(a) };
  const along = point.x * unit.x + point.y * unit.y;
  const foot = { x: point.x - along * unit.x, y: point.y - along * unit.y };
  const signedArm = point.x * unit.y - point.y * unit.x;
  const effortTorque = signedArm * p.effort,
    loadTorque = -loadPoint.x * p.load;
  const requiredEffort = signedArm > 1e-10 ? -loadTorque / signedArm : null;
  return {
    point,
    loadPoint,
    unit,
    foot,
    arm: Math.hypot(foot.x, foot.y),
    effortTorque,
    loadTorque,
    netTorque: effortTorque + loadTorque,
    requiredEffort,
    reaction: { x: -unit.x * p.effort, y: p.load - unit.y * p.effort },
    inputTravel: p.effortArm * Math.sin(q),
    outputTravel: p.loadArm * Math.sin(q),
    inputWork: p.effort * (unit.x * (point.x + p.effortArm) + unit.y * point.y),
    outputWork: p.load * p.loadArm * Math.sin(q),
  };
}
export const leverDefaults = (): LeverInput => ({
  effortArm: 2,
  loadArm: 1,
  load: 120,
  effort: 60,
  direction: 0,
  rotation: 0,
});
export function leverShot(chapter: number, progress: number): LeverInput {
  const u = Math.max(0, Math.min(1, progress)),
    e = u * u * (3 - 2 * u),
    p = leverDefaults();
  if (chapter === 0) {
    p.effortArm = 1;
    p.effort = 120;
  }
  if (chapter === 1) {
    p.effortArm = 1 + e;
    p.effort = 120 / p.effortArm;
  }
  if (chapter === 2) p.direction = 60 * e;
  if (chapter === 3) {
    p.direction = 60;
    p.effort = 60 + 60 * e;
  }
  if (chapter === 4) {
    p.direction = 90 * e;
    p.effort = 120;
  }
  if (chapter >= 5) p.rotation = 0.18 * e;
  return p;
}
