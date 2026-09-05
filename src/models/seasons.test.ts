import { describe, expect, it } from 'vitest';
import {
  SEASONS,
  seasonAnnualCurve,
  seasonBeam,
  seasonClipRay,
  seasonClipBeam,
  seasonDay,
  seasonDot,
  seasonLightPath,
  seasonOrbit,
  seasonPortrait,
  seasonSolar,
  seasonsShot,
  seasonsState,
} from './seasons';

describe('seasons: circular orbit and local solar observatory', () => {
  it('preserves beam width, parallel rays and ground intersections even near the horizon', () => {
    for (const altitude of [0.00001, 0.1, 1, 5, 16.56, 63.44, 89.9, 90]) {
      const beam = seasonBeam(altitude)!;
      const first = beam.rays[0].top,
        last = beam.rays[4].top;
      expect(Math.hypot(last.x - first.x, last.y - first.y)).toBeCloseTo(1, 8);
      expect(
        (last.x - first.x) * beam.direction.x + (last.y - first.y) * beam.direction.y,
      ).toBeCloseTo(0, 8);
      for (const ray of beam.rays) {
        const dx = ray.top.x - ray.ground.x,
          dy = ray.top.y - ray.ground.y;
        expect(dx * beam.direction.y - dy * beam.direction.x).toBeCloseTo(0, 8);
        expect(ray.top.y).toBeGreaterThan(0);
        const clipped = seasonClipRay(ray.top, ray.ground);
        if (clipped) {
          const [a, b] = clipped;
          expect((b.x - a.x) * beam.direction.y - (b.y - a.y) * beam.direction.x).toBeCloseTo(0, 8);
          for (const p of clipped) {
            expect(Math.abs(p.x)).toBeLessThanOrEqual(3.200001);
            expect(p.y).toBeGreaterThanOrEqual(-0.000001);
            expect(p.y).toBeLessThanOrEqual(3.400001);
          }
        }
      }
      expect(beam.rays[4].ground.x - beam.rays[0].ground.x).toBeCloseTo(beam.footprint, 8);
      const polygon = seasonClipBeam([
        beam.rays[0].top,
        beam.rays[4].top,
        beam.rays[4].ground,
        beam.rays[0].ground,
      ]);
      for (const p of polygon) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(3.200001);
        expect(p.y).toBeGreaterThanOrEqual(-0.000001);
        expect(p.y).toBeLessThanOrEqual(3.400001);
      }
    }
    expect(seasonBeam(0)).toBeNull();
    expect(seasonBeam(-15)).toBeNull();
    expect(() => seasonBeam(NaN)).toThrow();
  });
  it('keeps distance and the inertial axis fixed, with opposite solstices and two equinoxes', () => {
    for (let longitude = 0; longitude <= 720; longitude += 3) {
      const o = seasonOrbit(longitude);
      expect(Math.hypot(o.earth.x, o.earth.y, o.earth.z)).toBeCloseTo(1, 13);
      expect(o.axis).toEqual(seasonOrbit(0).axis);
      expect(seasonDot(o.axis, o.noon)).toBeCloseTo(0, 13);
      expect(seasonDot(o.axis, o.sun)).toBeCloseTo(Math.sin((o.declination * Math.PI) / 180), 13);
    }
    expect(seasonOrbit(0).declination).toBeCloseTo(0, 12);
    expect(seasonOrbit(180).declination).toBeCloseTo(0, 12);
    expect(seasonOrbit(90).declination).toBeCloseTo(SEASONS.tilt, 12);
    expect(seasonOrbit(270).declination).toBeCloseTo(-SEASONS.tilt, 12);
  });

  it('makes the globe normal, local sun, altitude, footprint and shadow agree', () => {
    for (const latitude of [-90, -75, -50, 0, 50, 75, 90])
      for (let longitude = 0; longitude < 360; longitude += 30)
        for (let hour = 0; hour < 24; hour += 1) {
          const s = seasonsState(longitude, latitude, SEASONS.tilt, hour);
          expect(seasonDot(s.normal, s.sun)).toBeCloseTo(s.solar.up, 12);
          expect(Math.hypot(s.solar.east, s.solar.north, s.solar.up)).toBeCloseTo(1, 12);
          const shadow = s.solar.shadow;
          if (shadow) {
            expect(shadow.east * s.solar.up + s.solar.east).toBeCloseTo(0, 11);
            expect(shadow.north * s.solar.up + s.solar.north).toBeCloseTo(0, 11);
            expect(s.solar.footprint! * s.solar.incident).toBeCloseTo(1, 12);
          } else expect(s.solar.incident).toBe(0);
        }
  });

  it('recovers 50° latitude noon altitudes and the hemisphere reversal', () => {
    const summer = seasonsState(90),
      winter = seasonsState(270);
    expect(summer.solar.altitude).toBeCloseTo(63.44, 10);
    expect(winter.solar.altitude).toBeCloseTo(16.56, 10);
    expect(summer.day.daylight).toBeCloseTo(16.15, 2);
    expect(winter.day.daylight).toBeCloseTo(7.85, 2);
    expect(summer.day).toEqual(seasonsState(270, -50).day);
    expect(winter.day.equivalentHours).toBeLessThan(summer.day.equivalentHours);
    for (let longitude = 0; longitude < 360; longitude += 7) {
      const s = seasonsState(longitude);
      expect(s.day.daylight + s.opposite.daylight).toBeCloseTo(24, 12);
    }
  });

  it('integrates incident geometric energy independently over ordinary and polar days', () => {
    for (const latitude of [-90, -75, -50, 0, 50, 75, 90])
      for (const delta of [-23.44, 0, 23.44]) {
        const day = seasonDay(latitude, delta);
        let numeric = 0;
        const n = 6000;
        for (let i = 0; i < n; i++)
          numeric += (seasonSolar(latitude, delta, (24 * (i + 0.5)) / n).incident * 24) / n;
        expect(day.equivalentHours).toBeCloseTo(numeric, 5);
        if (day.sunrise !== null)
          expect(seasonSolar(latitude, delta, day.sunrise).altitude).toBeCloseTo(0, 9);
        if (day.sunset !== null)
          expect(seasonSolar(latitude, delta, day.sunset).altitude).toBeCloseTo(0, 9);
      }
  });

  it('handles polar day/night, tangent horizons, zero tilt and invalid inputs explicitly', () => {
    expect(seasonDay(75, 23.44).regime).toBe('polar-day');
    expect(seasonDay(75, -23.44).regime).toBe('polar-night');
    expect(seasonDay(90, 0).regime).toBe('horizon');
    expect(seasonDay(-90, 0).equivalentHours).toBe(0);
    expect(seasonDay(66.56, 23.44).daylight).toBe(24);
    expect(seasonDay(66.56, -23.44).daylight).toBe(0);
    for (const latitude of [-89, -50, 0, 50, 89]) {
      const curve = seasonAnnualCurve(latitude, 0);
      for (const p of curve) {
        expect(p.daylight).toBeCloseTo(12, 10);
        expect(p.equivalentHours).toBeCloseTo(curve[0].equivalentHours, 12);
      }
    }
    for (const bad of [NaN, Infinity, -Infinity]) expect(() => seasonsState(bad)).toThrow();
    expect(() => seasonsState(0, 91)).toThrow();
    expect(() => seasonsState(0, 0, -1)).toThrow();
    expect(() => seasonsState(0, 0, 46)).toThrow();
    expect(() => seasonsShot(0, NaN)).toThrow();
  });

  it('reconstructs all film samples and preserves physical states across chapter cuts', () => {
    const visited = new Map<string, ReturnType<typeof seasonsShot>>();
    for (let c = 0; c < 8; c++)
      for (let p = 0; p <= 100; p++) visited.set(`${c}:${p}`, seasonsShot(c, p / 100));
    for (const [key, state] of [...visited].reverse()) {
      const [c, p] = key.split(':').map(Number);
      expect(seasonsShot(c, p / 100)).toEqual(state);
      expect(Number.isFinite(state.state.day.equivalentHours)).toBe(true);
    }
    for (let c = 0; c < 7; c++) {
      const a = seasonsShot(c, 1).state,
        b = seasonsShot(c + 1, 0).state;
      expect(a.longitude).toBeCloseTo(b.longitude, 10);
      expect(a.latitude).toBe(b.latitude);
      expect(a.tilt).toBe(b.tilt);
      expect(a.hour).toBe(b.hour);
    }
  });

  it('uses a projected illuminated hemisphere of the correct area for the globe', () => {
    for (const longitude of [0, 40, 90, 180, 270]) {
      const d = (seasonOrbit(longitude).declination * Math.PI) / 180;
      const sun = seasonPortrait({ x: 0, y: Math.sin(d), z: Math.cos(d) });
      const points = seasonLightPath(sun)
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
      expect(area / Math.PI).toBeCloseTo((1 + sun.z) / 2, 3);
    }
  });
});
