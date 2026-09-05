/** Discrete moulded mushroom-head zipper. Material coordinate s is measured
 * along each tape bead in pitch units u. The right row is shifted by p/2.
 * A prescribed, continuous guide path is used; this is not a cloth/force solver.
 */
export type ZipPoint = [number, number];
export type ZipVec3 = [number, number, number];
export type ZipSide = -1 | 1;
export const ZIP = Object.freeze({
  pitch: 1,
  count: 13,
  beadHalfGap: 0.88,
  angle: 0.65,
  bendLength: 1,
  straightLength: 1,
  returnLength: 2.5,
  tapeWidth: 1.04,
  beadRadius: 0.06,
  boreRadius: 0.085,
  toothHalfDepth: 0.12,
  wingHalfDepth: 0.028,
  grooveHalfHeight: 0.04,
  guideHalfHeight: 0.17,
  plateThickness: 0.055,
  railThickness: 0.09,
  guideClearance: 0.032,
  bodyLow: -0.75,
  bodyHigh: 2.2,
  stopS: 13.2,
  bottomStopY: -1.22,
  bottomStopHalfHeight: 0.14,
  marked: 6,
});
export const zipClamp = (v: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
export const zipSmooth = (v: number) => {
  const x = zipClamp(v);
  return x * x * (3 - 2 * x);
};
export const zipRect = (x0: number, x1: number, y0: number, y1: number): ZipPoint[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
export function zipperHeadOutline(shoulder = true): ZipPoint[] {
  const h = shoulder ? 0.3 : 0.12;
  return Array.from({ length: 33 }, (_, i) => {
    const a = -Math.PI / 2 + (Math.PI * i) / 32;
    return [0.88 + 0.3 * Math.cos(a), h * Math.sin(a)];
  });
}
export function zipperProfile(shoulder = true): ZipPoint[] {
  const half = shoulder ? 0.3 : 0.12;
  return [
    [-0.13, -0.23],
    [0.34, -0.23],
    [0.34, -0.12],
    [0.88, -0.12],
    [0.88, -half],
    ...zipperHeadOutline(shoulder).slice(1),
    [0.88, 0.12],
    [0.34, 0.12],
    [0.34, 0.23],
    [-0.13, 0.23],
  ];
}
export function zipperLayerParts(layer: 'outer' | 'middle', shoulder = true) {
  const h = shoulder ? 0.3 : 0.12;
  const core = [zipRect(-0.13, 0.34, -0.23, 0.23), zipRect(0.34, 0.88, -0.12, 0.12)];
  return layer === 'outer'
    ? [...core, zipRect(0.88, 1.18, -h, h)]
    : [...core, zipRect(0.88, 0.93, -h, h), zipRect(0.68, 0.8, -0.24, 0.24)];
}
/** Each segment integrates the unit tangent exactly: bead arc length is s. */
export function zipperPath(u: number) {
  const s = Number.isFinite(u) ? u : 0;
  if (s <= 0) return { x: 0, y: s, angle: 0 };
  let x = 0,
    y = 0,
    a = 0,
    left = s;
  for (const [length, slope] of [
    [ZIP.bendLength, ZIP.angle / ZIP.bendLength],
    [ZIP.straightLength, 0],
    [ZIP.returnLength, -ZIP.angle / ZIP.returnLength],
  ] as const) {
    const q = Math.min(left, length);
    if (q <= 0) break;
    if (slope === 0) {
      x += q * Math.sin(a);
      y += q * Math.cos(a);
    } else {
      x += (Math.cos(a) - Math.cos(a + slope * q)) / slope;
      y += (Math.sin(a + slope * q) - Math.sin(a)) / slope;
    }
    a += slope * q;
    left -= q;
  }
  if (left > 0) y += left;
  return { x, y, angle: Math.max(0, a) };
}
export function zipperTransform(
  local: ZipPoint,
  s: number,
  slider: number,
  side: ZipSide,
): ZipPoint {
  const p = zipperPath(s - slider),
    c = Math.cos(p.angle),
    sn = Math.sin(p.angle);
  return [
    side * (ZIP.beadHalfGap + p.x - local[0] * c + local[1] * sn),
    slider + p.y + local[0] * sn + local[1] * c,
  ];
}
export function zipperTooth(index: number, side: ZipSide, slider: number, shoulder = true) {
  const s = index * ZIP.pitch + (side === 1 ? ZIP.pitch / 2 : 0),
    p = zipperPath(s - slider);
  return {
    index,
    side,
    id: `${side === -1 ? 'L' : 'R'}${index + 1}`,
    s,
    angle: p.angle,
    root: zipperTransform([0, 0], s, slider, side),
    outline: zipperProfile(shoulder).map((v) => zipperTransform(v, s, slider, side)),
    locked: s <= slider - 0.5,
    guide: p,
    parts: (layer: 'outer' | 'middle') =>
      zipperLayerParts(layer, shoulder).map((poly) =>
        poly.map((v) => zipperTransform(v, s, slider, side)),
      ),
  };
}
const cross = (a: ZipPoint, b: ZipPoint, c: ZipPoint) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
export function zipperArea(p: ZipPoint[]) {
  return (
    Math.abs(
      p.reduce((s, a, i) => {
        const b = p[(i + 1) % p.length];
        return s + a[0] * b[1] - a[1] * b[0];
      }, 0),
    ) / 2
  );
}
/** Convex clipping, used for finite layers and the rigid displacement comparison. */
export function zipperIntersection(subject: ZipPoint[], clip: ZipPoint[]) {
  let out = subject;
  const sign = Math.sign(
    clip.reduce((s, a, i) => {
      const b = clip[(i + 1) % clip.length];
      return s + a[0] * b[1] - a[1] * b[0];
    }, 0),
  );
  for (let k = 0; k < clip.length; k++) {
    const a = clip[k],
      b = clip[(k + 1) % clip.length],
      input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const p = input[i],
        q = input[(i + 1) % input.length],
        fp = sign * cross(a, b, p),
        fq = sign * cross(a, b, q);
      if (fp >= 0) out.push(p);
      if (fp > 0 !== fq > 0) {
        const t = fp / (fp - fq);
        out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    }
  }
  return out;
}
function slice(poly: ZipPoint[], y: number) {
  const xs: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
      xs.push(a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
  }
  return xs;
}
/** The fixed Y tunnel is generated around the swept finite tooth outline.
 * .008 u sampling plus .032 u allowance conservatively bounds the sweep.
 */
export function zipperGuide() {
  const samples = Array.from({ length: 726 }, (_, i) =>
    zipperProfile().map((p) => zipperTransform(p, -1.6 + i * 0.008, 0, 1)),
  );
  const sections = Array.from({ length: 75 }, (_, i) => {
    const y = ZIP.bodyLow + ((ZIP.bodyHigh - ZIP.bodyLow) * i) / 74;
    let outer = 0,
      inner = Infinity;
    for (const poly of samples)
      for (const x of slice(poly, y)) {
        outer = Math.max(outer, x);
        inner = Math.min(inner, x);
      }
    return { y, outer: outer + ZIP.guideClearance, inner: Math.max(0, inner - ZIP.guideClearance) };
  });
  const outline: ZipPoint[] = [
    ...sections.map((v) => [-v.outer - ZIP.railThickness, v.y] as ZipPoint),
    ...sections
      .slice()
      .reverse()
      .map((v) => [v.outer + ZIP.railThickness, v.y] as ZipPoint),
  ];
  const fork = sections.filter((v) => v.inner > 0);
  const diamond: ZipPoint[] = fork.length
    ? [
        [0, fork[0].y - 0.03],
        ...fork.map((v) => [v.inner, v.y] as ZipPoint),
        ...fork
          .slice()
          .reverse()
          .map((v) => [-v.inner, v.y] as ZipPoint),
      ]
    : [];
  return { sections, outline, diamond };
}
export const ZIP_GUIDE = zipperGuide();
export const ZIP_STOP = zipRect(-0.17, 0.43, -0.2, 0.2);
export const ZIP_MIN = ZIP.bottomStopY + ZIP.bottomStopHalfHeight - ZIP.bodyLow;
function topOverlap(u: number) {
  const stop = ZIP_STOP.map((v) => zipperTransform(v, u, 0, 1));
  return zipperArea(zipperIntersection(ZIP_GUIDE.outline, stop)) > 1e-12;
}
function topLimit() {
  let safe = 4.5,
    blocked = 1.5;
  for (let i = 0; i < 55; i++) {
    const mid = (safe + blocked) / 2;
    if (topOverlap(mid)) blocked = mid;
    else safe = mid;
  }
  return ZIP.stopS - safe;
}
export const ZIP_MAX = topLimit();
export function zipperPose(travel: number) {
  const slider = ZIP_MIN + (ZIP_MAX - ZIP_MIN) * zipClamp(travel),
    teeth = ([-1, 1] as const).flatMap((side) =>
      Array.from({ length: ZIP.count }, (_, i) => zipperTooth(i, side, slider)),
    );
  const marked = teeth[ZIP.marked];
  return {
    travel: zipClamp(travel),
    slider,
    teeth,
    marked,
    engaged: teeth.filter((t) => t.locked).length,
    atBottom: zipClamp(travel) <= 0,
    atTop: zipClamp(travel) >= 1,
  };
}
export type ZipperPose = ReturnType<typeof zipperPose>;
export const zipperTravelFor = (slider: number) =>
  zipClamp((slider - ZIP_MIN) / (ZIP_MAX - ZIP_MIN));
/** Normalized symmetric, rigid, frictionless transverse loading of one tooth.
 * Two shoulder contacts have equal moment arms, so each reaction is F/2.
 * No material strength, strain, slider lock pin or failure load is predicted.
 */
export function zipperLoad(force: number) {
  const f = zipClamp(force);
  return {
    force: f,
    reactions: [f / 2, f / 2],
    net: 0,
    overlap: 2 * 0.3 - ZIP.pitch / 2,
    normal: [1, 0] as ZipPoint,
    displacement: 0,
  };
}
/** Counterfactual removing the broad shoulder, not a commercial tooth design. */
export function zipperComparison(trial: number) {
  const requested = zipClamp(trial, 0, 0.45);
  return { requested, normal: 0, withoutShoulder: requested };
}
export const zipperInitial = () => ({
  travel: 0.34,
  force: 0.5,
  trial: 0.25,
  view: 'whole' as 'whole' | 'guide' | 'tooth' | 'load' | 'comparison',
});
export function zipperShot(chapter: number, progress: number) {
  const ch = Math.floor(zipClamp(chapter, 0, 7)),
    p = zipClamp(progress),
    e = zipSmooth(p);
  let slider = ZIP_MIN + (ZIP_MAX - ZIP_MIN) * (0.12 + 0.68 * e),
    focus = 'whole',
    force = 0.5,
    trial = 0.25;
  if (ch === 1) {
    slider = ZIP.marked + 1.4;
    focus = 'tooth';
  }
  if (ch === 2) {
    slider = ZIP.marked - 1.8 + 1.3 * e;
    focus = 'guide';
  }
  if (ch === 3) {
    slider = ZIP.marked - 2.3 + 3.4 * e;
    focus = 'capture';
  }
  if (ch === 4) {
    slider = ZIP.marked + 2;
    focus = 'load';
    force = e;
  }
  if (ch === 5) {
    slider = ZIP.marked + 1.1 - 3.4 * e;
    focus = 'capture';
  }
  if (ch === 6) {
    const u = zipSmooth(zipClamp((p - 0.18) / 0.64));
    slider = ZIP_MAX - (ZIP_MAX - ZIP_MIN) * u;
    focus = 'stops';
  }
  if (ch === 7) {
    slider = ZIP.marked + 2;
    focus = 'comparison';
    trial = 0.45 * e;
  }
  return {
    chapter: ch,
    progress: p,
    focus,
    pose: zipperPose(zipperTravelFor(slider)),
    force,
    trial,
  };
}
/** Meaningful perspective bounds are fitted in the same basis used by Three. */
export function zipperCamera(pose: ZipperPose, focus: string, aspect: number, progress: number) {
  const phone = aspect < 1,
    whole = focus === 'whole' && !phone;
  let target: ZipVec3 = [0, 6, 0.05],
    halfX = 3.85,
    halfY = 8.15;
  if (!whole) {
    target =
      focus === 'tooth' || focus === 'capture'
        ? [pose.marked.root[0] + 0.7, pose.marked.root[1] + 0.1, 0.04]
        : [0, pose.slider + 0.9, 0.05];
    halfX = focus === 'tooth' ? 1.35 : 2.7;
    halfY = focus === 'tooth' ? 1.35 : 2.5;
  }
  const raw: ZipVec3 =
      focus === 'tooth' ? [0.1, 0.55, 1] : [0.14 + 0.1 * Math.sin(progress * Math.PI), 0.2, 1],
    norm = Math.hypot(...raw),
    direction = raw.map((x) => x / norm) as ZipVec3,
    rn = Math.hypot(direction[0], direction[2]),
    right: ZipVec3 = [direction[2] / rn, 0, -direction[0] / rn],
    up: ZipVec3 = [
      direction[1] * right[2],
      direction[2] * right[0] - direction[0] * right[2],
      -direction[1] * right[0],
    ],
    cot = 1 / Math.tan((17 * Math.PI) / 180),
    a = Math.max(0.35, aspect);
  const bounds: ZipVec3[] = [];
  for (const x of [target[0] - halfX, target[0] + halfX])
    for (const y of [target[1] - halfY, target[1] + halfY])
      for (const z of [-0.24, 0.85]) bounds.push([x, y, z]);
  const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
  let distance = 1;
  for (const corner of bounds) {
    const v = corner.map((x, i) => x - target[i]);
    distance = Math.max(
      distance,
      dot(v, direction) + (Math.abs(dot(v, right)) * cot) / (a * 0.85),
      dot(v, direction) + (Math.abs(dot(v, up)) * cot) / 0.85,
    );
  }
  return { target, direction, right, up, bounds, cot, aspect: a, distance };
}
/** Thickness section through one actual engaged wing/head overlap, in x-z. */
export function zipperSection() {
  const y = 0.275,
    headTip = Math.sqrt(0.3 * 0.3 - y * y);
  return {
    y,
    headTip,
    upper: zipRect(0, headTip, 0.04, 0.12),
    lower: zipRect(0, headTip, -0.12, -0.04),
    web: zipRect(0, Math.min(0.05, headTip), -0.04, 0.04),
    oppositeWing: zipRect(0.88 - 0.8, 0.88 - 0.68, -0.028, 0.028),
    clearance: ZIP.grooveHalfHeight - ZIP.wingHalfDepth,
  };
}
