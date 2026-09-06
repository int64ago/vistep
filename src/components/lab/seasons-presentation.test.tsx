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

it('keeps the full metre reading when a winter shadow extends past the phone plate', () => {
  const morning = frame(3, 0.2);
  expect(morning).toContain('25.43 m');
  expect(morning).toContain('data-clipped="true"');
  expect(morning).toContain('图示截短');
  expect(morning).toContain('影子超出刻度盘；读数保留完整长度。');
  expect(morning).toContain('1 m');
  expect(morning).toContain('2.3°');
  expect(morning).toContain('08:23');
  expect(morning).toContain('class="seasons-energy"');
  expect(frame(3, 0.26)).toContain('3.36 m');
  expect(frame(3, 0.32)).toContain('25.43 m');
  expect(frame(3, 0.63)).toContain('data-clipped="false"');
  expect(frame(3, 0.63)).toContain('2.72 m');
});

it('retains polar night and the upright-axis shadow instead of inventing a clipped length', () => {
  const night = frame(5, 0.95);
  expect(night).toContain('太阳在地平线下');
  expect(night).toContain('data-clipped="false"');
  expect(night).toContain('<b>—</b>');
  expect(night).toContain('1 m');
  const upright = frame(6, 0.63);
  expect(upright).toContain('1.19 m');
  expect(upright).toContain('class="seasons-shadow-dial"');
});
