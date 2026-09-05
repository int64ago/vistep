import { describe, expect, it } from 'vitest';
import {
  LUNAR,
  SYNODIC_DAYS,
  diskOverlap,
  dot3,
  lunarMonths,
  lunarState,
  moonDiskLight,
  moonShot,
  phaseDiskPath,
  lunarShadowOnDisk,
} from './moon';
describe('lunar illumination and motion', () => {
  it('keeps the 2D phase polygon and shadow portrait consistent with area readouts', () => {
    for (let c = -1; c <= 1.001; c += 0.1) {
      const points = phaseDiskPath(c)
        .slice(1, -1)
        .split('L')
        .map((p) => p.split(',').map(Number));
      const area =
        Math.abs(
          points.reduce((sum, p, i) => {
            const q = points[(i + 1) % points.length];
            return sum + p[0] * q[1] - p[1] * q[0];
          }, 0),
        ) / 2;
      expect(area / Math.PI).toBeCloseTo((1 + c) / 2, 3);
    }
    for (let node = 0; node <= 90; node += 0.5) {
      const s = lunarState(SYNODIC_DAYS / 2, LUNAR.inclination, node),
        sh = lunarShadowOnDisk(s);
      expect(diskOverlap(1, sh.radius, Math.hypot(sh.x, sh.y)) / Math.PI).toBeCloseTo(
        s.umbraFraction,
        10,
      );
    }
  });
  it('recovers the four principal phases in a coplanar circular orbit', () => {
    for (const [part, fraction] of [
      [0, 0],
      [0.25, 0.5],
      [0.5, 1],
      [0.75, 0.5],
      [1, 0],
    ])
      expect(lunarState(part * SYNODIC_DAYS, 0).illuminated).toBeCloseTo(fraction, 12);
    expect(lunarState(SYNODIC_DAYS / 4, 0).sunOnDisk.x).toBeGreaterThan(0.99);
    expect(lunarState(SYNODIC_DAYS * 0.75, 0).sunOnDisk.x).toBeLessThan(-0.99);
  });
  it('matches the observer disk area to the geometric illuminated fraction', () => {
    for (const days of [1, 3, 7, 10, 14, 18, 23, 27]) {
      const state = lunarState(days);
      let lit = 0,
        total = 0;
      for (let y = -0.9975; y < 1; y += 0.005)
        for (let x = -0.9975; x < 1; x += 0.005) {
          const light = moonDiskLight(x, y, state);
          if (light !== null) {
            total++;
            if (light > 0) lit++;
          }
        }
      expect(lit / total).toBeCloseTo(state.illuminated, 3);
    }
  });
  it('keeps the synchronously rotating front pointed at Earth and orthogonal to its pole', () => {
    for (let day = 0; day < 32; day += 0.125) {
      const s = lunarState(day);
      expect(Math.hypot(s.position.x, s.position.y, s.position.z)).toBeCloseTo(
        LUNAR.moonDistance,
        8,
      );
      expect(dot3(s.lockedFront, s.moonDirection)).toBeCloseTo(-1, 12);
      expect(dot3(s.lockedUp, s.lockedFront)).toBeCloseTo(0, 12);
      expect(dot3(s.lockedRight, s.lockedUp)).toBeCloseTo(0, 12);
    }
  });
  it('distinguishes a full phase outside Earth’s shadow from a nodal eclipse', () => {
    const day = SYNODIC_DAYS / 2,
      miss = lunarState(day),
      node = (miss.earthAngle * 180) / Math.PI,
      hit = lunarState(day, LUNAR.inclination, node);
    expect(miss.illuminated).toBeGreaterThan(0.99);
    expect(miss.umbraFraction).toBe(0);
    expect(miss.inPenumbra).toBe(false);
    expect(hit.umbraFraction).toBeCloseTo(1, 12);
    expect(hit.shadowOffset).toBeLessThan(0.01);
    expect(lunarState(0, 0).umbraFraction).toBe(0);
    expect(diskOverlap(1, 2, 0)).toBeCloseTo(Math.PI, 12);
    expect(diskOverlap(1, 1, 2)).toBe(0);
    expect(diskOverlap(2, 3, 2)).toBeCloseTo(diskOverlap(3, 2, 2), 12);
  });
  it('separates sidereal and synodic periods and supports direct reconstruction', () => {
    expect(SYNODIC_DAYS).toBeCloseTo(29.53059, 4);
    const sidereal = lunarMonths(LUNAR.siderealDays);
    expect(sidereal.siderealTurns).toBe(1);
    expect(sidereal.synodicTurns).toBeLessThan(1);
    const synodic = lunarMonths(SYNODIC_DAYS);
    expect(synodic.siderealTurns - synodic.earthTurns).toBeCloseTo(1, 12);
    for (let c = 0; c < 8; c++)
      for (const p of [0, 0.5, 1]) expect(moonShot(c, p)).toEqual(moonShot(c, p));
    expect(() => lunarState(NaN)).toThrow();
    expect(() => lunarState(0, -1)).toThrow();
    expect(() => diskOverlap(-1, 1, 0)).toThrow();
  });
});
