export type Point2 = { x: number; y: number };
export const TAU = Math.PI * 2;
export const wrap = (value: number, period = 1) => ((value % period) + period) % period;
export const pitchRadius = (pitch: number, teeth: number) =>
  pitch / (2 * Math.sin(Math.PI / teeth));

/** Standard 20° involute, common module, with a small manufacturing backlash. */
export function involuteOutline(module: number, teeth: number): Point2[] {
  const pitch = (module * teeth) / 2;
  const base = pitch * Math.cos(Math.PI / 9),
    root = pitch - 1.25 * module,
    tip = pitch + module;
  const involute = (r: number) => {
    const alpha = Math.acos(Math.min(1, base / r));
    return Math.tan(alpha) - alpha;
  };
  const half = (r: number) => (Math.PI / (2 * teeth)) * 0.97 + involute(pitch) - involute(r);
  const points: Point2[] = [];
  const add = (radius: number, angle: number) =>
    points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  for (let tooth = 0; tooth < teeth; tooth++) {
    const center = (tooth * TAU) / teeth,
      low = Math.max(root, base);
    add(root, center - Math.PI / teeth);
    add(root, center - half(low));
    for (let j = 0; j <= 7; j++) {
      const r = low + ((tip - low) * j) / 7;
      add(r, center - half(r));
    }
    for (let j = 1; j <= 4; j++) add(tip, center - half(tip) + (2 * half(tip) * j) / 4);
    for (let j = 7; j >= 0; j--) {
      const r = low + ((tip - low) * j) / 7;
      add(r, center + half(r));
    }
    add(root, center + half(low));
    add(root, center + Math.PI / teeth);
  }
  return points;
}

/** A tooth on one wheel meets a gap on the other, at every rotation. */
export function meshedAngle(
  angle: number,
  driverTeeth: number,
  drivenTeeth: number,
  bearing: number,
) {
  return bearing + Math.PI - (Math.PI - driverTeeth * (bearing - angle)) / drivenTeeth;
}

export function pulleyLoop(a: Point2, b: Point2, ra: number, rb: number, chainPitch?: number) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    distance = Math.hypot(dx, dy);
  if (distance <= Math.abs(ra - rb) || ra <= 0 || rb <= 0)
    throw new Error('Invalid pulley geometry');
  const bearing = Math.atan2(dy, dx),
    alpha = Math.acos((ra - rb) / distance);
  const tangentLength = Math.sqrt(distance * distance - (ra - rb) ** 2);
  const polar = (c: Point2, r: number, angle: number) => ({
    x: c.x + r * Math.cos(angle),
    y: c.y + r * Math.sin(angle),
  });
  const topA = polar(a, ra, bearing + alpha),
    topB = polar(b, rb, bearing + alpha);
  const bottomA = polar(a, ra, bearing - alpha),
    bottomB = polar(b, rb, bearing - alpha);
  // Chain parameter is one roller pitch, including the polygonal wrap around each sprocket.
  const scaleA = chainPitch ? 1 / (2 * Math.asin(chainPitch / (2 * ra))) : ra;
  const scaleB = chainPitch ? 1 / (2 * Math.asin(chainPitch / (2 * rb))) : rb;
  const straight = chainPitch ? tangentLength / chainPitch : tangentLength;
  const lengths = [straight, 2 * alpha * scaleB, straight, (TAU - 2 * alpha) * scaleA];
  const length = lengths.reduce((sum, value) => sum + value, 0);
  const sample = (position: number) => {
    let s = wrap(position, length);
    let point: Point2, tangent: Point2;
    if (s < lengths[0]) {
      const t = s / lengths[0];
      point = { x: topA.x + (topB.x - topA.x) * t, y: topA.y + (topB.y - topA.y) * t };
      tangent = { x: (topB.x - topA.x) / tangentLength, y: (topB.y - topA.y) / tangentLength };
    } else if ((s -= lengths[0]) < lengths[1]) {
      const angle = bearing + alpha - s / scaleB;
      point = polar(b, rb, angle);
      tangent = { x: Math.sin(angle), y: -Math.cos(angle) };
    } else if ((s -= lengths[1]) < lengths[2]) {
      const t = s / lengths[2];
      point = {
        x: bottomB.x + (bottomA.x - bottomB.x) * t,
        y: bottomB.y + (bottomA.y - bottomB.y) * t,
      };
      tangent = {
        x: (bottomA.x - bottomB.x) / tangentLength,
        y: (bottomA.y - bottomB.y) / tangentLength,
      };
    } else {
      s -= lengths[2];
      const angle = bearing - alpha - s / scaleA;
      point = polar(a, ra, angle);
      tangent = { x: Math.sin(angle), y: -Math.cos(angle) };
    }
    return { ...point, tx: tangent.x, ty: tangent.y };
  };
  return { length, lengths, sample, bearing, alpha, topA, topB, bottomA, bottomB };
}

