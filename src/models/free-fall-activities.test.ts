import { describe, it, expect } from 'vitest';
import {
  paperDrop,
  reactionDistance,
  reactionTime,
  tiedStoneArgument,
  DROP_OBJECTS,
} from './free-fall-activities';
describe('free-fall activities', () => {
  it('preserves paper mass while changing drag area', () => {
    expect(DROP_OBJECTS.sheet.mass).toBe(DROP_OBJECTS['paper-ball'].mass);
    expect(paperDrop('sheet', 0.5).distance).toBeLessThan(paperDrop('paper-ball', 0.5).distance);
  });
  it('all shapes share the vacuum benchmark', () => {
    expect(paperDrop('sheet', 0.4, 0).distance).toBeCloseTo(0.784, 12);
    expect(paperDrop('sheet', 0.4, 0)).toEqual(paperDrop('eraser', 0.4, 0));
  });
  it('maps200ms to19.6cm and back, with a nonlinear scale', () => {
    expect(reactionDistance(0.2)).toBeCloseTo(0.196, 12);
    expect(reactionTime(0.196)).toBeCloseTo(0.2, 12);
    expect(reactionDistance(0.3) / reactionDistance(0.1)).toBeCloseTo(9, 12);
  });
  it('rejects negative measurement inputs', () => {
    expect(() => reactionTime(-0.1)).toThrow();
    expect(reactionTime(0)).toBe(0);
  });
  it('keeps the contradiction explicitly outside the real dynamics', () => {
    expect(tiedStoneArgument(0).contradiction).toBe(false);
    expect(tiedStoneArgument(2)).toMatchObject({
      combinedSlowerThanHeavy: true,
      combinedFasterThanHeavy: true,
      contradiction: true,
    });
  });
});
