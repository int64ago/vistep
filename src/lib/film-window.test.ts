import { describe, expect, it } from 'vitest';
import { filmWindow, type Film } from './film';
const film: Film = {
  duration: 100,
  chapters: [0, 20, 45, 75].map((at, i) => ({
    at,
    id: `c${i}`,
    title: '',
    titleEn: '',
    caption: '',
    captionEn: '',
  })),
};
describe('textbook film windows', () => {
  it('keeps absolute authored timing while returning the selected viewing duration', () => {
    expect(filmWindow(film, { chapterIds: ['c1', 'c2'] })).toEqual({
      start: 20,
      end: 75,
      firstIndex: 1,
      chapters: film.chapters.slice(1, 3),
    });
    expect(filmWindow(film, { chapterIds: ['c3'] }).end).toBe(100);
    expect(filmWindow(film).chapters).toBe(film.chapters);
  });
  it('rejects unknown, repeated, reversed and nonconsecutive chapters', () => {
    for (const chapterIds of [['missing'], ['c0', 'c2'], ['c2', 'c1'], ['c1', 'c1']])
      expect(() => filmWindow(film, { chapterIds })).toThrow();
  });
});
