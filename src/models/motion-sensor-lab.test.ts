import { describe, it, expect } from 'vitest';
import { sonicMeasurement, sonicPulse, sensorVelocity, SOUND_SPEED } from './motion-sensor-lab';
describe('two textbook ultrasonic arrangements', () => {
  it('active emitter measures one-way acoustic delay with an infrared reference', () => {
    const s = sonicMeasurement('active', 0);
    expect(s.flight).toBeCloseTo(1.2 / 343, 12);
    expect(s.measured).toBeCloseTo(1.2, 12);
    expect(s.textbookApproximation).toBeLessThan(1.2);
    expect(1.2 - s.textbookApproximation).toBeLessThan(0.000002);
  });
  it('stationary reflected target requires the factor of two', () => {
    const s = sonicMeasurement('reflection', 0, 0);
    expect(s.flight).toBeCloseTo(2.4 / 343, 12);
    expect(s.measured).toBeCloseTo(1.2, 12);
  });
  it('moving reflector is intercepted at its actual position and return time', () => {
    const s = sonicMeasurement('reflection', 1, 0.4),
      hit = sonicPulse('reflection', 1, s.flight / 2, 0.4);
    expect(hit.wave).toBeCloseTo(hit.target, 10);
    expect(hit.wave).toBeCloseTo(s.reflectionDistance, 10);
    expect(sonicPulse('reflection', 1, s.flight, 0.4).wave).toBeCloseTo(0, 10);
    expect(s.measured).toBeCloseTo(1.2 + 0.4 * s.positionTime, 10);
  });
  it('both methods recover signed constant speed from their corresponding position times', () => {
    for (const m of ['active', 'reflection'] as const)
      for (const v of [-0.4, 0, 0.4]) expect(sensorVelocity(m, 0.3, v).velocity).toBeCloseTo(v, 10);
  });
  it('one-way outgoing wave reaches the receiver while the cart can keep moving', () => {
    const s = sonicMeasurement('active', 0, 0.4),
      p = sonicPulse('active', 0, s.flight, 0.4);
    expect(p.wave).toBeCloseTo(0);
    expect(p.target).toBeGreaterThan(s.distance);
  });
  it('rejects impossible range and supersonic target assumptions', () => {
    expect(() => sonicMeasurement('reflection', 0, SOUND_SPEED)).toThrow();
    expect(() => sonicMeasurement('active', 0, 0, -1)).toThrow();
  });
});
