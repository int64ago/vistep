import { describe, it, expect } from 'vitest';
import { springExtension, rubberResponse, rubberCycleLoss, springWire } from './elasticity-lab';
describe('elasticity experiment constitutive models', () => {
  it('uses extension rather than total length in Hooke law', () => {
    const a = springExtension(0.15),
      b = springExtension(0.3);
    expect(a.force).toBeCloseTo(1.47);
    expect(a.extension).toBeCloseTo(0.049);
    expect(b.extension).toBeCloseTo(2 * a.extension);
    expect(b.length).not.toBeCloseTo(2 * a.length);
  });
  it('the illustrated rubber law is nonlinear', () => {
    expect(rubberResponse(0.1).force).toBeGreaterThan(2 * rubberResponse(0.05).force);
  });
  it('loading and unloading meet at both endpoints without negative tension', () => {
    for (const x of [0, 0.12])
      expect(rubberResponse(x, 'loading').force).toBeCloseTo(rubberResponse(x, 'unloading').force);
    for (let i = 0; i <= 120; i++)
      expect(rubberResponse(i / 1000, 'unloading', 8).force).toBeGreaterThanOrEqual(0);
  });
  it('positive hysteresis area matches an independent midpoint integration', () => {
    let area = 0;
    const dx = 0.12 / 2000;
    for (let i = 0; i < 2000; i++) {
      const x = (i + 0.5) * dx;
      area += (rubberResponse(x, 'loading').force - rubberResponse(x, 'unloading').force) * dx;
    }
    expect(area).toBeCloseTo(rubberCycleLoss(), 7);
    expect(area).toBeGreaterThan(0);
  });
  it('repeated conditioning lowers illustrative stiffness and thinning preserves volume', () => {
    const a = rubberResponse(0.1),
      b = rubberResponse(0.1, 'loading', 3);
    expect(b.force).toBeLessThan(a.force);
    expect(a.widthScale ** 2 * a.length).toBeCloseTo(0.16, 12);
  });
  it('spring endpoints remain connected at every extension', () => {
    for (const len of [90, 150, 200]) {
      const p = springWire(len);
      expect(p[0]).toEqual({ x: 0, y: 0 });
      expect(p.at(-1)!.x).toBeCloseTo(0);
      expect(p.at(-1)!.y).toBe(len);
    }
  });
});
