import { it, expect } from 'vitest';
import { fresnelSlit, fresnelCircle } from './optical-diffraction-lab';
it('approaches Fraunhofer minima and loses throughput as the slit narrows', () => {
  const a = 50,
    w = 550,
    L = 1,
    x = (w * L) / a;
  expect(fresnelSlit(x, a, w)).toBeLessThan(fresnelSlit(0, a, w) * 0.001);
  expect(fresnelSlit(0, 50)).toBeLessThan(fresnelSlit(0, 100));
});
it('has symmetric slit intensity with converged quadrature', () => {
  expect(fresnelSlit(-3, 800)).toBeCloseTo(fresnelSlit(3, 800), 8);
  expect(fresnelSlit(4, 800, 550, 1, 192)).toBeCloseTo(fresnelSlit(4, 800, 550, 1, 384), 4);
});
it('recovers the unit on-axis Poisson spot without adding an artificial dot', () => {
  for (const a of [0.3, 0.6, 1]) expect(fresnelCircle(0, a)).toBeCloseTo(1, 5);
});
it('checks circular aperture axial Fresnel zones and radial convergence', () => {
  const a = 0.4,
    K = (Math.PI * (a * 1e-3) ** 2) / 550e-9;
  expect(fresnelCircle(0, a, 550, 1, false)).toBeCloseTo(4 * Math.sin(K / 2) ** 2, 5);
  expect(fresnelCircle(0.7, 0.6, 550, 1, true, 192)).toBeCloseTo(
    fresnelCircle(0.7, 0.6, 550, 1, true, 384),
    4,
  );
});
