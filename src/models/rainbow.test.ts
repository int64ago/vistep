import { describe, expect, it } from 'vitest';
import {
  rainbowAngle,
  rainbowConcentration,
  rainbowDot,
  rainbowFresnel,
  rainbowMiss,
  rainbowObserverDrop,
  rainbowReveal,
  rainbowShot,
  rainbowSky,
  rainbowStationary,
  traceRainbow,
  waterIndex,
} from './rainbow';
describe('rainbow: reproducible spherical optics', () => {
  it('uses IAPWS coefficients and normal visible dispersion, with declared fixed water state', () => {
    // IAPWS R9-97 Table 3, 0°C / 0.1 MPa; density supplied, no equation-of-state solver claimed.
    expect(waterIndex(589, 273.15, 999.843)).toBeCloseTo(1.334344, 6);
    expect(waterIndex(1013.98, 273.15, 999.843)).toBeCloseTo(1.326135, 6);
    expect(waterIndex(226.5, 273.15, 999.843)).toBeCloseTo(1.394527, 6);
    expect(waterIndex(550)).toBeCloseTo(1.33468025, 7);
    for (let w = 400; w < 700; w += 5) expect(waterIndex(w)).toBeGreaterThan(waterIndex(w + 5));
    expect(waterIndex(550, 293.15, 0)).toBe(1);
  });
  it('joins every ray to actual spherical contacts and obeys Snell at both refractions', () => {
    for (const w of [400, 450, 550, 650, 700])
      for (let b = 0; b < 1; b += 0.013) {
        const r = traceRainbow(b, w);
        for (const p of [r.entry, r.reflection, r.exit])
          expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 11);
        for (const d of [r.inside, r.reflected, r.outgoing])
          expect(Math.hypot(d.x, d.y)).toBeCloseTo(1, 12);
        const cross = (a: { x: number; y: number }, c: { x: number; y: number }) =>
          Math.abs(a.x * c.y - a.y * c.x);
        expect(cross(r.incoming, r.entry)).toBeCloseTo(r.index * cross(r.inside, r.entry), 11);
        expect(r.index * cross(r.reflected, r.exit)).toBeCloseTo(cross(r.outgoing, r.exit), 11);
        expect(rainbowDot(r.inside, r.reflection)).toBeCloseTo(
          -rainbowDot(r.reflected, r.reflection),
          11,
        );
        expect(r.angle).toBeCloseTo(rainbowAngle(b, r.index), 9);
        expect(r.points[1]).toEqual(r.entry);
        expect(r.points[2]).toEqual(r.reflection);
        expect(r.points[3]).toEqual(r.exit);
      }
  });
  it('keeps Fresnel polarization channels separate and conserves incident power across branches', () => {
    for (const w of [400, 550, 700])
      for (const b of [0, 0.3, 0.65, 0.86, 0.97, 0.999999]) {
        const r = traceRainbow(b, w),
          p = r.power;
        expect(p.entryReflection + p.zeroOrder + p.primary + p.remaining).toBeCloseTo(1, 12);
        expect(p.primary).toBeGreaterThanOrEqual(0);
        expect(p.primary).toBeLessThan(p.entered);
        const internal = rainbowFresnel(Math.cos((r.refraction * Math.PI) / 180), r.index, 1);
        expect(internal.tir).toBe(false);
        expect(internal.s).toBeLessThan(1);
      }
    expect(rainbowFresnel(0.1, 1.5, 1).tir).toBe(true);
  });
  it('finds an angular stationary maximum independently and recovers red outside violet', () => {
    for (const w of [400, 550, 700]) {
      const s = rainbowStationary(w),
        h = 1e-5;
      const before = traceRainbow(s.impact - h, w).angle,
        after = traceRainbow(s.impact + h, w).angle;
      expect((after - before) / (2 * h)).toBeCloseTo(0, 4);
      expect(traceRainbow(s.impact - 0.05, w).angle).toBeLessThan(s.angle);
      expect(traceRainbow(s.impact + 0.05, w).angle).toBeLessThan(s.angle);
    }
    expect(rainbowStationary(400).angle).toBeCloseTo(40.5673, 3);
    expect(rainbowStationary(700).angle).toBeCloseTo(42.4406, 3);
  });
  it('concentrates equal incident-area samples near the stationary angle without inventing brightness', () => {
    const d = rainbowConcentration(550, 8192);
    expect(d.bins.reduce((sum, b) => sum + b.count, 0)).toBe(8192);
    expect(d.bins.reduce((sum, b) => sum + b.power, 0)).toBeCloseTo(d.total, 12);
    expect(Math.abs(d.peak.angle - d.stationary.angle)).toBeLessThan(0.3);
    expect(d.total).toBeGreaterThan(0);
    expect(d.total).toBeLessThan(1);
    expect(
      d.bins.filter((b) => b.angle > d.stationary.angle + 0.25).every((b) => b.count === 0),
    ).toBe(true);
  });
  it('sends different colors from different droplets to one eye; the same drop’s other color misses', () => {
    for (const h of [0, 12, 30, 50]) {
      const red = rainbowObserverDrop(700, h),
        violet = rainbowObserverDrop(400, h);
      for (const d of [red, violet]) {
        expect(d.exit.x + d.outgoing.x * d.travel).toBeCloseTo(0, 11);
        expect(d.exit.y + d.outgoing.y * d.travel).toBeCloseTo(0, 11);
        expect(d.centre.x).toBe(70);
      }
      expect(red.centre.y).toBeGreaterThan(violet.centre.y);
      expect(Math.abs(rainbowMiss(red, 400, h).atEyePlane.y)).toBeGreaterThan(1);
    }
  });
  it('makes each sky point a direction on the antisolar cone and clips by the actual horizon', () => {
    for (const h of [0, 12, 35, 55])
      for (const w of [400, 700])
        for (let az = 0; az < 360; az += 7) {
          const p = rainbowSky(w, h, az),
            a = (h * Math.PI) / 180;
          expect(Math.hypot(p.direction.x, p.direction.y, p.direction.z)).toBeCloseTo(1, 12);
          expect(p.direction.x * Math.cos(a) - p.direction.y * Math.sin(a)).toBeCloseTo(
            Math.cos((p.angle * Math.PI) / 180),
            12,
          );
          expect(p.visible).toBe(p.y >= p.horizon - 1e-10);
          if (h === 55) expect(p.visible).toBe(false);
        }
  });
  it('reconstructs seeking, segment reveals, centre rays, mirror rays and numeric boundaries', () => {
    const history = Array.from({ length: 808 }, (_, i) =>
      rainbowShot(Math.floor(i / 101), (i % 101) / 100),
    );
    for (let i = 807; i >= 0; i--)
      expect(rainbowShot(Math.floor(i / 101), (i % 101) / 100)).toEqual(history[i]);
    expect(traceRainbow(0).angle).toBe(0);
    const a = traceRainbow(0.86),
      b = traceRainbow(-0.86);
    expect(a.outgoing.x).toBeCloseTo(b.outgoing.x, 12);
    expect(a.outgoing.y).toBeCloseTo(-b.outgoing.y, 12);
    for (let stage = 0; stage <= 4; stage++)
      expect(rainbowReveal(a.points, stage)).toEqual(
        a.points
          .slice(0, stage + 1 + (stage < 4 ? 1 : 0))
          .map((p, i) => (i === stage + 1 ? a.points[stage] : p)),
      );
    for (const bad of [NaN, Infinity, -Infinity, 1, -1]) expect(() => traceRainbow(bad)).toThrow();
    expect(() => traceRainbow(0.8, 350)).toThrow();
    expect(() => waterIndex(0)).toThrow();
    expect(() => rainbowShot(8, 0)).toThrow();
  });
});
