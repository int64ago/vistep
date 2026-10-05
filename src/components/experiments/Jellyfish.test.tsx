import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Jellyfish from './Jellyfish';
import { JELLY } from '../../models/jellyfish';
const film = vi.hoisted(() => ({ watch: true, playing: false, chapter: 4, chapterProgress: 0.5 }));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => film }));
vi.mock('../three/JellyfishStudio', () => ({ default: () => null }));
vi.mock('../three/JellyfishFlat', () => ({ default: () => null }));
const trees: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const tree of trees.splice(0)) await act(() => tree.unmount());
  vi.unstubAllGlobals();
  film.watch = true;
  film.chapter = 4;
  film.chapterProgress = 0.5;
});
describe('Jellyfish state and teaching labels', () => {
  it('renders the fully relaxed force chapter from a direct seek', () => {
    const html = renderToStaticMarkup(<Jellyfish />);
    expect(html).toContain('0.00 mL/s');
    expect(html).toContain('回收项仍提供推力');
    expect(html).toMatch(/data-active="true"[^>]*>完全舒张/);
  });
  it('keeps virtual comparison separate from measured animal performance', () => {
    film.chapter = 5;
    const html = renderToStaticMarkup(<Jellyfish />);
    expect(html).toContain('相同伞运动与阻力');
    expect(html).toContain('数值来自未校准模型');
    expect(html).toContain('教学模型速度');
  });
  it('changes the actual geometry and flux when amplitude becomes zero', async () => {
    film.watch = false;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    let tree!: ReactTestRenderer;
    await act(() => {
      tree = create(<Jellyfish />);
      trees.push(tree);
    });
    const buttons = () => tree.root.findAllByType('button');
    await act(() =>
      buttons()
        .find((b) => b.children.join('') === '看排水')!
        .props.onClick(),
    );
    const range = tree.root.findAllByType('input').find((i) => i.props.max === '35')!;
    await act(() => range.props.onChange({ target: { value: '0' } }));
    const values = tree.root
      .findByProps({ className: 'jelly-volume' })
      .findAllByType('b')
      .map((n) => n.children.join(''));
    expect(values).toEqual(['7.54 mL', '0.00 mL/s']);
    await act(() =>
      buttons()
        .find((b) => b.children.join('') === '同动作比较')!
        .props.onClick(),
    );
    expect(
      tree.root
        .findAllByProps({ className: 'jelly-distance-row' })
        .map((row) => row.findByType('b').children.join('')),
    ).toEqual(['0.0 mm', '0.0 mm']);
    expect(JSON.stringify(tree.toJSON())).not.toContain('NaN');
    expect(JSON.stringify(tree.toJSON())).not.toContain('Infinity');
  });
  it('describes zero amplitude correctly in the fixed vortex view and retains normal rest flow', async () => {
    film.watch = false;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    let tree!: ReactTestRenderer;
    await act(() => {
      tree = create(<Jellyfish />);
      trees.push(tree);
    });
    const note = () => tree.root.findByProps({ className: 'jelly-mode-note' }).children.join('');
    expect(note()).toBe('伞已静止，水的运动还没有结束');
    const section = () =>
      tree.root
        .findAllByType('label')
        .find((label) => label.children.includes('固定二维剖面'))!
        .findByType('input');
    await act(() => section().props.onChange({ target: { checked: true } }));
    await act(() =>
      tree.root
        .findAllByType('button')
        .find((button) => button.children.join('') === '看涡环')!
        .props.onClick(),
    );
    const amplitude = () =>
      tree.root.findAllByType('input').find((input) => input.props.max === '35')!;
    await act(() => amplitude().props.onChange({ target: { value: '0' } }));
    const clock = () => tree.root.findByProps({ type: 'range', max: JELLY.duration });
    for (const time of [0.2, 1, 1.7]) {
      await act(() => clock().props.onChange({ target: { value: String(time) } }));
      expect(section().props.checked).toBe(true);
      expect(tree.root.findByProps({ className: 'jelly-study' }).props['data-view']).toBe(
        'vortices',
      );
      expect(note()).toBe('没有形变，模型没有排水或推进。');
    }
    await act(() => amplitude().props.onChange({ target: { value: '22' } }));
    expect(note()).toBe('伞已静止，水的运动还没有结束');
  });
  it.each([4, 0.8])(
    'shades actual fully relaxed intervals at a %s second period',
    async (period) => {
      film.watch = false;
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
      let tree!: ReactTestRenderer;
      await act(() => {
        tree = create(<Jellyfish />);
        trees.push(tree);
      });
      await act(() =>
        tree.root
          .findAllByType('button')
          .find((b) => b.children.join('') === '同动作比较')!
          .props.onClick(),
      );
      const input = tree.root
        .findAllByType('input')
        .find((i) => i.props.min === '.8' && i.props.max === '4')!;
      await act(() => input.props.onChange({ target: { value: String(period) } }));
      const windows = tree.root.findByProps({ className: 'jelly-velocity' }).findAllByType('rect');
      expect(windows).toHaveLength(JELLY.duration / period);
      windows.forEach((window, index) => {
        const expectedStart = (index + JELLY.relaxationEnd) * period;
        const expectedEnd = (index + 1) * period;
        expect(Math.abs(window.props['data-rest-start'] - expectedStart)).toBeLessThanOrEqual(
          JELLY.dt + 1e-12,
        );
        expect(Math.abs(window.props['data-rest-end'] - expectedEnd)).toBeLessThanOrEqual(
          JELLY.dt + 1e-12,
        );
        expect(window.props.width).toBeGreaterThan(0);
      });
    },
  );
});
