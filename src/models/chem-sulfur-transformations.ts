const clamp = (x: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, Number.isFinite(x) ? x : 0));
/** Amounts use arbitrary common molar units, not laboratory quantities. */
export function copperSulfuric(extent: number, contact = true, heated = true, concentrated = true) {
  const x = contact && heated && concentrated ? clamp(extent) : 0;
  return {
    extent: x,
    copper: 1 - x,
    acid: 2 - 2 * x,
    copperSulfate: x,
    sulfurDioxide: x,
    water: 2 * x,
    electrons: 2 * x,
    sulfurInAcid: 2 - 2 * x,
    sulfurInSalt: x,
    sulfurInGas: x,
  };
}
export function sulfurComproportionation(extent: number) {
  const x = clamp(extent);
  return { sulfide: 2 * (1 - x), sulfurIV: 1 - x, sulfur: 3 * x, donated: 4 * x, accepted: 4 * x };
}
/** Two admissible redox balances; endpoint selection is a teaching hypothesis, not a kinetic prediction. */
export function sulfidePermanganate(endpoint: 'sulfur' | 'sulfate', extent: number) {
  const x = clamp(extent),
    electronPerS = endpoint === 'sulfur' ? 2 : 8,
    permanganatePerS = electronPerS / 5;
  return {
    endpoint,
    extent: x,
    sulfide: 1 - x,
    sulfur: endpoint === 'sulfur' ? x : 0,
    sulfate: endpoint === 'sulfate' ? x : 0,
    permanganateInitial: permanganatePerS,
    permanganateRemaining: permanganatePerS * (1 - x),
    manganeseII: permanganatePerS * x,
    donated: electronPerS * x,
    accepted: 5 * permanganatePerS * x,
  };
}
export type SulfurHeatFrame = { time: number; temperature: number[]; reacted: number[] };
/** Dimensionless reaction-diffusion teaching model: one local ignition pulse, diffusion,
 * threshold reaction, exothermic feedback and heat loss. No measured Fe/S rate fit. */
export function simulateIronSulfur({ ironRatio = 1.15, ignition = true, heatRelease = 1.4 } = {}) {
  const n = 36,
    dt = 0.01,
    availability = clamp(ironRatio),
    frames: SulfurHeatFrame[] = [];
  let temperature = Array(n).fill(0) as number[],
    reacted = Array(n).fill(0) as number[];
  for (let step = 0; step <= 2000; step++) {
    const t = step * dt;
    if (step % 10 === 0)
      frames.push({ time: t, temperature: [...temperature], reacted: [...reacted] });
    const next = temperature.map((v, i) => {
      const dr =
        v > 0.5 ? Math.min(availability - reacted[i], 5 * (availability - reacted[i]) * dt) : 0;
      const diffusion = 4 * ((temperature[i - 1] ?? v) + (temperature[i + 1] ?? v) - 2 * v);
      reacted[i] += Math.max(0, dr);
      return Math.max(0, v + (diffusion - 0.15 * v) * dt + heatRelease * Math.max(0, dr));
    });
    if (ignition && t < 0.7) {
      next[0] = Math.max(1.2, next[0]);
      next[1] = Math.max(1.2, next[1]);
    }
    temperature = next;
  }
  return frames;
}
export function heatFrameAt(frames: SulfurHeatFrame[], time: number) {
  const t = clamp(time, 0, 20),
    index = Math.min(frames.length - 2, Math.floor(t * 10)),
    p = t * 10 - index,
    a = frames[index],
    b = frames[index + 1];
  return {
    time: t,
    temperature: a.temperature.map((v, i) => v + (b.temperature[i] - v) * p),
    reacted: a.reacted.map((v, i) => v + (b.reacted[i] - v) * p),
  };
}
export function ironSulfurInventory(ironRatio: number, meanReacted: number) {
  const iron = clamp(ironRatio, 0, 2),
    x = clamp(meanReacted, 0, Math.min(iron, 1));
  return { iron: iron - x, sulfur: 1 - x, ironSulfide: x, electrons: 2 * x };
}
export function sulfurTransformDirector(chapter: number, progress: number, practical = false) {
  const c = Math.max(0, Math.min(8, chapter)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    view:
      c === 0 || c === 8
        ? 'map'
        : c === 1 || c === 2
          ? 'sulfide'
          : c === 5
            ? 'copper-solution'
            : c === 6 || c === 7
              ? 'iron'
              : 'copper',
    sulfideRoute: c === 2 ? 'permanganate' : 'sulfurIV',
    extent: Math.min(1, p / 0.8),
    lift: c === 4 && !practical ? Math.min(1, p / 0.55) : 0,
    heated: c === 3,
    practical,
    time: c === 6 ? p * 1.1 : c === 7 ? 1.1 + p * 18.9 : 0,
  };
}
