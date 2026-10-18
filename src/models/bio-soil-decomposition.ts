export const soilClamp = (n: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export function litterState(days: number, activity = 1, moisture = 0.5) {
  const t = soilClamp(days, 0, 60),
    a = soilClamp(activity),
    m = soilClamp(moisture),
    rate = 0.065 * a * 4 * m * (1 - m);
  return { days: t, remaining: Math.exp(-rate * t), rate };
}
/** Carbon equivalents, not equal masses of hydrated starch and glucose. */
export function starchState(days: number, active = true, consumption = 0.12) {
  const t = soilClamp(days, 0, 30),
    k = active ? 0.55 : 0,
    d = active ? soilClamp(consumption, 0, 2) : 0,
    starch = Math.exp(-k * t);
  const reducing =
    k === 0
      ? 0
      : Math.abs(d - k) < 1e-8
        ? k * t * Math.exp(-k * t)
        : (k / (d - k)) * (Math.exp(-k * t) - Math.exp(-d * t));
  return { starch, reducing: soilClamp(reducing), used: soilClamp(1 - starch - reducing) };
}
export function sampleTransfer(progress: number, width = 320) {
  const p = soilClamp(progress),
    z = p * 2,
    part = Math.min(1, Math.floor(z)),
    q = p === 1 ? 1 : z - part,
    sourceX = width * 0.2,
    targetX = width * (part === 0 ? 0.57 : 0.82),
    drawn = 10 * soilClamp(q / 0.18),
    dispensed = 10 * soilClamp((q - 0.54) / 0.24);
  let x = sourceX,
    y = 230;
  if (q >= 0.18 && q < 0.3) y = 230 - (110 * (q - 0.18)) / 0.12;
  if (q >= 0.3 && q < 0.46) {
    x = sourceX + ((targetX - sourceX) * (q - 0.3)) / 0.16;
    y = 120;
  }
  if (q >= 0.46 && q < 0.54) {
    x = targetX;
    y = 120 + (30 * (q - 0.46)) / 0.08;
  }
  if (q >= 0.54 && q < 0.78) {
    x = targetX;
    y = 150;
  }
  if (q >= 0.78 && q < 0.86) {
    x = targetX;
    y = 150 - (30 * (q - 0.78)) / 0.08;
  }
  if (q >= 0.86 && q < 0.94) {
    x = targetX + ((sourceX - targetX) * (q - 0.86)) / 0.08;
    y = 120;
  }
  if (q >= 0.94) y = 120 + (110 * (q - 0.94)) / 0.06;
  const tubes = [part === 0 ? dispensed : 10, part === 1 ? dispensed : 0];
  return {
    part,
    q,
    x,
    y,
    source: 40 - 10 * part - drawn,
    pipette: drawn - dispensed,
    tubes,
    dispensing: q >= 0.54 && q < 0.78,
  };
}
export function reagentDrops(progress: number) {
  const p = soilClamp(progress);
  return Array.from({ length: 3 }, (_, id) => {
    const phase = soilClamp((p - (0.08 + id * 0.1)) / 0.08);
    return { id, phase, arrived: phase === 1, visible: phase > 0 && phase < 1 };
  });
}
export function assayResult(
  days = 7,
  active = true,
  consumption = 0.12,
  heated = true,
  progress = 1,
) {
  const state = starchState(days, active, consumption),
    drops = reagentDrops(progress),
    reagent = drops.filter((x) => x.arrived).length / 3,
    heat = heated ? soilClamp((progress - 0.5) / 0.35) : 0;
  return {
    ...state,
    reagent,
    heat,
    iodine: soilClamp((state.starch - 0.03) / 0.3) * reagent,
    precipitate: state.reducing > 0.06 ? soilClamp(state.reducing * 2) * heat * reagent : 0,
    liquidMl: 10 + 0.3 * reagent,
  };
}
export function litterRecord(initial: string, final: string) {
  if (initial.trim() === '' || final.trim() === '') return null;
  const a = Number(initial),
    b = Number(final);
  return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b >= 0
    ? { initial: a, final: b, loss: (a - b) / a }
    : null;
}
export const leafHoles = Array.from({ length: 10 }, (_, id) => ({
  id,
  x: ((id * 7) % 17) - 8,
  y: -21 + Math.floor(id / 2) * 10,
  r: 2 + (id % 3),
}));
