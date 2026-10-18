const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export type PlantLight = 'red' | 'far-red' | 'dark';
/** Selected phytochrome response. Photoconversion is distinct from downstream growth. */
export function phytochromeState(progress: number, light: PlantLight = 'red', initial = 0.1) {
  const p = clamp(progress),
    start = clamp(initial),
    equilibrium = light === 'red' ? 0.9 : 0.1,
    rate = light === 'dark' ? 0.2 : 4;
  const active = equilibrium + (start - equilibrium) * Math.exp(-rate * p);
  return {
    active,
    inactive: 1 - active,
    downstream: clamp((active - 0.3) / 0.55) * clamp((p - 0.2) / 0.6),
  };
}
export function vernalizationState(coldExposure: number, progress: number) {
  const memory = 1 - Math.exp(-3 * clamp(coldExposure)),
    eligible = memory > 0.7;
  return { memory, eligible, flowering: eligible ? clamp((progress - 0.35) / 0.5) : 0 };
}
/** Illustrative annual xylem geometry; seasonal patterns have multiple environmental causes. */
export function annualRingLayers(years = 3, progress = 1) {
  return Array.from({ length: Math.round(clamp(years, 1, 4)) }, (_, year) => {
    const p = year === years - 1 ? clamp(progress) : 1,
      inner = 23 + year * 30;
    return {
      year,
      inner,
      springOuter: inner + 21 * clamp(p / 0.65),
      outer: inner + 21 * clamp(p / 0.65) + 9 * clamp((p - 0.65) / 0.35),
    };
  });
}
export function statolithPositions(progress: number, gravity = true) {
  const p = gravity ? 1 - Math.exp(-5 * clamp(progress)) : 0;
  return Array.from({ length: 6 }, (_, id) => {
    const x = -65 + id * 12,
      y = -25 + (id % 2) * 15;
    return { id, x: x + (-50 + id * 20 - x) * p, y: y + (30 - y) * p };
  });
}
export function tropicGrowth(
  progress: number,
  organ: 'root' | 'shoot' = 'root',
  cap = true,
  healthy = true,
  gravity = true,
) {
  const p = clamp(progress),
    sensing = gravity ? (cap ? 1 : 0.15) : 0;
  const upper = healthy ? (organ === 'root' ? 1 : 0.6) : 0,
    lower = healthy ? (organ === 'root' ? 0.6 : 1) : 0;
  const mean = (upper + lower) / 2,
    diff = (upper - lower) * sensing;
  const upperLength = 74 + 26 * (mean + diff / 2) * p,
    lowerLength = 74 + 26 * (mean - diff / 2) * p;
  const length = (upperLength + lowerLength) / 2,
    width = 14,
    angle = (upperLength - lowerLength) / width;
  const point = (t: number, side = 0) => {
    const u = clamp(t),
      a = angle * u,
      x = Math.abs(angle) < 1e-9 ? length * u : (length * Math.sin(a)) / angle,
      y = Math.abs(angle) < 1e-9 ? 0 : (length * (1 - Math.cos(a))) / angle;
    return {
      x: x + ((side * width) / 2) * Math.sin(a),
      y: y - ((side * width) / 2) * Math.cos(a),
      angle: a,
    };
  };
  const outline = () => {
    const ts = Array.from({ length: 31 }, (_, i) => i / 30),
      pts = [
        ...ts.map((t) => point(t, 1)),
        ...ts
          .slice()
          .reverse()
          .map((t) => point(t, -1)),
      ];
    return pts.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ') + 'Z';
  };
  return {
    upperLength,
    lowerLength,
    length,
    angle,
    point,
    outline,
    cap,
    healthy,
    relativeElongation: (length - 74) / 74,
    lowerAuxin: 0.5 + 0.3 * sensing,
    upperAuxin: 0.5 - 0.3 * sensing,
  };
}
