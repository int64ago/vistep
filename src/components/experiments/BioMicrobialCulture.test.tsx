import { act, createElement } from 'react';
import { create, type ReactTestRenderer, type ReactTestRendererJSON } from 'react-test-renderer';
import { beforeAll, it, expect, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import BioMicrobialCulture from './BioMicrobialCulture';
vi.mock('../../i18n', () => ({ browserLocale: () => 'zh' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 320, compact: true }),
}));
const base: Director = {
  watch: true,
  playing: false,
  time: 10,
  chapter: 0,
  chapterProgress: 0.6,
  chapterTime: 10,
  duration: 240,
  chapters: [],
  run: 0,
};
const tree = (v: Director) =>
  createElement(FilmContext.Provider, { value: v }, createElement(BioMicrobialCulture));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
it('reconstructs all twelve microbial culture chapters after edits', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree(base));
  });
  let frames = [];
  for (let chapter = 0; chapter < 12; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    frames.push(JSON.stringify(v.toJSON()));
    expect(frames[chapter]).not.toContain('NaN');
  }
  await act(async () => v.update(tree({ ...base, watch: false })));
  await act(async () =>
    v.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'own note' } }),
  );
  for (let chapter = 0; chapter < 12; chapter++) {
    await act(async () => v.update(tree({ ...base, chapter })));
    expect(JSON.stringify(v.toJSON())).toBe(frames[chapter]);
  }
  await act(async () => v.unmount());
});
it('selects microbial sample investigation directly', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, variant: 'bio-elective-3-020-1', watch: false }));
  });
  expect(JSON.stringify(v.toJSON())).toContain('检测对象决定单位');
  await act(async () => v.unmount());
});
it('inherits every visible shot and snapshots the entire first edit before Watch resets', async () => {
  for (let chapter = 0; chapter < 12; chapter++) {
    let v!: ReactTestRenderer;
    const d = { ...base, chapter, chapterProgress: 0.82 };
    await act(async () => {
      v = create(tree(d));
    });
    const scene = () => v.root.findByProps({ className: 'bio-culture' });
    const before = JSON.parse(scene().props['data-snapshot']);
    await act(async () => v.update(tree({ ...d, watch: false })));
    expect(JSON.parse(scene().props['data-snapshot'])).toEqual(before);
    await act(async () =>
      v.root.findByType('textarea').props.onChange({ target: { value: `chapter ${chapter}` } }),
    );
    const edited = JSON.parse(scene().props['data-snapshot']);
    await act(async () =>
      v.update(tree({ ...base, chapter: 0, chapterProgress: 0, chapterTime: 0 })),
    );
    expect(scene().props['data-chapter']).toBe(0);
    await act(async () =>
      v.update(tree({ ...base, watch: false, chapter: 0, chapterProgress: 0, chapterTime: 0 })),
    );
    expect(JSON.parse(scene().props['data-snapshot'])).toEqual(edited);
    expect(edited).toEqual({ ...before, journal: `chapter ${chapter}` });
    await act(async () => v.unmount());
  }
});
it('preserves actual rendered pools, tracer positions, colony radii and opacity across fresh Explore and restore', async () => {
  for (let chapter = 0; chapter < 12; chapter++) {
    const times =
      chapter === 2
        ? [3, 8, 10.35, 10.8, 19]
        : chapter === 5
          ? [1, 5.5, 8, 11.5, 17, 21.5, 29]
          : [1, 8, 16];
    for (const chapterTime of times) {
      let v!: ReactTestRenderer;
      const d = { ...base, chapter, chapterTime, chapterProgress: chapterTime / 24 };
      await act(async () => {
        v = create(tree(d));
      });
      const svg = () =>
        JSON.stringify(
          (v.toJSON() as ReactTestRendererJSON).children?.find(
            (node) => typeof node === 'object' && node.type === 'svg',
          ),
        );
      const watchImage = svg();
      const poolLabels = () =>
        v.root
          .findAll((n) => typeof n.props['data-n-pool'] === 'string')
          .map((n) => n.children.join(''));
      const watchLabels = poolLabels();
      if (watchLabels.length)
        expect(watchLabels.reduce((sum, label) => sum + parseFloat(label), 0)).toBeCloseTo(2, 12);
      await act(async () => v.update(tree({ ...d, watch: false })));
      expect(svg()).toBe(watchImage);
      expect(poolLabels()).toEqual(watchLabels);
      // No input, journal or put() before this reset: first entry itself must persist.
      await act(async () =>
        v.update(tree({ ...base, chapter: 0, chapterProgress: 0, chapterTime: 0 })),
      );
      await act(async () =>
        v.update(tree({ ...base, watch: false, chapter: 0, chapterProgress: 0, chapterTime: 0 })),
      );
      expect(svg()).toBe(watchImage);
      expect(poolLabels()).toEqual(watchLabels);
      await act(async () =>
        v.root.findByType('textarea').props.onChange({ target: { value: 'save complete view' } }),
      );
      await act(async () =>
        v.update(tree({ ...base, chapter: 0, chapterProgress: 0, chapterTime: 0 })),
      );
      await act(async () =>
        v.update(tree({ ...base, watch: false, chapter: 0, chapterProgress: 0, chapterTime: 0 })),
      );
      expect(svg()).toBe(watchImage);
      expect(poolLabels()).toEqual(watchLabels);
      await act(async () => v.unmount());
    }
  }
});
it('shows one actual blank colony and withdraws the matched batch interpretation', async () => {
  let v!: ReactTestRenderer;
  await act(async () => {
    v = create(tree({ ...base, chapter: 2, chapterProgress: 0.55 }));
  });
  expect(v.root.findAllByProps({ 'data-colony': 'blank-contaminant' })).toHaveLength(0);
  await act(async () =>
    v.update(tree({ ...base, chapter: 2, chapterProgress: 0.9, chapterTime: 12 })),
  );
  expect(v.root.findAllByProps({ 'data-colony': 'blank-contaminant' })).toHaveLength(1);
  expect(v.root.findByProps({ className: 'bio-culture' }).props['data-valid']).toBe(false);
  expect(JSON.stringify(v.toJSON())).toContain('本批判读无效');
  await act(async () => v.update(tree({ ...base, chapter: 2, chapterProgress: 0.55 })));
  expect(v.root.findAllByProps({ 'data-colony': 'blank-contaminant' })).toHaveLength(0);
  await act(async () => v.unmount());
});
it('keeps hydrolysis counterfactual and tracer identity through Watch reset', async () => {
  let v!: ReactTestRenderer;
  const d = { ...base, chapter: 5, chapterProgress: 0.6 };
  await act(async () => {
    v = create(tree(d));
  });
  const traces = () => v.root.findAll((x) => typeof x.props['data-tracer'] === 'string');
  const ids = traces().map((x) => x.props['data-tracer']);
  await act(async () => v.update(tree({ ...d, watch: false })));
  await act(async () =>
    v.root
      .findAllByType('button')
      .find((x) => x.children.includes('水解开启'))!
      .props.onClick(),
  );
  expect(traces().map((x) => x.props['data-tracer'])).toEqual(ids);
  expect(traces().every((x) => x.props['data-n-stage'] === 'urea')).toBe(true);
  await act(async () =>
    v.update(tree({ ...base, chapter: 0, chapterProgress: 0, chapterTime: 0 })),
  );
  await act(async () =>
    v.update(tree({ ...base, watch: false, chapter: 0, chapterProgress: 0, chapterTime: 0 })),
  );
  expect(traces().every((x) => x.props['data-n-stage'] === 'urea')).toBe(true);
  expect(v.root.findByProps({ className: 'bio-culture' }).props['data-chapter']).toBe(5);
  await act(async () => v.unmount());
});
it('inherits the prediction shot itself before a control changes the scenario', async () => {
  let v!: ReactTestRenderer;
  const d = { ...base, chapter: 5, chapterTime: 17, chapterProgress: 0.5 };
  await act(async () => {
    v = create(tree(d));
  });
  const scene = () => v.root.findByProps({ className: 'bio-culture' });
  expect(scene().props['data-prediction']).toBe(true);
  const svg = () =>
    JSON.stringify(
      (v.toJSON() as ReactTestRendererJSON).children?.find(
        (node) => typeof node === 'object' && node.type === 'svg',
      ),
    );
  const before = svg();
  await act(async () => v.update(tree({ ...d, watch: false })));
  expect(scene().props['data-prediction']).toBe(true);
  expect(svg()).toBe(before);
  await act(async () =>
    v.root
      .findAllByType('button')
      .find((x) => x.children.includes('水解开启'))!
      .props.onClick(),
  );
  expect(scene().props['data-prediction']).toBe(false);
  expect(scene().props['data-hydrolysis']).toBe(false);
  await act(async () => v.unmount());
});
