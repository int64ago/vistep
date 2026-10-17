export type PlateVelocity = { normal: number; tangent: number };
export function plateKinematics(left: PlateVelocity, right: PlateVelocity, time = 6) {
  if (
    ![left.normal, left.tangent, right.normal, right.tangent].every(
      (v) => Number.isFinite(v) && Math.abs(v) <= 10,
    ) ||
    !Number.isFinite(time) ||
    time < 0 ||
    time > 10
  )
    throw new RangeError('Invalid relative motion');
  const normal = right.normal - left.normal,
    tangent = right.tangent - left.tangent,
    hasNormal = Math.abs(normal) > 1e-9,
    hasTangent = Math.abs(tangent) > 1e-9;
  const kind = !hasNormal
    ? hasTangent
      ? 'transform'
      : 'none'
    : normal > 0
      ? hasTangent
        ? 'oblique-divergent'
        : 'divergent'
      : hasTangent
        ? 'oblique-convergent'
        : 'convergent';
  return {
    normal,
    tangent,
    kind,
    opening: Math.max(0, normal) * time,
    consumed: Math.max(0, -normal) * time,
    offset: -tangent * time,
  };
}
/** Unit-arclength kinematic streamline, not a force/density or thermal solution. */
export function plateSlab(s: number, radius = 12, dipDegrees = 55, thickness = 8) {
  if (
    !Number.isFinite(s) ||
    Math.abs(s) > 200 ||
    !Number.isFinite(radius) ||
    radius < 2 ||
    radius > 30 ||
    !Number.isFinite(dipDegrees) ||
    dipDegrees < 10 ||
    dipDegrees > 80 ||
    !Number.isFinite(thickness) ||
    thickness <= 0 ||
    thickness >= 2 * radius
  )
    throw new RangeError('Invalid slab geometry');
  const dip = (dipDegrees * Math.PI) / 180,
    arcLength = radius * dip,
    angle = s <= 0 ? 0 : Math.min(dip, s / radius),
    beyond = Math.max(0, s - arcLength);
  const x = s <= 0 ? s : radius * Math.sin(angle) + beyond * Math.cos(dip),
    z = s <= 0 ? 0 : radius * (1 - Math.cos(angle)) + beyond * Math.sin(dip),
    tangent = { x: Math.cos(angle), z: Math.sin(angle) },
    normal = { x: -tangent.z, z: tangent.x };
  return {
    s,
    x,
    z,
    tangent,
    upper: { x: x - (normal.x * thickness) / 2, z: z - (normal.z * thickness) / 2 },
    lower: { x: x + (normal.x * thickness) / 2, z: z + (normal.z * thickness) / 2 },
  };
}
