import { describe, it, expect } from 'vitest';
import {
  polygonCentroid,
  suspensionState,
  LAMINA_SHAPES,
  LAMINA_WEIGHT,
  laminaCenter,
  lineIntersection,
  suspensionMotion,
  laminaMechanics,
  physicalPendulum,
  recordPlumb,
  settledRecord,
  intersectRecords,
  suspensionShot,
  suspensionTimedShot,
  SUSPENSION_G,
  LAMINA_METRES_PER_UNIT,
} from './suspension-center-of-gravity';
describe('suspended lamina: independent geometry and dynamics', () => {
  it('matches the exact right-triangle area, centroid and polar inertia', () => {
    const c = polygonCentroid([
      { x: 0, y: 0 },
      { x: 0.6, y: 0 },
      { x: 0, y: 0.3 },
    ]);
    expect(c.area).toBeCloseTo(0.09, 12);
    expect(c.x).toBeCloseTo(0.2, 12);
    expect(c.y).toBeCloseTo(0.1, 12);
    expect(c.centralSecondMoment + c.x * c.x + c.y * c.y).toBeCloseTo(0.075, 12);
  });
  it('matches an independent midpoint-grid integral for both source polygons', () => {
    // Independently integrated in artifacts/.../physics-next-suspension/benchmark.py, step .2.
    const expected = [
      [-3.14331978, -3.34695504],
      [5.66543218, 18.33311163],
    ];
    Object.values(LAMINA_SHAPES).forEach((p, i) => {
      const c = polygonCentroid(p);
      expect(Math.hypot(c.x - expected[i][0], c.y - expected[i][1])).toBeLessThan(0.0014);
    });
  });
  it('uses SI inertia and torque from the same material geometry', () => {
    const m = suspensionMotion(LAMINA_SHAPES.irregular, 0, 0.17, 0.75);
    expect(m.gravityTorque).toBeCloseTo(
      m.mass * SUSPENSION_G * m.centerWorld.x * LAMINA_METRES_PER_UNIT,
      12,
    );
    expect(m.inertia * m.acceleration).toBeCloseTo(m.gravityTorque + m.dampingTorque, 12);
    expect(m.inertia).toBeGreaterThan(0.001);
    expect(m.inertia).toBeLessThan(0.1);
  });
  it('matches an independently integrated nonlinear pendulum benchmark', () => {
    const p = physicalPendulum(
      { mass: 1, distance: Math.sqrt(0.05), inertia: 0.075, gamma: 1.2, initialOffset: 0.45 },
      8,
    );
    expect(p.offset).toBeCloseTo(-1.516874e-5, 10);
  });
  it('damping reduces mechanical energy; no damping conserves it', () => {
    const m = laminaMechanics(LAMINA_SHAPES.irregular, 0);
    let last = Infinity;
    for (let i = 0; i <= 80; i++) {
      const e = physicalPendulum(m, i / 10).energy;
      expect(e).toBeLessThanOrEqual(last + 1e-12);
      last = e;
    }
    const initial = physicalPendulum({ ...m, gamma: 0 }, 0).energy;
    for (let i = 0; i <= 80; i++)
      expect(physicalPendulum({ ...m, gamma: 0 }, i / 10).energy).toBeCloseTo(initial, 8);
  });
  it('does not confuse a turning point with settling', () => {
    const initial = suspensionMotion(LAMINA_SHAPES.irregular, 0, 0);
    expect(initial.velocity).toBe(0);
    expect(initial.settled).toBe(false);
    expect(suspensionMotion(LAMINA_SHAPES.irregular, 0, 10).settled).toBe(true);
    expect(suspensionMotion(LAMINA_SHAPES.irregular, 0, 10, 0, undefined, 0).settled).toBe(false);
  });
  it('zero torque above the pin is unstable, while a central pin is neutral', () => {
    const m = laminaMechanics(LAMINA_SHAPES.irregular, 0);
    expect(
      Math.abs(physicalPendulum({ ...m, initialOffset: Math.PI }, 0).gravityTorque),
    ).toBeLessThan(1e-15);
    const unstable = physicalPendulum({ ...m, initialOffset: Math.PI - 0.001 }, 1);
    expect(Math.abs(unstable.offset - Math.PI)).toBeGreaterThan(0.01);
    const neutral = physicalPendulum({ ...m, distance: 0, initialOffset: 0.7 }, 5);
    expect(neutral.offset).toBe(0.7);
    expect(neutral.gravityTorque).toBe(-0);
  });
  it('settles for strongly overdamped cases without an invented oscillation frequency', () => {
    const p = physicalPendulum(
      { mass: 1, distance: 0.01, inertia: 1, gamma: 3, initialOffset: 0.45 },
      2,
    );
    expect(p.offset).toBeGreaterThan(0);
    expect(p.offset).toBeLessThan(0.45);
    expect(p.velocity).toBeLessThan(0);
  });
  it('stable orientation puts the centre below each pin for both shapes and load limits', () => {
    for (const points of Object.values(LAMINA_SHAPES))
      for (let i = 0; i < points.length; i++)
        for (const load of [0, 0.75, 1.5]) {
          const s = suspensionState(points, i, load);
          expect(s.centerWorld.x).toBeCloseTo(0, 10);
          expect(s.centerWorld.y).toBeGreaterThan(0);
        }
  });
  it('records an observed world vertical without knowing a centre', () => {
    const r = recordPlumb({ x: 4, y: 9 }, 0.31, 0.7);
    for (const p of r.ends) {
      const x = (p.x - r.pivot.x) * Math.cos(r.angle) - (p.y - r.pivot.y) * Math.sin(r.angle);
      expect(x).toBeCloseTo(0, 10);
    }
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.ends[0])).toBe(true);
  });
  it('two independent settled records recover the expected centre, including loaded boards', () => {
    for (const points of Object.values(LAMINA_SHAPES))
      for (const mass of [0, 0.75, 1.5]) {
        const inferred = intersectRecords([
            settledRecord(points, 0, mass),
            settledRecord(points, 2, mass),
          ])!,
          expected = laminaCenter(points, mass);
        expect(Math.hypot(inferred.x - expected.x, inferred.y - expected.y)).toBeLessThan(0.002);
      }
  });
  it('the triangle loading benchmark moves 3/7 of the distance toward the weight', () => {
    const c = laminaCenter(LAMINA_SHAPES.triangle, 0.75);
    expect(c.x).toBeCloseTo(22.5238095238, 9);
    expect(c.y).toBeCloseTo(19.0476190476, 9);
    const before = laminaCenter(LAMINA_SHAPES.triangle);
    expect((c.x - before.x) / (LAMINA_WEIGHT.x - before.x)).toBeCloseTo(3 / 7, 12);
  });
  it('preserves the original ink after mass is added; new ink identifies a different point', () => {
    const old = suspensionShot(3, 0.27),
      next = suspensionShot(3, 0.99);
    expect(next.records.filter((r) => r.massRatio === 0)).toEqual(old.records);
    const oldCross = intersectRecords(old.records)!,
      newCross = intersectRecords(next.records.filter((r) => r.massRatio > 0))!;
    expect(Math.hypot(newCross.x - oldCross.x, newCross.y - oldCross.y)).toBeGreaterThan(16);
    expect(
      Math.hypot(newCross.x - next.motion.center.x, newCross.y - next.motion.center.y),
    ).toBeLessThan(0.002);
  });
  it('holds the board while attaching mass and releases from rest at the old angle', () => {
    const before = suspensionShot(3, 0.35),
      release = suspensionShot(3, 0.48),
      old = suspensionState(LAMINA_SHAPES.triangle, 2);
    expect(before.held).toBe(true);
    expect(before.mass).toBe(0.75);
    expect(before.predict).toBe(false);
    expect(before.gravity).toBe(false);
    expect(suspensionShot(3, 0.45).predict).toBe(true);
    expect(suspensionShot(3, 0.45).gravity).toBe(false);
    expect(before.motion.angle).toBeCloseTo(old.angle, 12);
    expect(release.held).toBe(false);
    expect(release.motion.velocity).toBe(0);
    expect(Math.abs(release.motion.gravityTorque)).toBeGreaterThan(0.01);
  });
  it('rejects invalid inputs and does not invent an intersection for parallel lines', () => {
    expect(() =>
      polygonCentroid([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ]),
    ).toThrow();
    expect(() => laminaCenter(LAMINA_SHAPES.irregular, NaN)).toThrow();
    expect(() => suspensionState(LAMINA_SHAPES.irregular, NaN)).toThrow();
    const m = laminaMechanics(LAMINA_SHAPES.irregular, 0);
    expect(() => physicalPendulum({ ...m, gamma: -1 }, 1)).toThrow();
    expect(() => physicalPendulum(m, Infinity)).toThrow();
    expect(
      lineIntersection({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }),
    ).toBeNull();
    expect(
      lineIntersection({ x: NaN, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }),
    ).toBeNull();
    expect(
      lineIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }),
    ).toBeNull();
  });
});

