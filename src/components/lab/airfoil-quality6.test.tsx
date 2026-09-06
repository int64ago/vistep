import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AirfoilTunnel from './AirfoilTunnel';
import { airfoilShot, solveAirfoil } from '../../models/airfoil';

const attribute = (tag: string, name: string) => tag.match(new RegExp(` ${name}="([^"]*)"`))?.[1];
function drawing(shot: ReturnType<typeof airfoilShot>, width: number) {
  const html = renderToStaticMarkup(<AirfoilTunnel shot={shot} initialWidth={width} />);
  const legend = html.match(/<g data-airfoil-pressure-legend="true">([\s\S]*?)<\/g>/)![1];
  const bar = legend.match(/<rect[^>]+>/)![0];
  const resultant = [...html.matchAll(/<path\s[^>]+>/g)]
    .map((m) => m[0])
    .find((tag) => attribute(tag, 'stroke') === '#e3c68d');
  const coordinates = resultant
    ? attribute(resultant, 'd')!
        .match(/[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi)!
        .map(Number)
    : [];
  return { html, legend, barY: Number(attribute(bar, 'y')), coordinates };
}
afterEach(() => vi.unstubAllGlobals());

describe('airfoil legend clearance without changing physical vectors', () => {
  it('keeps the original extremal resultant and puts the phone legend beyond its full stroke', () => {
    for (const width of [244, 264, 296, 840])
      for (const angle of [-8, 8]) {
        const model = solveAirfoil({ angle, speed: 35 });
        const { html, barY, coordinates } = drawing({ ...airfoilShot(3, 1), model }, width);
        expect(coordinates[0]).toBe(width - 33);
        expect(coordinates[1]).toBe(130);
        expect(coordinates[3]).toBeCloseTo(130 - model.lift * 0.11, 10);
        expect(
          barY - (Math.max(...coordinates.filter((_, i) => i % 2)) + 2.3 / 2),
        ).toBeGreaterThanOrEqual(6);
        expect(html).toContain(`viewBox="0 0 ${width} ${width < 560 ? 244 : 440}"`);
        if (width < 560 && angle > 0) {
          // 16px annotation's conservative descent3.5; the actual glyph audit also checks ink bounds.
          expect(
            Math.min(...coordinates.filter((_, i) => i % 2)) - 2.3 / 2 - (42 + 3.5),
          ).toBeGreaterThan(4.5);
        }
      }
  });
  it('preserves pressure colors, force scale and legend clearance across actual directed force shots', () => {
    for (const width of [244, 264, 840])
      for (const chapter of [0, 1, 3, 6, 7])
        for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
          const { barY, coordinates } = drawing(airfoilShot(chapter, progress), width);
          if (coordinates.length)
            expect(
              barY - Math.max(...coordinates.filter((_, i) => i % 2)) - 1.15,
            ).toBeGreaterThanOrEqual(6);
        }
    const start = drawing(airfoilShot(7, 0), 264),
      end = drawing(airfoilShot(7, 1), 264);
    expect((130 - end.coordinates[3]) / (130 - start.coordinates[3])).toBeCloseTo(4, 12);
    expect(start.html.match(/hsl\([^)]+\)/g)).toEqual(end.html.match(/hsl\([^)]+\)/g));
  });
  it('retains translated16px-compatible legend labels with a stable phone/desktop frame', () => {
    for (const locale of ['zh', 'en'])
      for (const width of [244, 264, 840]) {
        vi.stubGlobal('document', { documentElement: { lang: locale } });
        const { html, legend, barY } = drawing(airfoilShot(7, 1), width);
        expect(legend).toContain(locale === 'zh' ? '压力系数 Cp' : 'Pressure · Cp');
        expect(barY).toBe(width < 560 ? 216 : 398);
        const baselines = [...legend.matchAll(/<text[^>]+ y="([^"]+)"/g)].map((m) => +m[1]);
        expect(baselines).toEqual(Array(3).fill(width < 560 ? 237 : 423));
        expect(html).not.toMatch(/transform="scale\(/);
      }
  });
});
