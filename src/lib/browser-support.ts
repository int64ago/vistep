/**
 * Shared layout and language/runtime prerequisites. Optional engines are checked where used:
 * lack of WebGL must not reject SVG lessons, nor lack of Web Audio reject a silent film.
 * Three.js views use their 2D alternatives; Workers/audio expose their existing local retry
 * or fallback. This is a core baseline, not a device-performance certification.
 *
 * Both functions are inlined into the document with `Function.prototype.toString`, so they must
 * stay self-contained and use only syntax every browser back to ES2015 can parse — the notice has
 * to render precisely in the browsers that cannot run the rest of the site.
 */
export const BROWSER_BASELINE = 'Chrome 108 · Edge 108 · Firefox 121 · Safari 15.4';

export function browserSupportGaps(w: any): string[] {
  var gaps: string[] = [];
  var doc = w.document;
  function need(ok: boolean, label: string) {
    if (!ok) gaps.push(label);
  }
  need(!!doc && 'noModule' in doc.createElement('script'), 'ES modules');
  need(!!w.Array && typeof w.Array.prototype.findLast === 'function', 'Array.prototype.findLast');
  need(typeof w.structuredClone === 'function', 'structuredClone');
  need(typeof w.ResizeObserver === 'function', 'ResizeObserver');
  need(typeof w.IntersectionObserver === 'function', 'IntersectionObserver');
  var css = w.CSS;
  if (!css || typeof css.supports !== 'function') gaps.push('CSS.supports');
  else {
    need(css.supports('selector(:has(a))'), 'CSS :has()');
    need(css.supports('height', '100svh'), 'CSS svh units');
    need(css.supports('aspect-ratio', '1'), 'CSS aspect-ratio');
  }
  return gaps;
}

/** Runs inline after the notice markup: marks the document and reveals the notice. */
export function bootBrowserSupport(gaps: typeof browserSupportGaps, w: any) {
  var missing: string[] = [];
  try {
    missing = gaps(w);
  } catch (error) {
    missing = ['feature detection'];
  }
  if (!missing.length) return;
  var root = w.document.documentElement;
  root.setAttribute('data-unsupported', missing.join(', '));
  var notice = w.document.getElementById('browser-support');
  if (!notice) return;
  var list = notice.querySelector('[data-gaps]');
  if (list) list.textContent = missing.join(' · ');
  notice.removeAttribute('hidden');
}
