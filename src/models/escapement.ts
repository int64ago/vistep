/** Graham deadbeat teaching geometry. XY mechanism; +wheel angle is clockwise,
 * +anchor angle is counter-clockwise. u is a display unit, not a machining unit.
 * Contact kinematics are prescribed, not a loaded escapement dynamics solver.
 */
export type EscPoint = [number, number];
export type EscVec3 = [number, number, number];
export const ESC = Object.freeze({
  radius: 1.5,
  rootRadius: 1.12,
  teeth: 30,
  pitch: Math.PI / 15,
  height: 1.5 * Math.SQRT2,
  lift: (5 * Math.PI) / 180,
  halfLift: (1.5 * Math.PI) / 180,
  lockArc: (4 * Math.PI) / 180,
  dropPhase: 0.018,
  drumRadius: 0.28,
  gravity: 9.81,
  mass: 0.2,
  wheelHalfDepth: 0.08,
  palletHalfDepth: 0.12,
  palletStudFront: -0.11,
  palletStudBack: -0.3,
  drumZ: -0.34,
  bearingFront: -0.52,
  damping: 0.025,
});
const D = Math.PI / 180,
  TAU = Math.PI * 2;
export const escClamp = (x: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, Number.isFinite(x) ? x : lo));
export const escRotate = (p: EscPoint, q: number): EscPoint => [
  p[0] * Math.cos(q) - p[1] * Math.sin(q),
  p[0] * Math.sin(q) + p[1] * Math.cos(q),
];
export const escPolar = (a: number, r: number = ESC.radius): EscPoint => [
  r * Math.sin(a),
  r * Math.cos(a),
];
const fromAnchor = (p: EscPoint): EscPoint => [p[0], p[1] - ESC.height];
export const escWorld = (p: EscPoint, q: number): EscPoint => {
  const v = escRotate(p, q);
  return [v[0], v[1] + ESC.height];
};
export function escapementPallet(side: 0 | 1) {
  const angle = (side ? 45 : -45) * D,
    start = side ? -ESC.halfLift : ESC.halfLift;
  const corner = escRotate(fromAnchor(escPolar(angle)), -start);
  const discharge = escRotate(fromAnchor(escPolar(angle + ESC.lift)), start);
  const radius = Math.hypot(...corner),
    a = Math.atan2(corner[1], corner[0]);
  const end = a + (side ? 1 : -1) * ESC.lockArc,
    inner = radius + (side ? 0.16 : -0.16);
  const ja = Math.atan2(discharge[1], discharge[0]);
  // A circular locking surface and a planar impulse face share exactly one corner.
  const lock: EscPoint[] = Array.from({ length: 97 }, (_, i) => {
    const t = a + ((end - a) * i) / 96;
    return [radius * Math.cos(t), radius * Math.sin(t)];
  });
  const outline: EscPoint[] = [
    ...lock,
    [inner * Math.cos(end), inner * Math.sin(end)],
    [inner * Math.cos(ja), inner * Math.sin(ja)],
    discharge,
  ];
  const attachment: EscPoint = [
    ((radius + inner) / 2) * Math.cos(end),
    ((radius + inner) / 2) * Math.sin(end),
  ];
  return { side, corner, discharge, radius, lock, outline, attachment };
}
export const ESC_PALLETS = [escapementPallet(0), escapementPallet(1)] as const;
export function escapementTooth(index: number, wheel: number): EscPoint[] {
  const a = -45 * D + index * ESC.pitch + wheel;
  // Raked leading face: contact occurs at the tip, never along a radial block.
  return [escPolar(a), escPolar(a - 7 * D, ESC.rootRadius), escPolar(a - 10 * D, ESC.rootRadius)];
}
/** Closed perimeter: the same raked triangles join the circular root rim. */
export function escapementWheelOutline(): EscPoint[] {
  const points: EscPoint[] = [];
  for (let i = 0; i < ESC.teeth; i++) {
    const tooth = escapementTooth(i, 0);
    points.push(tooth[2], tooth[0], tooth[1]);
    const a = Math.atan2(tooth[1][0], tooth[1][1]);
    for (let j = 1; j <= 6; j++) points.push(escPolar(a + (9 * D * j) / 6, ESC.rootRadius));
  }
  return points;
}
export function escapementImpulse(side: 0 | 1, anchor: number) {
  const pallet = ESC_PALLETS[side],
    a = escWorld(pallet.corner, anchor),
    b = escWorld(pallet.discharge, anchor);
  const v: EscPoint = [b[0] - a[0], b[1] - a[1]],
    aa = v[0] ** 2 + v[1] ** 2;
  const bb = 2 * (a[0] * v[0] + a[1] * v[1]),
    cc = a[0] ** 2 + a[1] ** 2 - ESC.radius ** 2;
  const disc = Math.sqrt(Math.max(0, bb * bb - 4 * aa * cc));
  const roots = [(-bb - disc) / (2 * aa), (-bb + disc) / (2 * aa)];
  const fraction = roots.reduce((best, r) => (Math.abs(r - 0.5) < Math.abs(best - 0.5) ? r : best));
  const point: EscPoint = [a[0] + fraction * v[0], a[1] + fraction * v[1]];
  const wheel = Math.atan2(point[0], point[1]) - (side ? 39 : -45) * D;
  return { wheel, point, fraction };
}
export function escapementPeriod(length: number) {
  return TAU * Math.sqrt(escClamp(length, 0.7, 1.2) / ESC.gravity);
}
export function escapementPose(cycles: number, amplitude = 4, length = 1) {
  const c = escClamp(cycles, 0, 60),
    cycle = Math.floor(c),
    phase = c - cycle;
  const amp = escClamp(amplitude, 3, 5),
    l = escClamp(length, 0.7, 1.2);
  const anchor = amp * D * Math.cos(TAU * phase),
    entryStart = Math.acos(1.5 / amp) / TAU,
    entryEnd = 0.5 - entryStart;
  let wheel = 0,
    side: 0 | 1 = 0,
    kind: 'lock' | 'impulse' | 'drop' = 'lock',
    fraction = 0;
  if (phase >= entryStart && phase <= entryEnd) {
    kind = 'impulse';
    const contact = escapementImpulse(0, anchor);
    wheel = contact.wheel;
    fraction = contact.fraction;
  } else if (phase > entryEnd && phase < entryEnd + ESC.dropPhase) {
    kind = 'drop';
    fraction = (phase - entryEnd) / ESC.dropPhase;
    wheel = ESC.lift + (ESC.pitch / 2 - ESC.lift) * fraction ** 2;
  } else if (phase >= entryEnd + ESC.dropPhase && phase < 0.5 + entryStart) {
    side = 1;
    wheel = ESC.pitch / 2;
  } else if (phase >= 0.5 + entryStart && phase <= 0.5 + entryEnd) {
    kind = 'impulse';
    side = 1;
    const contact = escapementImpulse(1, anchor);
    wheel = contact.wheel;
    fraction = contact.fraction;
  } else if (phase > 0.5 + entryEnd && phase < 0.5 + entryEnd + ESC.dropPhase) {
    kind = 'drop';
    side = 1;
    fraction = (phase - 0.5 - entryEnd) / ESC.dropPhase;
    wheel = ESC.pitch / 2 + ESC.lift + (ESC.pitch / 2 - ESC.lift) * fraction ** 2;
  } else if (phase >= 0.5 + entryEnd + ESC.dropPhase) wheel = ESC.pitch;
  const turn = wheel + cycle * ESC.pitch;
  const index = side ? 7 - cycle : wheel > ESC.pitch * 0.9 ? -1 - cycle : -cycle;
  const tooth = ((index % ESC.teeth) + ESC.teeth) % ESC.teeth;
  const contact = kind === 'drop' ? null : escapementTooth(tooth, turn)[0];
  const pendulumLength = 3 * l;
  const bob: EscVec3 = [
    pendulumLength * Math.sin(anchor),
    ESC.height - pendulumLength * Math.cos(anchor),
    0.52,
  ];
  return {
    cycles: c,
    cycle,
    phase,
    anchor,
    wheel: turn,
    localWheel: wheel,
    side,
    kind,
    fraction,
    tooth,
    contact,
    amplitude: amp,
    length: l,
    period: escapementPeriod(l),
    bob,
    entryStart,
    entryEnd,
    countedSteps:
      2 * cycle + (wheel >= ESC.pitch - 1e-10 ? 2 : wheel >= ESC.pitch / 2 - 1e-10 ? 1 : 0),
    weightTop: -0.5 - ESC.drumRadius * turn,
  };
}
export type EscPose = ReturnType<typeof escapementPose>;
/** Separate, exactly solvable small-angle pendulum. Instantaneous, fixed work Q
 * at each centre crossing; no escapement friction, tooth load or air-flow solver.
 * E(t)+loss(t)=E(0)+nQ. The two comparisons have identical initial velocity.
 */
