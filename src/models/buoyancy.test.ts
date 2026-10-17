import { describe, expect, it } from 'vitest';
import { buoyancy, buoyancyMotion } from './buoyancy';
describe('Hydrostatic prism and released motion', () => {
  it('independently obtains Archimedes force from upper/lower pressure faces', () => {
    for (const depth of [-0.02, 0, 0.03, 0.12, 0.2]) {
      const s = buoyancy(depth),
        expected = 1000 * 9.81 * 0.01 * Math.max(0, Math.min(0.12, depth));
      expect(s.force).toBeCloseTo(expected, 12);
    }
    expect(buoyancy(0.2).force).toBeCloseTo(11.772, 12);
  });
  it('keeps full-immersion force independent of absolute depth', () => {
    const a = buoyancy(0.14),
      b = buoyancy(0.24);
    expect(b.bottomPressure).toBeGreaterThan(a.bottomPressure);
    expect(b.topPressure).toBeGreaterThan(a.topPressure);
    expect(b.force).toBeCloseTo(a.force, 12);
  });
  it('balances a 700 kg/m³ block at 70% immersion and tracks extra load', () => {
    const s = buoyancy(0.084);
    expect(s.force).toBeCloseTo(s.weight, 12);
    expect(s.immersed / s.height).toBeCloseTo(0.7, 12);
    expect(buoyancy(0.114, { mass: 1.14 }).netDown).toBeCloseTo(0, 12);
  });
  it('matches an independent analytic damped trajectory while fully submerged', () => {
    const mass = 1.44,
      d = 18,
      force = (mass - 1.2) * 9.81,
      time = 0.4,
      terminal = force / d,
      expectedDepth = 0.16 + terminal * (time - (mass / d) * (1 - Math.exp((-d * time) / mass))),
      expectedVelocity = terminal * (1 - Math.exp((-d * time) / mass)),
      s = buoyancyMotion(time, { mass });
    expect(s.depth).toBeCloseTo(expectedDepth, 9);
    expect(s.velocity).toBeCloseTo(expectedVelocity, 9);
    expect(s.force).toBeGreaterThan(0);
    expect(s.netDown).toBeGreaterThan(0);
  });
  it('rises to a stable force balance and floats higher without gaining weight in denser liquid', () => {
    expect(buoyancyMotion(2).depth).toBeCloseTo(0.084, 4);
    const a = buoyancy(0.84 / (800 * 0.01), { fluidDensity: 800 }),
      b = buoyancy(0.84 / (1200 * 0.01), { fluidDensity: 1200 });
    expect(b.depth).toBeLessThan(a.depth);
    expect(a.force).toBeCloseTo(b.force, 12);
  });
  it('exposes the sink limit and rejects invalid cases', () => {
    expect(buoyancy(0.2, { mass: 1.44 }).floats).toBe(false);
    expect(buoyancy(0.2, { mass: 1.44 }).force).toBeLessThan(buoyancy(0.2, { mass: 1.44 }).weight);
    for (const o of [{ mass: 0 }, { fluidDensity: -1 }, { area: NaN }])
      expect(() => buoyancy(0.1, o)).toThrow(RangeError);
    expect(() => buoyancyMotion(-1)).toThrow(RangeError);
  });
});
