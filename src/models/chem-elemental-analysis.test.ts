import { describe, it, expect } from 'vitest';
import {
  atomicMass,
  molar,
  combustion,
  inferComposition,
  fromMassPercent,
  layout,
  transport,
  absorbed,
} from './chem-elemental-analysis';
describe('gravimetric elemental analysis', () => {
  it('recovers the textbook rounded 2:6:1 benchmark and conserves oxygen supplied by CuO', () => {
    const book = fromMassPercent(52.2, 13.1);
    expect(book.integerRatio).toEqual([2, 6, 1]);
    expect(book.oxygen).toBeCloseTo(34.7);
    for (const mass of [0.1, 0.46068, 1]) {
      const p = combustion(mass),
        r = inferComposition(mass, p.water, p.co2);
      expect(r.integerRatio).toEqual([2, 6, 1]);
      expect(r.carbon + r.hydrogen + r.oxygen!).toBeCloseTo(mass, 12);
      expect(p.water + p.co2).toBeCloseTo(mass + p.oxygenFromCuO, 12);
    }
  });
  it('couples apparatus capture and balance gains and exposes omitted dryer bias', () => {
    for (const narrow of [false, true]) {
      const good = absorbed(0.46068, 1, narrow),
        bad = absorbed(0.46068, 1, narrow, false);
      expect(good.water).toBeCloseTo(0.54048, 10);
      expect(good.co2).toBeCloseTo(0.8802, 10);
      expect(good.inferred.integerRatio).toEqual([2, 6, 1]);
      expect(bad.water).toBe(0);
      expect(bad.co2).toBeCloseTo(good.co2 + good.water, 10);
      expect(bad.inferred.carbon).toBeGreaterThan(good.inferred.carbon);
      for (const p of good.state) expect(p.capture).toBe(1);
    }
    expect(inferComposition(0.5, 0.5, 0.9, false).oxygen).toBe(null);
    expect(inferComposition(0, 0, 0).valid).toBe(false);
  });
  it('keeps every marked product on the same continuous lumen path in both compositions', () => {
    for (const narrow of [false, true])
      for (const dry of [false, true]) {
        let prev = transport(0, narrow, dry);
        for (let step = 1; step <= 1000; step++) {
          const now = transport(step / 1000, narrow, dry);
          now.forEach((p, i) => {
            expect(p.id).toBe(prev[i].id);
            expect(
              Math.hypot(p.point.x - prev[i].point.x, p.point.y - prev[i].point.y),
            ).toBeLessThan(2);
            expect(p.capture).toBeGreaterThanOrEqual(prev[i].capture);
          });
          prev = now;
        }
        const l = layout(narrow);
        for (const p of prev)
          expect(p.point.x).toBeCloseTo(
            (p.species === 'water' && dry ? l.dryPoint : l.capturePoint).x,
            10,
          );
      }
  });
});
