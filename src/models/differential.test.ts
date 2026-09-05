import { describe, it, expect } from 'vitest';
import {
  DIFFERENTIAL as d,
  differentialMotion as motion,
  differentialTraction as traction,
  differentialPower,
  differentialPaths,
  differentialBevel as bevel,
  differentialContacts,
  differentialDot,
  differentialGearVelocity,
  differentialUnframe,
  differentialToothGap,
  differentialGearPhase,
  differentialGearPoint,
  differentialFrame,
  differentialGearAxis,
  differentialBevelOutline,
  differentialShot,
  type DifferentialGearId,
  type DifferentialVector,
} from './differential';
const ids: DifferentialGearId[] = ['right', 'left', 'upper', 'lower'];
describe('open differential: conical contacts, kinematics and declared torque capacity', () => {
  it('enforces mean speed in straight, turning, held-wheel, reversed and zero-input cases', () => {
    for (const mode of ['straight', 'turn', 'left-held', 'carrier-held'] as const)
      for (const speed of [-2, 0, 0.9, 2])
        for (const radius of [0.8, 1, 2, 100]) {
          const m = motion(mode, speed, 6.23, radius);
          expect(m.leftRate + m.rightRate).toBeCloseTo(2 * m.carrierRate, 13);
          expect(m.leftAngle + m.rightAngle).toBeCloseTo(2 * m.carrierAngle, 12);
          expect(m.pinionRate).toBeCloseTo(-1.5 * m.differenceRate, 13);
        }
  });
  it('separates carriage orbit from pinion spin and reproduces limiting constraints', () => {
    expect(motion('straight', 1, 4).pinionRate).toBeCloseTo(0, 14);
    expect(motion('left-held', 1, 4).leftRate).toBe(0);
    expect(motion('left-held', 1, 4).rightRate).toBe(2);
    expect(motion('carrier-held', 1, 4).leftRate).toBe(-1);
    expect(motion('carrier-held', 1, 4).rightRate).toBe(1);
  });
  it('derives both circular paths and their lengths from one yaw, track and radius', () => {
    for (const radius of [0.8, 1, 2, 10])
      for (const turn of [-1, 1]) {
        const m = motion('turn', 0.9, 6, radius, turn),
          path = differentialPaths(m, 401);
        for (const pt of path)
          expect(Math.hypot(pt.left[0] - pt.right[0], pt.left[1] - pt.right[1])).toBeCloseTo(
            d.track,
            12,
          );
        const length = (key: 'left' | 'right') =>
          path
            .slice(1)
            .reduce(
              (v, p, i) => v + Math.hypot(p[key][0] - path[i][key][0], p[key][1] - path[i][key][1]),
              0,
            );
        expect(length('left')).toBeCloseTo(m.leftDistance, 5);
        expect(length('right')).toBeCloseTo(m.rightDistance, 5);
      }
  });
  it('has a common apex, perpendicular axes, complementary cones and equal tapered circular pitch', () => {
    const s = bevel('side'),
      p = bevel('pinion');
    expect(s.pitch + p.pitch).toBeCloseTo(Math.PI / 2, 14);
    for (const r of [d.coneInner, 1.1, d.coneOuter])
      expect((2 * Math.PI * r * Math.sin(s.pitch)) / s.teeth).toBeCloseTo(
        (2 * Math.PI * r * Math.sin(p.pitch)) / p.teeth,
        14,
      );
    for (const c of [0, 0.8, 4.2])
      for (const side of ['left', 'right'] as const)
        for (const pin of ['upper', 'lower'] as const)
          expect(
            differentialDot(differentialGearAxis(side, c), differentialGearAxis(pin, c)),
          ).toBeCloseTo(0, 14);
  });
  it('maintains analytic flank contact and normal-velocity compatibility through a complete tooth cycle', () => {
    const p = bevel('pinion');
    for (let i = 0; i <= 180; i++) {
      const angle = (i * 2 * Math.PI) / 24 / 180,
        contacts = differentialContacts(angle);
      expect(contacts.length).toBeGreaterThan(0);
      const m = motion('turn', 1, angle / 0.4, 2);
      for (const c of contacts) {
        const local = differentialUnframe(c.point, 'upper');
        expect(Math.abs(differentialToothGap(p, local, m.pinionAngle))).toBeLessThan(1e-10);
        const va = differentialGearVelocity(c.point, 'right', { ...m, carrierAngle: 0 }),
          vb = differentialGearVelocity(c.point, 'upper', { ...m, carrierAngle: 0 });
        const relative = va.map((v, i) => v - vb[i]) as DifferentialVector;
        expect(Math.abs(differentialDot(c.normal, relative))).toBeLessThan(1e-11);
      }
    }
  });
  it('does not put sampled active flank vertices inside any mating tooth in all four meshes', () => {
    for (let i = 0; i <= 72; i++) {
      const m = motion('turn', 1, (i * 0.263) / 72 / 0.4, 2);
      for (const side of ['left', 'right'] as const)
        for (const pin of ['upper', 'lower'] as const)
          for (const [from, to] of [
            [side, pin],
            [pin, side],
          ]) {
            const g = bevel(from === 'left' || from === 'right' ? 'side' : 'pinion'),
              other = bevel(to === 'left' || to === 'right' ? 'side' : 'pinion');
            for (let k = 0; k < g.teeth; k++)
              for (const flank of [-1, 1])
                for (let j = 0; j <= 8; j++) {
                  const start = Math.max(g.base, g.root),
                    polar = start + ((g.tip - start) * j) / 8,
                    point = differentialGearPoint(g, polar, k, flank, 1.1, from, m),
                    local = differentialUnframe(point, to, m.carrierAngle);
                  if (local[2] <= 0) continue;
                  const po = Math.acos(local[2] / Math.hypot(...local));
                  if (po < other.root || po > other.tip) continue;
                  expect(
                    differentialToothGap(other, local, differentialGearPhase(to, m)),
                  ).toBeGreaterThan(-1e-9);
                }
          }
    }
  });
  it('uses proper orthonormal gear frames and keeps shafts inside hubs and clear of the crossing pin', () => {
    for (const id of ids)
      for (const carrier of [0, 0.7, 4]) {
        const local: DifferentialVector = [0.3, -0.4, 1.1];
        differentialUnframe(differentialFrame(local, id, carrier), id, carrier).forEach((v, i) =>
          expect(v).toBeCloseTo(local[i], 12),
        );
      }
    expect(d.shaftRadius).toBe(d.bore);
    expect(d.axleStart).toBeGreaterThan(d.shaftRadius);
    expect(d.pinEnd).toBeLessThan(d.carrierRadius + 0.05);
    for (const g of [bevel('side'), bevel('pinion')]) {
      const outline = differentialBevelOutline(g);
      expect(
        outline.every((p) => Number.isFinite(p.azimuth) && p.polar >= g.root && p.polar <= g.tip),
      ).toBe(true);
      expect(g.inner).toBeLessThan(g.outer);
    }
  });
  it('transmits equal side torque capped by the weaker permitted reaction, without inventing spin speeds', () => {
    expect(traction(400, 300, 300)).toMatchObject({
      sideTorque: 200,
      acceptedCarrier: 400,
      limited: false,
    });
    expect(traction(400, 60, 300)).toMatchObject({
      sideTorque: 60,
      acceptedCarrier: 120,
      unusedRequest: 280,
      limited: true,
    });
    expect(traction(400, 0, 300).acceptedCarrier).toBe(0);
    expect(traction(0, 300, 300).sideTorque).toBe(0);
  });
  it('balances ideal input and side powers even with unequal or opposing output speeds', () => {
    for (const mode of ['straight', 'turn', 'left-held', 'carrier-held'] as const)
      for (const speed of [-1, 0, 1]) {
        const m = motion(mode, speed, 3),
          p = differentialPower(m, 120);
        expect(p.left + p.right).toBeCloseTo(p.input, 12);
      }
  });
  it('reconstructs chapters and backward seeks from absolute input without history', () => {
    const before = differentialShot(2, 0.427);
    differentialShot(6, 0.9);
    differentialShot(0, 0.1);
    expect(differentialShot(2, 0.427)).toEqual(before);
    const low = differentialShot(6, 0.9);
    expect(low.motion).toEqual(differentialShot(5, 0.9).motion);
    expect(low.load.sideTorque).toBe(60);
  });
  it('integrates the mean-speed sweep analytically and excludes bench constraints from road traces', () => {
    for (const q of [0.1, 0.3, 0.7, 0.9]) {
      const h = 1e-5,
        a = differentialShot(3, q - h).motion,
        b = differentialShot(3, q + h).motion,
        m = differentialShot(3, q).motion;
      expect((b.leftAngle - a.leftAngle) / (16 * h)).toBeCloseTo(m.leftRate, 8);
      expect((b.rightAngle - a.rightAngle) / (16 * h)).toBeCloseTo(m.rightRate, 8);
      expect(m.leftRate + m.rightRate).toBeCloseTo(1.8, 12);
    }
    expect(() => differentialPaths(motion('left-held', 1, 2))).toThrow();
  });
  it('rejects nonfinite, negative capacity and impossible no-reversal turning radii', () => {
    expect(() => motion('turn', 1, 1, 0.79)).toThrow();
    expect(() => motion('turn', NaN, 1)).toThrow();
    expect(() => traction(-1, 1, 1)).toThrow();
    expect(() => traction(1, Infinity, 1)).toThrow();
  });
});
