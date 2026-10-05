import { afterEach, describe, expect, it, vi } from 'vitest';
import { narrationSource } from './narration-source';

function fixture(rangeEnd = 0, readyState = 4) {
  const audio = {
    readyState,
    duration: 192,
    currentTime: 0,
    src: '/narration/test.mp3',
    seekable: { length: 1, start: () => 0, end: () => rangeEnd },
    pause: vi.fn(),
    load: vi.fn(),
  };
  const events = { waiting: vi.fn(), ready: vi.fn(), error: vi.fn() };
  const fetcher = vi.fn<typeof fetch>(async () => new Response(new Blob(['audio'])));
  vi.stubGlobal('fetch', fetcher);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:recording');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  return {
    audio,
    events,
    fetcher,
    source: narrationSource(audio as unknown as HTMLAudioElement, audio.src, events),
  };
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('narration on static hosts without byte ranges', () => {
  it('keeps native streaming when the requested position is seekable', () => {
    const f = fixture(192);
    f.source.seek(58);
    expect(f.audio.currentTime).toBe(58);
    expect(f.fetcher).not.toHaveBeenCalled();
  });
  it('does not fetch a second copy merely to start at zero', () => {
    const f = fixture();
    f.source.loadedMetadata();
    expect(f.fetcher).not.toHaveBeenCalled();
    expect(f.events.ready).toHaveBeenCalledOnce();
  });
  it('retains a deep-link seek until metadata arrives', async () => {
    const f = fixture(0, 0);
    f.source.seek(58);
    expect(f.fetcher).not.toHaveBeenCalled();
    f.audio.readyState = 1;
    f.source.loadedMetadata();
    await vi.waitFor(() => expect(f.audio.load).toHaveBeenCalledOnce());
    expect(f.source.loading).toBe(true);
    f.source.loadedMetadata();
    expect(f.audio.currentTime).toBe(58);
    expect(f.source.loading).toBe(false);
  });
  it('uses one fallback and honors the newest seek, including replay', async () => {
    const f = fixture();
    f.source.seek(58);
    f.source.seek(142);
    f.source.seek(0);
    await vi.waitFor(() => expect(f.audio.src).toBe('blob:recording'));
    f.source.loadedMetadata();
    expect(f.audio.currentTime).toBe(0);
    f.source.seek(142);
    expect(f.audio.currentTime).toBe(142);
    expect(f.fetcher).toHaveBeenCalledOnce();
    expect(f.audio.pause).toHaveBeenCalledOnce();
  });
  it('falls back to silent visual playback on a failed asset response', async () => {
    const f = fixture();
    f.fetcher.mockResolvedValue(new Response('', { status: 503 }));
    f.source.seek(58);
    await vi.waitFor(() => expect(f.events.error).toHaveBeenCalledOnce());
    expect(f.source.loading).toBe(false);
    expect(f.audio.load).not.toHaveBeenCalled();
  });
  it('aborts in-flight work and ignores late responses after navigation', async () => {
    const f = fixture();
    let resolve!: (value: Response) => void;
    f.fetcher.mockReturnValue(new Promise<Response>((done) => (resolve = done)));
    f.source.seek(58);
    f.source.dispose();
    expect(f.fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    resolve(new Response(new Blob(['late'])));
    await new Promise((done) => setTimeout(done, 0));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(f.events.error).not.toHaveBeenCalled();
  });
  it('releases its object URL and clamps end-of-film seeking', async () => {
    const f = fixture();
    f.source.seek(500);
    await vi.waitFor(() => expect(f.audio.load).toHaveBeenCalledOnce());
    f.source.loadedMetadata();
    expect(f.audio.currentTime).toBe(192);
    f.source.dispose();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:recording');
  });
  it('releases a failed Blob, waits for explicit retry, and restores the newest requested time', async () => {
    const f = fixture();
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce('blob:broken')
      .mockReturnValueOnce('blob:recovered');
    f.source.seek(58);
    await vi.waitFor(() => expect(f.audio.src).toBe('blob:broken'));
    f.audio.readyState = 0;
    f.source.mediaError();
    expect(f.source.loading).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:broken');
    expect(f.events.error).toHaveBeenCalledOnce();
    // Late metadata from the failed load must not declare the source usable.
    f.source.loadedMetadata();
    expect(f.events.ready).not.toHaveBeenCalled();
    f.source.seek(142);
    expect(f.fetcher).toHaveBeenCalledOnce();
    f.source.retry();
    expect(f.source.loading).toBe(true);
    await vi.waitFor(() => expect(f.audio.src).toBe('blob:recovered'));
    expect(f.fetcher).toHaveBeenCalledTimes(2);
    expect(f.fetcher.mock.calls[1][0]).toBe('/narration/test.mp3');
    expect(f.fetcher.mock.calls[1][1]?.cache).toBe('reload');
    f.audio.readyState = 4;
    f.source.loadedMetadata();
    expect(f.audio.currentTime).toBe(142);
    expect(f.source.loading).toBe(false);
    expect(f.events.ready).toHaveBeenCalledOnce();
    f.source.dispose();
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([
      ['blob:broken'],
      ['blob:recovered'],
    ]);
  });
  it('ignores a cancelled earlier response after a retry has supplied its own Blob', async () => {
    const f = fixture();
    let earlier!: (value: Response) => void, retry!: (value: Response) => void;
    f.fetcher
      .mockReturnValueOnce(new Promise<Response>((done) => (earlier = done)))
      .mockReturnValueOnce(new Promise<Response>((done) => (retry = done)));
    f.source.seek(58);
    f.source.mediaError();
    expect(f.fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    f.source.seek(142);
    f.source.retry();
    retry(new Response(new Blob(['recovered'])));
    await vi.waitFor(() => expect(f.audio.load).toHaveBeenCalledOnce());
    earlier(new Response(new Blob(['late corrupt response'])));
    await new Promise((done) => setTimeout(done, 0));
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(f.audio.load).toHaveBeenCalledOnce();
    f.source.loadedMetadata();
    expect(f.audio.currentTime).toBe(142);
    expect(f.events.error).toHaveBeenCalledOnce();
    f.source.dispose();
  });
  it('aborts a retry on navigation and cannot recreate a Blob from its late response', async () => {
    const f = fixture();
    f.source.seek(58);
    await vi.waitFor(() => expect(f.audio.load).toHaveBeenCalledOnce());
    f.source.mediaError();
    let complete!: (value: Response) => void;
    f.fetcher.mockReturnValueOnce(new Promise<Response>((done) => (complete = done)));
    f.source.retry();
    f.source.dispose();
    expect(f.fetcher.mock.calls[1][1]?.signal?.aborted).toBe(true);
    complete(new Response(new Blob(['late retry'])));
    await new Promise((done) => setTimeout(done, 0));
    f.source.loadedMetadata();
    f.source.retry();
    expect(f.source.loading).toBe(false);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(f.audio.load).toHaveBeenCalledOnce();
    expect(f.events.ready).not.toHaveBeenCalled();
    expect(f.events.error).toHaveBeenCalledOnce();
    expect(f.fetcher).toHaveBeenCalledTimes(2);
  });
});
