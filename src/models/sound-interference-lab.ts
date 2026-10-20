/** Two coherent spherical pressure waves in an ideal reflection-free field.
 * Distances m, frequency Hz, phases rad. Pressure is relative, not Pa.
 * meanSquare is normalized to the cycle mean at (0,0), 680 Hz, in phase.
 * It is NOT active acoustic intensity (a pressure–particle-velocity product).
 */
export const SOUND_SPEED = 340;
export const SOUND_SOURCES = Object.freeze([-2, 2] as const);
const TAU = 2 * Math.PI;
const finite = (n: number, fallback: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : fallback));
export function soundInterferencePoint(
  x: number,
  y: number,
  frequency = 680,
  sourcePhase = 0,
  secondOn = true,
) {
  x = finite(x, 0, -20, 20);
  y = finite(y, 0, -20, 20);
  frequency = finite(frequency, 680, 20, 20000);
  sourcePhase = finite(sourcePhase, 0, -TAU, TAU);
  const k = (TAU * frequency) / SOUND_SPEED,
    // Guard the excluded near-source domain; UI receivers stay at least 0.8 m away.
    r1 = Math.max(0.15, Math.hypot(x + 2, y)),
    r2 = Math.max(0.15, Math.hypot(x - 2, y)),
    a = 1 / r1,
    b = secondOn ? 1 / r2 : 0,
    phase1 = -k * r1,
    phase2 = sourcePhase - k * r2,
    re = a * Math.cos(phase1) + b * Math.cos(phase2),
    im = a * Math.sin(phase1) + b * Math.sin(phase2),
    meanSquare = re * re + im * im;
  return {
    x,
    y,
    frequency,
    sourcePhase,
    secondOn,
    r1,
    r2,
    a,
    b,
    phase1,
    phase2,
    wavelength: SOUND_SPEED / frequency,
    pathDifference: r2 - r1,
    phaseDifference: phase2 - phase1,
    re,
    im,
    amplitude: Math.hypot(re, im),
    meanSquare,
    /** Compatibility alias for old cover consumers. Not a physical energy-flux claim. */
    intensity: meanSquare,
  };
}
export type SoundPoint = ReturnType<typeof soundInterferencePoint>;
/** One common, slowed phase clock; 1 displayed cycle = 1 acoustic period, not 1 second. */
export function soundPressureAt(point: SoundPoint, cycles: number) {
  const theta = TAU * finite(cycles, 0, -1e6, 1e6),
    p1 = point.a * Math.cos(theta + point.phase1),
    p2 = point.b * Math.cos(theta + point.phase2);
  return { p1, p2, sum: p1 + p2 };
}
/** Pressure phase along an individual source-to-receiver ray. The two strips share metres. */
export function soundPathPressure(
  distance: number,
  frequency: number,
  cycles: number,
  sourcePhase = 0,
) {
  const f = finite(frequency, 680, 20, 20000),
    r = finite(distance, 0, 0, 40);
  return Math.cos(
    TAU * finite(cycles, 0, -1e6, 1e6) -
      (TAU * f * r) / SOUND_SPEED +
      finite(sourcePhase, 0, -TAU, TAU),
  );
}
export function soundFlagTargets(frequency = 680, sourcePhase = 0) {
  return Array.from({ length: 12 }, (_, i) => {
    const group: 'loud' | 'quiet' = i < 6 ? 'loud' : 'quiet',
      j = i % 6,
      x0 = ((j % 3) - 1) * 0.75 + (group === 'quiet' ? 0.1 : 0),
      y = group === 'loud' ? (j < 3 ? -0.8 : 0.8) : j < 3 ? -0.3 : 0.3;
    let best = x0,
      bestValue = soundInterferencePoint(x0, y, frequency, sourcePhase).meanSquare;
    for (let n = 0; n <= 320; n++) {
      const x = x0 - 0.16 + n * 0.001,
        v = soundInterferencePoint(x, y, frequency, sourcePhase).meanSquare;
      if (group === 'loud' ? v > bestValue : v < bestValue) {
        best = x;
        bestValue = v;
      }
    }
    return { id: i, group, x0, y, target: best, meanSquare: bestValue, intensity: bestValue };
  });
}
export const SOUND_OLD_FLAGS = Object.freeze(soundFlagTargets(680).map((f) => Object.freeze(f)));
export function soundIntensityField(
  frequency: number,
  width = 100,
  height = 72,
  sourcePhase = 0,
  secondOn = true,
) {
  width = Math.round(finite(width, 100, 1, 256));
  height = Math.round(finite(height, 72, 1, 256));
  return Float32Array.from({ length: width * height }, (_, i) => {
    const x = (((i % width) + 0.5) / width - 0.5) * 3.4722,
      y = ((Math.floor(i / width) + 0.5) / height - 0.5) * 2.5;
    return soundInterferencePoint(x, y, frequency, sourcePhase, secondOn).meanSquare;
  });
}
export type SoundView = 'paths' | 'pressure' | 'field';
export const SOUND_PLANNED_DURATIONS = [26, 34, 26, 30] as const;
const ramp = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const ease = (p: number) => p * p * (3 - 2 * p);
/** Measured cue-local word times plus the 0.45 s voice lead-in; no audio is retimed. */
export const SOUND_MEASURED_CUTS = Object.freeze({
  zh: Object.freeze({
    secondOn: 3.63,
    paths: 4.91,
    moveStart: 0.65,
    moveEnd: 3.65,
    pressure: 4.51,
    searchStart: 4.05,
    searchEnd: 10.09,
    frequencyStart: 4.21,
    frequencyEnd: 10.71,
  }),
  en: Object.freeze({
    secondOn: 4.03,
    paths: 5.21,
    moveStart: 0.65,
    moveEnd: 2.71,
    pressure: 4.65,
    searchStart: 3.63,
    searchEnd: 12.27,
    frequencyStart: 4.39,
    frequencyEnd: 10.93,
  }),
});
export function soundDirector(chapter: number, chapterTime: number, locale: 'zh' | 'en' = 'zh') {
  const ch = Math.floor(finite(chapter, 0, 0, 3)),
    time = finite(chapterTime, 0, 0, SOUND_PLANNED_DURATIONS[ch] ?? 26);
  const selected = SOUND_OLD_FLAGS[7]!,
    cuts = SOUND_MEASURED_CUTS[locale];
  let view: SoundView = 'paths',
    x = 0.125,
    y = 0,
    frequency = 680,
    search = 0,
    question = false;
  if (ch === 0) {
    view = time < cuts.paths ? 'field' : 'paths';
  }
  if (ch === 1) {
    view = time < cuts.pressure ? 'field' : 'pressure';
    x = 0.125 * ease(ramp(time, cuts.moveStart, cuts.moveEnd));
  }
  if (ch === 2) {
    view = 'field';
    search = ease(ramp(time, cuts.searchStart, cuts.searchEnd));
  }
  if (ch === 3) {
    view = 'field';
    x = selected.target;
    y = selected.y;
    search = 1;
    frequency = 680 - 340 * ease(ramp(time, cuts.frequencyStart, cuts.frequencyEnd));
    question = time < cuts.frequencyStart;
  }
  return {
    chapter: ch,
    time,
    view,
    x,
    y,
    frequency,
    search,
    showFlags: ch >= 2,
    secondOn: ch !== 0 || time >= cuts.secondOn,
    question,
    changed: ch === 3 && time >= cuts.frequencyEnd,
    cycles: time / 4,
    // Selection itself is present from the beginning; the new-condition answer is not.
    selectedFlag: ch === 3 ? selected.id : null,
  };
}
