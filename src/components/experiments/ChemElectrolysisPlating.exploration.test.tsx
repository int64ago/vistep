import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemElectrolysisPlating from './ChemElectrolysisPlating';
vi.mock('../../i18n', () => ({ browserLocale: () => 'zh' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 240, compact: true }),
}));
const base: Director = {
  watch: false,
  playing: false,
  time: 10,
  chapter: 0,
  chapterProgress: 0.8,
  chapterTime: 10,
  duration: 198,
  chapters: [],
  run: 0,
};
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
const tree = createElement(
  FilmContext.Provider,
  { value: base },
  createElement(ChemElectrolysisPlating),
);
const textOf = (r: ReactTestRenderer) =>
  r.root.findByProps({ className: 'chem-electrolysis-head' }).children.join('');
async function select(r: ReactTestRenderer, v: number) {
  await act(async () =>
    r.root.findByType('select').props.onChange({ target: { value: String(v) } }),
  );
}
async function click(r: ReactTestRenderer, name: string) {
  await act(async () =>
    r.root
      .findAllByType('button')
      .find((b) => b.children.join('') === name)!
      .props.onClick(),
  );
}
it('view presets and subsequent polarity/circuit overrides keep heading and electrode state consistent', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree);
  });
  await select(r, 8);
  expect(textOf(r)).toBe('铁接正极，铜接负极');
  await click(r, '电镀反接');
  expect(textOf(r)).toBe('铁接负极，铜接正极');
  await select(r, 9);
  expect(textOf(r)).toContain('外电路断开');
  await click(r, '电路闭合');
  expect(textOf(r)).toBe('铁接负极，铜接正极');
  await select(r, 7);
  expect(textOf(r)).toBe('铜阳极补充溶液中的铜');
  await click(r, '电镀反接');
  expect(textOf(r)).toContain('铁阳极溶解');
  const labels = () =>
    r.root
      .findAllByType('text')
      .map((x) => x.children.join(''))
      .join('|');
  expect(labels()).not.toContain('溶液总铜保持不变');
  expect(labels()).toContain('Fe: −');
  expect(labels()).toContain('溶液铜减少');
  await click(r, '电路闭合');
  expect(textOf(r)).toContain('外电路断开');
  expect(labels()).toContain('局部置换 Cu');
  expect(labels()).not.toContain('Cu anode:');
  await act(async () => r.unmount());
});
it('open reversed wiring deposits local displacement copper on iron; coating rows retain readable separation', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(tree);
  });
  await select(r, 8);
  await click(r, '电路闭合');
  const layer = r.root.findAllByType('path').find((x) => x.props.stroke === '#b9754d')!;
  expect(layer.props.d).toMatch(/^M48 /);
  expect(r.root.findAllByType('text').some((x) => x.children.join('') === 'Fe +')).toBe(false);
  await select(r, 10);
  const texts = r.root.findAllByType('text'),
    firstThickness = texts.find((x) => x.children.join('').endsWith('μm'))!,
    secondLabel = texts.find((x) => x.children.join('') === '部分被油污遮挡')!;
  expect(secondLabel.props.y - firstThickness.props.y).toBeGreaterThanOrEqual(40);
  await select(r, 4);
  expect(r.root.findAllByType('button')).toHaveLength(0);
  await act(async () => r.unmount());
});
