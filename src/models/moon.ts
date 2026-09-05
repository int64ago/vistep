/** Circular-orbit teaching geometry, kilometres and days. Not an ephemeris.
 * Coordinates are inertial ecliptic XYZ; Z is north. Renderers must preserve this frame.
 */
export type V3 = { x: number; y: number; z: number };
export const LUNAR = {
  earthRadius: 6371,
  moonRadius: 1737.4,
  moonDistance: 384400,
  sunRadius: 695700,
  sunDistance: 149597870.7,
  siderealDays: 27.321661,
  yearDays: 365.25636,
  inclination: 5.145,
};
export const SYNODIC_DAYS = 1 / (1 / LUNAR.siderealDays - 1 / LUNAR.yearDays);
const TAU = Math.PI * 2;
export const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross3 = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const unit3 = (a: V3): V3 => {
  const length = Math.hypot(a.x, a.y, a.z);
  if (!length) throw new RangeError('Cannot normalize a zero vector.');
  return { x: a.x / length, y: a.y / length, z: a.z / length };
};
const scaled = (a: V3, s: number): V3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const clamp = (x: number) => Math.max(-1, Math.min(1, x));
const wrap = (x: number) => ((x % TAU) + TAU) % TAU;
/** Exact overlap of two coplanar disks, used for the orthographic umbra illustration. */
export function diskOverlap(r: number, R: number, d: number) {
  if (![r, R, d].every(Number.isFinite) || r < 0 || R < 0 || d < 0)
    throw new RangeError('Non-negative finite disk dimensions required.');
  if (d >= r + R || !r || !R) return 0;
  if (d <= Math.abs(R - r)) return Math.PI * Math.min(r, R) ** 2;
  return (
    r * r * Math.acos(clamp((d * d + r * r - R * R) / (2 * d * r))) +
    R * R * Math.acos(clamp((d * d + R * R - r * r) / (2 * d * R))) -
    0.5 * Math.sqrt(Math.max(0, (-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R)))
  );
}
export function lunarState(days: number, inclination = LUNAR.inclination, nodeDegrees = 90) {
  if (
    ![days, inclination, nodeDegrees].every(Number.isFinite) ||
    Math.abs(days) > 36525 ||
    inclination < 0 ||
    inclination > 15
  )
    throw new RangeError('Unsupported lunar teaching geometry.');
  const earthAngle = (TAU * days) / LUNAR.yearDays,
    moonAngle = (TAU * days) / LUNAR.siderealDays,
    node = (nodeDegrees * Math.PI) / 180,
    tilt = (inclination * Math.PI) / 180,
    u = moonAngle - node;
  const moonDirection: V3 = {
      x: Math.cos(node) * Math.cos(u) - Math.sin(node) * Math.sin(u) * Math.cos(tilt),
      y: Math.sin(node) * Math.cos(u) + Math.cos(node) * Math.sin(u) * Math.cos(tilt),
      z: Math.sin(u) * Math.sin(tilt),
    },
    sunDirection: V3 = { x: Math.cos(earthAngle), y: Math.sin(earthAngle), z: 0 },
    orbitNormal: V3 = {
      x: Math.sin(node) * Math.sin(tilt),
      y: -Math.cos(node) * Math.sin(tilt),
      z: Math.cos(tilt),
    },
    view = scaled(moonDirection, -1),
    right = unit3(cross3({ x: 0, y: 0, z: 1 }, view)),
    up = unit3(cross3(view, right));
  const phaseCosine = clamp(dot3(sunDirection, view)),
    illuminated = (1 + phaseCosine) / 2,
    longitude = wrap(Math.atan2(moonDirection.y, moonDirection.x) - earthAngle),
    position = scaled(moonDirection, LUNAR.moonDistance),
    shadowAlong = -dot3(position, sunDirection),
    shadowOffset = Math.sqrt(Math.max(0, LUNAR.moonDistance ** 2 - shadowAlong ** 2)),
    umbraRadius = Math.max(
      0,
      LUNAR.earthRadius - (shadowAlong * (LUNAR.sunRadius - LUNAR.earthRadius)) / LUNAR.sunDistance,
    ),
    penumbraRadius =
      LUNAR.earthRadius + (shadowAlong * (LUNAR.sunRadius + LUNAR.earthRadius)) / LUNAR.sunDistance,
    umbraFraction =
      shadowAlong > 0
        ? diskOverlap(LUNAR.moonRadius, umbraRadius, shadowOffset) /
          (Math.PI * LUNAR.moonRadius ** 2)
        : 0;
  return {
    days,
    inclination,
    nodeDegrees,
    earthAngle,
    moonAngle,
    moonDirection,
    position,
    sunDirection,
    orbitNormal,
    view,
    right,
    up,
    phaseCosine,
    illuminated,
    longitude,
    sunOnDisk: { x: dot3(sunDirection, right), y: dot3(sunDirection, up), z: phaseCosine },
    // This label convention partitions the cycle into eight named sectors; exact quarters remain explicit.
    phaseIndex: Math.floor((longitude + Math.PI / 8) / (Math.PI / 4)) % 8,
    shadowAlong,
    shadowOffset,
    umbraRadius,
    penumbraRadius,
    umbraFraction,
    inPenumbra: shadowAlong > 0 && shadowOffset < LUNAR.moonRadius + penumbraRadius,
    lockedFront: view,
    lockedUp: orbitNormal,
    lockedRight: unit3(cross3(orbitNormal, view)),
  };
}
export type LunarState = ReturnType<typeof lunarState>;
/** Observer-image normal dotted with the same solar direction used by the orbital view. */
export function moonDiskLight(x: number, y: number, state: LunarState) {
  const r2 = x * x + y * y;
  if (r2 > 1) return null;
  return (
    x * state.sunOnDisk.x +
    y * state.sunOnDisk.y +
    Math.sqrt(Math.max(0, 1 - r2)) * state.sunOnDisk.z
  );
}
export function lunarMonths(days: number) {
  if (!Number.isFinite(days)) throw new RangeError('Days must be finite.');
  return {
    siderealTurns: days / LUNAR.siderealDays,
    earthTurns: days / LUNAR.yearDays,
    synodicTurns: days / SYNODIC_DAYS,
  };
}
/** Filled lit portion of an orthographic unit sphere, with sunlight projected to screen right.
 * Rotate by the projected light azimuth; SVG y points down. No shadowing is included here.
 */
