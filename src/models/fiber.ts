/** Meridional geometrical optics in a straight, step-index, lossless fiber. */
export const LIGHT_SPEED = 299792458;
export const FIBER = { core: 1.48, cladding: 1.46, outside: 1, radius: 25, length: 1200 };
export type RayPoint = { x: number; y: number };
export type FiberSegment = {
  a: RayPoint;
  b: RayPoint;
  power: number;
  escaped: boolean;
  start: number;
  end: number;
};
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const radians = (deg: number) => (deg * Math.PI) / 180;
export function criticalAngle(n1: number, n2: number) {
  validateIndex(n1);
  validateIndex(n2);
  return n1 > n2 ? Math.asin(n2 / n1) : null;
}
function validateIndex(n: number) {
  if (!Number.isFinite(n) || n < 1)
    throw new RangeError('Refractive index must be finite and at least one.');
}
/** Unpolarized intensity reflectance; angles are measured from the interface normal. */
export function dielectric(n1: number, n2: number, incidence: number) {
  validateIndex(n1);
  validateIndex(n2);
  if (!Number.isFinite(incidence) || incidence < 0 || incidence >= Math.PI / 2)
    throw new RangeError('Incidence must lie in [0, pi/2).');
  if (n1 === n2) return { transmitted: incidence, reflectance: 0, transmittance: 1, tir: false };
  const sinT = (n1 / n2) * Math.sin(incidence);
  if (sinT >= 1) return { transmitted: null, reflectance: 1, transmittance: 0, tir: true };
  const cosI = Math.cos(incidence),
    cosT = Math.sqrt(1 - sinT * sinT);
  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  const rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);
  const reflectance = (rs * rs + rp * rp) / 2;
  return { transmitted: Math.asin(sinT), reflectance, transmittance: 1 - reflectance, tir: false };
}
export function acceptance(core = FIBER.core, cladding = FIBER.cladding, outside = FIBER.outside) {
  [core, cladding, outside].forEach(validateIndex);
  const na = Math.sqrt(Math.max(0, core * core - cladding * cladding));
  return { na, angle: Math.asin(Math.min(1, na / outside)) };
}
/** Coordinates are micrometers; powers are normalized just inside the entrance face. */
export function traceFiber(
  externalDegrees: number,
  cladding = FIBER.cladding,
  length = FIBER.length,
) {
  if (
    !Number.isFinite(externalDegrees) ||
    Math.abs(externalDegrees) >= 89 ||
    !Number.isFinite(length) ||
    length <= 0 ||
    length > 10000
  )
    throw new RangeError('Invalid entrance angle or diagram length.');
  validateIndex(cladding);
  const inside = Math.asin((FIBER.outside / FIBER.core) * Math.sin(radians(externalDegrees)));
  const incidence = Math.PI / 2 - Math.abs(inside);
  const boundary = Math.abs(inside) < 1e-12 ? null : dielectric(FIBER.core, cladding, incidence);
  const segments: FiberSegment[] = [],
    hits: (RayPoint & { power: number; tir: boolean })[] = [];
  let at: RayPoint = { x: 0, y: 0 },
    dy = Math.sin(inside),
    power = 1,
    travel = 0,
    escapedPower = 0;
  const dx = Math.cos(inside);
  for (let i = 0; i < 256; i++) {
    const side = dy >= 0 ? 1 : -1;
    const wall = Math.abs(dy) < 1e-12 ? Infinity : (side * FIBER.radius - at.y) / dy;
    const end = (length - at.x) / dx;
    const distance = Math.min(wall, end);
    const b = { x: at.x + dx * distance, y: at.y + dy * distance };
    segments.push({ a: at, b, power, escaped: false, start: travel, end: travel + distance });
    travel += distance;
    if (end <= wall + 1e-9 || !boundary) break;
    hits.push({ ...b, power, tir: boundary.tir });
    if (!boundary.tir && boundary.transmitted !== null) {
      const lost = power * boundary.transmittance,
        tail = 100;
      segments.push({
        a: b,
        b: {
          x: b.x + Math.sin(boundary.transmitted) * tail,
          y: b.y + side * Math.cos(boundary.transmitted) * tail,
        },
        power: lost,
        escaped: true,
        start: travel,
        end: travel + tail,
      });
      escapedPower += lost;
    }
    power *= boundary.reflectance;
    at = b;
    dy = -dy;
  }
  return {
    segments,
    hits,
    inside,
    incidence,
    transmittedPower: power,
    escapedPower,
    distance: length / dx,
    tir: boundary?.tir ?? true,
  };
}
/** Step-index meridional travel time; neglects wavelength and material dispersion. */
export function flightTime(lengthMeters: number, internalDegrees: number, core = FIBER.core) {
  validateIndex(core);
  if (
    !Number.isFinite(lengthMeters) ||
    lengthMeters < 0 ||
    !Number.isFinite(internalDegrees) ||
    Math.abs(internalDegrees) >= 89
  )
    throw new RangeError('Invalid optical path.');
  return (lengthMeters * core) / (LIGHT_SPEED * Math.cos(radians(internalDegrees)));
}
export function pulse(t: number, center: number, width: number) {
  return Math.exp(-0.5 * ((t - center) / width) ** 2);
}
export const FIBER_BITS = [1, 0, 1, 1, 0, 0, 1, 0];
export function bitSignal(time: number, delay = 0) {
  const i = Math.floor(time - delay);
  return i >= 0 && i < FIBER_BITS.length ? FIBER_BITS[i] : 0;
}
const ease = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
export function fiberShot(chapter: number, progress: number) {
  const p = clamp(progress),
    q = ease((p - 0.12) / 0.72);
  let angle = 9,
    cladding = FIBER.cladding,
    interfaceAngle = 30,
    medium: 'fiber' | 'interface' | 'pulse' = 'fiber';
  if (chapter === 1) {
    medium = 'interface';
    interfaceAngle = 20 + q * 15;
  }
  if (chapter === 2) {
    medium = 'interface';
    interfaceAngle = 35 + q * 20;
  }
  if (chapter === 4) angle = 5 + q * 23;
  if (chapter === 5) cladding = 1.46 + q * 0.02;
  if (chapter === 6) medium = 'pulse';
  if (chapter === 7) angle = 9;
  return {
    angle,
    cladding,
    interfaceAngle,
    medium,
    progress: p,
    packetTime: p * 12,
    layerReveal: chapter === 0 ? ease(p / 0.6) : 1,
  };
}
