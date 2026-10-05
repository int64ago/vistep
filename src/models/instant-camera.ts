/** Polaroid color i-Type integral film teaching model.
 * Frame/image dimensions follow Polaroid's published dimensions. Camera geometry, nip,
 * paste thickness, kinetics and dirty-roller defect amplitudes are disclosed teaching choices.
 * One physical sheet coordinate drives transport, roller phase, pod compression and spreading.
 */
export const IC = {
  width: 88.47,
  length: 107.52,
  imageWidth: 76.801,
  imageLength: 78.94,
  imageStart: 21.4,
  thickness: 0.32,
  plane: 27,
  rollerRadius: 8,
  initialLead: -14,
  finalLead: 116,
  podCenter: 9,
  podHalfLength: 4,
  podFreeHeight: 1.5,
  pasteThickness: 0.08,
  reserveFraction: 0.06,
  dirtFirstU: 30,
  dirtV: 32,
  dirtHalfSize: 2,
  mirror: { x: -74.87, y: 83 },
  lens: { x: 18, y: 83 },
} as const;
/** Fixed teaching hardware in millimetres. Cover and Three share these solids;
 * their optical opening, barrel walls and mount do not depend on a drawing style.
 * The transport/chemistry equations below are independent of this artwork geometry. */
export const IC_CAMERA_GEOMETRY = {
  shell: [
    { size: [163, 8, 143], at: [-71.5, 6.5, 0], radius: 3.75 },
    { size: [8, 113, 143], at: [-155.5, 63, 0], radius: 3.5 },
    { size: [157, 101, 6], at: [-74, 64, -69.5], radius: 3 },
    { size: [155, 13, 6], at: [-75, 13.5, 69.5], radius: 2.25 },
    { size: [58, 7, 143], at: [-130, 124, 0], radius: 3 },
    { size: [53, 5, 141.5], at: [-17, 109, 0], radius: 1.5 },
  ],
  frontFrame: [
    { size: [7, 9, 141.5], at: [7.5, 111.5, 0], radius: 1.5 },
    { size: [7, 46, 40], at: [7.5, IC.lens.y, -51], radius: 1.5 },
    { size: [7, 46, 40], at: [7.5, IC.lens.y, 51], radius: 1.5 },
    { size: [7, 8.5, 67.5], at: [7.5, 53, -37], radius: 1.5 },
  ],
  barrels: [
    { x: 10, radius: 23.5, length: 14 },
    { x: 21, radius: 22, length: 10 },
    { x: 27.5, radius: 19, length: 5 },
  ],
  wallThickness: 3.25,
  mount: { x: 6.5, innerRadius: 21, outerRadius: 34, length: 5.5 },
  lens: { x: 30.75, frontRadius: 16.5, backRadius: 17, length: 3.25 },
  mirrorSize: [56.5, 2.25, 81],
  mirrorSupport: { size: [9, 11.5, 35], at: [-88.5, 67, -51], radius: 1.75 },
  cassette: { size: [122.5, 13.5, 99.5], at: [-73, 14.5, 0], radius: 2.25 },
  rollerExtraWidth: 9,
  axleExtraWidth: 29,
  axleRadius: 1.85,
  rollerBrackets: [
    { size: [18.5, 31, 7.5], at: [0, IC.plane, -54.5], radius: 2.25 },
    { size: [18.5, 31, 7.5], at: [0, IC.plane, 54.5], radius: 2.25 },
  ],
} as const;
export const IC_FEED_MAX = IC.finalLead - IC.initialLead;
export type IcRgb = readonly [number, number, number];
const clamp = (x: number, low: number, high: number) => Math.max(low, Math.min(high, x));
const finite = (...v: number[]) => {
  if (!v.every(Number.isFinite)) throw new RangeError('Finite model input required');
};
export function icDirtPositions() {
  const circumference = 2 * Math.PI * IC.rollerRadius;
  return Array.from(
    { length: Math.ceil(IC.length / circumference) },
    (_, i) => IC.dirtFirstU + i * circumference,
  ).filter((u) => u >= IC.imageStart && u <= IC.imageStart + IC.imageLength);
}
/** Straight sheet, tangential at the roller nip; x=lead-u and z=v-width/2. */
export function icPaperPoint(feedMm: number, u: number, v: number) {
  finite(feedMm, u, v);
  if (feedMm < 0 || feedMm > IC_FEED_MAX || u < 0 || u > IC.length || v < 0 || v > IC.width)
    throw new RangeError('Outside sheet/transport bounds');
  return { x: IC.initialLead + feedMm - u, y: IC.plane, z: v - IC.width / 2 };
}
export function icNipGap(x: number) {
  finite(x);
  return Math.abs(x) < IC.rollerRadius
    ? IC.thickness + 2 * (IC.rollerRadius - Math.sqrt(IC.rollerRadius ** 2 - x ** 2))
    : Infinity;
}
/** Finite foil pod lies above the paper. Each mesh vertex uses the smallest upper
 * roller clearance across both adjacent segments, so interpolated faces cannot
 * penetrate the cylinder between sample points. Compression is a teaching shape,
 * not an elastic-material or rupture-pressure calculation. */
