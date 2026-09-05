import { involuteOutline, meshedAngle, TAU, wrap, type Point2 } from './mechanisms';
/** Standard 20° gears, equal module. Three equally spaced planets satisfy assembly conditions. */
export const PLANETARY = { sun: 24, planet: 18, ring: 60, count: 3, module: 0.045 };
export type PlanetaryMode = 'ring-fixed' | 'sun-fixed' | 'carrier-fixed' | 'locked';
export function planetarySpeeds(mode: PlanetaryMode) {
  const { sun, ring, planet } = PLANETARY;
  const s = mode === 'sun-fixed' ? 0 : 1;
  const r = mode === 'ring-fixed' ? 0 : mode === 'carrier-fixed' ? -sun / ring : 1;
  const c = (sun * s + ring * r) / (sun + ring);
  const p = c - (sun / planet) * (s - c);
  return { sun: s, ring: r, carrier: c, planet: p };
}
/** One input and one output exchange ideal power; stationary reactions do no work. */
export function planetaryDrive(mode: PlanetaryMode) {
  const speeds = planetarySpeeds(mode);
  const input = mode === 'sun-fixed' ? 'ring' : 'sun';
  const output = mode === 'carrier-fixed' ? 'ring' : 'carrier';
  const ratio = speeds[input] / speeds[output];
  return {
    input,
    output,
    ratio,
    inputTorque: 1,
    outputTorque: ratio,
    inputPower: speeds[input],
    outputPower: ratio * speeds[output],
  } as const;
}
const ease = (p: number) => {
  const q = Math.max(0, Math.min(1, p));
  return q * q * (3 - 2 * q);
};
/** Every film state can be addressed directly, without advancing a simulation. */
export function planetaryShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    move = ease((p - 0.1) / 0.8);
  let mode: PlanetaryMode = 'ring-fixed',
    inputAngle = move * TAU * 2,
    assembly = 0;
  if (chapter === 0) {
    assembly = 1 - ease(p / 0.65);
    inputAngle = Math.max(0, (p - 0.7) / 0.3) * Math.PI * 1.5;
  }
  if (chapter === 2) inputAngle = move * TAU * 3.5;
  if (chapter === 3) inputAngle = move * TAU * 1.5;
  if (chapter === 4) {
    mode = 'sun-fixed';
    inputAngle = move * TAU * 1.4;
  }
  if (chapter === 5) {
    mode = 'carrier-fixed';
    inputAngle = move * TAU * 2.5;
  }
  if (chapter === 6) {
    mode = 'locked';
    inputAngle = move * TAU;
  }
  if (chapter === 7) {
    const segment = Math.min(2, Math.floor(p * 3));
    mode = (['ring-fixed', 'sun-fixed', 'carrier-fixed'] as const)[segment];
    inputAngle = ease((p * 3 - segment - 0.1) / 0.8) * TAU;
  }
  return {
    mode,
    inputAngle,
    assembly,
    showWork: chapter === 3,
    showTurns: [2, 4, 5, 7].includes(chapter),
  };
}
export function planetaryState(inputAngle: number, mode: PlanetaryMode) {
  if (!Number.isFinite(inputAngle)) throw new RangeError('Input angle must be finite.');
  const speeds = planetarySpeeds(mode),
    sun = speeds.sun * inputAngle,
    ring = speeds.ring * inputAngle,
    carrier = speeds.carrier * inputAngle;
  const radius = ((PLANETARY.sun + PLANETARY.planet) * PLANETARY.module) / 2;
  const planets = Array.from({ length: PLANETARY.count }, (_, i) => {
    const bearing = carrier + (i * TAU) / PLANETARY.count;
    return {
      x: radius * Math.cos(bearing),
      y: radius * Math.sin(bearing),
      angle: meshedAngle(sun, PLANETARY.sun, PLANETARY.planet, bearing),
      bearing,
    };
  });
  return { sun, ring, carrier, planets, speeds };
}
/** The hole boundary of an internal gear; tooth tips point inward, flanks are involutes. */
export function internalOutline(module: number, teeth: number): Point2[] {
  if (!(module > 0 && Number.isFinite(module) && Number.isInteger(teeth) && teeth >= 40))
    throw new RangeError('This unshifted internal profile requires at least forty teeth.');
  const pitch = (module * teeth) / 2,
    base = pitch * Math.cos(Math.PI / 9),
    tip = pitch - module,
    root = pitch + 1.25 * module;
  const inv = (r: number) => {
    const alpha = Math.acos(base / r);
    return Math.tan(alpha) - alpha;
  };
  const half = (r: number) => (Math.PI / (2 * teeth)) * 0.97 + inv(r) - inv(pitch);
  const points: Point2[] = [];
  const add = (r: number, a: number) => points.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
  for (let i = 0; i < teeth; i++) {
    const center = (i * TAU) / teeth;
    add(root, center - Math.PI / teeth);
    add(root, center - half(root));
    for (let j = 0; j <= 12; j++) {
      const r = root + ((tip - root) * j) / 12;
      add(r, center - half(r));
    }
    for (let j = 1; j <= 6; j++) add(tip, center - half(tip) + (2 * half(tip) * j) / 6);
    for (let j = 12; j >= 0; j--) {
      const r = root + ((tip - root) * j) / 12;
      add(r, center + half(r));
    }
    add(root, center + half(root));
    add(root, center + Math.PI / teeth);
  }
  return points;
}
export function planetaryOutlines() {
  const p = PLANETARY;
  return {
    sun: involuteOutline(p.module, p.sun),
    planet: involuteOutline(p.module, p.planet),
    ring: internalOutline(p.module, p.ring),
  };
}
/** Exact intersection of a radial line and a star-shaped polygon boundary. */
export function radialBoundary(points: Point2[]) {
  let previous = -Infinity;
  const samples = points.map((p) => {
    let angle = Math.atan2(p.y, p.x);
    while (angle < previous - 1e-8) angle += TAU;
    previous = angle;
    return { ...p, angle };
  });
  const start = samples[0].angle;
  samples.push({ ...samples[0], angle: start + TAU });
  return (value: number) => {
    const angle = start + wrap(value - start, TAU);
    let lo = 0,
      hi = samples.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].angle <= angle) lo = mid;
      else hi = mid;
    }
    const a = samples[lo],
      b = samples[hi],
      dx = b.x - a.x,
      dy = b.y - a.y;
    const denominator = Math.cos(angle) * dy - Math.sin(angle) * dx;
    if (Math.abs(denominator) < 1e-14) return Math.hypot(a.x, a.y);
    return (a.x * dy - a.y * dx) / denominator;
  };
}
