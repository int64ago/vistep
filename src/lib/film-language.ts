/** A manual, same-topic language navigation transfers intent once, never a general autoplay link. */
export type FilmLanguageState = { time: number; playing: boolean };
const REQUEST = 'vistep:film-language-snapshot';
const STORAGE = 'vistep:film-language-handoff';
const MARKER = '__vistepFilm';
const MAX_AGE = 5 * 60 * 1000;
type Request = { slug: string; state?: FilmLanguageState };
type Handoff = FilmLanguageState & {
  slug: string;
  destination: string;
  token: string;
  createdAt: number;
};
const route = (url: URL) => {
  const match = /^\/(en\/)?explore\/([a-z0-9-]+)\/?$/.exec(url.pathname);
  return match ? { slug: match[2], locale: match[1] ? 'en' : 'zh' } : null;
};
const navigationAddress = (href: string) => {
  const url = new URL(href);
  url.pathname = url.pathname.replace(/\/$/, '');
  return url.href;
};
const validState = (state: unknown): state is FilmLanguageState => {
  const value = state as FilmLanguageState | undefined;
  return (
    !!value && Number.isFinite(value.time) && value.time >= 0 && typeof value.playing === 'boolean'
  );
};

/** The getter reads the live clock, rather than a hash or a throttled DOM label. */
export function registerFilmLanguageState(slug: string, read: () => FilmLanguageState) {
  const listener = (event: Event) => {
    const request = (event as CustomEvent<Request>).detail;
    if (request?.slug === slug) request.state = read();
  };
  window.addEventListener(REQUEST, listener);
  return () => window.removeEventListener(REQUEST, listener);
}

function attachFilmState(link: HTMLAnchorElement) {
  const current = new URL(location.href),
    destination = new URL(link.href, current);
  const from = route(current),
    to = route(destination);
  if (
    !from ||
    !to ||
    current.origin !== destination.origin ||
    from.slug !== to.slug ||
    from.locale === to.locale
  )
    return;
  const request: Request = { slug: from.slug };
  window.dispatchEvent(new CustomEvent<Request>(REQUEST, { detail: request }));
  if (!validState(request.state)) return;

  // Preserve reading anchors. Otherwise make the transferable/shareable t reflect this frame.
  const hash = new URLSearchParams(destination.hash.slice(1));
  if (!destination.hash || hash.has('t')) {
    hash.set('t', String(request.state.time));
    destination.hash = hash.toString();
  }
  destination.searchParams.delete(MARKER);
  link.href = destination.href;
  try {
    const token = crypto.randomUUID();
    destination.searchParams.set(MARKER, token);
    const handoff: Handoff = {
      ...request.state,
      slug: from.slug,
      destination: destination.href,
      token,
      createdAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE, JSON.stringify(handoff));
    link.href = destination.href;
  } catch {
    // Storage can be denied. The current t still transfers, using ordinary paused deep-link behavior.
  }
}

/** Bubble phase intentionally follows the discovery catalog's capture-phase query flush. */
export function manualLanguageClick(this: HTMLAnchorElement, event: MouseEvent) {
  if (event.defaultPrevented) return;
  try {
    localStorage.setItem('vistep:language', this.dataset.language!);
  } catch {}
  const current = new URL(location.href),
    destination = new URL(this.href, current);
  const from = route(current),
    to = route(destination);
  const sameTopic = from && to && current.origin === destination.origin && from.slug === to.slug;
  if (location.hash && (!from || sameTopic)) this.hash = location.hash;
  if (sameTopic) {
    // A canceled earlier click must not leave a replayable token on a later new-tab link.
    const clean = new URL(this.href);
    clean.searchParams.delete(MARKER);
    this.href = clean.href;
  }
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (this.target && this.target !== '_self') ||
    this.hasAttribute('download')
  )
    return;
  attachFilmState(this);
}

/** Consume only this navigation's token and exact destination; copied links stay ordinary deep links. */
export function consumeFilmLanguageState(slug: string, duration: number): FilmLanguageState | null {
  const current = new URL(location.href),
    token = current.searchParams.get(MARKER);
  if (!token) return null;
  const destination = current.href;
  current.searchParams.delete(MARKER);
  // No hashchange: the normal chapter-link listener must not turn a restored playing state into pause.
  try {
    history.replaceState(history.state, '', current.href);
  } catch {}
  try {
    const handoff = JSON.parse(sessionStorage.getItem(STORAGE) || 'null') as Handoff | null;
    if (!handoff || handoff.token !== token) return null;
    sessionStorage.removeItem(STORAGE);
    const age = Date.now() - handoff.createdAt;
    if (
      !validState(handoff) ||
      handoff.slug !== slug ||
      route(current)?.slug !== slug ||
      navigationAddress(handoff.destination) !== navigationAddress(destination) ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > MAX_AGE ||
      !Number.isFinite(duration) ||
      duration <= 0
    )
      return null;
    const time = Math.min(duration, handoff.time);
    return { time, playing: handoff.playing && time < duration };
  } catch {
    return null;
  }
}
