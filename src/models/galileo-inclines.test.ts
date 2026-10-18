import { describe, it, expect } from 'vitest';
import { rollingIncline, doubleInclineGeometry, doubleInclineState } from './galileo-inclines';
describe('Galileo incline families', () => {
  it('independent solid-sphere rolling reference and distance-time-square relation', () => {
    const a = rollingIncline(0.5, 6),
      b = rollingIncline(1, 6);
    expect(a.acceleration).toBeCloseTo((5 / 7) * 9.8 * Math.sin(Math.PI / 30));
    expect(b.position).toBeCloseTo(4 * a.position);
    expect(b.waterMass).toBe(2 * a.waterMass);
  });
  it('the gentle incline slows the motion without changing its quadratic time dependence', () => {
    expect(rollingIncline(0, 3).endTime).toBeGreaterThan(rollingIncline(0, 12).endTime);
  });
  it('curved joins are continuous in position and tangent', () => {
    const g = doubleInclineGeometry(18);
    for (const s of [g.leftLength, g.leftLength + g.arcLength]) {
      const a = g.at(s - 1e-8),
        b = g.at(s + 1e-8);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(3e-8);
      expect(Math.abs(a.angle - b.angle)).toBeLessThan(1e-7);
    }
  });
  it('round-trip energy stays consistent with rolling rotational energy', () => {
    for (const angle of [0, 15, 35, 55])
      for (const tm of [0.4, 1, 1.5, 2.4]) {
        const s = doubleInclineState(tm, angle);
        expect(s.energy).toBeCloseTo(9.8 * 0.7, 5);
      }
  });
  it('the zero-angle right track continues at constant speed', () => {
    const a = doubleInclineState(1.4, 0),
      b = doubleInclineState(2, 0);
    expect(a.y).toBeCloseTo(0);
    expect(b.velocity).toBeCloseTo(a.velocity, 9);
    expect(b.x - a.x).toBeCloseTo(a.velocity * 0.6, 8);
  });
  it('a shallower right incline needs greater travel to regain the starting height', () => {
    const a = doubleInclineGeometry(15),
      b = doubleInclineGeometry(45);
    expect(a.rightLength).toBeGreaterThan(b.rightLength);
    expect(a.at(a.length).y).toBeCloseTo(0.7);
    expect(b.at(b.length).y).toBeCloseTo(0.7);
  });
});