describe('suspension measured bilingual direction', () => {
  it('keeps the clamp through the actual lever-arm explanation, then shows the overshoot', () => {
    for (const [locale, release, cross, turn] of [
      ['zh', 9.25, 14.3, 16.2],
      ['en', 11.1, 16.7, 18.5],
    ] as const) {
      expect(suspensionTimedShot(0, release - 0.05, locale).held).toBe(true);
      expect(suspensionTimedShot(0, release + 0.05, locale).held).toBe(false);
      expect(suspensionTimedShot(0, cross - 0.2, locale).motion.offset).toBeGreaterThan(0);
      expect(suspensionTimedShot(0, turn, locale).motion.offset).toBeLessThan(0);
      const final = suspensionTimedShot(0, 23, locale);
      expect(final.motion.settled).toBe(true);
      expect(final.shot).toBe('balance');
    }
  });
  it('reveals the second ink and intersection during their respective spoken references', () => {
    for (const [locale, markStart, markEnd, cross] of [
      ['zh', 12.73, 15.47, 17.8],
      ['en', 12.69, 14.27, 16.65],
    ] as const) {
      expect(suspensionTimedShot(2, markStart - 0.05, locale).records).toHaveLength(1);
      expect(suspensionTimedShot(2, markEnd, locale).records).toHaveLength(2);
      expect(suspensionTimedShot(2, markEnd, locale).showCenter).toBe(false);
      expect(suspensionTimedShot(2, cross + 0.05, locale).showCenter).toBe(true);
    }
  });
  it('withholds the loading answer through the question, then separates direction, prediction and test', () => {
    for (const [locale, direction, prediction, release, record2, result] of [
      ['zh', 21.4, 25.65, 29.55, 36.05, 36.6],
      ['en', 20, 22.1, 27.8, 35.05, 35.5],
    ] as const) {
      const question = suspensionTimedShot(3, 18, locale);
      expect(question.mass).toBe(0.75);
      expect(question.held).toBe(true);
      expect(question.predict).toBe(false);
      expect(question.predictDirection).toBe(false);
      expect(question.gravity).toBe(false);
      expect(question.showCenter).toBe(false);
      const arrow = suspensionTimedShot(3, direction + 0.1, locale);
      expect(arrow.predictDirection).toBe(true);
      expect(arrow.predict).toBe(false);
      const hollow = suspensionTimedShot(3, prediction + 0.1, locale);
      expect(hollow.predict).toBe(true);
      expect(hollow.gravity).toBe(false);
      expect(hollow.held).toBe(true);
      expect(suspensionTimedShot(3, release + 0.05, locale).held).toBe(false);
      expect(
        suspensionTimedShot(3, record2 - 0.05, locale).records.filter((r) => r.massRatio > 0),
      ).toHaveLength(1);
      const measured = suspensionTimedShot(3, result + 0.05, locale);
      expect(measured.records.filter((r) => r.massRatio > 0)).toHaveLength(2);
      expect(measured.showCenter).toBe(true);
      expect(measured.records.filter((r) => r.massRatio === 0)).toEqual(
        question.records.filter((r) => r.massRatio === 0),
      );
    }
  });
});
