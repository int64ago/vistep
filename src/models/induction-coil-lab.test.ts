import { describe, it, expect } from 'vitest';
import {
  dipoleFlux,
  dipoleFluxDerivative,
  coilInduction,
  magnetMotion,
  fallingMagnet,
  fallTrace,
  discGenerator,
  discRadial,
  ringResponse,
  ringGeometry,
  coilPoint,
  inductionDirector,
  TEXTBOOK_DIRECTIONS,
  initialInduction,
  RING,
} from './induction-coil-lab';
describe('induction: one physical state and independent comparisons', () => {
  it('agrees with the analytic on-axis loop flux and a central numerical derivative', () => {
    expect(dipoleFlux(0, 0.03, 0.025)).toBeCloseTo((2 * Math.PI * 1e-7 * 0.03) / 0.025, 12);
    for (const z of [-0.07, -0.01, 0, 0.025, 0.1]) {
      const h = 1e-7;
      expect(dipoleFluxDerivative(z)).toBeCloseTo(
        (dipoleFlux(z + h) - dipoleFlux(z - h)) / (2 * h),
        9,
      );
    }
  });
  it('matches all four independently recorded textbook directions', () => {
    for (const r of TEXTBOOK_DIRECTIONS) {
      const s = coilInduction({ z: 0.04, velocity: r.velocity * 0.1, moment: -r.pole * 0.03 });
      expect(Math.sign(s.flux)).toBe(r.field);
      expect(Math.sign(s.current)).toBe(r.current);
    }
    expect(Object.isFrozen(TEXTBOOK_DIRECTIONS[0])).toBe(true);
  });
  it('can have nonzero flux at rest and emf without a closed current', () => {
    const still = coilInduction({ velocity: 0 });
    expect(still.flux).not.toBe(0);
    expect(still.emf).toBe(0);
    const open = coilInduction({ closed: false });
    expect(open.emf).not.toBe(0);
    expect(open.current).toBe(0);
    expect(open.magnetForce).toBe(0);
  });
  it('position and velocity share the same clock, including all stationary holds', () => {
    for (const t of [0.4, 1.5, 2.4, 3.5, 4.5, 5.6, 7]) {
      const h = 1e-5;
      expect(magnetMotion(t).velocity).toBeCloseTo(
        (magnetMotion(t + h).z - magnetMotion(t - h).z) / (2 * h),
        8,
      );
    }
    for (const t of [0, 1, 3, 4, 6, 8]) expect(magnetMotion(t).velocity).toBe(0);
  });
  it('balances electrical heat and opposing mechanical power in either direction', () => {
    for (const z of [-0.08, -0.02, 0.02, 0.08])
      for (const v of [-0.4, 0.2]) {
        const s = coilInduction({ z, velocity: v });
        expect(s.externalPower).toBeCloseTo(s.heatPower, 12);
        expect(s.magnetForce * v).toBeLessThan(0);
      }
  });
  it('uses one trajectory for the doubled winding, with no peak clipping', () => {
    const a = fallTrace(0.26, 80),
      b = fallTrace(0.26, 160);
    a.forEach((p, i) => {
      expect(b[i]!.time).toBe(p.time);
      expect(b[i]!.z).toBe(p.z);
      expect(b[i]!.emf).toBeCloseTo(2 * p.emf, 12);
    });
    expect(Math.min(...a.map((p) => p.emf))).toBeLessThan(0);
    expect(Math.max(...a.map((p) => p.emf))).toBeGreaterThan(0);
  });
  it('predicts greater speed at the SAME position after a higher release', () => {
    const z = 0.025,
      a = fallingMagnet(Math.sqrt((2 * (0.1 - z)) / 9.8), 0.1),
      b = fallingMagnet(Math.sqrt((2 * (0.26 - z)) / 9.8), 0.26);
    expect(a.z).toBeCloseTo(b.z, 12);
    expect(Math.abs(b.velocity)).toBeGreaterThan(Math.abs(a.velocity));
    expect(b.emf / a.emf).toBeCloseTo(b.velocity / a.velocity, 10);
    expect(a.current).toBe(0);
  });
  it('stops at the lower catch and stays finite for nonfinite or extreme accepted inputs', () => {
    expect(fallingMagnet(3).emf).toBe(0);
    for (const q of [NaN, Infinity, -Infinity, 1e300, -1e300])
      for (const o of [
        coilInduction({ z: q, velocity: q, moment: q, turns: q, resistance: q, radius: q }),
        fallingMagnet(q, q, q),
        discGenerator(q, q, q, q),
      ])
        for (const v of Object.values(o))
          if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
  });
  it('computes 19.2 mV at 20 rad/s and radial contributions independent of drawing', () => {
    const d = discGenerator(20);
    expect(d.emf).toBeCloseTo(0.0192, 12);
    expect(d.current).toBeCloseTo(0.00384, 12);
    expect(d.mechanicalPower).toBeCloseTo(0.000073728, 12);
    expect(discRadial(20, 0.3, 0.04).axisToRadius).toBeCloseTo(d.emf / 4, 12);
    expect(discRadial(20, 0.3, 0.04).speed).toBeCloseTo(0.8, 12);
  });
  it('reverses polarity, stops, and opens a disc circuit without removing emf', () => {
    expect(discGenerator(-20).emf).toBe(-discGenerator(20).emf);
    expect(discGenerator(0).emf).toBe(0);
    const d = discGenerator(20, 0.3, 0.08, 5, false);
    expect(d.emf).toBe(0.0192);
    expect(d.current).toBe(0);
    expect(d.mechanicalPower).toBe(0);
  });
  it('uses physical ring feedback and conserves instantaneous coupling power', () => {
    for (const t of [1.5, 2, 2.5, 4.5, 5, 5.5]) {
      const s = ringResponse(t);
      expect(s.z).toBeCloseTo(s.magnetZ + s.x, 14);
      expect(s.velocity).toBeCloseTo(s.magnetVelocity + s.ringVelocity, 14);
      expect(s.drivePower - s.ringPower).toBeCloseTo(s.heatPower, 14);
    }
    expect(ringResponse(2).force).toBeGreaterThan(0);
    expect(ringResponse(5).force).toBeLessThan(0);
  });
  it('does not send a visual gain into flux; a split ring has no circulating force', () => {
    const a = ringGeometry(2, true, 1, 1),
      b = ringGeometry(2, true, 1, 200);
    expect(a.emf).toBe(b.emf);
    expect(b.angle).toBe(a.angle * 200);
    expect(Math.hypot(b.center.x, b.center.y)).toBeCloseTo(118, 10);
    expect(Math.hypot(b.top.x, b.top.y)).toBeCloseTo(118 - (0.025 * 118) / 0.14, 10);
    const s = ringResponse(2, false);
    expect(s.emf).not.toBe(0);
    expect(s.x).toBe(0);
    expect(s.force).toBe(0);
  });
  it('does not change a cached earlier response when time is replayed backwards', () => {
    const a = ringResponse(2);
    ringResponse(7);
    expect(ringResponse(2)).toEqual(a);
  });
  it('winding and leads share exactly two terminal coordinates', () => {
    expect(coilPoint(0, 88, 119, 40, 10, 32)).toMatchObject({ x: 128, y: 119 });
    expect(coilPoint(1, 88, 119, 40, 10, 32).x).toBeCloseTo(128, 12);
    expect(coilPoint(1, 88, 119, 40, 10, 32).y).toBeCloseTo(151, 12);
  });
  it('holds a new condition before revealing it and can rewind without exposing the answer', () => {
    for (const c of [2, 4, 6]) {
      expect(inductionDirector(c, 0, 2).predict).toBe(true);
      expect(inductionDirector(c, 0.8, 22).predict).toBe(false);
      expect(inductionDirector(c, 0, 2).reveal).toBe(false);
    }
  });
  it('stops at the spoken stop clause and integrates the angular rate continuously', () => {
    for (const locale of ['zh', 'en'] as const) {
      const shot = (t: number) => inductionDirector(8, 0, t, locale),
        a = shot(5.3),
        b = shot(6.2);
      expect(a.omega).toBe(0);
      expect(b.omega).toBe(0);
      expect(a.discAngle).toBe(b.discAngle);
      for (const t of [3, 4.3, 4.6, 5.5, 6.95, 7.3, 8, 13]) {
        const dt = 1e-5;
        expect((shot(t + dt).discAngle - shot(t - dt).discAngle) / (2 * dt)).toBeCloseTo(
          shot(t).omega,
          6,
        );
      }
      expect(shot(13).view).toBe('power');
    }
  });
  it('keeps the visible mechanism aligned with measured retained phrases in both languages', () => {
    for (const lang of ['zh', 'en'] as const) {
      const s = (c: number, t: number) => inductionDirector(c, 0, t, lang);
      expect(s(0, 7).view).toBe('flux');
      expect(magnetMotion(s(1, 8.5).time).velocity).toBe(0);
      expect(s(1, 10).replay).toBe(true);
      expect(ringResponse(s(3, 4.5).time).force).toBeGreaterThan(0);
      expect(ringResponse(s(3, 7).time).force).toBeLessThan(0);
      const cut = ringResponse(s(4, 6).time, false);
      expect(cut.emf).not.toBe(0);
      expect(cut.current).toBe(0);
      expect(s(4, 6).view).toBe('response');
      expect(s(5, 2).height).toBe(0.1);
      expect(s(5, 3).height).toBe(0.26);
      expect(s(5, 7).view).toBe('trace');
      expect(s(6, 6).view).toBe('trace');
      expect(s(6, 6).reveal).toBe(false);
      const paired = s(6, 13);
      expect(paired.compare).toBe(true);
      expect(paired.reveal).toBe(true);
      const a = fallingMagnet(paired.time, paired.height, 80),
        b = fallingMagnet(paired.time, paired.height, 160);
      expect(Math.abs(a.emf)).toBeGreaterThan(1e-4);
      expect(b.emf).toBeCloseTo(2 * a.emf, 12);
      expect(s(7, 5).view).toBe('radial');
      expect(s(7, 9).view).toBe('apparatus');
      expect(s(7, 15).view).toBe('radial');
    }
  });
  it('uses finite replayable local states without changing any model trajectory', () => {
    for (const lang of ['zh', 'en'] as const)
      for (let c = 0; c < 9; c++)
        for (const t of [0, 2, 5, 8, 13, 20, 26, NaN, Infinity]) {
          const a = inductionDirector(c, 0, t, lang);
          inductionDirector(c, 1, 26, lang);
          expect(inductionDirector(c, 0, t, lang)).toEqual(a);
          expect([a.time, a.discAngle, a.omega, a.height].every(Number.isFinite)).toBe(true);
        }
  });
  it('preserves every textbook apparatus mapping', () => {
    expect(initialInduction('e2-lenz-magnet-coil')).toBe('coil');
    expect(initialInduction('e2-lenz-aluminium-ring')).toBe('ring');
    expect(initialInduction('e2-faraday-falling-magnet')).toBe('fall');
    for (const id of ['e2-faraday-disc', 'r3-faraday-disc'])
      expect(initialInduction(id)).toBe('disc');
  });
  it('integrated drive work pays for heating, damping and pendulum energy', () => {
    let drive = 0,
      heat = 0,
      damping = 0;
    const count = 4096,
      dt = 8 / count;
    for (let i = 0; i <= count; i++) {
      const s = ringResponse(i * dt),
        q = (i === 0 || i === count ? 0.5 : 1) * dt;
      drive += q * s.drivePower;
      heat += q * s.heatPower;
      damping += q * RING.damping * s.omega * s.omega;
    }
    const s = ringResponse(8),
      energy =
        0.5 * RING.mass * RING.length ** 2 * s.omega ** 2 +
        RING.mass * 9.8 * RING.length * (1 - Math.cos(s.theta));
    expect(drive).toBeGreaterThan(0);
    expect(Math.abs(drive - heat - damping - energy) / drive).toBeLessThan(2e-5);
  });
});
