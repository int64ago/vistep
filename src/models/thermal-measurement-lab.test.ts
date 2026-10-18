import { describe, it, expect } from 'vitest';
import { mixingCalorimeter, syringeGas, flaskPlug } from './thermal-measurement-lab';
describe('thermal measurements', () => {
  it('conserves calorimeter energy throughout equilibration', () => {
    for (const time of [0, 1, 10, 100, 1000])
      expect(mixingCalorimeter(time).balance).toBeCloseTo(0, 8);
    expect(mixingCalorimeter(1000).hot).toBeCloseTo(mixingCalorimeter(1000).cold, 8);
  });
  it('recovers metal heat capacity only after accounting for cup heat', () => {
    expect(mixingCalorimeter(1000, 0).inferredWithoutCup).toBeCloseTo(900);
    expect(mixingCalorimeter(1000, 60).inferredWithoutCup).toBeLessThan(900);
  });
  it('keeps absolute p times total volume constant, unlike rapid compression', () => {
    expect(syringeGas(10).pv).toBeCloseTo(syringeGas(30).pv, 9);
    expect(syringeGas(10, 1.4).temperature).toBeGreaterThan(293.15);
    expect(syringeGas(10, 1.4).pressure).toBeGreaterThan(syringeGas(10).pressure);
  });
  it('uses Kelvin and conserves V/T for a freely moving plug', () => {
    const a = flaskPlug(20),
      b = flaskPlug(30);
    expect(a.displacement).toBe(0);
    expect(b.volume / b.kelvin).toBeCloseTo(a.volume / a.kelvin, 12);
    expect(b.displacement * 0.5).toBeCloseTo(b.volume - a.volume, 12);
  });
});
