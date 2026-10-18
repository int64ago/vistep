import { describe, it, expect } from 'vitest';
import {
  compressionFire,
  jouleCalorimeter,
  cloudBottle,
  rumfordHeating,
} from './thermodynamic-work-lab';
describe('work and internal energy apparatuses', () => {
  it('obeys adiabatic pV^gamma and separates isothermal heat loss', () => {
    const a = compressionFire(0),
      b = compressionFire(1);
    expect(b.pressure * b.volume ** 1.4).toBeCloseTo(a.pressure * a.volume ** 1.4, 10);
    expect(b.heat).toBe(0);
    expect(b.temperature).toBeGreaterThan(700);
    const slow = compressionFire(1, false);
    expect(slow.internalChange).toBe(0);
    expect(slow.heat).toBeCloseTo(-slow.work, 12);
  });
  it('gives the same final rise for equal mgh through either mechanical or electrical work', () => {
    const a = jouleCalorimeter(1, 10, 1, 12),
      b = jouleCalorimeter(1, 5, 2, 24);
    expect(a.temperature).toBeCloseTo(b.temperature, 12);
    expect(a.work).toBeCloseTo(a.electricalEnergy, 12);
    expect(a.current).toBeGreaterThan(b.current);
  });
  it('uses an open-tank blowdown relation rather than constant-mass pV work', () => {
    const a = cloudBottle(0),
      b = cloudBottle(1);
    expect(b.temperature).toBeLessThan(a.temperature);
    expect(b.remainingMassFraction).toBeLessThan(1);
    expect(b.pressure / b.temperature / (a.pressure / a.temperature)).toBeCloseTo(
      b.remainingMassFraction,
      12,
    );
    expect(b.fog).toBeGreaterThan(0);
  });
  it('accounts for latent heat after the water reaches boiling', () => {
    const s = rumfordHeating(4000);
    expect(s.temperature).toBe(100);
    expect((s.temperature - 20) * 4300 + s.evaporated * 2256000).toBeCloseTo(s.work, 8);
    expect(rumfordHeating(4000, 0).temperature).toBe(20);
  });
});
