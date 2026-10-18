import { describe, expect, it } from 'vitest';
import {
  coilInduction,
  dipoleFlux,
  dipoleFluxDerivative,
  discGenerator,
  fallingMagnet,
  approachMagnet,
} from './induction-coil-lab';
describe('induction apparatuses', () => {
  it('matches a numerical flux derivative and flips with motion or pole reversal', () => {
    const z = 0.04,
      eps = 1e-7,
      d = (dipoleFlux(z + eps) - dipoleFlux(z - eps)) / (2 * eps);
    expect(dipoleFluxDerivative(z)).toBeCloseTo(d, 10);
    const a = coilInduction({ z, velocity: 0.4 });
    expect(coilInduction({ z, velocity: -0.4 }).emf).toBeCloseTo(-a.emf, 12);
    expect(coilInduction({ z, velocity: 0.4, moment: -0.03 }).emf).toBeCloseTo(-a.emf, 12);
    expect(coilInduction({ velocity: 0 }).emf).toBe(0);
  });
  it('uses a north-facing pole below the magnet, and a positive opposing field when it approaches', () => {
    const north = approachMagnet(0.25);
    expect(north.velocity).toBeLessThan(0);
    expect(north.flux).toBeLessThan(0);
    expect(north.emf).toBeGreaterThan(0);
    expect(north.magnetForce).toBeGreaterThan(0);
    expect(approachMagnet(0.25, -1).emf).toBeCloseTo(-north.emf, 12);
    expect(fallingMagnet(0.15).flux).toBeLessThan(0);
  });
  it('balances mechanical work and heat and removes force for an open ring', () => {
    const a = coilInduction({ velocity: -0.4 });
    expect(a.magnetForce).toBeGreaterThan(0);
    expect(a.heatPower).toBeCloseTo(a.externalPower, 12);
    expect(coilInduction({ closed: false }).current).toBe(0);
    expect(coilInduction({ closed: false }).magnetForce).toBe(0);
  });
  it('doubles sensor emf with turns for the same trajectory', () => {
    const a = fallingMagnet(0.15, 0.18, 80),
      b = fallingMagnet(0.15, 0.18, 160);
    expect(b.z).toBe(a.z);
    expect(b.emf).toBeCloseTo(a.emf * 2, 12);
    expect(fallingMagnet(10).emf).toBe(0);
  });
  it('gives motional disc emf and exact mechanical/electrical power balance', () => {
    const a = discGenerator(20, 0.3, 0.08, 5);
    expect(a.emf).toBeCloseTo(0.0192, 12);
    expect(a.mechanicalPower).toBeCloseTo(a.loadPower, 12);
    expect(discGenerator(-20).emf).toBeCloseTo(-a.emf, 12);
    expect(discGenerator(0).emf).toBe(0);
  });
});
