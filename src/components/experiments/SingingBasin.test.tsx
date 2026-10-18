import { createElement, act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import SingingBasin from './SingingBasin';
import { FilmContext, type Director } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
const film: Director = {
  watch: true,
  playing: false,
  time: 65,
  chapter: 2,
  run: 0,
  duration: 130,
  chapters: [],
  chapterTime: 13,
  chapterProgress: 0.5,
  variant: 'e1-water-spraying-basin',
};
const scene = (value: Director) =>
  createElement(FilmContext.Provider, { value }, createElement(SingingBasin));
describe('basin direction and controls', () => {
  it('retains the six-antinode apparatus on release and decays when seeking forward', async () => {
    let view!: ReactTestRenderer;
    await act(async () => {
      view = create(scene({ ...film, chapter: 3 }));
    });
    const before = view.root.findByProps({ role: 'meter' }).props['aria-valuenow'];
    await act(async () => view.update(scene({ ...film, chapter: 4 })));
    expect(
      view.root
        .findAllByType('ellipse')
        .filter((n) => n.props.fill === '#82a99b' || n.props.fill === '#f0e2ae'),
    ).toHaveLength(6);
    expect(view.root.findByProps({ role: 'meter' }).props['aria-valuenow']).toBeLessThan(before);
    expect(JSON.stringify(view.toJSON())).toContain('摩擦供能停止');
    await act(async () => view.unmount());
  });
  it('recomputes real energy, water spray and mode frequency, then restores the directed state', async () => {
    let view!: ReactTestRenderer;
    await act(async () => {
      view = create(scene(film));
    });
    const baseline = JSON.stringify(view.toJSON());
    await act(async () => view.update(scene({ ...film, watch: false })));
    const energy = view.root.findByProps({ role: 'meter' }).props['aria-valuenow'];
    const change = async (label: string, value: number) =>
      act(async () => {
        view.root
          .findAllByType(Range)
          .find((n) => n.props.label === label)!
          .props.onChange(value);
      });
    await change('有效摩擦供能', 0);
    expect(view.root.findByProps({ role: 'meter' }).props['aria-valuenow']).toBeLessThan(energy);
    await change('相对水量', 0);
    expect(JSON.stringify(view.toJSON())).toContain('盆中无水');
    expect(JSON.stringify(view.toJSON())).toContain('112');
    await act(async () => view.update(scene(film)));
    expect(JSON.stringify(view.toJSON())).toBe(baseline);
    await act(async () => view.unmount());
  });
});
