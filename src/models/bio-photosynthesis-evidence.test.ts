import { it, expect } from 'vitest';
import {
  engelmannBacteria,
  oxygenSource,
  hillReaction,
  oxygenIsotope,
  photophosphorylation,
  carbonTracer,
  photosynthesisCoupling,
  leafDiscs,
} from './bio-photosynthesis-evidence';
it('preserves bacterial identities outside the algal cells and responds to illumination', () => {
  const b = engelmannBacteria(1, 'spot', 0.4);
  expect(new Set(b.map((x) => x.id)).size).toBe(60);
  expect(b.every((x) => x.y < 105 || x.y > 155)).toBe(true);
  expect(b.filter((x) => Math.abs((x.x - 30) / 300 - 0.4) < 0.12).length).toBeGreaterThan(35);
  expect(oxygenSource(0.14, 'spectrum')).toBeGreaterThan(oxygenSource(0.5, 'spectrum'));
  expect(engelmannBacteria(1, 'dark')).toEqual(engelmannBacteria(0, 'dark'));
});
it('separates oxygen source from carbon dioxide and ATP from inevitable oxygen evolution', () => {
  expect(hillReaction(1, false).oxygen).toBe(0);
  expect(hillReaction(1, true, false).oxygen).toBe(0);
  expect(hillReaction(1).reducedAcceptor).toBe(4);
  expect(oxygenIsotope(false, true).oxygenAtoms.every((a) => a.mass === 16)).toBe(true);
  expect(oxygenIsotope(true, false).oxygenAtoms.every((a) => a.mass === 18)).toBe(true);
  expect(photophosphorylation(1, true, true, true, true)).toMatchObject({ atp: 1, oxygen: 0 });
  expect(photophosphorylation(1, true, false).atp).toBe(0);
});
it('conserves tracer and couples carbon reduction to finite energy stores', () => {
  for (const p of [0, 0.2, 0.7, 1]) {
    const s = carbonTracer(p);
    expect(s.co2 + s.c3 + s.sugar).toBeCloseTo(1);
  }
  const before = photosynthesisCoupling(5, 5),
    after = photosynthesisCoupling(7, 5);
  expect(after.triose).toBeGreaterThan(before.triose);
  expect(after.atp).toBeLessThan(before.atp);
  expect(photosynthesisCoupling(10, 0).triose).toBe(0);
  expect(photosynthesisCoupling(10, Infinity, false).triose).toBe(0);
});
it('uses matched leaf identities and reveals infiltration and net-oxygen confounders', () => {
  expect(leafDiscs(10, 1).floating).toBeGreaterThan(leafDiscs(10, 0.1).floating);
  expect(leafDiscs(10, 0).floating).toBe(0);
  expect(leafDiscs(0, 0, false).floating).toBe(10);
  expect(leafDiscs(10, 1, true, 0).floating).toBe(0);
  expect(leafDiscs(5, 1).discs.map((x) => x.threshold)).toEqual(
    leafDiscs(5, 0.1).discs.map((x) => x.threshold),
  );
});
