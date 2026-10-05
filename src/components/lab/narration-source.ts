type SourceEvents = { waiting: () => void; ready: () => void; error: () => void };

/** Keep native streaming, but make chapter seeks work on hosts that ignore Range requests. */
export function narrationSource(audio: HTMLAudioElement, src: string, events: SourceEvents) {
  let target = 0;
  let loading = false;
  let failed = false;
  let disposed = false;
  let objectUrl: string | null = null;
  let request: AbortController | null = null;

  const release = () => {
    request?.abort();
    request = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    loading = false;
  };
  const mediaError = () => {
    if (disposed) return;
    release();
    failed = true;
    audio.pause();
    events.error();
  };
  const makeSeekable = (reload = false) => {
    if (loading || disposed) return;
    loading = true;
    audio.pause();
    events.waiting();
    const attempt = new AbortController();
    request = attempt;
    void fetch(src, { signal: attempt.signal, ...(reload ? { cache: 'reload' } : {}) })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Narration asset returned ${response.status}`);
        const blob = await response.blob();
        if (disposed || request !== attempt) return;
        if (!blob.size) throw new Error('Narration asset is empty');
        objectUrl = URL.createObjectURL(blob);
        audio.src = objectUrl;
        audio.load();
      })
      .catch(() => {
        if (disposed || request !== attempt) return;
        mediaError();
      });
  };
  const place = () => {
    if (disposed || failed || loading || !audio.readyState) return;
    const time = Number.isFinite(audio.duration) ? Math.min(target, audio.duration) : target;
    const ranges = audio.seekable;
    const seekable = Array.from({ length: ranges.length }, (_, i) => i).some(
      (i) => time >= ranges.start(i) && time <= ranges.end(i),
    );
    if (time === 0 || objectUrl || seekable) audio.currentTime = time;
    else makeSeekable();
  };
  return {
    get loading() {
      return loading;
    },
    seek(time: number) {
      if (disposed) return;
      target = Math.max(0, time);
      place();
    },
    mediaError,
    retry() {
      if (disposed || !failed) return;
      failed = false;
      // A fresh fetch avoids replaying a corrupt Blob or an immutable cached response.
      makeSeekable(true);
    },
    loadedMetadata() {
      if (disposed || failed) return;
      if (objectUrl) {
        loading = false;
        request = null;
      }
      place();
      if (!loading) events.ready();
    },
    dispose() {
      disposed = true;
      release();
    },
  };
}
