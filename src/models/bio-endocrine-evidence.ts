export type EndocrineMode = 'insulin' | 'graft' | 'embryo' | 'glucose' | 'thyroid';
export const endocrineModes: EndocrineMode[] = ['insulin', 'graft', 'embryo', 'glucose', 'thyroid'];
const clamp = (n: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
export function pancreaticEvidence(t: number, treatment: 'intact' | 'removed' | 'extract') {
  const p = clamp(t),
    after = Math.max(0, p - 0.45),
    islets = treatment === 'intact';
  const glucose =
    treatment === 'intact'
      ? 1
      : treatment === 'removed'
        ? 1 + 1.4 * (1 - Math.exp(-4 * p))
        : p < 0.45
          ? 1 + 1.4 * (1 - Math.exp(-4 * p))
          : 1 + 1.4 * (1 - Math.exp(-1.8)) * Math.exp(-7 * after);
  return { progress: p, islets, glucose, extractActive: treatment === 'extract' && p >= 0.45 };
}
export function graftEvidence(progress: number, treatment: 'intact' | 'removed' | 'graft') {
  const p = clamp(progress),
    signal =
      treatment === 'intact'
        ? 1
        : treatment === 'removed'
          ? Math.exp(-4 * p)
          : p < 0.5
            ? Math.exp(-4 * p)
            : 1 - (1 - Math.exp(-2)) * Math.exp(-5 * (p - 0.5));
  return {
    signal,
    combSize: 0.3 + 0.7 * signal,
    glandPresent: treatment === 'intact' || (treatment === 'graft' && p >= 0.5),
  };
}
export function embryoEvidence(chromosomes: 'XX' | 'XY', gonads = true, androgen = false) {
  const testisSignal = androgen || (gonads && chromosomes === 'XY');
  return {
    chromosomes,
    gonads,
    androgen,
    testisSignal,
    externalPattern: testisSignal ? 'male' : 'female',
  } as const;
}
export function glucoseFeedback(time: number, meal = 1, feedback = true, fasting = false) {
  const end = clamp(time, 0, 12),
    dt = 0.01;
  let glucose = 1,
    insulin = 0,
    glucagon = 0;
  const points: { time: number; glucose: number; insulin: number; glucagon: number }[] = [
    { time: 0, glucose, insulin, glucagon },
  ];
  let absorbed = 0,
    produced = 0,
    used = 0;
  for (let t = 0; t < end - 1e-10; t += dt) {
    const step = Math.min(dt, end - t),
      input = (fasting ? 0 : clamp(meal, 0, 2)) * 0.85 * Math.exp(-t / 1.2);
    insulin = feedback ? 1.4 * Math.max(0, glucose - 1) : 0;
    glucagon = feedback ? 1.2 * Math.max(0, 1 - glucose) : 0;
    const production = 0.15 + 0.7 * glucagon,
      uptake = (0.15 + (fasting ? 0.2 : 0)) * glucose + insulin * glucose;
    absorbed += input * step;
    produced += production * step;
    used += uptake * step;
    glucose = Math.max(0, glucose + (input + production - uptake) * step);
    if (Math.round(t / dt) % 10 === 0) points.push({ time: t + step, glucose, insulin, glucagon });
  }
  return { glucose, insulin, glucagon, absorbed, produced, used, points };
}
export type ThyroidIntervention =
  'normal' | 'remove-pituitary' | 'replace-tsh' | 'extra-thyroid' | 'add-trh';
export function thyroidFeedback(time: number, intervention: ThyroidIntervention = 'normal') {
  const end = clamp(time, 0, 15),
    dt = 0.01;
  let h = 1,
    s = 1,
    t = 1;
  const points: { time: number; h: number; s: number; t: number }[] = [{ time: 0, h, s, t }];
  for (let at = 0; at < end - 1e-10; at += dt) {
    const step = Math.min(dt, end - at),
      removed = intervention === 'remove-pituitary' || intervention === 'replace-tsh';
    const dh = 2 / (1 + t) - h + (intervention === 'add-trh' ? 1 : 0),
      ds = (removed ? 0 : (2 * h) / (1 + t)) - s + (intervention === 'replace-tsh' ? 0.8 : 0),
      dth = s - t + (intervention === 'extra-thyroid' ? 1 : 0);
    h = Math.max(0, h + dh * step);
    s = Math.max(0, s + ds * step);
    t = Math.max(0, t + dth * step);
    if (Math.round(at / dt) % 10 === 0) points.push({ time: at + step, h, s, t });
  }
  return { h, s, t, points };
}
