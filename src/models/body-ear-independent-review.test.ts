import { describe, expect, it } from 'vitest';
import { BFS, BFS_DEFAULT, bfsState } from './body-fat-scale';
import { EAR_IR, earBandRadiance, earInvertRadiance, earMeasure } from './ear-thermometer';
import { EAR_GEOMETRY, earLocalPoint, type EarPoint } from './ear-thermometer-geometry';

// Independent science review. These checks use complex admittance, equilibrium
// and the actual canal boundary, rather than restating each model's implementation.
describe('independent body-fat-scale science review', () => {
  it('agrees with the independently assembled parallel complex admittance', () => {
    for (const waterDeltaL of [-3, -2, -1, 0, 1, 2, 3])
      for (const frequencyHz of [1000, 2000, 5000, 10000, 50000, 100000, 200000, 250000]) {
        const state = bfsState({ ...BFS_DEFAULT, waterDeltaL, frequencyHz });
        const scale = BFS.waterL / state.waterL;
        const re = BFS.extracellularOhm * scale;
        const ri = BFS.intracellularOhm * scale;
        const capacitorMagnitude = 1 / (2 * Math.PI * frequencyHz * BFS.membraneF);
        // I/V for Re in parallel with Ri + Zc. Invert the combined admittance.
        const branchSquare = ri * ri + capacitorMagnitude * capacitorMagnitude;
        const realY = 1 / re + ri / branchSquare;
        const imaginaryY = capacitorMagnitude / branchSquare;
        const squareY = realY * realY + imaginaryY * imaginaryY;
        expect(state.body.resistance).toBeCloseTo(realY / squareY, 10);
        expect(state.body.reactance).toBeCloseTo(-imaginaryY / squareY, 10);
        expect(state.body.resistance).toBeGreaterThan(0);
        expect(state.body.reactance).toBeLessThan(0);
        expect(state.body.phaseRad).toBeLessThan(0);
        expect(state.voltageRmsV / state.currentRmsA).toBeCloseTo(
          1 / Math.hypot(realY, imaginaryY),
          10,
        );
      }
  });

  it('balances external force and both moments after weight or foot support changes', () => {
    for (const waterDeltaL of [-3, 0, 3])
      for (const contact of [false, true]) {
        const state = bfsState({ ...BFS_DEFAULT, waterDeltaL, contact });
        const totalForce = state.massKg * BFS.gravity;
        const centerX = contact ? 0 : -0.82;
        expect(state.cells.reduce((sum, cell) => sum + cell.forceN, 0)).toBeCloseTo(totalForce, 9);
        expect(state.cells.reduce((sum, cell) => sum + cell.forceN * cell.x, 0)).toBeCloseTo(
          totalForce * centerX,
          9,
        );
        expect(state.cells.reduce((sum, cell) => sum + cell.forceN * cell.z, 0)).toBeCloseTo(0, 9);
        expect(state.cells.every((cell) => cell.forceN > 0)).toBe(true);
      }
  });

  it('keeps fat and dry lean mass fixed while the water experiment changes total mass', () => {
    let previousResistance = Infinity;
    for (const waterDeltaL of [-3, -2, -1, 0, 1, 2, 3]) {
      const state = bfsState({ ...BFS_DEFAULT, waterDeltaL });
      expect(state.fatKg).toBe(BFS.fatKg);
      expect(state.leanKg - state.waterL).toBeCloseTo(BFS.dryLeanKg, 12);
      expect(state.massKg).toBeCloseTo(BFS.fatKg + BFS.dryLeanKg + BFS.waterL + waterDeltaL, 12);
      expect((state.trueFatPercent * state.massKg) / 100).toBeCloseTo(BFS.fatKg, 12);
      expect(state.body.resistance).toBeLessThan(previousResistance);
      previousResistance = state.body.resistance;
    }
    const dry = bfsState({ ...BFS_DEFAULT, waterDeltaL: -3 });
    const wet = bfsState({ ...BFS_DEFAULT, waterDeltaL: 3 });
    expect(dry.estimate!.fatKg).not.toBeCloseTo(dry.fatKg, 2);
    expect(wet.estimate!.fatKg).not.toBeCloseTo(wet.fatKg, 2);
  });

  it('keeps weighing available while open electrodes cannot return a BIA estimate', () => {
    for (const frequencyHz of [1000, BFS.referenceHz, 250000])
      for (const phaseCycles of [0, 0.25, 1, 6]) {
        const open = bfsState({ ...BFS_DEFAULT, contact: false, frequencyHz, phaseCycles });
        expect(open.measured).toBeNull();
        expect(open.estimate).toBeNull();
        expect(open.currentRmsA).toBe(0);
        expect(Math.abs(open.currentA)).toBe(0);
        expect(open.voltageRmsV).toBe(0);
        expect(Math.abs(open.voltageV)).toBe(0);
        expect(open.cells.reduce((sum, cell) => sum + cell.forceN, 0) / BFS.gravity).toBeCloseTo(
          open.massKg,
          10,
        );
      }
    expect(bfsState({ ...BFS_DEFAULT, frequencyHz: 5000 }).estimate).toBeNull();
  });
});

