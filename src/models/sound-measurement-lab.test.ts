import { describe, it, expect } from 'vitest';
import {
  syntheticSound,
  estimateSoundFrequency,
  equalTimeCycles,
  waveformWindow,
  lakeSoundMeasurement,
} from './sound-measurement-lab';
describe('sound measurement rather than waveform decoration', () => {
  it('recovers both textbook notes including harmonics and counts fifteen sol cycles in ten do cycles', () => {
    for (const f of [264, 396])
      expect(estimateSoundFrequency(syntheticSound(f).samples, 48000)!.frequency).toBeCloseTo(f, 0);
    const c = equalTimeCycles(264, 396);
    expect(c.second).toBe(15);
    expect(c.ratio).toBe(1.5);
    expect(c.seconds).toBeCloseTo(10 / 264);
  });
  it('rejects silence and nonperiodic noise instead of inventing a pitch', () => {
    expect(estimateSoundFrequency(new Float32Array(4096), 48000)).toBeNull();
    let seed = 3;
    const a = Float32Array.from({ length: 16384 }, () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296 - 0.5;
    });
    expect(estimateSoundFrequency(a, 48000)).toBeNull();
  });
  it('keeps the common time scale and finite values for short recordings', () => {
    const clip = syntheticSound(264, 48000, 256),
      w = waveformWindow(clip, 1);
    expect(w.every(Number.isFinite)).toBe(true);
    expect(Math.max(...w)).toBeLessThanOrEqual(1.000001);
  });
  it('reproduces the textbook 14km/10s simulation and exposes negligible light-travel correction', () => {
    const m = lakeSoundMeasurement();
    expect(m.neglectLight).toBe(1400);
    expect(m.speed).toBeCloseTo(1399.993462, 5);
    expect(m.lightTime).toBeLessThan(0.00005);
    expect(lakeSoundMeasurement(7000, 5).speed).toBeCloseTo(m.speed, 12);
  });
});
