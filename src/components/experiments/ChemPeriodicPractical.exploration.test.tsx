import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, expect, it, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemPeriodicPractical from './ChemPeriodicPractical';

vi.mock('../../i18n', () => ({ browserLocale: () => 'zh' }));

const base: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  chapterProgress: 0,
  chapterTime: 0,
  duration: 207.5,
  chapters: [],
  run: 0,
};
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
const content = (state: Partial<Director>) =>
  createElement(
    FilmContext.Provider,
    { value: { ...base, ...state } },
    createElement(ChemPeriodicPractical),
  );
const labels = (tree: ReactTestRenderer) =>
  tree.root
    .findAllByProps({ className: 'chem-periodic-object-label' })
    .map((node) => node.children.join(''));
async function click(tree: ReactTestRenderer, label: string) {
  await act(() =>
    tree.root
      .findAllByType('button')
      .find((node) => node.children.join('') === label)!
      .props.onClick(),
  );
}

it('keeps the period comparison on cold-water magnesium when entering exploration', async () => {
  let tree!: ReactTestRenderer;
  const selected = { variant: 'period-comparison', chapter: 3 };
  await act(() => {
    tree = create(content(selected));
  });
  expect(labels(tree)).toEqual(['镁 · 冷水']);
  await act(() => tree.update(content({ ...selected, watch: false })));
  expect(labels(tree)).toEqual(['镁 · 冷水']);
  expect(tree.root.findAllByProps({ className: 'chem-periodic-magnesium' })).toHaveLength(1);
  await click(tree, '加热');
  expect(labels(tree)).toEqual(['镁 · 热水']);
  await act(() => tree.unmount());
});

it('keeps the chapter activity on its sodium-halide spotting tile and preserves reader choices', async () => {
  let tree!: ReactTestRenderer;
  const selected = { variant: 'chapter-practical' };
  await act(() => {
    tree = create(content(selected));
  });
  await act(() => tree.update(content({ ...selected, watch: false })));
  expect(labels(tree)).toContain('NaBr + Cl₂');
  expect(tree.root.findAllByProps({ className: 'chem-periodic-pair plate' })).toHaveLength(1);
  await click(tree, '正文试管');
  expect(labels(tree)).toContain('KBr + Cl₂');
  await act(() => tree.update(content(selected)));
  await act(() => tree.update(content({ ...selected, watch: false })));
  expect(labels(tree)).toContain('KBr + Cl₂');
  await act(() => tree.unmount());
});

it('opens the numbered halogen experiment with its potassium-halide test tubes', async () => {
  let tree!: ReactTestRenderer;
  await act(() => {
    tree = create(content({ variant: 'halogen-tubes', watch: false }));
  });
  expect(labels(tree)).toEqual(['KBr + Cl₂', 'Cl₂ 参照']);
  expect(tree.root.findAllByProps({ className: 'chem-periodic-pair plate' })).toHaveLength(0);
  await act(() => tree.unmount());
});
