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
  return {
    stage: Math.max(0, Math.min(2, Math.floor(stage))),
    heavyGreaterThanLight: true,
    combinedSlowerThanHeavy: stage >= 1,
    combinedFasterThanHeavy: stage >= 2,
    contradiction: stage >= 2,
  };
}
export function fallActivityShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: chapter < 2 ? 'paper' : chapter === 2 ? 'reasoning' : 'ruler',
    time: chapter < 2 ? 1.4 * Math.max(0, Math.min(1, (p - 0.1) / 0.7)) : 0,
    logicStage: Math.min(2, Math.floor(p * 3)),
    reaction: chapter === 3 ? 0.18 : 0.26,
    release: Math.max(0, Math.min(1, (p - 0.1) / 0.65)),
  } as const;
}
