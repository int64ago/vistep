/** Browser-neutral review flow. CUA's evaluate adapter is strictly read-only DOM inspection.
 * Navigation, scrolling and controls use the tab/locator APIs; CI injects faults separately.
 */
export const REVIEW_SCHEMA_VERSION = 1;
export const SMOKE_SLUGS = [
  'printer',
  'network',
  'pendulum',
  'excavator',
  'radar-ranging',
  'database-index',
  'cell-handover',
];
export const REVIEW_VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
];
const keyChapters = {
  printer: [0, 5, 10],
  network: [0, 4, 10],
  pendulum: [0, 4, 10],
  excavator: [0, 3, 6],
  'radar-ranging': [0, 3, 7],
  'database-index': [0, 4, 6],
  'cell-handover': [0, 3, 6],
};
export function createReviewPlan({
  films,
  all = false,
  slugs,
  locales = ['zh', 'en'],
  viewports = REVIEW_VIEWPORTS,
  allChapters = false,
}) {
  const selected = slugs ?? (all ? ['home', ...Object.keys(films)] : ['home', ...SMOKE_SLUGS]);
  return selected.flatMap((slug) => {
    if (slug !== 'home' && !films[slug]) throw new Error(`Unknown review scene: ${slug}`);
    const film = films[slug];
    const chapters =
      slug === 'home'
        ? [null]
        : allChapters
          ? film.chapters.map((_, i) => i)
          : [
              ...new Set(
                (
                  keyChapters[slug] ?? [
                    0,
                    Math.floor(film.chapters.length / 2),
                    film.chapters.length - 1,
                  ]
                ).filter((i) => i < film.chapters.length),
              ),
            ];
    return locales.flatMap((locale) =>
      viewports.flatMap((viewport) =>
        chapters.map((chapter) => ({
          slug,
          locale,
          viewport,
          chapter,
          time: chapter === null ? null : film.chapters[chapter].at,
          chapterId: chapter === null ? null : film.chapters[chapter].id,
        })),
      ),
    );
  });
}

