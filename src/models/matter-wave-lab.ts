import { electronWavelengthPM, finiteClamp } from './modern-labs';
export { electronWavelengthPM };
/** Finite, equally spaced coherent planes; normalized elastic-scattering intensity. */
export function planeIntensity(theta: number, wavelengthPM: number, spacingPM = 213, planes = 8) {
  theta = finite(theta, 0, Math.PI / 2, 0);
  wavelengthPM = finite(wavelengthPM, 1, 2000, 120);
  spacingPM = finite(spacingPM, 1, 1000, 213);
  planes = Math.round(finite(planes, 1, 64, 8));
  const phase = (2 * Math.PI * 2 * spacingPM * Math.sin(theta)) / wavelengthPM;
  let re = 0,
    im = 0;
  for (let n = 0; n < planes; n++) {
    re += Math.cos(n * phase);
    im += Math.sin(n * phase);
  }
  return (re * re + im * im) / planes ** 2;
}
export function powderRadii(voltage: number, distanceMM = 100) {
  // Forward-screen teaching domain: 100–10000 V, positive screen distance.
  const lambda = electronWavelengthPM(finite(voltage, 100, 10000, 2000));
  distanceMM = finite(distanceMM, 0, 1000, 100);
  return [213, 123].map((d) => distanceMM * Math.tan(2 * Math.asin(lambda / (2 * d))));
}
/** A simple-cubic, single-atom basis. k is in cycles/pm. Elastic Laue condition is exact. */
export function laueSpots(rotation: number, spacingPM = 400) {
  spacingPM = finite(spacingPM, 100, 1000, 400);
  const angle = finiteClamp(rotation, -0.8, 0.8),
    a = 0.17;
  const spots: {
    x: number;
    y: number;
    wavelengthPM: number;
    residual: number;
    h: number;
    k: number;
    l: number;
  }[] = [];
  for (let h = -5; h <= 5; h++)
    for (let k = -5; k <= 5; k++)
      for (let l = -5; l <= 5; l++) {
        if (!h && !k && !l) continue;
        const hx = h * Math.cos(a) - k * Math.sin(a),
          ky = h * Math.sin(a) + k * Math.cos(a);
        const gx = (hx * Math.cos(angle) + l * Math.sin(angle)) / spacingPM,
          gy = ky / spacingPM,
          gz = (-hx * Math.sin(angle) + l * Math.cos(angle)) / spacingPM;
        const g2 = gx * gx + gy * gy + gz * gz,
          lambda = (-2 * gz) / g2;
        const sx = lambda * gx,
          sy = lambda * gy,
          sz = 1 + lambda * gz;
        if (lambda < 40 || lambda > 220 || sz < 0.35) continue;
        const x = sx / sz,
          y = sy / sz;
        if (Math.abs(x) > 1.15 || Math.abs(y) > 1.15) continue;
        if (spots.some((p) => Math.hypot(p.x - x, p.y - y) < 0.015)) continue;
        spots.push({
          x,
          y,
          wavelengthPM: lambda,
          residual: Math.abs(sx * sx + sy * sy + sz * sz - 1),
          h,
          k,
          l,
        });
      }
  return spots;
}
/** Biprism-equivalent two coherent sources. x is in fringe periods at the reference voltage. */
export function electronInterference(x: number, voltage: number) {
  x = finite(x, -20, 20, 0);
  const ratio =
    electronWavelengthPM(finite(voltage, 100, 10000, 2000)) / electronWavelengthPM(2000);
  return Math.exp((-x * x) / 12) * Math.cos((Math.PI * x) / ratio) ** 2;
}
export function interferenceHits(voltage: number, count = 250) {
  count = Math.round(finite(count, 0, 1000, 250));
  const samples = 601,
    weights = Array.from({ length: samples }, (_, i) =>
      electronInterference(-5 + (10 * i) / (samples - 1), voltage),
    );
  const sum = weights.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  const cdf = weights.map((w) => (cumulative += w / sum));
  return Array.from({ length: count }, (_, i) => {
    const q = ((i + 1) * 0.61803398875) % 1,
      j = cdf.findIndex((x) => x >= q);
    return {
      id: i,
      x: -5 + (10 * j) / (samples - 1),
      y: ((((i + 1) * 0.754877666) % 1) - 0.5) * 2,
    };
  });
}

export const finite = (x: number, min: number, max: number, fallback: number) =>
  Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback;
const ramp = (t: number, a: number, b: number) => finite((t - a) / (b - a), 0, 1, 0),
  ease = (v: number) => v * v * (3 - 2 * v);
export type Point2 = { x: number; y: number };
/** All coordinates are pm in a plane section, +y into the crystal. A/O share the
 * incident wavefront and O/C the outgoing wavefront. No fictitious vertical extra ray. */
