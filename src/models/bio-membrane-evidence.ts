export const membraneClamp = (x: number) => Math.max(0, Math.min(1, x));
export function membraneUptake(minutes: number, lipidSoluble: boolean) {
  const permeability = lipidSoluble ? 0.085 : 0.004;
  return 1 - Math.exp(-permeability * Math.max(0, minutes));
}
export function lipidArrangement(id: number, extraction: number) {
  const p = membraneClamp(extraction),
    layer = id < 20 ? 0 : 1,
    index = id % 20;
  return {
    id,
    x: (index * 7 - 66.5) * (1 - p) + (id * 7 - 136.5) * p,
    y: (layer ? 25 : -25) * (1 - p),
    // At the air–water surface the tails point up into air, with heads beside water.
    angle: layer ? 180 : 180 * p,
    direction: -1,
  };
}
function random01(seed: number) {
  let x = seed | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 16;
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 16;
  return ((x >>> 0) + 0.5) / 4294967296;
}
/** Seeded angular diffusion on a schematic membrane circumference. Time scale is illustrative, not a fitted diffusivity. */
export function membraneTracer(id: number, minutes: number, mobile = true) {
  const base = ((id + 0.5) / 48) * Math.PI * 2;
  const steps = Math.max(0, minutes) * 4;
  let angle = base;
  if (mobile)
    for (let n = 0; n < Math.ceil(steps); n++) {
      const weight = Math.min(1, steps - n);
      const u = random01(id * 1999 + n * 7127 + 37),
        v = random01(id * 5519 + n * 104729 + 19);
      angle += Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * 0.3 * weight;
    }
  return { id, origin: id < 24 ? 'mouse' : 'human', angle, x: Math.cos(angle), y: Math.sin(angle) };
}
export function electronContrast(x: number, resolution: number) {
  const width = Math.max(0.3, resolution);
  return (
    0.12 +
    0.72 * Math.exp(-(((x - 2.3) / width) ** 2)) +
    0.72 * Math.exp(-(((x + 2.3) / width) ** 2))
  );
}
export function interfacePressure(surfaceTension: number, radius: number) {
  return (2 * Math.max(0, surfaceTension)) / Math.max(0.01, radius);
}
export function bilayerLipids(seconds: number) {
  return Array.from({ length: 48 }, (_, id) => ({
    id,
    x: 18 + (id % 24) * 13 + Math.sin(seconds * 0.2 + id) * 2,
    y: id < 24 ? 110 : 160,
    direction: id < 24 ? 1 : -1,
  }));
}
