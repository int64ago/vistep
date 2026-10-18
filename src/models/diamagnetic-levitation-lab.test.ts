import { describe, expect, it } from 'vitest';
import {
  magneticLift,
  levitationEquilibrium,
  levitatingSample,
} from './diamagnetic-levitation-lab';
describe('diamagnetic levitation', () => {
  it('requires a gradient even at large field strength', () => {
    expect(magneticLift(0.05, 20, true).acceleration).toBeCloseTo(0, 12);
    expect(magneticLift(0, 20).acceleration).toBeCloseTo(0, 12);
    expect(levitationEquilibrium(5)).toBeNull();
  });
  it('matches the water B gradient balance of about -1361 tesla squared per metre', () => {
    const z = levitationEquilibrium(16)!;
    const a = magneticLift(z);
    expect(a.acceleration).toBeCloseTo(9.8, 10);
    expect(a.field * a.gradient).toBeCloseTo(-1361, 0);
  });
  it('selects the stable upper equilibrium branch', () => {
    const z = levitationEquilibrium(16)!;
    expect(magneticLift(z - 0.001).acceleration).toBeGreaterThan(9.8);
    expect(magneticLift(z + 0.001).acceleration).toBeLessThan(9.8);
  });
  it('settles after a small perturbation and stays supported without a field', () => {
    const s = levitatingSample(8, 16, false, true);
    expect(s.z).toBeCloseTo(s.equilibrium!, 5);
    expect(levitatingSample(1, 0).z).toBe(0.006);
  });
});
