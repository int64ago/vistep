import { describe, it, expect } from 'vitest';
import {
  extracellularTracer,
  temperatureSummary,
  thermalRegulation,
  waterRegulation,
  sodiumRegulation,
} from './bio-body-fluid-balance';
describe('body-fluid and survey models', () => {
  it('closes sodium balance and retains more sodium with its response', () => {
    const f = sodiumRegulation(10);
    expect(f.sodium - 1).toBeCloseTo(f.intake - f.externalLoss - f.urineTotal, 10);
    expect(f.sodium).toBeGreaterThan(sodiumRegulation(10, 1, false).sodium);
    expect(sodiumRegulation(10, 0).sodium).toBe(1);
  });
  it('conserves tracer amount through blood, tissue and lymph', () => {
    for (const t of [0, 1, 10, 40]) {
      const f = extracellularTracer(t);
      expect(f.total).toBeCloseTo(1, 12);
      expect(f.amount.every((m) => m >= 0)).toBe(true);
    }
    expect(extracellularTracer(40, false).amount[2]).toBe(0);
  });
  it('summarizes actual records without filling absent observations', () => {
    expect(temperatureSummary([36, 37, 38])).toEqual({ count: 3, mean: 37, range: 2 });
    expect(temperatureSummary([null, 36, null])).toEqual({ count: 1, mean: 36, range: 0 });
    expect(temperatureSummary([null])).toEqual({ count: 0, mean: null, range: null });
  });
  it('closes the thermal balance and exposes loss of feedback', () => {
    const f = thermalRegulation(12);
    expect(f.deviation).toBeCloseTo(f.input - f.removed, 10);
    expect(f.deviation).toBeLessThan(thermalRegulation(12, 1, false).deviation);
    expect(thermalRegulation(8, 0).deviation).toBe(0);
    expect(thermalRegulation(3).drive).toBeGreaterThan(0);
    expect(thermalRegulation(4).drive).toBe(0);
  });
  it('accounts for every water input and output without inventing water via ADH', () => {
    const f = waterRegulation(10);
    expect(f.water - 1).toBeCloseTo(f.intakeTotal - f.lossTotal - f.urineTotal, 10);
    expect(f.water).toBeGreaterThan(waterRegulation(10, 1, false).water);
    expect(waterRegulation(10, 0).water).toBe(1);
  });
});
import {
  renalPartition,
  renalGeometry,
  aqpInsertion,
  waterMarkers,
  sodiumCycle,
  fluidDirector,
  FLUID_IDS,
} from './bio-body-fluid-balance';
describe('terminal-nephron causal bridge', () => {
  it('partitions a common delivery exactly, with response requiring a driver', () => {
    for (const signal of [0, 0.1, 1, 10, 1e6, NaN])
      for (const response of [false, true])
        for (const driver of [0, 0.3, 1]) {
          const f = renalPartition(signal, response, driver);
          expect(f.reabsorbed + f.urine).toBeCloseTo(f.delivery, 14);
          expect(f.urine).toBeGreaterThanOrEqual(0);
        }
    expect(renalPartition(4, true, 0).reabsorbed).toBe(0);
    expect(renalPartition(4, true).urine).toBeLessThan(renalPartition(4, false).urine);
  });
  it('closes both body and tubular ledgers even when gradients or pumps fail', () => {
    for (const t of [0, 0.1, 3, 6, 10, Infinity, NaN])
      for (const loss of [0, 1, 2, NaN])
        for (const on of [true, false])
          for (const driver of [0, 1]) {
            const w = waterRegulation(t, loss, on, driver),
              s = sodiumRegulation(t, loss, on, !!driver);
            expect(w.water).toBeGreaterThan(0);
            expect(s.sodium).toBeGreaterThan(0);
            expect(w.water - 1).toBeCloseTo(w.intakeTotal - w.lossTotal - w.urineTotal, 11);
            expect(w.delivered).toBeCloseTo(w.reabsorbedTotal + w.urineTotal, 11);
            expect(s.sodium - 1).toBeCloseTo(s.intake - s.externalLoss - s.urineTotal, 11);
            expect(s.delivered).toBeCloseTo(s.reabsorbedTotal + s.urineTotal, 11);
          }
    expect(waterRegulation(10, 1, false).signal).toBeGreaterThan(0); // failed kidney response does not switch the sensor off
    expect(waterRegulation(10, 1, true, 0).urine).toBe(0.1);
  });
  it('preserves a tagged channel and joins the actual apical membrane without teleporting', () => {
    for (const w of [250, 278, 390, 680]) {
      const g = renalGeometry(w),
        start = aqpInsertion(0, w),
        end = aqpInsertion(1, w);
      expect(start.channel.id).toBe(end.channel.id);
      expect(end.channel.x).toBe(g.apical);
      for (let i = 0; i <= 1000; i++) {
        const f = aqpInsertion(i / 1000, w);
        expect(f.arc.every((p) => p.x >= g.apical - 1e-8)).toBe(true);
        if (f.halfGap > 0) {
          expect(f.arc[0].x).toBeCloseTo(g.apical, 9);
          expect(f.arc.at(-1)!.x).toBeCloseTo(g.apical, 9);
        }
        if (i) {
          const b = aqpInsertion((i - 1) / 1000, w);
          expect(Math.hypot(f.channel.x - b.channel.x, f.channel.y - b.channel.y)).toBeLessThan(
            0.2,
          );
        }
      }
    }
  });
  it('shows equal opposite exchange with no net water drive', () => {
    for (const t of [0, 0.1, 0.5, 0.9, 1]) {
      const f = waterMarkers(t, 0);
      expect(f[0].x + f[1].x).toBeCloseTo(280, 12);
      expect(f.map((x) => x.id)).toEqual(['water-A', 'water-B']);
      expect(waterMarkers(t, 1)).toEqual(f);
    }
  });
  it('keeps five ion identities and distinguishes passive entry from ATP-coupled exit', () => {
    for (const pump of [true, false])
      for (let i = 0; i <= 100; i++) {
        const f = sodiumCycle(i / 100, pump, 278);
        expect(f.ions.map((x) => x.id)).toEqual(['Na-0', 'Na-1', 'Na-2', 'K-0', 'K-1']);
        expect(f.ions.every((x) => Number.isFinite(x.x) && Number.isFinite(x.y))).toBe(true);
        if (!pump) {
          expect(f.atpUsed).toBe(0);
          expect(f.naToBody).toBe(0);
        }
      }
    const end = sodiumCycle(1);
    expect(end.naToBody).toBe(3);
    expect(end.kToCell).toBe(2);
    expect(end.atpUsed).toBe(1);
    const stopped = sodiumCycle(1, false);
    expect(
      stopped.ions
        .filter((x) => x.species === 'Na')
        .every((x) => x.x > stopped.apical && x.x < stopped.basal),
    ).toBe(true);
  });
  it('retains seven chapters with measured explanatory versus counterexample views', () => {
    expect(FLUID_IDS).toHaveLength(7);
    expect(fluidDirector(5, 15).shot).toBe('water-cell');
    expect(fluidDirector(5, 24).shot).toBe('no-gradient');
    expect(fluidDirector(6, 29).shot).toBe('pump-off');
    expect(fluidDirector(6, 39).shot).toBe('salt-budget');
  });
});

