import { describe, it, expect } from 'vitest';
import { beamDeflection, opticalLever, reflectedDirection } from './small-deformation-lab';
describe('two-mirror deformation amplifier', () => {
  it('recovers simply-supported central-load reference and symmetry', () => {
    expect(beamDeflection(0.5, 80).down).toBeCloseTo(80 / (48 * 20000), 12);
    expect(beamDeflection(0, 80).down).toBe(0);
    expect(beamDeflection(0.25, 80).down).toBe(beamDeflection(0.75, 80).down);
    expect(beamDeflection(0.25, 80).slope).toBe(-beamDeflection(0.75, 80).slope);
  });
  it('reflection preserves length and rotates outgoing direction twice the mirror rotation', () => {
    const a = reflectedDirection({ x: 1, y: 0 }, 0.31);
    expect(Math.hypot(a.x, a.y)).toBeCloseTo(1, 12);
    expect(Math.atan2(a.y, a.x)).toBeCloseTo(0.62, 12);
  });
  it('unloaded path hits both intended centers and wall zero', () => {
    const s = opticalLever(0);
    expect(s.p1.x).toBeCloseTo(0.75, 12);
    expect(s.p1.y).toBeCloseTo(0.16, 12);
    expect(s.p2.x).toBeCloseTo(0.25, 12);
    expect(s.p2.y).toBeCloseTo(0.24, 12);
    expect(s.shift).toBeCloseTo(0, 12);
  });
  it('more force and a farther wall increase the measurable displacement', () => {
    expect(Math.abs(opticalLever(80).shift)).toBeGreaterThan(Math.abs(opticalLever(40).shift));
    expect(Math.abs(opticalLever(80, 4).shift)).toBeGreaterThan(
      Math.abs(opticalLever(80, 2).shift),
    );
    expect(opticalLever(80).deflection).toBe(opticalLever(80, 4).deflection);
  });
  it('ray intersections lie on each mirror at all intended forces', () => {
    for (const f of [0, 20, 40, 80]) {
      const s = opticalLever(f);
      for (const [p, m] of [
        [s.p1, s.m],
        [s.p2, s.n],
      ] as const) {
        expect(
          (p.x - m.center.x) * Math.sin(m.angle) - (p.y - m.center.y) * Math.cos(m.angle),
        ).toBeCloseTo(0, 12);
        expect(Math.hypot(p.x - m.center.x, p.y - m.center.y)).toBeLessThan(0.075);
      }
    }
  });
});
