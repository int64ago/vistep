import { it, expect } from 'vitest';
import {
  moonEarthTest,
  gravityMeasurementsDirector,
  torsionGeometry,
  torsionTorque,
  torsionBalance,
  cannonOrbit,
  EARTH_MU,
  EARTH_RADIUS,
} from './gravity-measurements';
it('compares lunar acceleration with inverse-square Earth gravity', () => {
  const m = moonEarthTest();
  expect(m.predicted / m.observed).toBeCloseTo(1, 1);
  expect(moonEarthTest(60).predicted / moonEarthTest(30).predicted).toBeCloseTo(0.25);
});
it('reverses torque and scales it with attracting mass', () => {
  expect(torsionTorque(0, -1)).toBeCloseTo(-torsionTorque(0, 1), 12);
  expect(torsionTorque(0, 1, 316)).toBeCloseTo(2 * torsionTorque(0, 1, 158), 12);
  const x = torsionBalance(1, 158, 10000);
  expect(x.theta).toBeCloseTo(x.equilibrium, 5);
  expect(x.theta).toBeGreaterThan(0);
});
it('conserves a circular orbit and intercepts a slow projectile', () => {
  const speed = Math.sqrt(EARTH_MU / (EARTH_RADIUS + 3e5)) / 1000,
    a = cannonOrbit(speed);
  expect(a.hit).toBe(false);
  expect(Math.max(...a.points.map((p) => Math.abs(p.r - (EARTH_RADIUS + 3e5))))).toBeLessThan(20);
  expect(cannonOrbit(4).hit).toBe(true);
  expect(a.escapeSpeed / a.circularSpeed).toBeCloseTo(Math.sqrt(2));
});

