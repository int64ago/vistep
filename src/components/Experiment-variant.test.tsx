import { act, createElement, type ReactNode } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Experiment from './Experiment';
import type { ExperimentSlug } from '../data/experiments';
import variants from '../data/curriculum-variants.json';
import { films } from '../data/films';
import type { FilmSelection } from '../lib/film';

// Keep real lazy-loaded scenes and the production Experiment boundary. Only the
// transport is replaced so this test inspects the first exploration apparatus.
vi.mock('./lab/Showcase', async () => {
  const { FilmContext } = await import('./lab/FilmContext');
  return {
    default: ({ children, selection }: { children: ReactNode; selection?: FilmSelection }) =>
      createElement(FilmContext.Provider, {
        value: {
          watch: false,
          playing: false,
          time: 0,
          chapter: 0,
          run: 0,
          duration: 1,
          chapters: [],
          chapterTime: 0,
          chapterProgress: 0,
          variant: selection?.variant,
        },
        children,
      }),
  };
});

let renderer: ReactTestRenderer | undefined;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', {
    documentElement: { lang: 'zh-CN', hasAttribute: () => false },
  });
});
afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});

type RegressionLesson =
  | 'chem-elective-3-experiment-3-6'
  | 'chem-elective-3-instrument-p17'
  | 'chem-elective-2-history-p26-2';
async function show(id: RegressionLesson, withSelection = true) {
  const entry = variants[id];
  await act(async () => {
    renderer = create(
      createElement(Experiment, {
        slug: entry.sceneSlug as ExperimentSlug,
        film: films[entry.sceneSlug as keyof typeof films],
        selection: withSelection
          ? { chapterIds: entry.chapterIds, variant: entry.sceneVariant }
          : undefined,
      }),
    );
  });
  // Resolve the actual module before checking the Suspense tree.
  const { experimentLoaders } = await import('../data/experiments');
  await act(async () => {
    await experimentLoaders[entry.sceneSlug as keyof typeof experimentLoaders]();
  });
  return renderer!;
}
const hasClass = (tree: ReactTestRenderer, name: string) =>
  tree.root.findAll(
    (node) =>
      typeof node.type === 'string' &&
      String(node.props.className ?? '')
        .split(' ')
        .includes(name),
  ).length > 0;

describe('textbook apparatus passed through the lazy scene boundary', () => {
  it('opens the FeCl3 phenol test rather than the default acid–base apparatus', async () => {
    const tree = await show('chem-elective-3-experiment-3-6');
    expect(hasClass(tree, 'cpp-iron')).toBe(true);
  });
  it('opens molecular-formula evidence rather than ionization', async () => {
    const tree = await show('chem-elective-3-instrument-p17');
    expect(hasClass(tree, 'cms-formula')).toBe(true);
  });
  it('opens the argon gas-density comparison rather than the helium spectrum', async () => {
    const tree = await show('chem-elective-2-history-p26-2');
    expect(hasClass(tree, 'cnge-bulbs')).toBe(true);
  });
  it('keeps the ordinary full-scene default when no textbook selection is supplied', async () => {
    const tree = await show('chem-elective-3-experiment-3-6', false);
    expect(hasClass(tree, 'cpp-iron')).toBe(false);
    expect(JSON.stringify(tree.toJSON())).toContain('溶解的苯酚根');
  });
});
