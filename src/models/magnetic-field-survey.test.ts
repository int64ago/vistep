import { describe, it, expect } from 'vitest';
import {
  SURVEY_MU0,
  loopMagneticField,
  surveyField,
  oerstedCompass,
  filingAngle,
} from './magnetic-field-survey';
describe('magnetic field sources and probes', () => {
  it('matches independent on-axis circular-loop formula', () => {
    for (const x of [0, 0.03, 0.12]) {
      const s = loopMagneticField(x, 0, 0, 5, 0.075),
        exact = (SURVEY_MU0 * 5 * 0.075 ** 2) / (2 * (0.075 ** 2 + x * x) ** 1.5);
      expect(s.bx).toBeCloseTo(exact, 14);
      expect(Math.abs(s.by) + Math.abs(s.bz)).toBeLessThan(1e-18);
    }
  });
  it('keeps straight-wire field tangential and reverses its direction', () => {
    const s = surveyField('straight', 0.1, 0.05, 5),
      r = surveyField('straight', 0.1, 0.05, -5);
    expect(s.bx * 0.1 + s.by * 0.05).toBeCloseTo(0, 16);
    expect(r.bx).toBe(-s.bx);
  });
  it('returns the compass to magnetic north with no current', () => {
    expect(oerstedCompass(0).angle).toBe(0);
    expect(oerstedCompass(2).angle).toBeCloseTo(-oerstedCompass(-2).angle, 14);
    expect(Math.abs(oerstedCompass(2, 0.04).angle)).toBeLessThan(
      Math.abs(oerstedCompass(2, 0.02).angle),
    );
  });
  it('distinguishes oriented compasses from unoriented iron filing axes', () => {
    const a = filingAngle(0.6, 1e-4, 2e-4, 1),
      b = filingAngle(0.6, -1e-4, -2e-4, 1);
    expect(Math.abs(Math.cos(a - b))).toBeCloseTo(1, 12);
    expect(filingAngle(0.6, 0, 0, 1)).toBe(0.6);
  });
  it('superposes real loops for a solenoid and has the horseshoe gap field from N to S', () => {
    const s = surveyField('solenoid', 0, 0),
      single = surveyField('loop', 0, 0);
    expect(s.bx).toBeGreaterThan(single.bx);
    expect(Math.abs(s.by)).toBeLessThan(1e-17);
    expect(surveyField('horseshoe', 0.075, 0).by).toBeLessThan(0);
  });
});
