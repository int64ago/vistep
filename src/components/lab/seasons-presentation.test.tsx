import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import Seasons from '../experiments/Seasons';
import { FilmContext } from './Showcase';

vi.mock('./useCompact', () => ({ useCompact: () => true }));

function frame(chapter: number, chapterProgress: number) {
  return renderToStaticMarkup(
    createElement(
      FilmContext.Provider,
      {
        value: {
          watch: true,
          playing: false,
          time: 0,
          chapter,
          run: 0,
          duration: 176,
          chapters: [],
          chapterTime: 0,
          chapterProgress,
        },
      },
      createElement(Seasons),
    ),
  );
}
it('keeps the narrated causal objects in each phone chapter without the desktop stack', () => {
  const views = ['daylight', 'orbit', 'beam', 'field', 'daylight', 'field', 'year', 'year'];
  for (let chapter = 0; chapter < 8; chapter++) {
    const html = frame(chapter, 0.63);
    expect(html).toContain(`data-causal-view="${views[chapter]}"`);
    expect(html).not.toContain('class="seasons-observatory"');
    if ([0, 4, 6].includes(chapter)) expect(html.match(/class="seasons-day-row"/g)).toHaveLength(2);
    if ([3, 6, 7].includes(chapter)) expect(html).toContain('class="seasons-energy"');
    if (chapter === 5) {
      expect(html).toContain('class="seasons-phone-polar"');
      expect(html).toContain('class="seasons-apparatus"');
      expect(html).toContain('class="seasons-globe"');
    }
    if (chapter >= 6) expect(html).toContain('class="seasons-shadow-dial"');
  }
});
it('reconstructs the phone picture after out-of-order chapter requests', () => {
  const originals = Array.from({ length: 8 }, (_, chapter) => frame(chapter, 0.63));
  for (let chapter = 7; chapter >= 0; chapter--)
    expect(frame(chapter, 0.63)).toBe(originals[chapter]);
  for (const chapter of [0, 2, 3, 5, 7]) expect(frame(chapter, 0.9)).not.toBe(frame(chapter, 0.2));
});
