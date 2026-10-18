import { it, expect } from 'vitest';
import {
  gibberellinEvidence,
  filtrateTracers,
  expectedRootCount,
  rootTrialCounts,
  rootTrialSummary,
  cuttingRootGeometry,
  ethyleneRipening,
} from './bio-plant-growth-regulators';
it('separates organism transfer from a soluble growth effect', () => {
  const f = gibberellinEvidence(1);
  expect(f.organismsInFiltrate).toBe(0);
  expect(f.shootLength).toBeGreaterThan(f.controlLength);
  expect(gibberellinEvidence(1, false).shootLength).toBe(f.controlLength);
});
it('routes persistent tracers through the funnel neck rather than through its wall', () => {
  for (let n = 0; n <= 100; n++)
    for (const m of filtrateTracers(n / 100)) {
      if (m.y <= 200) expect(Math.abs(m.x)).toBeLessThanOrEqual((200 - m.y) * 0.32 + 0.01);
      else expect(Math.abs(m.x)).toBeLessThanOrEqual(28.001);
    }
});
it('uses individual root observations for means and sample spread', () => {
  expect(expectedRootCount(1)).toBe(12);
  expect(rootTrialCounts(0)).toEqual([1, 3, 2]);
  const s = rootTrialSummary(
    [
      [2, 4, 6],
      [5, 5, 5],
    ],
    [0, 1],
  );
  expect(s.rows[0].mean).toBe(4);
  expect(s.rows[0].sd).toBe(2);
  expect(s.best).toEqual([1]);
  expect(expectedRootCount(10)).toBeLessThan(expectedRootCount(1));
});
it('shows roots attached at their cutting and preserves the observed count', () => {
  for (const n of [0, 1, 12, 30]) {
    const roots = cuttingRootGeometry(n, 1);
    expect(roots).toHaveLength(n);
    roots.forEach((r) => {
      expect(r.path.startsWith('M0 0Q')).toBe(true);
      expect(r.y).toBeGreaterThan(0);
    });
  }
  expect(cuttingRootGeometry(4, 0).every((r) => r.grown === 0)).toBe(true);
});
it('conserves released precursor and separates acidic storage from activation', () => {
  const acid = ethyleneRipening(1, true, 3),
    normal = ethyleneRipening(1, true, 6),
    control = ethyleneRipening(1, false, 6);
  expect(normal.totalPrecursor).toBeCloseTo(1, 12);
  expect(control.totalPrecursor).toBe(0);
  expect(normal.external).toBeGreaterThan(acid.external * 8);
  expect(normal.maturity).toBeGreaterThan(control.maturity);
  expect(ethyleneRipening(0).maturity).toBe(0.08);
  expect(normal.firmness).toBeLessThan(control.firmness);
});

it('does not turn missing field observations into zeros or invented values', () => {
  const s = rootTrialSummary(
    [
      [null, null, null],
      [1, null, 3],
    ],
    [0, 1],
  );
  expect(s.rows[0].mean).toBeNull();
  expect(s.rows[1].mean).toBe(2);
  expect(s.best).toEqual([1]);
});
