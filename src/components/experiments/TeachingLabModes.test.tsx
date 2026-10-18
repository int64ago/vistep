import { createElement, act, type ComponentType } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import MagdeburgBowlsLab from './MagdeburgBowlsLab';
import InductionCoilLab from './InductionCoilLab';
import MutualInductionLab from './MutualInductionLab';
import SelfInductionLab from './SelfInductionLab';
import AcCircuitLab from './AcCircuitLab';
import MolecularMeasurementLab from './MolecularMeasurementLab';
import StatisticalMotionLab from './StatisticalMotionLab';
import SolidStructureLab from './SolidStructureLab';
import WirelessInterferenceLab from './WirelessInterferenceLab';
vi.mock('../../i18n', () => ({ t: (s: string) => s, browserLocale: () => 'zh' }));
const base: Director = {
  watch: true,
  playing: false,
  time: 10,
  chapter: 0,
  run: 0,
  duration: 100,
  chapters: [],
  chapterTime: 10,
  chapterProgress: 0.35,
};
const scene = (Component: ComponentType, value: Director) =>
  createElement(FilmContext.Provider, { value }, createElement(Component));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
describe('textbook apparatus modes', () => {
  it('keeps a newly sealed free-exploration bowl trial independent of the last film chapter', async () => {
    let view!: ReactTestRenderer;
    await act(async () => {
      view = create(scene(MagdeburgBowlsLab, { ...base, watch: false, chapter: 0 }));
    });
    const early = JSON.stringify(view.toJSON());
    await act(async () =>
      view.update(scene(MagdeburgBowlsLab, { ...base, watch: false, chapter: 3 })),
    );
    expect(JSON.stringify(view.toJSON())).toBe(early);
    expect(early).toContain('68.2');
    expect(early).toContain('1000');
    await act(async () => view.unmount());
  });
  it('does not carry an open aluminium-ring switch into the closed galvanometer circuit', async () => {
    let view!: ReactTestRenderer;
    await act(async () => {
      view = create(scene(InductionCoilLab, { ...base, watch: false }));
    });
    const baseline = JSON.stringify(view.toJSON());
    const select = async (label: string, value: string) =>
      act(async () => {
        view.root
          .findAllByType(Segments)
          .find((n) => n.props.label === label)!
          .props.onChange(value);
      });
    await select('选择感应实验', 'ring');
    await select('铝环连接', 'open');
    await select('选择感应实验', 'coil');
    expect(JSON.stringify(view.toJSON())).toBe(baseline);
    await act(async () => view.unmount());
  });
  const cases: [string, ComponentType, string, number, string, number][] = [
    ['mutual audio', MutualInductionLab, 'e2-mutual-induction-audio', 3, '信号频率', 1000],
    ['self induction', SelfInductionLab, 'e2-self-induction-switch-on', 1, '线圈自感系数', 10],
    ['AC inductor', AcCircuitLab, 'e2-inductive-reactance-lamp', 5, '线圈自感系数', 0.1],
    ['LC losses', AcCircuitLab, 'e2-lc-oscillation-measurement', 11, '振荡回路电阻', 4],
    [
      'Brownian size',
      MolecularMeasurementLab,
      'e3-brownian-carbon-particles',
      0,
      '等效炭粒半径',
      1.5,
    ],
    [
      'oil calibration',
      MolecularMeasurementLab,
      'e3-oleic-acid-film',
      7,
      '1毫升溶液的滴数读数',
      80,
    ],
    ['bean flow', StatisticalMotionLab, 'e3-beans-pressure-model', 5, '每秒落下豆粒数', 40],
    [
      'thermal directions',
      SolidStructureLab,
      'e3-thermal-anisotropy',
      3,
      '两主方向热扩散率之比',
      1,
    ],
    [
      'wireless duty',
      WirelessInterferenceLab,
      'e2-wifi-bluetooth-interference',
      1,
      '蓝牙占用时隙比例',
      0,
    ],
  ];
  it.each(cases)(
    'restores the narrated %s experiment after exploration changes',
    async (_name, Component, variant, chapter, label, value) => {
      let view!: ReactTestRenderer;
      const directed = { ...base, variant, chapter };
      await act(async () => {
        view = create(scene(Component, directed));
      });
      const before = JSON.stringify(view.toJSON());
      await act(async () => view.update(scene(Component, { ...directed, watch: false })));
      const control = view.root.findAllByType(Range).find((n) => n.props.label === label);
      expect(control).toBeDefined();
      const freeBefore = JSON.stringify(view.toJSON());
      await act(async () => control!.props.onChange(value));
      expect(JSON.stringify(view.toJSON())).not.toBe(freeBefore);
      await act(async () => view.update(scene(Component, directed)));
      expect(JSON.stringify(view.toJSON())).toBe(before);
      await act(async () => view.unmount());
    },
  );
});
