import { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Esim from '../components/experiments/Esim';
import { FilmContext } from '../components/lab/Showcase';
function frame(chapter: number, progress: number, playing = false) {
  return renderToStaticMarkup(
    <FilmContext.Provider
      value={{
        watch: true,
        playing,
        time: chapter * 24 + progress * 24,
        chapter,
        chapterProgress: progress,
        chapterTime: progress * 24,
        run: 0,
        duration: 144,
        chapters: [],
      }}
    >
      <Esim />
    </FilmContext.Provider>,
  );
}
describe('eSIM player presentation reconstructs the causal object', () => {
  it('paused seeks render an installed but disabled profile before its later enable step', () => {
    const installed = frame(4, 0.5);
    expect(installed).toContain('data-esim-active="home"');
    expect(installed).toContain('已停用');
    expect(installed).toContain('已安装 ≠ 已启用');
    const enabled = frame(4, 0.85);
    expect(enabled).toContain('data-esim-active="travel"');
    expect(enabled).toContain('原线路保留');
    expect(frame(4, 0.5)).toBe(installed);
  });
  it('retains the true package path and rejected recipient in a paused copy comparison', () => {
    const copied = frame(3, 0.8);
    expect(copied).toContain('eUICC A');
    expect(copied).toContain('eUICC B');
    expect(copied).toContain('BPP · A');
    expect(copied).toContain('复制给 B：拒绝');
    expect(copied).toContain('data-esim-error="none"');
    expect(copied).toBe(frame(3, 0.8, true));
  });
  it('switches the stored identity and reconstructs the fresh network-authentication state', () => {
    expect(frame(5, 0.5)).toContain('data-esim-active="travel"');
    expect(frame(5, 0.75)).toContain('data-esim-active="home"');
    expect(frame(5, 0.75)).toContain('换线路，重新认证');
    expect(frame(5, 0.95)).toContain('K 始终留在芯片');
    expect(frame(1, 0.6)).toContain('profile.example.invalid');
  });
});

describe('eSIM delivery exploration recipient', () => {
  let tree: ReactTestRenderer | undefined;
  afterEach(async () => {
    if (tree) await act(() => tree!.unmount());
    tree = undefined;
    vi.unstubAllGlobals();
  });
  it.each([320, 390, 700])(
    'shows the attempted chip B after a rejected delivery at %i pixels, then restores A',
    async (width) => {
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
      vi.stubGlobal('document', { documentElement: { lang: 'zh-CN' } });
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(private callback: (entries: { contentRect: { width: number } }[]) => void) {}
          observe() {
            this.callback([{ contentRect: { width } }]);
          }
          disconnect() {}
        },
      );
      await act(() => {
        tree = create(<Esim />, {
          createNodeMock: (element) =>
            (element.props as { className?: string }).className === 'esim-scene' ? {} : null,
        });
      });
      const target = (chip: 'A' | 'B') => (width < 600 ? chip : `eUICC ${chip}`);
      const texts = () => tree!.root.findAllByType('text').map((node) => node.children.join(''));
      const changeFault = async (value: string) =>
        act(() => tree!.root.findByType('select').props.onChange({ target: { value } }));
      const changeProgress = async (value: number) =>
        act(() =>
          tree!.root.findByType('input').props.onChange({ target: { value: String(value) } }),
        );

      await changeProgress(100);
      await changeFault('recipient');
      expect(texts()).toContain(target('B'));
      expect(texts()).not.toContain(target('A'));
      expect(texts()).toContain('目标芯片不同，拒绝安装');
      const scene = tree!.root.find((node) => node.props.className === 'esim-scene');
      expect(scene.props['data-esim-active']).toBe('home');
      expect(scene.props['data-esim-error']).toBe('recipient');

      await changeFault('integrity');
      expect(texts()).toContain(target('A'));
      expect(texts()).not.toContain(target('B'));
      await changeFault('none');
      expect(texts()).toContain('eUICC A');
      expect(texts()).toContain('eUICC B');
      expect(texts()).toContain('BPP · A');
      expect(texts()).toContain('复制给 B：拒绝');
      await changeProgress(40);
      expect(texts()).toContain(target('A'));
      expect(texts()).not.toContain(target('B'));
      expect(texts()).toContain(width < 600 ? '→ A' : '封包 → A');
    },
  );
});
