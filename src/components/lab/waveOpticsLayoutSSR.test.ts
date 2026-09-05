import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// Server-side fixtures explicitly supply the phone media/observed width, not a browser viewport.
const fixture = vi.hoisted(() => ({ width: 246, compact: true, locale: 'zh' as 'zh' | 'en' }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return {
    ...react,
    useState: (initial: unknown) => react.useState(initial === 900 ? fixture.width : initial),
  };
});
vi.mock('./useCompact', () => ({ useCompact: () => fixture.compact }));
vi.mock('../../i18n', async (original) => {
  const i18n = await original<typeof import('../../i18n')>();
  return {
    ...i18n,
    t: (source: string, ...values: unknown[]) => i18n.translate(source, fixture.locale, ...values),
  };
});
import { FilmContext } from './Showcase';
import Rainbow from '../experiments/Rainbow';
import Doppler from '../experiments/Doppler';
import WaveInterference from '../experiments/WaveInterference';

function frame(component: typeof Rainbow, chapter: number, watch: boolean) {
  return renderToStaticMarkup(
    createElement(
      FilmContext.Provider,
      {
        value: {
          chapter,
          chapterProgress: 0.65,
          chapterTime: 14.3,
          time: chapter * 22 + 14.3,
          watch,
          playing: false,
          run: 0,
          duration: 179.5,
          chapters: [],
        },
      },
      createElement(component),
    ),
  );
}
describe('optical and wave phone composition — SSR only', () => {
  it('chooses one wave instrument and removes the duplicated watch explanations in both languages', () => {
    fixture.compact = true;
    for (const locale of ['zh', 'en'] as const) {
      fixture.locale = locale;
      for (let chapter = 0; chapter < 8; chapter++) {
        const wave = frame(WaveInterference, chapter, true);
        expect(wave.match(/<svg\b/g)).toHaveLength(1);
        expect(wave).toContain('wi-phone-instrument');
        expect(wave).not.toContain('wi-current');
        expect(wave).not.toContain('wi-readout');
        expect(frame(Doppler, chapter, true)).not.toContain('doppler-explanation');
        expect(frame(Rainbow, chapter, true)).not.toContain('rainbow-view-note');
      }
    }
  });
  it('keeps the contact sequence, causal histogram and dispersion comparison', () => {
    fixture.compact = true;
    for (const chapter of [0, 1, 2])
      expect(frame(Rainbow, chapter, true)).toContain('rainbow-path-steps');
    const concentration = frame(Rainbow, 3, true);
    expect(concentration.match(/<svg\b/g)).toHaveLength(2);
    expect(concentration).toContain('rainbow-concentration');
    expect(frame(Rainbow, 4, true)).toContain('rainbow-spectrum');
    expect(frame(Rainbow, 5, true)).toContain('A · 400 nm');
    expect(frame(Rainbow, 6, true)).toContain('B · 400 nm');
  });
  it('retains the detailed desktop diagrams and explicitly named manual controls/resets', () => {
    fixture.compact = false;
    fixture.width = 900;
    fixture.locale = 'en';
    expect(frame(WaveInterference, 2, true)).not.toContain('wi-phone-instrument');
    expect(frame(WaveInterference, 2, true)).toContain('wi-string-svg');
    const counts = [2, 4, 3];
    [Rainbow, Doppler, WaveInterference].forEach((component, i) => {
      const html = frame(component, 0, false);
      const ranges = [...html.matchAll(/<input\b[^>]*type="range"[^>]*>/g)].map((m) => m[0]);
      expect(ranges).toHaveLength(counts[i]);
      for (const range of ranges) expect(range).toMatch(/aria-label="[^"]+"/);
      expect(html).toMatch(/Reset|Restore/);
    });
  });
});
