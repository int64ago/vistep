const clamp = (n: number, a = 0, b = 1) => (Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a);
export const distillationSpecies = [
  { formula: 'CH₂Cl₂', boilingK: 313, latentJ: 28060, color: '#77a7a3' },
  { formula: 'CHCl₃', boilingK: 334.3, latentJ: 29240, color: '#b6a279' },
  { formula: 'CCl₄', boilingK: 349.8, latentJ: 29820, color: '#9d96ac' },
] as const;
export const total = (v: readonly number[]) => v.reduce((a, b) => a + b, 0);
export function fractions(v: readonly number[]) {
  const n = v.map((x) => clamp(x, 0, 1e6)),
    sum = total(n);
  return sum ? n.map((x) => x / sum) : [0, 0, 0];
}
/** Constant-enthalpy Clausius–Clapeyron anchored to NIST normal boiling points; ideal teaching model. */
export function saturationBar(i: number, T: number) {
  const s = distillationSpecies[Math.floor(clamp(i, 0, 2))];
  return 1.01325 * Math.exp((s.latentJ / 8.314462618) * (1 / s.boilingK - 1 / clamp(T, 250, 400)));
}
export function vapourEquilibrium(amounts: readonly number[]) {
  const x = fractions(amounts);
  if (!total(x))
    return { kelvin: 298.15, celsius: 25, liquid: x, vapour: [0, 0, 0], boiling: false };
  let low = 300,
    high = 360;
  for (let j = 0; j < 40; j++) {
    const t = (low + high) / 2,
      p = x.reduce((a, b, i) => a + b * saturationBar(i, t), 0);
    if (p > 1.01325) high = t;
    else low = t;
  }
  const kelvin = (low + high) / 2,
    y = fractions(x.map((v, i) => v * saturationBar(i, kelvin)));
  return { kelvin, celsius: kelvin - 273.15, liquid: x, vapour: y, boiling: true };
}
export interface DistillationState {
  evaporated: number;
  remaining: number[];
  cuts: number[][];
  equilibrium: ReturnType<typeof vapourEquilibrium>;
}
/** Differential batch distillation; three fixed accounting cuts, not real purity guarantees. */
export function distillationTrace(
  feed: readonly number[] = [0.45, 0.35, 0.2],
  steps = 300,
): DistillationState[] {
  const initial = fractions(feed),
    remaining = [...initial],
    cuts = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    n = Math.floor(clamp(steps, 30, 1200)),
    trace: DistillationState[] = [];
  const record = (evaporated: number) =>
    trace.push({
      evaporated,
      remaining: [...remaining],
      cuts: cuts.map((c) => [...c]),
      equilibrium: vapourEquilibrium(remaining),
    });
  record(0);
  for (let j = 0; j < n; j++) {
    const eq = trace[j].equilibrium,
      dn = 0.72 / n,
      cut = Math.min(2, Math.floor((j / n) * 3));
    for (let i = 0; i < 3; i++) {
      const q = Math.min(remaining[i], dn * eq.vapour[i]);
      remaining[i] -= q;
      cuts[cut][i] += q;
    }
    record(total(cuts.map(total)));
  }
  return trace;
}
export function distillationAt(trace: DistillationState[], progress: number, cooling = true) {
  const state = trace[Math.round(clamp(progress) * (trace.length - 1))],
    collected = state.cuts.map((c) => c.map((n) => (cooling ? n : 0))),
    uncondensed = state.cuts.map((c) => c.map((n) => (cooling ? 0 : n)));
  return { ...state, collected, uncondensed };
}
export function vapourPath(q: number) {
  const vertices = [
      [91, 157],
      [91, 76],
      [115, 76],
      [261, 151],
      [261, 184],
    ],
    seg = [81, 24, Math.hypot(146, 75), 33],
    length = total(seg);
  let d = clamp(q) * length;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const f = d / seg[i];
      return {
        x: vertices[i][0] + f * (vertices[i + 1][0] - vertices[i][0]),
        y: vertices[i][1] + f * (vertices[i + 1][1] - vertices[i][1]),
        condensing: i >= 2,
      };
    }
    d -= seg[i];
  }
  return { x: 261, y: 184, condensing: true };
}
export function distillationDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 6)),
    p = clamp(progress);
  return {
    chapter: c,
    p,
    batch:
      c < 2
        ? 0
        : c === 2
          ? 0.04 + 0.14 * p
          : c === 3
            ? 0.2
            : c === 4
              ? 0.55 + 0.45 * p
              : c === 5
                ? 0.6 + 0.4 * p
                : 0.2 * p,
    phase: c === 0 ? 0 : c === 1 ? p : 1,
    cooling: c !== 6,
  };
}
