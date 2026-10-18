import { describe, it, expect } from 'vitest';
import {
  harmonicMode,
  drivenMode,
  transmission,
  absorbance,
  infraredTrace,
  beamWave,
} from './chem-infrared-structure';
describe('infrared model', () => {
  it('uses reduced mass and preserves centre of mass during the stretch', () => {
    const h = harmonicMode('oh'),
      d = harmonicMode('od');
    expect(d.wavenumber / h.wavenumber).toBeCloseTo(Math.sqrt(h.mu / d.mu));
    for (let i = 0; i < 100; i++) {
      const a = drivenMode('oh', h.wavenumber, i / 10);
      expect(a.m1 * a.left + a.m2 * a.right).toBeCloseTo(16 * 150 + 225);
    }
  });
  it('requires a changing dipole, not only a resonant frequency', () => {
    const n = harmonicMode('nitrogen'),
      v = drivenMode('nitrogen', n.wavenumber, 1);
    expect(v.absorption).toBe(0);
    expect(v.response).toBe(0);
    expect(v.displacement).not.toBe(0);
    expect(drivenMode('oh', harmonicMode('oh').wavenumber, 1).absorption).toBeCloseTo(1);
  });
  it('conserves optical intensity and uses the square root for field amplitude', () => {
    for (const sample of ['ethanol', 'ether'] as const)
      for (let wn = 500; wn <= 4000; wn += 20) {
        const a = transmission(sample, wn, 2, 0.1);
        expect(a.T + a.absorbed).toBeCloseTo(1);
        expect(a.fieldRatio * a.fieldRatio).toBeCloseTo(a.T);
        expect(a.T).toBeGreaterThan(0);
      }
    expect(transmission('ethanol', 3350, 0, 0).T).toBe(1);
  });
  it('has no intrinsic OH band in ether but water produces a confounding band', () => {
    expect(absorbance('ether', 3350)).toBeLessThan(0.001);
    expect(absorbance('ethanol', 3350)).toBeGreaterThan(1);
    expect(absorbance('ether', 3350, 1, 1)).toBeGreaterThan(1);
    expect(absorbance('ethanol', 3350, 2)).toBeCloseTo(2 * absorbance('ethanol', 3350));
  });
  it('scans high to low wavenumber and does not draw unmeasured points', () => {
    const a = infraredTrace('ethanol', 1, 0, 3000);
    expect(a[0].wn).toBe(4000);
    expect(a.at(-1)?.wn).toBe(3000);
    expect(a[0].x).toBeLessThan(a.at(-1)!.x);
    expect(beamWave(1, 0, 0.5).at(-1)?.x).toBeLessThanOrEqual(160);
  });
});
