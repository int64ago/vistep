import { describe, it, expect } from 'vitest';
import { beatsSample, beatsDefault, beatsShot } from './beats';
describe('beats', () => {
  it('adds input pressure exactly', () => {
    const s = beatsSample(beatsDefault, 0.123);
    expect(s.sum).toBe(s.a + s.b);
    expect(Math.abs(s.sum)).toBeLessThanOrEqual(s.envelope + 1e-12);
  });
  it('reinforces and cancels at phase separation', () => {
    expect(beatsSample(beatsDefault, 0).envelope).toBeCloseTo(2);
    expect(beatsSample(beatsDefault, 0.25).envelope).toBeCloseTo(0);
  });
  it('counts absolute difference without half frequency error', () => {
    expect(beatsSample({ ...beatsDefault, f2: 218 }, 0.1).beatFrequency).toBe(2);
    expect(beatsSample(beatsDefault, 0.5).envelope).toBeCloseTo(2);
  });
  it('unequal amplitudes cannot fully cancel', () =>
    expect(beatsSample({ ...beatsDefault, amplitude: 0.6 }, 0.25).envelope).toBeCloseTo(0.4));
  it('same frequencies have a fixed envelope', () => {
    expect(beatsSample({ ...beatsDefault, f2: 220 }, 0.25).envelope).toBe(2);
  });
  it('reconstructs seeks', () => {
    for (let i = 0; i < 8; i++) expect(beatsShot(i, 0.73)).toEqual(beatsShot(i, 0.73));
  });
});
