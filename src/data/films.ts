import timeline from './film-timeline.json';
import type { Film } from '../lib/film';
export type { Chapter, Film } from '../lib/film';
export { filmDuration, filmRunningTime } from '../lib/film';
export const films: Record<string, Film> = timeline;
