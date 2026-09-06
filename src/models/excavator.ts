/**
 * Planar teaching excavator of the 20-tonne class. Metres, radians, kilograms,
 * pascals and newtons. Every renderer, drawing and cover derives its geometry
 * from this file; the hydraulic readouts derive from the same pin positions.
 *
 * Frames: world x points forward (from cab toward bucket), y up. The boom chord
 * frame starts at the boom foot pin; the stick frame at the boom tip pin with
 * +y toward the outer (cylinder) face; the bucket frame at the bucket pin and
 * is aligned with the stick frame at zero curl. Curl is clockwise in the side
 * view, so extending the bucket cylinder rolls the cutting edge toward the cab.
 */
export type XY = { x: number; y: number };
export const xy = (x: number, y: number): XY => ({ x, y });
export const add = (a: XY, b: XY): XY => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: XY, b: XY): XY => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: XY, f: number): XY => ({ x: a.x * f, y: a.y * f });
export const mix = (a: XY, b: XY, f: number): XY => add(a, scale(sub(b, a), f));
export const distance = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);
export const polar = (length: number, angle: number): XY => ({
  x: length * Math.cos(angle),
  y: length * Math.sin(angle),
});
export const rotate = (p: XY, angle: number): XY => ({
  x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
  y: p.x * Math.sin(angle) + p.y * Math.cos(angle),
});
/** Place a local point into a frame with origin `o` rotated by `angle`. */
export const frame = (o: XY, angle: number, local: XY): XY => add(o, rotate(local, angle));
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const smooth = (v: number) => {
  const x = clamp(v, 0, 1);
  return x * x * (3 - 2 * x);
};

/**
 * Cylinder bores and rods follow the Komatsu PC200-8 brochure (boom 120/85,
 * arm 135/95, bucket 115/80 mm); barrel and rod lengths are teaching values
 * chosen so the piston stays inside the barrel over the offered poses.
 */
export type CylinderSpec = { bore: number; rod: number; barrel: number; rodLength: number };
export const EXCAVATOR = {
  foot: xy(0.55, 1.8),
  boomLength: 5.7,
  boomKnee: xy(2.7, 0.62),
  boomDepth: { foot: 0.5, knee: 0.86, tip: 0.42 },
  boomWidth: 0.5,
  boomCylinderLug: xy(2.35, -0.02),
  boomCylinderBase: xy(1.6, 1.0),
  boomCylinderOffset: 0.6,
  stickCylinderBase: xy(3.45, 0.66),
  stickLength: 2.9,
  stickTail: 0.7,
  stickDepth: { pivot: 0.6, tip: 0.36 },
  stickWidth: 0.4,
  stickCylinderEye: xy(-0.58, 0.34),
  bucketCylinderBase: xy(0.52, 0.34),
  rockerPin: xy(2.4, 0.06),
  rockerLength: 0.64,
  linkLength: 0.5,
  bucketLug: xy(-0.16, 0.4),
  bucketWidth: 1.0,
  cylinders: {
    boom: { bore: 0.12, rod: 0.085, barrel: 1.62, rodLength: 1.5 },
    stick: { bore: 0.135, rod: 0.095, barrel: 1.7, rodLength: 1.5 },
    bucket: { bore: 0.115, rod: 0.08, barrel: 1.4, rodLength: 1.25 },
  } satisfies Record<string, CylinderSpec>,
  /** Main relief setting of the implement circuit on the reference machine (37.3 MPa). */
  relief: 37.3e6,
  /** Lumped masses and their centres in the respective local frames. */
  masses: {
    boom: { kg: 1900, at: xy(2.7, 0.35) },
    stick: { kg: 950, at: xy(1.2, 0.05) },
    bucket: { kg: 780, at: xy(0.42, 0.45) },
    boomCylinders: 600,
    stickCylinder: 320,
    bucketCylinder: 240,
  },
  limits: {
    boom: [0.25, 1.05],
    stick: [-2.35, -0.85],
    curl: [-0.3, 2.35],
    payload: [0, 3000],
    flow: [0, 440],
  },
} as const;
export const GRAVITY = 9.81;

const curve = (a: XY, control: XY, b: XY, n = 10) =>
  Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    return xy(
      (1 - t) ** 2 * a.x + 2 * (1 - t) * t * control.x + t * t * b.x,
      (1 - t) ** 2 * a.y + 2 * (1 - t) * t * control.y + t * t * b.y,
    );
  });
