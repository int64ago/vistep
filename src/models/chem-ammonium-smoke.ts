export const SMOKE_GRID = { width: 40, height: 32, dt: 0.008, diffusion: 0.065, reaction: 14 };
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : 0));
export type SmokeState = {
  time: number;
  a: Float64Array;
  b: Float64Array;
  solid: Float64Array;
  injectedA: number;
  injectedB: number;
};
const cache = new Map<string, SmokeState[]>();
/** Dimensionless diffusion/reaction teaching grid. No-flux edges conserve both reactants. */
function smokeFrames(gap: number, both: boolean) {
  const key = `${gap.toFixed(3)}:${both}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { width: w, height: h, dt, diffusion: D, reaction: k } = SMOKE_GRID,
    n = w * h;
  let a = new Float64Array(n),
    b = new Float64Array(n),
    solid = new Float64Array(n),
    ta = new Float64Array(n),
    tb = new Float64Array(n),
    ts = new Float64Array(n);
  let injectedA = 0,
    injectedB = 0;
  const frames: SmokeState[] = [];
  const sourceA = Math.round((0.5 - gap / 2) * (w - 1)) + 14 * w,
    sourceB = Math.round((0.5 + gap / 2) * (w - 1)) + 14 * w;
  const diffuse = (src: Float64Array, dst: Float64Array, rate: number) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x,
          c = src[i];
        dst[i] =
          c +
          rate *
            ((x ? src[i - 1] : c) +
              (x < w - 1 ? src[i + 1] : c) +
              (y ? src[i - w] : c) +
              (y < h - 1 ? src[i + w] : c) -
              4 * c);
      }
  };
  for (let step = 0; step <= 1500; step++) {
    if (step % 10 === 0)
      frames.push({
        time: step * dt,
        a: a.slice(),
        b: b.slice(),
        solid: solid.slice(),
        injectedA,
        injectedB,
      });
    if (step === 1500) break;
    if (step < 750) {
      a[sourceA] += 0.03;
      injectedA += 0.03;
      if (both) {
        b[sourceB] += 0.03;
        injectedB += 0.03;
      }
    }
    diffuse(a, ta, D);
    diffuse(b, tb, D);
    diffuse(solid, ts, D * 0.3);
    for (let i = 0; i < n; i++) {
      const extent = Math.min(ta[i], tb[i], k * dt * ta[i] * tb[i]);
      ta[i] -= extent;
      tb[i] -= extent;
      ts[i] += extent;
    }
    [a, ta] = [ta, a];
    [b, tb] = [tb, b];
    [solid, ts] = [ts, solid];
  }
  if (cache.size >= 3) cache.delete(cache.keys().next().value!);
  cache.set(key, frames);
  return frames;
}
export function ammoniumSmoke(time: number, gap = 0.18, both = true): SmokeState {
  const frames = smokeFrames(clamp(gap, 0.08, 0.7), both),
    t = clamp(time, 0, 12),
    at = t / 0.08,
    i = Math.min(frames.length - 1, Math.floor(at)),
    f = at - i,
    s = frames[i],
    next = frames[Math.min(i + 1, frames.length - 1)];
  const lerp = (a: number, b: number) => a + (b - a) * f;
  return {
    time: t,
    a: s.a.map((v, j) => lerp(v, next.a[j])),
    b: s.b.map((v, j) => lerp(v, next.b[j])),
    solid: s.solid.map((v, j) => lerp(v, next.solid[j])),
    injectedA: lerp(s.injectedA, next.injectedA),
    injectedB: lerp(s.injectedB, next.injectedB),
  };
}
export function smokeInventory(s: SmokeState) {
  const sum = (v: Float64Array) => v.reduce((a, b) => a + b, 0),
    a = sum(s.a),
    b = sum(s.b),
    solid = sum(s.solid);
  return { a, b, solid, nitrogen: a + solid, chlorine: b + solid, hydrogen: 3 * a + b + 4 * solid };
}
export function smokeDirector(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(3, chapter)),
    p = clamp(progress);
  return {
    chapter: c,
    time: c === 0 ? p * 0.6 : c === 1 ? 0.6 + p * 4.4 : c === 2 ? 5 + p * 4 : 8,
    gap: 0.18,
    both: c !== 3,
    zoom: c === 2,
  };
}

export function clearSmokeCache() {
  cache.clear();
}
