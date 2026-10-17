import { describe, it, expect } from 'vitest';
import { screwDefaults, screwState, screwHelixPoint, screwThreadVertices } from './screw-jack';
describe('square-thread screw kinematics and friction', () => {
  it('advances by lead, not circumference, per revolution', () => {
    expect(screwState(screwDefaults()).lift).toBe(0.004);
  });
  it('matches NPTEL 400 N / 10 mm diameter / 1.5 mm lead benchmark', () => {
    const s = screwState({
      ...screwDefaults(),
      load: 400,
      radius: 0.005,
      lead: 0.0015,
      friction: 0.2,
    });
    expect(s.raiseTorque).toBeCloseTo(0.50027, 3);
    expect(s.lowerTorque).toBeCloseTo(0.30163, 3);
    expect(s.selfLocking).toBe(true);
  });
  it('preserves work without friction and accounts for positive dissipation with friction', () => {
    for (const friction of [0, 0.05, 0.2]) {
      const s = screwState({ ...screwDefaults(), friction, turns: 2 });
      expect(s.inputWork).toBeCloseTo(s.outputWork + s.heat);
      expect(s.heat).toBeGreaterThanOrEqual(-1e-10);
      if (friction === 0) expect(s.inputWork).toBeCloseTo(8);
    }
  });
  it('shows load can back-drive a low-friction screw', () => {
    const s = screwState({ ...screwDefaults(), friction: 0 });
    expect(s.lowerTorque).toBeLessThan(0);
    expect(s.selfLocking).toBe(false);
  });
  it('preserves helical mating phase under the coupled rotation and lift', () => {
    const p = screwDefaults(),
      theta = 1.7,
      phi = 0.8,
      a = screwHelixPoint(phi, p.radius, p.lead),
      b = screwHelixPoint(phi - theta, p.radius, p.lead);
    expect(b.y + (p.lead * theta) / (2 * Math.PI)).toBeCloseTo(a.y, 12);
    expect(b.x * Math.cos(theta) - b.z * Math.sin(theta)).toBeCloseTo(a.x, 12);
  });
  it('produces finite closed thread surfaces including actual cut ends', () => {
    for (const half of [false, true]) {
      const v = screwThreadVertices(0.004, 0.018, 0.022, 0.0016, 0, 3, 0, half);
      expect(v.length % 9).toBe(0);
      expect(v.every(Number.isFinite)).toBe(true);
      if (half) for (let i = 2; i < v.length; i += 3) expect(v[i]).toBeLessThan(1e-12);
    }
  });
});
