const bounded = (n: number, min: number, max: number, fallback = min) =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : fallback));
// The interactive integrations cover at most 120 illustrative time units.
const simulationTime = (n: number) => bounded(n, 0, 120);
export function diffuseInk(progress: number) {
  const n = 51;
  let c: number[] = Array.from({ length: n }, (_, i) => (i === 25 ? 1 : 0));
  const steps = Math.round(Math.max(0, Math.min(1, progress)) * 1000);
  for (let k = 0; k < steps; k++)
    c = c.map((v, i) => v + 0.2 * ((c[i - 1] ?? v) + (c[i + 1] ?? v) - 2 * v));
  return c;
}
/** Relative osmolarity; intracellular impermeant amount is fixed at one. */
export function cellOsmosis(
  outside: number,
  time: number,
  plant = false,
  permeability = 0.35,
  initialVolume = 1,
) {
  time = simulationTime(time);
  outside = bounded(outside, 0.05, 5);
  permeability = bounded(permeability, 0, 1);
  let volume = bounded(initialVolume, 0.12, 1.65, 1),
    lysed = false;
  const dt = 0.01;
  for (let t = 0; t < Math.max(0, time); t += dt) {
    const pressure = plant ? Math.max(0, volume - 1) * 12 : 0;
    volume +=
      permeability * (1 / volume - Math.max(0.05, outside) - pressure) * Math.min(dt, time - t);
    volume = Math.max(0.12, volume);
    if (!plant && volume >= 1.65) {
      volume = 1.65;
      lysed = true;
      break;
    }
  }
  const pressure = plant ? Math.max(0, volume - 1) * 12 : 0;
  return {
    volume,
    inside: 1 / volume,
    pressure,
    lysed,
    flux: lysed ? 0 : permeability * (1 / volume - Math.max(0.05, outside) - pressure),
  };
}
export function funnelOsmosis(time: number, selective = true, outside = 0, appliedPressure = 0) {
  time = simulationTime(time);
  outside = bounded(outside, 0, 5);
  appliedPressure = bounded(appliedPressure, 0, 2);
  let volume = 1;
  const dt = 0.01;
  for (let t = 0; t < Math.max(0, time); t += dt) {
    const height = (volume - 1) * (1 / 0.3 + 1 / 6);
    const osmotic = selective ? 1 / volume - (outside * 8) / (9 - volume) : 0;
    volume += 0.2 * (osmotic - 0.5 * height - appliedPressure) * Math.min(dt, time - t);
    volume = bounded(volume, 0.12, 8.8);
  }
  const height = (volume - 1) * (1 / 0.3 + 1 / 6);
  return {
    volume,
    height,
    outsideVolume: 9 - volume,
    insideConcentration: selective ? 1 / volume : (1 + outside * 8) / 9,
    outsideConcentration: selective ? (outside * 8) / (9 - volume) : (1 + outside * 8) / 9,
    osmotic: selective ? 1 / volume - (outside * 8) / (9 - volume) : 0,
    hydrostatic: 0.5 * height + appliedPressure,
    flux:
      0.2 *
      ((selective ? 1 / volume - (outside * 8) / (9 - volume) : 0) -
        0.5 * height -
        appliedPressure),
  };
}
export type TransportMode = 'simple' | 'carrier' | 'active';
export function transportState(time: number, mode: TransportMode, atp = true) {
  time = simulationTime(time);
  let inside = mode === 'active' ? 1.5 : 0.2;
  let energy = 0;
  const total = 2,
    dt = 0.01;
  for (let t = 0; t < Math.max(0, time); t += dt) {
    const outside = total - inside;
    const flow =
      mode === 'simple'
        ? 0.12 * (outside - inside)
        : mode === 'carrier'
          ? 0.32 * (outside / (0.4 + outside) - inside / (0.4 + inside))
          : atp
            ? (0.18 * outside) / (0.4 + outside)
            : 0;
    const moved = flow * Math.min(dt, time - t);
    inside = Math.max(0, Math.min(total, inside + moved));
    if (mode === 'active') energy += Math.max(0, moved);
  }
  return { inside, outside: total - inside, energy };
}
/** Carrier-bound cargo must enter and leave through the rendered protein, not nearby lipid. */
export function transportParticle(id: number, inside: number, mode: TransportMode) {
  const progress = bounded(inside * 12 - id, 0, 1),
    x = 40 + (id % 6) * 34,
    y = 50 + Math.floor(id / 6) * 15;
  if (mode === 'simple') return { id, x, y: y + progress * 120 };
  if (progress < 0.3) {
    const p = progress / 0.3;
    return { id, x: x + (125 - x) * p, y: y + (95 - y) * p };
  }
  if (progress <= 0.7) return { id, x: 125, y: 95 + ((progress - 0.3) / 0.4) * 60 };
  const p = (progress - 0.7) / 0.3;
  return { id, x: 125 + (x - 125) * p, y: 155 + (y + 120 - 155) * p };
}
export function redCellOutline(volume: number) {
  const radius = 45 * Math.cbrt(volume),
    crenation = Math.max(0, 1 - volume) * 0.2;
  return (
    Array.from({ length: 120 }, (_, i) => {
      const a = (i / 120) * Math.PI * 2,
        r = radius * (1 + crenation * Math.cos(12 * a));
      return `${i ? 'L' : 'M'}${(80 + r * Math.cos(a)).toFixed(3)} ${(80 + r * Math.sin(a)).toFixed(3)}`;
    }).join(' ') + 'Z'
  );
}

