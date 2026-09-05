/** Intended operation of an illustrative six-stack pin-tumbler cylinder. All lengths are u,
 * not manufacturer dimensions. Curved shear faces are an explicit rigid-fit idealization. */
export const LOCK = Object.freeze({
  radius: 1.05,
  housingRadius: 1.28,
  runningGap: 0.018,
  length: 5.85,
  stations: [0.8, 1.65, 2.5, 3.35, 4.2, 5.05] as readonly number[],
  cuts: [-0.05, 0.24, 0.04, 0.38, 0.14, 0.3] as readonly number[],
  pinRadius: 0.12,
  boreRadius: 0.155,
  driverLength: 1.12,
  springSeat: 3.05,
  wireRadius: 0.018,
  coilRadius: 0.078,
  coils: 7,
  keyBottom: -0.6,
  keyFloor: -0.62,
  keyHalfWidth: 0.09,
  keywayHalfWidth: 0.14,
  keywayTop: 0.5,
  keyTip: 5.65,
  travel: 6,
  landHalf: 0.18,
  maxAngle: (75 * Math.PI) / 180,
});
export type LockKey = 'matching' | 'high' | 'low';
export type LockPoint = [number, number];
export type LockVector = [number, number, number];
export type LockInput = { insertion: number; requestedAngle: number; key: LockKey };
const finite = (...v: number[]) => {
  if (!v.every(Number.isFinite)) throw new RangeError('Finite lock inputs required');
};
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => {
  const a = clamp(x, 0, 1);
  return a * a * (3 - 2 * a);
};
export const lockInitial = (): LockInput => ({ insertion: 0, requestedAngle: 0, key: 'matching' });
export function lockKeyProfile(key: LockKey): LockPoint[] {
  if (!['matching', 'high', 'low'].includes(key)) throw new RangeError('Unknown demonstration key');
  const cuts = [...LOCK.cuts];
  cuts[2] += key === 'high' ? 0.18 : key === 'low' ? -0.18 : 0;
  return [
    [0, cuts[0]],
    ...LOCK.stations.flatMap((x, i): LockPoint[] => [
      [x - LOCK.landHalf, cuts[i]],
      [x + LOCK.landHalf, cuts[i]],
    ]),
    [LOCK.keyTip, LOCK.keyBottom],
  ];
}
/** Exact support of a rounded tip over piecewise-linear key segments: a Minkowski envelope.
 * The center follows max(h(u)+sqrt(r²-(u-x)²)); the profile is never axis-sampled as a flat tip. */
