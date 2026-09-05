import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSimulation } from './useSimulation';
import { films } from '../../data/films';
type Director = {
  watch: boolean;
  playing: boolean;
  time: number;
  chapter: number;
  run: number;
  duration: number;
};
export const FilmContext = createContext<Director>({
  watch: false,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 1,
});
export const useShowcase = () => useContext(FilmContext);
export const ramp = (time: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (time - start) / (end - start)));
export const ease = (t: number) => t * t * (3 - 2 * t);

export default function Showcase({ slug, children }: { slug: string; children: ReactNode }) {
  const film = films[slug];
  const [watch, setWatch] = useState(true),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [run, setRun] = useState(0),
    [switching, setSwitching] = useState(false);
  const clock = useRef(0),
    refresh = useRef(0),
    switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const host = useSimulation((dt) => {
    clock.current = Math.min(film.duration, clock.current + dt);
    refresh.current += dt;
    if (refresh.current >= 1 / 30 || clock.current === film.duration) {
      setTime(clock.current);
      refresh.current = 0;
    }
    if (clock.current >= film.duration) setPlaying(false);
  }, watch && playing);
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    setPlaying(!motion.matches);
    const change = () => {
      if (motion.matches) setPlaying(false);
    };
    motion.addEventListener('change', change);
    return () => {
      motion.removeEventListener('change', change);
      if (switchTimer.current) clearTimeout(switchTimer.current);
    };
  }, []);
  const chapter = Math.max(
    0,
    film.chapters.findLastIndex((c) => time >= c.at),
  );
  const replay = () => {
    if (switchTimer.current) clearTimeout(switchTimer.current);
    setSwitching(false);
    clock.current = 0;
    refresh.current = 0;
    setTime(0);
    setRun((n) => n + 1);
    setWatch(true);
    setPlaying(true);
  };
  return (
    <FilmContext.Provider value={{ watch, playing, time, chapter, run, duration: film.duration }}>
      <div
        className="showcase"
        data-mode={watch ? 'watch' : 'explore'}
        data-chapter={chapter}
        data-switching={switching}
        data-slug={slug}
        ref={host}
      >
        <div className="showcase-film">{children}</div>
        <div className="film-caption">
          <span className="film-chapter">
            {String(chapter + 1).padStart(2, '0')}
            <i> / {String(film.chapters.length).padStart(2, '0')}</i>
          </span>
          <p key={`${watch}-${chapter}`}>
            {watch ? film.chapters[chapter].caption : '自由探索，按自己的节奏观察。'}
          </p>
        </div>
        <div className="film-transport">
          <button
            className="film-play"
            disabled={switching}
            aria-label={
              playing && watch ? '暂停演示' : time >= film.duration ? '重播演示' : '播放演示'
            }
            onClick={() => {
              if (!watch || time >= film.duration) replay();
              else {
                setWatch(true);
                setPlaying(!playing);
              }
            }}
          >
            {playing && watch ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 6v12M16 6v12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 6 9 6-9 6Z" />
              </svg>
            )}
          </button>
          <div
            className="film-timeline"
            role="progressbar"
            aria-label="自动演示进度"
            aria-valuenow={Math.round(time)}
            aria-valuemin={0}
            aria-valuemax={film.duration}
          >
            <span style={{ width: `${(time / film.duration) * 100}%` }} />
            {film.chapters.slice(1).map((c) => (
              <i key={c.at} style={{ left: `${(c.at / film.duration) * 100}%` }} />
            ))}
          </div>
          <span className="film-time">
            {String(Math.floor(time)).padStart(2, '0')} / {film.duration}s
          </span>
          <button className="film-replay" aria-label="从头重播" onClick={replay}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8a8 8 0 1 1-1 7M5 3v6h6" />
            </svg>
          </button>
          <button
            className="film-mode"
            disabled={switching}
            aria-pressed={!watch}
            onClick={() => {
              setPlaying(false);
              if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
                if (watch) setWatch(false);
                else replay();
                return;
              }
              setSwitching(true);
              switchTimer.current = setTimeout(() => {
                if (watch) {
                  setWatch(false);
                  setSwitching(false);
                } else replay();
              }, 180);
            }}
          >
            {watch ? '自己试试' : '返回演示'}
          </button>
        </div>
      </div>
    </FilmContext.Provider>
  );
}
