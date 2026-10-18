import { describe, it, expect } from 'vitest';
import { activeWireLength, wireForceFactors } from './wire-force-factors-lab';
describe('force factors with real active segment', () => {
  it('triples force when contacts change from 2–3 to 1–4 at fixed field/current', () => {
    expect(
      wireForceFactors(2, 0.08, 'outer').force / wireForceFactors(2, 0.08, 'inner').force,
    ).toBeCloseTo(3, 13);
  });
  it('counts only current-carrying wire within the fixed magnetic region', () => {
    expect(activeWireLength('outer', 0.08).effective).toBeCloseTo(0.16, 14);
    expect(activeWireLength('outer', 0.08).total).toBe(0.24);
    expect(activeWireLength('outer', 0.3).effective).toBe(0);
  });
  it('balances horizontal force against weight through suspension angle', () => {
    const s = wireForceFactors(2);
    expect(Math.tan(s.angle) * s.mass * s.gravity).toBeCloseTo(s.force, 14);
    expect((s.suspension - s.rise) ** 2 + s.z ** 2).toBeCloseTo(s.suspension ** 2, 14);
  });
  it('reverses displacement with current and stays centered at zero field', () => {
    expect(wireForceFactors(-2).z).toBeCloseTo(-wireForceFactors(2).z, 14);
    expect(wireForceFactors(3, 0).force).toBe(0);
    expect(wireForceFactors(0).rise).toBe(0);
  });
});
