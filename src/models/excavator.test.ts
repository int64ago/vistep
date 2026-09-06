import { describe, expect, it } from 'vitest';
import {
  EXCAVATOR_BUCKET,
  EXCAVATOR_CYLINDERS,
  circleJoint,
  distance,
  excavatorHydraulics,
  excavatorPose,
  excavatorShot,
  rotate,
  type XY,
} from './excavator';

const delta = (a: XY, b: XY): XY => ({ x: a.x - b.x, y: a.y - b.y });
const sine = (a: XY, b: XY) =>
  (a.x * b.y - a.y * b.x) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
const samples = (a: number, b: number, n: number) =>
  Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

describe('excavator rigid mechanism', () => {
  it('closes every rigid link and stays away from all three transmission dead centers', () => {
    for (const boom of samples(0.6, 1.05, 6))
      for (const stick of samples(-1.65, -1.5, 3))
        for (const curl of samples(0.05, 0.6, 22)) {
          const p = excavatorPose(boom, stick, curl);
          for (const [a, b, length] of [
            [p.origin, p.elbow, 3.2],
            [p.elbow, p.wrist, 2.4],
            [p.wrist, p.rockerPin, 0.62],
            [p.rockerPin, p.joint, 0.65],
            [p.joint, p.bucketPin, 0.6],
            [p.bucketPin, p.wrist, 0.55],
          ] as const)
            expect(distance(a, b)).toBeCloseTo(length, 12);
          // Four-bar transmission, output arm, and input cylinder each retain
          // a useful perpendicular lever; a closed but straight linkage fails.
          expect(
            Math.abs(sine(delta(p.joint, p.rockerPin), delta(p.bucketPin, p.joint))),
          ).toBeGreaterThan(0.9);
          expect(
            Math.abs(sine(delta(p.joint, p.bucketPin), delta(p.wrist, p.bucketPin))),
          ).toBeGreaterThan(0.9);
          expect(
            Math.abs(sine(delta(p.joint, p.rockerPin), delta(p.joint, p.cylinders[2].a))),
          ).toBeGreaterThan(0.7);
          // Keep the selected assembly branch on the same side of its two pivots.
          expect(
            sine(delta(p.bucketPin, p.rockerPin), delta(p.joint, p.rockerPin)),
          ).toBeGreaterThan(0);
          p.cylinders.forEach(({ a, b }, i) => {
            const length = distance(a, b),
              dimensions = EXCAVATOR_CYLINDERS[i];
            expect(length - dimensions.housing).toBeGreaterThan(0.1);
            expect(length - dimensions.rod).toBeGreaterThan(0.08);
            expect(dimensions.housing + dimensions.rod - length).toBeGreaterThan(0.06);
          });
        }
  });

  it('extends the bucket cylinder while the actual cutting edge scoops inward and upward', () => {
    for (const boom of samples(0.6, 1.05, 6))
      for (const stick of samples(-1.65, -1.5, 3)) {
        let previous = excavatorPose(boom, stick, 0.05);
        for (const curl of samples(0.05, 0.6, 30).slice(1)) {
          const p = excavatorPose(boom, stick, curl);
          expect(distance(p.cylinders[2].a, p.joint)).toBeGreaterThan(
            distance(previous.cylinders[2].a, previous.joint),
          );
          expect(p.tip.x).toBeLessThan(previous.tip.x);
          expect(p.tip.y).toBeGreaterThan(previous.tip.y);
          expect(p.bucketAngle).toBeLessThan(previous.bucketAngle);
          previous = p;
        }
      }
    const cuttingEdge = {
      x: (EXCAVATOR_BUCKET.tooth[2].x + EXCAVATOR_BUCKET.tooth[3].x) / 2,
      y: (EXCAVATOR_BUCKET.tooth[2].y + EXCAVATOR_BUCKET.tooth[3].y) / 2,
    };
    expect(distance(cuttingEdge, EXCAVATOR_BUCKET.tip)).toBeLessThan(1e-12);
    const p = excavatorPose(),
      renderedTip = rotate(cuttingEdge, p.bucketAngle);
    expect(
      distance(p.tip, { x: p.wrist.x + renderedTip.x, y: p.wrist.y + renderedTip.y }),
    ).toBeLessThan(1e-12);
  });
});

