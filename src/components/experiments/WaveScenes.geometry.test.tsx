import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../lab/FilmContext';
import Resonance from './Resonance';
import Beats from './Beats';
import StandingWave from './StandingWave';
import SeismicWaves from './SeismicWaves';
import Osmosis from './Osmosis';
import Capillary from './Capillary';
const layout = vi.hoisted(() => ({ width: 246 }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({
    host: { current: null },
    width: layout.width,
    compact: layout.width < 560,
  }),
}));
describe('wave scenes use measured SVG coordinates', () => {
  beforeEach(() => {
    layout.width = 246;
  });
  it('uses the actual content width at narrow and intermediate layouts', () => {
    for (const width of [246, 316, 510, 800]) {
      layout.width = width;
      for (const Scene of [Resonance, Beats, StandingWave, SeismicWaves, Osmosis, Capillary]) {
        for (let chapter = 0; chapter < 8; chapter++) {
          const html = renderToStaticMarkup(
            <FilmContext.Provider
              value={{
                watch: true,
                playing: false,
                time: 0,
                chapter,
                run: 0,
                duration: 160,
                chapters: [],
                chapterTime: 10,
                chapterProgress: 0.5,
              }}
            >
              <Scene />
            </FilmContext.Provider>,
          );
          expect(html).toContain(`viewBox="0 0 ${width} `);
          expect(html).not.toMatch(/NaN|Infinity/);
          for (const match of html.matchAll(/<circle[^>]+cx="([\d.-]+)"/g)) {
            expect(Number(match[1])).toBeGreaterThanOrEqual(0);
            expect(Number(match[1])).toBeLessThanOrEqual(width);
          }
        }
      }
    }
  });
});
