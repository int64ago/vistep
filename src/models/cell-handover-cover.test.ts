import { describe, expect, it } from 'vitest';
import { cellHandoverCover } from './cell-handover-cover';

describe('cell handover cover', () => {
  const cover = cellHandoverCover();
  it('traces model boundaries and the served street inside the frame', () => {
    expect(cover.boundaries.length).toBeGreaterThan(200);
    expect(cover.boundaries.length).toBeLessThan(40000);
    expect(cover.trail.length).toBeGreaterThanOrEqual(5);
    const numbers = cover.boundaries.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(numbers.every(Number.isFinite)).toBe(true);
    const [x, y] = cover.phone.at;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(400);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(230);
    expect(cover.sites.length).toBeGreaterThan(5);
  });
});
