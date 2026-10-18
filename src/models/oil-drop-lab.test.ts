import { describe, it, expect } from 'vitest';
import {
  oilDropPhysics,
  oilForces,
  oilStep,
  oilTrajectory,
  inferOilRadius,
  inferOilCharge,
  oilFallObservation,
  oilChanges,
  oilLatticeFit,
  oilLatticeResiduals,
  oilDirector,
} from './oil-drop-lab';
import {
  OIL_HISTORICAL_FALL_SECONDS as FALL,
  OIL_HISTORICAL_RISE as RISE,
} from './oil-drop-lab-records';
describe('oil drop forward and inverse SI model', () => {
  it('matches an independent scalar benchmark without imposing integer charge', () => {
    const p = oilDropPhysics();
    expect(p.weight).toBeCloseTo(1.80494527587987e-14, 25);
    expect(p.drag).toBeCloseTo(2.4786739461577e-10, 21);
    expect(p.fallSpeed).toBeCloseTo(7.28189876960023e-5, 14);
    expect(p.balanceVoltage).toBeCloseTo(141.011349678115, 9);
    expect(p.tau).toBeCloseTo(7.4411082e-6, 12);
    expect(oilFallObservation().seconds).toBeCloseTo(6.866340989, 8);
  });
  it('infers radius and charge from independent speed and balance inputs; zero field cannot weigh charge', () => {
    for (const radius of [0.3e-6, 0.8e-6, 1.5e-6])
      for (const chargeMagnitude of [3.1e-19, 6.4e-19, 1.21e-18]) {
        const p = oilDropPhysics({ radius, chargeMagnitude });
        if (p.balanceVoltage! <= 600) {
          const inv = inferOilCharge(p.fallSpeed, p.balanceVoltage!);
          expect(inv.radius).toBeCloseTo(radius, 16);
          expect(inv.chargeMagnitude! / chargeMagnitude).toBeCloseTo(1, 10);
        }
      }
    expect(inferOilRadius(0)).toBe(0);
    expect(inferOilCharge(0.0001, 0).chargeMagnitude).toBeNull();
    expect(oilDropPhysics({ chargeMagnitude: 0 }).balanceVoltage).toBeNull();
  });
  it('demonstrates the slip boundary rather than using the no-slip radius silently', () => {
    const v = oilDropPhysics().fallSpeed,
      correct = inferOilRadius(v),
      wrong = inferOilRadius(v, { slipB: 0 });
    expect(correct).toBeCloseTo(0.8e-6, 17);
    expect(wrong / correct).toBeCloseTo(1.04936153675, 9);
  });
  it('preserves displacement and velocity under subdividing an interval, and uses the voltage history', () => {
    const a = { y: 0, v: 0.00007 },
      s = oilStep(a, 0.7, 130),
      s2 = oilStep(oilStep(a, 0.2, 130), 0.5, 130);
    expect(s.y).toBeCloseTo(s2.y, 17);
    expect(s.v).toBeCloseTo(s2.v, 17);
    const seq = oilTrajectory(3, [
      { at: 0, voltage: 0 },
      { at: 1, voltage: 200 },
    ]);
    const manual = oilStep(oilStep({ y: -0.00025, v: 0 }, 1, 0), 2, 200);
    expect(seq.y).toBeCloseTo(manual.y, 17);
    expect(Math.abs(seq.y - oilStep({ y: -0.00025, v: 0 }, 3, 200).y)).toBeGreaterThan(0.00009);
  });
  it('has continuous velocity at switching and reaches the new sign only through its finite transient', () => {
    const p = oilDropPhysics(),
      s = oilStep({ y: 0, v: p.fallSpeed }, 0, p.balanceVoltage! * 2),
      tiny = oilStep(s, p.tau / 10, p.balanceVoltage! * 2);
    expect(s.v).toBe(p.fallSpeed);
    expect(tiny.v).toBeGreaterThan(0);
    expect(oilStep(s, 10 * p.tau, p.balanceVoltage! * 2).v).toBeLessThan(0);
  });
  it('balances only with correct polarity; twice the charge needs half the voltage', () => {
    const p = oilDropPhysics(),
      u = p.balanceVoltage!;
    expect(Math.abs(oilForces(u, 0).net)).toBeLessThan(1e-28);
    expect(oilForces(-u, 0).net).toBeGreaterThan(p.weight);
    expect(oilDropPhysics({ chargeMagnitude: p.chargeMagnitude * 2 }).balanceVoltage).toBeCloseTo(
      u / 2,
      10,
    );
    expect(oilForces(u, p.fallSpeed).viscous).toBeLessThan(0);
    expect(oilForces(u, -p.fallSpeed).viscous).toBeGreaterThan(0);
  });
  it('stops at actual plate contact, adds support and detaches on reversed force', () => {
    const p = oilDropPhysics(),
      s = oilTrajectory(120, [{ at: 0, voltage: -600 }]);
    expect(s.contact).toBe('bottom');
    expect(s.y).toBeCloseTo(p.gap / 2 - p.radius, 15);
    expect(s.v).toBe(0);
    expect(s.forces.net).toBe(0);
    expect(s.forces.support).toBeLessThan(0);
    const detached = oilStep(s, 1, 600);
    expect(detached.contact).toBeNull();
    expect(detached.y).toBeLessThan(s.y);
  });
  it('retains high terminal velocities across interval subdivision in the full accepted parameter domain', () => {
    const input = {
      radius: 0.2e-6,
      chargeMagnitude: 3e-18,
      gap: 0.02,
      viscosity: 1e-6,
      pressure: 10000,
      slipB: 0.02,
    };
    const p = oilDropPhysics(input),
      initial = { y: 0, v: 0 };
    const whole = oilStep(initial, 0.0002, 600, input),
      first = oilStep(initial, 0.0001, 600, input),
      split = oilStep(first, 0.0001, 600, input);
    expect(first.v).toBeLessThan(-0.1);
    expect(split.y).toBeCloseTo(whole.y, 17);
    expect(split.v).toBeCloseTo(whole.v, 14);
    expect(oilForces(600, whole.v, input).viscous).toBeCloseTo(-p.drag * whole.v, 25);
  });
  it('keeps bounded invalid/extreme inputs finite and has no crossed plate coordinates', () => {
    for (const x of [NaN, Infinity, -Infinity, -1, 0, 1, 1000]) {
      const p = oilDropPhysics({ radius: x, chargeMagnitude: x, pressure: x }),
        s = oilTrajectory(x, [{ at: 0, voltage: x }], p);
      for (const n of [p.weight, p.drag, p.tau, s.y, s.v, s.forces.net])
        expect(Number.isFinite(n)).toBe(true);
      expect(s.y).toBeGreaterThanOrEqual(-p.gap / 2 + p.radius);
      expect(s.y).toBeLessThanOrEqual(p.gap / 2 - p.radius);
    }
  });
});
describe('historical evidence remains distinct from fitted labels', () => {
  it('preserves original repeated readings, author corrected values, and no n input', () => {
    expect(RISE).toHaveLength(13);
    expect(RISE.flatMap((r) => r.rawSeconds)).toHaveLength(21);
    expect(FALL).toHaveLength(22);
    expect(FALL.reduce((a, b) => a + b, 0) / FALL.length).toBeCloseTo(11.8777272727, 9);
    expect(RISE[2]!.correctedInverseSeconds).not.toBeCloseTo(1 / RISE[2]!.rawSeconds[0]!, 6);
    for (const r of RISE) {
      expect(Object.isFrozen(r)).toBe(true);
      expect(Object.isFrozen(r.rawSeconds)).toBe(true);
      expect('n' in r).toBe(false);
    }
  });
  it('derives the common increment from first eight changes and predicts a separately held last record', () => {
    const json = JSON.stringify(RISE),
      changes = oilChanges(RISE.map((r) => r.correctedInverseSeconds)),
      fit = oilLatticeFit(changes.slice(0, 8).map((x) => x.magnitude));
    expect(fit.counts).toEqual([6, 7, 1, 3, 1, 5, 4, 3]);
    expect(fit.step).toBeCloseTo(0.005378095890410959, 14);
    const predicted = RISE[11]!.correctedInverseSeconds + 2 * fit.step;
    expect(predicted).toBeCloseTo(0.02360619178082192, 14);
    expect(RISE[12]!.correctedInverseSeconds - predicted).toBeCloseTo(0.00003380821917808, 14);
    expect(changes[10]!.magnitude).toBeCloseTo(0.03794, 12);
    expect(JSON.stringify(RISE)).toBe(json);
  });
  it('rejects double-step for odd jumps but does not falsely rule out a finer submultiple', () => {
    const xs = oilChanges(RISE.map((r) => r.correctedInverseSeconds))
        .slice(0, 8)
        .map((x) => x.magnitude),
      k = oilLatticeFit(xs).step;
    const sum = (a: ReturnType<typeof oilLatticeResiduals>) =>
      a.reduce((s, x) => s + x.residual * x.residual, 0);
    expect(sum(oilLatticeResiduals(xs, 2 * k))).toBeGreaterThan(
      sum(oilLatticeResiduals(xs, k)) * 100,
    );
    expect(sum(oilLatticeResiduals(xs, k / 2))).toBeCloseTo(sum(oilLatticeResiduals(xs, k)), 14);
  });
  it('holds the measured bilingual prediction until its spoken reveal and supports backwards seeking', () => {
    for (const [locale, before, after] of [
      ['zh', 57.8, 58.1],
      ['en', 59.4, 59.7],
    ] as const) {
      expect(oilDirector(2, before, locale).shot).toBe('held-out');
      expect(oilDirector(2, before, locale).reveal).toBe(false);
      expect(oilDirector(2, after, locale).reveal).toBe(true);
      expect(oilDirector(2, before, locale).reveal).toBe(false);
    }
    expect(oilDirector(0, 41, 'zh').shot).toBe('fall-inference');
    expect(oilDirector(0, 41, 'en').shot).toBe('radius-candidates');
  });
  it('holds the initial doubled-charge condition during the question, then advances one physical voltage history', () => {
    for (const [locale, question, rising, restored] of [
      ['zh', 41, 45, 51],
      ['en', 43, 46, 52],
    ] as const) {
      const initial = oilDirector(1, question, locale),
        old = oilDirector(1, rising, locale),
        half = oilDirector(1, restored, locale);
      expect(initial.shot).toBe('charge-prediction');
      expect(initial.physicalTime).toBe(0);
      expect(initial.reveal).toBe(false);
      expect(old.physicalTime).toBeGreaterThan(0);
      expect(old.physicalTime).toBeLessThan(3);
      expect(old.reveal).toBe(false);
      expect(half.physicalTime).toBeGreaterThan(3);
      expect(half.voltage).toBeCloseTo(old.voltage / 2, 10);
      const actual = oilTrajectory(
        half.physicalTime,
        [
          { at: 0, voltage: old.voltage },
          { at: 3, voltage: half.voltage },
        ],
        { chargeMagnitude: 1.28e-18 },
        { y: 0, v: 0 },
      );
      expect(Math.abs(actual.v)).toBeLessThan(1e-12);
      expect(Math.abs(actual.forces.net)).toBeLessThan(1e-28);
    }
  });
  it('makes the finer-step counterexample visible during its recorded sentence without changing historical inputs', () => {
    const records = JSON.stringify(RISE);
    for (const [locale, time, final] of [
      ['zh', 66, 73],
      ['en', 69, 78],
    ] as const) {
      const d = oilDirector(2, time, locale);
      expect(d.shot).toBe('lattice');
      expect(d.candidateScale).toBe(0.5);
      expect(oilDirector(2, final, locale).shot).toBe('held-out');
      expect(oilDirector(2, final, locale).reveal).toBe(true);
    }
    expect(JSON.stringify(RISE)).toBe(records);
  });
});
