import { describe, expect, it } from 'vitest';
import {
  dopplerArrival,
  dopplerExperiment,
  dopplerFrame,
  dopplerPosition,
  dopplerRetarded,
  dopplerShot,
  validateDoppler,
  type DopplerConfig,
  type DopplerVector,
} from './doppler';

describe('Doppler: propagation and arrival geometry', () => {
  it('recovers the stationary limit without changing emission period', () => {
    const config = dopplerExperiment(0, 0, 0);
    for (let id = -8; id <= 8; id++) {
      const event = dopplerArrival(config, id);
      expect(event.emitted).toBe(id);
      expect(event.arrived).toBeCloseTo(id + 6.4, 12);
    }
    expect(dopplerFrame(config, 8.2).averageRatio).toBeCloseTo(1, 12);
  });

  it('agrees with independent analytic collinear approach, recession and observer formulas', () => {
    for (const vs of [-0.8, -0.2, 0, 0.3, 0.85]) {
      for (const vo of [-0.7, 0, 0.4, 0.9]) {
        const config = dopplerExperiment(vs, vo, 0);
        config.observer.origin.x = 30;
        const a = dopplerArrival(config, 0);
        const b = dopplerArrival(config, 1);
        expect(1 / (b.arrived - a.arrived)).toBeCloseTo((1 - vo) / (1 - vs), 10);
        expect(a.arrived).toBeCloseTo(33.2 / (1 - vo), 10);
      }
    }
  });

  it('places every contact on the expanding wave and the observer trajectory', () => {
    const config = dopplerExperiment(0.61, -0.28, 2.3);
    config.source.velocity.y = 0.14;
    config.observer.velocity.y = -0.1;
    for (let id = -20; id < 30; id++) {
      const event = dopplerArrival(config, id);
      const center = dopplerPosition(config.source, event.emitted);
      expect(event.arrived).toBeGreaterThanOrEqual(event.emitted);
      expect(event.contact).toEqual(dopplerPosition(config.observer, event.arrived));
      expect(Math.hypot(event.contact.x - center.x, event.contact.y - center.y)).toBeCloseTo(
        config.c * (event.arrived - event.emitted),
        10,
      );
      expect(dopplerRetarded(config, event.arrived).emitted).toBeCloseTo(event.emitted, 10);
    }
  });

  it('preserves arrival times under translated and rotated geometry', () => {
    const config = dopplerExperiment(0.6, -0.21, 1.8);
    const angle = 1.137;
    const rotate = (v: DopplerVector) => ({
      x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
      y: v.x * Math.sin(angle) + v.y * Math.cos(angle),
    });
    const shift = (v: DopplerVector) => {
      const r = rotate(v);
      return { x: r.x + 128.4, y: r.y - 93.7 };
    };
    const transformed: DopplerConfig = {
      ...config,
      source: { origin: shift(config.source.origin), velocity: rotate(config.source.velocity) },
      observer: {
        origin: shift(config.observer.origin),
        velocity: rotate(config.observer.velocity),
      },
    };
    for (let id = -8; id <= 12; id++) {
      const a = dopplerArrival(config, id),
        b = dopplerArrival(transformed, id);
      expect(b.arrived).toBeCloseTo(a.arrived, 10);
      expect(b.contact.x).toBeCloseTo(shift(a.contact).x, 10);
      expect(b.contact.y).toBeCloseTo(shift(a.contact).y, 10);
    }
  });

  it('agrees with bisection of the travel equation independently of the quadratic solver', () => {
    const config = dopplerExperiment(-0.72, 0.83, 2.1);
    for (let id = -10; id < 10; id++) {
      const event = dopplerArrival(config, id);
      const gap = (t: number) => {
        const o = dopplerPosition(config.observer, t);
        return (
          Math.hypot(o.x - event.center.x, o.y - event.center.y) - config.c * (t - event.emitted)
        );
      };
      let lo = event.emitted,
        hi = lo + 1;
      while (gap(hi) > 0) hi = lo + 2 * (hi - lo);
      for (let i = 0; i < 70; i++) {
        const mid = (lo + hi) / 2;
        if (gap(mid) > 0) lo = mid;
        else hi = mid;
      }
      expect(event.arrived).toBeCloseTo((lo + hi) / 2, 10);
    }
  });

  it('keeps off-axis arrivals ordered and continuous through the pass', () => {
    const config = dopplerExperiment(0.65, 0, 1.5);
    config.source.origin.x = -3.6;
    config.observer.origin.x = 0;
    for (let id = -10; id < 20; id++)
      expect(dopplerArrival(config, id + 1).arrived).toBeGreaterThan(
        dopplerArrival(config, id).arrived,
      );
    for (let time = 0; time < 12; time += 0.031) {
      const eps = 1e-5;
      const exact = dopplerRetarded(config, time);
      const derivative =
        (dopplerRetarded(config, time + eps).emitted -
          dopplerRetarded(config, time - eps).emitted) /
        (2 * eps);
      expect(exact.frequencyRatio).toBeCloseTo(derivative, 8);
    }
    // Sound emitted at closest approach arrives one transverse travel-time later.
    const closest = 3.6 / 0.65;
    expect(dopplerRetarded(config, closest).frequencyRatio).toBeGreaterThan(1);
    expect(dopplerRetarded(config, closest + 1.5).frequencyRatio).toBeCloseTo(1, 12);
  });

  it('holds frequency constant when both bodies share a velocity', () => {
    const config = dopplerExperiment(0.72, 0.72, 2.4);
    for (const time of [-10, 0, 10, 100]) {
      expect(dopplerFrame(config, time).averageRatio).toBeCloseTo(1, 11);
      expect(dopplerRetarded(config, time).frequencyRatio).toBeCloseTo(1, 12);
    }
  });

  it('rejects exact sonic and supersonic boundaries without clamping and resolves near-boundary roots', () => {
    for (const speed of [-1.2, -1, 1, 1.2]) {
      expect(() => validateDoppler(dopplerExperiment(speed, 0))).toThrow(RangeError);
      expect(() => validateDoppler(dopplerExperiment(0, speed))).toThrow(RangeError);
    }
    for (const speed of [-0.999999, 0.999999]) {
      const config = dopplerExperiment(0, speed, 0);
      expect(dopplerArrival(config, 0).arrived).toBeCloseTo(6.4 / (1 - speed), speed > 0 ? 2 : 10);
    }
    expect(() => validateDoppler({ ...dopplerExperiment(), c: 0 })).toThrow();
    expect(() => dopplerFrame(dopplerExperiment(), Number.NaN)).toThrow();
    const coincident = dopplerExperiment(0, 0, 0);
    coincident.observer.origin = { ...coincident.source.origin };
    expect(dopplerArrival(coincident, 0).arrived).toBe(0);
    expect(dopplerRetarded(coincident, 0).frequencyRatio).toBeNull();
  });

  it('derives emitted centers, radii and front/rear spacing from the same clock', () => {
    const frame = dopplerFrame(dopplerExperiment(0.55, 0), 4.37);
    for (const wave of frame.wavefronts) {
      expect(wave.center).toEqual(dopplerPosition(frame.config.source, wave.id));
      expect(wave.radius).toBeCloseTo(frame.time - wave.id, 12);
    }
    const a = frame.wavefronts.at(-2)!,
      b = frame.wavefronts.at(-3)!;
    expect(b.center.x + b.radius - (a.center.x + a.radius)).toBeCloseTo(frame.frontWavelength, 12);
    expect(a.center.x - a.radius - (b.center.x - b.radius)).toBeCloseTo(frame.rearWavelength, 12);
  });

  it('keeps all exploration endpoints finite and refuses unbounded visual allocations', () => {
    for (const source of [-0.9, 0, 0.9])
      for (const observer of [-0.8, 0, 0.8]) {
        for (const offset of [0.6, 3.5])
          for (const time of [0, 3, 6, 9, 12]) {
            const frame = dopplerFrame(dopplerExperiment(source, observer, offset), time);
            expect(frame.wavefronts.length).toBeLessThan(460);
            expect(frame.interval).toBeGreaterThan(0);
            expect(
              frame.wavefronts.every((wave) => Number.isFinite(wave.radius) && wave.radius >= 0),
            ).toBe(true);
            expect(frame.previous.arrived).toBeLessThanOrEqual(time + 1e-10);
            expect(frame.next.arrived).toBeGreaterThanOrEqual(time - 1e-10);
          }
      }
    expect(() => dopplerFrame(dopplerExperiment(0.999999, 0), 0)).toThrow('Too many phase fronts');
  });

  it('reconstructs every shot and seek without mutable history, preserving bounded scene motion', () => {
    const records = Array.from({ length: 8 }, (_, chapter) =>
      Array.from({ length: 101 }, (_, n) => dopplerShot(chapter, n / 100)),
    );
    for (let chapter = 7; chapter >= 0; chapter--) {
      for (let n = 100; n >= 0; n--) {
        const shot = dopplerShot(chapter, n / 100);
        expect(shot).toEqual(records[chapter][n]);
        expect(shot.frame.averageRatio).toBeGreaterThan(0);
        expect(Number.isFinite(shot.frame.interval)).toBe(true);
        expect(shot.frame.config.period).toBe(1);
        expect(shot.frame.wavefronts.length).toBeLessThan(160);
      }
    }
  });
});
