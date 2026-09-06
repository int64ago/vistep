/**
 * Everything a page needs before it is worth hydrating. The list mirrors what the experiments
 * and stylesheets actually use (WebGL 2 for Three.js, `:has()` and container queries in the
 * layouts, `toReversed`/`structuredClone` in the models, Workers for the Transformer, Web Audio
 * for the sound experiments). A browser missing any of them gets one clear notice instead of a
 * half-working page; there is deliberately no degraded mode.
 *
 * Both functions are inlined into the document with `Function.prototype.toString`, so they must
 * stay self-contained and use only syntax every browser back to ES2015 can parse — the notice has
 * to render precisely in the browsers that cannot run the rest of the site.
 */
export const BROWSER_BASELINE = 'Chrome 111 · Edge 111 · Firefox 121 · Safari 16.4';

export function browserSupportGaps(w: any): string[] {
  var gaps: string[] = [];
  var doc = w.document;
  function need(ok: boolean, label: string) {
    if (!ok) gaps.push(label);
  }
  need(!!doc && 'noModule' in doc.createElement('script'), 'ES modules');
  need(
    !!w.Array && typeof w.Array.prototype.toReversed === 'function',
    'Array.prototype.toReversed',
  );
  need(typeof w.structuredClone === 'function', 'structuredClone');
  need(typeof w.ResizeObserver === 'function', 'ResizeObserver');
  need(typeof w.IntersectionObserver === 'function', 'IntersectionObserver');
  need(typeof w.Worker === 'function', 'Web Workers');
  need(
    typeof w.AudioContext === 'function' || typeof w.webkitAudioContext === 'function',
    'Web Audio',
  );
  var css = w.CSS;
  if (!css || typeof css.supports !== 'function') gaps.push('CSS.supports');
  else {
    need(css.supports('selector(:has(a))'), 'CSS :has()');
    need(css.supports('color', 'color-mix(in srgb, red, blue)'), 'CSS color-mix()');
    need(css.supports('container-type', 'inline-size'), 'CSS container queries');
    need(css.supports('height', '100svh'), 'CSS svh units');
    need(css.supports('aspect-ratio', '1'), 'CSS aspect-ratio');
  }
  var gl: any = null;
  try {
    gl = doc.createElement('canvas').getContext('webgl2');
  } catch (error) {}
  need(!!gl, 'WebGL 2');
  if (gl) {
    // Browsers cap live contexts; release the probe so the experiments get theirs.
    var lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
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