export function lockContact(profile: readonly LockPoint[], centerX: number, offset: number) {
  finite(centerX, offset);
  if (profile.length < 2) throw new RangeError('A continuous key profile is required');
  let centerY = LOCK.keyFloor + LOCK.pinRadius;
  let contact: LockPoint = [centerX, LOCK.keyFloor];
  let supportedByKey = false;
  for (let i = 0; i < profile.length - 1; i++) {
    const [a, ha] = profile[i],
      [b, hb] = profile[i + 1];
    finite(a, ha, b, hb);
    if (b <= a) throw new RangeError('Key profile must increase along its length');
    const left = Math.max(a + offset, centerX - LOCK.pinRadius),
      right = Math.min(b + offset, centerX + LOCK.pinRadius);
    if (right < left) continue;
    const slope = (hb - ha) / (b - a);
    const x = clamp(centerX + (LOCK.pinRadius * slope) / Math.hypot(1, slope), left, right);
    const h = ha + slope * (x - offset - a);
    const y = h + Math.sqrt(Math.max(0, LOCK.pinRadius ** 2 - (x - centerX) ** 2));
    if (y > centerY) {
      centerY = y;
      contact = [x, h];
      supportedByKey = true;
    }
  }
  return { centerY, tip: centerY - LOCK.pinRadius, contact, supportedByKey };
}
/** The actual radial envelope of a translated cylindrical shear end. */
export function lockShear(error: number) {
  finite(error);
  const driverClearance = error;
  const keyClearance = LOCK.runningGap - Math.max(0, error);
  return {
    driverClearance,
    keyClearance,
    clear: driverClearance >= -1e-9 && keyClearance >= -1e-9,
  };
}
export function lockPose(input: LockInput) {
  finite(input.insertion, input.requestedAngle);
  if (
    input.insertion < 0 ||
    input.insertion > 1 ||
    input.requestedAngle < 0 ||
    input.requestedAngle > LOCK.maxAngle + 1e-12
  )
    throw new RangeError('Lock operation outside demonstration range');
  const profile = lockKeyProfile(input.key),
    offset = (input.insertion - 1) * LOCK.travel;
  const stacks = LOCK.stations.map((x, i) => {
    const c = lockContact(profile, x, offset),
      length = LOCK.radius - LOCK.cuts[i];
    const interfaceY = c.tip + length,
      error = interfaceY - LOCK.radius;
    const top = interfaceY + LOCK.driverLength;
    return {
      index: i,
      x,
      ...c,
      length,
      interfaceY,
      error,
      ...lockShear(error),
      driverTop: top,
      springBottom: top + LOCK.wireRadius,
      springTop: LOCK.springSeat - LOCK.wireRadius,
    };
  });
  const seated = input.insertion >= 1 - 1e-12;
  const clearCount = stacks.filter((s) => s.clear).length;
  const canTurn = seated && clearCount === stacks.length;
  const angle = canTurn ? input.requestedAngle : 0;
  // The three declared key profiles align exactly or miss by 0.18 u when seated. No residual
  // interface error occurs in any rotatable state; drivers therefore remain on the plug surface.
  if (angle > 0 && stacks.some((s) => Math.abs(s.error) > 1e-9))
    throw new RangeError('Rotation requires the declared seated key geometry');
  return {
    ...input,
    profile,
    offset,
    stacks,
    seated,
    clearCount,
    canTurn,
    angle,
    canWithdraw: angle === 0,
    blocked: input.requestedAngle > 0 && !canTurn,
  };
}
export type LockPose = ReturnType<typeof lockPose>;
export function lockRotate(p: LockVector, angle: number): LockVector {
  finite(...p, angle);
  return [
    p[0],
    p[1] * Math.cos(angle) - p[2] * Math.sin(angle),
    p[1] * Math.sin(angle) + p[2] * Math.cos(angle),
  ];
}
export function lockSpring(stack: LockPose['stacks'][number], progress: number): LockVector {
  finite(progress);
  if (progress < 0 || progress > 1 || stack.springTop <= stack.springBottom)
    throw new RangeError('Invalid spring seat interval');
  const a = progress * LOCK.coils * 2 * Math.PI;
  return [
    stack.x + LOCK.coilRadius * Math.cos(a),
    stack.springBottom + progress * (stack.springTop - stack.springBottom),
    LOCK.coilRadius * Math.sin(a),
  ];
}
/** Manual commands keep the key captive while turned and only exchange fully withdrawn keys. */
export function lockCommand(
  input: LockInput,
  action:
    { type: 'insert' | 'turn'; value: number } | { type: 'key'; key: LockKey } | { type: 'reset' },
): LockInput {
  const pose = lockPose(input);
  if (action.type === 'reset') return lockInitial();
  if (action.type === 'key')
    return input.insertion === 0 && pose.angle === 0
      ? { ...lockInitial(), key: action.key }
      : input;
  finite(action.value);
  if (action.type === 'insert')
    return pose.canWithdraw
      ? { ...input, insertion: clamp(action.value, 0, 1), requestedAngle: 0 }
      : input;
  return { ...input, requestedAngle: clamp(action.value, 0, LOCK.maxAngle) };
}
export function lockShot(chapter: number, progress: number) {
  finite(chapter, progress);
  const ch = clamp(Math.floor(chapter), 0, 7),
    p = clamp(progress, 0, 1),
    e = smooth((p - 0.12) / 0.76);
  let input = lockInitial(),
    selected = 0;
  const focus = [
    'overview',
    'insertion',
    'contact',
    'line',
    'compare',
    'turn',
    'return',
    'withdraw',
  ][ch];
  if (ch === 0) input.requestedAngle = LOCK.maxAngle * 0.2 * smooth(p);
  if (ch === 1) input.insertion = 0.54 * e;
  if (ch === 2) {
    input.insertion = 0.54 + 0.46 * e;
    selected = 3;
  }
  if (ch === 3) {
    input.insertion = 1;
    selected = Math.min(5, Math.floor(p * 6));
  }
  if (ch === 4) {
    input = { insertion: 1, requestedAngle: 0, key: 'high' };
    selected = 2;
  }
  if (ch === 5) input = { insertion: 1, requestedAngle: LOCK.maxAngle * e, key: 'matching' };
  if (ch === 6)
    input = {
      insertion: 1,
      requestedAngle: LOCK.maxAngle * (1 - smooth((p - 0.3) / 0.58)),
      key: 'matching',
    };
  if (ch === 7) input.insertion = 1 - e;
  const pose = lockPose(input);
  return {
    chapter: ch,
    progress: p,
    focus,
    selected,
    pose,
    reference: lockPose({
      insertion: input.insertion,
      requestedAngle: input.requestedAngle,
      key: 'matching',
    }),
    withdrawalRequested: ch === 6 && p < 0.3,
  };
}
