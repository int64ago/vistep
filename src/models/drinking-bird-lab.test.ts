import { describe, it, expect } from 'vitest';
import {
  drinkingBirdHistory,
  birdMilestones,
  birdSurface,
  birdVapourPressure,
} from './drinking-bird-lab';
describe('drinking bird reduced mechanism', () => {
  it('requires evaporative cooling: a dry head or saturated air does not lift liquid', () => {
    for (const a of [drinkingBirdHistory(40, 0.4, false), drinkingBirdHistory(40, 1, true)]) {
      expect(Math.max(...a.map((s) => s.column))).toBe(0);
      expect(Math.max(...a.map((s) => s.angle))).toBeLessThan(0.05);
    }
    expect(birdVapourPressure(292)).toBeLessThan(birdVapourPressure(293.15));
  });
  it('conserves working-liquid volume as the column rises', () => {
    const vol = (z: number) => Math.PI * (z + 0.022) ** 2 * (0.022 - (z + 0.022) / 3);
    for (const h of [0, 0.04, 0.1, 0.145])
      expect(vol(birdSurface(h)) + 8e-6 * h).toBeCloseTo(vol(-0.006), 12);
  });
  it('vents when the rotating tube opening emerges and returns upright before a second dip', () => {
    const states = drinkingBirdHistory(60),
      m = birdMilestones(states);
    expect(m.rise).toBeLessThan(m.tilt);
    expect(m.tilt).toBeLessThan(m.dip);
    expect(m.dip).toBeLessThan(m.reset);
    expect(m.reset).toBeLessThan(m.nextDip);
    const v = states.findIndex((s) => s.venting);
    expect(v).toBeGreaterThan(1);
    const prev = states[v - 1];
    expect(-0.012 * Math.cos(prev.angle)).toBeGreaterThanOrEqual(prev.surface);
  });
  it('higher relative humidity delays the first dip', () => {
    expect(birdMilestones(drinkingBirdHistory(60, 0.7)).dip).toBeGreaterThan(
      birdMilestones(drinkingBirdHistory(60, 0.4)).dip,
    );
  });
});
