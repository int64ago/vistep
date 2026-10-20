import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import ChemReactionRates from './ChemReactionRates';
import { FilmContext, type Director } from '../lab/FilmContext';
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 288, compact: true }),
}));
const base: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  chapterProgress: 0.5,
  chapterTime: 12,
  duration: 263.5,
  chapters: [],
  run: 0,
};
const node = (f: Partial<Director>) =>
  createElement(
    FilmContext.Provider,
    { value: { ...base, ...f } },
    createElement(ChemReactionRates),
  );
let r: ReactTestRenderer | undefined;
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(async () => {
  await act(() => r?.unmount());
  r = undefined;
});
const render = async (f: Partial<Director>) => {
  await act(() => {
    r = create(node(f));
  });
};
const update = async (f: Partial<Director>) => {
  await act(() => r!.update(node(f)));
};
const select = async (n: number) => {
  await act(() =>
    r!.root.findByProps({ id: 'crr16-scene' }).props.onChange({ target: { value: String(n) } }),
  );
};
const button = async (name: string) => {
  await act(() =>
    r!.root
      .findAllByType('button')
      .find((x) => x.children.join('') === name)!
      .props.onClick(),
  );
};
const range = async (id: string, v: number) => {
  await act(() => r!.root.findByProps({ id }).props.onChange({ target: { value: String(v) } }));
};
const root = () => r!.root.findByProps({ className: 'crr16' });
describe('reaction rates actual React controls', () => {
  it('fresh exploration follows current chapter; an explicit selection persists without leaking into watch', async () => {
    await render({ chapter: 9 });
    await update({ chapter: 9, watch: false });
    expect(root().props['data-chapter']).toBe('rate-collision-orientation');
    await select(2);
    await range('crr16-stock', 0.2);
    expect(r!.root.findByProps({ 'data-optical-reachable': false })).toBeDefined();
    await update({ chapter: 0, watch: true });
    expect(root().props['data-chapter']).toBe('rate-temperature');
    await update({ chapter: 0, watch: false });
    expect(root().props['data-chapter']).toBe('rate-thio-concentration');
  });
  it('temperature changes the same selected case energies, while same-temperature control removes the extra crossings', async () => {
    await render({ chapter: 0, watch: false });
    await button('机制');
    await range('crr16-progress', 1);
    const hot = r!.root.findByProps({ 'data-trial': 'E5' }).props['data-energy'];
    await range('crr16-temperature', 20);
    const cold = r!.root.findByProps({ 'data-trial': 'E5' }).props['data-energy'];
    expect(hot).toBeGreaterThan(cold);
    expect(r!.root.findByProps({ 'data-trial': 'E5' }).props['data-eligible']).toBe(false);
  });
  it('energy and orientation each block the selected four-atom reaction, retaining all IDs', async () => {
    await render({ chapter: 8, watch: false });
    await range('crr16-progress', 1);
    expect(JSON.stringify(r!.toJSON())).toContain('H₂ + I₂');
    await button('达到能量条件');
    expect(JSON.stringify(r!.toJSON())).toContain('2 HI');
    await button('达到能量条件');
    await button('有利取向');
    expect(JSON.stringify(r!.toJSON())).toContain('2 HI');
    expect(r!.root.findAll((n) => n.props['data-atom']).map((n) => n.props['data-atom'])).toEqual([
      'H1',
      'I1',
      'H2',
      'I2',
    ]);
  });
  it('complete leakage changes collection and leaves measured inputs blank', async () => {
    await render({ chapter: 6, watch: false });
    await range('crr16-progress', 1);
    await range('crr16-leak', 1);
    expect(r!.root.findByProps({ 'data-view': 'syringe' }).props['data-volume']).toBe(0);
    expect(r!.root.findByProps({ id: 'crr16-time0' }).props.value).toBe('');
    expect(JSON.stringify(r!.toJSON())).toContain('达不到');
  });
  it('watch question hides answers then reveals, including after backward seeking', async () => {
    await render({ chapter: 2, chapterTime: 17 });
    expect(root().props['data-reveal']).toBe(false);
    expect(JSON.stringify(r!.toJSON())).not.toContain('0.0025');
    await update({ chapter: 2, chapterTime: 23 });
    expect(root().props['data-reveal']).toBe(true);
    expect(JSON.stringify(r!.toJSON())).toContain('0.0025');
    await update({ chapter: 2, chapterTime: 17 });
    expect(JSON.stringify(r!.toJSON())).not.toContain('0.0025');
  });
  it('all watch chapters remain independent of altered exploration inputs', async () => {
    await render({});
    const frames = [];
    for (let chapter = 0; chapter < 11; chapter++) {
      await update({ chapter });
      frames.push(JSON.stringify(r!.toJSON()));
    }
    await update({ watch: false });
    await select(0);
    await range('crr16-temperature', 20);
    await select(6);
    await range('crr16-leak', 1);
    for (let chapter = 0; chapter < 11; chapter++) {
      await update({ chapter });
      expect(JSON.stringify(r!.toJSON())).toBe(frames[chapter]);
      expect(frames[chapter]).not.toContain('NaN');
    }
  });
});

it('fresh Explore keeps the exact causal shot and selected atom geometry, then edits stay isolated', async () => {
  for (const [chapter, chapterTime] of [
    [0, 13],
    [2, 17],
    [2, 23],
    [7, 15],
    [8, 11],
    [9, 7],
    [6, 9],
  ] as const) {
    await render({ chapter, chapterTime });
    const rootBefore = root().props;
    // Inspect actual node geometry rather than serialising React's circular owner fields.
    const geom = () =>
      r!.root
        .findAll((n) =>
          ['circle', 'line', 'path', 'polyline', 'rect', 'text'].includes(String(n.type)),
        )
        .map((n) => ({
          type: n.type,
          props: Object.fromEntries(
            Object.entries(n.props).filter(([k]) => !['children'].includes(k)),
          ),
          text: n.type === 'text' ? n.children.join('') : '',
        }));
    const nodes = geom();
    await update({ chapter, chapterTime, watch: false });
    expect(root().props['data-shot']).toBe(rootBefore['data-shot']);
    expect(root().props['data-progress']).toBe(rootBefore['data-progress']);
    expect(root().props['data-reveal']).toBe(rootBefore['data-reveal']);
    expect(geom()).toEqual(nodes);
    await act(() => r!.unmount());
    r = undefined;
  }
});
