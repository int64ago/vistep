import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FusionInstrument, fusionFootnote, sci } from '../experiments/HydrogenBomb';
import { FUSION_DEFAULT, kelvinToKeV, type FusionParameters } from '../../models/hydrogen-bomb';
import { FUSION_VIEWS, hydrogenBombShot, type FusionView } from '../../models/hydrogen-bomb-film';

function render(
  view: FusionView,
  width = 860,
  chapter = FUSION_VIEWS.indexOf(view),
  progress = 0.5,
  parameters?: Partial<FusionParameters>,
) {
  const shot = hydrogenBombShot(chapter, progress);
  const q = { ...shot.parameters, ...parameters };
  return renderToStaticMarkup(
    createElement(FusionInstrument, {
      parameters: q,
      view,
      width,
      shot: { ...shot, parameters: q },
      time: 0,
    }),
  );
}
const numbers = (markup: string, attr: string) =>
  [...markup.matchAll(new RegExp(`${attr}="([-\\d.e+]+)"`, 'g'))].map((m) => Number(m[1]));

describe('fusion instrument markup', () => {
  it('renders every view at desktop and phone widths without NaN coordinates', () => {
    for (const view of FUSION_VIEWS)
      for (const width of [860, 358, 288]) {
        const markup = render(view, width);
        expect(markup).not.toMatch(/NaN|Infinity|undefined/);
        expect(markup).toContain(`data-view="${view}"`);
        const xs = numbers(markup, 'cx');
        for (const x of xs) expect(x).toBeGreaterThanOrEqual(-1);
        for (const x of xs) expect(x).toBeLessThanOrEqual(width + 1);
      }
  });
  it('places the approaching nucleus at the turning point at mid phase and reveals tunnelling late', () => {
    const mid = render('approach', 860, 0, 0.75);
    expect(mid).toContain('折返');
    expect(mid).not.toContain('隧穿概率');
    const late = render('approach', 860, 0, 0.99);
    expect(late).toContain('隧穿概率');
    expect(late).toContain('1.4×10⁻⁴');
    expect(late).toContain('在图外上方');
  });
  it('draws a needle instead of a hidden spike for flame temperatures', () => {
    const flame = render('distribution', 860, 2, 0, { temperatureKeV: kelvinToKeV(3000) });
    expect(flame).toContain('0.01 keV');
    const hot = render('distribution', 860, 2, 1);
    expect(hot).toContain('伽莫夫峰');
    expect(hot).toContain('31 keV');
  });
  it('reports the burn fraction and compression in the ignition view', () => {
    const pressed = render('ignition', 860, 4, 1);
    expect(pressed).toContain('×1000');
    expect(pressed).toContain('×1.0×10⁶');
    const flame = render('ignition', 860, 4, 0.1);
    expect(flame).toContain('≈ 0');
    const shot = hydrogenBombShot(4, 0.1);
    expect(fusionFootnote('ignition', shot.parameters, shot, false)).toContain('反应率为零');
    expect(fusionFootnote('rate', shot.parameters, shot, true)).toContain('外推');
    expect(flame).not.toMatch(/<circle[^>]*r="2"/);
  });
  it('reveals confinement examples in the scripted order', () => {
    const first = render('confinement', 860, 6, 0.2);
    expect(first).toMatch(/托卡马克[^<]*<\/text>/);
    expect(first.match(/opacity="0"/g)?.length).toBeGreaterThanOrEqual(2);
    const all = render('confinement', 860, 6, 0.9);
    expect(all.match(/opacity="0"/g) ?? []).toHaveLength(0);
  });
  it('formats scientific notation with superscripts', () => {
    expect(sci(1.16e8, 1)).toBe('1.2×10⁸');
    expect(sci(9.99e-16, 1)).toBe('1.0×10⁻¹⁵');
    expect(sci(0)).toBe('0');
  });
  it('keeps the default parameters on the reactivity fit range', () => {
    expect(FUSION_DEFAULT.temperatureKeV).toBe(10);
  });
});
