import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChemPeriodicPractical from './ChemPeriodicPractical';
import { FilmContext, type Director } from '../lab/FilmContext';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 288, compact: true }),
}));
const base: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 250,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
const frame = (chapter: number, time: number, variant?: string) =>
  renderToStaticMarkup(
    <FilmContext.Provider value={{ ...base, chapter, chapterTime: time, variant }}>
      <ChemPeriodicPractical />
    </FilmContext.Provider>,
  );
describe('periodic film visible causal contracts', () => {
  it('starts with real reference samples, then traces two electron credits', () => {
    expect(frame(0, 4)).toContain('halogen-water reference');
    expect(frame(0, 13).match(/data-electron-id=/g)).toHaveLength(2);
    expect(frame(0, 13)).toContain('Transfer credits: −2');
  });
  it('preserves the activity three-well comparison and separate experiment tubes', () => {
    expect(frame(0, 4, 'chapter-practical').match(/data-plate-well=/g)).toHaveLength(3);
    expect(frame(2, 3, 'chapter-practical').match(/data-plate-well=/g)).toHaveLength(2);
    expect(frame(0, 4, 'halogen-tubes')).not.toContain('data-plate-well=');
  });
  it('does not reveal reverse and half-dose predictions too early', () => {
    expect(frame(2, 20)).not.toContain('No appreciable reverse displacement');
    expect(frame(2, 27)).toContain('No appreciable reverse displacement');
    expect(frame(7, 30)).toContain('Will all of it dissolve?');
    expect(frame(7, 30)).not.toContain('data-solid="0.5"');
    expect(frame(7, 34)).toContain('data-solid="0.5"');
  });
  it('retains all atom IDs and separates net transfer from the cold observation', () => {
    expect(frame(3, 5)).toContain('Not obvious ≠ always zero');
    expect(frame(4, 18).match(/data-atom-id=/g)).toHaveLength(7);
    expect(frame(5, 12)).toContain('data-atom-id="water-H-transfer"');
  });
  it('makes the limited-acid counterexample and unchanged central oxidation visible', () => {
    expect(frame(6, 23)).toContain('Which solid remains?');
    expect(frame(6, 23)).not.toContain('Al: solid 0.33');
    expect(frame(6, 27)).toContain('Al: solid 0.33');
    expect(frame(6, 27)).toContain('Mg: solid 0.00');
    expect(frame(7, 17)).toContain('Al stays +3');
    expect(frame(7, 38).match(/data-period-record=/g)).toHaveLength(3);
  });
});
