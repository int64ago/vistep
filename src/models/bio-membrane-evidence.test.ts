import { describe, it, expect } from 'vitest';
import {
  passivePartitionBarrier,
  partitionCrossing,
  areaObservations,
  areaHypothesis,
  areaRectangle,
  foldingLipids,
  interfaceEvidence,
  electronContrast,
  contrastSamples,
  membraneTracer,
  historicalSnapshot,
  membraneGeometry,
  membraneDirector,
  membraneDurations,
} from './bio-membrane-evidence';
describe('independent membrane evidence', () => {
  it('conserves finite pools and derives both directional fluxes from P=DK/h', () => {
    for (const t of [0, 1, 10, 100, 10000]) {
      const s = passivePartitionBarrier(t, 4);
      expect(s.inside + s.outside).toBeCloseTo(1);
      expect(s.net).toBeCloseTo(s.forward - s.reverse);
      expect(s.inside).toBeLessThanOrEqual(0.5);
    }
    const e = passivePartitionBarrier(10000, 4);
    expect(e.forward).toBeGreaterThan(0);
    expect(e.forward).toBeCloseTo(e.reverse);
    expect(passivePartitionBarrier(30, 4, 0).inside).toBe(0);
    expect(passivePartitionBarrier(0, 4).net / passivePartitionBarrier(0, 1).net).toBeCloseTo(4);
  });
  it('keeps the conditional crossing path continuous across both interfaces', () => {
    expect(partitionCrossing(0).x).toBe(78);
    expect(partitionCrossing(1).x).toBe(282);
    expect(partitionCrossing(0, true).x).toBe(282);
    expect(partitionCrossing(1, true).x).toBe(78);
    let old = partitionCrossing(0).x;
    for (let p = 0.01; p < 1; p += 0.01) {
      const x = partitionCrossing(p).x;
      expect(x - old).toBeGreaterThan(0);
      expect(x - old).toBeLessThan(4);
      old = x;
    }
  });
  it('keeps the observed data independent of competing layer assumptions', () => {
    expect(areaObservations[0].spreadArea / areaObservations[0].cellArea).toBeCloseTo(1.9574468);
    expect(areaObservations[1].spreadArea / areaObservations[1].cellArea).toBeCloseTo(1.893617);
    expect(areaHypothesis(1).observedB).toBe(areaHypothesis(2, 0.5).observedB);
    expect(areaHypothesis(1).predictedArea).toBe(areaHypothesis(2, 0.5).predictedArea);
    expect(areaHypothesis(2, 0.7).predictedRatio).toBeLessThan(areaHypothesis(2).predictedRatio);
    expect(areaHypothesis(2, 1, 1, 0.8).predictedRatio).toBeGreaterThan(2);
  });
  it('keeps predicted area and observed-area ratio consistent when correcting an area estimate', () => {
    const q = areaHypothesis(2, 1, 1, 2);
    expect(q.observedA).toBe(0.47);
    expect(q.observedB).toBe(0.92);
    expect(q.predictedArea / q.observedA).toBeCloseTo(q.predictedRatio);
    expect(q.predictedArea).toBeCloseTo(0.47);
    const stop = 18.9;
    expect(membraneTracer(3, stop, 0.18, true, 48, stop).angle).toBeCloseTo(
      membraneTracer(3, stop).angle,
    );
    expect(membraneTracer(3, 30, 0.18, true, 48, stop).angle).toBeCloseTo(
      membraneTracer(3, stop).angle,
    );
  });
  it('compares actual two-dimensional areas with identical rectangle widths', () => {
    const a = areaRectangle(0.47),
      b = areaRectangle(0.92);
    expect(a.width).toBe(b.width);
    expect(b.area / a.area).toBeCloseTo(0.92 / 0.47);
  });
  it('preserves every lipid identity and rigid tail throughout the fold', () => {
    for (let p = 0; p <= 1; p += 0.05) {
      const qs = foldingLipids(p);
      expect(new Set(qs.map((q) => q.id)).size).toBe(40);
      for (const q of qs)
        for (const tail of q.tails)
          expect(Math.hypot(tail.x - q.x, tail.y - q.y)).toBeCloseTo(Math.hypot(q.tailLength, 2.2));
    }
    expect(new Set(foldingLipids(0).map((q) => q.x)).size).toBe(40);
    expect(new Set(foldingLipids(1).map((q) => q.x)).size).toBe(20);
    for (const q of foldingLipids(0)) expect(q.tails.every((t) => t.y < q.y)).toBe(true);
    for (const q of foldingLipids(1))
      expect(q.tails.every((t) => t.y >= 120 && t.y <= 166)).toBe(true);
  });
  it('computes force balance on the same spherical interface', () => {
    for (const c of [0, 0.5, 1]) {
      const s = interfaceEvidence(c, 2);
      expect(s.pressureForce).toBeCloseTo(s.tensionForce);
    }
    expect(interfaceEvidence(0.8, 2).pressure).toBeCloseTo(interfaceEvidence(0.8, 1).pressure / 2);
    expect(interfaceEvidence(1).gamma).toBeLessThan(interfaceEvidence(0).gamma);
  });
  it('broadens a normalized contrast response without inventing chemical identity', () => {
    const integral = (s: number) =>
      contrastSamples(s, 4001).reduce((sum, q) => sum + (q.intensity - 0.05) * 0.004, 0);
    expect(integral(0.4)).toBeCloseTo(1.4, 3);
    expect(integral(1.3)).toBeCloseTo(1.4, 3);
    expect(electronContrast(2, 0.4)).toBeGreaterThan(electronContrast(2, 1.3));
    expect(electronContrast(-2, 0.4)).toBeCloseTo(electronContrast(2, 0.4));
  });
  it('separates historical time-sampled distributions from modeled trajectories', () => {
    const a = historicalSnapshot(5),
      b = historicalSnapshot(40);
    expect(a.every((x) => b.every((y) => x.id !== y.id))).toBe(true);
    expect(a.filter((q) => q.origin === 'mouse')).toHaveLength(16);
    expect(b.filter((q) => q.origin === 'mouse')).toHaveLength(16);
  });
  it('keeps stable origins on a one-dimensional path and reconstructs random seeks', () => {
    for (let id = 0; id < 48; id++) {
      const q = membraneTracer(id, 23);
      expect(q.x * q.x + q.y * q.y).toBeCloseTo(1);
      expect(q).toEqual(membraneTracer(id, 23));
      expect(q.origin).toBe(id < 24 ? 'mouse' : 'human');
      expect(membraneTracer(id, 23, 0).angle).toBe(membraneTracer(id, 0).angle);
      expect(membraneTracer(id, 23, 0.18, true).angle).toBe(membraneTracer(id, 0).angle);
    }
  });
  it('matches independently known first angular Fourier decay in a population', () => {
    const N = 5000,
      D = 0.18,
      t = 4;
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const q = membraneTracer(i, t, D, false, N),
        base = membraneTracer(i, 0, D, false, N);
      sum += Math.cos(q.angle - base.angle);
    }
    expect(Math.abs(sum / N - Math.exp(-D * t))).toBeLessThan(0.025);
  });
  it('detects wrong water contact while preserving lipid count and protein environment', () => {
    const good = membraneGeometry(0, 0),
      bad = membraneGeometry(0, 1);
    expect(good.lipids).toHaveLength(40);
    expect(bad.lipids).toHaveLength(40);
    expect(good.exposedTails).toBe(0);
    expect(bad.exposedTails).toBe(80);
    expect(good.protein.waistTop).toBe(good.waterUpper);
    expect(good.protein.waistBottom).toBe(good.waterLower);
    expect(good.glycan.endY).toBeLessThan(good.waterUpper);
  });
  it('waits for the spoken hypothesis and folding cues in each language', () => {
    expect(membraneDirector(1, 12, 'zh').shot).toBe(1);
    expect(membraneDirector(1, 14, 'en').shot).toBe(1);
    expect(membraneDirector(1, 22, 'zh').shot).toBe(3);
    expect(membraneDirector(1, 22, 'en').shot).toBe(2);
    expect(membraneDirector(1, 27, 'zh').sceneTime).toBeGreaterThan(27.5);
    expect(membraneDirector(1, 29, 'en').sceneTime).toBeGreaterThan(27.5);
    expect(membraneDirector(1, 31, 'zh').shot).toBe(5);
    expect(membraneDirector(1, 31, 'en').shot).toBe(4);
    expect(membraneDirector(1, 34, 'en').shot).toBe(5);
    expect(membraneDurations.reduce((sum, x) => sum + x, 0)).toBe(225);
  });
  it('shows imaging blur before historical interpretation, without assigning chemicals to darkness', () => {
    expect(membraneDirector(3, 13, 'zh').shot).toBe(2);
    expect(membraneDirector(3, 11, 'en').shot).toBe(2);
    expect(membraneDirector(3, 18, 'zh').shot).toBe(1);
    expect(membraneDirector(3, 16, 'en').shot).toBe(1);
  });
  it('keeps the material orientation counterexample aligned with both recordings', () => {
    for (const [locale, correct, wrong, behavior] of [
      ['zh', 8, 12, 15],
      ['en', 6, 11, 14],
    ] as const) {
      expect(membraneDirector(6, correct, locale).shot).toBe(1);
      expect(membraneDirector(6, correct, locale).buildFlip).toBe(0);
      expect(membraneDirector(6, wrong, locale).shot).toBe(0);
      expect(membraneDirector(6, wrong, locale).buildFlip).toBe(1);
      expect(membraneDirector(6, behavior, locale).shot).toBe(2);
      let prior = membraneDirector(6, 0, locale).buildFlip;
      for (let t = 0.01; t <= 32; t += 0.01) {
        const next = membraneDirector(6, t, locale).buildFlip;
        expect(Math.abs(next - prior)).toBeLessThan(0.012);
        prior = next;
      }
    }
  });
  it('reconstructs every chapter subshot without accumulated animation state', () => {
    expect(membraneDirector(1, 0).shot).toBe(0);
    expect(membraneDirector(1, 20).shot).toBe(2);
    expect(membraneDirector(4, 15).shot).toBe(2);
    expect(membraneDirector(6, 30).shot).toBe(3);
  });
});
