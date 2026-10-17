import { describe, expect, it } from 'vitest';
import { earthDayClock, earthDayModel, earthDayState } from './earth-day';
describe('sidereal and solar rotation periods', () => {
  it('uses relative angular speed to return to the Sun and fixed stars', () => {
    for (const year of [2, 12, 100, 365.256, 720])
      for (const orbit of [false, true])
        for (const retro of [false, true]) {
          const q = earthDayModel(year, orbit, retro),
            solar = earthDayState(q.solarHours, year, orbit, retro),
            star = earthDayState(q.siderealHours, year, orbit, retro);
          expect(solar.sunFacing).toBeCloseTo(1, 12);
          expect(solar.noonError).toBeCloseTo(0, 12);
          expect(star.starError).toBeCloseTo(0, 12);
          const normal = [Math.cos(solar.marker), Math.sin(solar.marker)],
            sun = [Math.cos(solar.sunDirection), Math.sin(solar.sunDirection)];
          expect(normal[0] * sun[0] + normal[1] * sun[1]).toBeCloseTo(1, 12);
        }
  });
  it('shows that prograde rotation needs an extra turn but no orbit removes the difference', () => {
    const q = earthDayModel(12),
      star = earthDayState(q.siderealHours, 12);
    expect(star.noonError).toBeLessThan(0);
    expect((star.orbital * 180) / Math.PI).toBeCloseTo(360 / 13, 12);
    expect(q.solarHours).toBeCloseTo(24, 12);
    expect(q.siderealHours).toBeLessThan(q.solarHours);
    expect(earthDayModel(12, false).solarHours).toBe(q.siderealHours);
    expect(earthDayModel(12, true, true).solarHours).toBeLessThan(q.siderealHours);
  });
  it('recovers approximate Earth-scale timing without claiming seasonal true-solar time', () => {
    const q = earthDayModel(365.256);
    expect(earthDayClock(q.siderealHours)).toBe('23:56:04');
    expect(earthDayClock(q.solarHours)).toBe('24:00:00');
    expect((earthDayState(q.siderealHours, 365.256).orbital * 180) / Math.PI).toBeCloseTo(
      360 / 366.256,
      12,
    );
    expect(earthDayState(0).sunFacing).toBe(1);
    expect(earthDayClock(1 + 59 / 60 + 59.6 / 3600)).toBe('02:00:00');
  });
  it('rejects invalid timing and year lengths', () => {
    expect(() => earthDayModel(0)).toThrow();
    expect(() => earthDayState(-1)).toThrow();
    expect(() => earthDayClock(NaN)).toThrow();
    expect(() => earthDayModel(Infinity)).toThrow();
  });
});