export function icPodProfile(feedMm: number, segments = 32) {
  finite(feedMm);
  if (
    feedMm < 0 ||
    feedMm > IC_FEED_MAX ||
    !Number.isInteger(segments) ||
    segments < 4 ||
    segments > 128
  )
    throw new RangeError('Invalid pod profile input');
  const podX = IC.initialLead + feedMm - IC.podCenter;
  const free = podX >= 0 ? 0.035 : IC.podFreeHeight;
  const step = (IC.podHalfLength * 2) / segments;
  return Array.from({ length: segments + 1 }, (_, i) => {
    const localX = -IC.podHalfLength + i * step;
    const x = podX + localX;
    const nearest = Math.max(0, Math.abs(x) - step);
    const clearance = (icNipGap(nearest) - IC.thickness) / 2;
    return { localX, x, height: Math.max(0, Math.min(free, clearance)) };
  });
}
export function icFeed(feedMm: number, dirty = false) {
  finite(feedMm);
  if (feedMm < 0 || feedMm > IC_FEED_MAX) throw new RangeError('Invalid feed travel');
  const lead = IC.initialLead + feedMm,
    podX = lead - IC.podCenter;
  const ruptured = lead >= IC.podCenter;
  const front = ruptured
    ? clamp(lead, IC.imageStart, IC.imageStart + IC.imageLength)
    : IC.imageStart;
  const imageMargin = (IC.width - IC.imageWidth) / 2;
  let wettedArea = (front - IC.imageStart) * IC.imageWidth;
  if (dirty)
    for (const u of icDirtPositions()) {
      const overlap = Math.max(
        0,
        Math.min(front, u + IC.dirtHalfSize) - Math.max(IC.imageStart, u - IC.dirtHalfSize),
      );
      wettedArea -= overlap * IC.dirtHalfSize * 2;
    }
  const total = IC.imageWidth * IC.imageLength * IC.pasteThickness * (1 + IC.reserveFraction);
  const spread = wettedArea * IC.pasteThickness,
    inTrap = lead >= IC.length ? total - spread : 0;
  const inPod = ruptured ? 0 : total,
    bead = ruptured ? total - spread - inTrap : 0;
  return {
    feedMm,
    pickerTravel: Math.min(feedMm, -IC.initialLead),
    pickerX: IC.initialLead + Math.min(feedMm, -IC.initialLead) - IC.length,
    pickerEngaged: lead < 0,
    lead,
    trail: lead - IC.length,
    podX,
    ruptured,
    podProfile: icPodProfile(feedMm),
    front,
    podHeight: Math.max(
      0,
      Math.min(ruptured ? 0.035 : IC.podFreeHeight, (icNipGap(podX) - IC.thickness) / 2),
    ),
    topCenter: { x: 0, y: IC.plane + IC.rollerRadius + IC.thickness / 2 },
    bottomCenter: { x: 0, y: IC.plane - IC.rollerRadius - IC.thickness / 2 },
    topAngle: feedMm / IC.rollerRadius,
    bottomAngle: -feedMm / IC.rollerRadius,
    contact: lead >= 0 && lead <= IC.length,
    coverage: wettedArea / (IC.imageLength * IC.imageWidth),
    imageMargin,
    volume: { total, inPod, bead, spread, inTrap },
    dirtAngle:
      -Math.PI / 2 - (IC.dirtFirstU - IC.initialLead) / IC.rollerRadius + feedMm / IC.rollerRadius,
  };
}
export function icCovered(u: number, v: number, feedMm: number, dirty: boolean) {
  finite(u, v);
  const f = icFeed(feedMm, dirty);
  return coveredAt(u, v, f, dirty);
}
function coveredAt(u: number, v: number, f: ReturnType<typeof icFeed>, dirty: boolean) {
  if (
    u < IC.imageStart ||
    u > IC.imageStart + IC.imageLength ||
    v < f.imageMargin ||
    v > IC.width - f.imageMargin ||
    u > f.front
  )
    return false;
  return (
    !dirty ||
    !icDirtPositions().some(
      (mark) => Math.abs(u - mark) < IC.dirtHalfSize && Math.abs(v - IC.dirtV) < IC.dirtHalfSize,
    )
  );
}
/** An original still-life, deterministically shared by exposure and developed print. */
export function icSubject(x: number, y: number): IcRgb {
  finite(x, y);
  if (x < 0 || x > 1 || y < 0 || y > 1) throw new RangeError('Normalized image position required');
  const background: IcRgb =
    y < 0.69 ? [0.29 + 0.08 * y, 0.57 + 0.07 * x, 0.57 + 0.04 * x] : [0.76, 0.68, 0.49];
  const cup = x > 0.32 && x < 0.66 && y > 0.3 && y < 0.73;
  const rim = ((x - 0.49) / 0.17) ** 2 + ((y - 0.31) / 0.04) ** 2 < 1;
  const handle = ((x - 0.7) / 0.12) ** 2 + ((y - 0.5) / 0.14) ** 2;
  if (rim) return [0.43, 0.13, 0.09];
  if (cup || (handle < 1 && handle > 0.43)) return [0.78 - 0.12 * x, 0.22 + 0.04 * y, 0.13];
  if (((x - 0.5) / 0.29) ** 2 + ((y - 0.74) / 0.05) ** 2 < 1) return [0.38, 0.42, 0.34];
  return background;
}
/** Normalized CMY mass balance. Actual film has multiple coupled layers, spectral curves,
 * auxiliary developers and proprietary chemistry; these constants are not measured kinetics. */
