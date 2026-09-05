import { t } from '../../i18n';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSimulation } from './useSimulation';
import { useNarration } from './useNarration';
import { films, filmDuration, type Chapter } from '../../data/films';
type Director = {
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
export default function Showcase({ slug, children }: { slug: string; children: ReactNode }) {
  const film = films[slug];
  const [watch, setWatch] = useState(true),
    [visible, setVisible] = useState(true),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [run, setRun] = useState(0),
    [switching, setSwitching] = useState(false);
  const clock = useRef(0),
    refresh = useRef(0),
    switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voice = useNarration(slug, watch && playing, visible, run, () => {
    clock.current = film.duration;
    setTime(film.duration);
    setPlaying(false);
  });
  const advancing = watch && playing && visible && (!voice.enabled || !voice.waiting);
  const host = useSimulation((dt) => {
    clock.current = Math.min(
      film.duration,
      voice.enabled ? voice.currentTime() : clock.current + dt,
    );
    refresh.current += dt;
    if (refresh.current >= 1 / 30 || clock.current === film.duration) {
      setTime(clock.current);
      refresh.current = 0;
    }
    if (clock.current >= film.duration) setPlaying(false);
  }, advancing);
  useEffect(() => {
    let intersecting = true;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    });
    if (host.current) observer.observe(host.current);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
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
  const seek = (value: number, play = false) => {
    const next = Math.max(0, Math.min(film.duration, value));
    clock.current = next;
    refresh.current = 0;
    setTime(next);
    setWatch(true);
    voice.seek(next);
    setPlaying(play && next < film.duration);
  };
  useEffect(() => {
    const followChapterLink = () => {
      const requested = new URLSearchParams(location.hash.slice(1)).get('t');
      if (requested !== null && Number.isFinite(Number(requested))) seek(Number(requested));
    };
    followChapterLink();
    window.addEventListener('hashchange', followChapterLink);
    return () => window.removeEventListener('hashchange', followChapterLink);
  }, []);
  const chapterTime = time - film.chapters[chapter].at;
  const chapterProgress = Math.min(
    1,
    chapterTime / ((film.chapters[chapter + 1]?.at ?? film.duration) - film.chapters[chapter].at),
  );
  return (
    <FilmContext.Provider
      value={{
        watch,
        playing: watch ? advancing : playing,
        time,
        chapter,
        run,
        duration: film.duration,
        chapters: film.chapters,
        chapterTime,
        chapterProgress,
        narrating: voice.enabled && advancing,
      }}
    >
      <div
        className="showcase"
        data-mode={watch ? 'watch' : 'explore'}
        data-chapter={chapter}
        data-switching={switching}
        data-slug={slug}
        data-narration={voice.enabled ? (voice.waiting ? 'loading' : 'on') : 'off'}
        ref={host}
      >
        <div className="showcase-film">{children}</div>
        <div className="film-caption">
          <span className="film-chapter">
            {String(chapter + 1).padStart(2, '0')}
            <i> / {String(film.chapters.length).padStart(2, '0')}</i>
          </span>
          <div className="film-caption-copy">
            <p key={`${watch}-${chapter}`}>
              {watch ? t(film.chapters[chapter].caption) : t('自由探索，按自己的节奏观察。')}
            </p>
            {film.chapters.map((item) => (
              <p key={item.at} className="film-caption-measure" aria-hidden="true">
                {t(item.caption)}
              </p>
            ))}
          </div>
        </div>
        <div className="film-transport">
          <button
            className="film-play"
            disabled={switching}
            aria-label={
              playing && watch
                ? t('暂停演示')
                : time >= film.duration
                  ? t('重播演示')
                  : t('播放演示')
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
          <div className="film-timeline">
            <span style={{ width: `${(time / film.duration) * 100}%` }} />
            {film.chapters.slice(1).map((c) => (
              <i key={c.at} style={{ left: `${(c.at / film.duration) * 100}%` }} />
            ))}
            <input
              type="range"
              min={0}
              max={film.duration}
              step={0.1}
              value={time}
              aria-label={t('自动演示进度')}
              aria-valuetext={`${filmDuration(time)} / ${filmDuration(film.duration)}`}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </div>
          <span className="film-time">
            {filmDuration(time)} / {filmDuration(film.duration)}
          </span>
          <button className="film-replay" aria-label={t('从头重播')} onClick={replay}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8a8 8 0 1 1-1 7M5 3v6h6" />
            </svg>
          </button>
          <button
            className="film-voice"
            aria-pressed={voice.enabled}
            aria-label={voice.enabled ? t('关闭语音讲解') : t('开启语音讲解')}
            title={t('AI 语音讲解 · 跟随演示播放')}
            onClick={() => {
              if (voice.enabled) voice.disable();
              else {
                if (!watch || time >= film.duration) replay();
                else setPlaying(true);
                voice.enable(!watch || time >= film.duration ? 0 : time);
              }
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4Z" />
              {voice.enabled ? (
                <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
              ) : (
                <path d="m16 9 5 6m0-6-5 6" />
              )}
            </svg>
            <span>
              {voice.waiting
                ? t('准备声音…')
                : voice.enabled
                  ? advancing
                    ? t('讲解中')
                    : t('讲解已开')
                  : t('听讲解')}
            </span>
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
            {watch ? t('自己试试') : t('返回演示')}
          </button>
        </div>
        <details className="film-chapters">
          <summary>
            {t('章节')}
            <span>{t(film.chapters[chapter].title)}</span>
            <i aria-hidden="true">＋</i>
          </summary>
          <ol>
            {film.chapters.map((item, i) => (
              <li key={item.id}>
                <button
                  onClick={() => seek(item.at, true)}
                  aria-current={i === chapter ? 'step' : undefined}
                >
                  <time>{filmDuration(item.at)}</time>
                  <span>{t(item.title)}</span>
                </button>
              </li>
            ))}
          </ol>
        </details>
        {(voice.error || voice.blocked) && (
          <p className="voice-status" role="status">
            {voice.blocked
              ? t('点一下声音按钮，继续听讲解。')
              : t('声音暂时没能加载，点声音按钮重试。')}
          </p>
        )}
      </div>
    </FilmContext.Provider>
  );
}
