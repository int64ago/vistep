import { describe, it, expect } from 'vitest';
import { sealedBowls, inferSealTemperature } from './magdeburg-bowls-lab';
describe('sealed hot bowls', () => {
  it('has no pressure difference at sealing or after venting', () => {
    expect(sealedBowls(149.5).holding).toBe(0);
    expect(sealedBowls(15, 149.5, 0.1, 0, true).holding).toBe(0);
  });
  it('uses projected area and the pull on one side, not both summed', () => {
    const t = inferSealTemperature()!;
    expect(sealedBowls(15, t).holding).toBeCloseTo(1000, 9);
    expect(sealedBowls(15, t).people).toBeCloseTo(5, 9);
  });
  it('scales holding force with radius squared and rejects impossible inverse data', () => {
    expect(sealedBowls(15, 149.5, 0.2).holding / sealedBowls(15).holding).toBeCloseTo(4, 12);
    expect(inferSealTemperature(4000)).toBeNull();
  });
});
