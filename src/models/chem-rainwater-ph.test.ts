import { describe, it, expect } from 'vitest';
import {
  hydrogenActivity,
  nernstSlope,
  rainMeter,
  rainPaper,
  rainClassification,
  aggregateRain,
  rainMeanExample,
  syntheticRainRecords,
  rainDirector,
} from './chem-rainwater-ph';
describe('rain pH evidence', () => {
  it('matches Nernst slope and recovers an affine electrode error from two buffers', () => {
    expect(nernstSlope()).toBeCloseTo(59.15935, 4);
    for (const t of [0, 25, 60])
      for (const p of [4, 4.8, 5.55, 7]) expect(rainMeter(p, true, t).indicated).toBeCloseTo(p, 12);
    expect(rainMeter(5.55, false).indicated).toBeLessThan(5.4);
  });
  it('separates display resolution from an uncertainty interval and reference classification', () => {
    expect(rainPaper(5.55)).toEqual({ display: 6, low: 5.5, high: 6.5 });
    expect(rainClassification(5.5, 6.5)).toBe('unresolved');
    expect(rainClassification(5.4, 5.7)).toBe('unresolved');
    expect(rainClassification(4.5, 5.5)).toBe('below');
    expect(rainClassification(5.6, 5.8)).toBe('above');
  });
  it('pH differences represent logarithmic activity ratios', () => {
    expect(hydrogenActivity(4) / hydrogenActivity(6)).toBeCloseTo(100);
    expect(rainMeanExample(0.5).weightedPH).toBeCloseTo(4.2967086, 6);
    expect(rainMeanExample(0.1).weightedPH).toBeCloseTo(4.9625735, 6);
    expect(rainMeanExample(0.1).meanPH).toBe(5);
  });
  it('excludes missing and invalid samples and refuses an empty aggregate', () => {
    expect(aggregateRain(syntheticRainRecords).count).toBe(6);
    expect(aggregateRain([{ event: 1, ph: 0, amount: 1, valid: false }]).weightedPH).toBeNull();
    expect(rainMeanExample(0).weightedPH).toBe(6);
    expect(rainMeanExample(1).weightedPH).toBe(4);
  });
  it('deterministically seeks reveal counts and clamps input bounds', () => {
    expect(rainDirector(3, 1).visibleEvents).toBe(7);
    expect(rainDirector(3, -1).visibleEvents).toBe(1);
    expect(rainDirector(10, 8).chapter).toBe(4);
  });
});
