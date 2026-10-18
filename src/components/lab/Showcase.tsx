import { t } from '../../i18n';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSimulation } from './useSimulation';
import { useNarration } from './useNarration';
import {
  filmDuration,
  filmRunningTime,
  filmWindow,
  type Film,
  type FilmSelection,
  type Soundtrack,
} from '../../lib/film';
import { FilmContext } from './FilmContext';
export { FilmContext, useShowcase, ramp, ease } from './FilmContext';
import {
  consumeFilmLanguageState,
  registerFilmLanguageState,
  type FilmLanguageState,
} from '../../lib/film-language';
export default function Showcase({
  slug,
  film,
  track,
  children,
  selection,
}: {
  slug: string;
  film: Film;
  track?: Soundtrack;
  children: ReactNode;
  selection?: FilmSelection;
}) {
  const playbackWindow = filmWindow(film, selection);
  const start = playbackWindow.start,
    end = playbackWindow.end,
    duration = end - start;
  const [watch, setWatch] = useState(true),
    [visible, setVisible] = useState(false),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(start),
    [run, setRun] = useState(0),
    [switching, setSwitching] = useState(false),
    [quickControl, setQuickControl] = useState(false),
    [promptDismissed, setPromptDismissed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null),
    transportRef = useRef<HTMLDivElement>(null);
  const clock = useRef(start),
    refresh = useRef(0),
    switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languagePlaying = useRef(false),
    languageRestore = useRef<FilmLanguageState | null | undefined>(undefined);
  languagePlaying.current = watch && playing;
  useEffect(
    () =>
      registerFilmLanguageState(slug, () => ({
        time: clock.current,
        playing: languagePlaying.current,
      })),
    [slug],
  );
  const voice = useNarration(
    slug,
    watch && playing,
    visible,
    run,
    () => {
      clock.current = end;
      setTime(end);
      setPlaying(false);
    },
    track,
    start,
    () => setPlaying(false),
  );
  const advancing = watch && playing && visible && (!voice.enabled || !voice.waiting);
  const host = useSimulation((dt) => {
    clock.current = Math.min(
      end,
      Math.max(start, voice.enabled ? voice.currentTime() : clock.current + dt),
    );
    refresh.current += dt;
    if (refresh.current >= 1 / 30 || clock.current === end) {
      setTime(clock.current);
      refresh.current = 0;
    }
    if (clock.current >= end) setPlaying(false);
  }, advancing);
  useEffect(() => {
    let intersecting = false;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver((entries) => {
      // One observed host can cross out and back before a queued delivery.
      const entry = entries[entries.length - 1];
      if (!entry) return;
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
  useEffect(() => {
    const phone = matchMedia('(max-width: 760px)');
    let stageVisible = false,
      transportVisible = false;
    const update = () =>
      setQuickControl(phone.matches && stageVisible && !transportVisible && !document.hidden);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === stageRef.current) stageVisible = entry.isIntersecting;
          if (entry.target === transportRef.current)
            transportVisible = entry.isIntersecting && entry.intersectionRatio >= 0.95;
        }
        update();
      },
      { threshold: [0, 0.95] },
    );
    if (stageRef.current) observer.observe(stageRef.current);
    if (transportRef.current) observer.observe(transportRef.current);
    phone.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      phone.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const chapter = Math.max(
    0,
    film.chapters.findLastIndex((c) => Math.min(time, end - 1e-7) >= c.at),
  );
  const replay = () => {
    if (switchTimer.current) clearTimeout(switchTimer.current);
    setSwitching(false);
    clock.current = start;
    refresh.current = 0;
    setTime(start);
    setRun((n) => n + 1);
    setWatch(true);
    setPlaying(true);
  };
  // Starting sound must happen inside the user's tap; the film keeps its place unless it ended.
  const startVoice = () => {
    const restart = !watch || time >= end;
    if (restart) replay();
    else setPlaying(true);
    voice.enable(restart ? start : time);
  };
  const seek = (value: number, play = false) => {
    const next = Math.max(start, Math.min(end, value));
    clock.current = next;
    refresh.current = 0;
    setTime(next);
    setWatch(true);
    voice.seek(next);
    setPlaying(play && next < end);
  };
  useEffect(() => {
    const followChapterLink = () => {
      const requested = new URLSearchParams(location.hash.slice(1)).get('t');
      if (requested !== null && Number.isFinite(Number(requested))) seek(Number(requested));
    };
    // Resolve once per mount, including StrictMode's effect replay. Audio's initial seek(0)
    // effects run first; this seek then restores both media target and the director together.
    if (languageRestore.current === undefined)
      languageRestore.current = consumeFilmLanguageState(slug, film.duration);
    const restored = languageRestore.current;
    if (restored)
      seek(
        restored.time,
        restored.playing && !matchMedia('(prefers-reduced-motion: reduce)').matches,
      );
    else {
      const requested = new URLSearchParams(location.hash.slice(1)).get('t');
      if (requested !== null) followChapterLink();
      else if (selection) seek(start, !matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    window.addEventListener('hashchange', followChapterLink);
    const returnToFilm = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('[data-film-seek]');
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const requested = new URLSearchParams(link.hash.slice(1)).get('t');
      if (requested === null || !Number.isFinite(Number(requested))) return;
      // Also handle selecting the current hash: browsers do not emit hashchange again.
      seek(Number(requested));
      document.getElementById('experiment')?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
    };
    document.addEventListener('click', returnToFilm);
    return () => {
      window.removeEventListener('hashchange', followChapterLink);
      document.removeEventListener('click', returnToFilm);
    };
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
        variant: selection?.variant,
      }}
    >
      <div
        className="showcase"
        data-mode={watch ? 'watch' : 'explore'}
        data-chapter={chapter}
        data-switching={switching}
        data-playing={watch ? advancing : playing}
        data-slug={slug}
        data-narration={voice.enabled ? (voice.waiting ? 'loading' : 'on') : 'off'}
        ref={host}
      >
        <div className="showcase-film" ref={stageRef}>
          {children}
          {voice.blocked && !promptDismissed && (
            <div className="voice-prompt" role="alert">
              <div className="voice-prompt-card">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11 5 6 9H3v6h3l5 4Z" />
                  <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
                </svg>
                <b>{t('浏览器拦下了自动播放的语音讲解。')}</b>
                <p>{t('演示会静音继续；点一下，边看边听。')}</p>
                <div className="voice-prompt-actions">
                  <button type="button" className="voice-prompt-start" onClick={startVoice}>
                    {t('开启语音讲解')}
                  </button>
                  <button
                    type="button"
                    className="voice-prompt-skip"
                    onClick={() => setPromptDismissed(true)}
                  >
                    {t('先静音看')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="film-caption">
          <span className="film-chapter">
            {String(chapter - playbackWindow.firstIndex + 1).padStart(2, '0')}
            <i> / {String(playbackWindow.chapters.length).padStart(2, '0')}</i>
          </span>
          <div className="film-caption-copy">
            <p key={`${watch}-${chapter}`}>
              {watch ? t(film.chapters[chapter].caption) : t('自由探索，按自己的节奏观察。')}
            </p>
            {playbackWindow.chapters.map((item) => (
              <p key={item.at} className="film-caption-measure" aria-hidden="true">
                {t(item.caption)}
              </p>
            ))}
          </div>
        </div>
        {watch && quickControl && !switching && (
          <button
            type="button"
            className="film-quick-control"
            onClick={() => (time >= end ? replay() : setPlaying(!playing))}
          >
            <span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span>
            {playing ? t('暂停演示') : time >= end ? t('重播演示') : t('播放演示')}
          </button>
        )}
        <div className="film-transport" ref={transportRef}>
          <button
            className="film-play"
            disabled={switching}
            aria-label={
              playing && watch ? t('暂停演示') : time >= end ? t('重播演示') : t('播放演示')
            }
            onClick={() => {
              if (!watch || time >= end) replay();
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
            <span style={{ width: `${((time - start) / duration) * 100}%` }} />
            {playbackWindow.chapters.slice(1).map((c) => (
              <i key={c.at} style={{ left: `${((c.at - start) / duration) * 100}%` }} />
            ))}
            <input
              type="range"
              min={start}
              max={end}
              step={0.1}
              value={time}
              aria-label={t('自动演示进度')}
              aria-valuetext={`${filmDuration(time - start)} / ${filmRunningTime(duration)}`}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </div>
          <span className="film-time">
            {filmDuration(time - start)} / {filmRunningTime(duration)}
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
            onClick={() => (voice.enabled ? voice.disable() : startVoice())}
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
            {playbackWindow.chapters.map((item, i) => (
              <li key={item.id}>
                <button
                  onClick={() => seek(item.at, true)}
                  aria-current={i + playbackWindow.firstIndex === chapter ? 'step' : undefined}
                >
                  <time>{filmDuration(item.at - start)}</time>
                  <span>{t(item.title)}</span>
                </button>
              </li>
            ))}
          </ol>
        </details>
        {(voice.error || (voice.blocked && promptDismissed)) && (
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
