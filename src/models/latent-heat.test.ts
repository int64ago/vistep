import { describe, it, expect } from 'vitest';
import { latentHeat, heatingAt, WATER_MELTING } from './latent-heat';
describe('constant-pressure melting enthalpy', () => {
  it('matches 33.4 kJ to melt 100 g of ice already at zero', () => {
    const start = latentHeat(4200),
      middle = latentHeat(4200 + 16700),
      end = latentHeat(37600);
    expect(start.fraction).toBe(0);
    expect(middle.fraction).toBe(0.5);
    expect(end.fraction).toBe(1);
    expect([start.temperature, middle.temperature, end.temperature]).toEqual([0, 0, 0]);
  });
  it('conserves every joule while crossing both phase boundaries', () => {
    for (const Q of [0, 4199, 4200, 4201, 20000, 37599, 37600, 45972]) {
      const s = latentHeat(Q);
      expect(s.iceEnergy + s.phaseEnergy + s.liquidEnergy).toBeCloseTo(Q, 10);
    }
    expect(latentHeat(45972).temperature).toBeCloseTo(20, 10);
  });
  it('changes elapsed time with power but leaves the enthalpy curve unchanged', () => {
    const a = heatingAt(200, 100),
      b = heatingAt(100, 200);
    expect(a.energy).toBe(b.energy);
    expect(a.fraction).toBe(b.fraction);
    expect(a.temperature).toBe(b.temperature);
    expect(heatingAt(200, 200).temperature).toBeGreaterThan(a.temperature);
    expect(heatingAt(500, 0).energy).toBe(0);
    expect(heatingAt(500, 0).temperature).toBe(-20);
  });
  it('doubles transition energy with mass and returns the same phase on cooling', () => {
    expect(latentHeat(40000, 0.2).fraction).toBe(latentHeat(20000, 0.1).fraction);
    expect(latentHeat(20000).phaseEnergy / WATER_MELTING.fusion).toBeCloseTo(
      0.1 * latentHeat(20000).fraction,
      12,
    );
    const back = [37600, 20000, 4200].map((Q) => latentHeat(Q));
    expect(back.map((s) => s.temperature)).toEqual([0, 0, 0]);
    expect(back[2].fraction).toBeLessThan(back[1].fraction);
  });
  it('rejects zero mass and nonfinite energy', () => {
    expect(() => latentHeat(1, 0)).toThrow(RangeError);
    expect(() => latentHeat(NaN)).toThrow(RangeError);
  });
});
