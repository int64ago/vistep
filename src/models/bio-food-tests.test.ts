import { describe, expect, it } from 'vitest';
import {
  assayEvidence,
  copperNetLedger,
  copperMapping,
  sugarGraph,
  graphFreeCenters,
  partitionStateAt,
  partitionFluxes,
  dyeFilmState,
  dyeTracer,
  coarseCopperBinding,
  peptideMotif,
  foodDirector,
} from './bio-food-tests';
describe('recorded-voice evidence windows', () => {
  it('shows the sugar structures and resulting test during their spoken claims', () => {
    // These chapter-second samples follow the independent bilingual word timings.
    // Ring opening is complete before the sucrose comparison; water mapping is
    // complete before any positive test is shown.
    expect(foodDirector(1, 9.5).shot).toBe('glucose');
    expect(foodDirector(1, 9.5).glucoseOpening).toBe(1);
    expect(foodDirector(1, 11).shot).toBe('sucrose');
    expect(foodDirector(1, 17).shot).toBe('hydrolysis');
    const ready = foodDirector(1, 20);
    expect(graphFreeCenters(sugarGraph('hydrolyzed', ready.hydrolysisProgress))).toEqual([
      'G1',
      'F2',
    ]);
    expect(ready.predictionProgress).toBe(0);
    expect(foodDirector(1, 21.5).shot).toBe('sugar-prediction');
    expect(foodDirector(1, 24.5).predictionProgress).toBe(1);
  });
  it('keeps causal evidence visible across both language versions and trailing silence', () => {
    expect(foodDirector(0, 7).shot).toBe('sugar-observation');
    expect(foodDirector(0, 9).shot).toBe('copper');
    expect(foodDirector(2, 4).shot).toBe('dye-affinity');
    expect(foodDirector(2, 8.5).shot).toBe('dye-exchange');
    expect(foodDirector(3, 22).rinseTime).toBeGreaterThan(2);
    expect(foodDirector(4, 7).shot).toBe('peptide');
    expect(foodDirector(4, 18).peptideProgress).toBe(1);
    for (const [seconds, index] of [
      [27.5, 0],
      [30, 1],
      [32, 2],
      [40.5, 2],
    ]) {
      expect(foodDirector(4, seconds, 'en').shot).toBe('three-causes');
      expect(foodDirector(4, seconds, 'en').causeIndex).toBe(index);
    }
  });
  it('changes the recap subject when each recorded language names it', () => {
    // Chinese names redistribution before English has finished naming the new solid.
    expect(foodDirector(4, 27).causeIndex).toBe(1);
    expect(foodDirector(4, 27, 'en').causeIndex).toBe(0);
    expect(foodDirector(4, 29).causeIndex).toBe(2);
    expect(foodDirector(4, 30, 'en').causeIndex).toBe(1);
    expect(foodDirector(4, 32, 'en').causeIndex).toBe(2);
    for (const locale of ['zh', 'en'] as const) {
      expect(foodDirector(4, 17, locale).peptideProgress).toBe(1);
      expect(foodDirector(4, 41, locale).causeIndex).toBe(2);
    }
  });
  it('maps continuous observation time without negative, invalid or unbounded model inputs', () => {
    for (let chapter = 0; chapter < 5; chapter++)
      for (const time of [-10, NaN, 0, 7.8, 19.8, 20, 25, 41, 1e6]) {
        const d = foodDirector(chapter, time);
        for (const key of [
          'copperProgress',
          'observationProgress',
          'glucoseOpening',
          'hydrolysisProgress',
          'predictionProgress',
          'peptideProgress',
        ] as const) {
          expect(d[key]).toBeGreaterThanOrEqual(0);
          expect(d[key]).toBeLessThanOrEqual(1);
        }
        expect(d.dyeTime).toBeGreaterThanOrEqual(0);
        expect(d.dyeTime).toBeLessThanOrEqual(18);
        expect(d.rinseTime).toBeGreaterThanOrEqual(0);
        expect(d.rinseTime).toBeLessThanOrEqual(18);
      }
    expect(foodDirector(3, 20 - 1e-5).rinseTime).toBeCloseTo(
      foodDirector(3, 20 + 1e-5).rinseTime,
      8,
    );
  });
});
describe('chemical evidence, not food-name color switches', () => {
  it('keeps reducing activity separate from sugar presence and invalid controls', () => {
    expect(assayEvidence('sucrose')).toEqual({
      reducing: false,
      result: 'negative',
      sugarPresent: true,
    });
    expect(assayEvidence('fructose').result).toBe('positive');
    expect(assayEvidence('hydrolyzed', true, 0).result).toBe('negative');
    expect(assayEvidence('hydrolyzed', true, 1).result).toBe('positive');
    expect(assayEvidence('glucose', false).result).toBe('inconclusive');
  });
  it('conserves copper and balances its net oxidation-state change without a sugar yield', () => {
    for (let p = 0; p <= 1.001; p += 0.01) {
      const a = copperNetLedger(p);
      expect(a.reagentCopperII + a.solidCopperI).toBe(a.totalCopper);
      expect(a.solidCopperI).toBe(2 * a.oxideOxygen);
      expect(a.netElectronsAccepted).toBe(a.solidCopperI);
    }
  });
  it('preserves all mapped sugar/water atoms across net hydrolysis and frees both centers', () => {
    const a = sugarGraph('hydrolyzed', 0),
      b = sugarGraph('hydrolyzed', 1);
    expect(a.atoms.map((x) => x.id)).toEqual(b.atoms.map((x) => x.id));
    expect(graphFreeCenters(a)).toHaveLength(0);
    expect(graphFreeCenters(b)).toEqual(['G1', 'F2']);
    expect(b.bonds).toContainEqual({ a: 'F2', b: 'waterO', role: 'hydrolysis' });
    expect(b.bonds).toContainEqual({ a: 'bridgeO', b: 'waterH1' });
    expect(b.atoms.filter((x) => x.element === 'C')).toHaveLength(12);
  });
  it('opens the glucose ring without losing carbon or either tracked oxygen', () => {
    const cyclic = sugarGraph('glucose'),
      open = sugarGraph('glucose', 0, 1);
    expect(cyclic.atoms.map((a) => a.id)).toEqual(open.atoms.map((a) => a.id));
    expect(open.bonds.some((b) => b.a === 'GO5' && b.b === 'G1')).toBe(false);
    expect(open.bonds.find((b) => b.b === 'freeO')?.order).toBe(2);
    expect(open.atoms.find((a) => a.id === 'GO5')?.label).toBe('OH');
  });
  it('maps copper continuously into endpoint geometry', () => {
    for (let id = 0; id < 12; id++)
      for (let p = 0; p < 1; p += 0.001) {
        const a = copperMapping(id, p).point,
          b = copperMapping(id, p + 0.001).point;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(2);
      }
  });
});
describe('reversible partition and open rinse', () => {
  it('reaches independently derived equilibrium and retains opposing fluxes', () => {
    const s = partitionStateAt(100),
      f = partitionFluxes(s);
    expect(s.bath).toBeCloseTo(20, 7);
    expect(s.lipid).toBeCloseTo(40, 7);
    expect(f.into).toBeGreaterThan(0);
    expect(f.into).toBeCloseTo(f.out, 7);
  });
  it('treats K as a concentration ratio, including unequal volumes and zero lipid', () => {
    const s = partitionStateAt(100, undefined, { K: 1 });
    expect(s.bath / 4).toBeCloseTo(s.lipid, 7);
    const zero = partitionStateAt(5, undefined, { Vl: 0, q: 1 });
    expect(zero.lipid).toBe(0);
    expect(zero.bath + zero.collected).toBeCloseTo(60, 9);
  });
  it('improves short-rinse contrast but can lose stain in long rinsing, conserving total dye', () => {
    const initial = { bath: 20, lipid: 40, collected: 0 },
      short = partitionStateAt(2, initial, { q: 1 }),
      long = partitionStateAt(150, initial, { q: 1 });
    expect(short.lipid - short.bath / 4).toBeGreaterThan(35);
    expect(short.lipid).toBeLessThan(40);
    expect(long.lipid).toBeLessThan(0.1);
    for (const s of [short, long]) expect(s.bath + s.lipid + s.collected).toBeCloseTo(60, 8);
  });
  it('directly seeking rinse begins at the stain endpoint', () =>
    expect(dyeFilmState(0, true)).toEqual(dyeFilmState(18)));
  it('tracer populations converge to the independently solved compartment amounts', () => {
    const n = 12000;
    for (const [time, rinse] of [
      [8, false],
      [18, false],
      [4, true],
      [18, true],
    ] as const) {
      const counts = { bath: 0, lipid: 0, collected: 0 };
      for (let i = 0; i < n; i++) counts[dyeTracer(i, time, rinse).phase]++;
      const expected = dyeFilmState(time, rinse);
      for (const key of ['bath', 'lipid', 'collected'] as const)
        expect(Math.abs(counts[key] / n - expected[key] / 60)).toBeLessThan(0.025);
    }
  });
  it('tracer identities and history are deterministic', () => {
    for (let i = 0; i < 36; i++) {
      expect(dyeTracer(i, 6, true)).toEqual(dyeTracer(i, 6, true));
      expect(dyeTracer(i, 18)).toEqual(dyeTracer(i, 0, true));
    }
  });
});
describe('a bounded representative copper-binding model', () => {
  it('preserves divalent copper and limiting amounts', () => {
    for (const m of [0, 0.1, 1, 10])
      for (const s of [0, 0.1, 1, 100]) {
        const r = coarseCopperBinding(m, s);
        expect(r.bound + r.free).toBeCloseTo(m, 12);
        expect(r.bound).toBeLessThanOrEqual(Math.min(m, s));
        expect(r.oxidationState).toBe(2);
      }
  });
  it('derives continuous donor/chain positions at every binding stage', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const m = peptideMotif(p);
      expect(m.donors).toHaveLength(4);
      expect(m.carbons).toHaveLength(6);
      expect(m.oxygens).toHaveLength(3);
      expect(m.oxidationState).toBe(2);
      for (let i = 0; i < m.donors.length; i++)
        for (let j = i + 1; j < m.donors.length; j++)
          expect(
            Math.hypot(m.donors[i].x - m.donors[j].x, m.donors[i].y - m.donors[j].y),
          ).toBeGreaterThan(79.9);
      expect(m.donors.every((a) => Number.isFinite(a.x + a.y))).toBe(true);
    }
  });
});
