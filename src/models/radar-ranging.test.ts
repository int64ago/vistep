import { describe, it, expect } from 'vitest';
import {
  RADAR_C,
  RADAR_DEFAULT,
  radarDelay,
  radarRange,
  radarLimits,
  radarApparentRange,
  radarPulseSegments,
  radarEcho,
} from './radar-ranging';
describe('pulsed radar time of flight', () => {
  it('inverts the two-way light time and separates PRI ambiguity', () => {
    for (const r of [75, 600, 1500]) expect(radarRange(radarDelay(r))).toBeCloseTo(r, 10);
    expect(radarApparentRange(1500, 8e-6)).toBeCloseTo(1500 - (RADAR_C * 8e-6) / 2, 10);
  });
  it('conserves pulse-envelope length through reflection', () => {
    const r = 600,
      tau = 0.4e-6;
    for (const tm of [0.5e-6, 1.9e-6, 2.1e-6, 3e-6]) {
      const seg = radarPulseSegments(r, tm, tau);
      expect(seg.reduce((v, p) => v + p.b - p.a, 0)).toBeCloseTo(RADAR_C * tau, 9);
      expect(seg.every((p) => p.a >= 0 && p.b <= r)).toBe(true);
    }
  });
  it('computes overlap, resolution and transmitter blanking', () => {
    const s = { ...RADAR_DEFAULT, second: 690, pulse: 1e-6 };
    expect(radarEcho(radarDelay(690) + 0.1e-6, s)).toBeCloseTo(1.8);
    expect(radarLimits(0.2e-6, 8e-6).resolution).toBeCloseTo(29.9792458);
    const near = { ...s, range: 75, second: null, pulse: 1.5e-6 };
    expect(radarEcho(0.6e-6, near, false)).toBe(1);
    expect(radarEcho(0.6e-6, near)).toBe(0);
    expect(() => radarLimits(2, 1)).toThrow();
  });
});
