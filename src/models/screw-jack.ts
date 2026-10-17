/** Quasi-static single-start square-thread screw, ideal thrust bearing. Mean
 * radius is the force-analysis radius, lead equals pitch only for one start. */
export interface ScrewParameters {
  load: number;
  radius: number;
  lead: number;
  friction: number;
  turns: number;
  handle: number;
}
export const screwDefaults = (): ScrewParameters => ({
  load: 1000,
  radius: 0.02,
  lead: 0.004,
  friction: 0.12,
  turns: 1,
  handle: 0.045,
});
export function screwState(p: ScrewParameters) {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.load < 0 ||
    p.radius <= 0 ||
    p.lead <= 0 ||
    p.friction < 0 ||
    p.turns < 0 ||
    p.handle <= 0
  )
    throw new RangeError('Finite passive screw parameters required');
  const tangent = p.lead / (2 * Math.PI * p.radius),
    angle = Math.atan(tangent),
    frictionAngle = Math.atan(p.friction);
  if (p.friction * tangent >= 1)
    throw new RangeError('Raising torque singularity outside this model');
  const raiseTorque = (p.load * p.radius * (tangent + p.friction)) / (1 - p.friction * tangent),
    lowerTorque = (p.load * p.radius * (p.friction - tangent)) / (1 + p.friction * tangent),
    lift = p.lead * p.turns,
    inputWork = raiseTorque * 2 * Math.PI * p.turns,
    outputWork = p.load * lift;
  return {
    angle,
    frictionAngle,
    raiseTorque,
    lowerTorque,
    lift,
    inputWork,
    outputWork,
    heat: inputWork - outputWork,
    effort: raiseTorque / p.handle,
    selfLocking: p.friction > tangent,
    threshold: tangent,
    rotation: 2 * Math.PI * p.turns,
  };
}
export function screwHelixPoint(phase: number, radius: number, lead: number, offset = 0) {
  return {
    x: radius * Math.cos(phase),
    y: offset + (lead * phase) / (2 * Math.PI),
    z: radius * Math.sin(phase),
  };
}
/** Closed square-section helical solids. A back-half cutaway has actual capped
 * radial ends, not transparent overlapping full cylinders. Coordinates in SI. */
export function screwThreadVertices(
  lead: number,
  inner: number,
  outer: number,
  thickness: number,
  firstTurn: number,
  lastTurn: number,
  offset = 0,
  backHalf = false,
) {
  if (
    ![lead, inner, outer, thickness, firstTurn, lastTurn, offset].every(Number.isFinite) ||
    lead <= 0 ||
    inner <= 0 ||
    outer <= inner ||
    thickness <= 0 ||
    thickness > lead ||
    !Number.isInteger(firstTurn) ||
    !Number.isInteger(lastTurn) ||
    lastTurn <= firstTurn
  )
    throw new RangeError('Valid square-thread section required');
  const result: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]) =>
    result.push(...a, ...b, ...c, ...a, ...c, ...d);
  const section = (phase: number) => {
    const q = (r: number, y: number) => [
      r * Math.cos(phase),
      offset + (lead * phase) / (2 * Math.PI) + y,
      r * Math.sin(phase),
    ];
    return [
      q(inner, -thickness / 2),
      q(outer, -thickness / 2),
      q(outer, thickness / 2),
      q(inner, thickness / 2),
    ];
  };
  const bands = backHalf
    ? Array.from({ length: lastTurn - firstTurn }, (_, i) => [
        (firstTurn + i + 0.5) * Math.PI * 2,
        (firstTurn + i + 1) * Math.PI * 2,
      ])
    : [[firstTurn * Math.PI * 2, lastTurn * Math.PI * 2]];
  for (const [start, end] of bands) {
    const steps = Math.round(((end - start) / (2 * Math.PI)) * 64);
    let a = section(start);
    quad(a[3], a[2], a[1], a[0]);
    for (let i = 1; i <= steps; i++) {
      const b = section(start + ((end - start) * i) / steps);
      for (let j = 0; j < 4; j++) quad(a[j], a[(j + 1) % 4], b[(j + 1) % 4], b[j]);
      a = b;
    }
    quad(a[0], a[1], a[2], a[3]);
  }
  return result;
}
export function screwShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    p = screwDefaults();
  if (chapter === 0) p.turns = u;
  if (chapter === 1) p.turns = u;
  if (chapter === 2) {
    p.friction = 0;
    p.turns = 2 * u;
  }
  if (chapter === 3) {
    p.lead = u < 0.5 ? 0.004 : 0.008;
    p.turns = 2 * (u < 0.5 ? u * 2 : (u - 0.5) * 2);
    p.friction = 0;
  }
  if (chapter === 4) {
    p.turns = 1;
    p.friction = 0.2 * u;
  }
  if (chapter >= 5) {
    p.turns = 1;
    p.friction = 0.08 * (1 - u);
  }
  return p;
}