import {
  MOON_REFERENCE,
  TORSION_RECORD,
  TORSION_OBSERVATIONS,
  moonPrediction,
  moonTangentDeparture,
  publishedTorsionInference,
  torsionOpticalLever,
  calibratedFibreComparison,
} from './gravity-measurements';
it('keeps orbital references independent of the selected distance law and radius', () => {
  const before = JSON.stringify(MOON_REFERENCE);
  const measured = (4 * Math.PI ** 2 * 384400e3) / (27.3217 * 86400) ** 2;
  for (const p of [1, 2, 3])
    for (const multiple of [0.5, 1, 2]) {
      moonPrediction(p, multiple);
      expect(moonEarthTest(60 * multiple).observed).toBe(measured);
    }
  expect(JSON.stringify(MOON_REFERENCE)).toBe(before);
  expect(Object.isFrozen(MOON_REFERENCE)).toBe(true);
  expect(moonEarthTest().g).toBe(9.8);
  expect(moonPrediction()).toBeCloseTo(0.002691996729094412, 15);
  expect(measured / moonPrediction() - 1).toBeCloseTo(0.011639238947789288, 13);
});
it('preserves unequal predicted and kinematic tangent departures', () => {
  expect(moonTangentDeparture(60)).toBeCloseTo(4.901993129669183, 12);
  expect(moonPrediction() * 1800).toBeCloseTo(4.845594112369941, 12);
  expect(moonTangentDeparture(60) - moonPrediction() * 1800).toBeGreaterThan(0.05);
  expect(moonTangentDeparture(0)).toBe(0);
  expect(moonTangentDeparture(0.001)).toBeGreaterThan(0);
  expect(moonPrediction(2, 2) / moonPrediction(2, 1)).toBe(0.25);
});
it('reproduces the published approximate inverse from independently supplied Table1', () => {
  const x = publishedTorsionInference();
  expect(x.G).toBeCloseTo(6.493283868633371e-11, 23);
  expect(x.period).toBeCloseTo(290.73880122620255, 11);
  expect(x.uncertainty).toBeCloseTo(4.918490473245506e-12, 24);
  expect(2 * TORSION_RECORD.screenDistance * Math.tan(2 * x.theta)).toBeCloseTo(
    TORSION_RECORD.shift,
    14,
  );
  expect(Object.isFrozen(TORSION_RECORD)).toBe(true);
});
it('derives mirror, reflected ray and screen from vector reflection in both directions', () => {
  for (const q of [-0.04, -0.005, 0, 0.005, 0.04]) {
    const v = torsionOpticalLever(q, 2.435);
    expect(v.outgoing.x ** 2 + v.outgoing.y ** 2).toBeCloseTo(1, 14);
    expect(Math.atan2(v.outgoing.y, v.outgoing.x)).toBeCloseTo(2 * q, 14);
    expect(v.screen.y).toBeCloseTo(2.435 * Math.tan(2 * q), 14);
    expect(v.screen.y / v.screen.x).toBeCloseTo(v.outgoing.y / v.outgoing.x, 14);
  }
});
it('distinguishes one deflection from the separation of reversed equilibria', () => {
  const q = publishedTorsionInference().theta;
  const plus = torsionOpticalLever(q),
    minus = torsionOpticalLever(-q);
  expect(plus.screen.y - minus.screen.y).toBeCloseTo(0.0187, 14);
  expect(plus.screen.y).toBeCloseTo(0.00935, 14);
  expect(q).toBeCloseTo(0.0187 / (4 * 2.435), 7);
});
it('changes sensitivity without changing the inferred constant under the stated linear approximation', () => {
  const one = calibratedFibreComparison(1),
    two = calibratedFibreComparison(2);
  expect(two.theta).toBe(one.theta / 2);
  expect(two.kappaPerMass).toBe(one.kappaPerMass * 2);
  expect(two.torquePerMass).toBe(one.torquePerMass);
  expect(two.G).toBe(one.G);
});
it('keeps all original observation identities and four gaps, excluding fit curves', () => {
  expect(TORSION_OBSERVATIONS).toHaveLength(2459);
  expect(new Set(TORSION_OBSERVATIONS.map((p) => p.id)).size).toBe(2459);
  expect(
    [0, 1, 2, 3].map((run) => TORSION_OBSERVATIONS.filter((p) => p.run === run).length),
  ).toEqual([617, 654, 598, 590]);
  expect(TORSION_OBSERVATIONS[0]).toEqual({
    id: 1383,
    run: 0,
    timeMinutes: 14.97439,
    positionMm: 165.00023,
  });
  expect(TORSION_OBSERVATIONS.at(-1)).toEqual({
    id: 5055,
    run: 3,
    timeMinutes: 282.61038,
    positionMm: 150.00336,
  });
  expect(TORSION_OBSERVATIONS.every((p) => p.id > 1381 && Object.isFrozen(p))).toBe(true);
  expect(Object.isFrozen(TORSION_OBSERVATIONS)).toBe(true);
  for (let run = 1; run < 4; run++) {
    const a = TORSION_OBSERVATIONS.filter((p) => p.run === run - 1).at(-1)!;
    const b = TORSION_OBSERVATIONS.find((p) => p.run === run)!;
    expect(b.timeMinutes - a.timeMinutes).toBeGreaterThan(9);
  }
});
it('does not rewrite observations when model and inverse controls change', () => {
  const before = JSON.stringify(TORSION_OBSERVATIONS);
  for (const side of [-1, 1])
    for (const mass of [0, 79, 158, 200]) {
      torsionBalance(side, mass, 5000);
      torsionOpticalLever(side * 0.02);
      calibratedFibreComparison(mass / 100);
      publishedTorsionInference();
    }
  expect(JSON.stringify(TORSION_OBSERVATIONS)).toBe(before);
});
it('handles nonfinite, zero and extreme inputs without a singular displayed state', () => {
  for (const v of [NaN, Infinity, -Infinity, -100, 0, 1e6]) {
    const optics = torsionOpticalLever(v, v);
    expect(
      [
        optics.theta,
        optics.screen.x,
        optics.screen.y,
        moonPrediction(v, v),
        moonTangentDeparture(v),
        torsionTorque(v, v, v),
        torsionBalance(v, v, v, v).theta,
        calibratedFibreComparison(v).theta,
      ].every(Number.isFinite),
    ).toBe(true);
  }
  expect(torsionTorque(0, 1, 0)).toBe(0);
  expect(torsionBalance(1, 0, 10000).theta).toBe(0);
});

