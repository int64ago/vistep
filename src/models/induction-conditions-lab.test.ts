import { describe, it, expect } from 'vitest';
import { rodInduction, coilInduction, coilCoupling } from './induction-conditions-lab';
describe('induction conditions', () => {
  it('stationary and parallel translation retain flux and produce no emf', () => {
    for (const p of ['still', 'along-field'] as const) {
      const a = rodInduction(p, 3),
        b = rodInduction(p, 7);
      expect(a.emf).toBe(0);
      expect(a.flux).toBe(b.flux);
    }
    expect(rodInduction('along-field', 3).vz).not.toBe(0);
  });
  it('cutting agrees with flux finite difference, return reverses and power balances', () => {
    const s = rodInduction('cutting', 3),
      dt = 1e-5;
    expect(s.emf).toBeCloseTo(
      -(rodInduction('cutting', 3 + dt).flux - rodInduction('cutting', 3 - dt).flux) / (2 * dt),
      10,
    );
    expect(rodInduction('cutting', 7).current).toBeCloseTo(-s.current, 12);
    expect(Math.abs(s.current * s.field * s.length * s.vx)).toBeCloseTo(
      s.current * s.current * s.resistance,
      12,
    );
  });
  it('mutual coupling is even with an odd derivative and decreases outside', () => {
    expect(coilCoupling(0.08).mutual).toBeCloseTo(coilCoupling(-0.08).mutual, 12);
    expect(coilCoupling(0.08).derivative).toBeCloseTo(-coilCoupling(-0.08).derivative, 12);
    expect(coilCoupling(0.13).mutual).toBeLessThan(coilCoupling(0).mutual / 5);
  });
  it('current changes induce opposite pulses; steady primary current gives zero', () => {
    expect(coilInduction('close', 2.5).current).toBeCloseTo(
      -coilInduction('open', 2.5).current,
      12,
    );
    expect(coilInduction('close', 4).primary).toBe(1);
    expect(coilInduction('close', 4).current).toBe(0);
    expect(coilInduction('rheostat', 4).current).toBe(0);
  });
  it('all coil paths agree with negative flux-linkage derivative', () => {
    for (const p of ['close', 'open', 'rheostat', 'insert'] as const) {
      const t = 2.5,
        h = 1e-5,
        s = coilInduction(p, t);
      expect(s.emf).toBeCloseTo(
        -(coilInduction(p, t + h).fluxLinkage - coilInduction(p, t - h).fluxLinkage) / (2 * h),
        9,
      );
    }
  });
  it('insertion changes flux at constant primary current; faster change increases emf', () => {
    const s = coilInduction('insert', 2.5);
    expect(s.dPrimary).toBe(0);
    expect(s.current).not.toBe(0);
    expect(coilInduction('insert', 1.25, 2).emf).toBeCloseTo(2 * s.emf, 12);
    expect(coilInduction('insert', 6.5).current).toBeCloseTo(-s.current, 12);
  });
});
