import timeline from './film-timeline.json';
export type Chapter = {
  id: string;
  at: number;
  title: string;
  titleEn: string;
  caption: string;
  captionEn: string;
};
export type Film = { duration: number; chapters: Chapter[] };
export const films: Record<string, Film> = timeline;
export const filmDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, '0')}`;
