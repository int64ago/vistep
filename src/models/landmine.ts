/** Sealed exterior and non-operational observation states. No internal construction,
 * activation conditions, energetic-material data, damage estimates or procedures. */
export type LandmineView = 'hidden' | 'cause' | 'energy' | 'weather' | 'time' | 'unknown' | 'care';
export const LANDMINE_VIEWS: readonly LandmineView[] = [
  'hidden',
  'cause',
  'energy',
  'weather',
  'time',
  'unknown',
  'care',
];
export const LANDMINE_OBJECT = Object.freeze({
  id: 'exterior',
  position: Object.freeze([0, 0, 0] as const),
});
export function landmineUnit(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
export function landmineEase(value: number) {
  const p = landmineUnit(value);
  return p * p * (3 - 2 * p);
}
export function landmineRamp(p: number, start: number, end: number) {
  return landmineEase((p - start) / (end - start));
}
/** Deterministic surface-cover illustration. Elapsed time changes the image, never
 * invents an expired, inert or safe state. No survival/failure probabilities. */
export function landmineWeather(progress: number) {
  const p = landmineUnit(progress);
  const season = p * 3;
  // These are the actual display dimensions consumed by both renderers: grass
  // height multiplier and leaf half-length. They never predict a hazard level.
  const grass = 0.35 + 0.65 * (0.5 - 0.5 * Math.cos(season * Math.PI * 2));
  const leafSize = 0.04 + 0.075 * (0.5 - 0.5 * Math.cos(season * Math.PI * 2 + 1.8));
  return { grass, leafSize, phase: season, object: LANDMINE_OBJECT, safety: 'unknown' as const };
}
export function landmineShot(chapter: number, progress: number) {
  const index = Number.isFinite(chapter) ? Math.max(0, Math.min(6, Math.floor(chapter))) : 0;
  const p = landmineUnit(progress);
  const view = LANDMINE_VIEWS[index];
  const closeup =
    view === 'cause'
      ? landmineRamp(p, 0.02, 0.25)
      : view === 'energy'
        ? 1
        : view === 'unknown'
          ? landmineRamp(p, 0, 0.25)
          : view === 'weather'
            ? 1 - landmineRamp(p, 0, 0.2)
            : view === 'care'
              ? 1 - landmineRamp(p, 0, 0.22)
              : 0;
  const angle =
    view === 'cause'
      ? 0.35 - 0.2 * p
      : view === 'energy'
        ? 0.15 - 0.42 * p
        : view === 'weather'
          ? -0.27 + 0.62 * landmineRamp(p, 0, 0.2)
          : view === 'unknown'
            ? 0.35 - 0.4 * p
            : view === 'care'
              ? -0.05 + 0.4 * landmineRamp(p, 0, 0.22)
              : 0.35;
  const season =
    view === 'weather' || view === 'time' ? p : view === 'unknown' || view === 'care' ? 1 : 0.12;
  return {
    view,
    progress: p,
    object: LANDMINE_OBJECT,
    reveal: view === 'hidden' ? landmineRamp(p, 0.25, 0.63) : 1,
    closeup,
    angle,
    season,
    epoch: Math.min(3, Math.floor(p * 4)),
    // Lesson clock and elapsed seasons contain no evidence of actual safety.
    safety: 'unknown' as const,
  };
}
