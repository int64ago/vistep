import { describe, it, expect } from 'vitest';
import {
  LOCK as L,
  lockKeyProfile,
  lockContact,
  lockPose,
  lockInitial,
  lockCommand,
  lockRotate,
  lockSpring,
  lockShot,
  lockShear,
} from './lock';
describe('matching-key pin tumbler: connected geometry and intended operation', () => {
  it('gives six distinct bittings, one continuous profile and a tapered insertion tip', () => {
    expect(new Set(L.cuts).size).toBe(6);
    const p = lockKeyProfile('matching');
    expect(p.every((v, i) => i === 0 || v[0] > p[i - 1][0])).toBe(true);
    expect(p.at(-1)).toEqual([L.keyTip, L.keyBottom]);
    expect(L.keyHalfWidth).toBeLessThan(L.keywayHalfWidth);
    expect(Math.max(...p.map((v) => v[1]))).toBeLessThan(L.keywayTop);
  });
  it('solves flat and sloped rounded-tip contact analytically, not by center sampling', () => {
    const flat = lockContact(
      [
        [-1, 0],
        [1, 0],
      ],
      0,
      0,
    );
    expect(flat.tip).toBeCloseTo(0, 14);
    const c = lockContact(
      [
        [-1, -0.5],
        [1, 0.5],
      ],
      0,
      0,
    );
    expect(c.centerY).toBeCloseTo(L.pinRadius * Math.sqrt(1.25), 14);
    expect(c.contact[0]).toBeCloseTo((L.pinRadius * 0.5) / Math.sqrt(1.25), 14);
    expect(Math.hypot(c.contact[0], c.centerY - c.contact[1])).toBeCloseTo(L.pinRadius, 14);
  });
  it('has no key-tip penetration over every insertion, including profile corners', () => {
    for (const key of ['matching', 'high', 'low'] as const)
      for (let j = 0; j <= 150; j++) {
        const m = lockPose({ insertion: j / 150, requestedAngle: 0, key });
        for (const s of m.stacks) {
          for (let k = 0; k < m.profile.length - 1; k++)
            for (let a = 0; a <= 12; a++) {
              const p = m.profile[k],
                q = m.profile[k + 1],
                x = p[0] + ((q[0] - p[0]) * a) / 12 + m.offset,
                y = p[1] + ((q[1] - p[1]) * a) / 12;
              if (Math.abs(x - s.x) <= L.pinRadius)
                expect(
                  y + Math.sqrt(Math.max(0, L.pinRadius ** 2 - (x - s.x) ** 2)),
                ).toBeLessThanOrEqual(s.centerY + 1e-10);
            }
          if (s.supportedByKey)
            expect(Math.hypot(s.contact[0] - s.x, s.centerY - s.contact[1])).toBeCloseTo(
              L.pinRadius,
              12,
            );
        }
      }
  });
  it('complements each matching cut with its own immutable key-pin length', () => {
    const a = lockPose({ ...lockInitial(), insertion: 1 });
    expect(a.canTurn).toBe(true);
    expect(a.clearCount).toBe(6);
    a.stacks.forEach((s, i) => {
      expect(s.tip).toBeCloseTo(L.cuts[i], 13);
      expect(s.interfaceY).toBeCloseTo(L.radius, 13);
      expect(s.length).toBe(L.radius - L.cuts[i]);
    });
    for (const key of ['high', 'low'] as const) {
      const b = lockPose({ insertion: 1, requestedAngle: L.maxAngle, key });
      expect(b.angle).toBe(0);
      expect(b.clearCount).toBe(5);
      expect(b.blocked).toBe(true);
      expect(b.stacks[2].error).toBeCloseTo(key === 'high' ? 0.18 : -0.18, 13);
      expect(b.stacks.map((s) => s.length)).toEqual(a.stacks.map((s) => s.length));
    }
  });
  it('derives the clearance window from the plug envelope and housing bore', () => {
    expect(lockShear(0).clear).toBe(true);
    expect(lockShear(L.runningGap).clear).toBe(true);
    expect(lockShear(-0.001).clear).toBe(false);
    expect(lockShear(L.runningGap + 0.001).clear).toBe(false);
    const m = lockPose({ insertion: 1, requestedAngle: L.maxAngle, key: 'matching' });
    for (let a = 0; a <= 75; a++)
      for (let z = -12; z <= 12; z++) {
        const zz = (L.pinRadius * z) / 12,
          y = Math.sqrt(L.radius ** 2 - zz ** 2),
          v = lockRotate([0, y, zz], (a * Math.PI) / 180);
        expect(Math.hypot(v[1], v[2])).toBeCloseTo(L.radius, 13);
        expect(Math.hypot(v[1], v[2])).toBeLessThan(L.radius + L.runningGap);
      }
    expect(m.angle).toBe(L.maxAngle);
  });
  it('requires the declared shoulder-seated condition even when lands align slightly early', () => {
    const m = lockPose({ insertion: 0.999, requestedAngle: L.maxAngle, key: 'matching' });
    expect(m.clearCount).toBe(6);
    expect(m.seated).toBe(false);
    expect(m.canTurn).toBe(false);
    expect(m.angle).toBe(0);
  });
  it('keeps all spring ends seated, coil pitch positive and wire clear of the bores', () => {
    for (const key of ['matching', 'high', 'low'] as const)
      for (let i = 0; i <= 100; i++) {
        const m = lockPose({ insertion: i / 100, requestedAngle: 0, key });
        for (const s of m.stacks) {
          const a = lockSpring(s, 0),
            b = lockSpring(s, 1);
          expect(a[1] - L.wireRadius).toBeCloseTo(s.driverTop, 13);
          expect(b[1] + L.wireRadius).toBeCloseTo(L.springSeat, 13);
          expect((b[1] - a[1]) / L.coils).toBeGreaterThan(2 * L.wireRadius);
          expect(L.coilRadius + L.wireRadius).toBeLessThan(L.boreRadius);
          expect(s.interfaceY + L.driverLength).toBe(s.driverTop);
          expect(s.driverTop).toBeGreaterThan(L.radius);
        }
      }
  });
  it('rotates key and lower-pin contacts rigidly while drivers and spring seats stay fixed', () => {
    const a = lockPose({ insertion: 1, requestedAngle: 0, key: 'matching' }),
      b = lockPose({ insertion: 1, requestedAngle: L.maxAngle, key: 'matching' });
    a.stacks.forEach((s, i) => {
      expect(b.stacks[i]).toEqual(s);
      const c = lockRotate([s.contact[0], s.contact[1], 0], b.angle),
        v = lockRotate([s.x, s.centerY, 0], b.angle);
      expect(Math.hypot(c[0] - v[0], c[1] - v[1], c[2] - v[2])).toBeCloseTo(L.pinRadius, 12);
    });
  });
  it('does not exchange or retract a captive key, and resets every physical input', () => {
    const turned = { insertion: 1, requestedAngle: L.maxAngle, key: 'matching' as const };
    expect(lockCommand(turned, { type: 'insert', value: 0 })).toEqual(turned);
    expect(lockCommand(turned, { type: 'key', key: 'high' })).toEqual(turned);
    const home = lockCommand(turned, { type: 'turn', value: 0 }),
      withdrawn = lockCommand(home, { type: 'insert', value: 0 });
    expect(lockPose(withdrawn).clearCount).toBe(0);
    expect(lockCommand(withdrawn, { type: 'key', key: 'high' }).key).toBe('high');
    expect(lockCommand(turned, { type: 'reset' })).toEqual(lockInitial());
  });
  it('is continuous across insertion and direct seeking reconstructs all bodies', () => {
    let last = lockPose(lockInitial());
    for (let i = 1; i <= 1000; i++) {
      const next = lockPose({ ...lockInitial(), insertion: i / 1000 });
      next.stacks.forEach((s, k) =>
        expect(Math.abs(s.tip - last.stacks[k].tip)).toBeLessThan(0.03),
      );
      last = next;
    }
    const a = lockShot(2, 0.571);
    lockShot(6, 0.2);
    lockShot(0, 0);
    expect(lockShot(2, 0.571)).toEqual(a);
    for (let ch = 0; ch < 8; ch++)
      for (const p of [0, 0.3, 0.7, 1])
        expect(lockShot(ch, p).pose.stacks.every((s) => Number.isFinite(s.springBottom))).toBe(
          true,
        );
    expect(lockShot(5, 1).pose.angle).toBeCloseTo(lockShot(6, 0).pose.angle, 13);
    expect(lockShot(6, 1).pose).toMatchObject({ angle: 0, insertion: 1 });
    expect(lockShot(7, 1).pose).toMatchObject({ angle: 0, insertion: 0 });
  });
  it('rejects nonfinite or out-of-domain geometry instead of rendering impossible states', () => {
    for (const insertion of [NaN, Infinity, -0.1, 1.1])
      expect(() => lockPose({ ...lockInitial(), insertion })).toThrow();
    expect(() => lockPose({ ...lockInitial(), requestedAngle: Infinity })).toThrow();
    expect(() => lockKeyProfile('other' as 'matching')).toThrow();
    expect(() =>
      lockContact(
        [
          [1, 0],
          [0, 1],
        ],
        0,
        0,
      ),
    ).toThrow();
    expect(() => lockShot(NaN, 0)).toThrow();
    expect(() => lockSpring(lockPose(lockInitial()).stacks[0], 1.1)).toThrow();
  });
});
