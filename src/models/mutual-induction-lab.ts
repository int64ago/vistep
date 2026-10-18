/** Open-circuit mutual induction. Secondary meter/receiver loading is neglected. */
export type MutualMode = 'ring' | 'audio';
export function mutualResponse(
  current: number,
  derivative: number,
  coupling = 0.8,
  l1 = 0.4,
  l2 = 0.1,
) {
  if (![current, derivative, coupling, l1, l2].every(Number.isFinite) || l1 < 0 || l2 < 0)
    throw new RangeError('Finite current and nonnegative inductances required');
  const k = Math.max(0, Math.min(1, coupling));
  const mutual = k * Math.sqrt(l1) * Math.sqrt(l2);
  if (!Number.isFinite(mutual * current) || !Number.isFinite(mutual * derivative))
    throw new RangeError('Response exceeds numeric range');
  return {
    current,
    derivative,
    mutual,
    fluxLinkage: mutual * current,
    emf: derivative === 0 ? 0 : -mutual * derivative,
  };
}
export function ringResponse(time: number, action: 'close' | 'steady' | 'open') {
  if (!Number.isFinite(time)) throw new RangeError('Finite time required');
  const t = Math.max(0, time),
    tau = 0.12,
    maximum = 1.5;
  const decay = Math.exp(-t / tau);
  const current =
    action === 'steady' ? maximum : action === 'close' ? maximum * (1 - decay) : maximum * decay;
  const derivative =
    action === 'steady' ? 0 : (((action === 'close' ? 1 : -1) * maximum) / tau) * decay;
  return { ...mutualResponse(current, derivative), time: t, action };
}
export function audioResponse(time: number, insertion = 0.9, frequency = 440) {
  if (![time, insertion, frequency].every(Number.isFinite) || frequency < 0)
    throw new RangeError('Finite signal and nonnegative frequency required');
  const overlap = Math.max(0, Math.min(1, insertion));
  // A stated coupling model, not a finite-element field solution.
  const coupling = 0.04 + 0.84 * overlap;
  const w = 2 * Math.PI * Math.max(0, frequency),
    amplitude = 0.025;
  return {
    ...mutualResponse(
      amplitude * Math.sin(w * time),
      amplitude * w * Math.cos(w * time),
      coupling,
      0.012,
      0.03,
    ),
    insertion: overlap,
    frequency,
    time,
  };
}
export function mutualShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const mode: MutualMode = chapter < 3 ? 'ring' : 'audio';
  return {
    mode,
    action: (chapter === 0 ? 'close' : chapter === 1 ? 'steady' : 'open') as
      'close' | 'steady' | 'open',
    time: mode === 'ring' ? p * 0.85 : (p * 6) / 440,
    insertion: chapter === 4 ? 0.12 : 0.9,
  };
}

/** Measured narration holds; seconds here are editorial, not physical time. */
export function mutualFilmShot(chapter: number, seconds: number, locale: 'zh' | 'en' = 'zh') {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const en = locale === 'en';
  const phase = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const mode: MutualMode = chapter < 3 ? 'ring' : 'audio';
  let time = 0;
  if (chapter === 0) time = 0.85 * phase(en ? 3.6 : 4.3, en ? 12.7 : 14.8);
  if (chapter === 1) time = 0.85;
  if (chapter === 2) time = 0.85 * phase(0.7, en ? 10.6 : 14.1);
  if (chapter === 3) {
    // Traverse several cycles, hold derivative maximum, then current maximum.
    const start = en ? 8.2 : 7.8,
      max = en ? 11 : 10,
      quarter = en ? 14.3 : 14.2;
    const cycles = t < max ? 3 * phase(start, max) : 3 + 0.25 * phase(quarter, quarter + 1.3);
    time = cycles / 440;
  }
  if (chapter === 4) time = (3 + 3 * phase(3.8, 14.5)) / 440;
  return {
    mode,
    action: (chapter === 1 ? 'steady' : chapter === 2 ? 'open' : 'close') as
      'close' | 'steady' | 'open',
    time,
    beforeSwitch: chapter === 0 && t < (en ? 3.6 : 4.3),
    moving: chapter === 4 && t > 0.6 && t < 3.6,
    // Comparison uses only stationary coil positions. During the transition
    // geometry moves, but this declared model does not include motional emf.
    insertion: chapter === 4 ? 0.9 - 0.78 * phase(0.6, 3.6) : 0.9,
  };
}
