import { describe, it, expect } from 'vitest';
import {
  spectralPattern,
  wavePacket,
  expandingGalaxies,
  hubbleCandidate,
  antennaTemperature,
  antennaBudget,
  hornGeometry,
  planckRadiance,
  cooledRadiation,
  skyFluctuation,
  mollweide,
  cosmologyDirector,
} from './cosmology-observations';
import {
  HUBBLE_RECORDS,
  FIRAS_RECORDS,
  PENZIAS_WILSON_RECORD,
} from './cosmology-observations-records';
describe('independent cosmology arithmetic and immutable published evidence', () => {
  it('preserves the actual historical point arrays under every candidate and model', () => {
    const before = JSON.stringify([HUBBLE_RECORDS, FIRAS_RECORDS]);
    for (let i = 0; i <= 20; i++) {
      spectralPattern(1 + i / 200);
      expandingGalaxies(1 + i / 20, 70, i % 5);
      cooledRadiation(1 + i / 20);
    }
    expect(JSON.stringify([HUBBLE_RECORDS, FIRAS_RECORDS])).toBe(before);
    expect(HUBBLE_RECORDS).toHaveLength(24);
    expect(FIRAS_RECORDS).toHaveLength(43);
    expect(HUBBLE_RECORDS.filter((r) => r.radialVelocityKmPerSecondMeasured < 0)).toHaveLength(5);
    expect(Object.isFrozen(HUBBLE_RECORDS[0])).toBe(true);
    expect(Object.isFrozen(FIRAS_RECORDS)).toBe(true);
    expect(FIRAS_RECORDS[7].archiveMonopoleMJySr).toBe(383.478);
  });
  it('predicts a multiplicative third line, not an additive shift', () => {
    const s = spectralPattern(1.05);
    [455.7525, 510.4365, 689.094].forEach((v, i) => expect(s[i].observed).toBeCloseTo(v, 9));
    expect(s[2].observed - s[2].rest).not.toBeCloseTo(s[0].observed - s[0].rest);
  });
  it('keeps crest identities, proper spacing and local c in one evolving phase solution', () => {
    for (const H of [0, 0.1, 0.3, 0.5])
      for (const t of [0.2, 1, 3]) {
        const a = wavePacket(t, H),
          b = wavePacket(t + 1e-5, H);
        expect(a.crests.map((c) => c.id)).toEqual([-2, -1, 0, 1, 2]);
        for (let i = 0; i < 4; i++)
          expect(a.crests[i + 1].x - a.crests[i].x).toBeCloseTo(Math.exp(H * t));
        for (let i = 0; i < 5; i++)
          expect((b.crests[i].x - a.crests[i].x) / 1e-5 - H * a.crests[i].x).toBeCloseTo(1, 4);
      }
  });
  it('changing origin leaves actual pair separations and velocity differences unchanged', () => {
    const a = expandingGalaxies(1.5, 70, 2),
      b = expandingGalaxies(1.5, 70, 1);
    for (let i = 0; i < a.length; i++)
      for (let j = 0; j < a.length; j++) {
        expect(a[i].dx - a[j].dx).toBeCloseTo(b[i].dx - b[j].dx);
        expect(a[i].vx - a[j].vx).toBeCloseTo(b[i].vx - b[j].vx);
      }
    expect(a[4].distance).toBe(150);
    expect(a[4].vx).toBe(10500);
    expect(a[4].vx).toBe(2 * a[3].vx);
  });
  it('raw-table candidate diagnostics agree with independent scalar sums', () => {
    const a = hubbleCandidate('constant'),
      b = hubbleCandidate('proportional');
    expect(a.constant).toBe(373.125);
    expect(b.slope).toBeCloseTo(423.9373232316303, 8);
    expect(a.rms).toBeCloseTo(363.43790305222706, 8);
    expect(b.rms).toBeCloseTo(224.2025347354266, 8);
  });
  it('preserves the original effective antenna account and separate airmass example', () => {
    expect(antennaTemperature(90).total).toBeCloseTo(6.7);
    expect(antennaTemperature(30).total).toBeCloseTo(9);
    expect(antennaBudget(1).remaining).toBeCloseTo(4.4);
    expect(antennaBudget(2).remaining).toBeCloseTo(3.5);
    expect(PENZIAS_WILSON_RECORD.reportedUncertaintyK).toBe(1);
  });
  it('horn routes terminate in the actual moving output, selector and shared receiver', () => {
    for (const w of [268, 640])
      for (const e of [30, 60, 90]) {
        const g = hornGeometry(w, 270, e);
        expect(g.skyRoute[0]).toEqual(g.port);
        expect(g.skyRoute.at(-1)).toEqual(g.receiver);
        expect(g.referenceRoute.at(-1)).toEqual(g.receiver);
        expect(g.skyRoute.at(-2)).toEqual(g.selector);
        expect(g.referenceRoute.at(-2)).toEqual(g.selector);
        expect(Math.hypot(g.mouth.x - g.pivot.x, g.mouth.y - g.pivot.y)).toBeCloseTo(65);
      }
  });
  it('uses Bnu SI units and scales peak height as a^-3, energy density as a^-4', () => {
    const today = cooledRadiation(1),
      future = cooledRadiation(2);
    expect(today.peakFrequencyGHz).toBeCloseTo(160.200726895876, 8);
    expect(future.peakFrequencyGHz).toBeCloseTo(80.100363447938, 8);
    expect(future.temperature).toBe(1.3625);
    expect(future.peakRadianceRatio).toBe(0.125);
    expect(future.energyDensityRatio).toBe(0.0625);
    for (const a of [1, 1.3, 2, 4])
      for (const n of [40e9, 100e9, 160e9, 300e9])
        expect(planckRadiance(n, 2.725 / a)).toBeCloseTo(planckRadiance(a * n, 2.725) / a ** 3, 8);
    expect(planckRadiance(160e9, 2.725)).toBeCloseTo(383.665022175570167, 9);
  });
  it('keeps empty and invalid inputs finite, including the zero-frequency limit and poles', () => {
    for (const v of [NaN, Infinity, -Infinity, -10, 0, 1e8]) {
      expect(Number.isFinite(planckRadiance(v, v))).toBe(true);
      expect(Object.values(mollweide(v, v)).every(Number.isFinite)).toBe(true);
      expect(Number.isFinite(skyFluctuation(v, v))).toBe(true);
      expect(Number.isFinite(antennaTemperature(v).total)).toBe(true);
      expect(wavePacket(v, v).crests.every((c) => Number.isFinite(c.x))).toBe(true);
    }
    expect(skyFluctuation(Math.PI + 0.2, 0.3)).toBeCloseTo(skyFluctuation(-Math.PI + 0.2, 0.3));
    expect(planckRadiance(0, 2.725)).toBe(0);
    expect(planckRadiance(160e9, 0)).toBe(0);
    expect(mollweide(Math.PI, 0).x).toBe(320);
    expect(mollweide(0, Math.PI / 2).y).toBe(103);
  });
  it('keeps measured questions unanswered until their locale answer and restores them on rewind', () => {
    for (const [lang, line, distance, remainder, cooling] of [
      ['zh', 15.53, 35.15, 10.31, 24.47],
      ['en', 16.47, 38.53, 12.27, 29.31],
    ] as const) {
      for (const [chapter, answer] of [
        [0, line],
        [1, distance],
        [3, remainder],
        [4, cooling],
      ]) {
        expect(cosmologyDirector(chapter, answer - 0.1, lang).reveal).toBe(false);
        expect(cosmologyDirector(chapter, answer + 0.1, lang).reveal).toBe(true);
        expect(cosmologyDirector(chapter, answer - 0.1, lang).reveal).toBe(false);
      }
    }
    expect(cosmologyDirector(4, 28, 'en').reveal).toBe(false);
    expect(cosmologyDirector(4, 28, 'zh').scale).toBe(2);
    expect(cosmologyDirector(3, 24, 'zh').shot).toBe('firas');
    expect(cosmologyDirector(3, 24, 'en').shot).toBe('budget');
  });
  it('lowering elevation makes the displayed airmass and temperature rise before the return to historic zenith', () => {
    for (const locale of ['zh', 'en'] as const) {
      const before = cosmologyDirector(2, 15, locale),
        during = cosmologyDirector(2, 18, locale),
        low = cosmologyDirector(2, 23, locale),
        zenith = cosmologyDirector(2, 29, locale);
      expect(before.elevation).toBe(90);
      expect(during.elevation).toBeLessThan(before.elevation);
      expect(low.elevation).toBe(30);
      expect(antennaTemperature(low.elevation).total).toBeCloseTo(9);
      expect(zenith.elevation).toBe(90);
      expect(antennaTemperature(zenith.elevation).total).toBeCloseTo(6.7);
      expect(cosmologyDirector(2, 6, locale).reference).toBe(true);
      expect(cosmologyDirector(2, 11, locale).reference).toBe(false);
    }
    expect(cosmologyDirector(4, 40, 'en').shot).toBe('cooling');
    expect(cosmologyDirector(4, 41, 'en').shot).toBe('map');
    expect(cosmologyDirector(4, 49.35, 'en').progress).toBe(1);
  });
});
