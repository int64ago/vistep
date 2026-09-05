import { describe, expect, it } from 'vitest';
import {
  ELECTRIC_TRANSFORMER as C,
  electricAC,
  electricDC,
  electricDefaults,
  electricFluxPoint,
  electricInstant,
  electricShot,
  electricWindingPoint,
} from './transformer-electric';

describe('electrical transformer: Faraday, circuit and energy', () => {
  it('matches a 24:12, 4 V RMS, 12 Ω textbook ideal load', () => {
    const a = electricAC({ ...electricDefaults, connected: true, ideal: true });
    expect(a.secondaryVoltageRms).toBeCloseTo(2, 12);
    expect(a.secondaryRms).toBeCloseTo(1 / 6, 12);
    expect(a.primaryRms).toBeCloseTo(1 / 12, 12);
    expect(a.outputWatts).toBeCloseTo(1 / 3, 12);
    expect(a.inputWatts).toBeCloseTo(a.outputWatts, 12);
    expect(a.bPeak).toBeCloseTo((4 * Math.SQRT2) / (2 * Math.PI * 50 * 24 * 8e-4), 12);
  });
  it('satisfies signed Faraday law by independently differentiating flux', () => {
    for (const losses of [false, true]) {
      const a = electricAC({ ...electricDefaults, connected: true, losses });
      for (let phase = 0; phase < 2 * Math.PI; phase += 0.13) {
        const s = electricInstant(a, phase),
          dt = 1e-7;
        const derivative =
          (electricInstant(a, phase + a.omega * dt).flux -
            electricInstant(a, phase - a.omega * dt).flux) /
          (2 * dt);
        expect(s.e2).toBeCloseTo(-12 * derivative, 7);
        expect(s.e1).toBeCloseTo(-24 * derivative, 7);
        expect(s.v2 + s.i2 * a.rs).toBeCloseTo(-s.e2, 12);
        expect(s.v1 - s.i1 * a.rp).toBeCloseTo(-s.e1, 12);
      }
    }
  });
  it('has zero induced voltage at a flux extremum, maximum at zero flux', () => {
    const a = electricAC(electricDefaults),
      peak = electricInstant(a, Math.PI / 2),
      zero = electricInstant(a, 0);
    expect(peak.flux).toBeCloseTo(a.fluxPeak, 12);
    expect(peak.v2).toBeCloseTo(0, 12);
    expect(zero.flux).toBeCloseTo(0, 12);
    expect(zero.v2).toBeCloseTo(Math.SQRT2 * a.secondaryVoltageRms, 12);
  });
  it('balances instantaneous field storage as well as cycle-average power', () => {
    for (const losses of [false, true])
      for (const connected of [false, true]) {
        const a = electricAC({ ...electricDefaults, connected, losses });
        let averaged = 0;
        for (let i = 0; i < 720; i++) {
          const phase = (i * 2 * Math.PI) / 720,
            s = electricInstant(a, phase);
          expect(s.inputPower).toBeCloseTo(
            s.outputPower + s.copperPower + s.corePower + s.fieldPower,
            12,
          );
          const h = 1e-7;
          const derivative =
            (electricInstant(a, phase + a.omega * h).fieldEnergy -
              electricInstant(a, phase - a.omega * h).fieldEnergy) /
            (2 * h);
          expect(derivative).toBeCloseTo(s.fieldPower, 7);
          averaged += s.inputPower / 720;
        }
        expect(averaged).toBeCloseTo(a.inputWatts, 10);
        expect(a.inputWatts).toBeCloseTo(a.outputWatts + a.copperWatts + a.coreWatts, 12);
      }
  });
  it('reflects load MMF with the opposite sign and keeps no-load excitation', () => {
    const no = electricAC(electricDefaults),
      yes = electricAC({ ...electricDefaults, connected: true });
    expect(no.secondaryRms).toBe(0);
    expect(no.primaryRms).toBeGreaterThan(0);
    expect(no.inputWatts).toBe(0);
    for (const phase of [0, 0.4, 1.1, 2.9]) {
      const s = electricInstant(yes, phase);
      expect(24 * s.primaryLoad - 12 * s.i2).toBeCloseTo(0, 12);
      expect(24 * s.i1 - 12 * s.i2).toBeCloseTo(24 * s.im, 12);
    }
    expect(no.fluxPeak).toBe(yes.fluxPeak);
  });
  it('DC builds a static field but cannot sustain secondary voltage', () => {
    const tau = C.magnetizingInductance / C.dcSeriesResistance;
    expect(electricDC(-tau).v2).toBe(0);
    expect(electricDC(0).i1).toBe(0);
    expect(electricDC(0).v2).toBe(2);
    expect(electricDC(tau).i1).toBeCloseTo((4 / 128) * (1 - Math.exp(-1)), 12);
    const final = electricDC(40 * tau);
    expect(final.flux).toBeGreaterThan(0);
    expect(final.v2).toBeLessThan(1e-15);
    expect(final.b).toBeLessThan(C.linearLimitTesla);
    for (let j = 0; j < 50; j++) {
      const s = electricDC((j / 10) * tau);
      expect(s.inputPower).toBeCloseTo(s.copperPower + s.fieldPower, 12);
    }
  });
  it('accounts for loss with an open load and valid limits', () => {
    const no = electricAC({ ...electricDefaults, losses: true });
    expect(no.coreWatts).toBeGreaterThan(0);
    expect(no.outputWatts).toBe(0);
    for (const n of [12, 24, 48])
      for (const f of [40, 50, 100])
        for (const load of [4, 12, 192]) {
          const a = electricAC({
            ...electricDefaults,
            secondaryTurns: n,
            frequency: f,
            loadOhms: load,
            losses: true,
            connected: true,
          });
          expect(a.validLinear).toBe(true);
          expect(a.efficiency).toBeGreaterThan(0);
          expect(a.efficiency).toBeLessThan(1);
          expect(a.inputWatts).toBeCloseTo(a.outputWatts + a.copperWatts + a.coreWatts, 10);
        }
    expect(electricAC({ ...electricDefaults, frequency: 5 }).validLinear).toBe(false);
    expect(electricAC({ ...electricDefaults, voltageRms: 0 }).efficiency).toBeNull();
    for (const change of [
      { frequency: 0 },
      { loadOhms: 0 },
      { secondaryTurns: 1.5 },
      { voltageRms: NaN },
    ])
      expect(() => electricAC({ ...electricDefaults, ...change })).toThrow(RangeError);
  });
});

