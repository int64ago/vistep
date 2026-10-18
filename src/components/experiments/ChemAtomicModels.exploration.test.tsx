import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChemAtomicModels from './ChemAtomicModels';
import { FilmContext, type Director } from '../lab/FilmContext';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 288, compact: true }),
}));
const director: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 258,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
const frame = (chapter: number, t: number, p = 0.5) =>
  renderToStaticMarkup(
    <FilmContext.Provider value={{ ...director, chapter, chapterTime: t, chapterProgress: p }}>
      <ChemAtomicModels />
    </FilmContext.Provider>,
  );
describe('atomic model visible evidence contracts', () => {
  it('separates a historical hypothesis from a modelled detector image', () => {
    expect(frame(0, 3)).toContain('data-evidence="hypothesis"');
    const spot = frame(0, 16);
    expect(spot).toContain('data-evidence="cathode-field"');
    expect(spot).toContain('data-charge="-1"');
    expect(spot).not.toContain('data-evidence="hypothesis"');
    expect(frame(0, 24)).toContain('data-polarity="-1"');
  });
  it('reveals unchanged records before the charge-location hypothesis', () => {
    expect(frame(1, 4)).not.toContain('data-record-id=');
    expect(frame(1, 15).match(/data-record-id=/g)).toHaveLength(7);
    const neutral = frame(1, 31);
    expect(neutral.match(/data-negative-unit=/g)).toHaveLength(3);
    expect(neutral).toContain('+3e');
    expect(neutral).toContain('Charge location: still a hypothesis');
  });
  it('does not leak the higher-energy turning result into its prediction hold', () => {
    const before = frame(2, 29),
      after = frame(2, 39);
    expect(before).toContain('data-prediction="true"');
    expect(before).not.toContain('22.8');
    expect(before).not.toContain('data-alpha-id=');
    expect(after).toContain('45.5 → 22.8 fm');
    expect(after.match(/data-alpha-id=/g)).toHaveLength(2);
  });
  it('keeps observed spectral records fixed and hides the new photon before reveal', () => {
    const predict = frame(3, 20),
      revealed = frame(3, 32);
    expect(predict).not.toContain('data-photon-id=');
    expect(predict).not.toContain('data-vacuum-marker=');
    expect(predict.match(/data-spectral-record=/g)).toHaveLength(3);
    expect(frame(3, 22.69)).not.toContain('data-photon-id=');
    expect(frame(3, 22.71)).toContain('data-photon-id="H-4-2"');
    expect(revealed).toContain('data-photon-id="H-4-2"');
    expect(revealed).toContain('data-air-nm="656.28518"');
    expect(revealed).toContain('Vacuum prediction');
  });
  it('retains one-state probability sampling and same-scale comparisons', () => {
    expect(frame(4, 20, 0.5)).toContain('450 probability samples');
    expect(frame(5, 20, 1)).toContain('90%');
    expect(frame(6, 20)).toContain('One shared length scale');
    expect(frame(6, 20)).toContain('data-radial-node="2"');
    expect(frame(7, 20)).toContain('chem-atom-p-orientations');
  });
});
