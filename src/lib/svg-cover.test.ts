import { describe, expect, it } from 'vitest';
import { compactSvg, svgNumber, svgPoint, svgPolyline, thin } from './svg-cover';
describe('cover geometry formatting', () => {
  it('rounds to sub-pixel precision without negative zero or float noise', () => {
    expect(svgNumber(123.456789)).toBe('123.5');
    expect(svgNumber(-0.04)).toBe('0');
    expect(svgNumber(0.1 + 0.2)).toBe('0.3');
    expect(svgNumber(1.23456, 3)).toBe('1.235');
    expect(svgPoint([10.04, -20.06])).toBe('10,-20.1');
    expect(svgPoint([1, 2], 1, ' ')).toBe('1 2');
    expect(
      svgPolyline([
        [0, 0],
        [10.55, 20.44],
      ]),
    ).toBe('M0,0 L10.6,20.4');
  });
  it('compacts rendered float noise without touching short numbers, ids or colours', () => {
    expect(
      compactSvg(
        '<path d="M12.345678901,-0.00001234L1e-7,2.5" fill="#1234ab" id="c-123.45" opacity=".6"/>',
      ),
    ).toBe('<path d="M12.346,0L1e-7,2.5" fill="#1234ab" id="c-123.45" opacity=".6"/>');
    expect(compactSvg('<image href="data:image/png;base64,iVBORw0KGgo="/>')).toBe(
      '<image href="data:image/png;base64,iVBORw0KGgo="/>',
    );
  });
  it('thins samples but always keeps both ends of a curve', () => {
    expect(thin([0, 1, 2, 3, 4, 5, 6], 3)).toEqual([0, 3, 6]);
    expect(thin([0, 1, 2, 3, 4, 5, 6, 7], 3)).toEqual([0, 3, 6, 7]);
    expect(thin([0, 1, 2], 1)).toEqual([0, 1, 2]);
  });
});
