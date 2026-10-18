import { describe, it, expect } from 'vitest';
import {
  chlorineGasTrain,
  pipePosition,
  chlorineDiscoveryDirector,
} from './chem-chlorine-discovery';
describe('collection and tail-gas accounting', () => {
  it('conserves chlorine across the collector and absorber', () => {
    for (const q of [0, 0.1, 1, 4])
      for (const cap of [0, 1, 8]) {
        const m = chlorineGasTrain(q, cap);
        expect(m.collected + m.absorbed + m.unabsorbed).toBeCloseTo(q);
        expect(m.chlorineAtoms).toBeCloseTo(2 * q);
      }
  });
  it('saturates the collection composition without making later input disappear', () => {
    const m = chlorineGasTrain(4);
    expect(m.collected).toBeCloseTo(1 - Math.exp(-4));
    expect(m.tail).toBeGreaterThan(3);
    expect(m.unabsorbed).toBe(0);
  });
  it('uses two hydroxides per captured chlorine and exposes insufficient capacity', () => {
    const m = chlorineGasTrain(4, 1);
    expect(m.absorbed).toBe(0.5);
    expect(m.remainingOH).toBe(0);
    expect(m.chloride).toBe(m.hypochlorite);
    expect(m.unabsorbed).toBeGreaterThan(0);
  });
  it('derives tracked dots from actual piecewise tube geometry', () => {
    expect(
      pipePosition(
        [
          [0, 0],
          [30, 0],
          [30, 40],
        ],
        0.5,
      ),
    ).toEqual({ x: 30, y: 5 });
    expect(chlorineDiscoveryDirector(3, 0).throughput).toBe(2);
  });
});