export function icChemistry(seconds: number, exposure: IcRgb, covered = true) {
  finite(seconds, ...exposure);
  if (seconds < 0 || exposure.some((v) => v < 0 || v > 1))
    throw new RangeError('Invalid development input');
  const t = covered ? seconds : 0;
  const development = -Math.expm1(-t / 80),
    transfer = -Math.expm1(-t / 180);
  const fixed = exposure.map((v) => v * development),
    received = exposure.map((v) => (1 - v) * transfer);
  const remaining = exposure.map((_, i) => 1 - fixed[i] - received[i]);
  const veil = covered ? Math.exp(-t / 160) : 1;
  const dyeRgb = received.map((d) => 1 - d);
  const paste: IcRgb = [0.43, 0.53, 0.68];
  const dryNegative: IcRgb = [0.23, 0.3, 0.26];
  const rgb = covered ? dyeRgb.map((v, i) => paste[i] * veil + v * (1 - veil)) : [...dryNegative];
  return {
    fixed,
    received,
    remaining,
    veil,
    rgb,
    reaction: development,
    transfer,
    neutralized: clamp((t - 600) / 300, 0, 1),
  };
}
export function icImagePixels(feedMm: number, seconds: number, dirty = false, size = 48) {
  if (!Number.isInteger(size) || size < 2 || size > 128)
    throw new RangeError('Invalid image resolution');
  const pixels = new Uint8Array(size * size * 4);
  const f = icFeed(feedMm, dirty);
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++) {
      const x = (col + 0.5) / size,
        y = (row + 0.5) / size;
      // Top of portrait is trailing end; wide pod border is the leading bottom edge.
      const u = IC.imageStart + (1 - y) * IC.imageLength,
        v = (IC.width - IC.imageWidth) / 2 + x * IC.imageWidth;
      const c = icChemistry(seconds, icSubject(x, y), coveredAt(u, v, f, dirty));
      const index = (row * size + col) * 4;
      c.rgb.forEach((value, k) => (pixels[index + k] = Math.round(clamp(value, 0, 1) * 255)));
      pixels[index + 3] = 255;
    }
  return pixels;
}
export type IcView =
  'exposure' | 'transport' | 'rollers' | 'spread' | 'layers' | 'develop' | 'care';