it('keeps the four actual spherical surfaces separated throughout selectable motion', () => {
  for (const side of [-1, 1])
    for (const mass of [79, 158, 200])
      for (const t of [0, 150, 400, 800, 1400, 3000, 6000]) {
        const state = torsionBalance(side, mass, t);
        const geometry = torsionGeometry(state.theta, side, mass);
        const spheres = [...geometry.small, ...geometry.large];
        for (let i = 0; i < spheres.length; i++)
          for (let j = i + 1; j < spheres.length; j++) {
            const a = spheres[i]!,
              b = spheres[j]!;
            expect(Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius).toBeGreaterThan(0);
          }
      }
});

it('keeps the full selectable transient inside the explicitly enlarged optical ruler', () => {
  for (const mass of [79, 158, 200])
    for (const side of [-1, 1])
      for (let t = 0; t <= 6000; t += 100) {
        const state = torsionBalance(side, mass, t);
        expect(Math.abs(state.theta)).toBeLessThan(0.08);
        expect(Math.abs(torsionOpticalLever(state.theta).screen.y)).toBeLessThan(0.12);
      }
});

it('keeps the lunar prediction and observation answer hidden until their language-specific phrases', () => {
  expect(gravityMeasurementsDirector(0, 16, 'zh').revealPrediction).toBe(true);
  expect(gravityMeasurementsDirector(0, 16, 'en').revealPrediction).toBe(false);
  expect(gravityMeasurementsDirector(1, 14, 'zh').revealOrbital).toBe(false);
  expect(gravityMeasurementsDirector(1, 14, 'en').revealOrbital).toBe(true);
  for (const lang of ['zh', 'en'] as const) {
    expect(gravityMeasurementsDirector(1, 27, lang).shot).toBe('distance-question');
    expect(gravityMeasurementsDirector(1, 33, lang).shot).toBe('distance-answer');
    expect(gravityMeasurementsDirector(1, 27, lang).shot).toBe('distance-question');
  }
});
it('changes the torsion camera without resetting the same physical clock', () => {
  for (const [lang, cut] of [
    ['zh', 18.11],
    ['en', 16.45],
  ] as const) {
    const before = gravityMeasurementsDirector(2, cut - 0.001, lang),
      after = gravityMeasurementsDirector(2, cut + 0.001, lang);
    expect(before.shot).toBe('force');
    expect(after.shot).toBe('optical');
    expect(after.torsionSeconds - before.torsionSeconds).toBeCloseTo(0.14, 10);
    expect(
      Math.abs(
        torsionBalance(1, 158, after.torsionSeconds).theta -
          torsionBalance(1, 158, before.torsionSeconds).theta,
      ),
    ).toBeLessThan(0.00001);
  }
});
it('reveals G and changes fibre only when their actual spoken evidence arrives', () => {
  expect(gravityMeasurementsDirector(3, 28, 'zh').revealG).toBe(true);
  expect(gravityMeasurementsDirector(3, 28, 'en').revealG).toBe(false);
  expect(gravityMeasurementsDirector(3, 40, 'en').fibreFactor).toBeGreaterThan(1);
  expect(gravityMeasurementsDirector(3, 40, 'en').fibreFactor).toBeLessThan(2);
  expect(gravityMeasurementsDirector(3, 42, 'en').fibreFactor).toBe(2);
  expect(gravityMeasurementsDirector(3, 39, 'en').fibreFactor).toBe(1);
  expect(gravityMeasurementsDirector(3, 6, 'zh').run).toBe(1);
  expect(gravityMeasurementsDirector(3, 2, 'zh').run).toBe(0);
});
it('reaches the retained slower-flight surface contact during the spoken contact statement', () => {
  expect(gravityMeasurementsDirector(4, 6, 'en').motionProgress).toBeLessThan(1);
  expect(gravityMeasurementsDirector(4, 8, 'en').motionProgress).toBe(1);
  expect(gravityMeasurementsDirector(4, 9, 'zh').motionProgress).toBe(1);
  for (const lang of ['zh', 'en'] as const)
    for (const c of [0, 1, 2, 3, 4, 5])
      for (const t of [NaN, Infinity, -Infinity, -1, 0, 120]) {
        const d = gravityMeasurementsDirector(c, t, lang);
        expect([d.motionProgress, d.torsionSeconds, d.fibreFactor].every(Number.isFinite)).toBe(
          true,
        );
      }
});