describe('retained-word-time director', () => {
  it('keeps initial solute in blood until the spoken exchange, with language-specific cuts', () => {
    expect(fluidDirector(0, 7, 'zh').progress).toBe(0);
    expect(fluidDirector(0, 3, 'en').progress).toBe(0);
    expect(fluidDirector(0, 13, 'zh').progress).toBe(1);
    expect(fluidDirector(0, 9.4, 'en').progress).toBe(1);
  });
  it('completes records while they are described and stops heat input at the measured words', () => {
    expect(fluidDirector(2, 8.8, 'zh').progress).toBe(1);
    expect(fluidDirector(2, 6.7, 'en').progress).toBe(1);
    for (const [locale, stop] of [
      ['zh', 9.6],
      ['en', 8.3],
    ] as const) {
      expect(
        thermalRegulation(fluidDirector(4, stop - 0.1, locale).progress * 12).drive,
      ).toBeGreaterThan(0);
      expect(thermalRegulation(fluidDirector(4, stop + 0.1, locale).progress * 12).drive).toBe(0);
    }
  });
});

describe('measured renal director', () => {
  for (const locale of ['zh', 'en'] as const) {
    const zh = locale === 'zh';
    it(`${locale}: channel insertion precedes water transfer; prediction starts with the intervention`, () => {
      const inserted = zh ? 13.65 : 17.35,
        flow = zh ? 14.15 : 17.5;
      expect(fluidDirector(5, inserted, locale).cell).toBeCloseTo(0.38, 10);
      expect(fluidDirector(5, flow, locale).cell).toBeCloseTo(0.42, 10);
      const remove = zh ? 21.7 : 25.65,
        compare = zh ? 26.95 : 30.15;
      expect(fluidDirector(5, remove - 0.01, locale).driver).toBe(true);
      const counter = fluidDirector(5, remove, locale);
      expect(counter.shot).toBe('no-gradient');
      expect(counter.driver).toBe(false);
      expect(counter.cell).toBe(1);
      // The inserted channel remains, and the same selected marker positions
      // join the previous completed transit rather than teleporting to its start.
      const before = fluidDirector(5, remove - 0.01, locale);
      expect(waterMarkers((before.cell - 0.42) / 0.5, 1)).toEqual(waterMarkers(counter.cell, 0));
      expect(fluidDirector(5, compare - 0.01, locale).shot).toBe('no-gradient');
      expect(fluidDirector(5, compare, locale).progress).toBe(0);
      expect(fluidDirector(5, zh ? 31.3 : 34.6, locale).progress).toBe(1);
    });
    it(`${locale}: tracks entry, export and potassium import before a new stopped-pump comparison`, () => {
      const entered = zh ? 13.4 : 12.8,
        exported = zh ? 16.2 : 17.25,
        imported = zh ? 22 : 24.65,
        stop = zh ? 25.75 : 28.15;
      const entry = sodiumCycle(fluidDirector(6, entered, locale).cell);
      expect(
        entry.ions.filter((x) => x.species === 'Na').every((x) => x.compartment === 'cell'),
      ).toBe(true);
      expect(entry.atpUsed).toBe(0);
      const out = sodiumCycle(fluidDirector(6, exported, locale).cell);
      expect(out.naToBody).toBe(3);
      expect(out.kToCell).toBe(0);
      expect(out.atpUsed).toBe(1);
      const full = sodiumCycle(fluidDirector(6, imported, locale).cell);
      expect(full.naToBody).toBe(3);
      expect(full.kToCell).toBe(2);
      expect(fluidDirector(6, stop - 0.01, locale).driver).toBe(true);
      const counter = fluidDirector(6, stop, locale);
      expect(counter.shot).toBe('pump-off');
      expect(counter.cell).toBe(0);
      expect(counter.driver).toBe(false);
      const held = fluidDirector(6, zh ? 30 : 32, locale),
        state = sodiumCycle(held.cell, held.driver);
      expect(state.naToBody).toBe(0);
      expect(state.atpUsed).toBe(0);
      expect(
        state.ions.filter((x) => x.species === 'Na').every((x) => x.compartment === 'cell'),
      ).toBe(true);
    });
  }
});
