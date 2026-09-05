import { describe, expect, it } from 'vitest';
import {
  PLANETARY,
  planetaryOutlines,
  planetarySpeeds,
  planetaryDrive,
  planetaryShot,
  planetaryState,
  radialBoundary,
  type PlanetaryMode,
} from './planetary';
import { TAU } from './mechanisms';
const modes: PlanetaryMode[] = ['ring-fixed', 'sun-fixed', 'carrier-fixed', 'locked'];
describe('planetary gearing', () => {
  it('satisfies concentricity, equal planet spacing and neighboring tip clearance', () => {
    const p = PLANETARY;
    expect(p.ring).toBe(p.sun + 2 * p.planet);
    expect((p.sun + p.ring) % p.count).toBe(0);
    const spacing = p.module * (p.sun + p.planet) * Math.sin(Math.PI / p.count);
    expect(spacing).toBeGreaterThan(p.module * (p.planet + 2));
  });
  it('obeys both mesh velocity constraints in every lock configuration', () => {
    for (const mode of modes) {
      const q = planetarySpeeds(mode),
        p = PLANETARY;
      expect(p.sun * (q.sun - q.carrier) + p.ring * (q.ring - q.carrier)).toBeCloseTo(0, 12);
      expect(p.sun * (q.sun - q.carrier) + p.planet * (q.planet - q.carrier)).toBeCloseTo(0, 12);
    }
    expect(planetarySpeeds('ring-fixed').carrier).toBeCloseTo(1 / 3.5);
    expect(planetarySpeeds('carrier-fixed').ring).toBeCloseTo(-0.4);
    expect(planetarySpeeds('locked')).toEqual({ sun: 1, ring: 1, carrier: 1, planet: 1 });
  });
  it('keeps every rendered planet tooth outside the sun and inside the ring cavity', () => {
    const outlines = planetaryOutlines(),
      sunBoundary = radialBoundary(outlines.sun),
      ringBoundary = radialBoundary(outlines.ring);
    let minimumClearance = Infinity;
    for (const mode of modes)
      for (let frame = 0; frame < 97; frame++) {
        const state = planetaryState((frame / 96) * TAU * 2, mode);
        for (const planet of state.planets)
          for (const p of outlines.planet) {
            const x = planet.x + Math.cos(planet.angle) * p.x - Math.sin(planet.angle) * p.y,
              y = planet.y + Math.sin(planet.angle) * p.x + Math.cos(planet.angle) * p.y;
            const radius = Math.hypot(x, y),
              bearing = Math.atan2(y, x);
            minimumClearance = Math.min(
              minimumClearance,
              radius - sunBoundary(bearing - state.sun),
              ringBoundary(bearing - state.ring) - radius,
            );
          }
      }
    expect(minimumClearance).toBeGreaterThan(-0.00003);
  });
  it('reconstructs absolute gear phase rather than integrating a paused frame', () => {
    const original = planetaryState(8.125, 'ring-fixed');
    planetaryState(-22, 'sun-fixed');
    expect(planetaryState(8.125, 'ring-fixed')).toEqual(original);
    expect(() => planetaryState(NaN, 'locked')).toThrow();
  });
  it('conserves ideal input/output power without assigning power to fixed supports', () => {
    for (const mode of modes) {
      const d = planetaryDrive(mode);
      expect(d.outputPower).toBeCloseTo(d.inputPower, 12);
    }
    expect(planetaryDrive('ring-fixed').outputTorque).toBeCloseTo(3.5);
    expect(planetaryDrive('carrier-fixed').outputTorque).toBeCloseTo(-2.5);
  });
  it('does not rotate disassembled gears and counts the measured output turns', () => {
    for (let i = 0; i < 100; i++) {
      const shot = planetaryShot(0, i / 100);
      if (shot.assembly > 0) expect(shot.inputAngle).toBe(0);
    }
    for (const chapter of [2, 4, 5]) {
      const shot = planetaryShot(chapter, 1),
        state = planetaryState(shot.inputAngle, shot.mode),
        drive = planetaryDrive(shot.mode);
      expect(Math.abs(state[drive.output]) / TAU).toBeCloseTo(1, 12);
    }
  });
});
