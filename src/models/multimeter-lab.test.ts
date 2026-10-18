import { describe, it, expect } from 'vitest';
import { ohmmeterState, diodeOhmmeter, lampMeter, faultProbeState } from './multimeter-lab';
describe('analog meter circuits and diagnosis', () => {
  it('places short circuit at right-hand zero and midpoint resistance at half deflection', () => {
    expect(ohmmeterState(0).deflection).toBe(1);
    expect(ohmmeterState(200).deflection).toBe(0.5);
    expect(ohmmeterState(Infinity).deflection).toBe(0);
    expect(ohmmeterState(470).indicated).toBeCloseTo(470, 12);
  });
  it('requires ohms zero adjustment after range changes', () => {
    const bad = ohmmeterState(470, 10, 0.86);
    expect(bad.calibrated).toBe(false);
    expect(bad.indicated).toBeGreaterThan(470);
    expect(ohmmeterState(0, 100, 0.86).deflection).toBeCloseTo(0.86, 12);
  });
  it('solves the diode and meter jointly and shows range-dependent apparent resistance', () => {
    const f = diodeOhmmeter(true),
      r = diodeOhmmeter(false);
    expect(f.current).toBeGreaterThan(r.current * 1e5);
    expect(f.current).toBeCloseTo(1e-9 * Math.expm1(f.drop / 0.0517), 13);
    expect(diodeOhmmeter(true, 100).indicated).not.toBeCloseTo(f.indicated, 0);
  });
  it('models polarity and detects insufficient ranges', () => {
    expect(lampMeter('voltage', 5, true).value).toBeLessThan(0);
    expect(lampMeter('current', 0.1).overRange).toBe(true);
    expect(lampMeter('current', 0.5).overRange).toBe(false);
  });
  it('distinguishes exhausted source, open wire, switch and socket using loaded voltage probes', () => {
    expect(faultProbeState('battery', 'battery').voltage).toBe(0);
    expect(faultProbeState('wire', 'wire').voltage).toBeGreaterThan(1.49);
    expect(faultProbeState('switch', 'switch').voltage).toBeGreaterThan(1.49);
    expect(faultProbeState('socket', 'lamp').voltage).toBeGreaterThan(1.49);
    expect(faultProbeState('socket', 'switch').voltage).toBeLessThan(0.001);
    expect(faultProbeState('socket', 'lamp').lampPower).toBeLessThan(1e-12);
  });
});
