import { it, expect } from 'vitest';
import {
  mechanicalPolarizer,
  dielectricReflection,
  observedPolarization,
} from './polarization-evidence-lab';
it('projects transverse displacement, conserves ideal channel power and preserves continuity', () => {
  for (const a of [0, 25, 60, 90]) {
    const l = mechanicalPolarizer(-1e-8, 0.31, a),
      r = mechanicalPolarizer(1e-8, 0.31, a);
    expect(l.y).toBeCloseTo(r.y, 6);
    expect(l.z).toBeCloseTo(r.z, 6);
    expect(r.transmission + Math.sin((a * Math.PI) / 180) ** 2).toBeCloseTo(1);
  }
  expect(mechanicalPolarizer(0.2, 0.1, 90).transmission).toBeCloseTo(0);
});
it('does not filter longitudinal displacement by transverse slit orientation', () => {
  expect(mechanicalPolarizer(0.3, 0.1, 0, true)).toEqual(mechanicalPolarizer(0.3, 0.1, 90, true));
});
it('derives Brewster extinction from Fresnel coefficients', () => {
  const b = dielectricReflection();
  expect(dielectricReflection(b.brewster).Rp).toBeLessThan(1e-25);
  expect(observedPolarization('glass', 90, b.brewster).intensity).toBeLessThan(1e-25);
  expect(observedPolarization('glass', 0, b.brewster).intensity).toBeCloseTo(1);
});
it('distinguishes unpolarized light, glossy reflection and LCD leakage', () => {
  expect(observedPolarization('window', 0).intensity).toBe(
    observedPolarization('window', 93).intensity,
  );
  expect(observedPolarization('table', 90).intensity).toBeGreaterThan(0);
  expect(observedPolarization('lcd', 115).intensity).toBeCloseTo(0.01);
});
