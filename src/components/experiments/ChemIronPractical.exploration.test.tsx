import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChemIronPractical from './ChemIronPractical';
import { FilmContext, type Director } from '../lab/FilmContext';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
const d: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 207,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
const frame = (chapter: number, chapterTime: number) =>
  renderToStaticMarkup(
    <FilmContext.Provider value={{ ...d, chapter, chapterTime }}>
      <ChemIronPractical />
    </FilmContext.Provider>,
  );
describe('iron practical visual contracts', () => {
  it('keeps the finite-donor answer and reagent out of the prediction', () => {
    const before = frame(6, 3),
      after = frame(6, 23.2);
    expect(before).toContain('data-prediction="true"');
    expect(before).toContain('Prediction: the result is not yet revealed');
    expect(before).toContain('1Fe + 5Fe³⁺');
    expect(before).not.toContain('data-diagnostic=');
    expect(after).toContain('data-diagnostic="red"');
    expect(after).toContain('SCN⁻: red response');
  });
  it('uses persistent atom and credit IDs rather than extra ghost product objects', () => {
    const moving = frame(6, 13),
      end = frame(6, 22);
    expect(moving.match(/data-practical-atom=/g)).toHaveLength(6);
    expect(end.match(/data-practical-atom=/g)).toHaveLength(6);
    expect(moving.match(/data-electron-id=/g)).toHaveLength(2);
    expect(end.match(/data-electron-id=/g)).toHaveLength(2);
  });
  it('keeps intact MnO4 identity and real O/H counts in the net close view', () => {
    expect(frame(4, 6)).toContain('MnO₄⁻');
    expect(frame(4, 17.5).match(/data-net-atom=/g)).toHaveLength(13);
    expect(frame(4, 17.5)).toContain('Mn 1 / O 4 / H 8');
    expect(frame(4, 20)).toContain('data-diagnostic="absent"');
    expect(frame(4, 21)).toContain('data-diagnostic="red"');
  });
  it('keeps the third iodine as iodide and names the blue-host view as a net account', () => {
    const blue = frame(2, 18);
    expect(blue.match(/data-element="I"/g)).toHaveLength(3);
    expect(blue).toContain('I₂ + I⁻');
    expect(blue).toContain('Iodine account, not a structure');
    expect(blue.match(/data-formal-charge="-1"/g)).toHaveLength(1);
  });
  it('pairs the two neutral iodine identities after donation while the Fe acceptors still await credits', () => {
    const forming = frame(2, 6.5);
    expect(forming).toContain('I₂ + I⁻');
    expect(forming.match(/data-formal-charge="-1"/g)).toHaveLength(1);
    expect(forming.match(/data-formal-charge="3"/g)).toHaveLength(2);
    expect(forming).toContain('data-credit-charge="-2"');
  });
  it('keeps both named reaction partners visible when the recording compares iron-two roles', () => {
    const comparison = frame(4, 25);
    expect(comparison).toContain('data-role-comparison="true"');
    expect(comparison).toContain('>Zn</text>');
    expect(comparison).toContain('>MnO₄⁻ / H⁺</text>');
    expect(comparison.match(/stroke-width="3"/g)).toHaveLength(2);
  });
  it('records colour binding on the same oxidation-state node, with no invented redox edge', () => {
    const before = frame(5, 10),
      after = frame(5, 18);
    expect(before).toContain('data-current-route-revealed="false"');
    expect(after).toContain('data-practical-map-records="6"');
    expect(after).toContain('Same state · colour response');
  });
});
