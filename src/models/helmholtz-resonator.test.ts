import { describe, expect, it } from 'vitest';
import { helmholtz, helmholtzAir, helmholtzState } from './helmholtz-resonator';
describe('Helmholtz air mass and cavity compliance', () => {
  it('matches the UNSW 1 litre, 3 square centimetre, 5 cm effective-neck benchmark', () => {
    const s = helmholtz({
      volume: 0.001,
      radius: Math.sqrt(0.0003 / Math.PI),
      length: 0.05,
      endFactor: 0,
    });
    expect(s.frequency).toBeCloseTo(133.72, 1);
    expect(s.wavelength).toBeGreaterThan(2.5);
  });
  it('has the independently expected square-root geometric scalings', () => {
    const a = helmholtz({ endFactor: 0 });
    expect(helmholtz({ volume: 0.004, endFactor: 0 }).frequency / a.frequency).toBeCloseTo(0.5, 12);
    expect(helmholtz({ radius: 0.02, endFactor: 0 }).frequency / a.frequency).toBeCloseTo(2, 12);
    expect(helmholtz({ length: 0.12, endFactor: 0 }).frequency / a.frequency).toBeCloseTo(0.5, 12);
  });
  it('obeys Newton acceleration and the independent finite-volume adiabatic pressure limit', () => {
    const s = helmholtzState(0.8),
      dt = 1e-7;
    const before = helmholtzState(0.8 - s.omega * dt),
      after = helmholtzState(0.8 + s.omega * dt);
    expect((after.velocity - before.velocity) / (2 * dt)).toBeCloseTo(s.force / s.mass, 5);
    const exact =
      helmholtzAir.pressure * ((s.V / (s.V + s.area * s.displacement)) ** helmholtzAir.gamma - 1);
    expect(Math.abs((exact - s.pressure) / s.pressure)).toBeLessThan(0.0001);
  });
  it('exchanges energy without changing total and reverses pressure with outward displacement', () => {
    const initial = helmholtzState(0);
    for (let i = 0; i <= 100; i++) {
      const s = helmholtzState((i * Math.PI) / 50);
      expect(s.energy).toBeCloseTo(initial.energy, 15);
      expect(s.pressure * s.displacement).toBeLessThanOrEqual(0);
    }
    expect(helmholtzState(Math.PI / 2).compression).toBeLessThan(1e-30);
    expect(helmholtzState(Math.PI / 2).kinetic).toBeCloseTo(initial.compression, 15);
  });
  it('adds moving air at both neck ends instead of treating the rim as a rigid stop', () => {
    const ideal = helmholtz({ endFactor: 0 }),
      corrected = helmholtz();
    expect(corrected.effectiveLength).toBeCloseTo(0.046, 12);
    expect(corrected.mass / ideal.mass).toBeCloseTo(0.046 / 0.03, 12);
    expect(corrected.frequency / ideal.frequency).toBeCloseTo(Math.sqrt(0.03 / 0.046), 12);
  });
  it('rejects nonphysical input rather than returning invalid geometry', () => {
    for (const o of [{ volume: 0 }, { radius: -1 }, { length: NaN }, { endFactor: -0.1 }])
      expect(() => helmholtz(o)).toThrow(RangeError);
  });
});
