import { describe, expect, it } from 'vitest';
import { mobile5gCover } from './mobile-5g-cover';

describe('mobile-5g cover', () => {
  it('keeps every absolute point inside the 400 × 230 frame with a margin', () => {
    let count = 0;
    for (const s of mobile5gCover().shapes)
      for (const [, x, y] of s.d.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
        count++;
        expect(Number(x)).toBeGreaterThan(8);
        expect(Number(x)).toBeLessThan(392);
        expect(Number(y)).toBeGreaterThan(8);
        expect(Number(y)).toBeLessThan(222);
      }
    expect(count).toBeGreaterThan(300);
  });
  it('draws the carriers with their real resource-block group boundaries', () => {
    const shapes = mobile5gCover().shapes;
    // 25 LTE groups → 24 inner lines, 18 NR groups → 17 inner lines
    expect(shapes.filter((s) => s.stroke === '#1a1c2d' && /v18$/.test(s.d))).toHaveLength(24);
    expect(shapes.filter((s) => s.stroke === '#1a1c2d' && /v34$/.test(s.d))).toHaveLength(17);
  });
});