export function braggPaths(
  thetaDegrees = 24.0948425521,
  spacingPM = 400 / Math.sqrt(6),
  wavelengthPM = 400 / 3,
) {
  const theta = (finite(thetaDegrees, 5, 65, 24.0948425521) * Math.PI) / 180,
    d = finite(spacingPM, 100, 300, 400 / Math.sqrt(6)),
    lambda = finite(wavelengthPM, 40, 250, 400 / 3),
    u = { x: Math.cos(theta), y: Math.sin(theta) },
    v = { x: Math.cos(theta), y: -Math.sin(theta) },
    O = { x: 0, y: 0 },
    B = { x: 0, y: d },
    extra = d * Math.sin(theta),
    A = { x: B.x - extra * u.x, y: B.y - extra * u.y },
    C = { x: B.x + extra * v.x, y: B.y + extra * v.y },
    length = 360,
    upper = [{ x: -length * u.x, y: -length * u.y }, O, { x: length * v.x, y: length * v.y }],
    lower = [
      { x: A.x - length * u.x, y: A.y - length * u.y },
      A,
      B,
      C,
      { x: C.x + length * v.x, y: C.y + length * v.y },
    ],
    incoming = Math.hypot(B.x - A.x, B.y - A.y),
    outgoing = Math.hypot(C.x - B.x, C.y - B.y),
    delta = incoming + outgoing,
    phase = (2 * Math.PI * delta) / lambda;
  return {
    theta,
    d,
    lambda,
    u,
    v,
    O,
    A,
    B,
    C,
    upper,
    lower,
    incoming,
    outgoing,
    delta,
    phase,
    cycles: delta / lambda,
    pairIntensity: (1 + Math.cos(phase)) / 2,
  };
}
export function planeSum(thetaDegrees: number, lambda: number, d = 213, planes = 8) {
  const g = braggPaths(thetaDegrees, d, lambda),
    n = Math.round(finite(planes, 1, 16, 8));
  let re = 0,
    im = 0;
  const vectors = Array.from({ length: n }, (_, id) => {
    const start = { x: re, y: im },
      x = Math.cos(id * g.phase),
      y = Math.sin(id * g.phase);
    re += x;
    im += y;
    return { id, start, end: { x: re, y: im }, x, y };
  });
  return { ...g, vectors, re, im, intensity: (re * re + im * im) / (n * n) };
}
/** Same R_y(rotation) R_z(0.17) used by the retained Laue reciprocal vectors. */
export function crystalPoint(x: number, y: number, z: number, rotation: number) {
  const a = 0.17,
    r = finite(rotation, -0.8, 0.8, 0),
    hx = x * Math.cos(a) - y * Math.sin(a),
    ky = x * Math.sin(a) + y * Math.cos(a);
  return { x: hx * Math.cos(r) + z * Math.sin(r), y: ky, z: -hx * Math.sin(r) + z * Math.cos(r) };
}
export const SELECTED_LAUE = Object.freeze({
  h: 2,
  k: 1,
  l: -1,
  a: 400,
  d: 400 / Math.sqrt(6),
  lambda: 400 / 3,
  theta: (Math.asin(1 / Math.sqrt(6)) * 180) / Math.PI,
});
export const MATTER_DURATIONS = [28, 28, 28, 28, 28, 28, 28] as const;
export type MatterView = 'reflection' | 'phasors' | 'rings' | 'events' | 'laue' | 'planes';
export type MatterShot = {
  chapter: number;
  time: number;
  view: MatterView;
  theta: number;
  d: number;
  lambda: number;
  voltage: number;
  rotation: number;
  count: number;
  clock: number;
  detail: number;
  question: boolean;
  reveal: boolean;
};
/** Retained 196 s windows. Electron-peak cuts follow the measured zh/en recording. */
export function matterDirector(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
): MatterShot {
  const c = Math.floor(finite(chapter, 0, 6, 0)),
    t = finite(chapterTime, 0, 28, 0),
    lambda = electronWavelengthPM(100),
    peak = (Math.asin(lambda / 426) * 180) / Math.PI;
  const s: MatterShot = {
    chapter: c,
    time: t,
    view: 'reflection',
    theta: 12,
    d: 213,
    lambda,
    voltage: 2000,
    rotation: 0,
    count: 0,
    clock: t / 3,
    detail: 1,
    question: false,
    reveal: true,
  };
  if (c === 0) s.theta = 12 + 13 * ease(ramp(t, 11, 25));
  if (c === 1) {
    // First find the angular peak; the phase close-up then replays the same
    // off-peak → in-phase change. Both pictures use the unchanged eight-plane sum.
    // Measured local words: zh 峰 3.23–3.43, 整数倍 through 7.25;
    // en peak 1.71–2.13, in phase through 4.27 (0.45 s cue lead-in included).
    const cuts =
      locale === 'en'
        ? { peak: 1.71, phasors: 2.25, start: 2.4, aligned: 4.27 }
        : { peak: 3.23, phasors: 3.6, start: 4.23, aligned: 7.25 };
    s.view = t < cuts.phasors ? 'reflection' : 'phasors';
    s.theta =
      12 +
      (peak - 12) *
        ease(
          s.view === 'reflection' ? ramp(t, 0.45, cuts.peak) : ramp(t, cuts.start, cuts.aligned),
        );
  }
  if (c === 2) {
    s.view = 'rings';
    s.question = t >= 9 && t < 12;
    s.voltage = 2000 + 3000 * ease(ramp(t, 12, 21));
    s.detail = ease(ramp(t, 2, 9));
  }
  if (c === 3) {
    s.view = 'events';
    s.count = Math.floor(350 * ease(ramp(t, 1, 20)));
  }
  if (c >= 4) {
    s.view = 'laue';
    s.d = SELECTED_LAUE.d;
    s.lambda = SELECTED_LAUE.lambda;
    s.theta = SELECTED_LAUE.theta;
  }
  if (c === 5) {
    s.view = 'planes';
    const fraction = 0.75 + 0.25 * ease(ramp(t, 11, 17));
    s.theta = (Math.asin((fraction * s.lambda) / (2 * s.d)) * 180) / Math.PI;
    s.detail = ease(ramp(t, 4, 10));
  }
  if (c === 6) {
    s.question = t < 3;
    s.rotation = 0.22 * ease(ramp(t, 3, 17));
  }
  return s;
}
