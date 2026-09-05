import { useEffect, useRef, useState } from 'react';
import manifest from '../../data/audio-tracks.json';
import { browserLocale, type Locale } from '../../i18n';
import { narrationPreference, rememberNarration } from './narration-preference';
import { narrationSource } from './narration-source';
type Soundtrack = { src: string; duration: number };
const tracks = manifest as Record<string, Record<Locale, Soundtrack>>;

/** One authored soundtrack per film. The audio media clock drives the visual timeline. */
export function useNarration(
  slug: string,
  playing: boolean,
  visible: boolean,
  run: number,
  onEnded: () => void,
) {
  const track = tracks[slug]?.[browserLocale()];
  const audio = useRef<HTMLAudioElement | null>(null);
  const source = useRef<ReturnType<typeof narrationSource> | null>(null);
  const [sourceReady, setSourceReady] = useState(0);
  const ended = useRef(onEnded);
  ended.current = onEnded;
  const [enabled, setEnabled] = useState(!!track);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const alive = useRef(true);
  const desired = useRef(false);
  const targetTime = useRef(0);
  const makeAudio = () => {
    if (audio.current || !track) return audio.current;
    const a = new Audio(track.src);
    a.preload = 'auto';
    a.hidden = true;
    a.dataset.narration = slug;
    a.dataset.narrationSrc = track.src;
    document.body.append(a);
    a.volume = 0.9;
    a.onplaying = () => {
      if (alive.current && !source.current?.loading) {
        setWaiting(false);
        setBlocked(false);
        setError(false);
      }
    };
    a.onwaiting = () => {
      if (alive.current && desired.current) setWaiting(true);
    };
    a.oncanplay = () => {
      if (alive.current && !source.current?.loading) setWaiting(false);
    };
    a.onloadedmetadata = () => source.current?.loadedMetadata();
    a.onended = () => ended.current();
    const failed = () => {
      if (!alive.current) return;
      desired.current = false;
      setEnabled(false);
      setWaiting(false);
      setError(true);
    };
    a.onerror = failed;
    source.current = narrationSource(a, track.src, {
      waiting: () => {
        if (alive.current) setWaiting(true);
      },
      ready: () => {
        if (!alive.current) return;
        setWaiting(false);
        setSourceReady((value) => value + 1);
      },
      error: failed,
    });
    source.current.seek(targetTime.current);
    audio.current = a;
    return a;
  };
  const play = (a: HTMLAudioElement) => {
    if (source.current?.loading) return;
    void a.play().catch((reason) => {
      if (!alive.current || reason?.name === 'AbortError' || !desired.current) return;
      desired.current = false;
      setEnabled(false);
      setWaiting(false);
      if (reason?.name === 'NotAllowedError') setBlocked(true);
      else setError(true);
    });
  };
  const seek = (time: number) => {
    targetTime.current = Math.max(0, Math.min(track?.duration ?? 0, time));
    source.current?.seek(targetTime.current);
  };
  const enable = (time = 0) => {
    if (!track) {
      setError(true);
      return;
    }
    setError(false);
    setBlocked(false);
    setWaiting(true);
    setEnabled(true);
    desired.current = true;
    rememberNarration(true);
    const a = makeAudio()!;
    if (a.error) a.load();
    seek(time);
    // The first play call stays inside the user's activation, including on iOS.
    play(a);
  };
  const disable = () => {
    desired.current = false;
    audio.current?.pause();
    setEnabled(false);
    setWaiting(false);
    setError(false);
    setBlocked(false);
    rememberNarration(false);
  };
  useEffect(() => {
    alive.current = true;
    const requested = !!track && narrationPreference();
    desired.current = requested;
    setEnabled(requested);
    setWaiting(requested);
    if (requested) makeAudio();
    const leave = () => audio.current?.pause();
    window.addEventListener('pagehide', leave);
    return () => {
      alive.current = false;
      window.removeEventListener('pagehide', leave);
      const a = audio.current;
      source.current?.dispose();
      source.current = null;
      if (a) {
        a.pause();
        a.onplaying = a.onwaiting = a.oncanplay = a.onended = a.onerror = a.onloadedmetadata = null;
        a.removeAttribute('src');
        a.load();
        a.remove();
      }
      audio.current = null;
    };
  }, [slug]);
  useEffect(() => {
    seek(0);
  }, [run]);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (enabled && playing && visible) play(a);
    else a.pause();
  }, [enabled, playing, visible, run, sourceReady]);
  return {
    enabled,
    waiting,
    error,
    blocked,
    enable,
    disable,
    seek,
    currentTime: () =>
      source.current?.loading ? targetTime.current : (audio.current?.currentTime ?? 0),
  };
}
