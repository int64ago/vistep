import { describe, expect, it } from 'vitest';
import {
  HELICOPTER as H,
  HELICOPTER_HOVER_PITCH,
  HELICOPTER_TILTED_PITCH,
  helicopterBladePitch,
  helicopterBladeThrust,
  helicopterCollectiveForThrust,
  helicopterElement,
  helicopterShot,
  helicopterSolve,
} from './helicopter';

describe('near-hover rotor: blade elements and momentum share one solution', () => {
  it('closes the hover momentum balance over the entire collective range', () => {
    for (let pitch = 4; pitch <= 13; pitch += 0.5) {
      const s = helicopterSolve({ collectiveDeg: pitch });
      expect(Math.abs(helicopterBladeThrust(pitch, s.induced) - s.thrust)).toBeLessThan(1e-7);
      expect(s.thrust).toBeCloseTo(2 * H.density * s.area * s.induced ** 2, 9);
      expect(s.farWake).toBe(2 * s.induced);
      expect(s.rotorTorque * H.omega).toBeCloseTo(s.thrust * s.induced, 7);
    }
  });
  it('converges radially against a much finer numerical quadrature', () => {
    for (const pitch of [4, 8, 13]) {
      const fine = helicopterSolve({ collectiveDeg: pitch }, 1536),
        normal = helicopterSolve({ collectiveDeg: pitch });
      expect(Math.abs(normal.thrust / fine.thrust - 1)).toBeLessThan(0.00004);
    }
  });
  it('inverse pitch returns exactly the requested force and restores tilted balance', () => {
    expect(helicopterSolve({ collectiveDeg: HELICOPTER_HOVER_PITCH }).vertical).toBeCloseTo(
      H.mass * H.gravity,
      7,
    );
    expect(
      helicopterSolve({ collectiveDeg: HELICOPTER_TILTED_PITCH, diskTiltDeg: 20 }).vertical,
    ).toBeCloseTo(H.mass * H.gravity, 7);
    for (const thrust of [4000, 7000, 10000, 15000])
      expect(
        helicopterSolve({ collectiveDeg: helicopterCollectiveForThrust(thrust) }).thrust,
      ).toBeCloseTo(thrust, 7);
  });
  it('preserves vector magnitude while tilt changes components', () => {
    for (let tilt = -25; tilt <= 25; tilt++) {
      const s = helicopterSolve({ collectiveDeg: HELICOPTER_HOVER_PITCH, diskTiltDeg: tilt });
      expect(Math.hypot(s.vertical, s.horizontal)).toBeCloseTo(s.thrust, 8);
      expect(s.verticalAcceleration).toBeLessThanOrEqual(1e-10);
      expect(s.horizontalAcceleration).toBeCloseTo(s.horizontal / H.mass, 10);
    }
  });
  it('opposite blades have opposite cyclic departures and a constant mean', () => {
    for (let j = 0; j < 360; j++) {
      const a = (j * Math.PI) / 180;
      expect(
        (helicopterBladePitch(8, 3, a) + helicopterBladePitch(8, 3, a + Math.PI)) / 2,
      ).toBeCloseTo(8, 12);
    }
    expect(helicopterBladePitch(8, 3, Math.PI / 2)).toBeCloseTo(11, 12);
    expect(helicopterBladePitch(8, 3, Math.PI * 1.5)).toBeCloseTo(5, 12);
  });
  it('tail force uses the real longitudinal arm and exposes under- and over-compensation', () => {
    for (const tailBalance of [0, 0.5, 1, 1.4]) {
      const s = helicopterSolve({ collectiveDeg: 10, tailBalance });
      expect(s.tailForce * H.tailArm).toBeCloseTo(s.tailTorque, 9);
      expect(s.netYawTorque).toBeCloseTo((tailBalance - 1) * s.rotorTorque, 9);
    }
  });
  it('section angle separates mechanical pitch from the incoming relative wind', () => {
    const s = helicopterSolve({ collectiveDeg: 10 }),
      e = helicopterElement(10, s.induced, 0.75 * H.radius);
    expect(e.tangential).toBeCloseTo(H.omega * 0.75 * H.radius, 12);
    expect(e.alpha + e.inflowAngle).toBeCloseTo((10 * Math.PI) / 180, 12);
    expect(e.thrustPerMetre).toBeCloseTo(e.liftPerMetre * Math.cos(e.inflowAngle), 8);
  });
  it('rejects inputs outside the explicit teaching envelope', () => {
    for (const input of [
      { collectiveDeg: NaN },
      { collectiveDeg: 3.9 },
      { collectiveDeg: 13.1 },
      { collectiveDeg: 8, cyclicDeg: 4 },
      { collectiveDeg: 8, diskTiltDeg: 26 },
      { collectiveDeg: 8, tailBalance: -0.1 },
    ])
      expect(() => helicopterSolve(input)).toThrow();
    expect(() => helicopterCollectiveForThrust(1e7)).toThrow();
  });
  it('has deterministic complete causal states for every chapter and seek', () => {
    for (let chapter = 0; chapter < 7; chapter++)
      for (let j = 0; j <= 100; j++) {
        const progress = j / 100,
          a = helicopterShot(chapter, progress, chapter * 24 + progress * 24),
          b = helicopterShot(chapter, progress, chapter * 24 + progress * 24);
        expect(a).toEqual(b);
        expect(Number.isFinite(helicopterSolve(a).thrust)).toBe(true);
      }
    expect(helicopterShot(5, 0.4, 130).tailBalance).toBe(0);
    expect(helicopterShot(5, 1, 144).tailBalance).toBe(1);
    expect(helicopterSolve(helicopterShot(6, 1, 168)).verticalAcceleration).toBeCloseTo(0, 10);
  });
});
