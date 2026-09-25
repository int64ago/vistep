import { CH, CH_DEFAULT, chCellColors, chField, chLayout, chSimulate } from './cell-handover';

/** The same identity colours as the scene. */
const palette = ['#f2a383', '#8cc4ea', '#b1d895', '#c7abf0', '#eed17f', '#86d8c9'];

/** Ramer–Douglas–Peucker simplification of an open polyline. */
function simplify(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length < 3) return points;
  const [ax, ay] = points[0],
    [bx, by] = points[points.length - 1];
  const len = Math.hypot(bx - ax, by - ay) || 1;
  let worst = 0,
    index = 0;
  for (let k = 1; k < points.length - 1; k++) {
    const [px, py] = points[k];
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
    if (d > worst) {
      worst = d;
      index = k;
    }
  }
  if (worst <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

/** One corner-cutting pass that keeps both ends, softening raster stair-steps. */
function chaikin(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;
  const out: [number, number][] = [points[0]];
  for (let k = 0; k < points.length - 1; k++) {
    const [ax, ay] = points[k],
      [bx, by] = points[k + 1];
    out.push(
      [0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by],
      [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by],
    );
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * Cover artwork from the scene's model: the shadowed best-server boundaries (traced from the
 * field raster and simplified), the sites, and the street coloured by the cells that served the
 * phone in the film's run.
 */
export function cellHandoverCover(width = 400, height = 230) {
  const view = { x: 150, y: 150, w: 1700 };
  const scale = width / view.w,
    viewH = height / scale;
  const P = (x: number, y: number): [number, number] => [
    (x - view.x) * scale,
    (y - view.y) * scale,
  ];
  const layout = chLayout(),
    colors = chCellColors(layout);
  const step = 6;
  const field = chField(layout, CH.shadowSigmaDb, step, {
    x: view.x,
    y: view.y,
    w: view.w,
    h: viewH,
  });
  const { cols, rows, best } = field;
  // Boundary edges between raster cells, joined into chains at shared grid corners.
  const key = (i: number, j: number) => j * (cols + 1) + i;
  const adjacency = new Map<number, number[]>();
  const link = (a: number, b: number) => {
    adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
    adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
  };
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const c = best[j * cols + i];
      if (i + 1 < cols && best[j * cols + i + 1] !== c) link(key(i + 1, j), key(i + 1, j + 1));
      if (j + 1 < rows && best[(j + 1) * cols + i] !== c) link(key(i, j + 1), key(i + 1, j + 1));
    }
  const used = new Set<string>();
  const edgeId = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const chains: [number, number][][] = [];
  const corner = (k: number): [number, number] =>
    P(view.x + (k % (cols + 1)) * step, view.y + Math.floor(k / (cols + 1)) * step);
  for (const [start, ends] of adjacency)
    for (const first of ends) {
      if (used.has(edgeId(start, first))) continue;
      const chain = [start, first];
      used.add(edgeId(start, first));
      let prev = start,
        cur = first;
      for (;;) {
        const next = (adjacency.get(cur) ?? []).find(
          (n) => n !== prev && !used.has(edgeId(cur, n)),
        );
        if (next === undefined || (adjacency.get(cur) ?? []).length > 2) break;
        used.add(edgeId(cur, next));
        chain.push(next);
        prev = cur;
        cur = next;
      }
      chains.push(chaikin(simplify(chain.map(corner), 1.3)));
    }
  const boundaries = chains
    .filter((c) => c.length > 1)
    .map((c) => c.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(''))
    .join('');

  const run = chSimulate(CH_DEFAULT);
  const trail: { d: string; color: string }[] = [];
  for (let i = 0; i < run.count; i += 12) {
    const p = run.route.at(i * run.speed * run.dt),
      [x, y] = P(p.x, p.y);
    const color = palette[colors[run.serving[i]] ?? 0];
    const cur = trail[trail.length - 1];
    const pt = `${x.toFixed(1)},${y.toFixed(1)}`;
    if (cur && cur.color === color) cur.d += `L${pt}`;
    else {
      if (cur) cur.d += `L${pt}`;
      trail.push({ d: `M${pt}`, color });
    }
  }
  const phoneAt = run.route.at(0.62 * run.route.length);
  const sites = layout.sites
    .map((s) => ({
      at: P(s.x, s.y),
      petals: [0, 1, 2].map((k) => palette[colors[s.id * 3 + k]]),
    }))
    .filter(({ at: [x, y] }) => x > -20 && y > -20 && x < width + 20 && y < height + 20);
  return {
    boundaries,
    trail,
    sites,
    phone: { at: P(phoneAt.x, phoneAt.y), heading: (phoneAt.heading * 180) / Math.PI },
  };
}
