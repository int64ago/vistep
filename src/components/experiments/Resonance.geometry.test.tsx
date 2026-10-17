import { describe, expect, it } from 'vitest';
import { resonanceProjection } from './Resonance';
import { resonanceFrame } from '../../models/resonance';
describe('resonance complete moving bounds', () => {
  it('keeps the cart and applied-force segment in frame and the spring in front of its wall', () => {
    for (const width of [246, 316, 360, 560, 900]) {
      const p = resonanceProjection(width);
      let left = Infinity,
        right = -Infinity,
        forceLeft = Infinity,
        forceRight = -Infinity;
      for (const ratio of [0.2, 0.8, 0.95, 1, 1.05, 1.5, 2]) {
        for (const damping of [0.03, 0.08, 0.35]) {
          for (let t = 0; t <= 25; t += 0.05) {
            const f = resonanceFrame({ ratio, damping, force: 0.2, initial: 0 }, t);
            const x = p.rest + p.scale * f.x;
            left = Math.min(left, x - 30);
            right = Math.max(right, x + 30);
            forceLeft = Math.min(forceLeft, x, x + f.applied * 2.5);
            forceRight = Math.max(forceRight, x, x + f.applied * 2.5);
          }
        }
      }
      expect(left).toBeGreaterThan(32);
      expect(right).toBeLessThan(width - 12);
      expect(forceLeft).toBeGreaterThan(12);
      expect(forceRight).toBeLessThan(width - 12);
    }
  });
});
