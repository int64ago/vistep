import { describe, expect, it } from 'vitest';
import {
  greenhouseConstants,
  greenhouseEquilibrium,
  greenhouseFlux,
  greenhouseTrace,
} from './greenhouse-effect';
describe('gray one-layer greenhouse energy balance', () => {
  it('balances both layers and top of atmosphere without creating downward energy', () => {
    for (const epsilon of [0, 0.2, 0.8, 1])
      for (const albedo of [0.1, 0.3, 0.6]) {
        const q = greenhouseEquilibrium(epsilon, 1361, albedo);
        expect(q.outgoing).toBeCloseTo(q.incoming, 10);
        expect(q.surfaceNet).toBeCloseTo(0, 10);
        expect(q.atmosphereNet).toBeCloseTo(0, 10);
        expect(q.absorbed).toBeCloseTo(q.up + q.down, 10);
        expect(q.emission).toBeCloseTo(q.incoming + q.down, 10);
      }
    expect(greenhouseEquilibrium(0).atmosphere).toBeNull();
    expect(greenhouseEquilibrium(1).direct).toBe(0);
    expect(greenhouseEquilibrium(1).up).toBeCloseTo(greenhouseEquilibrium(1).incoming, 10);
  });
  it('conserves instantaneous energy under arbitrary nonequilibrium temperatures', () => {
    for (const Ts of [250, 290, 330])
      for (const Ta of [200, 230, 270]) {
        const q = greenhouseFlux(Ts, Ta, 0.8);
        expect(q.surfaceNet + q.atmosphereNet).toBeCloseTo(q.net, 10);
      }
    const old = greenhouseEquilibrium(0.4),
      changed = greenhouseFlux(old.surface, old.atmosphere, 0.8);
    expect(changed.net).toBeGreaterThan(0);
    expect(changed.atmosphereNet).toBeCloseTo(0, 10);
    expect(changed.outgoing).toBeLessThan(old.incoming);
  });
  it('converges with step refinement and stores the independently integrated top imbalance', () => {
    const coarse = greenhouseTrace(0.8, 1361, 0.3, 5, 400),
      fine = greenhouseTrace(0.8, 1361, 0.3, 5, 1600),
      end = coarse.at(-1)!;
    expect(end.surface).toBeCloseTo(fine.at(-1)!.surface, 4);
    expect(end.atmosphere).toBeCloseTo(fine.at(-1)!.atmosphere, 4);
    let integrated = 0;
    for (let i = 1; i < fine.length; i++)
      integrated +=
        ((fine[i].net + fine[i - 1].net) / 2) *
        (fine[i].time - fine[i - 1].time) *
        greenhouseConstants.yearSeconds;
    expect(Math.abs(integrated - fine.at(-1)!.stored) / fine.at(-1)!.stored).toBeLessThan(1e-5);
    expect(end.surface).toBeGreaterThan(coarse[0].surface);
    expect(Math.abs(end.net)).toBeLessThan(coarse[0].net);
    expect(greenhouseEquilibrium(0.8, 1361, 0.6).surface).toBeLessThan(
      greenhouseEquilibrium(0.8).surface,
    );
  });
  it('handles zero emissivity and rejects unsupported inputs', () => {
    expect(greenhouseTrace(1, 1600, 0, 20, 100).at(-1)!.surface).toBeCloseTo(
      greenhouseEquilibrium(1, 1600, 0).surface,
      8,
    );
    expect(greenhouseTrace(0).every((v) => v.up === 0 && v.down === 0 && v.absorbed === 0)).toBe(
      true,
    );
    expect(() => greenhouseEquilibrium(1.1)).toThrow();
    expect(() => greenhouseFlux(300, null, 0.5)).toThrow();
    expect(() => greenhouseTrace(0.8, 1361, 0.3, 5, 1)).toThrow();
  });
});