/** Must remain self-contained: the same function is serialized into Playwright and CUA. */
export function readBrowserState() {
  const bounds = (element) => {
    if (!element) return null;
    const b = element.getBoundingClientRect();
    return {
      x: b.x,
      y: b.y,
      top: b.top,
      right: b.right,
      bottom: b.bottom,
      left: b.left,
      width: b.width,
      height: b.height,
    };
  };
  const visible = (element) => {
    if (!element || element.closest('defs,clipPath,mask,[hidden]')) return false;
    const box = element.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return false;
    for (let n = element; n && n.nodeType === 1; n = n.parentElement) {
      const style = getComputedStyle(n);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.01)
        return false;
    }
    return true;
  };
  const player = document.querySelector('.showcase');
  const stage = document.querySelector('.showcase-film');
  const svgFontSamples = [...document.querySelectorAll('.showcase-film svg text')]
    .filter(visible)
    .map((element) => {
      const matrix = typeof element.getScreenCTM === 'function' ? element.getScreenCTM() : null;
      const svg = element.closest('svg');
      const vb = (svg?.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
      const box = bounds(svg);
      const sx = box && vb[2] > 0 ? box.width / vb[2] : 1;
      const sy = box && vb[3] > 0 ? box.height / vb[3] : 1;
      const estimate = svg?.getAttribute('preserveAspectRatio') === 'none' ? sy : Math.min(sx, sy);
      const scale = matrix ? Math.hypot(matrix.c, matrix.d) : estimate;
      const fontPx = Number(getComputedStyle(element).fontSize.replace('px', ''));
      return {
        kind: 'svg',
        text: element.textContent?.trim().slice(0, 100),
        fontPx,
        effectivePx: fontPx * scale,
        measurementMethod: matrix ? 'screen-ctm' : 'viewbox-estimate',
        bounds: bounds(element),
      };
    });
  const htmlFontSamples = [
    ...document.querySelectorAll(
      '.printer-surface-title,.printer-surface-key,.printer-annotation p,.network-map-label,.network-map-label small,.network-cache-label,.network-node .node-title,.network-node time,.pendulum-trace-axis span,.pendulum-parameters,.circuit-port,.circuit-label',
    ),
  ]
    .filter(visible)
    .map((element) => {
      const fontPx = Number(getComputedStyle(element).fontSize.replace('px', ''));
      return {
        kind: 'html',
        text: element.textContent?.trim().slice(0, 100),
        fontPx,
        effectivePx: fontPx,
        measurementMethod: 'css-font-size',
        bounds: bounds(element),
      };
    });
  const fontSamples = [...svgFontSamples, ...htmlFontSamples];
  const controls = [
    ...document.querySelectorAll(
      '.film-transport button,.film-transport input,.film-chapters summary',
    ),
  ]
    .filter(visible)
    .map((element) => ({
      label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 100),
      tag: element.tagName.toLowerCase(),
      bounds: bounds(element),
    }));
  const art = [...document.querySelectorAll('.showcase-film svg,.showcase-film canvas')]
    .filter(visible)
    .map((element) => ({ tag: element.tagName.toLowerCase(), bounds: bounds(element) }));
  const audio = document.querySelector('audio[data-narration]');
  const homeButton = document.querySelector('.object-toggle');
  const unsupported = document.documentElement.getAttribute('data-unsupported');
  return {
    href: document.URL || null,
    locale: document.documentElement.lang,
    title: document.title,
    viewport: {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    },
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    unsupported,
    sceneLoading: [...document.querySelectorAll('.showcase-film .lab-loading')].some(visible),
    errors: [...document.querySelectorAll('.error-state')].map((e) => e.textContent?.trim()),
    chapter: player ? Number(player.getAttribute('data-chapter')) : null,
    time: player ? Number(player.querySelector('.film-timeline input')?.value) : null,
    mode: player?.getAttribute('data-mode') ?? null,
    narration: player?.getAttribute('data-narration') ?? null,
    voiceStatus: document.querySelector('.voice-status')?.textContent?.trim() ?? null,
    waiting: document.querySelector('.film-voice')?.textContent?.trim() ?? null,
    audio: audio
      ? {
          currentTime: audio.currentTime,
          paused: audio.paused,
          readyState: audio.readyState,
          source: audio.dataset.narrationSrc,
        }
      : null,
    bounds: {
      player: bounds(player),
      stage: bounds(stage),
      caption: bounds(document.querySelector('.film-caption')),
      transport: bounds(document.querySelector('.film-transport')),
    },
    art,
    fontSamples,
    svgFontSamples,
    htmlFontSamples,
    controls,
    invalidPaths: [...document.querySelectorAll('.showcase-film svg path[d]')]
      .filter((e) => visible(e.closest('svg')) && !e.closest('defs,clipPath,mask,[hidden]'))
      .filter((e) => /NaN|Infinity/.test(e.getAttribute('d'))).length,
    coreNoticeVisible: visible(document.querySelector('#browser-support')),
    fallbackVisible: [...document.querySelectorAll('.studio-fallback,.dimension-fallback')].some(
      visible,
    ),
    liveCanvasCount: [...document.querySelectorAll('.showcase-film canvas')].filter(visible).length,
    workerMessage: document.querySelector('.model-error')?.textContent?.trim() ?? null,
    bodyText: document.body.innerText.slice(-6000),
    brandState: document.querySelector('.brand-opening')?.getAttribute('data-state'),
    homeReady: !!homeButton,
    homePlaying: !!homeButton && /暂停|pause/i.test(homeButton.getAttribute('aria-label') || ''),
    fontsReady: !document.fonts || document.fonts.status === 'loaded',
  };
}

