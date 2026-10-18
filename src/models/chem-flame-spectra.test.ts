import { describe, it, expect } from 'vitest';
import {
  ATOMIC_LINES,
  photonEnergyEv,
  cobaltTransmission,
  flameLines,
  flameDirector,
} from './chem-flame-spectra';
describe('atomic line and filter model', () => {
  it('matches known photon-energy scale and inverse wavelength', () => {
    expect(photonEnergyEv(500)).toBeCloseTo(2.479684, 5);
    expect(photonEnergyEv(400) / photonEnergyEv(800)).toBe(2);
    expect(photonEnergyEv(588.995)).toBeCloseTo(2.10501, 4);
  });
  it('retains the sodium doublet spacing from NIST air wavelengths', () => {
    expect(ATOMIC_LINES.Na[1].nm - ATOMIC_LINES.Na[0].nm).toBeCloseTo(0.5974, 6);
  });
  it('filters by wavelength and cannot create optical power', () => {
    expect(cobaltTransmission(589)).toBeLessThan(0.04);
    expect(cobaltTransmission(404)).toBeGreaterThan(0.6);
    for (const x of flameLines('K', 1, true)) {
      expect(x.observed).toBeLessThanOrEqual(x.weight);
      expect(x.observed).toBeGreaterThan(0);
    }
  });
  it('removes interference at zero input and keeps seeking deterministic', () => {
    expect(
      flameLines('K', 0)
        .filter((x) => x.nm > 580 && x.nm < 600)
        .every((x) => x.observed === 0),
    ).toBe(true);
    expect(flameDirector(2, 0.5).filter).toBe(true);
    expect(flameDirector(6, 0.9).element).toBe('Hg');
  });
});

import {
  transitionEnergy,
  transitionEvent,
  filteredFlux,
  FIXED_UNKNOWN,
  identifyUnknown,
  unknownLines,
  flameScene,
  wavelengthColour,
} from './chem-flame-spectra';
describe('causal spectroscopy model', () => {
  it('uses independently tabulated state differences and keeps air/vacuum wavelengths distinct', () => {
    const yellow = transitionEnergy('Na-D2'),
      uv = transitionEnergy('Na-UV');
    expect(yellow.gapEv).toBeCloseTo(2.1044294261917313, 12);
    expect(yellow.vacuumNm).toBeCloseTo(589.1582625204379, 9);
    expect(uv.gapEv).toBeCloseTo(3.75332156580493, 12);
    expect(uv.vacuumNm).toBeCloseTo(330.3319373505661, 9);
    expect(uv.vacuumNm).toBeLessThan(yellow.vacuumNm);
    expect(uv.visible).toBe(false);
    expect(wavelengthColour(330)).toBe('#bac4c0');
    expect(yellow.vacuumNm).not.toBe(yellow.airNm);
    expect(transitionEnergy('Li-610').lowerEv).toBeCloseTo(transitionEnergy('Li-670').upperEv, 12);
  });
  it('conserves energy through photon flight, capture and off-axis return with discrete states', () => {
    for (const id of ['Na-D2', 'Na-UV', 'Li-670', 'Li-610', 'Hg-546'] as const)
      for (const kind of ['emission', 'absorption', 'return'] as const)
        for (const p of [0, 0.249, 0.25, 0.449, 0.45, 0.759, 0.76, 1]) {
          const e = transitionEvent(id, p, kind);
          expect(e.totalEv).toBeCloseTo(e.initialTotalEv, 12);
          expect([e.line.lowerEv, e.line.upperEv]).toContain(e.atomEv);
          expect(e.flight).toBeGreaterThanOrEqual(0);
          expect(e.flight).toBeLessThanOrEqual(1);
        }
    const stored = transitionEvent('Li-670', 0.6, 'return'),
      released = transitionEvent('Li-670', 0.9, 'return');
    expect(stored.photonEv).toBe(0);
    expect(stored.photonPhase).toBe('stored');
    expect(released.atomEv).toBe(0);
    expect(released.photonPhase).toBe('outgoing');
    expect(stored.packetId).toBe(released.packetId);
  });
  it('rejects excess photon energy and an empty lower state without destroying either energy', () => {
    const miss = transitionEvent('Na-D2', 1, 'absorption', false);
    expect(miss.captured).toBe(false);
    expect(miss.atomEv).toBe(0);
    expect(miss.photonEv).toBeCloseTo(1.25 * 2.1044294261917313, 12);
    const empty = transitionEvent('Li-610', 1, 'absorption', true, false),
      occupied = transitionEvent('Li-610', 1, 'absorption', true, true);
    expect(empty.captured).toBe(false);
    expect(empty.atomEv).toBe(0);
    expect(occupied.captured).toBe(true);
    expect(occupied.photonEv).toBe(0);
    expect(empty.sampleId).not.toBe(occupied.sampleId);
    expect(occupied.sampleId).not.toBe(transitionEvent('Li-670', 1, 'return').sampleId);
  });
  it('makes a passive filter dim Na without shifting it or creating K lines', () => {
    const a = filteredFlux('Na', 0, false),
      b = filteredFlux('Na', 0, true);
    expect(b.lines.map((x) => x.nm)).toEqual(a.lines.map((x) => x.nm));
    expect(b.transmission).toBeLessThan(0.04);
    expect(b.transmitted + b.removed).toBeCloseTo(a.input, 12);
    for (const el of ['Na', 'K'] as const)
      for (const interference of [0, 0.5, 1]) {
        const f = filteredFlux(el, interference, true);
        expect(f.transmitted).toBeLessThanOrEqual(f.input);
        expect(f.transmitted + f.removed).toBeCloseTo(f.input, 12);
      }
  });
  it('never regenerates observed lines from candidate selection and exposes an extra-line counterexample', () => {
    const record = JSON.stringify(FIXED_UNKNOWN);
    expect(Object.isFrozen(FIXED_UNKNOWN)).toBe(true);
    for (const candidate of ['Li', 'He', 'Hg'] as const) {
      identifyUnknown(candidate);
      expect(JSON.stringify(FIXED_UNKNOWN)).toBe(record);
      expect(identifyUnknown(candidate, true).supports).toBe(false);
    }
    expect(identifyUnknown('Hg').supports).toBe(true);
    expect(identifyUnknown('Li').supports).toBe(false);
    expect(identifyUnknown('He').supports).toBe(false);
    expect(unknownLines(true).slice(0, 3)).toEqual(FIXED_UNKNOWN);
  });
  it('handles finite boundaries without undefined elements, amplitudes or director states', () => {
    for (const v of [NaN, Infinity, -Infinity, -10, 0, 1, 1e6]) {
      expect(Number.isFinite(photonEnergyEv(v))).toBe(true);
      expect(Number.isFinite(cobaltTransmission(v))).toBe(true);
      expect(flameDirector(6, v).element).toBeTruthy();
      expect(flameScene(v, v).transition).toBeTruthy();
      expect(Number.isFinite(transitionEvent('Na-D2', v, 'absorption').totalEv)).toBe(true);
      expect(Number.isFinite(filteredFlux('K', v, true).transmitted)).toBe(true);
    }
    expect(flameScene(3, 16).prediction).toBe(true);
    expect(flameScene(3, 30).prediction).toBe(false);
    expect(flameScene(6, 24).transition).toBe('Li-610');
    expect(flameScene(6, 24).populated).toBe(false);
    expect(flameScene(6, 35).populated).toBe(true);
    expect(flameScene(6, 10).transition).toBe('Li-670');
  });
});