/** A phenomenological decomposition of net flow, not measured molecular crossing counts.
 * Both gross rates stay positive at equilibrium. Positive net means into the cell/funnel.
 */
export function waterExchange(osmotic: number, pressure: number, permeability = 0.2) {
  const k = bounded(permeability, 0, 1);
  const net = k * (bounded(osmotic, -10, 10, 0) - bounded(pressure, -10, 10, 0));
  const background = 2 * k;
  return { inward: background + Math.max(0, net), outward: background + Math.max(0, -net), net };
}

export function plantGeometry(volume: number) {
  const scale = Math.cbrt(bounded(volume, 0.12, 1.65, 1));
  // The wall is slightly elastic after contact, rather than letting the protoplast overlap it.
  const wallScale = Math.max(1, scale);
  const halfWidth = 126 * scale,
    halfHeight = 66 * scale;
  return {
    halfWidth,
    halfHeight,
    wallHalfWidth: 126 * wallScale + 5,
    wallHalfHeight: 66 * wallScale + 5,
    gap: 126 * (wallScale - scale),
  };
}

export type WalkPoint = { x: number; y: number };
const walkCache = new Map<string, WalkPoint[]>();
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const reflect = (x: number, a: number, b: number) => {
  const d = b - a,
    p = (((x - a) % (2 * d)) + 2 * d) % (2 * d);
  return a + (p <= d ? p : 2 * d - p);
};
/** True if a straight motion segment touches an inflated membrane slab. */
function intersects(a: WalkPoint, b: WalkPoint, x0: number, x1: number, y0: number, y1: number) {
  let lo = 0,
    hi = 1;
  for (const [p, d, min, max] of [
    [a.x, b.x - a.x, x0, x1],
    [a.y, b.y - a.y, y0, y1],
  ]) {
    if (Math.abs(d) < 1e-10) {
      if (p < min || p > max) return false;
    } else {
      const t0 = (min - p) / d,
        t1 = (max - p) / d;
      lo = Math.max(lo, Math.min(t0, t1));
      hi = Math.min(hi, Math.max(t0, t1));
    }
  }
  return lo <= hi;
}
export const osmosisMembrane = {
  left: 149,
  right: 171,
  poreTop: 45,
  poreBottom: 95,
  waterRadius: 4,
} as const;
export function membraneSegmentAllowed(a: WalkPoint, b: WalkPoint, solute = false) {
  const g = osmosisMembrane;
  return (
    !intersects(
      a,
      b,
      g.left - g.waterRadius,
      g.right + g.waterRadius,
      0,
      solute ? 140 : g.poreTop + g.waterRadius,
    ) &&
    (solute ||
      !intersects(
        a,
        b,
        g.left - g.waterRadius,
        g.right + g.waterRadius,
        g.poreBottom - g.waterRadius,
        140,
      ))
  );
}
/** Reproducible unbiased walk. No concentration is supplied to an individual particle.
 * These few tracked paths illustrate thermal motion; continuum flow is computed separately.
 */
