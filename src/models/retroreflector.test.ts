import { describe, it, expect } from 'vitest';
import { cornerTrace, cornerDot } from './retroreflector';
describe('finite three-plane retroreflection', () => {
  it('matches an independently unfolded three-reflection path', () => {
    const p: [number, number, number] = [0.25, 0.35, 0.4],
      s = cornerTrace(p),
      sum = s.initial.reduce((a, b) => a + b, 0),
      distance = -2 / sum;
    expect(s.reflections).toBe(3);
    expect(s.internalLength).toBeCloseTo(distance, 12);
    for (let i = 0; i < 3; i++) {
      expect(s.exit[i]).toBeCloseTo(-p[i] - s.initial[i] * distance, 12);
      expect(s.outgoing[i]).toBe(-s.initial[i]);
    }
    expect(s.error).toBe(0);
  });
  it('keeps every bounce on a finite mirror and satisfies equal normal incidence/reflection', () => {
    for (const d of [
      [-1, -1, -1],
      [-1.2, -0.8, -1],
      [-0.9, -1.1, -1.2],
    ] as [number, number, number][]) {
      const s = cornerTrace([1 / 3, 1 / 3, 1 / 3], d);
      expect(s.reflections).toBe(3);
      let before = s.initial;
      for (const e of s.events) {
        if (e.kind === 'mirror') {
          for (const axis of e.axes) {
            expect(e.point[axis]).toBeCloseTo(0, 10);
            expect(e.direction[axis]).toBe(-before[axis]);
          }
          expect(e.point.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(1 + 1e-10);
          before = e.direction;
        }
      }
      expect(cornerDot(s.initial, s.outgoing)).toBeCloseTo(-1, 12);
    }
  });
  it('shows that two mirrors do not reverse a general 3D direction', () => {
    const s = cornerTrace(undefined, undefined, [true, true, false]);
    expect(s.reflections).toBe(2);
    expect(s.error).toBeGreaterThan(1);
    expect(s.outgoing[2]).toBe(s.initial[2]);
  });
  it('distinguishes antiparallel return from an identical line', () => {
    const s = cornerTrace();
    expect(s.error).toBe(0);
    expect(s.offset).toBeGreaterThan(0.05);
  });
  it('respects finite acceptance rather than forcing three bounces', () => {
    const s = cornerTrace([0.8, 0.12, 0.08], [-1, -1, -1]);
    expect(s.reflections).toBe(2);
    expect(s.events.filter((e) => e.kind === 'mirror').map((e) => e.axes)).toEqual([[2], [1]]);
    expect(s.error).toBeGreaterThan(60);
    expect(s.events.at(-1)!.kind).toBe('exit');
    expect(() => cornerTrace([0.3, 0.3, 0.3])).toThrow(RangeError);
  });
});
