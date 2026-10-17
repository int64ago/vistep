export const LIDAR_C = 299792458;
export type Vec2 = { x: number; y: number };
export type LidarHit = {
  point: Vec2;
  range: number;
  normal: Vec2;
  id: 'wall' | 'partition' | 'cylinder';
  strength: number;
};
export type LidarInput = { step: number; angle: number; jitter: number; threshold: number };
export const LIDAR_DEFAULT: LidarInput = {
  step: 3,
  angle: Math.atan2(1, 2),
  jitter: 0,
  threshold: 0,
};
export const LIDAR_ROOM = { minX: -6, maxX: 6, minY: -4, maxY: 4 };
export const LIDAR_CYLINDER = { x: 2, y: 1, radius: 0.7 };
export const LIDAR_PARTITION = [
  { x: -2, y: -2.8 },
  { x: -2, y: 1.5 },
] as const;
const cross = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x;
function finite(...v: number[]) {
  if (!v.every(Number.isFinite)) throw new RangeError('Finite lidar quantities required');
}
export function lidarPolar(range: number, angle: number) {
  finite(range, angle);
  if (range < 0) throw new RangeError('Nonnegative lidar range required');
  return { x: range * Math.cos(angle), y: range * Math.sin(angle) };
}
export function lidarDelay(range: number) {
  finite(range);
  if (range < 0) throw new RangeError('Nonnegative lidar range required');
  return (2 * range) / LIDAR_C;
}
export function lidarRay(angle: number, onlyWalls = false): LidarHit {
  finite(angle);
  const dir = lidarPolar(1, angle),
    candidates: { range: number; normal: Vec2; id: LidarHit['id']; reflectivity: number }[] = [];
  const wall = (a: Vec2, b: Vec2, id: LidarHit['id'], reflectivity: number) => {
    const v = { x: b.x - a.x, y: b.y - a.y },
      den = cross(dir, v);
    if (Math.abs(den) < 1e-12) return;
    const distance = cross(a, v) / den,
      u = cross(a, dir) / den;
    if (distance > 1e-9 && u >= -1e-10 && u <= 1 + 1e-10) {
      let normal = { x: -v.y / Math.hypot(v.x, v.y), y: v.x / Math.hypot(v.x, v.y) };
      if (normal.x * dir.x + normal.y * dir.y > 0) normal = { x: -normal.x, y: -normal.y };
      candidates.push({ range: distance, normal, id, reflectivity });
    }
  };
  wall({ x: -6, y: -4 }, { x: 6, y: -4 }, 'wall', 0.65);
  wall({ x: 6, y: -4 }, { x: 6, y: 4 }, 'wall', 0.65);
  wall({ x: 6, y: 4 }, { x: -6, y: 4 }, 'wall', 0.65);
  wall({ x: -6, y: 4 }, { x: -6, y: -4 }, 'wall', 0.65);
  if (!onlyWalls) {
    wall(LIDAR_PARTITION[0], LIDAR_PARTITION[1], 'partition', 0.4);
    const obj = LIDAR_CYLINDER,
      dot = dir.x * obj.x + dir.y * obj.y,
      disc = dot * dot - (obj.x * obj.x + obj.y * obj.y - obj.radius * obj.radius);
    if (disc >= 0) {
      const r = dot - Math.sqrt(disc);
      if (r > 0) {
        const p = lidarPolar(r, angle);
        candidates.push({
          range: r,
          normal: { x: (p.x - obj.x) / obj.radius, y: (p.y - obj.y) / obj.radius },
          id: 'cylinder',
          reflectivity: 0.03,
        });
      }
    }
  }
  candidates.sort((a, b) => a.range - b.range);
  const h = candidates[0],
    incidence = Math.max(0, -h.normal.x * dir.x - h.normal.y * dir.y);
  return {
    point: lidarPolar(h.range, angle),
    range: h.range,
    normal: h.normal,
    id: h.id,
    strength: (h.reflectivity * incidence) / (h.range * h.range),
  };
}
const fraction = (v: number) => v - Math.floor(v);
export function lidarNoise(index: number) {
  const a = Math.max(1e-8, fraction(Math.sin(index * 12.9898 + 78.233) * 43758.5453)),
    b = fraction(Math.sin(index * 37.719 + 14.15) * 12345.6789);
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
}
export function lidarScan(s: LidarInput, progress = 1) {
  finite(s.step, s.angle, s.jitter, s.threshold, progress);
  if (
    s.step < 0.5 ||
    s.step > 20 ||
    s.jitter < 0 ||
    s.jitter > 3 ||
    s.threshold < 0 ||
    s.threshold > 0.1
  )
    throw new RangeError('Lidar outside teaching limits');
  const count = Math.ceil(360 / s.step);
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * s.step * Math.PI) / 180,
      hit = lidarRay(angle),
      noise = (lidarNoise(i) * s.jitter * 1e-9 * LIDAR_C) / 2,
      range = Math.max(0.01, hit.range + noise);
    return {
      i,
      angle,
      hit,
      range,
      point: lidarPolar(range, angle),
      detected: hit.strength >= s.threshold,
    };
  }).filter((p) => p.angle <= 2 * Math.PI * Math.max(0, Math.min(1, progress)));
}
export function lidarShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress)),
    e = p * p * (3 - 2 * p),
    input = { ...LIDAR_DEFAULT };
  let scan = 1,
    pulse = 1;
  if (c === 0) pulse = e;
  if (c === 1) pulse = 1 - e;
  if (c === 3) {
    scan = e;
    input.angle = 2 * Math.PI * e;
  }
  if (c === 4) input.step = 8 - 6.5 * e;
  if (c === 5) input.angle = 0.2 + 0.5 * e;
  if (c === 6) {
    input.step = 2;
    input.jitter = 2 * e;
  }
  if (c === 7) {
    input.step = 2;
    input.threshold = 0.025 * e;
  }
  return { input, scan, pulse, view: c };
}