/**
 * Bucket side profile in the bucket frame (x along the stick at zero curl, y
 * toward the outer face). The pin sits at the origin, the heel curves below the
 * pin and the cutting edge with its teeth reaches forward and down.
 */
export const BUCKET = {
  side: [
    xy(-0.02, -0.14),
    xy(0.32, -0.36),
    ...curve(xy(0.32, -0.36), xy(1.02, -0.5), xy(1.05, 0.34)),
    xy(0.98, 0.82),
    xy(0.86, 0.86),
    ...curve(xy(0.86, 0.86), xy(0.62, 0.12), xy(0.08, 0.14)),
  ],
  /** Curved back plate from the heel to the cutting edge, bucket frame. */
  back: [
    xy(0.32, -0.36),
    ...curve(xy(0.32, -0.36), xy(1.02, -0.5), xy(1.05, 0.34), 14),
    xy(0.98, 0.82),
  ],
  /** Cutting edge and the teeth root line, bucket frame. */
  edge: { a: xy(0.98, 0.82), b: xy(0.86, 0.86) },
  tooth: [xy(0.96, 0.8), xy(0.9, 0.85), xy(1.08, 1.06), xy(1.12, 1.02)],
  tip: xy(1.1, 1.04),
  lugs: [xy(-0.06, -0.02), xy(-0.24, 0.32), xy(-0.16, 0.48), xy(0.02, 0.5), xy(0.16, 0.16)],
  fill: [
    xy(0.3, 0.05),
    ...curve(xy(0.3, 0.05), xy(0.95, -0.25), xy(0.96, 0.5)),
    xy(0.9, 0.7),
    ...curve(xy(0.9, 0.7), xy(0.6, 0.25), xy(0.3, 0.05)),
  ],
} as const;
export const pathOf = (points: readonly XY[], close = true) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join('') +
  (close ? 'Z' : '');

/** Boom side outline in the chord frame: a welded box section with a gooseneck bend. */
export function boomOutline(): XY[] {
  const { boomLength, boomKnee, boomDepth } = EXCAVATOR;
  const tip = xy(boomLength, 0);
  const top = [
    xy(-0.2, boomDepth.foot / 2),
    ...curve(xy(0.35, 0.36), xy(1.9, 0.98), xy(boomKnee.x, boomKnee.y + boomDepth.knee / 2)),
    ...curve(
      xy(boomKnee.x, boomKnee.y + boomDepth.knee / 2),
      xy(4.3, 0.78),
      xy(tip.x + 0.02, boomDepth.tip / 2),
    ),
  ];
  const bottom = [
    xy(tip.x + 0.02, -boomDepth.tip / 2),
    ...curve(
      xy(tip.x + 0.02, -boomDepth.tip / 2),
      xy(4.1, 0.05),
      xy(boomKnee.x, boomKnee.y - boomDepth.knee / 2),
    ),
    ...curve(xy(boomKnee.x, boomKnee.y - boomDepth.knee / 2), xy(1.4, 0.02), xy(0.3, -0.25)),
    xy(-0.2, -boomDepth.foot / 2),
  ];
  return [...top, ...bottom];
}
/** Stick side outline in the stick frame, tapering from the pivot to the bucket pin. */
export function stickOutline(): XY[] {
  const { stickLength, stickTail, stickDepth } = EXCAVATOR;
  return [
    xy(-stickTail, 0.22),
    xy(-0.3, 0.46),
    ...curve(xy(-0.3, 0.46), xy(0.7, 0.42), xy(stickLength - 0.3, stickDepth.tip / 2)),
    xy(stickLength + 0.16, 0.12),
    xy(stickLength + 0.16, -0.12),
    xy(stickLength - 0.3, -stickDepth.tip / 2),
    ...curve(xy(stickLength - 0.3, -stickDepth.tip / 2), xy(0.9, -0.3), xy(-0.25, -0.3)),
    xy(-stickTail, -0.1),
  ];
}

export function circleJoint(a: XY, b: XY, ra: number, rb: number, upper = true): XY {
  const d = distance(a, b);
  if (
    ![a.x, a.y, b.x, b.y, ra, rb].every(Number.isFinite) ||
    ra <= 0 ||
    rb <= 0 ||
    d >= ra + rb ||
    d <= Math.abs(ra - rb)
  )
    throw new RangeError('Bucket linkage cannot close');
  const along = (ra * ra - rb * rb + d * d) / (2 * d),
    h = Math.sqrt(Math.max(0, ra * ra - along * along)),
    s = upper ? 1 : -1;
  return {
    x: a.x + (along * (b.x - a.x)) / d - (s * h * (b.y - a.y)) / d,
    y: a.y + (along * (b.y - a.y)) / d + (s * h * (b.x - a.x)) / d,
  };
}

