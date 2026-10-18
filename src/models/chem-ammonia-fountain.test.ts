import { describe, it, expect } from 'vitest';
import { ammoniaFountain, fountainLiquidHeight, FOUNTAIN } from './chem-ammonia-fountain';
describe('ammonia fountain coupled pressure and inflow', () => {
  it('preserves ammonia and liquid/gas capacity throughout the path', () => {
    for (const t of [0, 0.1, 1, 5, 20, 60, 120]) {
      const s = ammoniaFountain(t);
      expect(s.gasAmmonia + s.dissolvedAmmonia).toBeCloseTo(0.97, 10);
      expect(s.water + s.gasVolume).toBeCloseTo(1, 10);
      expect(s.pressure).toBeGreaterThan(0);
      expect(s.water).toBeLessThan(1);
    }
  });
  it('water uptake creates pressure difference before an open path supplies flow', () => {
    const s = ammoniaFountain(0.8, { open: false });
    expect(s.pressure).toBeLessThan(0.7 * FOUNTAIN.pressure);
    expect(s.water).toBe(0.002);
    expect(s.flow).toBe(0);
    const f = ammoniaFountain(10);
    expect(f.water).toBeGreaterThan(0.02);
    expect(f.flow).toBeGreaterThan(0);
    expect(f.jetHeight).toBeCloseTo((f.speed * f.speed) / (2 * FOUNTAIN.g), 10);
  });
  it('no trigger or no gas uptake produces no fountain', () => {
    expect(ammoniaFountain(120, { trigger: false }).water).toBe(0);
    expect(ammoniaFountain(120, { partition: 0 }).water).toBe(0.002);
  });
  it('residual air limits filling and stable pressure approaches hydrostatic balance', () => {
    const pure = ammoniaFountain(120),
      air = ammoniaFountain(120, { airFraction: 0.4 });
    expect(pure.water).toBeGreaterThan(air.water);
    expect(air.water).toBeGreaterThan(0.5);
    expect(air.water).toBeLessThan(0.62);
    expect(air.pressure).toBeCloseTo(
      FOUNTAIN.pressure -
        FOUNTAIN.density *
          FOUNTAIN.g *
          (FOUNTAIN.lift +
            air.water * FOUNTAIN.reservoirDepthPerL +
            Math.max(
              0,
              fountainLiquidHeight(air.water, FOUNTAIN.sphereRadius) - FOUNTAIN.sphereRadius,
            )),
      -1,
    );
  });
  it('liquid geometry uses spherical cap volume', () => {
    expect(fountainLiquidHeight(0)).toBeCloseTo(0, 8);
    expect(fountainLiquidHeight(0.5)).toBeCloseTo(72, 8);
    expect(fountainLiquidHeight(1)).toBeCloseTo(144, 8);
    const h = fountainLiquidHeight(0.2);
    expect((h * h * (216 - h)) / (4 * 72 ** 3)).toBeCloseTo(0.2, 10);
  });
});
