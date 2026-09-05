/** Ideal symmetric open differential. Motion and quasistatic torque capacity are separate models. */
export type DifferentialVector = [number, number, number];
export type DifferentialGearId = 'left' | 'right' | 'upper' | 'lower';
export type DifferentialMode = 'straight' | 'turn' | 'left-held' | 'carrier-held' | 'sweep';
export const DIFFERENTIAL = {
  track: 1.6,
  wheelRadius: 0.31,
  sideTeeth: 24,
  pinionTeeth: 16,
  coneOuter: 1.36,
  coneInner: 0.86,
  bore: 0.14,
  shaftRadius: 0.14,
  carrierHalfLength: 1.48,
  carrierRadius: 1.66,
  pinEnd: 1.65,
  wheelX: 3.6,
  axleStart: 0.84,
} as const;
const TAU = 2 * Math.PI;
const finite = (...v: number[]) => {
  if (v.some((x) => !Number.isFinite(x)))
    throw new RangeError('Differential inputs must be finite');
};
const clip = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const differentialWrap = (a: number, period = TAU) =>
  ((((a + period / 2) % period) + period) % period) - period / 2;
export const differentialDot = (a: DifferentialVector, b: DifferentialVector) =>
  a.reduce((s, v, i) => s + v * b[i], 0);
