import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChemIronCycle, { IronElectronView, IronCoordinationView } from './ChemIronCycle';
import { FilmContext, type Director } from '../lab/FilmContext';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
const d: Director = {
  watch: true,
  playing: false,
  time: 0,
  chapter: 0,
  run: 0,
  duration: 261,
  chapters: [],
  chapterTime: 0,
  chapterProgress: 0,
};
const frame = (chapter: number, chapterTime: number) =>
  renderToStaticMarkup(
    <FilmContext.Provider value={{ ...d, chapter, chapterTime }}>
      <ChemIronCycle />
    </FilmContext.Provider>,
  );
describe('iron-cycle visible causal contracts', () => {
  it('keeps mixed sample and limited-dose answers out of pre-reveal presentation', () => {
    const mixed = frame(0, 16);
    expect(mixed).toContain('Will the mixture turn red?');
    expect(mixed).not.toContain('Red ≠ iron(III) only');
    expect(frame(0, 27)).toContain('Red ≠ iron(III) only');
    expect(frame(3, 23)).toContain('Must the colour be the same?');
    expect(frame(3, 23)).not.toContain('Possible net result');
    expect(frame(3, 30)).toContain('Possible net result');
  });
  it('hides the conserved iron and central oxidation-state answers during their predictions', () => {
    const before = frame(6, 15),
      after = frame(6, 27);
    expect(before).toContain('More total iron, too?');
    expect(before).not.toContain('Total iron stays fixed');
    expect(after).toContain('Total iron stays fixed');
    const coordination = renderToStaticMarkup(
      <IronCoordinationView w={258} first={1} second={0} question />,
    );
    expect(coordination).toContain('Iron oxidation state ?</text>');
    expect(coordination).not.toContain('remains formally plus three');
    expect(coordination).not.toContain('>+3<');
  });
  it('displays electron phases from the charge-ledger frame, without duplicating donor iron', () => {
    const s = renderToStaticMarkup(<IronElectronView w={258} direction="reduce" p={0.4} />);
    expect(s.match(/data-iron-id=/g)).toHaveLength(3);
    expect(s.match(/data-electron-id=/g)).toHaveLength(2);
    expect(s.match(/data-phase="transfer"/g)).toHaveLength(2);
    expect(s).toContain('2 e⁻');
    const end = renderToStaticMarkup(<IronElectronView w={258} direction="reduce" p={1} />);
    expect(end).toContain('3 / 3');
  });
  it('keeps SCN absent before the textbook post-reaction test', () => {
    expect(frame(1, 21)).not.toContain('post-SCN');
    expect(frame(1, 29)).toContain('post-SCN-0');
    expect(frame(1, 29)).toContain('no red response');
  });
});
