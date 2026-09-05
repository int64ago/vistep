/** Illustrative type-301 lockstitch, horizontal-axis rotary hook.
 * Lengths are display units u, not service dimensions. Rigid kinematics are exact;
 * flexible threads follow a prescribed, continuous quasistatic routing envelope.
 * This is not a tension/friction/contact dynamics solver or production machine CAD. */
export type SewingPoint = [number, number, number];
export const SEWING = Object.freeze({
  crank: 1.1,
  rod: 2.5,
  shaftY: 4.3,
  eyeOffset: 1.55,
  needleZ: 0.62,
  tipBelowEye: 0.24,
  fabricTop: 0.1,
  caseY: -1.7,
  caseRadius: 0.75,
  caseHalfDepth: 0.28,
  bobbinFlangeRadius: 0.6,
  caseSlotAngle: Math.PI / 2,
  caseSlotHalfAngle: 0.2,
  raceRadius: 0.755,
  bearingCupRadius: 0.81,
  bearingCupRear: -0.57,
  bearingCupFront: -0.15,
  hookRadius: 1.05,
  hookZ: 0.54,
  threadRadius: 0.012,
  capture: 0.57,
  release: 0.86,
  clearCase: 0.9,
  tight: 0.965,
  feedStart: 0.965,
  feedEnd: 0.995,
  pitch: 0.6,
});
export const sewingClamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
export const sewingEase = (n: number) => {
  const x = sewingClamp(n);
  return x * x * (3 - 2 * x);
};
const ease = (p: number, a: number, b: number) => sewingEase((p - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const sewingLerp = (a: SewingPoint, b: SewingPoint, t: number): SewingPoint =>
  a.map((v, i) => mix(v, b[i], t)) as SewingPoint;
export const sewingDistance = (a: SewingPoint, b: SewingPoint) =>
  Math.hypot(...a.map((v, i) => v - b[i]));
export const sewingLength = (p: readonly SewingPoint[]) =>
  p.slice(1).reduce((s, v, i) => s + sewingDistance(v, p[i]), 0);
function finite(...n: number[]) {
  if (!n.every(Number.isFinite)) throw new RangeError('Finite sewing inputs required');
}
export function sewingNeedle(phase: number) {
  finite(phase);
  if (phase < 0 || phase > 1) throw new RangeError('Needle phase must be 0–1');
  const theta = 2 * Math.PI * phase,
    x = SEWING.crank * Math.sin(theta);
  const crankPin: SewingPoint = [x, SEWING.shaftY + SEWING.crank * Math.cos(theta), SEWING.needleZ];
  const joint: SewingPoint = [0, crankPin[1] - Math.sqrt(SEWING.rod ** 2 - x * x), SEWING.needleZ];
  return {
    theta,
    crankPin,
    joint,
    eye: joint[1] - SEWING.eyeOffset,
    tip: joint[1] - SEWING.eyeOffset - SEWING.tipBelowEye,
  };
}
export function sewingHook(phase: number) {
  finite(phase);
  if (phase < 0 || phase > 1) throw new RangeError('Hook phase must be 0–1');
  const angle = 4 * Math.PI * (phase - SEWING.capture) + 0.13;
  const point = (
    a: number,
    r: number = SEWING.hookRadius,
    z: number = SEWING.hookZ,
  ): SewingPoint => [r * Math.sin(a), SEWING.caseY + r * Math.cos(a), z];
  return { angle, throat: point(angle), tip: point(angle + 0.14, 1.025) };
}
/** Needle-clearance thresholds derived from the slider-crank, not painted timing bars. */
export const SEWING_NEEDLE_WINDOW = (() => {
  let lo = 0,
    hi = 0.5;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (sewingNeedle(mid).tip > SEWING.fabricTop) lo = mid;
    else hi = mid;
  }
  return [hi, 1 - hi] as const;
})();
/** Meridional distance to the declared complete case envelope, not only visible cut faces. */
export function sewingCaseClearance(p: SewingPoint) {
  const cylinder = (radius: number, z: number, half: number) => {
    const radial = Math.hypot(p[0], p[1] - SEWING.caseY) - radius,
      axial = Math.abs(p[2] - z) - half;
    return (
      Math.hypot(Math.max(radial, 0), Math.max(axial, 0)) + Math.min(Math.max(radial, axial), 0)
    );
  };
  return (
    Math.min(
      cylinder(SEWING.caseRadius, 0, SEWING.caseHalfDepth),
      cylinder(
        SEWING.bearingCupRadius,
        (SEWING.bearingCupRear + SEWING.bearingCupFront) / 2,
        (SEWING.bearingCupFront - SEWING.bearingCupRear) / 2,
      ),
    ) - SEWING.threadRadius
  );
}
/** A U bend around the lower seam, not two floating thread fragments. */
export function sewingInterlock(x: number, s: number): SewingPoint {
  return [x, 0.1 - 0.16 * Math.sin(Math.PI * s), 0.62 - 0.075 * Math.cos(Math.PI * s)];
}
function carriedCore(p: number): SewingPoint[] {
  const split = ease(p, SEWING.capture, 0.589),
    release = ease(p, 0.875, SEWING.clearCase);
  const angle = sewingHook(Math.min(p, SEWING.release)).angle;
  const backR = mix(mix(1.025, 0.85, ease(p, 0.58, 0.596)), 1.02, ease(p, SEWING.release, 0.875)),
    frontR = mix(1.075, 0.89, split);
  const backZ = mix(mix(0.51, -0.4, ease(p, SEWING.capture, 0.579)), 0.51, release),
    frontZ = mix(0.57, 0.9, split);
  const point = (a: number, r: number, z: number): SewingPoint => [
    r * Math.sin(a),
    SEWING.caseY + r * Math.cos(a),
    z,
  ];
  // Fixed sample identities: 48 behind the case, 12 over the hook throat, 48 in front.
  const result: SewingPoint[] = [];
  for (let i = 0; i <= 48; i++) result.push(point((angle * i) / 48, backR, backZ));
  for (let i = 1; i <= 12; i++) {
    const q = i / 12;
    result.push(
      point(
        angle,
        q <= 0.25
          ? mix(backR, SEWING.hookRadius, q * 4)
          : q <= 0.5
            ? SEWING.hookRadius
            : mix(SEWING.hookRadius, frontR, q * 2 - 1),
        q <= 0.25
          ? backZ
          : q <= 0.5
            ? mix(backZ, SEWING.hookZ, (q - 0.25) * 4)
            : mix(SEWING.hookZ, frontZ, q * 2 - 1),
      ),
    );
  }
  for (let i = 1; i <= 48; i++) result.push(point(angle * (1 - i / 48), frontR, frontZ));
  return result;
}
export function sewingPose(phase: number, pitch: number = SEWING.pitch) {
  finite(phase, pitch);
  if (phase < 0 || phase > 1 || pitch < 0.35 || pitch > 0.85)
    throw new RangeError('Phase 0–1 and pitch 0.35–0.85 u required');
  const needle = sewingNeedle(phase),
    hook = sewingHook(phase);
  const feed = pitch * ease(phase, SEWING.feedStart, SEWING.feedEnd);
  // Four-motion feed: return below the plate, rise, advance with cloth, then descend.
  const dogX = phase < 0.2 ? mix(-pitch, 0, ease(phase, 0.02, 0.2)) : -feed;
  const dogTop = -0.16 + 0.15 * (ease(phase, 0.94, 0.963) - ease(phase, 0.995, 1));
  const feeding = phase > SEWING.feedStart && phase < SEWING.feedEnd;
  const eyeFront: SewingPoint = [0, needle.eye, 0.76],
    eyeBack: SewingPoint = [0, needle.eye, 0.54];
  const tighten = ease(phase, SEWING.clearCase, SEWING.tight);
  const clothReturn: SewingPoint = [-0.12 - feed, 0.1, mix(0.54, 0.695, tighten)];
  let core = carriedCore(Math.max(phase, SEWING.capture));
  if (phase < SEWING.capture) {
    const form = ease(phase, 0.5, SEWING.capture);
    core = core.map((v, i) =>
      sewingLerp(sewingLerp(eyeBack, [0.12, 0.1, 0.54], i / (core.length - 1)), v, form),
    );
  }
  if (phase >= SEWING.clearCase) {
    const tightening = ease(phase, SEWING.clearCase, SEWING.tight);
    core = core.map((v, i) =>
      sewingLerp(v, sewingInterlock(-0.12 - feed, i / (core.length - 1)), tightening),
    );
  }
  // Rigid take-up arm: the thread passes through its actual moving eye.
  const takeUpAngle = -0.9 + 1.8 * (1 - ease(phase, 0.12, 0.56) + ease(phase, 0.85, 0.975));
  const takeUpPivot: SewingPoint = [0.7, 2.45, 0.91];
  const takeUpEye: SewingPoint = [
    0.7 - 0.82 * Math.cos(takeUpAngle),
    2.45 + 0.82 * Math.sin(takeUpAngle),
    0.91,
  ];
  const winding: SewingPoint[] = Array.from({ length: 61 }, (_, i) => {
    const a = (i / 60) * 6 * Math.PI;
    return [1.85 + 0.23 * Math.cos(a), 3.8 + (i / 60) * 0.33, 0.9 + 0.23 * Math.sin(a)];
  });
  const returnLip: SewingPoint = [mix(0.12, -0.12 - feed, tighten), 0.1, core[core.length - 1][2]];
  const upper: SewingPoint[] = [
    ...winding,
    [1.4, 3.9, 1.13],
    [1.22, 2.65, 1.13],
    takeUpEye,
    [0, 1.9, 0.76],
    eyeFront,
    eyeBack,
    ...core,
    returnLip,
    clothReturn,
  ];
  for (let n = 1; n <= 3; n++) {
    const x = -n * pitch - 0.12 - feed;
    for (let i = 0; i <= 24; i++) upper.push(sewingInterlock(x, i / 24));
  }
  // A bobbin winding continues through an explicit front outlet to the underside seam.
  const bobbin: SewingPoint[] = Array.from({ length: 81 }, (_, i) => {
    const a = (i / 80) * 8 * Math.PI;
    return [0.53 * Math.cos(a), SEWING.caseY + 0.53 * Math.sin(a), -0.18 + (i / 80) * 0.36];
  });
  const lower: SewingPoint[] = [
    ...bobbin,
    [0.63, SEWING.caseY, 0.18],
    [0.63, SEWING.caseY, 0.34],
    [-0.04, -1.13, 0.34],
    [-0.04, -1.13, 0.62],
    [-0.04, 0, 0.62],
    [-3 * pitch - 0.08 - feed, 0, 0.62],
  ];
  return {
    phase,
    pitch,
    needle,
    hook,
    feed,
    dogX,
    dogTop,
    feeding,
    needleClear: needle.tip > SEWING.fabricTop,
    takeUpPivot,
    takeUpEye,
    takeUpAngle,
    eyeFront,
    eyeBack,
    returnLip,
    clothReturn,
    core,
    upper,
    lower,
    loopLength: sewingLength(core),
    tightening: ease(phase, SEWING.clearCase, SEWING.tight),
    captured: phase >= SEWING.capture && phase < SEWING.release,
    complete: phase >= SEWING.tight,
    step:
      phase < 0.5
        ? 'descend'
        : phase < SEWING.capture
          ? 'form'
          : phase < SEWING.release
            ? 'carry'
            : phase < SEWING.clearCase
              ? 'release'
              : phase < SEWING.tight
                ? 'tighten'
                : phase < SEWING.feedEnd
                  ? 'feed'
                  : 'complete',
  };
}
export type SewingPose = ReturnType<typeof sewingPose>;
export const sewingInitial = (): { phase: number; pitch: number; view: 'cutaway' | 'section' } => ({
  phase: 0,
  pitch: SEWING.pitch,
  view: 'cutaway' as 'cutaway' | 'section',
});
/** Chapter progress, not wall-clock accumulation. Boundaries share the same physical pose. */
export function sewingShot(chapter: number, progress: number) {
  finite(chapter, progress);
  const ch = sewingClamp(Math.floor(chapter), 0, 7),
    p = sewingClamp(progress);
  const edges = [0.12, 0.5, 0.57, 0.67, 0.86, 0.9, 0.965, 1, 1];
  const phase =
    ch === 7
      ? mix(SEWING.tight, 1, ease(p, 0.12, 0.88))
      : mix(edges[ch], edges[ch + 1], ease(p, 0.12, 0.88));
  const pitch = SEWING.pitch;
  const focus = ['overview', 'eye', 'pickup', 'case', 'release', 'takeup', 'feed', 'stitch'][ch];
  return {
    chapter: ch,
    progress: p,
    focus,
    pose: sewingPose(phase, pitch),
    reference: sewingPose(phase, 0.85),
  };
}
/** Perspective fit against actual full-assembly or declared close-up bounds.
 * Coordinates stay in mechanism space; the renderer adds its floor offset. */
export function sewingCamera(pose: SewingPose, focus: string, progress: number, aspect: number) {
  finite(aspect, progress);
  if (aspect <= 0) throw new RangeError('Positive camera aspect required');
  const detail = ['eye', 'pickup', 'case', 'release'].includes(focus);
  const target: SewingPoint = detail
    ? [0, -1.03, 0.12]
    : focus === 'feed'
      ? [-0.3, 0.1, 0.6]
      : focus === 'stitch'
        ? [-pose.pitch, 0.06, 0.62]
        : [0.25, 0.85, 0.12];
  const angle =
    focus === 'case'
      ? 0.2 - sewingClamp(progress) * 0.5
      : focus === 'release'
        ? -0.3 + sewingClamp(progress) * 0.5
        : 0.2;
  const raw: SewingPoint = [Math.sin(angle), focus === 'stitch' ? 0.54 : 0.2, Math.cos(angle)];
  const norm = Math.hypot(...raw),
    direction = raw.map((v) => v / norm) as SewingPoint;
  const right: SewingPoint = [Math.cos(angle), 0, -Math.sin(angle)];
  const up: SewingPoint = [
    direction[1] * right[2],
    direction[2] * right[0] - direction[0] * right[2],
    -direction[1] * right[0],
  ];
  const bounds: SewingPoint[] = detail
    ? [
        [-1.3, -2.97, -0.65],
        [1.3, 0.35, 0.95],
      ]
    : focus === 'feed'
      ? [
          [-2.2, -0.85, -0.4],
          [1.6, 1.65, 1.65],
        ]
      : focus === 'stitch'
        ? [
            [-3 * pose.pitch - pose.feed - 0.2, -0.15, 0.4],
            [0.3, 0.25, 0.9],
          ]
        : [
            [-4.1, -3.05, -1.65],
            [3.55, 5.55, 1.5],
          ];
  const corners: SewingPoint[] = [];
  for (let i = 0; i < 8; i++)
    corners.push([bounds[i & 1 ? 1 : 0][0], bounds[i & 2 ? 1 : 0][1], bounds[i & 4 ? 1 : 0][2]]);
  const cot = 1 / Math.tan((34 * Math.PI) / 360),
    margin = 0.85;
  let distance = 1;
  const dot = (a: SewingPoint, b: SewingPoint) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  for (const c of corners) {
    const v = c.map((n, i) => n - target[i]) as SewingPoint,
      z = dot(v, direction);
    distance = Math.max(
      distance,
      z + (Math.abs(dot(v, right)) * cot) / (aspect * margin),
      z + (Math.abs(dot(v, up)) * cot) / margin,
    );
  }
  return {
    target,
    direction,
    right,
    up,
    distance,
    corners,
    cot,
    margin,
    detail: detail || focus === 'feed' || focus === 'stitch',
  };
}
