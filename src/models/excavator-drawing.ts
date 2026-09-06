/**
 * Side-elevation primitives shared by the 2D runtime fallback, the cover and
 * the social artwork. Everything is placed from `excavatorPose`, so the drawing
 * cannot disagree with the physical model. Coordinates are metres, y up; the
 * consumer flips y once with a `scale(1,-1)` transform.
 */
import {
  BUCKET,
  EXCAVATOR,
  boomOutline,
  distance,
  excavatorPose,
  frame,
  pathOf,
  rotate,
  stickOutline,
  sub,
  type Cylinder,
  type Pose,
  type XY,
} from './excavator';

export type Primitive =
  | { kind: 'path'; d: string; fill?: string; stroke?: string; width?: number; opacity?: number }
  | { kind: 'circle'; c: XY; r: number; fill?: string; stroke?: string; width?: number };

export const DRAWING_INK = {
  paint: '#d9952c',
  paintDeep: '#b97a22',
  steel: '#4c565c',
  chrome: '#cfd6d8',
  pin: '#8a959b',
  glass: '#a9c7cf',
  chassis: '#3a4043',
  soil: '#8a6b48',
  capOil: '#d98a3a',
  rodOil: '#9fbfcb',
  wall: '#5a666c',
} as const;

const transformed = (points: readonly XY[], origin: XY, angle: number) =>
  points.map((p) => frame(origin, angle, p));

/** Rectangle of a cylinder segment along its axis, as a closed path. */
function alongAxis(cyl: Cylinder, from: number, to: number, radius: number) {
  const angle = Math.atan2(cyl.b.y - cyl.a.y, cyl.b.x - cyl.a.x);
  const pts = [
    { x: from, y: -radius },
    { x: to, y: -radius },
    { x: to, y: radius },
    { x: from, y: radius },
  ];
  return pathOf(transformed(pts, cyl.a, angle));
}

export function cylinderPrimitives(cyl: Cylinder, section = false): Primitive[] {
  const { spec } = cyl,
    wall = spec.bore / 2 + 0.03,
    out: Primitive[] = [];
  const rodR = spec.rod / 2;
  if (section) {
    const inner = spec.bore / 2;
    // Barrel walls, chambers, piston and rod visible through the cut.
    out.push({ kind: 'path', d: alongAxis(cyl, 0.1, spec.barrel, wall), fill: DRAWING_INK.wall });
    out.push({
      kind: 'path',
      d: alongAxis(cyl, 0.16, cyl.piston - 0.06, inner),
      fill: DRAWING_INK.capOil,
    });
    out.push({
      kind: 'path',
      d: alongAxis(cyl, cyl.piston + 0.06, spec.barrel - 0.14, inner),
      fill: DRAWING_INK.rodOil,
    });
    out.push({
      kind: 'path',
      d: alongAxis(cyl, spec.barrel - 0.14, spec.barrel, inner),
      fill: DRAWING_INK.wall,
    });
    out.push({
      kind: 'path',
      d: alongAxis(cyl, cyl.piston + 0.06, cyl.length, rodR),
      fill: DRAWING_INK.chrome,
    });
    out.push({
      kind: 'path',
      d: alongAxis(cyl, cyl.piston - 0.06, cyl.piston + 0.06, inner),
      fill: DRAWING_INK.steel,
    });
  } else {
    out.push({
      kind: 'path',
      d: alongAxis(cyl, spec.barrel - 0.1, cyl.length, rodR),
      fill: DRAWING_INK.chrome,
    });
    out.push({ kind: 'path', d: alongAxis(cyl, 0.1, spec.barrel, wall), fill: DRAWING_INK.steel });
  }
  out.push({ kind: 'circle', c: cyl.a, r: 0.1, fill: DRAWING_INK.pin });
  out.push({ kind: 'circle', c: cyl.b, r: 0.085, fill: DRAWING_INK.pin });
  return out;
}

