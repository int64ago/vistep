import { describe, it, expect } from 'vitest';
import { jouleCalorimeter, eggCooling, glowingIron, ironSpectrum } from './thermal-process-lab';
describe('thermal processes', () => {
  it('current square and resistance factors at equal time; lossless analytic limit', () => {
    const a = jouleCalorimeter(2, 4, 120, 0);
    expect(jouleCalorimeter(4, 4, 120, 0).input / a.input).toBe(4);
    expect(jouleCalorimeter(2, 8, 120, 0).input / a.input).toBe(2);
    expect(a.temperature).toBeCloseTo(23.2);
  });
  it('input equals stored energy plus environmental loss and zero current has no warming', () => {
    const a = jouleCalorimeter(2, 4, 120);
    expect(a.stored + a.loss).toBeCloseTo(a.input, 10);
    expect(a.loss).toBeGreaterThan(0);
    expect(jouleCalorimeter(0, 4, 120).temperature).toBe(20);
  });
  it('egg-water energy is conserved and equilibrium matches capacity weighting', () => {
    const a = eggCooling(300);
    expect(a.eggCapacity * (a.egg - 90) + a.waterCapacity * (a.water - 20)).toBeCloseTo(0, 9);
    const b = eggCooling(10000);
    expect(b.egg).toBeCloseTo(b.equilibrium, 9);
    expect(b.water).toBeCloseTo(b.equilibrium, 9);
  });
  it('heat follows temperature difference, total entropy increases and equal temperatures stay equal', () => {
    expect(eggCooling(60).entropy).toBeGreaterThan(0);
    expect(eggCooling(120).entropy).toBeGreaterThan(eggCooling(60).entropy);
    expect(eggCooling(60, 0.2, 20, 90).rate).toBeLessThan(0);
    const a = eggCooling(300, 0.2, 30, 30);
    expect(a.egg).toBe(30);
    expect(a.water).toBe(30);
    expect(a.rate).toBe(0);
  });
  it('spectrum peak shifts inversely with kelvin and visible fraction grows while peak remains infrared', () => {
    const a = glowingIron(600),
      b = glowingIron(1200);
    expect(a.peak / b.peak).toBe(2);
    expect(b.power / a.power).toBe(16);
    expect(b.visibleFraction).toBeGreaterThan(a.visibleFraction);
    expect(glowingIron(1750).peak).toBeGreaterThan(780e-9);
    expect(Math.max(...ironSpectrum(1200).map((p) => p.value))).toBeGreaterThan(0.999);
  });
});