export function phaseDiskPath(cosine: number, radius = 1) {
  const c = clamp(cosine),
    points: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / 96;
    points.push(`${-c * Math.cos(a) * radius},${Math.sin(a) * radius}`);
  }
  for (let i = 96; i >= 0; i--) {
    const a = -Math.PI / 2 + (Math.PI * i) / 96;
    points.push(`${Math.cos(a) * radius},${Math.sin(a) * radius}`);
  }
  return `M${points.join('L')}Z`;
}
export function lunarShadowOnDisk(s: LunarState) {
  const center = {
    x: -s.sunDirection.x * s.shadowAlong - s.position.x,
    y: -s.sunDirection.y * s.shadowAlong - s.position.y,
    z: -s.sunDirection.z * s.shadowAlong - s.position.z,
  };
  const projectedX = dot3(center, s.right),
    projectedY = dot3(center, s.up);
  const projectedLength = Math.hypot(projectedX, projectedY);
  // Show the same circular transverse section used by the overlap calculation.
  // Preserve its angular direction on the portrait, without foreshortening its offset a second time.
  const scale = projectedLength > 1e-8 ? s.shadowOffset / projectedLength / LUNAR.moonRadius : 0;
  return {
    x: projectedX * scale,
    y: projectedY * scale,
    radius: s.umbraRadius / LUNAR.moonRadius,
    enabled: s.shadowAlong > 0 && s.umbraFraction > 0,
  };
}
const ease = (p: number) => {
  const x = Math.max(0, Math.min(1, p));
  return x * x * (3 - 2 * x);
};
/** One deterministic state for every film position; no hidden orbital integrator. */
export function moonShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  let days = SYNODIC_DAYS * (0.08 + 0.42 * ease(p)),
    inclination = LUNAR.inclination,
    node = 90;
  let view: 'portrait' | 'orbit' | 'shadow' | 'spin' | 'months' = 'portrait';
  if (chapter === 1) {
    days = SYNODIC_DAYS * (0.125 + 0.125 * ease(p));
    view = 'orbit';
  }
  if (chapter === 2) {
    days = SYNODIC_DAYS * ease(p);
    view = 'orbit';
  }
  if (chapter === 3) {
    days = SYNODIC_DAYS * ease(p);
  }
  if (chapter === 4) {
    days = SYNODIC_DAYS / 2;
    inclination = LUNAR.inclination;
    node = 90 + ((((TAU * days) / LUNAR.yearDays) * 180) / Math.PI - 90) * ease((p - 0.25) / 0.6);
    view = 'shadow';
  }
  if (chapter === 5) {
    days = LUNAR.siderealDays * ease(p);
    view = 'spin';
  }
  if (chapter === 6) {
    days = SYNODIC_DAYS * ease(p);
    inclination = 0;
    view = 'months';
  }
  if (chapter === 7) {
    days = SYNODIC_DAYS * ease(p);
  }
  return {
    state: lunarState(days, inclination, node),
    view,
    months: lunarMonths(days),
    rotationFraction: chapter === 5 ? ease(p) : 1,
    day: days,
  };
}
