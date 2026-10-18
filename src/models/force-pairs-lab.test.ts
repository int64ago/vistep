import { describe, it, expect } from 'vitest';
import {
  pairedBalances,
  pairExperiment,
  balanceScaleOffset,
  pairFilmState,
} from './force-pairs-lab';
describe('connected force balances', () => {
  it('different stiffness produces unequal extensions but an equal opposite interaction', () => {
    const s = pairedBalances(0.5);
    expect(s.force).toBeCloseTo(4.8);
    expect(s.leftExtension).toBeCloseTo(0.06);
    expect(s.rightExtension).toBeCloseTo(0.04);
    expect(s.onLeft + s.onRight).toBe(0);
  });
  it('both material rods connect at the same joint', () => {
    for (const d of [0.4, 0.44, 0.5, 0.56]) {
      const s = pairedBalances(d, 0.03);
      expect(s.joint).toBeCloseTo(s.right - 0.2 - s.rightExtension, 12);
      expect(0.4 + s.leftExtension + s.rightExtension).toBeCloseTo(d, 12);
    }
  });
  it('translation does not change interaction forces', () => {
    const a = pairedBalances(0.51, 0),
      b = pairedBalances(0.51, 0.2);
    expect(a.force).toBe(b.force);
    expect(b.joint - a.joint).toBeCloseTo(0.2, 12);
  });
  it('one-fixed-end path actually keeps its left endpoint fixed', () => {
    for (const t of [0, 1, 2, 3, 4]) expect(pairExperiment(t).left).toBeCloseTo(-0.2, 12);
  });
  it('motion of both hands preserves matched signed recordings', () => {
    for (let t = 0; t < 5; t += 0.1) {
      const s = pairExperiment(t, true);
      expect(s.onLeft).toBe(-s.onRight);
    }
  });
  it('each calibrated tick and pointer uses the same physical extension', () => {
    for (const rightK of [80, 120, 160])
      for (const separation of [0.4, 0.46, 0.52]) {
        const s = pairedBalances(separation, 0, 80, rightK);
        expect(balanceScaleOffset(s.force, 80)).toBeCloseTo(s.leftExtension * 500, 12);
        expect(balanceScaleOffset(s.force, rightK)).toBeCloseTo(s.rightExtension * 500, 12);
        expect(balanceScaleOffset(s.force, rightK) / balanceScaleOffset(1, rightK)).toBeCloseTo(
          s.force,
          12,
        );
      }
    expect(balanceScaleOffset(6.4, 80)).toBe(40);
    expect(balanceScaleOffset(6.4, 160)).toBe(20);
    for (const bad of [NaN, Infinity, -Infinity])
      expect(() => balanceScaleOffset(bad, 80)).toThrow(RangeError);
    expect(() => balanceScaleOffset(1, 0)).toThrow(RangeError);
  });
  it('the narrated replacement changes extension while calibrated signed readings still agree', () => {
    for (const locale of ['en', 'zh'] as const) {
      const d = pairFilmState(1, 8, locale),
        s = pairExperiment(d.physicalTime, d.bothMoving, 80, d.rightStiffness);
      expect(s.leftExtension / s.rightExtension).toBeCloseTo(2, 12);
      expect(s.onLeft).toBe(-s.onRight);
      expect(pairFilmState(3, 8, locale).bothMoving).toBe(true);
    }
  });
});
