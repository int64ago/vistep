import { describe, it, expect } from 'vitest';
import { dynamicMassState, foldingSupport } from './dynamic-mass-lab';
describe('constant-force dynamic mass measurement', () => {
  it('uses total moving mass rather than weight', () => {
    const s = dynamicMassState(0.5, 62, 25, 6);
    expect(s.acceleration).toBeCloseTo(25 / 68);
    expect(s.position).toBeCloseTo(0.5 * (25 / 68) * 0.25);
  });
  it('encoder average velocities infer the exact constant acceleration independently', () => {
    const s = dynamicMassState(1, 62, 25, 6);
    expect(s.measuredAcceleration).toBeCloseTo(s.acceleration, 10);
    expect(s.measuredMass).toBeCloseTo(62, 8);
  });
  it('does not report a mass before enough crossings', () => {
    expect(dynamicMassState(0.1).measuredMass).toBeNull();
    expect(dynamicMassState(0.5, 62, 0).measuredMass).toBeNull();
  });
  it('same force gives lower acceleration to greater mass', () => {
    expect(dynamicMassState(0.5, 80).acceleration).toBeLessThan(
      dynamicMassState(0.5, 50).acceleration,
    );
  });
  it('counting intervals get shorter as velocity grows', () => {
    const s = dynamicMassState(1);
    const durations = s.crossings.slice(1).map((v, i) => v.time - s.crossings[i].time);
    for (let i = 1; i < durations.length; i++) expect(durations[i]).toBeLessThan(durations[i - 1]);
  });
  it('folding arm links keep their lengths for the entire measurement stroke', () => {
    for (const d of [0.4, 0.5, 0.65]) {
      const s = foldingSupport(d);
      expect(Math.hypot(s.midpoint, s.rise)).toBeCloseTo(0.36, 12);
    }
  });
});
