import { describe, it, expect } from 'vitest';
import {
  keplerPoint,
  marsObservation,
  jupiterMoons,
  halleyOrbit,
  uranusHistory,
} from './textbook-astronomy';
describe('astronomical observation models', () => {
  it('satisfies ellipse focal distance extrema and one-period closure', () => {
    expect(keplerPoint(3, 0.4, 0).x).toBeCloseTo(1.8);
    expect(keplerPoint(3, 0.4, Math.PI).x).toBeCloseTo(-4.2);
    expect(halleyOrbit(0).x).toBeCloseTo(halleyOrbit(1).x, 10);
  });
  it('produces retrograde apparent motion around opposition', () => {
    expect(marsObservation(1).longitude).toBeLessThan(marsObservation(-1).longitude);
  });
  it('returns each moon to the same projected phase', () => {
    jupiterMoons(0).forEach((m, i) => expect(jupiterMoons(m.period)[i].x).toBeCloseTo(m.x, 10));
  });
  it('separates integrator drift from an external gravitational perturbation', () => {
    const no = uranusHistory(0),
      yes = uranusHistory(1);
    expect(Math.abs(no.at(-1)!.residualArcsec)).toBeLessThan(1);
    expect(Math.abs(yes.at(-1)!.residualArcsec)).toBeGreaterThan(5);
    expect(yes.every((p) => Number.isFinite(p.x + p.y + p.residualArcsec))).toBe(true);
  });
});
