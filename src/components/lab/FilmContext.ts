import { createContext, useContext } from 'react';
import type { Chapter } from '../../lib/film';

export type Director = {
  watch: boolean;
  playing: boolean;
  time: number;
  chapter: number;
  run: number;
  duration: number;
  chapters: Chapter[];
  chapterTime: number;
  chapterProgress: number;
  narrating?: boolean;
};
export const FilmContext = createContext<Director>({
  watch: false,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 1,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
});
export const useShowcase = () => useContext(FilmContext);
export const ramp = (time: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (time - start) / (end - start)));
export const ease = (t: number) => t * t * (3 - 2 * t);
