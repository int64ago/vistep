import { describe, expect, it, vi } from 'vitest';
import { bootBrowserSupport, browserSupportGaps } from './browser-support';
function modernWindow(overrides: Record<string, unknown> = {}) {
  const gl = { getExtension: () => ({ loseContext() {} }) };
  return {
    document: {
      createElement: (tag: string) =>
        tag === 'script' ? { noModule: false } : { getContext: () => gl },
    },
    Array: { prototype: { findLast() {} } },
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
        CSS: { supports: (a: string, b = '') => !/has|svh/.test(a + b) },
        document: {
          createElement: (tag: string) => (tag === 'script' ? {} : { getContext: () => null }),
        },
      }),
    );
    expect(gaps).toEqual(['ES modules', 'CSS :has()', 'CSS svh units']);
    expect(browserSupportGaps(modernWindow({ CSS: undefined }))).toEqual(['CSS.supports']);
  });
  it('lets two-dimensional lessons run without optional GPU, Worker or sound engines', () => {
    const window = modernWindow({ Worker: undefined, AudioContext: undefined });
    const probe = vi.fn(() => null);
    window.document.createElement = (tag: string) =>
      tag === 'script' ? ({ noModule: false } as any) : { getContext: probe };
    expect(browserSupportGaps(window)).toEqual([]);
    expect(probe).not.toHaveBeenCalled();
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
      ResizeObserver: undefined,
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
    expect(attributes['data-unsupported']).toBe('ResizeObserver');
    expect(hidden).toBe(false);
    expect(text).toBe('ResizeObserver');
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
