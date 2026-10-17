/** Playback contracts shared by static publishing and the lightweight client player. */
export type Chapter = {
  id: string;
  at: number;
  title: string;
  titleEn: string;
  caption: string;
  captionEn: string;
};
export type Film = { duration: number; chapters: Chapter[] };
export type Soundtrack = { src: string; duration: number };
export const filmDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, '0')}`;
/** A film's displayed length must not understate the duration used by catalog filters. */
export const filmRunningTime = (seconds: number) => filmDuration(Math.ceil(seconds));
