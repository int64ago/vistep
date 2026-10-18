import { describe, it, expect } from 'vitest';
import {
  esterPreparation,
  esterHydrolysis,
  ethanolBurn,
  aceticCarbonate,
  esterDirector,
} from './chem-ester-reaction';
describe('ester preparation and hydrolysis', () => {
  it('conserves both organic groups and water across reaction and receiver', () => {
    for (const heat of [true, false])
      for (const cat of [true, false])
        for (const collect of [true, false])
          for (const p of [0, 0.3, 1]) {
            const m = esterPreparation(p, heat, cat, collect),
              r = m.receiver;
            expect(m.acid + r.acid + m.ester + r.ester).toBeCloseTo(1, 9);
            expect(m.alcohol + r.alcohol + m.ester + r.ester).toBeCloseTo(1, 9);
            expect(m.water + r.water).toBeCloseTo(0.2 + m.extent, 9);
            expect(m.washed.oil + m.washed.dissolvedEster).toBeCloseTo(r.ester);
            expect(m.washed.acid + m.washed.acetate).toBeCloseTo(r.acid);
            expect(m.washed.carbonDioxide + m.washed.carbonate).toBeCloseTo(0.3);
          }
  });
  it('links catalyst and heat to rate while removal changes the reaction account', () => {
    expect(esterPreparation(1).extent).toBeGreaterThan(esterPreparation(1, false).extent);
    expect(esterPreparation(1).extent).toBeGreaterThan(esterPreparation(1, true, false).extent);
    expect(esterPreparation(1).extent).toBeGreaterThan(
      esterPreparation(1, true, true, false).extent,
    );
    expect(esterPreparation(0).receiver.ester).toBe(0);
  });
  it('conserves acid and ethyl groups during hydrolysis and consumes hydroxide only in base', () => {
    for (const med of ['neutral', 'acid', 'base'] as const)
      for (const p of [0, 0.4, 1])
        for (const base of [0, 0.3, 1.2]) {
          const m = esterHydrolysis(p, med, 75, base);
          expect(m.ester + m.alcohol).toBeCloseTo(1);
          expect(m.ester + m.acid + m.acetate).toBeCloseTo(1);
          if (med === 'base') {
            expect(m.hydroxide + m.acetate).toBeCloseTo(base);
            expect(m.extent).toBeLessThanOrEqual(base);
          } else expect(m.water + m.extent).toBeCloseTo(10);
        }
  });
  it('shows the declared temperature/medium comparison without forcing full conversion', () => {
    expect(esterHydrolysis(1, 'acid', 75).extent).toBeGreaterThan(
      esterHydrolysis(1, 'acid', 25).extent,
    );
    expect(esterHydrolysis(1, 'acid').extent).toBeGreaterThan(esterHydrolysis(1, 'neutral').extent);
    expect(esterHydrolysis(1, 'base').extent).toBeGreaterThan(esterHydrolysis(1, 'acid').extent);
    expect(esterHydrolysis(1, 'base', 75, 0).extent).toBe(0);
    expect(esterHydrolysis(1, 'acid').extent).toBeLessThan(1);
  });
  it('keeps the activity evidence and chapter routes explicit', () => {
    expect(ethanolBurn(1).water).toBeCloseTo(0.6);
    expect(ethanolBurn(1).carbonDioxide).toBeCloseTo(0.4);
    expect(aceticCarbonate(1).acetate).toBe(2);
    expect(aceticCarbonate(0.5).acid + 2 * aceticCarbonate(0.5).extent).toBe(2);
    expect(esterDirector(3, 1).preparation).toBe(0.55);
    expect(esterDirector(4, 1).preparation).toBe(1);
    expect(esterDirector(6, 0).hydrolysis).toBe(0);
  });
});
