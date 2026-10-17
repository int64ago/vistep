import { describe, it, expect } from 'vitest';
import { pulleyState, pulleyGeometry, type PulleySegments } from './pulley';
describe('pulley: one rope, force and distance', () => {
  it('counts supporting strands, not wheels', () => {
    expect(pulleyState(1, 120, 0.2).tension).toBe(120);
    expect(pulleyState(2, 120, 0.2).tension).toBe(60);
    expect(pulleyState(4, 120, 0.2).tension).toBe(30);
  });
  it('preserves the rope length throughout each complete lift', () => {
    for (const n of [1, 2, 4] as PulleySegments[]) {
      const initial = pulleyGeometry(n, 0);
      for (let j = 0; j <= 20; j++) {
        const g = pulleyGeometry(n, j * 0.02);
        expect(g.ropeLength).toBeCloseTo(initial.ropeLength, 10);
        expect(g.freeY - 170).toBeCloseTo(n * (218 - g.lower), 10);
      }
    }
  });
  it('sums support and conserves work', () => {
    for (const n of [1, 2, 4] as PulleySegments[]) {
      const s = pulleyState(n, 120, 0.35);
      expect(s.support).toBe(120);
      expect(s.inputWork).toBeCloseTo(s.outputWork);
    }
  });
  it('accounts for moving block weight rather than losing its lifting work', () => {
    const s = pulleyState(4, 120, 0.35, 40);
    expect(s.tension).toBe(40);
    expect(s.inputWork).toBeCloseTo(s.outputWork + s.blockWork);
  });
  it('retains finite zero-load and rejects impossible input', () => {
    expect(pulleyState(4, 0, 0.4).tension).toBe(0);
    expect(() => pulleyState(3 as PulleySegments, 120, 0.1)).toThrow();
    expect(() => pulleyState(2, 120, -1)).toThrow();
  });
});
