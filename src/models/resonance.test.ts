import { describe, it, expect } from 'vitest';
import { resonanceFrame, resonanceAmplitude, resonanceShot } from './resonance';
describe('linear resonance', () => {
  it('starts exactly from rest', () => {
    const f = resonanceFrame({ ratio: 1, damping: 0.08, force: 0.2, initial: 0 }, 0);
    expect(f.x).toBeCloseTo(0, 12);
    expect(f.v).toBeCloseTo(0, 12);
  });
  it('obeys its differential equation', () => {
    const c = { ratio: 0.83, damping: 0.12, force: 0.2, initial: 0.1 },
      t = 2.31,
      h = 1e-5;
    const f = resonanceFrame(c, t),
      a = (resonanceFrame(c, t + h).v - resonanceFrame(c, t - h).v) / (2 * h);
    expect(a + 2 * c.damping * 2 * Math.PI * f.v + (2 * Math.PI) ** 2 * f.x).toBeCloseTo(
      f.applied,
      6,
    );
  });
  it('has a shifted amplitude peak', () => {
    const z = 0.2,
      r = Math.sqrt(1 - 2 * z * z);
    expect(resonanceAmplitude(r, z)).toBeGreaterThan(resonanceAmplitude(1, z));
  });
  it('reconstructs every shot deterministically', () => {
    for (let c = 0; c < 8; c++) {
      const f = resonanceShot(c, 0.53);
      expect(f).toEqual(resonanceShot(c, 0.53));
      expect(Number.isFinite(f.x)).toBe(true);
    }
  });
  it('rejects invalid damping', () =>
    expect(() => resonanceFrame({ ratio: 1, damping: 0, force: 0.2, initial: 0 }, 1)).toThrow());
});
