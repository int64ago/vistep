import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EarThermometer from './EarThermometer';
import * as model from '../../models/ear-thermometer';
const film = vi.hoisted(() => ({ watch: true, playing: false, chapter: 0, chapterProgress: 0 }));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => film }));
const trees: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const tree of trees.splice(0)) await act(() => tree.unmount());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.assign(film, { watch: true, playing: false, chapter: 0, chapterProgress: 0 });
});
const reading = (tree: ReactTestRenderer) =>
  tree.root.findByProps({ className: 'ear-readout' }).findByType('output').children[0];
describe('Ear thermometer directed section', () => {
  it('retains every causal referent on direct chapter seeks without nonfinite SVG geometry', () => {
    for (let chapter = 0; chapter < 7; chapter++)
      for (const chapterProgress of [0, 0.5, 1]) {
        Object.assign(film, { chapter, chapterProgress });
        const html = renderToStaticMarkup(<EarThermometer />);
        expect(html).not.toMatch(/NaN|Infinity/);
        if (chapter === 4) {
          expect(html).toContain('已知温度的黑体腔');
          expect(html).toContain('标定关系');
        } else {
          expect(html).toContain('耳廓、耳道、鼓膜');
          expect(html).toContain('教学模型读数');
        }
        if (chapter === 2 || chapter === 3) {
          expect(html).toContain('窄口波导');
          if (chapter === 2) expect(html).toContain('吸收膜');
        }
        if (chapter === 3) {
          expect(html).toContain('净红外信号');
          expect(html).toContain('参考通道');
          expect(html).toMatch(/ear-part-anchor[^>]+>2</);
          expect(html).toMatch(/ear-part-anchor[^>]+>3</);
          expect(html).not.toContain('ear-probe-labels');
          expect(html).not.toContain('两路共同反演，组织温度保持不变');
        }
      }
  });
  it('memoizes thermal calculation while only passive markers/reveal change, and settles reverse seeks', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const measure = vi.spyOn(model, 'earMeasure');
    let tree!: ReactTestRenderer;
    await act(() => {
      tree = create(<EarThermometer />);
      trees.push(tree);
    });
    const initialCalls = measure.mock.calls.length;
    for (const p of [0.1, 0.3, 0.6, 0.9]) {
      film.chapterProgress = p;
      await act(() => tree.update(<EarThermometer />));
    }
    expect(measure.mock.calls.length).toBe(initialCalls);
    film.chapter = 5;
    film.chapterProgress = 0.7;
    await act(() => tree.update(<EarThermometer />));
    const forward = JSON.stringify(tree.toJSON());
    expect(measure.mock.calls.length).toBe(initialCalls + 1);
    film.chapterProgress = 0.1;
    await act(() => tree.update(<EarThermometer />));
    film.chapterProgress = 0.7;
    await act(() => tree.update(<EarThermometer />));
    expect(JSON.stringify(tree.toJSON())).toBe(forward);
    film.chapter = 6;
    film.chapterProgress = 1;
    await act(() => tree.update(<EarThermometer />));
    expect(reading(tree)).toBe('37.0');
  });
  it('changes region weights and actual reading through the orientation control', async () => {
    film.watch = false;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    let tree!: ReactTestRenderer;
    await act(() => {
      tree = create(<EarThermometer />);
      trees.push(tree);
    });
    const initial = Number(reading(tree)),
      angle = tree.root.findByProps({ type: 'range', min: '-24' });
    await act(() => angle.props.onChange({ target: { value: '20' } }));
    expect(Number(reading(tree))).toBeLessThan(initial - 1);
    const strip = tree.root.findByProps({ className: 'ear-source-strip' });
    expect(strip.findAllByType('b').map((n) => n.children.join(''))).not.toEqual(['99', '1']);
    const checkbox = tree.root.findByProps({ type: 'checkbox' });
    await act(() => checkbox.props.onChange({ target: { checked: true } }));
    expect(reading(tree)).toBe('37.0');
    await act(() => angle.props.onChange({ target: { value: '-24' } }));
    expect(reading(tree)).toBe('37.0');
  });
  it('keeps net/reference channels visible together and a stable reading as package temperature changes', async () => {
    film.watch = false;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    let tree!: ReactTestRenderer;
    await act(() => {
      tree = create(<EarThermometer />);
      trees.push(tree);
    });
    await act(() =>
      tree.root
        .findAllByType('button')
        .find((b) => b.children.join('') === '看参考补偿')!
        .props.onClick(),
    );
    const initial = reading(tree),
      channel = () =>
        tree.root.findByProps({ className: 'ear-channel ear-channel-net' }).findByType('b')
          .children[0],
      initialNet = Number(channel());
    await act(() =>
      tree.root
        .findByProps({ type: 'range', min: '15' })
        .props.onChange({ target: { value: '30' } }),
    );
    expect(Number(channel())).toBeLessThan(initialNet);
    expect(reading(tree)).toBe(initial);
    expect(
      tree.root.findByProps({ className: 'ear-channel ear-channel-ref' }).findByType('b')
        .children[0],
    ).toBe('30.0');
    expect(tree.root.findAllByType('svg')).toHaveLength(2);
  });
});
