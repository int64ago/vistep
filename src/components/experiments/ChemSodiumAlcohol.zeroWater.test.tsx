import { act, createElement } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemSodiumAlcohol';

const locale = vi.hoisted(() => ({ value: 'en' }));
vi.mock('../../i18n', () => ({ browserLocale: () => locale.value }));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

describe('sodium-alcohol zero product-water and accessible SVG labels', () => {
  for (const lang of ['zh', 'en'] as const) {
    const unchanged = lang === 'zh' ? '未补水，平衡不变' : 'No added water; no shift';
    const shifted = lang === 'zh' ? '乙氧根变少，乙醇变多' : 'Less ethoxide, more ethanol';
    const mount = async (chapterTime: number, chapter = 5) => {
      locale.value = lang;
      let view!: ReactTestRenderer;
      await act(async () => {
        view = create(
          createElement(
            FilmContext.Provider,
            {
              value: {
                watch: false,
                playing: false,
                chapter,
                chapterTime,
                chapterProgress: chapterTime / [25, 29, 26, 30, 29, 64][chapter],
                time: [0, 25, 54, 80, 110, 139][chapter] + chapterTime,
                duration: 203,
                chapters: [],
                run: 0,
              },
            },
            createElement(Scene),
          ),
        );
      });
      return view;
    };
    const waterInput = (view: ReactTestRenderer) =>
      view.root.findAllByType('input').find((e) => Number(e.props.max) === 8)!;
    const result = (view: ReactTestRenderer) =>
      view.root.findByProps({ className: 'chem-na-controls-result' });
    const text = (view: ReactTestRenderer) => JSON.stringify(view.toJSON());

    it(`${lang}: zero water reports unchanged equilibrium and fixed pKa records`, async () => {
      const view = await mount(60);
      const records = view.root
        .findByProps({ 'data-fixed-record': 'DMSO-1980' })
        .findAllByType('b')
        .map((e) => e.children.join(''));
      await act(async () => waterInput(view).props.onChange({ target: { value: '0' } }));
      expect(result(view).props['data-equilibrium']).toBe(result(view).props['data-baseline']);
      expect(text(view)).toContain(unchanged);
      expect(text(view)).not.toContain(shifted);
      expect(
        view.root
          .findByProps({ 'data-fixed-record': 'DMSO-1980' })
          .findAllByType('b')
          .map((e) => e.children.join('')),
      ).toEqual(records);
      expect(records).toEqual(['29.8', '31.4']);
      await act(async () => view.unmount());
    });

    it(`${lang}: positive water retains the shifted label and returning to zero clears it`, async () => {
      const view = await mount(60);
      for (const amount of [1, 8]) {
        await act(async () =>
          waterInput(view).props.onChange({ target: { value: String(amount) } }),
        );
        expect(result(view).props['data-equilibrium']).toBeLessThan(
          result(view).props['data-baseline'],
        );
        expect(text(view)).toContain(shifted);
        expect(text(view)).not.toContain(unchanged);
      }
      await act(async () => waterInput(view).props.onChange({ target: { value: '0' } }));
      expect(text(view)).toContain(unchanged);
      expect(text(view)).not.toContain(shifted);
      await act(async () => view.unmount());
    });

    it(`${lang}: prediction hides the result, then zero-water reveal states no shift`, async () => {
      const view = await mount(39);
      await act(async () => waterInput(view).props.onChange({ target: { value: '0' } }));
      expect(view.root.findByProps({ 'data-ethoxide': 'hidden' })).toBeTruthy();
      expect(text(view)).not.toContain(unchanged);
      expect(text(view)).not.toContain(shifted);
      await act(async () => view.root.findByProps({ className: 'chem-na-reveal' }).props.onClick());
      expect(result(view).props['data-equilibrium']).toBe(result(view).props['data-baseline']);
      expect(text(view)).toContain(unchanged);
      expect(text(view)).not.toContain(shifted);
      await act(async () => view.unmount());
    });

    for (const sample of [
      {
        chapter: 0,
        zh: ['试管底部的钠与乙醇反应，气体经过塞子和玻璃导管排出'],
        en: [
          'Sodium at the bottom of an ethanol tube releases gas through a stopper and glass nozzle',
        ],
      },
      {
        chapter: 1,
        zh: ['钠与乙醇生成的氢气在出口燃烧，倒扣的收集杯内出现水滴'],
        en: [
          'Hydrogen from sodium and ethanol burns at the outlet; an inverted collector receives water droplets',
        ],
      },
      {
        chapter: 3,
        zh: ['两个羟基氢组成氢气，乙基中的碳氢连接保持不变，钠成为平衡电荷的钠离子'],
        en: [
          'Two hydroxyl hydrogens form H2; ethanol carbon-hydrogen groups remain unchanged; sodium gives Na+ counterions',
        ],
      },
      {
        chapter: 4,
        zh: ['钠浮在水面，本定性比较中反应较快', '钠位于乙醇液面下，本定性比较中反应较慢'],
        en: [
          'Sodium floats at the water surface and reacts faster in this qualitative comparison',
          'Sodium lies below the ethanol surface and reacts more slowly in this qualitative comparison',
        ],
      },
    ]) {
      it(`${lang}: chapter ${sample.chapter} exposes its actual SVG description in the page language`, async () => {
        const view = await mount(12, sample.chapter);
        const labels = view.root.findAllByType('svg').map((svg) => svg.props['aria-label']);
        expect(labels).toEqual(sample[lang]);
        if (lang === 'zh') for (const english of sample.en) expect(labels).not.toContain(english);
        await act(async () => view.unmount());
      });
    }
  }
});
