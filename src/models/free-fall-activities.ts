import { newtonFall, type FallingObject } from './newton-tube';
export type DropObject = 'sheet' | 'paper-ball' | 'eraser';
export const DROP_OBJECTS: Record<DropObject, FallingObject> = {
  sheet: { mass: 0.005, area: 0.025, dragCoefficient: 1.2 },
  'paper-ball': { mass: 0.005, area: 0.0004, dragCoefficient: 0.6 },
  eraser: { mass: 0.02, area: 0.0007, dragCoefficient: 1.1 },
};
export function paperDrop(kind: DropObject, time: number, density = 1.225) {
  return newtonFall(DROP_OBJECTS[kind], time, density, 1.4);
}
export function reactionDistance(seconds: number, gravity = 9.8) {
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(gravity) || gravity <= 0)
    throw new RangeError('Nonnegative time and positive gravity required.');
  return (gravity * seconds * seconds) / 2;
}
export function reactionTime(metres: number, gravity = 9.8) {
  if (!Number.isFinite(metres) || metres < 0 || !Number.isFinite(gravity) || gravity <= 0)
    throw new RangeError('Nonnegative distance and positive gravity required.');
  return Math.sqrt((2 * metres) / gravity);
}
/** Hypothesis consequences are logical inequalities, not predictions of the true fall model. */
export function tiedStoneArgument(stage: number) {
  if (!Number.isFinite(stage)) throw new RangeError('Finite reasoning stage required.');
  return {
    stage: Math.max(0, Math.min(2, Math.floor(stage))),
    heavyGreaterThanLight: true,
    combinedSlowerThanHeavy: stage >= 1,
    combinedFasterThanHeavy: stage >= 2,
    contradiction: stage >= 2,
  };
}
export function fallActivityShot(chapter: number, progress: number) {
  if (![chapter, progress].every(Number.isFinite))
    throw new RangeError('Finite film position required.');
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: chapter < 2 ? 'paper' : chapter === 2 ? 'reasoning' : 'ruler',
    time: chapter < 2 ? 1.4 * Math.max(0, Math.min(1, (p - 0.1) / 0.7)) : 0,
    logicStage: Math.min(2, Math.floor(p * 3)),
    reaction: chapter === 3 ? 0.18 : 0.26,
    release: Math.max(0, Math.min(1, (p - 0.1) / 0.65)),
  } as const;
}

/** Authored chapter seconds, calibrated against the unchanged recordings. Physical
 * fall time remains a separate clock; the zero-drag case is a new controlled trial. */
export function fallFilmState(chapter: number, seconds: number, locale: 'zh' | 'en') {
  if (![chapter, seconds].every(Number.isFinite))
    throw new RangeError('Finite film position required.');
  const c = Math.max(0, Math.min(4, Math.floor(chapter))),
    t = Math.max(0, seconds);
  const ramp = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const zh = locale === 'zh';
  const vacuum = c === 1 && t >= (zh ? 16.1 : 14.8);
  const time =
    c < 2
      ? 1.4 *
        (vacuum
          ? ramp(zh ? 17 : 15.6, zh ? 20.7 : 19.7)
          : ramp(c === 0 ? (zh ? 5.4 : 4.7) : 1.5, c === 0 ? (zh ? 8.9 : 9.2) : 6.4))
      : 0;
  const logicStage = t < (zh ? 7 : 8) ? 0 : t < (zh ? 13.7 : 14.5) ? 1 : 2;
  const reaction = c === 4 ? 0.1 + 0.1 * ramp(zh ? 5.1 : 6.2, zh ? 7.4 : 8.4) : 0.18;
  return {
    mode: c < 2 ? 'paper' : c === 2 ? 'reasoning' : 'ruler',
    time,
    density: vacuum ? 0 : 1.225,
    showEraser: c === 1,
    logicStage,
    reaction,
    release: c === 3 ? ramp(3.4, zh ? 7.4 : 7.8) : 1,
    scaleComparison: c === 4,
  } as const;
}
