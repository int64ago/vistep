import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FilmContext, type Director } from '../lab/FilmContext';
import ChemCarbonateComparison from './ChemCarbonateComparison';
import { CARBONATE_CHAPTER_SECONDS } from '../../models/chem-carbonate-comparison';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/SignalFigure', () => ({
  useSignalWidth: () => ({ host: { current: null }, width: 248, compact: true }),
}));
const state = (chapter: number, chapterTime: number): Director => ({
  watch: true,
  playing: false,
  time: 0,
  chapter,
  run: 0,
  duration: 202,
  chapters: [],
  chapterTime,
  chapterProgress: chapterTime / CARBONATE_CHAPTER_SECONDS[chapter],
});
const render = (chapter: number, progress: number) =>
  renderToStaticMarkup(
    <FilmContext.Provider value={state(chapter, progress)}>
      <ChemCarbonateComparison />
    </FilmContext.Provider>,
  );
describe('carbonate causal shot state correspondence', () => {
  it('keeps bicarbonate hydration composition distinct from carbonate', () => {
    const carbonate = render(1, 14),
      bicarbonate = render(1, 18);
    expect(carbonate).toContain('Na₂CO₃');
    expect(bicarbonate).toContain('NaHCO₃');
    expect(carbonate).not.toContain('data-atom="Hc"');
    expect(bicarbonate).toContain('data-atom="Hc"');
    expect(carbonate.match(/>Na⁺<\/text>/g)).toHaveLength(2);
    expect(bicarbonate.match(/>Na⁺<\/text>/g)).toHaveLength(1);
    expect(carbonate).toContain('CO₃²⁻');
    expect(bicarbonate).toContain('HCO₃⁻');
  });
  it('shows the carbonic-acid/CO2 connection before applying the combined-pool equilibrium', () => {
    const transfer = render(3, 16.2),
      balance = render(3, 25);
    expect(transfer).toContain('H₂CO₃ ⇌ CO₂(aq) + H₂O');
    expect(balance).toContain('CO₂(aq) + H₂O');
    expect(balance).toContain('One combined carbon pool');
    expect(balance).toContain('pH 8.34');
    expect(balance).toContain('pH 11.13');
  });
  it('labels the molecular endpoint that the transferred hydrogen has already reached', () => {
    const out = render(3, 7);
    expect(out).toContain('>HCO₃⁻</text>');
    expect(out).toContain('>OH⁻</text>');
    expect(out).not.toContain('>CO₃²⁻</text>');
    expect(out).not.toContain('>H₂O</text>');
  });
  it('shows colourless dilution with remaining carbon and alkaline pH', () => {
    const out = render(4, 15);
    expect(out).toContain('0.100 mmol');
    expect(out).toContain('pH 8.09');
    expect(out).toContain('No visible pink');
  });
  it('shows the full residue before the spoken number, then partial and reheating comparisons', () => {
    expect(render(7, 3)).toContain('0.631');
    expect(render(7, 13)).toContain('Half-converted');
    expect(render(7, 13)).toContain('0.500');
    expect(render(7, 13)).not.toContain('Further possible loss');
    expect(render(7, 20)).toContain('Further possible loss');
    expect(render(7, 20)).toContain('0.185');
  });
  it('keeps the carbonate heating control free of product claims', () => {
    const control = render(5, 15),
      reacting = render(6, 3.5);
    expect(control).toContain('Limewater: clear');
    expect(control).not.toContain('Limewater: cloudy');
    expect(reacting).toContain('Limewater: cloudy');
  });
});
