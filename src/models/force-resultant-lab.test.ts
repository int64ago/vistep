import { describe, it, expect } from 'vitest';
import { resultantExperiment, vectorSum, resultantFilmState } from './force-resultant-lab';
describe('equivalent replacement with an elastic strip', () => {
  it('independent symmetric reference gives each force R/(2cos angle)', () => {
    const s = resultantExperiment(60, 60, 0.3);
    expect(s.required).toBeCloseTo(3);
    expect(s.leftForce).toBeCloseTo(3);
    expect(s.rightForce).toBeCloseTo(3);
  });
  it('the two measured vectors balance exactly the same elastic strip as the single force', () => {
    for (const a of [20, 35, 65])
      for (const b of [20, 50, 65]) {
        const s = resultantExperiment(a, b);
        expect(s.sum.x).toBeCloseTo(0, 12);
        expect(s.sum.y + s.elastic.y).toBeCloseTo(0, 12);
      }
  });
  it('changing directions changes individual readings without moving the target point', () => {
    const a = resultantExperiment(25, 45),
      b = resultantExperiment(55, 45);
    expect(a.ring).toEqual(b.ring);
    expect(a.required).toBe(b.required);
    expect(a.leftForce).not.toBeCloseTo(b.leftForce);
  });
  it('vector sum is the parallelogram diagonal, not the scalar sum', () => {
    const s = resultantExperiment();
    expect(vectorSum(s.left, s.right)).toEqual(s.sum);
    expect(s.leftForce + s.rightForce).toBeGreaterThan(s.required);
  });
  it('changing the target extension changes the required single and paired forces', () => {
    const a = resultantExperiment(35, 50, 0.25),
      b = resultantExperiment(35, 50, 0.35);
    expect(b.required).toBeCloseTo(2 * a.required);
    expect(b.leftForce).toBeCloseTo(2 * a.leftForce);
  });
  it('constructs the two vectors before revealing their diagonal', () => {
    for (const [locale, before, after] of [
      ['en', 8.5, 11],
      ['zh', 12.5, 15],
    ] as const) {
      const a = resultantFilmState(2, before, locale),
        b = resultantFilmState(2, after, locale);
      expect(a.sides).toBe(1);
      expect(a.parallels).toBe(1);
      expect(a.diagonal).toBe(0);
      expect(b.diagonal).toBe(1);
    }
  });
  it('the final comparison replaces one force with a new pair without moving the target', () => {
    for (const locale of ['en', 'zh'] as const) {
      const a = resultantFilmState(3, 0, locale),
        b = resultantFilmState(3, 20, locale);
      expect(a.mode).toBe('one');
      expect(b.mode).toBe('two');
      const first = resultantExperiment(a.leftAngle),
        last = resultantExperiment(b.leftAngle);
      expect(first.ring).toEqual(last.ring);
      expect(first.required).toBe(last.required);
      expect(first.leftForce).not.toBe(last.leftForce);
    }
  });
});
