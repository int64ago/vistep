import { act, createElement, type ComponentType } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import { curriculumFilmSelection, getCurriculumLessons } from '../../data/curricula';
import timeline from '../../data/film-timeline.json';
import NuclearEvidenceLab from './NuclearEvidenceLab';
import ParticleEvidenceLab from './ParticleEvidenceLab';
import GalileoInclines from './GalileoInclines';

let renderer: ReactTestRenderer | undefined;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('document', { documentElement: { lang: 'zh' } });
});
afterEach(() => {
  if (renderer) act(() => renderer!.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});

describe('reused textbook apparatus', () => {
  it.each([
    ['e1-chadwick-reference', NuclearEvidenceLab, '中子证据', '质子证据'],
    ['required-1-wu-parity', ParticleEvidenceLab, '宇称检验', '希格斯'],
    ['required-2-double-incline-energy', GalileoInclines, '机械能观察', '斜面计时'],
  ] as const)(
    'keeps %s on its own apparatus when switching to exploration',
    (id, Component, selected, alternate) => {
      const lesson = getCurriculumLessons('pep-high-school-physics').find(
        ({ lesson }) => lesson.experimentId === id,
      )!.lesson;
      const selection = curriculumFilmSelection(lesson)!;
      const film = timeline[lesson.sceneSlug as keyof typeof timeline];
      const director: Director = {
        watch: true,
        playing: false,
        time: 0,
        chapter: film.chapters.findIndex((c) => c.id === selection.chapterIds[0]),
        run: 0,
        duration: film.duration,
        chapters: [],
        chapterTime: 0,
        chapterProgress: 0.5,
        variant: selection.variant,
      };
      const tree = (watch: boolean) =>
        createElement(
          FilmContext.Provider,
          { value: { ...director, watch } },
          createElement(Component as ComponentType),
        );
      act(() => {
        renderer = create(tree(true));
      });
      act(() => renderer!.update(tree(false)));
      const button = (name: string) =>
        renderer!.root.findAllByType('button').find((n) => n.children.join('') === name)!;
      expect(button(selected).props['aria-pressed']).toBe(true);
      expect(button(alternate).props['aria-pressed']).toBe(false);
      if (id === 'required-2-double-incline-energy') {
        expect(renderer!.root.findAllByProps({ className: 'galileo-energy' })).toHaveLength(1);
      }
      act(() => button(alternate).props.onClick());
      act(() => renderer!.update(tree(true)));
      act(() => renderer!.update(tree(false)));
      expect(button(alternate).props['aria-pressed']).toBe(true);
    },
  );
});
