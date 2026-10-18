import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CelestialArtwork } from './CelestialObservations';
import { JUPITER_RECORDS, cometEvidenceStage } from '../../models/celestial-evidence';
import { jupiterMoons } from '../../models/textbook-astronomy';

const markup = (value: number, phase = 1) =>
  renderToStaticMarkup(<CelestialArtwork mode={1} phase={phase} value={value} />);
const row = (svg: string, day: number) =>
  svg.match(new RegExp(`<g data-moon-record-day="${day}">(.+?)</g>`))?.[1];
const liveX = (svg: string) =>
  [...svg.matchAll(/data-live-moon-x="([^"]+)"/g)].map((m) => Number(m[1])).sort((a, b) => a - b);

describe('Jupiter observation artwork', () => {
  it('retains prior row coordinates when later dates appear and when rewinding', () => {
    const full = markup(1);
    for (const progress of [0, 0.25, 0.5, 0.75, 1, 0.25, 0]) {
      const svg = markup(progress);
      expect([...svg.matchAll(/data-moon-record-day=/g)]).toHaveLength(progress * 4 + 1);
      for (let day = 0; day <= progress * 4; day++) expect(row(svg, day)).toBe(row(full, day));
    }
  });
  it('draws the current view from the same day as its recorded snapshot', () => {
    for (let day = 0; day <= 4; day++) {
      const svg = markup(day / 4);
      expect(svg).toContain(`data-moon-observation-day="${day}"`);
      expect(liveX(svg)).toEqual(
        JUPITER_RECORDS[day].moons
          .filter((m) => !m.hidden)
          .map((m) => m.x)
          .sort((a, b) => a - b),
      );
      expect(row(svg, day)).toBeDefined();
    }
  });
  it('preserves the telescope optical chapter sixteen-day orbit while cover final state has all records', () => {
    const optics = markup(0.25, 0);
    expect(optics).toContain('data-moon-observation-day="4"');
    expect(liveX(optics)).toEqual(
      jupiterMoons(4)
        .filter((m) => !m.hidden)
        .map((m) => m.x)
        .sort((a, b) => a - b),
    );
    expect(optics).not.toContain('data-moon-record-day');
    expect([...markup(1).matchAll(/data-moon-record-day=/g)]).toHaveLength(5);
  });
});

describe('Halley historical evidence reveal', () => {
  const comet = (chapter: number, time: number, value = 0.5, watch = true) =>
    renderToStaticMarkup(
      <CelestialArtwork
        mode={3}
        value={value}
        cometEvidence={cometEvidenceStage(chapter, time, 'en', watch)}
      />,
    );
  const years = (svg: string) =>
    [...svg.matchAll(/data-comet-record-year="(\d+)"/g)].map((m) => Number(m[1]));
  it('keeps 1758 out of past records and the pending prediction, then removes it again on rewind', () => {
    const past = comet(6, 27),
      pending = comet(7, 6),
      observed = comet(7, 10),
      rewound = comet(7, 6);
    expect(years(past)).toEqual([1531, 1607, 1682]);
    expect(past).not.toContain('1758');
    expect(past).not.toContain('data-comet-prediction');
    expect(years(pending)).toEqual([1531, 1607, 1682]);
    expect(pending).not.toContain('1758');
    expect(pending).toContain('data-comet-prediction="pending"');
    expect(years(observed)).toEqual([1531, 1607, 1682, 1758]);
    expect(observed).not.toContain('data-comet-prediction');
    expect(rewound).toBe(pending);
  });
  it('changes evidence without changing orbit geometry and keeps exploration dates independent of progress', () => {
    const orbit = (svg: string) => svg.match(/<g data-comet-orbit="kepler">(.+?)<\/g>/)?.[1];
    const past = comet(6, 27),
      observed = comet(7, 10);
    expect(orbit(past)).toBeDefined();
    expect(orbit(observed)).toBe(orbit(past));
    for (const value of [0, 0.5, 1, 0])
      expect(years(comet(6, 0, value, false))).toEqual([1531, 1607, 1682, 1758]);
  });
});
