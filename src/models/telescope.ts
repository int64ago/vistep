export type TelescopeOptions = {
  objectiveFocal?: number;
  eyepieceFocal?: number;
  aperture?: number;
  eyeDiameter?: number;
};
/** Kepler telescope, paraxial thin lenses and object at infinity; all lengths mm. */
export function telescope(options: TelescopeOptions = {}) {
  const {
    objectiveFocal: fo = 400,
    eyepieceFocal: fe = 40,
    aperture: D = 40,
    eyeDiameter = 4,
  } = options;
  if (
    ![fo, fe, D, eyeDiameter].every(Number.isFinite) ||
    fo <= 0 ||
    fe <= 0 ||
    D <= 0 ||
    eyeDiameter <= 0
  )
    throw new RangeError('Invalid telescope');
  const separation = fo + fe,
    pupilDistance = (fe * separation) / fo,
    pupilDiameter = (D * fe) / fo;
  return {
    fo,
    fe,
    D,
    separation,
    pupilDistance,
    pupilDiameter,
    eyeDiameter,
    magnification: -fo / fe,
  };
}
export function telescopeRay(
  height: number,
  angle: number,
  options: TelescopeOptions = {},
  lensGap?: number,
) {
  const s = telescope(options),
    L = lensGap ?? s.separation,
    u = (angle * Math.PI) / 180,
    u1 = u - height / s.fo,
    yE = height + L * u1,
    u2 = u1 - yE / s.fe;
  return {
    height,
    angle,
    intermediate: s.fo * u,
    eyepieceHeight: yE,
    outputSlope: u2,
    at: (x: number) => (x <= 0 ? height + u * x : x <= L ? height + u1 * x : yE + u2 * (x - L)),
  };
}
/** Exact overlap of two uniform circular pupils, divided by the telescope beam area. */
export function pupilCoupling(beamRadius: number, eyeRadius: number, separation: number) {
  if (
    ![beamRadius, eyeRadius, separation].every(Number.isFinite) ||
    beamRadius <= 0 ||
    eyeRadius <= 0 ||
    separation < 0
  )
    throw new RangeError('Invalid pupil circles');
  const R = beamRadius,
    r = eyeRadius,
    d = separation;
  if (d >= R + r) return 0;
  if (d <= Math.abs(R - r)) return Math.min(R, r) ** 2 / (R * R);
  const a = Math.acos(Math.max(-1, Math.min(1, (d * d + R * R - r * r) / (2 * d * R)))),
    b = Math.acos(Math.max(-1, Math.min(1, (d * d + r * r - R * R) / (2 * d * r))));
  const area =
    R * R * a +
    r * r * b -
    0.5 * Math.sqrt(Math.max(0, (-d + R + r) * (d + R - r) * (d - R + r) * (d + R + r)));
  return area / (Math.PI * R * R);
}
export function telescopePupil(
  fieldAngle: number,
  eyeDistance: number,
  eyeOffset = 0,
  options: TelescopeOptions = {},
) {
  const s = telescope(options),
    center = ((fieldAngle * Math.PI) / 180) * s.magnification * (eyeDistance - s.pupilDistance);
  return {
    center,
    coupling: pupilCoupling(s.pupilDiameter / 2, s.eyeDiameter / 2, Math.abs(center - eyeOffset)),
  };
}
export function telescopeShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    eyepieceFocal = chapter === 2 ? 60 - 30 * p : 40,
    s = telescope({ eyepieceFocal });
  return {
    eyepieceFocal,
    eyeDistance: chapter === 4 ? s.pupilDistance - 30 * p : s.pupilDistance,
    eyeOffset: chapter === 5 ? 4 * p : 0,
    pupil: chapter >= 3,
  };
}
