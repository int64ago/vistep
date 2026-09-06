import { describe, expect, it } from 'vitest';
import {
  EXCAVATOR,
  circleJoint,
  distance,
  excavatorHydraulics,
  excavatorPose,
  excavatorShot,
  integrateBoom,
  joystickCommand,
  leverArm,
  pistonArea,
  EXCAVATOR_CHAPTERS,
  JOYSTICK_FLOW,
} from './excavator';
import { excavatorDrawing } from './excavator-drawing';

const poses = function* () {
  const L = EXCAVATOR.limits;
  for (let boom = L.boom[0]; boom <= L.boom[1] + 1e-9; boom += 0.08)
    for (let stick = L.stick[0]; stick <= L.stick[1] + 1e-9; stick += 0.1)
      for (let curl = L.curl[0]; curl <= L.curl[1] + 1e-9; curl += 0.1) yield { boom, stick, curl };
};

describe('excavator linkage geometry', () => {
  it('keeps every piston inside its barrel with rod overlap over the whole pose range', () => {
    for (const pose of poses()) {
      const p = excavatorPose(pose);
      for (const cyl of Object.values(p.cylinders)) {
        expect(cyl.stroke).toBeGreaterThan(0.05);
        expect(cyl.stroke).toBeLessThan(1);
        expect(cyl.length - cyl.spec.barrel).toBeGreaterThan(0.05);
      }
    }
  });
  it('closes the bucket four-bar with fixed rocker and link lengths', () => {
    for (const pose of poses()) {
      const p = excavatorPose(pose);
      expect(distance(p.rockerPin, p.joint)).toBeCloseTo(EXCAVATOR.rockerLength, 9);
      expect(distance(p.joint, p.lug)).toBeCloseTo(EXCAVATOR.linkLength, 9);
    }
  });
  it('extends the bucket cylinder to curl the cutting edge toward the cab', () => {
    let previous = excavatorPose({ boom: 0.62, stick: -1.6, curl: -0.3 });
    for (let curl = -0.2; curl <= 2.35; curl += 0.1) {
      const next = excavatorPose({ boom: 0.62, stick: -1.6, curl });
      expect(next.cylinders.bucket.length).toBeGreaterThan(previous.cylinders.bucket.length);
      previous = next;
    }
    const open = excavatorPose({ boom: 0.62, stick: -1.6, curl: 0 }),
      curled = excavatorPose({ boom: 0.62, stick: -1.6, curl: 2.2 });
    expect(curled.tooth.x).toBeLessThan(open.tooth.x - 2);
  });
  it('extends the stick cylinder to crowd the stick inward', () => {
    const out = excavatorPose({ boom: 0.6, stick: -0.9, curl: 1 }),
      crowded = excavatorPose({ boom: 0.6, stick: -2.2, curl: 1 });
    expect(crowded.cylinders.stick.length).toBeGreaterThan(out.cylinders.stick.length + 0.5);
  });
  it('rejects unreachable and non-finite linkage inputs', () => {
    expect(() => circleJoint({ x: 0, y: 0 }, { x: 5, y: 0 }, 1, 1)).toThrow(RangeError);
    expect(() => excavatorPose({ boom: NaN, stick: -1.5, curl: 1 })).toThrow(RangeError);
  });
  it('clamps poses to the teaching range instead of extrapolating', () => {
    const p = excavatorPose({ boom: 9, stick: -9, curl: 9 });
    expect(p.boom).toBe(EXCAVATOR.limits.boom[1]);
    expect(p.stick).toBe(EXCAVATOR.limits.stick[0]);
    expect(p.curl).toBe(EXCAVATOR.limits.curl[1]);
  });
});

