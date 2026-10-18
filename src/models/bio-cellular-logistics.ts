export type Point3 = { x: number; y: number; z: number };
export type CargoCompartment = 'er' | 'golgi' | 'vesicle' | 'outside';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const mix = (a: Point3, b: Point3, p: number): Point3 => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  z: a.z + (b.z - a.z) * p,
});
export const CELL_RX = 143,
  CELL_RY = 108 / 0.88,
  VESICLE_RADIUS = 7;
export function erLumen(lane: number, u: number): Point3 {
  const p = clamp(u);
  return { x: -100 + 75 * p, y: -32 + lane * 14 - 36 * p * (1 - p), z: -5 + 10 * p };
}
export function golgiLumen(lane: number, u: number): Point3 {
  const p = clamp(u);
  return { x: 35 + lane * 4 + 80 * p * (1 - p), y: -32 + 64 * p, z: 3 };
}
export function membranePoint(theta: number): Point3 {
  return { x: CELL_RX * Math.cos(theta), y: CELL_RY * Math.sin(theta), z: 0 };
}
export function membraneMetric(p: Point3) {
  return (p.x / CELL_RX) ** 2 + (p.y / CELL_RY) ** 2;
}
export function fusionPort(group: number) {
  const theta = -0.35 + group * 0.25,
    boundary = membranePoint(theta),
    nx = boundary.x / CELL_RX ** 2,
    ny = boundary.y / CELL_RY ** 2,
    n = Math.hypot(nx, ny),
    normal = { x: nx / n, y: ny / n, z: 0 },
    tangent = { x: -ny / n, y: nx / n, z: 0 };
  return { theta, boundary, normal, tangent };
}
function shifted(a: Point3, b: Point3, k: number): Point3 {
  return { x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k };
}
export function groupTime(group: number, minutes: number) {
  return Math.max(0, minutes - group * 0.2);
}
export function transportCenter(group: number, minutes: number): Point3 {
  const time = groupTime(group, minutes),
    entry = golgiLumen(group, 0.15),
    exit = golgiLumen(group, 0.94),
    port = fusionPort(group),
    dock = shifted(port.boundary, port.normal, -VESICLE_RADIUS);
  if (time < 8) return erLumen(group, 1);
  if (time < 14) {
    const p = (time - 8) / 6,
      q = mix(erLumen(group, 1), entry, p);
    return { ...q, y: q.y - 18 * Math.sin(Math.PI * p) };
  }
  if (time < 35) return golgiLumen(group, 0.15 + (0.79 * (time - 14)) / 21);
  if (time < 108) {
    const p = (time - 35) / 73,
      q = mix(exit, dock, p);
    return { ...q, y: q.y - 15 * Math.sin(Math.PI * p) };
  }
  return shifted(port.boundary, port.normal, -VESICLE_RADIUS * (1 - clamp((time - 108) / 6)));
}
/** Circle/ellipse intersections define both the opening and the retained vesicle membrane. */
export function fusionGeometry(group: number, minutes: number) {
  const time = groupTime(group, minutes),
    port = fusionPort(group),
    progress = clamp((time - 108) / 6),
    center = transportCenter(group, minutes),
    active = time > 108;
  if (!active)
    return {
      group,
      active,
      progress,
      center,
      low: port.theta,
      high: port.theta,
      arc: [] as Point3[],
    };
  const distance = (theta: number) => {
    const p = membranePoint(theta);
    return Math.hypot(p.x - center.x, p.y - center.y) - VESICLE_RADIUS;
  };
  const root = (sign: number) => {
    let inner = port.theta,
      outer = port.theta + sign * 0.25;
    for (let i = 0; i < 55; i++) {
      const mid = (inner + outer) / 2;
      if (distance(mid) > 0) outer = mid;
      else inner = mid;
    }
    return (inner + outer) / 2;
  };
  const low = root(-1),
    high = root(1),
    a = membranePoint(low),
    b = membranePoint(high),
    start = Math.atan2(a.y - center.y, a.x - center.x),
    end = Math.atan2(b.y - center.y, b.x - center.x);
  let delta = end - start;
  while (delta > 0) delta -= 2 * Math.PI;
  while (delta < -2 * Math.PI) delta += 2 * Math.PI;
  const relax = clamp((time - 114) / 6),
    arc = Array.from({ length: 65 }, (_, i) => {
      const p = i / 64,
        angle = start + delta * p,
        circle = {
          x: center.x + VESICLE_RADIUS * Math.cos(angle),
          y: center.y + VESICLE_RADIUS * Math.sin(angle),
          z: 0,
        };
      return mix(circle, membranePoint(low + (high - low) * p), relax);
    });
  return { group, active, progress, center, low, high, arc };
}
export function membraneSegments(minutes: number) {
  const gaps = Array.from({ length: 4 }, (_, g) => fusionGeometry(g, minutes)).filter(
      (g) => g.active,
    ),
    segments: Point3[][] = [];
  let start = -Math.PI;
  for (const gap of gaps) {
    segments.push(sampleMembrane(start, gap.low));
    start = gap.high;
  }
  segments.push(sampleMembrane(start, Math.PI));
  return segments;
}
function sampleMembrane(start: number, end: number) {
  const n = Math.max(2, Math.ceil((end - start) * 80));
  return Array.from({ length: n + 1 }, (_, i) => membranePoint(start + ((end - start) * i) / n));
}
export function secretoryCargo(id: number, minutes: number) {
  const group = Math.floor(id / 6),
    member = id % 6,
    time = groupTime(group, minutes),
    port = fusionPort(group);
  let q: Point3,
    compartment: CargoCompartment = 'er',
    vesicle = false;
  if (time < 8)
    q = erLumen(group, 0.2 + member * 0.1 + (1 - (0.2 + member * 0.1)) * clamp(time / 8));
  else if (time < 14) {
    q = shifted(
      transportCenter(group, minutes),
      port.tangent,
      (member - 2.5) * Math.sin((Math.PI * (time - 8)) / 6),
    );
    compartment = 'vesicle';
    vesicle = true;
  } else if (time < 35) {
    const p = (time - 14) / 21;
    q = golgiLumen(group, 0.15 + 0.79 * p + (member - 2.5) * 0.025 * Math.sin(Math.PI * p));
    compartment = 'golgi';
  } else if (time < 108) {
    const p = (time - 35) / 73;
    q = shifted(transportCenter(group, minutes), port.tangent, (member - 2.5) * Math.min(1, p * 8));
    compartment = 'vesicle';
    vesicle = true;
  } else {
    const p = clamp((time - 108) / 6);
    q = shifted(shifted(port.boundary, port.normal, -7 + 30 * p), port.tangent, member - 2.5);
    compartment = membraneMetric(q) > 1 ? 'outside' : 'vesicle';
    vesicle = compartment === 'vesicle';
  }
  return { id, ...q, compartment, vesicle, group };
}
export function secretoryPopulation(minutes: number) {
  const cargo = Array.from({ length: 24 }, (_, i) => secretoryCargo(i, minutes));
  return {
    cargo,
    counts: cargo.reduce(
      (a, c) => {
        a[c.compartment]++;
        return a;
      },
      { er: 0, golgi: 0, vesicle: 0, outside: 0 },
    ),
  };
}
export function cellProjection(x: number, y: number, z: number, angle: number) {
  const a = (angle * Math.PI) / 180;
  return {
    x: x * Math.cos(a) + z * Math.sin(a),
    y: y * 0.88 - (z * Math.cos(a) - x * Math.sin(a)) * 0.25,
    depth: z * Math.cos(a) - x * Math.sin(a),
  };
}
export const organelleStructure = [
  { id: 'nucleus', x: -62, y: 45, z: 0, r: 32 },
  { id: 'golgi', x: 40, y: 0, z: 3, r: 27 },
  { id: 'mitochondrion', x: 15, y: 65, z: 15, r: 16 },
] as const;
