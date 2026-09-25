import { arrayFactor, constellation, occupiedMHz, rbGroups, receive } from './mobile-5g';

export type CoverShape = {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  opacity?: number;
};

/**
 * Catalog artwork (400 × 230) from the scene model: a computed 16-element array factor steered
 * 30° toward a phone, above one 20 MHz LTE carrier and one 100 MHz NR carrier drawn on a common
 * frequency axis with their real resource-block group boundaries.
 */
export function mobile5gCover() {
  const shapes: CoverShape[] = [];
  const f = (v: number) => v.toFixed(1);
  // frequency axis 0–100 MHz
  const x0 = 26,
    x1 = 300;
  const X = (mhz: number) => x0 + (mhz / 100) * (x1 - x0);
  // beam
  const ax = 112,
    ay = 126,
    R = 92,
    steer = 30,
    elements = 8;
  let lobe = '';
  for (let a = -90; a <= 90; a += 1) {
    const g = arrayFactor(elements, steer, a);
    const r = R * g;
    const rad = (a * Math.PI) / 180;
    lobe += `${a === -90 ? 'M' : 'L'}${f(ax + r * Math.sin(rad))},${f(ay - r * Math.cos(rad))}`;
  }
  shapes.push({ d: lobe + 'Z', fill: '#b4a8f6', opacity: 0.22 });
  shapes.push({ d: lobe, stroke: '#f4bd6c', width: 1.6 });
  // wavefront arcs where the computed pattern is within 3 dB of the main lobe
  const inside: number[] = [];
  for (let a = -90; a <= 90; a += 0.5)
    if (arrayFactor(elements, steer, a) >= Math.SQRT1_2) inside.push(a);
  const lo = (Math.min(...inside) * Math.PI) / 180,
    hi = (Math.max(...inside) * Math.PI) / 180;
  for (let k = 1; k <= 5; k++) {
    const r = (R * k) / 5.6;
    shapes.push({
      d: `M${f(ax + r * Math.sin(lo))},${f(ay - r * Math.cos(lo))}A${f(r)},${f(r)} 0 0,1 ${f(ax + r * Math.sin(hi))},${f(ay - r * Math.cos(hi))}`,
      stroke: '#ebe9f5',
      width: 1.2,
      opacity: 0.25 + 0.1 * k,
    });
  }
  for (let n = 0; n < elements; n++)
    shapes.push({
      d: `M${f(ax - 17.5 + n * 5)},${ay + 3}v7`,
      stroke: '#ebe9f5',
      width: 2,
    });
  const tr = (steer * Math.PI) / 180,
    px = ax + (R + 14) * Math.sin(tr),
    py = ay - (R + 14) * Math.cos(tr);
  const c = Math.cos(tr),
    s = Math.sin(tr);
  const corner = (u: number, v: number) => `${f(px + u * c - v * s)},${f(py + u * s + v * c)}`;
  shapes.push({
    d: `M${corner(-7, -12)}L${corner(7, -12)}L${corner(7, 12)}L${corner(-7, 12)}Z`,
    fill: '#1d2034',
    stroke: '#f4bd6c',
    width: 1.6,
  });
  // LTE 20 MHz carrier: 100 RB in groups of 4
  const lteY = 150,
    lteH = 18,
    nrY = 178,
    nrH = 34;
  const lteOcc = occupiedMHz(100, 15);
  shapes.push({
    d: `M${f(X(1))},${lteY}H${f(X(1 + lteOcc))}V${lteY + lteH}H${f(X(1))}Z`,
    fill: '#8ccabf',
    opacity: 0.45,
  });
  for (const g of rbGroups(100, 4).slice(1))
    shapes.push({
      d: `M${f(X(1 + g.start * 0.18))},${lteY}v${lteH}`,
      stroke: '#1a1c2d',
      width: 0.6,
      opacity: 0.8,
    });
  // NR 100 MHz carrier: 273 RB in groups of 16, 30 kHz
  const nrOcc = occupiedMHz(273, 30),
    start = (100 - nrOcc) / 2;
  shapes.push({
    d: `M${f(X(start))},${nrY}H${f(X(start + nrOcc))}V${nrY + nrH}H${f(X(start))}Z`,
    fill: '#f4bd6c',
    opacity: 0.55,
  });
  for (const g of rbGroups(273, 16).slice(1))
    shapes.push({
      d: `M${f(X(start + g.start * 0.36))},${nrY}v${nrH}`,
      stroke: '#1a1c2d',
      width: 0.9,
      opacity: 0.85,
    });
  for (let k = 1; k < 4; k++)
    shapes.push({
      d: `M${f(X(start))},${f(nrY + (k * nrH) / 4)}H${f(X(start + nrOcc))}`,
      stroke: '#1a1c2d',
      width: 0.6,
      opacity: 0.6,
    });
  // constellation plate at the right: ideal 16QAM points and a seeded noisy draw at 20 dB
  const cx = 318,
    cy = 100,
    half = 62,
    span = 1.45;
  const P = (v: number) => (v / span) * (half - 6);
  shapes.push({
    d: `M${cx - half + 10},${cy - half}H${cx + half - 10}a10,10 0 0,1 10,10V${cy + half - 10}a10,10 0 0,1 -10,10H${cx - half + 10}a10,10 0 0,1 -10,-10V${cy - half + 10}a10,10 0 0,1 10,-10Z`,
    fill: '#121424',
    stroke: '#3d4160',
    width: 1.2,
  });
  for (const r of receive(4, 20, 160, 7))
    shapes.push({
      d: `M${f(cx + P(r.i))},${f(cy - P(r.q))}h0.01`,
      stroke: r.error ? '#f39191' : '#b4a8f6',
      width: 2.6,
      opacity: 0.55,
    });
  constellation(4).forEach((pt, i) =>
    shapes.push({
      d: `M${f(cx + P(pt.i) - 3.4)},${f(cy - P(pt.q))}a3.4,3.4 0 1,0 6.8,0a3.4,3.4 0 1,0 -6.8,0`,
      stroke: i === 11 ? '#f4bd6c' : '#ebe9f5',
      width: i === 11 ? 1.8 : 1,
      opacity: i === 11 ? 1 : 0.6,
    }),
  );
  return { background: '#1a1c2d', shapes };
}