export function particleWalk(
  id: number,
  time: number,
  kind: 'dye' | 'water' | 'solute' | 'permeant' = 'water',
) {
  id = Math.floor(bounded(id, 0, 160));
  const key = `${kind}-${id}`;
  let points = walkCache.get(key);
  if (!points) {
    const rand = random(id * 9767 + 37);
    let point =
      kind === 'dye'
        ? { x: 154 + rand() * 12, y: 60 + rand() * 12 }
        : { x: id % 2 ? 192 + rand() * 100 : 22 + rand() * 100, y: 14 + rand() * 108 };
    points = [point];
    for (let k = 0; k < 1100; k++) {
      const candidate = {
        x: reflect(point.x + (rand() - 0.5) * 23, 10, 310),
        y: reflect(point.y + (rand() - 0.5) * 23, 10, 130),
      };
      if (
        kind === 'dye' ||
        kind === 'permeant' ||
        membraneSegmentAllowed(point, candidate, kind === 'solute')
      )
        point = candidate;
      points.push(point);
    }
    walkCache.set(key, points);
  }
  const at = bounded(time, 0, 100) * 10,
    i = Math.floor(at),
    f = at - i;
  const a = points[i],
    b = points[i + 1];
  return {
    id,
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    trail: [
      ...points.slice(Math.max(0, i - 12), i + 1),
      { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f },
    ],
  };
}

/** A controlled channel prediction: reset the SAME initial volume, reverse only the bath. */
export function aquaporinComparison(time: number, outside = 0.7) {
  return [0.025, 0.5].map((permeability) => cellOsmosis(outside, time, false, permeability));
}

/** Exchange a tracked pair after the macroscopic passive distribution has equilibrated.
 * Half-cycles are stochastic-motion exemplars; they do not represent a carrier molecular simulation.
 */
export function equilibriumTransportParticle(id: number, time: number, mode: 'simple' | 'carrier') {
  time = simulationTime(time);
  const state = transportState(time, mode),
    base = transportParticle(id, state.inside, mode);
  if (time <= 75 || (id !== 0 && id !== 23)) return base;
  const phase = (time - 75) / 6,
    cycle = Math.floor(phase),
    local = phase - cycle;
  const smooth = (v: number) => {
    const p = bounded(v, 0, 1);
    return p * p * (3 - 2 * p);
  };
  const swap = smooth(id === 0 ? local * 2 : (local - 0.5) * 2);
  const a = transportParticle(id, 1, mode),
    b = { ...a, y: a.y + (id === 0 ? -120 : 120) };
  const p = cycle % 2 ? 1 - swap : swap;
  if (mode === 'simple') return { ...a, y: a.y + (b.y - a.y) * p };
  const points = [a, { x: 125, y: id === 0 ? 158 : 92 }, { x: 125, y: id === 0 ? 92 : 158 }, b];
  const segment = Math.min(2, Math.floor(p * 3)),
    q = p * 3 - segment,
    u = points[segment],
    v = points[segment + 1];
  return { id, x: u.x + (v.x - u.x) * q, y: u.y + (v.y - u.y) * q };
}

/** Dilute, isothermal approximation in pressure-equivalent relative units.
 * Mixing lowers solvent chemical potential; pressure raises it. Gravity across a cell is omitted.
 */
export function waterPotential(concentration: number, pressure = 0) {
  return bounded(pressure, -10, 10, 0) - bounded(concentration, 0, 10, 0);
}
export function potentialDifference(
  insideConcentration: number,
  outsideConcentration: number,
  insidePressure = 0,
) {
  const inside = waterPotential(insideConcentration, insidePressure),
    outside = waterPotential(outsideConcentration);
  return {
    inside,
    outside,
    mixingInside: waterPotential(insideConcentration),
    pressureContribution: insidePressure,
    inwardDrive: outside - inside,
  };
}
