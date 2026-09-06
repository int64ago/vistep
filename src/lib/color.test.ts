import { describe, expect, it } from 'vitest';
import { hexToRgb, mixHex, withAlpha } from './color';
describe('colour helpers', () => {
  it('parses hex and expands shorthand', () => {
    expect(hexToRgb('#986b25')).toEqual([152, 107, 37]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(() => hexToRgb('#12')).toThrow(RangeError);
  });
  it('produces rgba() and srgb mixes like color-mix()', () => {
    expect(withAlpha('#6c8874', 0.19)).toBe('rgba(108, 136, 116, 0.19)');
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#986b25', '#fffcf4', 0.12)).toBe('#f3ebdb');
  });
});
