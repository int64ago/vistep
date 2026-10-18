import { describe, it, expect } from 'vitest';
import {
  pancreaticEvidence,
  graftEvidence,
  embryoEvidence,
  glucoseFeedback,
  thyroidFeedback,
} from './bio-endocrine-evidence';
describe('endocrine interventions and feedback', () => {
  it('keeps subtraction and rescue distinct from an unchanged control', () => {
    expect(pancreaticEvidence(1, 'intact').glucose).toBe(1);
    expect(pancreaticEvidence(1, 'removed').glucose).toBeGreaterThan(2);
    expect(pancreaticEvidence(1, 'extract').glucose).toBeLessThan(1.1);
    expect(graftEvidence(1, 'graft').combSize).toBeGreaterThan(
      graftEvidence(1, 'removed').combSize,
    );
  });
  it('reproduces the textbook rabbit comparison without changing chromosomes', () => {
    for (const c of ['XX', 'XY'] as const) {
      expect(embryoEvidence(c, false).externalPattern).toBe('female');
      expect(embryoEvidence(c, false, true)).toMatchObject({
        chromosomes: c,
        externalPattern: 'male',
      });
    }
    expect(embryoEvidence('XY', true).externalPattern).toBe('male');
  });
  it('checks glucose against an independent source/sink inventory', () => {
    const f = glucoseFeedback(8);
    expect(f.glucose - 1).toBeCloseTo(f.absorbed + f.produced - f.used, 10);
    expect(glucoseFeedback(12, 0).glucose).toBeCloseTo(1, 10);
    expect(f.glucose).toBeLessThan(glucoseFeedback(8, 1, false).glucose);
    const fast = glucoseFeedback(8, 0, true, true);
    expect(fast.glucagon).toBeGreaterThan(0);
    expect(fast.glucose).toBeGreaterThan(glucoseFeedback(8, 0, false, true).glucose);
    expect(fast.glucose - 1).toBeCloseTo(fast.absorbed + fast.produced - fast.used, 10);
  });
  it('preserves the exact thyroid equilibrium and known intervention directions', () => {
    const control = thyroidFeedback(10);
    expect(control.h).toBe(1);
    expect(control.s).toBe(1);
    expect(control.t).toBe(1);
    expect(thyroidFeedback(15, 'remove-pituitary').s).toBeCloseTo(Math.exp(-15), 6);
    expect(thyroidFeedback(15, 'replace-tsh').t).toBeGreaterThan(
      thyroidFeedback(15, 'remove-pituitary').t,
    );
    expect(thyroidFeedback(15, 'extra-thyroid').s).toBeLessThan(1);
    expect(thyroidFeedback(15, 'add-trh').s).toBeGreaterThan(1);
  });
});
