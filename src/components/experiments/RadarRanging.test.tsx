import { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RadarRanging from './RadarRanging';

describe('radar exploration exposes pulse ambiguity and receiver blanking', () => {
  let tree: ReactTestRenderer | undefined;
  afterEach(async () => {
    if (tree) await act(() => tree!.unmount());
    tree = undefined;
    vi.unstubAllGlobals();
  });
  it.each([320, 700])(
    'responds to PRI changes with true and folded ranges at %s px',
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
        tree = create(<RadarRanging />, {
          createNodeMock: (element) =>
            (element.props as { className?: string }).className === 'signal-study radar-study'
              ? {}
              : null,
        });
      });
      const change = async (label: string, value: number) =>
        act(() =>
          tree!.root.findByProps({ 'aria-label': label, type: 'range' }).props.onChange({
            target: { value: String(value) },
          }),
        );
      const timing = () => tree!.root.findByProps({ className: 'radar-timing' });
      const labels = () =>
        timing()
          .findAllByType('b')
          .map((node) => node.children.join(''));
      await change('目标距离', 1500);
      await change('重复间隔', 12);
      expect(timing().props['data-ambiguous']).toBe(false);
      expect(labels()).toContain('1798.8 m');
      await change('重复间隔', 5);
      expect(timing().props['data-ambiguous']).toBe(true);
      expect(labels()).toContain('749.5 m');
      const rangeValues = tree!.root
        .findByProps({ className: 'radar-target-timing' })
        .findAllByType('b')
        .map((node) => node.children.join(''));
      expect(rangeValues).toEqual(['1500.0 m', '1.0 m']);
      expect(
        tree!.root
          .findByProps({ className: 'radar-target-timing' })
          .findByType('p')
          .children.join(''),
      ).toContain('不能把折算值当作测量结果');
      expect(tree!.root.findAllByType('rect')).toHaveLength(3);
      await change('重复间隔', 12);
      expect(timing().props['data-ambiguous']).toBe(false);
      expect(
        tree!.root
          .findByProps({ className: 'radar-target-timing' })
          .findAllByType('b')
          .map((node) => node.children.join('')),
      ).toEqual(['1500.0 m', '1500.0 m']);
    },
  );
});
