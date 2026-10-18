export const ELECTROLYSIS_F = 96485.33212;
export const electroClamp = (v: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
export type ElectrolysisKind = 'chloride' | 'plating';
/** Current is an observed/assumed mean input. This does not infer current from voltage or complex bath kinetics. */
export function electrolysisState(
  kind: ElectrolysisKind,
  time: number,
  current = 0.2,
  closed = true,
  reverse = false,
  immersed = true,
) {
  const t = electroClamp(time, 0, 900),
    requested = electroClamp(current, 0, 0.5),
    active = closed && immersed && requested > 0,
    I = active ? requested : 0,
    Q = I * t;
  const chlorideCu = (0.25 * 20) / 134.452,
    platingCu = 0.2 * 0.05,
    initialCu = kind === 'chloride' ? chlorideCu : platingCu;
  const maximum =
    kind === 'chloride' ? initialCu : reverse ? Math.min(initialCu, 3.675 / 55.845) : 4.18 / 63.546;
  const extent = Math.min(maximum, Q / (2 * ELECTROLYSIS_F)),
    usedCharge = extent * 2 * ELECTROLYSIS_F;
  // An isolated iron surface can displace copper without external current. Its rate is illustrative.
  const cementation =
    kind === 'plating' && !active && immersed
      ? Math.min(initialCu, 3.675 / 55.845, 0.0000003 * t)
      : 0;
  const cathodeCu = extent,
    anodeCu = kind === 'plating' && !reverse ? extent : 0,
    anodeFe = kind === 'plating' && reverse ? extent : 0;
  const copperInSolution = initialCu - cathodeCu + anodeCu - cementation,
    ironInSolution = anodeFe + cementation,
    chlorine = kind === 'chloride' ? extent : 0;
  const area = kind === 'chloride' ? 2 * Math.PI * 0.25 * 3 + Math.PI * 0.25 ** 2 : 6.7,
    depositMass = cathodeCu * 63.546,
    thicknessUm = (depositMass / (8.96 * area)) * 1e4;
  return {
    I: extent < maximum ? I : 0,
    Q: usedCharge,
    extent,
    initialCu,
    copperInSolution,
    ironInSolution,
    cathodeCu,
    anodeCu,
    anodeFe,
    cementation,
    cementedMass: cementation * 63.546,
    depositMass,
    anodeCopperMass: 4.18 - anodeCu * 63.546,
    ironMass: 3.675 - (anodeFe + cementation) * 55.845,
    chlorine,
    dissolvedChlorine: 0.7 * chlorine,
    escapedChlorine: 0.3 * chlorine,
    chlorideLeft: kind === 'chloride' ? 2 * initialCu - 2 * chlorine : 0,
    thicknessUm,
    area,
    reverse,
    active,
  };
}
export function surfacePlating(
  time: number,
  current = 0.2,
  clean = true,
  kind: ElectrolysisKind = 'plating',
  closed = true,
  reverse = false,
) {
  const a = electrolysisState(kind, time, current, closed, reverse),
    weights = Array.from({ length: 24 }, (_, i) => (clean ? 1 : i % 3 === 0 ? 0 : 1)),
    total = weights.reduce<number>((a, b) => a + b, 0),
    areaPerCell = a.area / 24;
  return {
    state: a,
    cells: weights.map((weight, id) => {
      const mass = (a.depositMass * weight) / total;
      return { id, active: !!weight, mass, thicknessUm: (mass / (8.96 * areaPerCell)) * 1e4 };
    }),
  };
}
export function electrodePreparation(progress: number, acidStage = false) {
  const p = electroClamp(progress),
    down = acidStage ? electroClamp(p / 0.15) : electroClamp((p - 0.3) / 0.12),
    lift = acidStage ? electroClamp((p - 0.5) / 0.1) : electroClamp((p - 0.65) / 0.08),
    travel = acidStage ? electroClamp((p - 0.6) / 0.15) : electroClamp((p - 0.73) / 0.09),
    rinseDown = acidStage ? electroClamp((p - 0.75) / 0.1) : electroClamp((p - 0.82) / 0.08),
    finalLift = acidStage ? electroClamp((p - 0.95) / 0.05) : 0;
  const y = 50 + 95 * down - 95 * lift + 95 * rinseDown - 95 * finalLift,
    x = travel;
  const sand = acidStage ? 1 : electroClamp(p / 0.3),
    degrease = acidStage ? 1 : electroClamp((p - 0.42) / 0.23),
    acid = acidStage ? electroClamp((p - 0.15) / 0.35) : 0,
    rinse = electroClamp((p - (acidStage ? 0.85 : 0.9)) / (acidStage ? 0.1 : 0.08));
  return {
    x,
    y,
    sand,
    degrease,
    acid,
    rinse,
    oil: acidStage ? 0 : (1 - 0.25 * sand) * (1 - degrease),
    oxide: (1 - 0.6 * sand) * (1 - acid),
    chemicalContact: down === 1 && lift === 0,
    waterContact: rinseDown === 1 && finalLift === 0,
  };
}
export type ElectroPoint = { x: number; y: number };
export function polylinePoint(points: ElectroPoint[], progress: number) {
  const lengths = points.slice(1).map((b, i) => Math.hypot(b.x - points[i].x, b.y - points[i].y)),
    total = lengths.reduce((a, b) => a + b, 0);
  let d = electroClamp(progress) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const q = lengths[i] ? d / lengths[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * q,
        y: points[i].y + (points[i + 1].y - points[i].y) * q,
      };
    }
    d -= lengths[i];
  }
  return points[0];
}
/** Ionic lane is the inside offset of the exact U-tube centreline, clear of both carbon rods. */
export function uChannelPoint(progress: number, width = 240): ElectroPoint {
  const s = electroClamp(progress),
    cx = width / 2,
    left = cx - 60,
    right = cx + 60;
  if (s < 0.2) return { x: left + 12, y: 205 + (45 * s) / 0.2 };
  if (s < 0.4) {
    const a = (((s - 0.2) / 0.2) * Math.PI) / 2;
    return { x: left + 30 - 18 * Math.cos(a), y: 250 + 18 * Math.sin(a) };
  }
  if (s < 0.6) return { x: left + 30 + (60 * (s - 0.4)) / 0.2, y: 268 };
  if (s < 0.8) {
    const a = (((s - 0.6) / 0.2) * Math.PI) / 2;
    return { x: right - 30 + 18 * Math.sin(a), y: 250 + 18 * Math.cos(a) };
  }
  return { x: right - 12, y: 250 - (45 * (s - 0.8)) / 0.2 };
}
export function chlorinePath(progress: number, width = 240) {
  const p = electroClamp(progress),
    x = width / 2 + 60;
  return p < 0.65
    ? { x: x + 10, y: 241 - (91 * p) / 0.65, water: 241 - (91 * p) / 0.65 >= 183 }
    : { x: x + 10 + (14 * (p - 0.65)) / 0.35, y: 150 - (11 * (p - 0.65)) / 0.35, water: false };
}
