import { describe, it, expect } from 'vitest';
import {
  seismicRock,
  seismicSpeeds,
  seismicPulse,
  seismicParticle,
  seismicArrival,
  seismicShot,
} from './seismic-waves';
describe('elastic seismic waves', () => {
  it('derives faster P than S', () => {
    const v = seismicSpeeds(seismicRock);
    expect(v.p).toBeGreaterThan(v.s);
    expect(v.p).toBeCloseTo(Math.sqrt(90e9 / 2700));
  });
  it('has P before S and doubles the interval with distance', () => {
    const a = seismicArrival(seismicRock, 60000),
      b = seismicArrival(seismicRock, 120000);
    expect(a.p).toBeLessThan(a.s!);
    expect(b.gap).toBeCloseTo(a.gap! * 2);
  });
  it('keeps longitudinal and transverse components separate', () => {
    expect(seismicParticle(seismicRock, 'p', 30000, 8).y).toBe(0);
    expect(seismicParticle(seismicRock, 's', 30000, 11).x).toBe(0);
  });
  it('excludes early and late packet motion', () => {
    expect(seismicPulse(-1)).toBe(0);
    expect(seismicPulse(7)).toBe(0);
  });
  it('ideal fluids retain P and remove S', () => {
    const m = { ...seismicRock, shear: 0 };
    expect(seismicSpeeds(m).p).toBeGreaterThan(0);
    expect(seismicArrival(m, 1000).s).toBeNull();
    expect(seismicParticle(m, 's', 10, 30).signal).toBe(0);
  });
  it('reconstructs seeks', () => {
    for (let i = 0; i < 8; i++) expect(seismicShot(i, 0.74)).toEqual(seismicShot(i, 0.74));
  });
});