describe('measured bilingual event direction', () => {
  const eventAt = (ch: number, time: number, locale: 'zh' | 'en') => {
    const d = flameScene(ch, time, locale);
    return { d, e: transitionEvent(d.transition, d.eventProgress, d.kind, d.matched, d.populated) };
  };
  it('keeps the prediction open through the question and emits only with the spoken answer', () => {
    for (const [locale, reveal] of [
      ['en', 18.35],
      ['zh', 20.21],
    ] as const) {
      const before = eventAt(3, reveal - 0.01, locale),
        after = eventAt(3, reveal + 0.01, locale);
      expect(before.d.prediction).toBe(true);
      expect(before.e.emitted).toBe(false);
      expect(before.e.photonEv).toBe(0);
      expect(after.d.prediction).toBe(false);
      expect(after.e.emitted).toBe(true);
      expect(after.e.totalEv).toBeCloseTo(before.e.totalEv, 12);
    }
    expect(flameScene(0, 6, 'en').active).toBe(true);
    expect(flameScene(0, 6, 'zh').active).toBe(false);
    expect(flameScene(2, 0.8).filter).toBe(false);
    expect(flameScene(2, 2).filter).toBe(true);
  });
  it('shows photon capture during the absorption statement and preserves a stored-energy interval', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(eventAt(4, 9.5, locale).e.captured).toBe(false);
      expect(eventAt(4, 12.9, locale).e.captured).toBe(false);
      expect(eventAt(4, 14, locale).e.captured).toBe(true);
      expect(eventAt(6, 4.8, locale).e.captured).toBe(false);
      expect(eventAt(6, 8, locale).e.photonPhase).toBe('stored');
      expect(eventAt(6, 12, locale).e.photonPhase).toBe('outgoing');
    }
  });
  it('shows pure-Hg support before its causal photon and the later extra-line counterexample', () => {
    for (const [locale, add] of [
      ['en', 26.43],
      ['zh', 25.67],
    ] as const) {
      const match = flameScene(5, 19, locale),
        bridge = eventAt(5, 24, locale);
      expect(match.candidate).toBe('Hg');
      expect(match.bridge).toBe(false);
      expect(match.mixture).toBe(false);
      expect(bridge.d.bridge).toBe(true);
      expect(bridge.e.emitted).toBe(true);
      expect(bridge.e.flight).toBe(1);
      expect(flameScene(5, add - 0.01, locale).mixture).toBe(false);
      expect(flameScene(5, add + 0.01, locale).mixture).toBe(true);
    }
  });
  it('changes sample identity before the lithium counterexample, then captures only in the prepared trial', () => {
    for (const locale of ['zh', 'en'] as const) {
      const a = eventAt(6, 14.5, locale),
        b = eventAt(6, 23.5, locale),
        c = eventAt(6, 28.5, locale),
        d = eventAt(6, 31, locale);
      expect(a.e.sampleId).toBe('reference-2s');
      expect(b.e.sampleId).toBe('prepared-2s');
      expect(b.e.captured).toBe(false);
      expect(c.e.sampleId).toBe('prepared-2p');
      expect(c.e.captured).toBe(false);
      expect(d.e.sampleId).toBe(c.e.sampleId);
      expect(d.e.captured).toBe(true);
      for (const x of [a, b, c, d]) expect(x.e.totalEv).toBeCloseTo(x.e.initialTotalEv, 12);
    }
  });
});