// CODATA SI constants and a finer independent quadrature. This verifies units
// and finite-band energy, not only the model's own forward/inverse round trip.
function independentBandRadiance(celsius: number) {
  const firstRadiationConstant = 1.1910429723971884e-16;
  const secondRadiationConstant = 0.014387768775039337;
  const kelvin = celsius + 273.15;
  const intervals = 384;
  const step = (EAR_IR.highM - EAR_IR.lowM) / intervals;
  let sum = 0;
  for (let i = 0; i <= intervals; i++) {
    const wavelength = EAR_IR.lowM + i * step;
    const radiance =
      firstRadiationConstant /
      (wavelength ** 5 * Math.expm1(secondRadiationConstant / (wavelength * kelvin)));
    sum += (i === 0 || i === intervals ? 1 : i % 2 ? 4 : 2) * radiance;
  }
  return (sum * step) / 3;
}
const canalPolygon = [...EAR_GEOMETRY.upper, ...[...EAR_GEOMETRY.lower].reverse()];
function isInsideCanal(point: EarPoint) {
  let inside = false;
  for (let i = 0, j = canalPolygon.length - 1; i < canalPolygon.length; j = i++) {
    const a = canalPolygon[i],
      b = canalPolygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
function distanceToSegment(point: EarPoint, a: EarPoint, b: EarPoint) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const fraction = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(point.x - a.x - fraction * dx, point.y - a.y - fraction * dy);
}

describe('independent ear-thermometer science review', () => {
  it('integrates finite-band Planck radiance with SI units and a converged quadrature', () => {
    for (const celsius of [-40, 15, 22, 34, 37, 40, 100])
      expect(Math.abs(earBandRadiance(celsius) - independentBandRadiance(celsius))).toBeLessThan(
        2e-7,
      );
    expect(earBandRadiance(37)).toBeLessThan((5.670374419e-8 * (37 + 273.15) ** 4) / Math.PI);
  });

  it('inverts the complete permitted radiance range without endpoint drift', () => {
    for (let celsius = -40; celsius <= 100; celsius += 0.5)
      expect(Math.abs(earInvertRadiance(earBandRadiance(celsius)) - celsius)).toBeLessThan(3e-10);
    expect(() => earInvertRadiance(0)).toThrow(RangeError);
    expect(() => earInvertRadiance(Infinity)).toThrow(RangeError);
  });

  it('preserves an isothermal target across every supported angle and sensor reference temperature', () => {
    for (let angleDeg = -24; angleDeg <= 24; angleDeg++)
      for (const surfaceC of [34, 37, 40]) {
        let referenceReading: number | undefined;
        for (const sensorC of [15, 22, 30, 35]) {
          const frame = earMeasure({
            angleDeg,
            drumC: surfaceC,
            outerWallC: surfaceC,
            innerWallC: surfaceC,
            sensorC,
          });
          expect(frame.compensatedC).toBeCloseTo(surfaceC, 9);
          expect(frame.rays.reduce((sum, ray) => sum + ray.weight, 0)).toBeCloseTo(1, 12);
          expect(frame.radiance).toBeCloseTo(independentBandRadiance(surfaceC), 6);
          if (referenceReading !== undefined)
            expect(frame.compensatedC).toBeCloseTo(referenceReading, 10);
          referenceReading = frame.compensatedC;
        }
      }
  });

  it('ends direct rays at the first canal boundary and keeps their aperture and absorber collinear', () => {
    const walls: [EarPoint, EarPoint][] = [];
    for (const boundary of [EAR_GEOMETRY.upper, EAR_GEOMETRY.lower])
      boundary.slice(1).forEach((b, i) => walls.push([boundary[i], b]));
    const drum: [EarPoint, EarPoint] = [EAR_GEOMETRY.upper.at(-1)!, EAR_GEOMETRY.lower.at(-1)!];
    for (let angleDeg = -24; angleDeg <= 24; angleDeg += 4) {
      const frame = earMeasure({ angleDeg });
      for (const ray of frame.rays) {
        const [tissue, entry, absorber] = ray.points;
        const targetSegments = ray.region === 'drum' ? [drum] : walls;
        expect(
          Math.min(...targetSegments.map(([a, b]) => distanceToSegment(tissue, a, b))),
        ).toBeLessThan(1e-9);
        for (let sample = 0; sample < 64; sample++) {
          const fraction = sample / 64;
          expect(
            isInsideCanal({
              x: entry.x + fraction * (tissue.x - entry.x),
              y: entry.y + fraction * (tissue.y - entry.y),
            }),
          ).toBe(true);
        }
        expect(
          Math.abs(
            (entry.x - tissue.x) * (absorber.y - entry.y) -
              (entry.y - tissue.y) * (absorber.x - entry.x),
          ),
        ).toBeLessThan(1e-10);
        const localEntry = earLocalPoint(entry, angleDeg);
        const localAbsorber = earLocalPoint(absorber, angleDeg);
        expect(localEntry.x).toBeCloseTo(0, 10);
        expect(Math.abs(localEntry.y)).toBeLessThanOrEqual(EAR_GEOMETRY.apertureRadiusMm + 1e-10);
        expect(localAbsorber.x).toBeCloseTo(-EAR_GEOMETRY.guideLengthMm, 10);
        expect(localAbsorber.y).toBeCloseTo(0, 10);
      }
    }
  });
});