describe('excavator hydraulics', () => {
  const pose = excavatorPose({ boom: 0.6, stick: -1.6, curl: 1.4 });
  it('uses the reference bore for the piston area and lets the load set the pressure', () => {
    expect(pistonArea(EXCAVATOR.cylinders.boom) * 1e4).toBeCloseTo(113.1, 0);
    const light = excavatorHydraulics(pose, 300, 0, 'hold'),
      heavy = excavatorHydraulics(pose, 1800, 0, 'hold');
    expect(light.pressure / 1e6).toBeCloseTo(6.5, 1);
    expect(heavy.pressure / 1e6).toBeCloseTo(9.5, 1);
    expect(heavy.force / 1e3).toBeCloseTo(108, 0);
    expect(heavy.force).toBeCloseTo(heavy.pressure * heavy.area, 6);
  });
  it('balances the gravity moment with two cylinders on the pin-derived lever arm', () => {
    const h = excavatorHydraulics(pose, 1200, 0, 'hold');
    expect(2 * h.pressure * h.area * h.arm).toBeCloseTo(h.moment, 6);
    expect(h.arm).toBeCloseTo(leverArm(pose).arm, 12);
  });
  it('scales piston speed with flow at unchanged pressure', () => {
    const slow = excavatorHydraulics(pose, 1200, 40, 'lift'),
      fast = excavatorHydraulics(pose, 1200, 100, 'lift');
    expect(slow.velocity * 100).toBeCloseTo(2.95, 1);
    expect(fast.velocity / slow.velocity).toBeCloseTo(2.5, 9);
    expect(fast.pressure).toBe(slow.pressure);
    expect(fast.boomRate).toBeCloseTo(fast.velocity / fast.arm, 12);
  });
  it('meters flow from joystick travel and lowers with the same speed law', () => {
    expect(joystickCommand(0)).toEqual({ joystick: 0, valve: 'hold', flow: 0 });
    expect(joystickCommand(0.5).flow).toBeCloseTo(JOYSTICK_FLOW / 2, 9);
    expect(joystickCommand(-1)).toEqual({ joystick: -1, valve: 'lower', flow: JOYSTICK_FLOW });
    expect(joystickCommand(3).joystick).toBe(1);
    const up = excavatorHydraulics(pose, 1200, 40, 'lift'),
      down = excavatorHydraulics(pose, 1200, 40, 'lower');
    expect(down.velocity).toBeCloseTo(-up.velocity, 12);
    expect(down.pressure).toBe(up.pressure);
    expect(up.areaRatio).toBeCloseTo(36, 0);
    expect(up.pumpForce * up.areaRatio).toBeCloseTo(up.force, 6);
  });
  it('holds with zero speed and lifts against an obstacle only up to the relief setting', () => {
    expect(excavatorHydraulics(pose, 1200, 100, 'hold').velocity).toBe(0);
    const blocked = excavatorHydraulics(pose, 0, 120, 'lift', true);
    expect(blocked.relief).toBe(true);
    expect(blocked.pressure).toBe(EXCAVATOR.relief);
    expect(blocked.velocity).toBe(0);
    expect(blocked.reliefPower).toBeGreaterThan(0);
    const building = excavatorHydraulics(pose, 0, 120, 'lift', true, 0.5);
    expect(building.relief).toBe(false);
    expect(building.pressure).toBeCloseTo(EXCAVATOR.relief / 2, 6);
    const released = excavatorHydraulics(pose, 0, 0, 'hold', true);
    expect(released.pressure).toBeCloseTo(released.gravityPressure, 6);
    expect(released.pressure).toBeLessThan(EXCAVATOR.relief / 3);
  });
  it('changes required pressure with pose at the same load', () => {
    const low = excavatorHydraulics(
        excavatorPose({ boom: 0.45, stick: -1.5, curl: 1.4 }),
        1200,
        0,
        'hold',
      ),
      high = excavatorHydraulics(
        excavatorPose({ boom: 1.02, stick: -1.5, curl: 1.4 }),
        1200,
        0,
        'hold',
      );
    expect(low.pressure / 1e6).toBeCloseTo(8.6, 1);
    expect(high.pressure / 1e6).toBeCloseTo(7.8, 1);
    expect(high.arm).toBeLessThan(low.arm);
  });
  it('integrates the boom deterministically so seeking agrees with playback', () => {
    const from = { boom: 0.44, stick: -1.6, curl: 1.4 };
    const whole = integrateBoom(from, 1200, () => 0.3, 10);
    const halves = integrateBoom(
      { ...from, boom: integrateBoom(from, 1200, () => 0.3, 5) },
      1200,
      () => 0.3,
      5,
    );
    expect(whole).toBeCloseTo(halves, 6);
    expect(whole).toBeGreaterThan(from.boom + 0.2);
    expect(integrateBoom(from, 1200, () => 0, 10)).toBe(from.boom);
    expect(integrateBoom({ ...from, boom: whole }, 1200, () => -0.3, 10)).toBeLessThan(whole);
  });
  it('rejects invalid hydraulic input', () => {
    expect(() => excavatorHydraulics(pose, -1, 10)).toThrow(RangeError);
    expect(() => excavatorHydraulics(pose, 10, NaN)).toThrow(RangeError);
  });
});

