import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import SoundInterferenceLab, { SoundInterferenceArtwork } from './SoundInterferenceLab';
import { soundInterferencePoint, SOUND_OLD_FLAGS } from '../../models/sound-interference-lab';
describe('sound causal geometry', () => {
  it('renders the same receiver pressure with common-clock traces and two path identities', () => {
    for (const width of [260, 640])
      for (const x of [-1.2, 0.125, 1.2]) {
        const point = soundInterferencePoint(x, 1, 1000, Math.PI);
        const p = renderToStaticMarkup(
            <SoundInterferenceArtwork width={width} view="pressure" point={point} cycles={0.25} />,
          ),
          r = renderToStaticMarkup(
            <SoundInterferenceArtwork width={width} view="paths" point={point} />,
          );
        expect(p).not.toMatch(/NaN|Infinity/);
        expect(p.match(/data-pressure-trace=/g)).toHaveLength(3);
        expect(r.match(/data-sound-ray=/g)).toHaveLength(2);
        expect(p).toContain(`data-mean-square="${point.meanSquare}"`);
        expect(r).toContain(`data-distance="${point.r2}"`);
      }
  });
  it('frequency updates field values without moving any old flag', () => {
    const a = renderToStaticMarkup(
        <SoundInterferenceArtwork flags point={soundInterferencePoint(0.125, 0, 680)} />,
      ),
      b = renderToStaticMarkup(
        <SoundInterferenceArtwork flags point={soundInterferencePoint(0.125, 0, 340)} />,
      );
    const positions = (s: string) => [...s.matchAll(/data-fixed-x="([^"]+)"/g)].map((x) => x[1]);
    expect(positions(a)).toEqual(SOUND_OLD_FLAGS.map((f) => String(f.target)));
    expect(positions(a)).toEqual(positions(b));
    expect(a).not.toBe(b);
  });
});

const state = vi.hoisted(() => ({ locale: 'en', watch: true, chapter: 0, chapterTime: 2 }));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => state }));
vi.mock('../../i18n', () => ({ browserLocale: () => state.locale }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 268 }),
}));
vi.mock('./useLabTone', () => ({
  useLabTone: () => ({ on: false, unavailable: false, toggle: () => {} }),
}));
vi.mock('../lab/Controls', () => ({
  Range: (p: any) => React.createElement('input', { ...p, 'aria-label': p.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const renderers: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const r of renderers.splice(0)) await act(() => r.unmount());
});
async function mount() {
  let r!: ReactTestRenderer;
  await act(() => {
    r = create(<SoundInterferenceLab />);
  });
  renderers.push(r);
  return r;
}
const art = (r: ReactTestRenderer) => r.root.findByType(SoundInterferenceArtwork).props;
const input = (r: ReactTestRenderer, label: string) =>
  r.root.findAll((n) => n.type === 'input' && n.props['aria-label'] === label)[0]!;
it('fresh Explore preserves the actual local shot, moving flags, shared clock and held prediction in both voices', async () => {
  for (const locale of ['zh', 'en'])
    for (const [chapter, chapterTime] of [
      [0, 2],
      [0, 4.5],
      [1, 10],
      [2, 7],
      [3, 2],
      [3, 8],
    ]) {
      Object.assign(state, { locale, watch: true, chapter, chapterTime });
      const r = await mount(),
        before = art(r);
      state.watch = false;
      await act(() => r.update(<SoundInterferenceLab />));
      expect(art(r)).toEqual(before);
      if (chapter === 2) {
        expect(art(r).search).toBeGreaterThan(0);
        expect(art(r).search).toBeLessThan(1);
      }
      if (chapter === 3 && chapterTime === 2)
        expect(
          r.root.findAll(
            (n) =>
              n.type === 'button' &&
              n.children.join('') === (locale === 'en' ? 'Test 340 Hz' : '检验340Hz'),
          ),
        ).toHaveLength(1);
    }
});
it('manual frequency, source and view persist but cannot rewrite automatic evidence or fixed flag identities', async () => {
  Object.assign(state, { locale: 'en', watch: true, chapter: 3, chapterTime: 2 });
  const r = await mount(),
    held = art(r),
    fixed = JSON.stringify(SOUND_OLD_FLAGS);
  state.watch = false;
  await act(() => r.update(<SoundInterferenceLab />));
  await act(() =>
    r.root
      .findAll((n) => n.type === 'button' && n.children.join('') === 'Test 340 Hz')[0]!
      .props.onClick(),
  );
  expect(art(r).point.frequency).toBe(340);
  expect(art(r).question).toBe(false);
  await act(() => input(r, 'Shared frequency').props.onChange(1000));
  await act(() =>
    r.root
      .findAll((n) => n.type === 'button' && n.children.join('') === 'Pressure sum')[0]!
      .props.onClick(),
  );
  await act(() =>
    r.root
      .findAll((n) => n.type === 'button' && n.children.join('') === 'Second speaker: On')[0]!
      .props.onClick(),
  );
  const chosen = art(r);
  expect(chosen.point.secondOn).toBe(false);
  state.watch = true;
  await act(() => r.update(<SoundInterferenceLab />));
  expect(art(r)).toEqual(held);
  state.watch = false;
  await act(() => r.update(<SoundInterferenceLab />));
  expect(art(r)).toEqual(chosen);
  expect(JSON.stringify(SOUND_OLD_FLAGS)).toBe(fixed);
});