export function layoutFindings(state, expected) {
  const failures = [],
    observations = [];
  if (state.horizontalOverflow > 1)
    failures.push(`Horizontal overflow: ${state.horizontalOverflow}px`);
  if (state.unsupported)
    failures.push(`Core capability gate rejected the browser: ${state.unsupported}`);
  if (state.errors.length) failures.push(`Scene error: ${state.errors.join('; ')}`);
  if (state.sceneLoading)
    failures.push('Scene is still preparing; a loading frame is not a ready lesson');
  if (state.invalidPaths)
    failures.push(`${state.invalidPaths} visible SVG paths contain NaN/Infinity`);
  if (expected.slug !== 'home') {
    if (!state.bounds.player || !state.bounds.stage) failures.push('Player/stage is missing');
    if (state.chapter !== expected.chapter)
      failures.push(`Expected chapter ${expected.chapter}, received ${state.chapter}`);
    if (!Number.isFinite(state.time) || Math.abs(state.time - expected.time) > 0.2)
      failures.push(`Expected ${expected.time}s, received ${state.time}s`);
  }
  const smallFonts = state.fontSamples.filter((item) => item.effectivePx < 15.9);
  const smallControls = state.controls.filter(
    (item) => item.bounds.height < 43.9 || item.bounds.width < 43.9,
  );
  if (smallFonts.length)
    observations.push(
      `${smallFonts.length} labels below 16 CSS pixels (see measurementMethod); inspect the recorded labels and screenshot`,
    );
  if (smallControls.length)
    observations.push(
      `${smallControls.length} transport targets below 44px; inspect recorded bounds`,
    );
  if (state.bounds.player?.height > state.viewport.height)
    observations.push(
      'Complete player is taller than this viewport; inspect current cause, caption and transport together',
    );
  return { failures, observations, smallFonts, smallControls };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function sampleIsReady(state, sample) {
  return sample.slug === 'home'
    ? state.homeReady && state.fontsReady
    : !!state.bounds.player &&
        !state.sceneLoading &&
        state.chapter === sample.chapter &&
        Number.isFinite(state.time) &&
        Math.abs(state.time - sample.time) < 0.2 &&
        state.fontsReady;
}
export async function waitForBrowserState(
  tab,
  predicate,
  { timeoutMs = 20_000, pollMs = 150, observe = async () => {}, pause = delay } = {},
) {
  const started = Date.now();
  let state;
  while (Date.now() - started < timeoutMs) {
    await observe();
    state = await tab.playwright.evaluate(readBrowserState);
    if (predicate(state)) return state;
    await pause(pollMs);
  }
  throw new Error(
    `Timed out waiting for browser state: ${JSON.stringify({ href: state?.href, chapter: state?.chapter, time: state?.time, errors: state?.errors, unsupported: state?.unsupported })}`,
  );
}

/** A single bounded case is also convenient for CUA tool turns. No DOM mutation occurs in evaluate. */
export async function inspectBrowserCase({
  tab,
  origin,
  sample,
  setViewport,
  saveScreenshot = async () => null,
  getLogs = async () => [],
  observe = async () => {},
  pause = delay,
  browserInfo = null,
}) {
  const startedAt = new Date().toISOString();
  const name = `${sample.slug}-${sample.locale}-${sample.viewport.width}-${sample.chapter === null ? 'home' : `chapter-${sample.chapter + 1}`}`;
  const route =
    sample.slug === 'home'
      ? `/${sample.locale}/`
      : `${sample.locale === 'en' ? '/en' : ''}/explore/${sample.slug}/`;
  const url = new URL(route, origin).href;
  let state = null,
    screenshot = null,
    findings = { failures: [], observations: [] };
  try {
    await setViewport(sample.viewport);
    await tab.goto(url + (sample.time === null ? '' : '#experiment'));
    await observe();
    if (sample.time !== null) await tab.goto(url + `#t=${sample.time}`);
    state = await waitForBrowserState(tab, (s) => sampleIsReady(s, sample), { observe, pause });
    if (sample.slug === 'home') {
      if (state.brandState !== 'settled') await tab.playwright.locator('.brand-skip').click();
      if (state.homePlaying) await tab.playwright.locator('.object-toggle').click();
    } else {
      // Native anchor navigation scrolls without an evaluate-side effect. It preserves the paused director.
      await tab.goto(url + '#experiment');
    }
    await observe();
    // Let ResizeObserver and one requested GPU frame settle; this is not simulated film playback.
    await pause(180);
    state = await tab.playwright.evaluate(readBrowserState);
    state.href ||= url;
    findings = layoutFindings(state, sample);
    screenshot = await saveScreenshot(name, await tab.getScreenshot({ emit: false }));
  } catch (error) {
    findings.failures.push(error instanceof Error ? error.message : String(error));
    try {
      screenshot = await saveScreenshot(name, await tab.getScreenshot({ emit: false }));
    } catch {}
  }
  const console = await getLogs();
  const errors = console.filter((item) => item.level === 'error' || item.level === 'pageerror');
  if (errors.length)
    findings.failures.push(`${errors.length} console/page errors; see console evidence`);
  return {
    ...sample,
    name,
    browserInfo,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: findings.failures.length ? 'failed' : 'passed',
    conditions: {
      kind: 'paused-keyframe-browser-smoke',
      completePlayback: false,
      listening: false,
      physicalDevice: false,
    },
    state,
    ...findings,
    console,
    screenshot,
  };
}

export async function runBrowserReview(options) {
  const results = [];
  for (const sample of options.plan) {
    const result = await inspectBrowserCase({ ...options, sample });
    results.push(result);
    await options.onResult?.(result, results);
  }
  return results;
}