describe('excavator paired boom-cylinder hydraulics', () => {
  it('balances gravitational virtual work against cylinder extension, independent of force formulas', () => {
    const epsilon = 1e-6,
      payload = 1200;
    const potential = (boom: number, stick: number, curl: number) => {
      const p = excavatorPose(boom, stick, curl);
      return (
        9.81 *
        (800 * p.boomCenter.y + 400 * p.stickCenter.y + 180 * p.bucketCenter.y + payload * p.tip.y)
      );
    };
    for (const boom of [0.61, 0.75, 1.04])
      for (const stick of [-1.65, -1.55, -1.5])
        for (const curl of [0.05, 0.3, 0.6]) {
          const h = excavatorHydraulics(boom, payload, 40, 100, stick, curl);
          const derivative =
            (potential(boom + epsilon, stick, curl) - potential(boom - epsilon, stick, curl)) /
            (2 * epsilon);
          const cylinderLength = (angle: number) => {
            const { a, b } = excavatorPose(angle, stick, curl).cylinders[0];
            return distance(a, b);
          };
          const extensionLever =
            (cylinderLength(boom + epsilon) - cylinderLength(boom - epsilon)) / (2 * epsilon);
          expect(h.moment).toBeCloseTo(derivative, 3);
          expect(h.lever).toBeCloseTo(extensionLever, 8);
          expect(h.lever).toBeGreaterThan(0.67);
          expect(h.force * extensionLever).toBeCloseTo(derivative, 3);
        }
  });

  it('shares total flow between two cylinders and conserves ideal input power', () => {
    for (const bore of [70, 100, 140]) {
      const h = excavatorHydraulics(0.75, 800, 40, bore);
      expect(h.area).toBeCloseTo(Math.PI * (bore / 2000) ** 2, 12);
      expect(h.force).toBeCloseTo(2 * h.pressure * h.area, 8);
      expect(h.velocity * 2 * h.area * 60000).toBeCloseTo(40, 10);
      expect(h.power).toBeCloseTo(h.force * h.velocity, 8);
      expect(h.mechanicalPower).toBeCloseTo(h.power, 8);
      expect(h.reliefPower).toBe(0);
    }
    const wide = excavatorHydraulics(0.75, 800, 40, 140);
    const narrow = excavatorHydraulics(0.75, 800, 40, 70);
    expect(narrow.requiredPressure / wide.requiredPressure).toBeCloseTo(4, 10);
    expect(narrow.velocity / wide.velocity).toBeCloseTo(4, 10);
    const stopped = excavatorHydraulics(0.75, 800, 0);
    expect(stopped.force).toBeGreaterThan(0);
    expect(stopped.velocity).toBe(0);
    expect(stopped.power).toBe(0);
  });

  it('caps pressure and diverts input power when the equivalent load cannot be raised', () => {
    const h = excavatorHydraulics(0.75, 9000, 40);
    expect(h.requiredPressure).toBeGreaterThan(24e6);
    expect(h.pressure).toBe(24e6);
    expect(h.stalled).toBe(true);
    expect(h.force * h.lever).toBeLessThan(h.moment);
    expect(h.velocity).toBe(0);
    expect(h.mechanicalPower).toBe(0);
    expect(h.reliefPower).toBe(h.power);
    expect(h.power).toBe(16000);
  });
});

describe('excavator offered states and numeric boundaries', () => {
  it('keeps all seven film chapters valid, including exact endpoints and the 26-second relief chapter', () => {
    for (let chapter = 0; chapter < 7; chapter++)
      for (const progress of samples(0, 1, 500)) {
        const shot = excavatorShot(chapter, progress, chapter === 5 ? 26 : 25);
        const h = excavatorHydraulics(
          shot.boom,
          shot.payload,
          shot.flow,
          100,
          shot.stick,
          shot.curl,
        );
        expect(
          Object.values(h).every((value) => typeof value === 'boolean' || Number.isFinite(value)),
        ).toBe(true);
        expect(shot.piston).toBeGreaterThanOrEqual(0);
        expect(shot.piston).toBeLessThanOrEqual(1);
        if (chapter === 6) expect(shot.valve).toBe('extend');
      }
    for (const boom of [35, 60])
      for (const curl of [3, 34])
        expect(() =>
          excavatorHydraulics((boom * Math.PI) / 180, 9000, 80, 100, -1.55, (curl * Math.PI) / 180),
        ).not.toThrow();
    expect(excavatorShot(0, -1)).toEqual(excavatorShot(0, 0));
    expect(excavatorShot(0, 2)).toEqual(excavatorShot(0, 1));
  });

  it('rejects non-finite, impossible, and overflow inputs instead of producing invalid graphics', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      for (let i = 0; i < 6; i++) {
        const args: [number, number, number, number, number, number] = [
          0.75, 800, 40, 100, -1.55, 0.3,
        ];
        args[i] = bad;
        expect(() => excavatorHydraulics(...args)).toThrow(RangeError);
      }
      expect(() => excavatorShot(0, bad)).toThrow(RangeError);
      expect(() => excavatorShot(0, 0.5, bad)).toThrow(RangeError);
      expect(() => circleJoint({ x: bad, y: 0 }, { x: 1, y: 0 }, 1, 1)).toThrow(RangeError);
    }
    for (const args of [
      [0.59, -1.55, 0.3],
      [1.06, -1.55, 0.3],
      [0.75, -1.7, 0.3],
      [0.75, -1.55, 0.61],
    ] as const)
      expect(() => excavatorPose(...args)).toThrow(RangeError);
    expect(() => excavatorHydraulics(0.75, -1, 40)).toThrow(RangeError);
    expect(() => excavatorHydraulics(0.75, 800, -1)).toThrow(RangeError);
    for (const bore of [69, 141])
      expect(() => excavatorHydraulics(0.75, 800, 40, bore)).toThrow(RangeError);
    expect(() => excavatorHydraulics(0.75, Number.MAX_VALUE, 40)).toThrow(RangeError);
    for (const chapter of [-1, 7, 0.5])
      expect(() => excavatorShot(chapter, 0.5)).toThrow(RangeError);
    for (const duration of [0, -1])
      expect(() => excavatorShot(0, 0.5, duration)).toThrow(RangeError);
    expect(() => excavatorShot(4, 0.5, 34)).toThrow(RangeError);
    for (const separation of [0, 2, 3])
      expect(() => circleJoint({ x: 0, y: 0 }, { x: separation, y: 0 }, 1, 1)).toThrow(RangeError);
    expect(() => circleJoint({ x: 0, y: 0 }, { x: 1e200, y: 0 }, 1e200, 1e200)).toThrow(RangeError);
  });
});
