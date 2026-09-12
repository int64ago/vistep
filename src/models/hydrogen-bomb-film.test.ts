import { describe, expect, it } from 'vitest';
import { FUSION_LIMITS, kelvinToKeV } from './hydrogen-bomb';
import { APPROACH_ATTEMPTS, FUSION_VIEWS, hydrogenBombShot } from './hydrogen-bomb-film';

describe('hydrogen-bomb director', () => {
  it('is deterministic, bounded and covers every view in order', () => {
    for (let c = 0; c < 7; c++) {
      for (let i = 0; i <= 1000; i++) {
        const p = i / 1000;
        const a = hydrogenBombShot(c, p),
          b = hydrogenBombShot(c, p);
        expect(a).toEqual(b);
        expect(a.view).toBe(FUSION_VIEWS[c]);
        expect(a.parameters.temperatureKeV).toBeGreaterThanOrEqual(
          FUSION_LIMITS.temperatureKeV[0] * 0.999,
        );
        expect(a.parameters.temperatureKeV).toBeLessThanOrEqual(FUSION_LIMITS.temperatureKeV[1]);
        expect(a.parameters.compression).toBeGreaterThanOrEqual(1);
        expect(a.parameters.compression).toBeLessThanOrEqual(1000);
        for (const key of [
          'approachPhase',
          'tunnelReveal',
          'showTunnelling',
          'showProduct',
          'fuelProgress',
        ] as const) {
          expect(a[key]).toBeGreaterThanOrEqual(0);
          expect(a[key]).toBeLessThanOrEqual(1);
        }
        expect(a.revealed).toBeGreaterThanOrEqual(0);
        expect(a.revealed).toBeLessThanOrEqual(3);
      }
    }
    expect(() => hydrogenBombShot(Number.NaN, 0)).toThrow(RangeError);
    expect(hydrogenBombShot(-3, 2).view).toBe('approach');
    expect(hydrogenBombShot(99, -1).view).toBe('confinement');
  });
  it('runs three complete approach attempts at rising temperatures before revealing tunnelling', () => {
    const phases = [0.04, 0.34, 0.64].map((start, i) => ({
      start,
      attempt: i,
      T: APPROACH_ATTEMPTS[i].temperatureKeV,
    }));
    for (const { start, attempt, T } of phases) {
      const outward = hydrogenBombShot(0, start + 0.001),
        turn = hydrogenBombShot(0, start + (attempt === 2 ? 0.11 : 0.13));
      expect(outward.attempt).toBe(attempt);
      expect(outward.parameters.temperatureKeV).toBeCloseTo(T, 12);
      expect(outward.approachPhase).toBeLessThan(0.05);
      expect(turn.approachPhase).toBeCloseTo(0.5, 1);
      expect(outward.tunnelReveal).toBe(0);
    }
    expect(APPROACH_ATTEMPTS[0].temperatureKeV).toBeCloseTo(kelvinToKeV(3000), 12);
    expect(hydrogenBombShot(0, 0.99).tunnelReveal).toBe(1);
  });
  it('carries the same temperature reference through the distribution and rate chapters', () => {
    expect(hydrogenBombShot(2, 0).parameters.temperatureKeV).toBeCloseTo(kelvinToKeV(3000), 9);
    expect(hydrogenBombShot(2, 0.44).parameters.temperatureKeV).toBeCloseTo(kelvinToKeV(1.5e7), 6);
    expect(hydrogenBombShot(2, 1).parameters.temperatureKeV).toBe(10);
    expect(hydrogenBombShot(2, 0.5).showTunnelling).toBe(0);
    expect(hydrogenBombShot(2, 1).showProduct).toBe(1);
    expect(hydrogenBombShot(3, 0).parameters.temperatureKeV).toBe(1);
    expect(hydrogenBombShot(3, 1).parameters.temperatureKeV).toBeCloseTo(30, 9);
  });
  it('orders the ignition chapter: flame, fireball, then compression of the same fuel', () => {
    const flame = hydrogenBombShot(4, 0.1),
      fireball = hydrogenBombShot(4, 0.5),
      pressed = hydrogenBombShot(4, 1);
    expect(flame.ignitionStep).toBe(0);
    expect(flame.parameters.compression).toBe(1);
    expect(fireball.ignitionStep).toBe(1);
    expect(fireball.parameters.temperatureKeV).toBe(10);
    expect(fireball.parameters.compression).toBe(1);
    expect(pressed.ignitionStep).toBe(2);
    expect(pressed.parameters.compression).toBeCloseTo(1000, 6);
    expect(hydrogenBombShot(5, 0.5).parameters.compression).toBe(1);
  });
});
