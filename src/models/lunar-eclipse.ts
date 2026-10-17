export const lunarConstants = {
  earthRadius: 6371,
  sunRadius: 696340,
  sunDistance: 149597870.7,
  moonRadius: 1737.4,
};
export function lunarOverlap(a: number, b: number, distance: number) {
  if (![a, b, distance].every(Number.isFinite) || a <= 0 || b <= 0 || distance < 0)
    throw new RangeError('Invalid disk geometry');
  if (distance >= a + b) return 0;
  if (distance <= Math.abs(a - b)) return Math.PI * Math.min(a, b) ** 2;
  const angle = (v: number) => Math.acos(Math.max(-1, Math.min(1, v)));
  return (
    a * a * angle((distance * distance + a * a - b * b) / (2 * distance * a)) +
    b * b * angle((distance * distance + b * b - a * a) / (2 * distance * b)) -
    0.5 *
      Math.sqrt(
        Math.max(
          0,
          (-distance + a + b) * (distance + a - b) * (distance - a + b) * (distance + a + b),
        ),
      )
  );
}
/** Paraxial similar-triangle shadow cones, evaluated at a full-Moon geometry. */
export function lunarEclipse(nodeAngle = 8, inclination = 5.145, distance = 384400) {
  if (
    !Number.isFinite(nodeAngle) ||
    nodeAngle < 0 ||
    nodeAngle > 90 ||
    !Number.isFinite(inclination) ||
    inclination < 0 ||
    inclination > 10 ||
    !Number.isFinite(distance) ||
    distance < 340000 ||
    distance > 420000
  )
    throw new RangeError('Invalid lunar geometry');
  const beta = Math.asin(
      Math.sin((inclination * Math.PI) / 180) * Math.sin((nodeAngle * Math.PI) / 180),
    ),
    offset = distance * Math.sin(beta),
    axial = distance * Math.cos(beta),
    { earthRadius, sunRadius, sunDistance, moonRadius } = lunarConstants;
  const umbra = earthRadius - (axial * (sunRadius - earthRadius)) / sunDistance,
    penumbra = earthRadius + (axial * (sunRadius + earthRadius)) / sunDistance;
  const umbraFraction = lunarOverlap(umbra, moonRadius, offset) / (Math.PI * moonRadius ** 2),
    penumbraFraction = lunarOverlap(penumbra, moonRadius, offset) / (Math.PI * moonRadius ** 2);
  const kind =
    offset + moonRadius <= umbra
      ? 'total'
      : offset - moonRadius < umbra
        ? 'partial'
        : offset - moonRadius < penumbra
          ? 'penumbral'
          : 'none';
  return {
    nodeAngle,
    inclination,
    distance,
    beta,
    offset,
    axial,
    umbra,
    penumbra,
    moonRadius,
    umbraFraction,
    penumbraFraction,
    kind,
  };
}
