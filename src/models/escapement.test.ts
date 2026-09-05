import { describe, it, expect } from 'vitest';
import {
  ESC,
  ESC_PALLETS,
  escWorld,
  escapementCamera,
  escapementEnergy,
  escapementImpulse,
  escapementInitial,
  escapementPeriod,
  escapementPose,
  escapementShot,
  escapementTooth,
  escapementWheelOutline,
  type EscPoint,
} from './escapement';
const cross = (a: EscPoint, b: EscPoint, c: EscPoint) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function intersectionArea(polygon: EscPoint[], triangle: EscPoint[]) {
  let out = polygon;
  const sign = Math.sign(cross(triangle[0], triangle[1], triangle[2]));
  for (let k = 0; k < 3; k++) {
    const a = triangle[k],
      b = triangle[(k + 1) % 3],
      input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const p = input[i],
        q = input[(i + 1) % input.length],
        fp = cross(a, b, p) * sign,
        fq = cross(a, b, q) * sign;
      if (fp >= 0) out.push(p);
      if (fp > 0 !== fq > 0) {
        const f = fp / (fp - fq);
        out.push([p[0] + f * (q[0] - p[0]), p[1] + f * (q[1] - p[1])]);
      }
    }
  }
  return (
    Math.abs(
      out.reduce((s, p, i) => {
        const q = out[(i + 1) % out.length];
        return s + p[0] * q[1] - p[1] * q[0];
      }, 0),
    ) / 2
  );
}
describe('Graham deadbeat contact geometry', () => {
  it('derives the 30-tooth pitch, 7.5-pitch span and both circular locking faces', () => {
    expect(ESC.pitch * 30).toBeCloseTo(2 * Math.PI, 12);
    expect(7.5 * ESC.pitch).toBeCloseTo(Math.PI / 2, 12);
    for (const p of ESC_PALLETS)
      for (const point of p.lock) expect(Math.hypot(...point)).toBeCloseTo(p.radius, 12);
  });
  it('has continuous corner-to-discharge contact on each planar impulse face', () => {
    for (const side of [0, 1] as const)
      for (let i = 0; i <= 100; i++) {
        const anchor = ESC.halfLift * (1 - (2 * i) / 100) * (side ? -1 : 1),
          c = escapementImpulse(side, anchor);
        expect(Math.hypot(...c.point)).toBeCloseTo(ESC.radius, 12);
        expect(c.fraction).toBeGreaterThanOrEqual(-1e-10);
        expect(c.fraction).toBeLessThanOrEqual(1 + 1e-10);
        expect(
          cross(
            escWorld(ESC_PALLETS[side].corner, anchor),
            escWorld(ESC_PALLETS[side].discharge, anchor),
            c.point,
          ),
        ).toBeCloseTo(0, 12);
        if (i === 0) expect(c.wheel).toBeCloseTo((side * ESC.pitch) / 2, 12);
        if (i === 100) expect(c.wheel).toBeCloseTo((side * ESC.pitch) / 2 + ESC.lift, 12);
      }
  });
  it('sweeps full finite tooth outlines against both pallet outlines at all valid swing limits', () => {
    let maximum = 0;
    for (const amp of [3, 4, 5])
      for (let f = 0; f <= 600; f++) {
        const p = escapementPose(f / 600, amp),
          polys = ESC_PALLETS.map((q) => q.outline.map((v) => escWorld(v, p.anchor)));
        for (let i = 0; i < 30; i++) {
          const tooth = escapementTooth(i, p.wheel);
          for (const poly of polys) maximum = Math.max(maximum, intersectionArea(poly, tooth));
        }
      }
    // Circular faces use 96 render segments; tolerance covers sub-micron chord error in display units.
    expect(maximum).toBeLessThan(1e-8);
  });
  it('locks without recoil, releases twice, and preserves tooth identity at wrap', () => {
    for (const amp of [3, 4, 5]) {
      let last = -1;
      const kinds = new Set<string>(),
        sides = new Set<number>();
      for (let i = 0; i <= 1000; i++) {
        const p = escapementPose(i / 1000, amp);
        expect(p.wheel).toBeGreaterThanOrEqual(last - 1e-12);
        last = p.wheel;
        kinds.add(p.kind);
        sides.add(p.side);
        if (p.kind === 'lock' && p.contact) {
          const radius = Math.hypot(p.contact[0], p.contact[1] - ESC.height);
          expect(radius).toBeCloseTo(ESC_PALLETS[p.side].radius, 10);
        }
      }
      expect([...kinds].sort()).toEqual(['drop', 'impulse', 'lock']);
      expect(sides.size).toBe(2);
    }
    const before = escapementPose(1 - 1e-9),
      after = escapementPose(1);
    expect(after.tooth).toBe(before.tooth);
    expect(after.wheel).toBeCloseTo(before.wheel, 10);
    expect(after.countedSteps).toBe(2);
  });
  it('has no wheel jumps at locking, lift, drop or cycle boundaries', () => {
    const p = escapementPose(0);
    for (const f of [
      p.entryStart,
      p.entryEnd,
      p.entryEnd + ESC.dropPhase,
      0.5 + p.entryStart,
      0.5 + p.entryEnd,
      0.5 + p.entryEnd + ESC.dropPhase,
      1,
    ])
      expect(
        Math.abs(escapementPose(f + 1e-8).wheel - escapementPose(f - 1e-8).wheel),
      ).toBeLessThan(1e-6);
  });
  it('keeps a joined pendulum and weight cord at finite endpoints', () => {
    for (const length of [0.7, 1.2])
      for (const c of [0, 0.25, 0.5, 0.75, 4]) {
        const p = escapementPose(c, 5, length);
        expect(Math.hypot(p.bob[0], p.bob[1] - ESC.height)).toBeCloseTo(3 * length, 12);
        expect(p.weightTop).toBeCloseTo(-0.5 - ESC.drumRadius * p.wheel, 12);
      }
  });
});
describe('separate declared small-angle energy model', () => {
  it('matches the analytic undamped limit and length period scaling', () => {
    for (const time of [0, 0.2, 2, 26, 120]) {
      const e = escapementEnergy(time, 0, 1, 0);
      expect(e.energy).toBeCloseTo(e.initial, 12);
      expect(e.loss).toBeCloseTo(0, 12);
    }
    expect(escapementPeriod(1.2) / escapementPeriod(0.7)).toBeCloseTo(Math.sqrt(1.2 / 0.7), 12);
  });
  it('dissipates monotonically without drive and balances the energy ledger', () => {
    for (const drive of [0, 0.5, 1, 1.5]) {
      let loss = 0,
        energy = Infinity;
      for (let i = 0; i <= 1000; i++) {
        const e = escapementEnergy(i * 0.026, drive);
        expect(e.energy + e.loss).toBeCloseTo(e.initial + e.input, 12);
        expect(e.loss).toBeGreaterThanOrEqual(loss - 1e-12);
        loss = e.loss;
        if (drive === 0) expect(e.energy).toBeLessThanOrEqual(energy + 1e-12);
        energy = e.energy;
      }
    }
  });
  it('adds precisely Q at centre crossings while preserving the velocity direction', () => {
    const first = escapementEnergy(0);
    for (let n = 1; n < 20; n++) {
      const a = escapementEnergy(n * first.half - 1e-8),
        b = escapementEnergy(n * first.half + 1e-8);
      expect(b.energy - a.energy).toBeCloseTo(b.work, 8);
      expect(Math.sign(a.velocity)).toBe(Math.sign(b.velocity));
      expect(b.angle).toBeCloseTo(0, 7);
      expect(b.energy).toBeCloseTo(b.initial, 8);
    }
  });
  it('obeys viscous power loss between impulses', () => {
    const t = 0.37,
      dt = 1e-5,
      e = escapementEnergy(t, 0),
      derivative =
        (escapementEnergy(t + dt, 0).energy - escapementEnergy(t - dt, 0).energy) / (2 * dt);
    expect(derivative).toBeCloseTo(-2 * ESC.damping * ESC.mass * e.velocity ** 2, 9);
  });
});
describe('rendered solid connections', () => {
  it('uses a closed rim with exactly the same thirty working tooth tips', () => {
    const outline = escapementWheelOutline();
    expect(outline).toHaveLength(270);
    for (let i = 0; i < 30; i++) expect(outline[i * 9 + 1]).toEqual(escapementTooth(i, 0)[0]);
  });
  it('joins pallet studs behind the tooth plane and clears the drum from the bearing', () => {
    expect(ESC.palletStudFront).toBeLessThan(-ESC.wheelHalfDepth);
    expect(ESC.palletStudFront).toBeGreaterThan(-ESC.palletHalfDepth);
    expect(ESC.palletStudBack).toBeLessThan(-0.29 + 0.065);
    expect(ESC.drumZ - 0.14 - 0.025).toBeGreaterThan(ESC.bearingFront);
    expect(ESC.drumZ + 0.14 + 0.025).toBeLessThan(-ESC.wheelHalfDepth);
  });
});
describe('director and projection boundaries', () => {
  it('reconstructs all chapters and manual reset without history', () => {
    for (let ch = 0; ch < 8; ch++) {
      const a = escapementShot(ch, 0.71);
      escapementShot(7 - ch, 0.01);
      expect(escapementShot(ch, 0.71)).toEqual(a);
    }
    const a = escapementInitial();
    a.cycles = 3;
    a.time = 26;
    a.drive = 0;
    expect(escapementInitial()).toEqual({
      cycles: 0,
      amplitude: 4,
      length: 1,
      drive: 1,
      time: 0,
      view: 'mechanism',
    });
  });
  it('keeps malformed and boundary inputs finite', () => {
    for (const x of [NaN, Infinity, -Infinity, -1, 0, 60, 1e9]) {
      for (const out of [
        escapementPose(x, x, x),
        escapementEnergy(x, x, x, x),
        escapementShot(x, x),
      ])
        expect(JSON.stringify(out)).not.toContain('null');
    }
  });
  it('projects all full assembly corners within margin on desktop and narrow cameras', () => {
    const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
    for (const aspect of [0.65, 0.83, 1.6, 2.5])
      for (const focus of ['overview', 'lock', 'entry', 'exit'])
        for (const p of [0, 0.5, 1]) {
          const c = escapementCamera(aspect, focus, p);
          expect(dot(c.direction, c.up)).toBeCloseTo(0, 12);
          for (const corner of c.bounds) {
            const v = corner.map((x, i) => x - c.target[i]),
              depth = c.distance - dot(v, c.direction);
            expect(Math.abs((dot(v, c.right) * c.cot) / (aspect * depth))).toBeLessThanOrEqual(
              0.85000001,
            );
            expect(Math.abs((dot(v, c.up) * c.cot) / depth)).toBeLessThanOrEqual(0.85000001);
          }
        }
  });
});
