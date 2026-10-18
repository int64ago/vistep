import { describe, it, expect } from 'vitest';
import {
  cageField,
  cageSurfaceDensity,
  shieldingState,
  smokeState,
} from './electrostatic-applications-lab';
describe('shielding and smoke collection', () => {
  it('has equipotential spherical conductor and zero tangential field', () => {
    for (let i = 0; i < 20; i++) {
      const a = i * 0.31,
        x = 0.15 * Math.cos(a),
        y = 0.15 * Math.sin(a),
        s = cageField(x, y);
      expect(s.potential).toBeCloseTo((8.9875517923e9 * 20e-9) / 0.3, 8);
      expect(-s.ex * Math.sin(a) + s.ey * Math.cos(a)).toBeCloseTo(0, 6);
    }
  });
  it('integrates isolated neutral-cage surface charge to zero', () => {
    let sum = 0;
    const n = 10000;
    for (let i = 0; i < n; i++) {
      const mu = -1 + ((i + 0.5) * 2) / n;
      sum += (cageSurfaceDensity(Math.acos(mu)) * 2 * Math.PI * 0.15 ** 2 * 2) / n;
    }
    expect(Math.abs(sum)).toBeLessThan(1e-15);
  });
  it('shields the neutral detector but a plastic cage does not', () => {
    expect(shieldingState(0.3, 20e-9, 'metal').angle).toBe(0);
    expect(shieldingState(0.3, 20e-9, 'none').angle).toBeGreaterThan(0.1);
    expect(shieldingState(0.3, 20e-9, 'plastic').angle).toBe(
      shieldingState(0.3, 20e-9, 'none').angle,
    );
  });
  it('moves negatively charged smoke opposite to the field and onto the positive plate', () => {
    const s = smokeState(19);
    expect(s.field).toBeLessThan(0);
    expect(s.collected).toBeGreaterThan(15);
    expect(s.particles.filter((x) => x.collected).every((x) => x.x === 0.1 && x.charge < 0)).toBe(
      true,
    );
  });
  it('retains collected identities after switch-off rather than deleting material', () => {
    const before = smokeState(19.99),
      after = smokeState(28);
    expect(after.field).toBe(0);
    expect(after.collected).toBeGreaterThanOrEqual(before.collected);
    for (const p of before.particles.filter((x) => x.collected))
      expect(after.particles.find((x) => x.id === p.id)?.collected).toBe(true);
    expect(after.suspended).toBeGreaterThan(before.suspended);
  });
  it('does not collect neutral particles merely because a field is drawn', () => {
    expect(smokeState(19, 5000, false).collected).toBe(0);
    expect(smokeState(19, 0).collected).toBe(0);
  });
});
