import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemCoordinationColors from './ChemCoordinationColors';
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
const base: Director = {
  watch: false,
  playing: false,
  time: 0,
  chapter: 0,
  chapterProgress: 1,
  chapterTime: 0,
  duration: 244,
  chapters: [],
  run: 0,
};
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('water controls keep the observed phase and explanatory labels consistent', async () => {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(
      createElement(FilmContext.Provider, { value: base }, createElement(ChemCoordinationColors)),
    );
  });
  const choose = async (label: string, index: number) => {
    const group = r.root.findAllByProps({ 'aria-label': label }).find((n) => n.type === 'div')!;
    await act(async () => group.findAllByType('button')[index].props.onClick());
  };
  const formula = () => r.root.findAllByProps({ className: 'ccol-formula' })[0]?.children.join('');
  await choose('观察内容', 1);
  await choose('加入物对照', 1);
  expect(formula()).toBe('[Cu(H₂O)₆]²⁺');
  await choose('观察内容', 2);
  expect(formula()).toBe('Cu(OH)₂ ↓');
  await choose('观察内容', 4);
  expect(formula()).toBe('[Cu(NH₃)₄]²⁺');
  await choose('观察内容', 6);
  expect(
    r.root
      .findAllByType('p')
      .map((n) => n.children.join(''))
      .join(' '),
  ).toContain('氨不足时');
  await choose('观察内容', 7);
  expect(
    r.root
      .findAllByType('span')
      .map((n) => n.children.join(''))
      .join(' '),
  ).toContain('尚无明显红色');
  await act(async () => r.unmount());
});
