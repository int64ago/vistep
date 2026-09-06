import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { rectifierDefaults, rectifierSample, rectifierTrace } from '../../models/rectifier';

const language = vi.hoisted(() => ({ en: false }));
vi.mock('../../i18n', async () => {
  const { default: translations } = await import('../../i18n/en.json');
  return {
    t: (text: string) =>
      language.en ? ((translations as Record<string, string>)[text] ?? text) : text,
  };
});
import RectifierBridge from './RectifierBridge';

describe('rectifier load annotation bounds', () => {
  it('fits every allowed load between the capacitor and load branch without shrinking text', () => {
    for (const en of [false, true])
      for (let load = 50; load <= 300; load += 10) {
        language.en = en;
        const sample = rectifierSample(
          rectifierTrace({ ...rectifierDefaults(), load, phase: Math.PI / 2 }, true, 64),
          0,
        );
        const html = renderToStaticMarkup(
          createElement(RectifierBridge, { sample, compact: false }),
        );
        const label = html.match(/<text x="([^"]+)" y="152" text-anchor="end">(\d+) Ω<\/text>/);
        expect(label).not.toBeNull();
        expect(Number(label![2])).toBe(load);
        expect(html).toContain('font-family="inherit" font-size="22"');
        const right = Number(label![1]);
        // An 80-unit envelope conservatively exceeds all 50–300 Ω labels in
        // bundled Manrope 400 at 22 units. It must clear both neighboring branches.
        const left = right - 80;
        expect(left).toBeGreaterThanOrEqual(539 + 8); // Capacitor charge bar's right edge.
        expect(right).toBeLessThanOrEqual(664 - 8); // Load current arrow's left edge.
        expect(right).toBeLessThan(750 - 8);
        expect(html).toContain('x="677" y="94" width="18" height="87"');
        expect(html).toContain('d="M518 38H686V94M686 181V236H518"');
      }
  });

  it('keeps the compact branch geometry and its existing short R label for every allowed load', () => {
    for (const en of [false, true])
      for (let load = 50; load <= 300; load += 10) {
        language.en = en;
        const sample = rectifierSample(
          rectifierTrace({ ...rectifierDefaults(), load, capacitor: false }, false, 64),
          0.005,
        );
        const html = renderToStaticMarkup(
          createElement(RectifierBridge, { sample, compact: true }),
        );
        expect(html).not.toContain(`${load} Ω</text>`);
        expect(html).toContain('viewBox="0 0 300 260"');
        expect(html).toContain('x="281" y="210" text-anchor="middle"');
        expect(html).toContain('x="272" y="94" width="18" height="87"');
        expect(html).toContain('d="M222 38H281V94M281 181V236H222"');
      }
  });
});
