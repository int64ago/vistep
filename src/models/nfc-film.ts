export type NfcView = 'tap' | 'induction' | 'power' | 'request' | 'load' | 'reply' | 'coupling';
const smooth = (v: number) => {
  const p = Math.max(0, Math.min(1, v));
  return p * p * (3 - 2 * p);
};
const ramp = (p: number, start: number, end: number) => smooth((p - start) / (end - start));
const views: NfcView[] = ['tap', 'induction', 'power', 'request', 'load', 'reply', 'coupling'];

/** Chapter-relative and deterministic: seeking selects the entire teaching state. */
export function nfcShot(chapter: number, progress: number, time: number) {
  if (![chapter, progress, time].every(Number.isFinite))
    throw new RangeError('Finite film position required');
  const c = Math.max(0, Math.min(6, Math.floor(chapter)));
  const p = Math.max(0, Math.min(1, progress));
  let gapMm = 8,
    tiltDeg = 0;
  if (c === 0) gapMm = 60 - 52 * ramp(p, 0.08, 0.48);
  if (c === 6) {
    // Restore the same geometry before the second controlled comparison.
    gapMm = 8 + 52 * (ramp(p, 0.04, 0.2) - ramp(p, 0.31, 0.42));
    tiltDeg = 80 * (ramp(p, 0.44, 0.56) - ramp(p, 0.64, 0.75));
  }
  return {
    view: views[c],
    gapMm,
    tiltDeg,
    fieldOn: true,
    phase: Math.max(0, time) * Math.PI * 0.65,
    reveal: c === 0 ? ramp(p, 0.52, 0.78) : 1,
    loadOn: c === 4 && ((p >= 0.23 && p < 0.44) || p >= 0.64),
    packetProgress: ramp(p, 0.08, 0.8),
  };
}

/** Ideal full-wave rectifier + capacitor, isolated teaching model. No diode loss,
 * source resistance or nonlinear chip current; not a prediction of the RF tag supply. */
export function nfcRectifierTrace(samples = 361, cycles = 3, tauCycles = 0.8) {
  if (
    !Number.isInteger(samples) ||
    samples < 2 ||
    !Number.isFinite(cycles) ||
    cycles <= 0 ||
    !Number.isFinite(tauCycles) ||
    tauCycles <= 0
  )
    throw new RangeError('Invalid rectifier trace');
  const dt = cycles / (samples - 1),
    decay = Math.exp(-dt / tauCycles);
  let stored = 0;
  return Array.from({ length: samples }, (_, i) => {
    const t = i * dt,
      ac = Math.sin(t * Math.PI * 2),
      rectified = Math.abs(ac);
    const discharged = stored * decay;
    const conducting = rectified > 0 && rectified >= discharged;
    stored = Math.max(rectified, discharged);
    return { t, ac, rectified, stored, conducting };
  });
}
