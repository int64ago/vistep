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
export function funnelOsmosis(time: number, selective = true, outside = 0) {
  time = simulationTime(time);
  outside = bounded(outside, 0, 5);
  let volume = 1;
  const dt = 0.01;
  for (let t = 0; t < Math.max(0, time); t += dt) {
    const height = (volume - 1) / 0.3;
    const osmotic = selective ? 1 / volume - outside : 0;
    volume += 0.2 * (osmotic - 0.5 * height) * Math.min(dt, time - t);
  }
  const height = (volume - 1) / 0.3;
  return {
    volume,
    height,
    osmotic: selective ? 1 / volume - outside : 0,
    hydrostatic: 0.5 * height,
    flux: 0.2 * ((selective ? 1 / volume - outside : 0) - 0.5 * height),
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