export type Pose = { boom: number; stick: number; curl: number };
export type Cylinder = {
  a: XY;
  b: XY;
  length: number;
  spec: CylinderSpec;
  /** Piston face distance from the base pin, along the axis. */
  piston: number;
  /** Fraction of the usable stroke, 0 fully retracted. */
  stroke: number;
};
function cylinder(a: XY, b: XY, spec: CylinderSpec): Cylinder {
  const length = distance(a, b);
  const piston = length - spec.rodLength;
  const stroke = (piston - 0.1) / (spec.barrel - 0.22);
  return { a, b, length, spec, piston, stroke };
}
export function excavatorPose(input: Pose) {
  const boom = clamp(input.boom, ...EXCAVATOR.limits.boom),
    stick = clamp(input.stick, ...EXCAVATOR.limits.stick),
    curl = clamp(input.curl, ...EXCAVATOR.limits.curl);
  if (![input.boom, input.stick, input.curl].every(Number.isFinite))
    throw new RangeError('Pose is not finite');
  const E = EXCAVATOR;
  const foot = E.foot,
    tip = frame(foot, boom, xy(E.boomLength, 0)),
    stickAngle = boom + stick,
    bucketAngle = stickAngle - curl,
    bucketPin = frame(tip, stickAngle, xy(E.stickLength, 0));
  const local = {
    boom: (p: XY) => frame(foot, boom, p),
    stick: (p: XY) => frame(tip, stickAngle, p),
    bucket: (p: XY) => frame(bucketPin, bucketAngle, p),
  };
  const rockerPin = local.stick(E.rockerPin),
    lug = local.bucket(E.bucketLug),
    joint = circleJoint(rockerPin, lug, E.rockerLength, E.linkLength, true);
  const cylinders = {
    boom: cylinder(E.boomCylinderBase, local.boom(E.boomCylinderLug), E.cylinders.boom),
    stick: cylinder(
      local.boom(E.stickCylinderBase),
      local.stick(E.stickCylinderEye),
      E.cylinders.stick,
    ),
    bucket: cylinder(local.stick(E.bucketCylinderBase), joint, E.cylinders.bucket),
  };
  return {
    boom,
    stick,
    curl,
    foot,
    tip,
    bucketPin,
    stickAngle,
    bucketAngle,
    rockerPin,
    lug,
    joint,
    cylinders,
    local,
    tooth: local.bucket(BUCKET.tip),
    centres: {
      boom: local.boom(E.masses.boom.at),
      stick: local.stick(E.masses.stick.at),
      bucket: local.bucket(E.masses.bucket.at),
      payload: local.bucket(xy(0.62, 0.32)),
      boomCylinders: mix(cylinders.boom.a, cylinders.boom.b, 0.45),
      stickCylinder: mix(cylinders.stick.a, cylinders.stick.b, 0.45),
      bucketCylinder: mix(cylinders.bucket.a, cylinders.bucket.b, 0.45),
    },
  };
}
export type ExcavatorPose = ReturnType<typeof excavatorPose>;

export const pistonArea = (spec: CylinderSpec) => (Math.PI * spec.bore ** 2) / 4;
export const annulusArea = (spec: CylinderSpec) => pistonArea(spec) - (Math.PI * spec.rod ** 2) / 4;
/** Perpendicular distance from the boom foot to the boom cylinder line of action. */
export function leverArm(pose: ExcavatorPose) {
  const { a, b } = pose.cylinders.boom;
  const u = scale(sub(b, a), 1 / distance(a, b)),
    r = sub(pose.foot, a);
  return { arm: Math.abs(r.x * u.y - r.y * u.x), unit: u };
}
export type Valve = 'lift' | 'hold' | 'lower';
export type Hydraulics = ReturnType<typeof excavatorHydraulics>;
/**
 * Quasi-static lifting of the front attachment about the boom foot by the two
 * boom cylinders. Losses, inertia, return-line pressure and soil forces are
 * omitted. `anchored` means the teeth are held by something immovable, so the
 * required pressure is unbounded and the main relief valve opens.
 */
