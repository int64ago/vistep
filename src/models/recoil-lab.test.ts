import { describe, it, expect } from 'vitest';
import {
  balloonRecoil,
  balloonParcel,
  rotorGeometry,
  rotorRates,
  waterRotorTrajectory,
  sampleRotor,
  rotorOutlet,
  waterParcel,
  ROTOR,
} from './recoil-lab';
describe('linear and angular recoil', () => {
  it('balloon mass flux, radius and momentum are mutually consistent', () => {
    const s = balloonRecoil(1);
    expect(s.gas + s.flow * s.time).toBeCloseTo(0.003, 12);
    expect(((4 * Math.PI * s.radius ** 3) / 3) * 1.2).toBeCloseTo(s.gas, 12);
    expect(s.momentum + s.gasMomentum).toBeCloseTo(0, 12);
  });
  it('balloon position derivative is its variable-mass velocity', () => {
    const h = 1e-5,
      t = 1,
      s = balloonRecoil(t);
    expect((balloonRecoil(t + h).x - balloonRecoil(t - h).x) / (2 * h)).toBeCloseTo(s.v, 7);
    expect((balloonRecoil(t + h).v - balloonRecoil(t - h).v) / (2 * h)).toBeCloseTo(
      s.thrust / s.mass,
      7,
    );
  });
  it('gas parcels use absolute exhaust velocity and originate at the nozzle', () => {
    const s = balloonRecoil(1),
      p = balloonParcel(1, 1);
    expect(p.x).toBeCloseTo(s.x - s.radius - 0.018);
    expect(p.vx).toBeCloseTo(s.v - s.exhaust);
  });
  it('static conical water geometry reduces to familiar volume and inertia', () => {
    const s = rotorGeometry(0.072, 0);
    expect(s.volume).toBeCloseTo((Math.PI * 0.072 ** 2 * 0.2) / 3);
    expect(s.waterInertia).toBeCloseTo(0.3 * s.mass * 0.072 ** 2);
  });
  it('rotor mass change equals discharge and angular change equals opposite outgoing flux', () => {
    const r = 0.068,
      w = 4,
      q = rotorRates(r, w),
      h = 1e-6,
      a = rotorGeometry(r + h * q.radialRate, w + h * q.alpha),
      b = rotorGeometry(r - h * q.radialRate, w - h * q.alpha);
    expect((a.mass - b.mass) / (2 * h)).toBeCloseTo(-q.flow, 7);
    expect((a.inertia * (w + h * q.alpha) - b.inertia * (w - h * q.alpha)) / (2 * h)).toBeCloseTo(
      -q.escapedRate,
      7,
    );
  });
  it('integrated rotor plus expelled water conserves angular momentum with changing water level', () => {
    const path = waterRotorTrajectory();
    for (const time of [0, 1, 3, 6]) {
      const s = sampleRotor(path, time);
      expect(s.angularMomentum + s.escapedAngularMomentum).toBeCloseTo(0, 9);
      expect(s.centerHeight).toBeGreaterThan(0);
      expect(s.edgeHeight).toBeLessThan(ROTOR.height);
    }
    expect(sampleRotor(path, 6).mass).toBeLessThan(path.samples[0].mass);
  });
  it('reversing bends reverses rotation and jets but preserves drainage', () => {
    const a = sampleRotor(waterRotorTrajectory(), 4),
      b = sampleRotor(waterRotorTrajectory(undefined, -1), 4);
    expect(a.mass).toBeCloseTo(b.mass);
    expect(a.omega).toBeCloseTo(-b.omega);
    expect(a.angle).toBeCloseTo(-b.angle);
  });
  it('opposite outlets have zero net linear flux and nonzero angular flux', () => {
    const path = waterRotorTrajectory(),
      s = sampleRotor(path, 2),
      a = rotorOutlet(s, 0),
      b = rotorOutlet(s, 1);
    expect(a.vx + b.vx).toBeCloseTo(0);
    expect(a.vy + b.vy).toBeCloseTo(0);
    expect(a.x * a.vy - a.y * a.vx).toBeCloseTo(ROTOR.nozzleRadius * s.absoluteTangential);
    const p = waterParcel(path, 2, 2);
    expect(p.x).toBeCloseTo(a.x);
    expect(p.z).toBeCloseTo(ROTOR.nozzleHeight);
  });
});