/** The complete machine in side view with one boom cylinder optionally sectioned. */
export function excavatorDrawing(
  input: Pose,
  options: { section?: boolean; payload?: number } = {},
) {
  const p = excavatorPose(input),
    E = EXCAVATOR,
    ink = DRAWING_INK,
    out: Primitive[] = [];
  // Undercarriage: track outline and rollers.
  out.push({
    kind: 'path',
    d: 'M-2.2 0.9 L1.9 0.9 A0.45 0.45 0 0 0 1.9 0 L-2.2 0 A0.45 0.45 0 0 0 -2.2 0.9Z',
    fill: ink.chassis,
  });
  for (let i = 0; i < 6; i++)
    out.push({ kind: 'circle', c: { x: -1.7 + i * 0.66, y: 0.28 }, r: 0.16, fill: ink.pin });
  out.push({ kind: 'path', d: 'M-1.2 0.9 L1.1 0.9 L1.1 1.08 L-1.2 1.08Z', fill: ink.steel });
  // Upper structure: platform, counterweight, engine hood, cab and boom bracket.
  out.push({ kind: 'path', d: 'M-2.9 1.08 L1.75 1.08 L1.75 1.3 L-2.9 1.3Z', fill: ink.paintDeep });
  out.push({
    kind: 'path',
    d: 'M-2.95 1.3 L-0.5 1.3 L-0.5 2.25 L-2.75 2.25 A0.2 0.2 0 0 1 -2.95 2.05Z',
    fill: ink.paint,
  });
  out.push({ kind: 'path', d: 'M-0.35 1.3 L0.9 1.3 L0.9 3.05 L-0.35 3.05Z', fill: ink.paint });
  out.push({ kind: 'path', d: 'M-0.22 1.75 L0.78 1.75 L0.78 2.95 L-0.22 2.95Z', fill: ink.glass });
  out.push({ kind: 'path', d: 'M0.25 1.3 L1.0 1.3 L1.0 2.15 L0.25 2.15Z', fill: ink.paintDeep });
  // Boom and stick outlines from the shared profiles.
  out.push({
    kind: 'path',
    d: pathOf(transformed(boomOutline(), p.foot, p.boom)),
    fill: ink.paint,
  });
  out.push({
    kind: 'path',
    d: pathOf(transformed(stickOutline(), p.tip, p.stickAngle)),
    fill: ink.paint,
  });
  // Bucket, fill and teeth.
  const bucket = (pts: readonly XY[]) => transformed(pts, p.bucketPin, p.bucketAngle);
  if (options.payload && options.payload > 0)
    out.push({ kind: 'path', d: pathOf(bucket(BUCKET.fill)), fill: ink.soil });
  out.push({ kind: 'path', d: pathOf(bucket(BUCKET.side)), fill: ink.paintDeep });
  out.push({ kind: 'path', d: pathOf(bucket(BUCKET.lugs)), fill: ink.paintDeep });
  out.push({ kind: 'path', d: pathOf(bucket(BUCKET.tooth)), fill: ink.steel });
  // Linkage: rocker and bucket link, then cylinders on top.
  out.push({
    kind: 'path',
    d: pathOf([p.rockerPin, p.joint], false),
    stroke: ink.steel,
    width: 0.12,
  });
  out.push({ kind: 'path', d: pathOf([p.joint, p.lug], false), stroke: ink.steel, width: 0.1 });
  out.push(...cylinderPrimitives(p.cylinders.stick));
  out.push(...cylinderPrimitives(p.cylinders.bucket));
  out.push(...cylinderPrimitives(p.cylinders.boom, options.section));
  for (const c of [p.foot, p.tip, p.bucketPin, p.rockerPin, p.joint, p.lug])
    out.push({ kind: 'circle', c, r: 0.09, fill: ink.pin, stroke: '#e9ece6', width: 0.02 });
  return { primitives: out, pose: p };
}

/** Rendered extent for a fixed side-view frame. */
export const DRAWING_BOUNDS = { x: -3.3, y: -0.1, width: 13.6, height: 8.2 };
export const rodAngle = (cyl: Cylinder) => Math.atan2(cyl.b.y - cyl.a.y, cyl.b.x - cyl.a.x);
export const cylinderMid = (cyl: Cylinder) => ({
  x: (cyl.a.x + cyl.b.x) / 2,
  y: (cyl.a.y + cyl.b.y) / 2,
});
export { distance, rotate, sub };