export function excavatorHydraulics(
  pose: ExcavatorPose,
  payload: number,
  flow: number,
  valve: Valve = 'lift',
  anchored = false,
  demand = 1,
) {
  if (![payload, flow, demand].every(Number.isFinite) || payload < 0 || flow < 0)
    throw new RangeError('Invalid hydraulic input');
  const M = EXCAVATOR.masses,
    c = pose.centres,
    x = (p: XY) => p.x - pose.foot.x;
  const moment =
    GRAVITY *
    (M.boom.kg * x(c.boom) +
      M.stick.kg * x(c.stick) +
      M.bucket.kg * x(c.bucket) +
      M.boomCylinders * x(c.boomCylinders) +
      M.stickCylinder * x(c.stickCylinder) +
      M.bucketCylinder * x(c.bucketCylinder) +
      payload * x(c.payload));
  const spec = EXCAVATOR.cylinders.boom,
    area = pistonArea(spec),
    { arm } = leverArm(pose);
  // Gravity alone sets the holding pressure. A lift attempt against an immovable
  // obstacle raises the pressure (ramped by `demand` for the transient) until
  // the main relief valve opens; releasing the lever traps only the gravity load.
  const gravityPressure = moment / (2 * area * arm);
  const blocked = anchored && valve === 'lift';
  const requiredPressure = blocked ? Infinity : gravityPressure;
  const relief = blocked ? demand >= 1 : gravityPressure >= EXCAVATOR.relief && valve === 'lift';
  const pressure = blocked
    ? EXCAVATOR.relief * clamp(demand, 0, 1)
    : Math.min(EXCAVATOR.relief, gravityPressure);
  const q = flow / 60000;
  const moving = valve === 'lift' && !relief && !blocked && flow > 0;
  const velocity = moving ? q / (2 * area) : 0;
  return {
    moment,
    arm,
    area,
    annulus: annulusArea(spec),
    requiredPressure,
    pressure,
    relief,
    stalled: !moving && valve === 'lift',
    gravityPressure,
    force: pressure * area,
    velocity,
    boomRate: velocity / arm,
    hydraulicPower: valve === 'lift' ? pressure * q : 0,
    reliefPower: relief ? pressure * q : 0,
  };
}

/** Deterministic boom rise driven by supply flow, so seeking agrees with playback. */
export function integrateBoom(
  from: Pose,
  payload: number,
  flowAt: (seconds: number) => number,
  seconds: number,
  step = 1 / 20,
) {
  let boom = from.boom,
    t = 0;
  while (t < seconds - 1e-9) {
    const dt = Math.min(step, seconds - t);
    const pose = excavatorPose({ ...from, boom });
    const h = excavatorHydraulics(pose, payload, flowAt(t), 'lift');
    boom = clamp(boom + h.boomRate * dt, ...EXCAVATOR.limits.boom);
    t += dt;
  }
  return boom;
}

