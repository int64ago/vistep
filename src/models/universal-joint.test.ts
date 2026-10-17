import { describe, it, expect } from 'vitest';
import { universalJointState, type JointVector } from './universal-joint';
const dot = (a: JointVector, b: JointVector) => a.x * b.x + a.y * b.y + a.z * b.z;
describe('Cardan joint spatial constraints and speed', () => {
  it('preserves cross perpendicularity and each bearing pin normal to its own shaft', () => {
    for (const paired of [false, true])
      for (let a = 0; a < 7; a += 0.19) {
        const s = universalJointState(a, 30, paired, 15);
        expect(dot(s.inputPin, s.middlePin)).toBeCloseTo(0, 12);
        expect(dot(s.inputPin, s.inputAxis)).toBeCloseTo(0, 12);
        expect(dot(s.middlePin, s.middleAxis)).toBeCloseTo(0, 12);
        if (paired) {
          expect(dot(s.middlePin, s.outputPin)).toBeCloseTo(0, 12);
          expect(dot(s.outputPin, s.outputAxis)).toBeCloseTo(0, 12);
        }
      }
  });
  it('has the independent 30 degree speed extrema and two cycles per turn', () => {
    expect(universalJointState(0, 30).ratio).toBeCloseTo(2 / Math.sqrt(3));
    expect(universalJointState(Math.PI / 2, 30).ratio).toBeCloseTo(Math.sqrt(3) / 2);
    expect(universalJointState(0.7, 30).ratio).toBeCloseTo(
      universalJointState(0.7 + Math.PI, 30).ratio,
    );
  });
  it('matches the angular derivative continuously across wrap boundaries', () => {
    for (const a of [0.2, Math.PI, 2 * Math.PI, 7]) {
      const h = 1e-5,
        s = universalJointState(a, 35);
      expect(s.ratio).toBeCloseTo(
        (universalJointState(a + h, 35).output - universalJointState(a - h, 35).output) / (2 * h),
        8,
      );
    }
  });
  it('one complete revolution still produces one complete revolution', () => {
    expect(universalJointState(2 * Math.PI, 35).output).toBeCloseTo(2 * Math.PI);
    expect(universalJointState(4 * Math.PI, 35).output).toBeCloseTo(4 * Math.PI);
  });
  it('cancels speed variation only for equal bends and correct middle-yoke phase', () => {
    for (let a = 0; a < 7; a += 0.13) {
      const s = universalJointState(a, 30, true, 30);
      expect(s.output).toBeCloseTo(a, 12);
      expect(s.ratio).toBeCloseTo(1, 12);
    }
    expect(universalJointState(0, 30, true, 15).ratio).not.toBeCloseTo(1, 3);
  });
  it('is uniform at zero bend and rejects singular/unsupported angles', () => {
    expect(universalJointState(0.8, 0).ratio).toBe(1);
    expect(() => universalJointState(0.8, 90)).toThrow();
  });
});
