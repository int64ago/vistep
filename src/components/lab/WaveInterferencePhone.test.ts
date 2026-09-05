import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  interferenceAt,
  interferenceShot,
  interferenceEnergy,
} from '../../models/wave-interference';
import { WaveInterferencePhone, WAVE_PHONE_HEIGHT } from './WaveInterferencePhone';

describe('single-sheet phone string explanation', () => {
  it('server-renders every shot with one pixel-coordinate SVG and finite model-derived marks', () => {
    for (let chapter = 0; chapter < 8; chapter++)
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        const shot = interferenceShot(chapter, p);
        for (const width of [246, 320, 620]) {
          const html = renderToStaticMarkup(
            createElement(WaveInterferencePhone, { ...shot, width }),
          );
          expect(html.match(/<svg\b/g)).toHaveLength(1);
          expect(html).toContain(`viewBox="0 0 ${width} ${WAVE_PHONE_HEIGHT}"`);
          expect(html).not.toMatch(/NaN|Infinity|undefined/);
          expect(html).toContain('role="img"');
        }
      }
  });
  it('shows a flat string and nonzero calculated kinetic energy at exact cancellation', () => {
    const shot = interferenceShot(2, 0);
    expect(shot.input.time).toBe(0);
    expect(interferenceAt(shot.input, 0.2).y).toBe(0);
    expect(interferenceAt(shot.input, 0.2).dt).not.toBe(0);
    const totals = interferenceEnergy(shot.input, -0.8, 0.8);
    const html = renderToStaticMarkup(
      createElement(WaveInterferencePhone, { ...shot, width: 246 }),
    );
    expect(html).toContain(`${(totals.total * 1000).toFixed(3)} mJ`);
    expect(html).toContain('mJ / m');
    expect(totals.potential).toBe(0);
    expect(totals.kinetic).toBeGreaterThan(0);
  });
  it('keeps actual displacement and velocity endpoints in the upper instrument over the entire film', () => {
    for (let chapter = 0; chapter < 8; chapter++)
      for (let i = 0; i <= 100; i++) {
        const { input, view } = interferenceShot(chapter, i / 100);
        if (view === 'phase' || view === 'amplitude') continue;
        const span = ['material', 'pass', 'formation'].includes(view) ? 1.6 : 0.8;
        for (let j = 0; j <= 64; j++) {
          const s = interferenceAt(input, -span + (2 * span * j) / 64),
            y = 100 - s.y * 6000;
          expect(y).toBeGreaterThan(47);
          expect(y).toBeLessThan(164);
          if (view === 'energy' || view === 'nodes') {
            expect(y - s.dt * 110).toBeGreaterThan(40);
            expect(y - s.dt * 110).toBeLessThan(169);
          }
        }
      }
  });
});
