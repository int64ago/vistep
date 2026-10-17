import { describe, expect, it } from 'vitest';
import { hydrostatic, hydrostaticPressure, vesselWidth } from './hydrostatic-pressure';
describe('Hydrostatic pressure and shaped vessel force balance', () => {
  it('matches the independent water-column benchmark and surface boundary', () => {
    const s = hydrostaticPressure(10);
    expect(s.gauge).toBe(98100);
    expect(s.absolute).toBe(199425);
    expect(hydrostatic({ depth: 0 }).gauge).toBe(0);
  });
  it('keeps same-level pressure independent of vessel shape despite unequal water weights', () => {
    const s = hydrostatic();
    expect(new Set(s.vessels.map((v) => v.weight)).size).toBe(3);
    for (const v of s.vessels) expect(v.bottomForce).toBeCloseTo(18.8352, 10);
  });
  it('independently integrates sloping wall normals to recover the vertical reaction', () => {
    const s = hydrostatic();
    for (let j = 0; j < 3; j++) {
      const v = s.vessels[j],
        n = 10000,
        dy = s.height / n;
      let wallUp = 0,
        volume = 0;
      for (let i = 0; i < n; i++) {
        const y = (i + 0.5) * dy,
          p = s.density * s.g * (s.height - y),
          slope = v.slope / 2,
          normalY = slope / Math.hypot(1, slope),
          stripArea = 0.08 * Math.hypot(1, slope) * dy;
        wallUp += 2 * p * normalY * stripArea;
        volume += 0.08 * vesselWidth(j, y) * dy;
      }
      expect(wallUp).toBeCloseTo(v.wallUp, 9);
      expect(volume).toBeCloseTo(v.volume, 12);
      expect(v.bottomForce + wallUp).toBeCloseTo(v.weight, 9);
    }
  });
  it('distinguishes absolute pressure changes from hydrostatic gauge excess', () => {
    const a = hydrostatic(),
      b = hydrostatic({ surface: 151325 });
    expect(b.absolute - a.absolute).toBe(50000);
    expect(b.gauge).toBe(a.gauge);
    expect(b.sensorForce).toBe(a.sensorForce);
  });
  it('changes pressure with density and force with area while preserving their distinction', () => {
    const a = hydrostatic({ sensorArea: 0.0001 }),
      b = hydrostatic({ sensorArea: 0.0004 });
    expect(b.gauge).toBe(a.gauge);
    expect(b.sensorForce / a.sensorForce).toBe(4);
    expect(hydrostatic({ density: 1200 }).gauge / a.gauge).toBeCloseTo(1.2, 12);
  });
  it('rejects probes outside the liquid and invalid boundary conditions', () => {
    for (const o of [
      { depth: -1 },
      { depth: 0.4 },
      { density: 0 },
      { surface: -1 },
      { sensorArea: NaN },
    ])
      expect(() => hydrostatic(o)).toThrow(RangeError);
  });
});
