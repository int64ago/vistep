import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BodyFatScale from './BodyFatScale';
const film = vi.hoisted(() => ({ watch: true, playing: false, chapter: 0, chapterProgress: 0 }));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => film }));
vi.mock('../three/BodyFatScaleStudio', () => ({
  default: () => <div data-test-scale-assembly="true" />,
}));
const trees: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const tree of trees.splice(0)) await act(() => tree.unmount());
  vi.unstubAllGlobals();
  Object.assign(film, { watch: true, playing: false, chapter: 0, chapterProgress: 0 });
});
async function mount() {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  let tree!: ReactTestRenderer;
  await act(() => {
    tree = create(<BodyFatScale />);
    trees.push(tree);
  });
  return tree;
}
async function choose(tree: ReactTestRenderer, label: string) {
  await act(() =>
    tree.root
      .findAllByType('button')
      .find((b) => b.children.join('') === label)!
      .props.onClick(),
  );
}
describe('body-fat scale causal presentation', () => {
  it('shows a different causal referent on every directed chapter and reconstructs a backwards seek', () => {
    const referents = [
      'data-test-scale-assembly',
      'R+',
      '闭合电流',
      'R =',
      'Cₘ',
      '教学系数未标定',
      '真实脂肪质量',
    ];
    for (let chapter = 0; chapter < 7; chapter++) {
      Object.assign(film, { chapter, chapterProgress: 0.7 });
      const first = renderToStaticMarkup(<BodyFatScale />);
      expect(first).toContain(referents[chapter]);
      expect(first).not.toMatch(/NaN|Infinity/);
      film.chapterProgress = 0.1;
      renderToStaticMarkup(<BodyFatScale />);
      film.chapterProgress = 0.7;
      expect(renderToStaticMarkup(<BodyFatScale />)).toBe(first);
    }
    film.chapter = 1;
    film.chapterProgress = 0;
    expect(renderToStaticMarkup(<BodyFatScale />)).toContain('0.000');
    film.chapterProgress = 1;
    expect(renderToStaticMarkup(<BodyFatScale />)).not.toContain('>0.000');
  });

  it('lets the actual water control change estimated fat while the displayed actual fat mass remains fixed', async () => {
    film.watch = false;
    const tree = await mount();
    await choose(tree, '只改变水分');
    const values = () =>
      tree.root
        .findAllByProps({ className: 'bfs-fat-line' })
        .map((n) => n.findByType('strong').children.join(''));
    expect(values()).toEqual(['15.00 kg', '15.00 kg']);
    const water = tree.root.findByProps({ type: 'range', min: '-3' });
    await act(() => water.props.onChange({ target: { value: '3' } }));
    expect(values()[0]).toBe('15.00 kg');
    expect(values()[1]).not.toBe('15.00 kg');
    expect(tree.root.findByProps({ className: 'bfs-study' }).props['data-bfs-fat']).toBe(15);
    expect(tree.root.findByProps({ className: 'bfs-study' }).props['data-bfs-water']).toBe(43.15);
  });

  it('removes estimated output when actual contact or predictor frequency controls become invalid', async () => {
    film.watch = false;
    const tree = await mount();
    await choose(tree, '看估算');
    const steps = () =>
      tree.root.findAllByProps({ className: 'bfs-estimate-step' }).map((n) =>
        n
          .findByType('strong')
          .children.filter((v) => typeof v === 'string')
          .join(''),
      );
    expect(steps()[3]).toContain('15.00');
    await act(() =>
      tree.root.findByProps({ type: 'checkbox' }).props.onChange({ target: { checked: false } }),
    );
    expect(steps().every((v) => v.includes('—'))).toBe(true);
    expect(tree.root.findByProps({ role: 'status' }).children.join('')).toContain(
      '阻抗与脂肪估计不可用',
    );
    await choose(tree, '看四电极');
    const currentLabel = tree.root
      .findByProps({ className: 'bfs-route-key' })
      .findAllByType('span')[0]
      .children.join('');
    expect(currentLabel).toContain('电流已断开');
    expect(currentLabel).not.toContain('闭合电流');
    await choose(tree, '看估算');
    await act(() =>
      tree.root.findByProps({ type: 'checkbox' }).props.onChange({ target: { checked: true } }),
    );
    await act(() =>
      tree.root
        .findByProps({ type: 'range', min: '2000' })
        .props.onChange({ target: { value: '10000' } }),
    );
    expect(steps()[0]).not.toContain('—');
    const resistanceLabel = () =>
      tree.root
        .findAllByProps({ className: 'bfs-estimate-step' })[0]
        .findByType('span')
        .children.join('');
    expect(resistanceLabel()).toBe('当前频率电阻');
    expect(
      steps()
        .slice(1)
        .every((v) => v.includes('—')),
    ).toBe(true);
    await choose(tree, '回到 50 kHz');
    expect(resistanceLabel()).toBe('50 kHz 电阻');
    expect(steps()[3]).toContain('15.00');
  });
});