export const differentialCross = (
  a: DifferentialVector,
  b: DifferentialVector,
): DifferentialVector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function differentialRotateX(p: DifferentialVector, a: number): DifferentialVector {
  const c = Math.cos(a),
    s = Math.sin(a);
  return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]];
}
export type DifferentialMotion = ReturnType<typeof differentialMotion>;
export function differentialMotion(
  mode: DifferentialMode,
  inputRate: number,
  time: number,
  radius = 2,
  turn = 1,
) {
  finite(inputRate, time, radius, turn);
  if (time < 0 || radius < DIFFERENTIAL.track / 2 || Math.abs(turn) > 1)
    throw new RangeError(
      'Use nonnegative time, radius at least half track, and bounded turn direction',
    );
  const fraction =
    mode === 'turn' ? (turn * DIFFERENTIAL.track) / (2 * radius) : mode === 'left-held' ? 1 : 0;
  const carrierRate = mode === 'carrier-held' ? 0 : inputRate,
    differenceRate = mode === 'carrier-held' ? inputRate : carrierRate * fraction;
  const leftRate = carrierRate - differenceRate,
    rightRate = carrierRate + differenceRate;
  return {
    mode,
    time,
    radius,
    turn,
    carrierRate,
    differenceRate,
    leftRate,
    rightRate,
    carrierAngle: carrierRate * time,
    differenceAngle: differenceRate * time,
    leftAngle: leftRate * time,
    rightAngle: rightRate * time,
    pinionRate: (-DIFFERENTIAL.sideTeeth / DIFFERENTIAL.pinionTeeth) * differenceRate,
    pinionAngle:
      Math.PI / DIFFERENTIAL.pinionTeeth -
      (DIFFERENTIAL.sideTeeth / DIFFERENTIAL.pinionTeeth) * differenceRate * time,
    centerSpeed: carrierRate * DIFFERENTIAL.wheelRadius,
    leftDistance: leftRate * time * DIFFERENTIAL.wheelRadius,
    rightDistance: rightRate * time * DIFFERENTIAL.wheelRadius,
    yaw: mode === 'turn' ? (carrierRate * time * DIFFERENTIAL.wheelRadius * turn) / radius : 0,
  };
}
/** Positive torque magnitudes. Requested torque is a ceiling, not torque silently accepted by a stalled axle. */
export function differentialTraction(
  requestedCarrier: number,
  leftCapacity: number,
  rightCapacity: number,
) {
  finite(requestedCarrier, leftCapacity, rightCapacity);
  if (Math.min(requestedCarrier, leftCapacity, rightCapacity) < 0)
    throw new RangeError('Torque magnitudes must be nonnegative');
  const sideTorque = Math.min(requestedCarrier / 2, leftCapacity, rightCapacity);
  return {
    requestedCarrier,
    leftCapacity,
    rightCapacity,
    sideTorque,
    acceptedCarrier: 2 * sideTorque,
    unusedRequest: requestedCarrier - 2 * sideTorque,
    limited: 2 * sideTorque < requestedCarrier - 1e-9,
  };
}
export function differentialPower(m: DifferentialMotion, sideTorque: number) {
  finite(sideTorque);
  return {
    left: sideTorque * m.leftRate,
    right: sideTorque * m.rightRate,
    input: 2 * sideTorque * m.carrierRate,
  };
}
/** Paths for an axle with no lateral slip. Wheelbase/Ackermann front-wheel geometry is outside this axle model. */
export function differentialPaths(m: DifferentialMotion, samples = 81) {
  if (m.mode !== 'straight' && m.mode !== 'turn')
    throw new RangeError('Road paths require a rolling axle constraint');
  if (!Number.isInteger(samples) || samples < 2 || samples > 1000)
    throw new RangeError('Bounded path samples required');
  const d = DIFFERENTIAL.track / 2;
  return Array.from({ length: samples }, (_, i) => {
    const q = i / (samples - 1),
      yaw = m.yaw * q;
    if (m.mode !== 'turn' || m.turn === 0)
      return {
        left: [-d, m.leftDistance * q] as [number, number],
        right: [d, m.rightDistance * q] as [number, number],
        yaw: 0,
      };
    const signedR = m.radius / m.turn,
      point = (x: number): [number, number] => [
        -signedR + (signedR + x) * Math.cos(yaw),
        (signedR + x) * Math.sin(yaw),
      ];
    return { left: point(-d), right: point(d), yaw };
  });
}
export type DifferentialBevel = ReturnType<typeof differentialBevel>;
export function differentialBevel(kind: 'side' | 'pinion') {
  const teeth = kind === 'side' ? DIFFERENTIAL.sideTeeth : DIFFERENTIAL.pinionTeeth,
    mate = kind === 'side' ? DIFFERENTIAL.pinionTeeth : DIFFERENTIAL.sideTeeth;
  const pitch = Math.atan(teeth / mate),
    pressure = (25 * Math.PI) / 180,
    base = Math.asin(Math.sin(pitch) * Math.cos(pressure)),
    moduleRatio = 2 / Math.hypot(teeth, mate);
  return {
    kind,
    teeth,
    pitch,
    base,
    pressure,
    root: pitch - Math.atan(moduleRatio),
    tip: pitch + Math.atan(0.8 * moduleRatio),
    module: DIFFERENTIAL.coneOuter * moduleRatio,
    inner: DIFFERENTIAL.coneInner,
    outer: DIFFERENTIAL.coneOuter,
    bore: DIFFERENTIAL.bore,
  };
}
/** Spherical involute: unwind a great-circle arc of length L from the base cone. */
export function differentialInvolute(g: DifferentialBevel, polar: number) {
  const l = Math.acos(clip(Math.cos(Math.max(g.base, polar)) / Math.cos(g.base), -1, 1));
  return l / Math.sin(g.base) - Math.atan2(Math.sin(l), Math.sin(g.base) * Math.cos(l));
}
export function differentialHalfTooth(g: DifferentialBevel, polar: number) {
  return (
    Math.PI / (2 * g.teeth) + differentialInvolute(g, g.pitch) - differentialInvolute(g, polar)
  );
}
export function differentialFlank(
  g: DifferentialBevel,
  polar: number,
  phase: number,
  side = 1,
  coneDistance = 1,
): DifferentialVector {
  const phi = phase + side * differentialHalfTooth(g, polar),
    r = coneDistance * Math.sin(polar);
  return [r * Math.cos(phi), r * Math.sin(phi), coneDistance * Math.cos(polar)];
}
export function differentialFrame(
  v: DifferentialVector,
  id: DifferentialGearId,
  carrier = 0,
): DifferentialVector {
  const [u, w, a] = v;
  const p: DifferentialVector =
    id === 'right'
      ? [a, u, w]
      : id === 'left'
        ? [-a, u, -w]
        : id === 'upper'
          ? [u, a, -w]
          : [u, -a, w];
  return differentialRotateX(p, carrier);
}
export function differentialUnframe(
  v: DifferentialVector,
  id: DifferentialGearId,
  carrier = 0,
): DifferentialVector {
  const [x, y, z] = differentialRotateX(v, -carrier);
  return id === 'right'
    ? [y, z, x]
    : id === 'left'
      ? [y, -z, -x]
      : id === 'upper'
        ? [x, -z, y]
        : [x, z, -y];
}
export function differentialGearPhase(id: DifferentialGearId, m: DifferentialMotion) {
  return id === 'left' || id === 'right' ? m.differenceAngle : m.pinionAngle;
}
export function differentialGearPoint(
  g: DifferentialBevel,
  polar: number,
  tooth: number,
  flank: number,
  distance: number,
  id: DifferentialGearId,
  m: DifferentialMotion,
) {
  return differentialFrame(
    differentialFlank(
      g,
      polar,
      differentialGearPhase(id, m) + (tooth * TAU) / g.teeth,
      flank,
      distance,
    ),
    id,
    m.carrierAngle,
  );
}
export function differentialGearAxis(id: DifferentialGearId, carrier: number) {
  return differentialFrame([0, 0, 1], id, carrier);
}
export function differentialGearVelocity(
  point: DifferentialVector,
  id: DifferentialGearId,
  m: DifferentialMotion,
): DifferentialVector {
  const axis = differentialGearAxis(id, m.carrierAngle),
    rate = id === 'left' || id === 'right' ? m.differenceRate : m.pinionRate;
  return differentialCross([m.carrierRate + rate * axis[0], rate * axis[1], rate * axis[2]], point);
}
/** Signed angular gap to the analytic tooth envelope; positive means outside the tooth. */
export function differentialToothGap(
  g: DifferentialBevel,
  point: DifferentialVector,
  phase: number,
) {
  const length = Math.hypot(...point),
    polar = Math.acos(clip(point[2] / length, -1, 1));
  if (polar < g.root) return polar - g.root;
  if (polar > g.tip) return polar - g.tip;
  return (
    Math.abs(differentialWrap(Math.atan2(point[1], point[0]) - phase, TAU / g.teeth)) -
    differentialHalfTooth(g, polar)
  );
}
/** Exact contacts of one active flank of the right-side/upper-pinion pair. No pitch-point snapping. */
export function differentialContacts(differenceAngle: number) {
  finite(differenceAngle);
  const s = differentialBevel('side'),
    p = differentialBevel('pinion'),
    ratio = s.teeth / p.teeth;
  const a = differentialWrap(differenceAngle, TAU / s.teeth),
    out: { point: DifferentialVector; normal: DifferentialVector }[] = [];
  for (let tooth = -2; tooth <= 1; tooth++) {
    const phase = a + (tooth * TAU) / s.teeth;
    const sample = (polar: number) => {
      const point = differentialFrame(differentialFlank(s, polar, phase), 'right'),
        phi = phase + differentialHalfTooth(s, polar),
        sb = Math.sin(s.base),
        sn = Math.sin(polar),
        f = Math.sqrt(Math.max(0, sn * sn - sb * sb)) / sn;
      const normal: DifferentialVector = [
        -f * sn,
        (-sb / sn) * Math.sin(phi) + f * Math.cos(polar) * Math.cos(phi),
        (sb / sn) * Math.cos(phi) + f * Math.cos(polar) * Math.sin(phi),
      ];
      return {
        point,
        normal,
        residual: differentialDot(normal, differentialCross([1, ratio, 0], point)),
      };
    };
    let low = s.base + 1e-10,
      high = s.tip,
      fl = sample(low).residual;
    if (fl * sample(high).residual > 0) continue;
    for (let i = 0; i < 45; i++) {
      const mid = (low + high) / 2,
        f = sample(mid).residual;
      if (fl * f > 0) {
        low = mid;
        fl = f;
      } else high = mid;
    }
    const c = sample((low + high) / 2),
      pinPolar = Math.acos(clip(c.point[1], -1, 1));
    if (
      (low + high) / 2 >= s.root &&
      pinPolar >= Math.max(p.base, p.root) &&
      pinPolar <= p.tip + 1e-10
    )
      out.push({ point: c.point, normal: c.normal });
  }
  return out;
}
/** A spherical outline sampled on the same analytic flanks used by contact checks. */
export function differentialBevelOutline(g: DifferentialBevel) {
  const points: { polar: number; azimuth: number }[] = [],
    n = 18;
  for (let tooth = 0; tooth < g.teeth; tooth++) {
    const center = (tooth * TAU) / g.teeth;
    const add = (polar: number, azimuth: number) =>
      points.push({ polar, azimuth: center + azimuth });
    add(g.root, -differentialHalfTooth(g, g.root));
    for (let i = 0; i <= n; i++) {
      const start = Math.max(g.base, g.root),
        polar = start + ((g.tip - start) * i) / n;
      add(polar, -differentialHalfTooth(g, polar));
    }
    for (let i = 1; i <= 6; i++)
      add(g.tip, -differentialHalfTooth(g, g.tip) + (2 * differentialHalfTooth(g, g.tip) * i) / 6);
    for (let i = n - 1; i >= 0; i--) {
      const start = Math.max(g.base, g.root),
        polar = start + ((g.tip - start) * i) / n;
      add(polar, differentialHalfTooth(g, polar));
    }
    add(g.root, differentialHalfTooth(g, g.root));
    const end = TAU / g.teeth - differentialHalfTooth(g, g.root);
    for (let i = 1; i < 7; i++)
      add(
        g.root,
        differentialHalfTooth(g, g.root) + ((end - differentialHalfTooth(g, g.root)) * i) / 7,
      );
  }
  return points;
}
export function differentialShot(chapter: number, progress: number) {
  finite(chapter, progress);
  const c = Math.floor(clip(chapter, 0, 7)),
    q = clip(progress),
    mode: DifferentialMode =
      c === 0 || c === 2 || c === 3 || c >= 5 ? 'turn' : c === 4 ? 'left-held' : 'straight';
  const base = differentialMotion(mode, 0.9, 8 * q, 2),
    rate = 0.9 * 0.7 * Math.sin(Math.PI * q) ** 2,
    angle = 0.9 * 0.7 * 8 * (q / 2 - Math.sin(2 * Math.PI * q) / (4 * Math.PI));
  const motion: DifferentialMotion =
    c === 3
      ? {
          ...base,
          mode: 'sweep',
          differenceRate: rate,
          differenceAngle: angle,
          leftRate: 0.9 - rate,
          rightRate: 0.9 + rate,
          leftAngle: base.carrierAngle - angle,
          rightAngle: base.carrierAngle + angle,
          pinionRate: -1.5 * rate,
          pinionAngle: Math.PI / 16 - 1.5 * angle,
          leftDistance: (base.carrierAngle - angle) * DIFFERENTIAL.wheelRadius,
          rightDistance: (base.carrierAngle + angle) * DIFFERENTIAL.wheelRadius,
          yaw: 0,
        }
      : base;
  const smooth = clip((q - 0.1) / 0.65),
    leftCapacity = c === 6 ? 300 - 240 * smooth * smooth * (3 - 2 * smooth) : 300;
  return {
    chapter: c,
    progress: q,
    focus: ['paths', 'straight', 'spiders', 'mean', 'held', 'torque', 'traction', 'return'][c],
    motion,
    load: differentialTraction(400, leftCapacity, 300),
    reference: differentialTraction(400, 300, 300),
  };
}