export function escapementEnergy(
  time: number,
  drive = 1,
  length = 1,
  damping: number = ESC.damping,
) {
  const t = escClamp(time, 0, 120),
    l = escClamp(length, 0.7, 1.2),
    gamma = escClamp(damping, 0, 0.1);
  const omega0 = Math.sqrt(ESC.gravity / l),
    omega = Math.sqrt(omega0 ** 2 - gamma ** 2),
    half = Math.PI / omega;
  const inertia = ESC.mass * l * l,
    velocity0 = 4 * D * omega0,
    initial = 0.5 * inertia * velocity0 ** 2;
  const ratio = Math.exp(-2 * gamma * half),
    work = initial * (1 - ratio) * escClamp(drive, 0, 1.5);
  const impulses = Math.floor(t / half),
    local = t - impulses * half;
  const startEnergy =
    initial * ratio ** impulses +
    (1 - ratio > 1e-12 ? (work * (1 - ratio ** impulses)) / (1 - ratio) : impulses * work);
  const v = Math.sqrt((2 * startEnergy) / inertia) * (impulses % 2 ? -1 : 1),
    envelope = Math.exp(-gamma * local);
  const angle = (v / omega) * envelope * Math.sin(omega * local);
  const velocity =
    v * envelope * (Math.cos(omega * local) - (gamma / omega) * Math.sin(omega * local));
  const kinetic = 0.5 * inertia * velocity * velocity,
    potential = 0.5 * inertia * omega0 ** 2 * angle * angle,
    energy = kinetic + potential;
  const input = impulses * work,
    loss = Math.max(0, initial + input - energy);
  return {
    time: t,
    angle,
    velocity,
    energy,
    kinetic,
    potential,
    input,
    loss,
    initial,
    impulses,
    work,
    half,
    ratio,
    length: l,
  };
}
export const escapementInitial = () => ({
  cycles: 0,
  amplitude: 4,
  length: 1,
  drive: 1,
  time: 0,
  view: 'mechanism' as 'mechanism' | 'contact' | 'energy' | 'period',
});
export function escapementShot(chapter: number, progress: number) {
  const ch = Math.floor(escClamp(chapter, 0, 7)),
    p = escClamp(progress),
    smooth = p * p * (3 - 2 * p);
  const standard = escapementPose(0),
    s = standard.entryStart,
    e = standard.entryEnd;
  const cycles = [
    p * 1.3,
    s * (0.15 + 0.85 * smooth),
    s + (e + ESC.dropPhase - s) * smooth,
    e + ESC.dropPhase + 0.5 * smooth,
    0.05 + 2 * p,
    0,
    0,
    2.1 + p * 1.8,
  ][ch];
  const focus = ['overview', 'lock', 'entry', 'exit', 'count', 'energy', 'period', 'overview'][ch];
  return {
    chapter: ch,
    progress: p,
    focus,
    pose: escapementPose(cycles),
    time: 26 * p,
    length: 0.7 + 0.5 * smooth,
  };
}
/** Fit the actual support/base/bob bounds in the real perspective projection. */
export function escapementCamera(aspect: number, focus: string, progress: number) {
  const macro = focus === 'entry' || focus === 'exit' || focus === 'lock';
  const locking = focus === 'lock';
  const target: EscVec3 = locking
    ? [-0.45, 1.65, 0]
    : macro
      ? [focus === 'entry' ? -1.02 : 1.1, 1.07, 0]
      : [0, 0.42, 0];
  const raw: EscVec3 = macro
    ? [0.08, 0.1, 1]
    : [0.14 + 0.08 * Math.sin(progress * Math.PI), 0.14, 1];
  const n = Math.hypot(...raw),
    direction: EscVec3 = raw.map((x) => x / n) as EscVec3;
  const rn = Math.hypot(direction[0], direction[2]),
    right: EscVec3 = [direction[2] / rn, 0, -direction[0] / rn];
  const up: EscVec3 = [
    direction[1] * right[2],
    direction[2] * right[0] - direction[0] * right[2],
    -direction[1] * right[0],
  ];
  const dot = (a: number[], b: number[]) => a.reduce((sum, x, i) => sum + x * b[i], 0);
  const bounds: EscVec3[] = [];
  const lo = macro
    ? [target[0] - (locking ? 0.95 : 0.44), target[1] - (locking ? 0.85 : 0.42), -0.22]
    : [-1.9, -2.21, -1.15];
  const hi = macro
    ? [target[0] + (locking ? 0.95 : 0.44), target[1] + (locking ? 0.85 : 0.42), 0.26]
    : [1.9, 2.65, 0.85];
  for (const x of [lo[0], hi[0]])
    for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) bounds.push([x, y, z]);
  const cot = 1 / Math.tan(17 * D),
    a = Math.max(0.35, aspect);
  let distance = 1;
  for (const corner of bounds) {
    const v = corner.map((x, i) => x - target[i]);
    distance = Math.max(
      distance,
      dot(v, direction) + (Math.abs(dot(v, right)) * cot) / (a * 0.85),
      dot(v, direction) + (Math.abs(dot(v, up)) * cot) / 0.85,
    );
  }
  return { target, direction, right, up, distance, bounds, cot, aspect: a };
}
