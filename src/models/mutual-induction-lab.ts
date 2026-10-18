/** Open-circuit mutual induction. Secondary meter/receiver loading is neglected. */
export type MutualMode = 'ring' | 'audio';
export function mutualResponse(
  current: number,
  derivative: number,
  coupling = 0.8,
  l1 = 0.4,
  l2 = 0.1,
) {
  const k = Math.max(0, Math.min(1, coupling));
  const mutual = k * Math.sqrt(Math.max(0, l1 * l2));
  return {
    current,
    derivative,
    mutual,
    fluxLinkage: mutual * current,
    emf: derivative === 0 ? 0 : -mutual * derivative,
  };
}
export function ringResponse(time: number, action: 'close' | 'steady' | 'open') {
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