export type View = 'wide' | 'cylinder' | 'side' | 'bucket';
export type Shot = {
  pose: Pose;
  payload: number;
  flow: number;
  valve: Valve;
  anchored: boolean;
  /** Pressure build-up fraction while lifting against an obstacle. */
  demand: number;
  view: View;
  cutaway: number;
  lever: boolean;
  forceArrow: boolean;
  rock: boolean;
  labels: string[];
};
export type Clock = {
  chapter: number;
  chapterProgress: number;
  chapterTime: number;
  chapterSeconds: number;
};
const REST: Pose = { boom: 0.62, stick: -1.55, curl: 0.9 };
/** The directed film. Chapter-relative, so measured speech can retime it. */
export function excavatorShot(clock: Clock): Shot {
  const c = clock.chapter,
    p = clamp(clock.chapterProgress, 0, 1),
    s = smooth;
  if (!Number.isInteger(c) || c < 0 || c > 6 || !Number.isFinite(p))
    throw new RangeError('Invalid excavator chapter');
  const base: Shot = {
    pose: REST,
    payload: 1200,
    flow: 0,
    valve: 'hold',
    anchored: false,
    demand: 1,
    view: 'wide',
    cutaway: 0,
    lever: false,
    forceArrow: false,
    rock: false,
    labels: [],
  };
  switch (c) {
    case 0: {
      // Dig: curl the bucket into the heap, crowd the stick, then lift the boom.
      const curlP = s(p / 0.34),
        crowd = s((p - 0.12) / 0.34),
        lift = s((p - 0.46) / 0.4);
      return {
        ...base,
        pose: {
          boom: 0.46 + 0.28 * lift,
          stick: -1.15 - 0.5 * crowd,
          curl: -0.1 + 1.6 * curlP,
        },
        payload: 1200 * s((p - 0.08) / 0.3),
        valve: lift > 0 && lift < 1 ? 'lift' : 'hold',
        labels: p > 0.5 ? ['boomCylinder', 'stickCylinder', 'bucketCylinder'] : [],
      };
    }
    case 1: {
      // Open the boom cylinder and let oil push the piston while the boom rises.
      const open = s((p - 0.08) / 0.3),
        T = clock.chapterSeconds,
        flowAt = (t: number) => (t > 0.42 * T && t < 0.92 * T ? 30 : 0);
      const boom = integrateBoom(
        { boom: 0.5, stick: -1.6, curl: 1.4 },
        1200,
        flowAt,
        clock.chapterTime,
      );
      return {
        ...base,
        pose: { boom, stick: -1.6, curl: 1.4 },
        view: 'cylinder',
        cutaway: open,
        flow: flowAt(clock.chapterTime),
        valve: flowAt(clock.chapterTime) > 0 ? 'lift' : 'hold',
        labels: open > 0.9 ? ['piston', 'capEnd', 'rodEnd'] : [],
      };
    }
    case 2: {
      // Same pose, more load: pressure follows the load, the pump only supplies oil.
      const heavier = s((p - 0.4) / 0.4);
      return {
        ...base,
        pose: { boom: 0.6, stick: -1.6, curl: 1.4 },
        view: 'cylinder',
        cutaway: 1,
        payload: 300 + 1500 * heavier,
        valve: 'hold',
        forceArrow: p > 0.15,
        labels: ['pistonFace'],
      };
    }
    case 3: {
      // Flow sets speed: the same load, twice the flow, the boom rises faster.
      const T = clock.chapterSeconds,
        flowAt = (t: number) => (t < 0.06 * T ? 0 : t < 0.55 * T ? 40 : 100);
      const boom = integrateBoom(
        { boom: 0.44, stick: -1.6, curl: 1.4 },
        1200,
        flowAt,
        clock.chapterTime,
      );
      return {
        ...base,
        pose: { boom, stick: -1.6, curl: 1.4 },
        view: 'cylinder',
        cutaway: 1,
        flow: flowAt(clock.chapterTime),
        valve: boom < EXCAVATOR.limits.boom[1] && flowAt(clock.chapterTime) > 0 ? 'lift' : 'hold',
        labels: ['capEnd'],
      };
    }
    case 4: {
      // Side elevation: the same load, changing leverage.
      const sweep = s((p - 0.15) / 0.7);
      const boom = 0.45 + 0.57 * (sweep < 0.5 ? s(sweep * 2) : s(2 - sweep * 2));
      return {
        ...base,
        pose: { boom, stick: -1.5, curl: 1.4 },
        view: 'side',
        lever: p > 0.08,
        valve: sweep <= 0 || sweep >= 1 ? 'hold' : sweep < 0.5 ? 'lift' : 'lower',
        labels: ['pivot', 'leverArm'],
      };
    }
    case 5: {
      // The bucket four-bar: cylinder extension becomes curl.
      const curl = -0.3 + 2.55 * s((p - 0.1) / 0.75);
      return {
        ...base,
        pose: { boom: 0.62, stick: -1.35, curl },
        view: 'bucket',
        valve: 'hold',
        payload: 0,
        labels: ['bucketCylinder', 'rocker', 'link', 'bucketPin'],
      };
    }
    default: {
      // Teeth under a boulder: pressure climbs to relief and the boom cannot rise.
      const push = s((p - 0.08) / 0.3),
        release = p > 0.66;
      return {
        ...base,
        pose: { boom: 0.34, stick: -1.05, curl: 0.35 },
        view: p < 0.62 ? 'cylinder' : 'wide',
        cutaway: p < 0.62 ? 1 : 1 - s((p - 0.62) / 0.12),
        payload: 0,
        anchored: true,
        demand: 0.2 + 0.8 * push,
        flow: 120 * s((p - 0.04) / 0.12),
        valve: release ? 'hold' : 'lift',
        rock: true,
        labels: release ? [] : push > 0.98 ? ['relief'] : ['capEnd'],
      };
    }
  }
}
