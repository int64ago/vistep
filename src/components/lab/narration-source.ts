type SourceEvents = { waiting: () => void; ready: () => void; error: () => void };

/** Keep native streaming, but make chapter seeks work on hosts that ignore Range requests. */
export function narrationSource(audio: HTMLAudioElement, src: string, events: SourceEvents) {
  let target = 0;
  let loading = false;
  let disposed = false;
  let objectUrl: string | null = null;
  let request: AbortController | null = null;

  const makeSeekable = () => {
    if (loading || disposed) return;
    loading = true;
    audio.pause();
    events.waiting();
    request = new AbortController();
    void fetch(src, { signal: request.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Narration asset returned ${response.status}`);
        const blob = await response.blob();
        if (disposed) return;
        if (!blob.size) throw new Error('Narration asset is empty');
        objectUrl = URL.createObjectURL(blob);
        audio.src = objectUrl;
        audio.load();
      })
      .catch(() => {
        if (disposed) return;
        loading = false;
        events.error();
      });
  };
  const place = () => {
    if (disposed || loading || !audio.readyState) return;
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
      target = Math.max(0, time);
      place();
    },
    loadedMetadata() {
      if (disposed) return;
      if (objectUrl) loading = false;
      place();
      if (!loading) events.ready();
    },
    dispose() {
      disposed = true;
      request?.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
  };
}