describe('transformer geometry and deterministic direction', () => {
  it('closes the flux path continuously inside all four iron limbs', () => {
    const g = C.geometry;
    expect(electricFluxPoint(0)).toEqual(electricFluxPoint(1));
    for (let i = 0; i < 2000; i++) {
      const p = electricFluxPoint(i / 2000),
        q = electricFluxPoint((i + 1) / 2000);
      expect(Math.hypot(...p.map((v, j) => v - q[j]))).toBeLessThan(0.01);
      expect(Math.abs(p[0]) <= g.halfWidth && p[1] >= g.bottom && p[1] <= g.top).toBe(true);
      expect(
        Math.abs(p[0]) >= g.halfWidth - g.limb ||
          p[1] <= g.bottom + g.limb ||
          p[1] >= g.top - g.limb,
      ).toBe(true);
    }
  });
  it('derives every real turn and both terminals without intersecting the core', () => {
    const g = C.geometry;
    for (const side of ['primary', 'secondary'] as const)
      for (const n of [12, 24, 48]) {
        const sign = side === 'primary' ? -1 : 1;
        expect(electricWindingPoint(side, n, 0)[1]).toBe(g.coilBottom);
        expect(electricWindingPoint(side, n, 1)[1]).toBe(g.coilTop);
        expect(electricWindingPoint(side, n, 0)[2]).toBeCloseTo(g.windingZ, 12);
        expect(electricWindingPoint(side, n, 1)[2]).toBeCloseTo(g.windingZ, 12);
        for (let j = 0; j <= n * 64; j++) {
          const [x, y, z] = electricWindingPoint(side, n, j / (n * 64));
          expect(
            Math.abs(x - sign * g.limbX) > g.limb / 2 + g.wireRadius ||
              Math.abs(z) > g.depth / 2 + g.wireRadius,
          ).toBe(true);
          expect(y).toBeGreaterThanOrEqual(g.coilBottom);
        }
        expect((g.coilTop - g.coilBottom) / n).toBeGreaterThan(2 * g.wireRadius);
      }
  });
  it('reconstructs every chapter regardless of seek history and conserves power across its sweeps', () => {
    const samples = Array.from({ length: 8 * 61 }, (_, i) => [Math.floor(i / 61), (i % 61) / 60]);
    const forward = samples.map(([c, p]) => electricShot(c, p));
    for (let i = samples.length - 1; i >= 0; i--) {
      expect(electricShot(...(samples[i] as [number, number]))).toEqual(forward[i]);
      const a = forward[i].ac;
      expect(a.inputWatts).toBeCloseTo(a.outputWatts + a.copperWatts + a.coreWatts, 10);
    }
    expect(electricShot(1, 0.3).instant.v2).toBeCloseTo(0, 12);
    expect(electricShot(5, 1).instant.v2).toBeLessThan(0.001);
    expect(electricShot(7, 1).ac.fluxPeak).toBeCloseTo(electricShot(7, 0).ac.fluxPeak / 2, 12);
    const down = electricShot(4, 0.2),
      up = electricShot(4, 0.8);
    expect(down.ac.outputWatts).toBeCloseTo(up.ac.outputWatts, 12);
    expect(up.ac.secondaryRms).toBeCloseTo(down.ac.secondaryRms / 4, 12);
  });
});
