import { describe, expect, it } from 'vitest';
import { bootBrowserSupport, browserSupportGaps } from './browser-support';
function modernWindow(overrides: Record<string, unknown> = {}) {
  const gl = { getExtension: () => ({ loseContext() {} }) };
  return {
    document: {
      createElement: (tag: string) =>
        tag === 'script' ? { noModule: false } : { getContext: () => gl },
    },
    Array: { prototype: { toReversed() {} } },
    structuredClone() {},
    ResizeObserver: class {},
    IntersectionObserver: class {},
    Worker: class {},
    AudioContext: class {},
    CSS: { supports: () => true },
    ...overrides,
  };
}
describe('browser support gate', () => {
  it('accepts a browser with every required feature', () => {
    expect(browserSupportGaps(modernWindow())).toEqual([]);
  });
  it('names each missing capability', () => {
    const gaps = browserSupportGaps(
      modernWindow({
        Worker: undefined,
        AudioContext: undefined,
        CSS: { supports: (a: string) => !/has|color/.test(a) },
        document: {
          createElement: (tag: string) => (tag === 'script' ? {} : { getContext: () => null }),
        },
      }),
    );
    expect(gaps).toEqual([
      'ES modules',
      'Web Workers',
      'Web Audio',
      'CSS :has()',
      'CSS color-mix()',
      'WebGL 2',
    ]);
    expect(browserSupportGaps(modernWindow({ CSS: undefined }))).toEqual(['CSS.supports']);
  });
  it('stays parseable by browsers that will fail the check', () => {
    for (const fn of [browserSupportGaps, bootBrowserSupport]) {
      const source = fn.toString();
      expect(source).not.toMatch(/\?\.|\?\?|`|=>|\basync\b|\bconst\b|\blet\b/);
    }
  });
  it('marks the document and reveals the notice only when something is missing', () => {
    const attributes: Record<string, string> = {};
    let hidden = true,
      text = '';
    const w = modernWindow({
      Worker: undefined,
      document: {
        ...modernWindow().document,
        documentElement: {
          setAttribute: (name: string, value: string) => (attributes[name] = value),
        },
        getElementById: () => ({
          removeAttribute: () => (hidden = false),
          querySelector: () => ({
            set textContent(value: string) {
              text = value;
            },
          }),
        }),
      },
    });
    bootBrowserSupport(browserSupportGaps, w);
    expect(attributes['data-unsupported']).toBe('Web Workers');
    expect(hidden).toBe(false);
    expect(text).toBe('Web Workers');
    const untouched: Record<string, string> = {};
    bootBrowserSupport(browserSupportGaps, {
      ...modernWindow(),
      document: {
        ...modernWindow().document,
        documentElement: { setAttribute: (n: string, v: string) => (untouched[n] = v) },
      },
    });
    expect(untouched).toEqual({});
  });
});
