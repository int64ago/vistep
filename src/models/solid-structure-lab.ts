/** Continuous localized heating in an infinite 2D sheet, Point-source kernel regularized by 0.5 s of diffusion.
 * Diffusivities are illustrative, in mm²/s. Strength is K mm²/s. */
export function sheetTemperature(x: number, y: number, time: number, ax = 0.4, ay = 0.4) {
  const dt = Math.max(0, time) / 80;
  let rise = 0;
  for (let i = 0; i < 80; i++) {
    const age = (i + 0.5) * dt,
      sx = 4 * ax * (age + 0.5),
      sy = 4 * ay * (age + 0.5);
    rise += ((200 * dt) / (Math.PI * Math.sqrt(sx * sy))) * Math.exp((-x * x) / sx - (y * y) / sy);
  }
  return 20 + rise;
}
export function waxContour(time: number, ax = 0.4, ay = 0.4, threshold = 50) {
  let lo = 0,
    hi = 30;
  if (sheetTemperature(0, 0, time, ax, ay) < threshold)
    return Array.from({ length: 64 }, () => ({ x: 0, y: 0 }));
  for (let k = 0; k < 22; k++) {
    const r = (lo + hi) / 2;
    if (sheetTemperature(r, 0, time, ax, ay) > threshold) lo = r;
    else hi = r;
  }
  const rx = (lo + hi) / 2,
    ry = rx * Math.sqrt(ay / ax);
  return Array.from({ length: 64 }, (_, i) => {
    const a = (i * Math.PI * 2) / 64;
    return { x: rx * Math.cos(a), y: ry * Math.sin(a) };
  });
}
export function exfoliation(round: number) {
  const n = 2 ** Math.max(0, 3 - Math.floor(Math.max(0, round)));
  return {
    before: n,
    remaining: Math.max(1, n / 2),
    removed: n > 1 ? n / 2 : 0,
    thicknessNm: n * 0.335,
  };
}
export function honeycomb() {
  const points: { x: number; y: number }[] = [],
    edges: [number, number][] = [];
  const map = new Map<string, number>(),
    seen = new Set<string>();
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 6; col++) {
      const ids = Array.from({ length: 6 }, (_, k) => {
        const a = (k * Math.PI) / 3,
          x = col * 1.5 + Math.cos(a),
          y = (row + (col % 2) / 2) * Math.sqrt(3) + Math.sin(a),
          key = `${x.toFixed(5)},${y.toFixed(5)}`;
        let j = map.get(key);
        if (j === undefined) {
          j = points.length;
          map.set(key, j);
          points.push({ x, y });
        }
        return j;
      });
      ids.forEach((a, i) => {
        const b = ids[(i + 1) % 6],
          key = [a, b].sort((x, y) => x - y).join(':');
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([a, b]);
        }
      });
    }
  return { points, edges };
}