const views: IcView[] = ['exposure', 'transport', 'rollers', 'spread', 'layers', 'develop', 'care'];
const smooth = (value: number) => {
  const p = clamp(value, 0, 1);
  return p * p * (3 - 2 * p);
};
const ramp = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
/** Chapter progress owns physical transport and chemical time, never an independent timer. */
export function icShot(
  chapter: number,
  progress: number,
  manual?: { feedMm: number; seconds: number; dirty: boolean },
) {
  finite(chapter, progress);
  const c = clamp(Math.floor(chapter), 0, 6),
    p = clamp(progress, 0, 1);
  let feedMm = 0,
    seconds = 0,
    dirty = false;
  if (c === 1) feedMm = 20 * ramp(p, 0.13, 0.78);
  if (c === 2) feedMm = 20 + (58 - 20) * ramp(p, 0.1, 0.77);
  if (c === 3) feedMm = 58 + (IC_FEED_MAX - 58) * ramp(p, 0.08, 0.75);
  if (c >= 4) feedMm = IC_FEED_MAX;
  if (c === 4) seconds = 10 + 170 * ramp(p, 0.08, 0.8);
  if (c === 5) seconds = 180 + 720 * ramp(p, 0.08, 0.88);
  if (c === 6) {
    seconds = 900;
    dirty = p >= 0.22 && p < 0.66;
  }
  if (manual) ({ feedMm, seconds, dirty } = manual);
  const transport = icFeed(feedMm, dirty);
  const sample = icChemistry(
    seconds,
    icSubject(0.48, 0.5),
    icCovered(
      IC.imageStart + IC.imageLength * 0.5,
      (IC.width - IC.imageWidth) / 2 + IC.imageWidth * 0.48,
      feedMm,
      dirty,
    ),
  );
  return {
    view: views[c],
    chapter: c,
    progress: p,
    feedMm,
    seconds,
    dirty,
    transport,
    sample,
    shutterOpen: c === 0 && p >= 0.14 && p < 0.45,
    latent: c > 0 || p >= 0.45,
    lightShield: c < 4 || (c === 4 && p < 0.22),
    rayProgress: c === 0 ? ramp(p, 0.15, 0.4) : 0,
    layerReveal: c === 4 ? ramp(p, 0.06, 0.25) : 0,
  };
}
export type IcShot = ReturnType<typeof icShot>;

/** Camera framing includes the actual near corners of the shell and complete paper travel.
 * The nip shot deliberately crops the camera, but preserves rollers, axles and the pod passage.
 * Coordinates use the renderer's 1/50 mm scale. */
export const IC_FRAME_BOUNDS = {
  camera: [
    [-3.19, 0.04, -1.46],
    [0.7, 2.55, 1.46],
  ],
  paper: [
    [(IC.initialLead - IC.length) / 50, (IC.plane - 2) / 50, -IC.width / 100],
    [IC.finalLead / 50, (IC.plane + 5) / 50, IC.width / 100],
  ],
  nip: [
    [-0.3, 0.2, -1.18],
    [0.7, 0.89, 1.18],
  ],
} as const;
const dot3 = (a: readonly number[], b: readonly number[]) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize3 = (v: readonly number[]) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const cross3 = (a: readonly number[], b: readonly number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function icFramePoints(detail = false) {
  const bounds = detail ? [IC_FRAME_BOUNDS.nip] : [IC_FRAME_BOUNDS.camera, IC_FRAME_BOUNDS.paper];
  return bounds.flatMap(([a, b]) =>
    [a[0], b[0]].flatMap((x) => [a[1], b[1]].flatMap((y) => [a[2], b[2]].map((z) => [x, y, z]))),
  );
}
export function icCameraFrame(aspect: number, detail = false) {
  finite(aspect);
  if (aspect <= 0) throw new RangeError('Positive aspect required');
  const target = detail ? [0, IC.plane / 50, 0] : [-0.85, 1.04, 0];
  const direction = normalize3(detail ? [4.5, 2.8, 1] : [5, 3.8, 7]);
  const right = normalize3(cross3([0, 1, 0], direction)),
    up = cross3(direction, right);
  const tangent = Math.tan((34 * Math.PI) / 360),
    margin = 0.88;
  const distance = Math.max(
    ...icFramePoints(detail).map((point) => {
      const offset = point.map((v, i) => v - target[i]),
        near = dot3(offset, direction);
      return Math.max(
        near + Math.abs(dot3(offset, right)) / (tangent * aspect * margin),
        near + Math.abs(dot3(offset, up)) / (tangent * margin),
        near + 0.5,
      );
    }),
  );
  return { target, position: target.map((v, i) => v + direction[i] * distance), distance };
}
