/** Ideal radial bearing, zero contact angle. Lengths are illustrative scene units.
 * This is a kinematic teaching model, not a bearing-selection/tribology solver. */
export const BEARING = {
  pitch: 1.75,
  ball: 0.34,
  count: 10,
  bore: 0.98,
  outside: 2.48,
  halfWidth: 0.52,
  groove: 0.36,
  grooveHalfWidth: 0.3,
  housingOutside: 2.7,
  pocketClearance: 0.025,
  pocketThickness: 0.025,
  cageBack: -0.37,
} as const;
export const BEARING_TAU = Math.PI * 2;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * p * (10 + p * (-15 + 6 * p));
};
const finite = (...values: number[]) => {
  if (values.some((v) => !Number.isFinite(v))) throw new RangeError('Bearing state must be finite');
};
export type BearingFocus =
  'assembly' | 'contact' | 'cage' | 'sliding' | 'load' | 'patch' | 'losses' | 'return';
export const bearingFocus: BearingFocus[] = [
  'assembly',
  'contact',
  'cage',
  'sliding',
  'load',
  'patch',
  'losses',
  'return',
];
export function bearingSpeeds(innerOmega = 1) {
  finite(innerOmega);
  const { pitch: R, ball: a } = BEARING,
    inner = R - a;
  const center = (innerOmega * inner) / 2;
  const cage = center / R;
  const spin = -center / a;
  return {
    inner: innerOmega,
    outer: 0,
    cage,
    spin,
    relativeSpin: spin - cage,
    center,
    innerSurface: innerOmega * inner,
    innerContact: center - spin * a,
    outerContact: center + spin * a,
  };
}
/** Exact circular groove, with a shoulder outside its machined section. */
export function bearingRaceRadius(which: 'inner' | 'outer', z: number) {
  finite(z);
  const b = BEARING,
    depth = b.groove - Math.sqrt(b.groove ** 2 - Math.min(Math.abs(z), b.grooveHalfWidth) ** 2);
  return which === 'inner' ? b.pitch - b.ball + depth : b.pitch + b.ball - depth;
}
/** Closed section in (radius,z); renderer revolves it about the shaft axis. */
export function bearingRaceProfile(which: 'inner' | 'outer', front: boolean) {
  const b = BEARING,
    end = front ? b.halfWidth : -b.halfWidth;
  const surface = Array.from({ length: 65 }, (_, i) => {
    const z = (end * i) / 64;
    return { r: bearingRaceRadius(which, z), z };
  });
  const rim = which === 'inner' ? b.bore : b.outside;
  return [...surface, { r: rim, z: end }, { r: rim, z: 0 }, surface[0]];
}
/** Crown-cage fingers: concave spherical pockets beside each ball, never across a race contact. */
export function bearingPocketPoint(theta: number, phi: number, outside = false) {
  const r = BEARING.ball + BEARING.pocketClearance + (outside ? BEARING.pocketThickness : 0);
  return {
    x: r * Math.sin(theta) * Math.cos(phi),
    y: r * Math.sin(theta) * Math.sin(phi),
    z: r * Math.cos(theta),
  };
}
export function bearingState(innerAngle: number, loadAngle = -Math.PI / 2, load = 1) {
  finite(innerAngle, loadAngle, load);
  const b = BEARING,
    speeds = bearingSpeeds(),
    cageAngle = innerAngle * speeds.cage;
  const balls = Array.from({ length: b.count }, (_, i) => {
    const angle = -Math.PI / 2 + cageAngle + (i * BEARING_TAU) / b.count;
    const normal = { x: Math.cos(angle), y: Math.sin(angle) };
    // Explicitly assumed broad radial load zone; not a Hertz/clearance equilibrium solution.
    const loadWeight = clamp(load) * Math.max(0, Math.cos(angle - loadAngle)) ** 1.5;
    return {
      id: i,
      angle,
      x: b.pitch * normal.x,
      y: b.pitch * normal.y,
      spin: innerAngle * speeds.spin,
      loadWeight,
      innerContact: { x: (b.pitch - b.ball) * normal.x, y: (b.pitch - b.ball) * normal.y },
      outerContact: { x: (b.pitch + b.ball) * normal.x, y: (b.pitch + b.ball) * normal.y },
    };
  });
  return { innerAngle, cageAngle, loadAngle, load: clamp(load), balls, speeds };
}
export type BearingState = ReturnType<typeof bearingState>;
/** Analytic director. Angles have no dependency on playback history or measured cue duration. */
export function bearingShot(chapter: number, progress: number) {
  finite(chapter, progress);
  const c = Math.floor(clamp(chapter, 0, 7)),
    p = clamp(progress);
  const turns = [0, 0.6, 1.1, 2.5, 3.1, 5.6, 6, 6.5, 7.5];
  const innerAngle = BEARING_TAU * (turns[c] + (turns[c + 1] - turns[c]) * smooth(p));
  return {
    chapter: c,
    progress: p,
    focus: bearingFocus[c],
    innerAngle,
    cutaway: c === 0 ? smooth((p - 0.1) / 0.45) : c === 7 ? 1 - smooth((p - 0.65) / 0.35) : 1,
    cageOpacity: c === 2 ? 0.36 + 0.64 * Math.sin(Math.PI * p) ** 2 : 0.36,
    load: c === 4 ? smooth(p / 0.12) : c > 4 ? 1 : 0,
    loadAngle: -Math.PI / 2,
    patchProgress: c === 5 ? smooth(p) : c > 5 ? 1 : 0,
    lossIndex: c === 6 ? Math.min(3, Math.floor(p * 4)) : -1,
  };
}
export type BearingShot = ReturnType<typeof bearingShot>;
/** A material point on the marked ball in a fixed lab frame, for auditable surface tracking. */
export function bearingSurfacePoint(innerAngle: number, materialAngle: number) {
  const state = bearingState(innerAngle),
    ball = state.balls[0],
    a = ball.spin + materialAngle;
  return { x: ball.x + BEARING.ball * Math.cos(a), y: ball.y + BEARING.ball * Math.sin(a) };
}
/** Local normalized velocities: same support and moving surface for both comparisons. */
export function bearingContactComparison(spinFraction = 1) {
  finite(spinFraction);
  const spin = clamp(spinFraction),
    center = 0.5;
  return {
    movingSurface: 1,
    fixedSurface: 0,
    center,
    spin,
    innerBall: center + 0.5 * spin,
    outerBall: center - 0.5 * spin,
    innerSlip: -0.5 * (1 - spin),
    outerSlip: 0.5 * (1 - spin),
  };
}
