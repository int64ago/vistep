import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../lab/FilmContext';
import SeismicWaves from './SeismicWaves';
describe('seismic particle field projection', () => {
  it('keeps all material circles inside the drawing at every directed chapter', () => {
    for (let chapter = 0; chapter < 8; chapter++) {
      for (const progress of [0.2, 0.5, 0.8]) {
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
              chapterTime: progress * 20,
              chapterProgress: progress,
            }}
          >
            <SeismicWaves />
          </FilmContext.Provider>,
        );
        const width = Number(html.match(/viewBox="0 0 ([\d.]+) /)?.[1]);
        const circles = [...html.matchAll(/<circle[^>]+cx="([\d.-]+)"/g)];
        expect(circles.length).toBeGreaterThan(400);
        for (const match of circles) {
          expect(Number(match[1])).toBeGreaterThanOrEqual(0);
          expect(Number(match[1])).toBeLessThanOrEqual(width);
        }
      }
    }
  });
});
