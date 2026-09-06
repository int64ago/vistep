import { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import Speaker from './Speaker';
import { FilmContext } from '../lab/Showcase';
import { speakerResponse, speakerShot } from '../../models/speaker';

const director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 6,
  run: 0,
  duration: 187.5,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
afterEach(() => vi.unstubAllGlobals());

async function mount(width: number, locale: string) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', { documentElement: { lang: locale } });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: (entries: unknown[]) => void) {}
      observe() {
        this.callback([{ contentRect: { width } }]);
      }
      disconnect() {}
    },
  );
  let tree!: ReactTestRenderer;
  await act(() => {
    tree = create(
      <FilmContext.Provider value={director}>
        <Speaker />
      </FilmContext.Provider>,
      { createNodeMock: () => ({}) },
    );
  });
  return tree;
}
function readings(tree: ReactTestRenderer) {
  return tree.root.findAll(
    (node) => typeof node.type === 'string' && !!node.props['data-speaker-reading'],
  );
}

describe('speaker chapter-specific electrical observation', () => {
  it('retains model-derived impedance and damping through forward/backward phone seeks in both languages', async () => {
    for (const locale of ['zh', 'en']) {
      const tree = await mount(264, locale);
      for (const progress of [0, 0.5, 1, 0.25, 0]) {
        await act(() => {
          tree.update(
            <FilmContext.Provider value={{ ...director, chapterProgress: progress }}>
              <Speaker />
            </FilmContext.Provider>,
          );
        });
        const visible = readings(tree),
          shot = speakerShot(6, progress);
        const response = speakerResponse(shot.parameters, shot.frequency, shot.voltage);
        expect(visible.map((node) => node.props['data-speaker-reading'])).toEqual([
          'impedance',
          'damping',
        ]);
        expect(visible[0].findByType('b').children.join('')).toBe(
          `${response.impedance.toFixed(2)} Ω`,
        );
        expect(visible[1].findByType('b').children.join('')).toBe(
          `${shot.parameters.damping.toFixed(2)} N·s/m`,
        );
      }
      await act(() => tree.unmount());
    }
  });
  it('keeps the frequency observation in chapter6 and all three readings in wide or manual comparison', async () => {
    for (const locale of ['zh', 'en'])
      for (const width of [264, 840]) {
        const tree = await mount(width, locale);
        await act(() =>
          tree.update(
            <FilmContext.Provider value={{ ...director, chapter: 5, chapterProgress: 0.6 }}>
              <Speaker />
            </FilmContext.Provider>,
          ),
        );
        expect(readings(tree).map((node) => node.props['data-speaker-reading'])).toEqual(
          width < 690 ? ['frequency', 'damping'] : ['frequency', 'impedance', 'damping'],
        );
        await act(() =>
          tree.update(
            <FilmContext.Provider value={{ ...director, watch: false }}>
              <Speaker />
            </FilmContext.Provider>,
          ),
        );
        const response = tree.root
          .findAllByType('button')
          .find(
            (node) => node.children.join('') === (locale === 'zh' ? '稳态响应' : 'Steady response'),
          )!;
        expect(response).toBeDefined();
        await act(() => response.props.onClick());
        expect(readings(tree).map((node) => node.props['data-speaker-reading'])).toEqual([
          'frequency',
          'impedance',
          'damping',
        ]);
        await act(() => tree.unmount());
      }
  });
  it('has no CSS rule that silently hides a response reading after responsive selection', () => {
    const css = readFileSync(new URL('../../styles/speaker.css', import.meta.url), 'utf8');
    expect(css).not.toMatch(/\.speaker-response-readout[^{}]*\{[^{}]*display:\s*none/);
  });
});
