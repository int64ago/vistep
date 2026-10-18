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
/** A consecutive authored selection. Scene time stays absolute for deterministic models. */
export type FilmSelection = { chapterIds: string[]; variant?: string };
export function filmWindow(film: Film, selection?: FilmSelection) {
  if (!selection?.chapterIds.length)
    return { start: 0, end: film.duration, chapters: film.chapters, firstIndex: 0 };
  const indices = selection.chapterIds.map((id) => film.chapters.findIndex((c) => c.id === id));
  if (indices.some((index, i) => index < 0 || (i > 0 && index !== indices[i - 1] + 1)))
    throw new Error('A textbook experiment must select existing consecutive film chapters.');
  const firstIndex = indices[0],
    lastIndex = indices[indices.length - 1];
  return {
    start: film.chapters[firstIndex].at,
    end: film.chapters[lastIndex + 1]?.at ?? film.duration,
    chapters: film.chapters.slice(firstIndex, lastIndex + 1),
    firstIndex,
  };
}
export type Soundtrack = { src: string; duration: number };
export const filmDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, '0')}`;
/** A film's displayed length must not understate the duration used by catalog filters. */
export const filmRunningTime = (seconds: number) => filmDuration(Math.ceil(seconds));
