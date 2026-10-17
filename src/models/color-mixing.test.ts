import { describe, it, expect } from 'vitest';
import {
  mixingAdd,
  mixingFilters,
  mixingEncode,
  mixingLuminance,
  mixingBeam,
} from './color-mixing';
describe('linear light and ideal filters', () => {
  it('adds radiometric channels without averaging or display-code arithmetic', () => {
    expect(
      mixingAdd([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]),
    ).toEqual([1, 1, 1]);
    expect(
      mixingAdd([
        [0.25, 0, 0],
        [0.25, 0, 0],
      ]),
    ).toEqual([0.5, 0, 0]);
  });
  it('matches the independently specified sRGB midpoint and transfer boundary', () => {
    expect(Math.round(mixingEncode(0.5) * 255)).toBe(188);
    expect(mixingEncode(0.0031308)).toBeCloseTo(0.040449936, 9);
    expect(mixingEncode(1)).toBeCloseTo(1, 12);
    expect(mixingLuminance([0.5, 0.5, 0.5])).toBeCloseTo(0.5, 12);
  });
  it('multiplies sequential CMY transmissions and conserves every passing channel', () => {
    const s = mixingFilters([1, 1, 1], [0.5, 0.25, 0.75]);
    expect(s.output).toEqual([0.5, 0.75, 0.25]);
    expect(s.stages[1]).toEqual([0.5, 1, 1]);
    expect(s.stages[2]).toEqual([0.5, 0.75, 1]);
  });
  it('distinguishes white additive from black subtractive and illumination dependence', () => {
    expect(mixingFilters([1, 1, 1], [1, 1, 1]).output).toEqual([0, 0, 0]);
    expect(mixingFilters([1, 1, 1], [1, 0, 1]).output).toEqual([0, 1, 0]);
    expect(mixingFilters([1, 0, 0], [1, 0, 1]).output).toEqual([0, 0, 0]);
  });
  it('has a flat top and smooth finite beam edge, and rejects invalid control values', () => {
    expect(mixingBeam(0)).toBe(1);
    expect(mixingBeam(0.75)).toBe(1);
    expect(mixingBeam(0.875)).toBe(0.5);
    expect(mixingBeam(1)).toBe(0);
    expect(() => mixingFilters([1, 1, 1], [2, 0, 0])).toThrow(RangeError);
  });
});
