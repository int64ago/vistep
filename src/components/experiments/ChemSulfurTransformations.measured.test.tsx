import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { create, act } from 'react-test-renderer';
import { FilmContext } from '../lab/FilmContext';
import Scene from './ChemSulfurTransformations';
import {
  sulfurFilmState,
  sulfurElectronLedger,
  SULFUR_MEASURED_CUTS,
  SULFUR_FILM_SECONDS,
  copperNetAtoms,
} from '../../models/chem-sulfur-transformations';
import { bleachingDirector, chlorineBleaching } from '../../models/chem-chlorine-bleaching';
import { anionDirector, anionEvidence, anionCarbonRoute } from '../../models/chem-anion-tests';
const env = vi.hoisted(() => ({ locale: 'zh' }));
vi.mock('../../i18n', () => ({ browserLocale: () => env.locale, t: (x: string) => x }));
vi.mock('../lab/SignalFigure', () => ({ useSignalWidth: () => ({ host: () => {}, width: 272 }) }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
describe('measured director semantic boundaries', () => {
  for (const locale of ['zh', 'en'] as const) {
    it(
      locale +
        ' hides each predicted amount until its spoken answer, with persistent atom/electron identity',
      () => {
        const k = SULFUR_MEASURED_CUTS[locale],
          d = (c: number, t: number) => sulfurFilmState(c, 0, t, false, locale);
        expect(SULFUR_FILM_SECONDS.reduce((a, b) => a + b, 0)).toBe(262.5);
        for (const [chapter, cut] of [
          [2, k.firstAnswer],
          [5, k.copperAnswer],
          [8, k.massAnswer],
        ]) {
          expect(d(chapter, cut - 0.001).reveal).toBe(false);
          expect(d(chapter, cut).reveal).toBe(true);
        }
        expect(d(2, k.firstAnswer + 0.1).secondReveal).toBe(false);
        expect(d(2, k.secondAnswer).secondReveal).toBe(true);
        const middle = sulfurElectronLedger(
          'comproportionation',
          d(1, (k.electronStart + k.electronEnd) / 2).event,
        );
        expect(middle.inTransit).toBe(4);
        expect(middle.accepted).toBe(0);
        expect(middle.totalWithTransit).toBe(0);
        expect(
          sulfurElectronLedger('comproportionation', d(1, k.electronEnd).event).centers.map(
            (x) => x.oxidation,
          ),
        ).toEqual([0, 0, 0]);
        const initial = copperNetAtoms(d(5, k.netStart).event),
          final = copperNetAtoms(d(5, k.atomEnd).event);
        expect(initial.atoms.map((x) => x.id)).toEqual(final.atoms.map((x) => x.id));
        expect(final.atoms.every((x) => x.phase === 'final')).toBe(true);
        expect(d(6, k.removal - 0.01).heatTime).toBeLessThan(0.7);
        expect(d(6, k.removed).heatTime).toBeCloseTo(1.1);
        expect(d(7, 0).heatTime).toBeCloseTo(1.1);
        expect(d(8, k.air - 0.01).shot).toBe('mass-answer');
        expect(d(8, k.air).shot).toBe('air-boundary');
      },
    );
    it(
      locale + ' actual React keeps the second sulfate answer hidden during the first answer',
      async () => {
        env.locale = locale;
        const k = SULFUR_MEASURED_CUTS[locale];
        let film = {
          watch: true,
          playing: false,
          chapter: 2,
          chapterTime: k.firstAnswer + 0.1,
          chapterProgress: 0,
          time: 55 + k.firstAnswer + 0.1,
          duration: 262.5,
          chapters: [],
          run: 0,
        };
        let r: ReturnType<typeof create>;
        const node = () =>
          createElement(FilmContext.Provider, { value: film }, createElement(Scene));
        await act(() => {
          r = create(node());
        });
        expect(r!.root.findByProps({ 'data-second-answer-visible': false })).toBeDefined();
        expect(r!.root.findAllByType('strong').map((x) => x.children.join(''))).toEqual([
          '5.00',
          '?',
        ]);
        film = { ...film, chapterTime: k.secondAnswer };
        await act(() => r!.update(node()));
        expect(r!.root.findAllByType('strong').map((x) => x.children.join(''))).toEqual([
          '5.00',
          '1.25',
        ]);
        await act(() => r!.unmount());
      },
    );
  }
  it('retained bleaching keeps its dry/zero-gas and 24-ID controls while reaching the spoken endpoint', () => {
    for (const locale of ['zh', 'en'] as const)
      for (let c = 0; c < 3; c++) {
        const a = bleachingDirector(c, 0, 0, locale),
          b = bleachingDirector(c, 1, 33, locale);
        expect(a.extent).toBe(0);
        expect(b.extent).toBe(1);
        expect(chlorineBleaching('wet-paper', b.extent).units).toHaveLength(24);
        expect(chlorineBleaching('dry-paper', b.extent).changed).toBe(0);
        expect(chlorineBleaching('wet-paper', b.extent, false).changed).toBe(0);
      }
  });
  it('retained anion finite changes finish before the spoken persistence comparison and cannot restart escaped carbon', () => {
    for (const locale of ['zh', 'en'] as const)
      for (let c = 0; c < 6; c++) {
        const a = anionDirector(c, 0, 0, locale),
          b = anionDirector(c, 1, 20, locale);
        expect(b.metal).toBe(2);
        if (c % 3 === 0) {
          expect(a.metal).toBe(0);
          expect(b.acid).toBe(0);
        } else {
          expect(b.acid).toBe(2);
          const m = anionEvidence(b.test, b.metal, b.acid);
          expect(m.carbonateSolid).toBe(0);
          expect(m.targetSolid).toBe(1);
          expect(m.carbonTotal).toBe(1);
        }
      }
    for (let i = 0; i < 8; i++) {
      expect(anionCarbonRoute(i, 1).phase).toBe('outside');
      expect(anionCarbonRoute(i, 10)).toEqual(anionCarbonRoute(i, 1));
    }
  });
});