describe('excavator film director', () => {
  const clock = (chapter: number, chapterProgress: number, chapterSeconds = 26) => ({
    chapter,
    chapterProgress,
    chapterTime: chapterProgress * chapterSeconds,
    chapterSeconds,
  });
  it('produces valid poses and finite readouts for every chapter and progress', () => {
    for (let c = 0; c < EXCAVATOR_CHAPTERS; c++)
      for (let q = 0; q <= 1.0001; q += 0.02) {
        const shot = excavatorShot(clock(c, q));
        const p = excavatorPose(shot.pose);
        const h = excavatorHydraulics(
          p,
          shot.payload,
          shot.flow,
          shot.valve,
          shot.anchored,
          shot.demand,
        );
        expect(Number.isFinite(h.pressure)).toBe(true);
        expect(p.tooth.y).toBeGreaterThan(-0.05);
        expect(shot.flow).toBeCloseTo(joystickCommand(shot.joystick).flow, 9);
        expect(shot.valve).toBe(joystickCommand(shot.joystick).valve);
      }
  });
  it('shows the sectioned cylinder for the hydraulic chapters and the side elevation for leverage', () => {
    expect(excavatorShot(clock(1, 0.6)).cutaway).toBe(1);
    expect(excavatorShot(clock(2, 0.5)).circuit).toBe(true);
    expect(excavatorShot(clock(3, 0.7)).pascal).toBe(true);
    expect(excavatorShot(clock(4, 0.5)).view).toBe('cylinder');
    expect(excavatorShot(clock(5, 0.5)).view).toBe('side');
    expect(excavatorShot(clock(5, 0.5)).lever).toBe(true);
    expect(excavatorShot(clock(6, 0.5)).view).toBe('bucket');
  });
  it('raises the boom faster after the flow rises, then holds at the top', () => {
    const rate = (q: number) =>
      excavatorShot(clock(4, q + 0.02, 33.6)).pose.boom -
      excavatorShot(clock(4, q - 0.02, 33.6)).pose.boom;
    expect(rate(0.4)).toBeGreaterThan(0.01);
    expect(rate(0.62) / rate(0.4)).toBeGreaterThan(1.7);
    expect(excavatorShot(clock(4, 0.4, 33.6)).flow).toBeCloseTo(40, 6);
    expect(excavatorShot(clock(4, 0.62, 33.6)).flow).toBeCloseTo(100, 6);
    expect(excavatorShot(clock(4, 1, 33.6)).pose.boom).toBe(EXCAVATOR.limits.boom[1]);
    expect(excavatorShot(clock(4, 1, 33.6)).valve).toBe('hold');
  });
  it('builds pressure to relief against the boulder, then releases to the weight alone', () => {
    const building = excavatorShot(clock(7, 0.15)),
      blocked = excavatorShot(clock(7, 0.5)),
      released = excavatorShot(clock(7, 0.9));
    expect(building.demand).toBeLessThan(1);
    expect(blocked.demand).toBe(1);
    expect(blocked.valve).toBe('lift');
    expect(released.valve).toBe('hold');
    expect(released.view).toBe('wide');
  });
  it('rejects chapters outside the film', () => {
    expect(() => excavatorShot(clock(EXCAVATOR_CHAPTERS, 0.5))).toThrow(RangeError);
    expect(() => excavatorShot(clock(0, NaN))).toThrow(RangeError);
  });
});

describe('excavator side drawing', () => {
  it('places the sectioned cylinder, linkage and bucket from the same pose', () => {
    const { primitives, pose } = excavatorDrawing(
      { boom: 0.66, stick: -1.62, curl: 1.45 },
      { section: true, payload: 1200 },
    );
    expect(primitives.length).toBeGreaterThan(30);
    for (const s of primitives) {
      if (s.kind === 'path') expect(s.d).not.toMatch(/NaN/);
      else expect(Number.isFinite(s.c.x) && Number.isFinite(s.c.y)).toBe(true);
    }
    const pins = primitives.filter((s) => s.kind === 'circle' && s.stroke);
    expect(pins).toHaveLength(6);
    expect(pose.cylinders.boom.stroke).toBeGreaterThan(0);
  });
});