/** Adjust the teaching rig's axle spacing to fit an even, closed chain. */
export function chainLoop(front: number, rear: number, pitch = 0.13, nominalDistance = 3.1) {
  const ra = pitchRadius(pitch, front),
    rb = pitchRadius(pitch, rear);
  const make = (distance: number) =>
    pulleyLoop({ x: -distance / 2, y: 0 }, { x: distance / 2, y: 0 }, ra, rb, pitch);
  const count = Math.round(make(nominalDistance).length / 2) * 2;
  let low = Math.max(ra + rb + 0.05, nominalDistance - pitch * 2),
    high = nominalDistance + pitch * 2;
  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    if (make(mid).length > count) high = mid;
    else low = mid;
  }
  const distance = (low + high) / 2;
  return { ...make(distance), count, distance, ra, rb, pitch };
}

export const printerDrive = {
  drum: { x: -0.65, y: 1.29, radius: 0.64, teeth: 64 },
  charge: { x: -1.13, y: 1.93, radius: 0.16, teeth: 16 },
  developer: { x: 0.178234, y: 1.587033, radius: 0.24, teeth: 24 },
  fuser: { x: 2.14, y: 0.94, radius: 0.28 },
  module: 0.02,
};
// Use the exact contact distance, not rounded coordinates, for the developer axis.
printerDrive.developer.x = printerDrive.drum.x + 0.88 * Math.cos(0.344);
printerDrive.developer.y = printerDrive.drum.y + 0.88 * Math.sin(0.344);

/** Shaft rotation and sheet displacement share one surface-speed coordinate. */
export function printerMotion(progress: number, selected: number) {
  const drive = printerDrive;
  const chargeBearing = Math.atan2(drive.charge.y - drive.drum.y, drive.charge.x - drive.drum.x);
  const developerBearing = Math.atan2(
    drive.developer.y - drive.drum.y,
    drive.developer.x - drive.drum.x,
  );
  const transferAngle = -Math.PI / 2,
    fuse = transferAngle - (drive.fuser.x - drive.drum.x) / drive.drum.radius;
  const angles = [
    chargeBearing,
    Math.PI / 2,
    developerBearing,
    transferAngle,
    fuse,
    fuse - 1.5,
    fuse - 2.5,
  ];
  const value = Math.max(0, Math.min(6, progress)),
    stage = Math.min(5, Math.floor(value)),
    fraction = value - stage;
  const theta = angles[stage] + (angles[stage + 1] - angles[stage]) * fraction;
  const selectedRow = Math.floor(selected / 8),
    offset = (selectedRow - 3.5) * 0.18;
  return {
    theta,
    rotation: theta - chargeBearing,
    selectedRow,
    paperX: drive.drum.x - offset + drive.drum.radius * (transferAngle - theta),
  };
}

/** Roller seats and tooth tips at the same pitch as the moving chain. */
export function sprocketOutline(teeth: number, pitch = 0.13): Point2[] {
  const r = pitchRadius(pitch, teeth),
    seat = pitch * 0.2230769231,
    tip = r + pitch * 0.2461538462,
    points: Point2[] = [];
  for (let i = 0; i < teeth; i++) {
    const angle = (i * TAU) / teeth,
      step = TAU / teeth;
    for (let j = 0; j <= 8; j++) {
      const t = angle + Math.PI * 1.5 - (Math.PI * j) / 8;
      points.push({
        x: r * Math.cos(angle) + seat * Math.cos(t),
        y: r * Math.sin(angle) + seat * Math.sin(t),
      });
    }
    for (const offset of [-0.14, 0.14]) {
      const t = angle + step * (0.5 + offset);
      points.push({ x: tip * Math.cos(t), y: tip * Math.sin(t) });
    }
  }
  return points;
}
