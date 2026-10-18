import { createElement, type ComponentType } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModernLab, { ModernLabArtwork } from './ModernLab';
import PhotoelectricLab from './PhotoelectricLab';
import BlackbodyLab from './BlackbodyLab';
import OilDropLab from './OilDropLab';
import AtomicScatteringLab from './AtomicScatteringLab';
import CathodeRayLab from './CathodeRayLab';
import AtomicSpectrumLab from './AtomicSpectrumLab';
import MatterWaveLab, { MatterWaveArtwork } from './MatterWaveLab';
import RadiationEvidenceLab, { RadiationArtwork } from './RadiationEvidenceLab';
import DecayMeasurementLab, { DecayArtwork } from './DecayMeasurementLab';
import NuclearEvidenceLab, { NuclearArtwork } from './NuclearEvidenceLab';
import ParticleEvidenceLab, {
  ParticleArtwork,
  ParticleEvidenceArtwork,
} from './ParticleEvidenceLab';
import { powderRadii } from '../../models/matter-wave-lab';

const film = vi.hoisted(() => ({
  watch: false,
  chapter: 0,
  chapterTime: 14,
  chapterProgress: 0.6,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', () => ({
  Range: (props: {
    label: string;
    onChange: (n: number) => void;
    min: number;
    max: number;
    value: number;
  }) => createElement('input', { ...props, 'aria-label': props.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() =>
  Object.assign(film, {
    watch: false,
    chapter: 0,
    chapterTime: 14,
    chapterProgress: 0.6,
    variant: '',
  }),
);
const input = (view: ReactTestRenderer, label: string) =>
  view.root.findAllByType('input').find((x) => x.props['aria-label'] === label)!;

describe('modern-physics film state is independent of exploration', () => {
  const series: [string, ComponentType, number, string?][] = [
    ['photocell', PhotoelectricLab, 4, 'Photocell'],
    ['blackbody', BlackbodyLab, 3],
    ['oil drop', OilDropLab, 2],
    ['Compton scattering', AtomicScatteringLab, 5, 'Compton scattering'],
    ['cathode rays', CathodeRayLab, 2],
    ['Lamb spectroscopy', AtomicSpectrumLab, 8, 'Precision hydrogen spectroscopy'],
  ];
  for (const [name, Component, chapter, path] of series) {
    it(`restores the authored ${name} apparatus after parameter changes`, async () => {
      film.watch = true;
      film.chapter = chapter;
      let view!: ReactTestRenderer;
      await act(() => {
        view = create(createElement(Component));
      });
      const baseline = view.root.findByType(ModernLabArtwork).props;
      film.watch = false;
      await act(() => view.update(createElement(Component)));
      if (path) {
        const button = view.root.findAllByType('button').find((b) => b.children.join('') === path)!;
        await act(() => button.props.onClick());
      }
      for (const control of view.root.findAllByType('input')) {
        await act(() => control.props.onChange(control.props.max));
      }
      film.watch = true;
      await act(() => view.update(createElement(Component)));
      expect(view.root.findByType(ModernLabArtwork).props).toEqual(baseline);
      await act(() => view.unmount());
    });
  }

  const independent: [string, ComponentType, ComponentType<any>, number][] = [
    ['matter wave', MatterWaveLab, MatterWaveArtwork, 2],
    ['radiation', RadiationEvidenceLab, RadiationArtwork, 0],
    ['decay', DecayMeasurementLab, DecayArtwork, 0],
    ['nuclear reaction', NuclearEvidenceLab, NuclearArtwork, 1],
    ['particle evidence', ParticleEvidenceLab, ParticleEvidenceArtwork, 1],
    ['retained particle parity', ParticleEvidenceLab, ParticleArtwork, 9],
  ];
  for (const [name, Component, Artwork, chapter] of independent) {
    it(`restores ${name} after all currently visible exploration controls are changed`, async () => {
      film.watch = true;
      film.chapter = chapter;
      let view!: ReactTestRenderer;
      await act(() => {
        view = create(createElement(Component));
      });
      const baseline = view.root.findByType(Artwork).props;
      film.watch = false;
      await act(() => view.update(createElement(Component)));
      // Exercise settings and toggles on the initial experiment, including background-only,
      // new radioactive ensemble, sample removal and light exposure.
      for (const control of view.root.findAllByType('input'))
        await act(() => control.props.onChange(control.props.max));
      const toggles = view.root
        .findAllByType('button')
        .filter(
          (b) =>
            !['modern-paths'].includes(b.parent?.props.className) ||
            /Background|ensemble|sample|Sun|sun|phase|Field|Reverse/i.test(b.children.join('')),
        );
      for (const toggle of toggles) await act(() => toggle.props.onClick());
      film.watch = true;
      await act(() => view.update(createElement(Component)));
      expect(view.root.findByType(Artwork).props).toEqual(baseline);
      await act(() => view.unmount());
    });
  }

  it('darkens the zinc illumination, removes electrons and keeps the charged leaves apart at zero light', async () => {
    let view!: ReactTestRenderer;
    await act(() => {
      view = create(createElement(ModernLab, { kind: 'zinc' }));
    });
    await act(() => input(view, 'Incident frequency').props.onChange(1));
    await act(() => input(view, 'Relative light intensity').props.onChange(0));
    const art = view.root.findByType(ModernLabArtwork);
    expect(art.findAllByType('circle')).toHaveLength(0);
    expect(
      art.findAllByType('path').some((p) => p.props.d === 'M170 155L142 204M170 155L198 204'),
    ).toBe(true);
    expect(
      art
        .findAllByType('path')
        .find((p) => p.props.d === 'M55 37L157 75M71 25L172 75M85 17L188 75')!.props.opacity,
    ).toBe(0);
    expect(view.root.findByProps({ className: 'modern-key' }).children.join('')).toContain(
      'Light is off',
    );
    await act(() => view.unmount());
  });

  it('names spectral and microwave controls by what they actually change', async () => {
    for (const [kind, label] of [
      ['sodium', 'Spectral viewing range'],
      ['solar', 'Reveal comparison lines'],
      ['lamb', 'Microwave frequency'],
    ] as const) {
      let view!: ReactTestRenderer;
      await act(() => {
        view = create(createElement(ModernLab, { kind }));
      });
      expect(input(view, label)).toBeTruthy();
      expect(input(view, 'Incident frequency')).toBeUndefined();
      await act(() => view.unmount());
    }
  });

  it('derives foil exit rays from the same outer-ring model at both voltage endpoints', async () => {
    for (const value of [0, 1]) {
      let view!: ReactTestRenderer;
      await act(() => {
        view = create(createElement(MatterWaveArtwork, { mode: 1, value }));
      });
      const beam = view.root.findAllByType('path').find((p) => p.props.d.startsWith('M94 86H182'))!;
      const coordinates = beam.props.d
        .match(/L287 ([\d.-]+)/g)
        .map((x: string) => Number(x.slice(5)));
      const expected = (powderRadii(2000 + 5000 * value)[1] / 100) * 105;
      expect(86 - coordinates[0]).toBeCloseTo(expected, 12);
      expect(coordinates[1] - 86).toBeCloseTo(expected, 12);
      await act(() => view.unmount());
    }
  });
});
