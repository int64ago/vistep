import { describe, expect, it } from 'vitest';
import {
  EAR_CALIBRATION,
  EAR_DEFAULT,
  EAR_HALF_FOV_DEG,
  EAR_IR,
  earBandRadiance,
  earInvertRadiance,
  earMeasure,
  earShot,
  earSpectralRadiance,
} from './ear-thermometer';
import {
  EAR_ADC,
  EAR_GEOMETRY,
  EAR_REFERENCE_ROUTES,
  EAR_SIGNAL_ROUTES,
  EAR_THERMOPILE_JUNCTIONS,
  earCalibrationPath,
  earLocalPoint,
  earPointOnPath,
} from './ear-thermometer-geometry';

describe('passive finite-band ear radiometry', () => {
  it('integrates the specified band, with independent high-resolution quadrature and a monotone inverse', () => {
    for (const temperature of [-30, 15, 22, 32, 37, 40, 80]) {
      const n = 4000,
        dx = (14e-6 - 8e-6) / n;
      let reference = 0;
      for (let i = 0; i < n; i++)
        reference += earSpectralRadiance(temperature, 8e-6 + (i + 0.5) * dx) * dx;
      expect(earBandRadiance(temperature) / reference).toBeCloseTo(1, 7);
      expect(earInvertRadiance(earBandRadiance(temperature))).toBeCloseTo(temperature, 8);
      expect(earBandRadiance(temperature + 0.1)).toBeGreaterThan(earBandRadiance(temperature));
    }
    const totalBlackRadiance = (5.670374419e-8 * (37 + 273.15) ** 4) / Math.PI;
    expect(earBandRadiance(37)).toBeLessThan(totalBlackRadiance * 0.6);
    expect(earBandRadiance(37)).toBeGreaterThan(totalBlackRadiance * 0.3);
  });
  it('samples actual tissue first intersections and traverses the same entrance stop to absorber', () => {
    for (const angleDeg of [-24, -16, 0, 12, 20, 24]) {
      const frame = earMeasure({ angleDeg });
      expect(frame.rays.reduce((sum, r) => sum + r.weight, 0)).toBeCloseTo(1, 12);
      for (const ray of frame.rays) {
        const [source, entry, detector] = ray.points,
          local = ray.points.map((p) => earLocalPoint(p, angleDeg));
        expect(source.x).toBeGreaterThan(entry.x);
        expect(Math.abs(local[1].y)).toBeLessThanOrEqual(EAR_GEOMETRY.apertureRadiusMm + 1e-12);
        expect(local[1].x).toBeCloseTo(0, 12);
        expect(local[2].x).toBeCloseTo(-EAR_GEOMETRY.guideLengthMm, 12);
        expect(local[2].y).toBeCloseTo(0, 12);
        expect(
          (source.x - entry.x) * (detector.y - entry.y) -
            (source.y - entry.y) * (detector.x - entry.x),
        ).toBeCloseTo(0, 10);
        for (const f of [0.1, 0.5, 0.9]) {
          const p = earLocalPoint(earPointOnPath([entry, detector], f), angleDeg);
          expect(Math.abs(p.y)).toBeLessThan(EAR_GEOMETRY.guideRearRadiusMm);
        }
        // The displayed source belongs to the named anatomical boundary.
        const boundaries =
          ray.region === 'drum'
            ? [[EAR_GEOMETRY.upper.at(-1)!, EAR_GEOMETRY.lower.at(-1)!]]
            : [EAR_GEOMETRY.upper, EAR_GEOMETRY.lower];
        const distance = Math.min(
          ...boundaries.flatMap((points) =>
            points.slice(1).map((b, i) => {
              const a = points[i],
                dx = b.x - a.x,
                dy = b.y - a.y,
                t = Math.max(
                  0,
                  Math.min(
                    1,
                    ((source.x - a.x) * dx + (source.y - a.y) * dy) / (dx * dx + dy * dy),
                  ),
                );
              return Math.hypot(source.x - a.x - t * dx, source.y - a.y - t * dy);
            }),
          ),
        );
        expect(distance).toBeLessThan(1e-10);
      }
    }
    expect(EAR_HALF_FOV_DEG).toBeCloseTo((Math.atan(0.65 / 5) * 180) / Math.PI, 12);
  });
  it('changing orientation changes sampled regions, not their assigned temperatures', () => {
    const aimed = earMeasure(),
      turned = earMeasure({ angleDeg: 20 });
    expect(aimed.drumFraction).toBeGreaterThan(0.98);
    expect(aimed.compensatedC.toFixed(1)).toBe('37.0');
    expect(turned.drumFraction).toBeLessThan(0.15);
    expect(turned.compensatedC).toBeLessThan(aimed.compensatedC - 1);
    expect(turned.drumC).toBe(aimed.drumC);
    expect(turned.outerWallC).toBe(aimed.outerWallC);
    expect(turned.innerWallC).toBe(aimed.innerWallC);
  });
  it('recovers an unchanged target from net signal and a changing package reference', () => {
    const cool = earMeasure({ sensorC: 22 }),
      warm = earMeasure({ sensorC: 30 });
    expect(warm.signalMv).toBeLessThan(cool.signalMv);
    expect(warm.referenceRadiance).toBeGreaterThan(cool.referenceRadiance);
    expect(warm.compensatedC).toBeCloseTo(cool.compensatedC, 10);
    expect(warm.uncompensatedC).toBeLessThan(warm.compensatedC - 5);
    for (const sensorC of [15, 22, 30, 35]) {
      for (const angleDeg of [-24, 0, 24]) {
        const f = earMeasure({ sensorC, angleDeg });
        expect(f.signalMv / EAR_IR.gainMvPerRadiance + f.referenceRadiance).toBeCloseTo(
          f.radiance,
          10,
        );
      }
    }
  });
  it('inverts a mixture of radiances, and cannot resolve separate tissue temperatures', () => {
    const f = earMeasure({ angleDeg: 9, drumC: 40, outerWallC: 28, innerWallC: 28 });
    expect(f.drumFraction).toBeGreaterThan(0);
    expect(f.drumFraction).toBeLessThan(1);
    const expectedRadiance =
      f.drumFraction * earBandRadiance(40) + (1 - f.drumFraction) * earBandRadiance(28);
    expect(f.radiance).toBeCloseTo(expectedRadiance, 10);
    expect(f.drumSignalFraction).toBeCloseTo(
      (f.drumFraction * earBandRadiance(40)) / expectedRadiance,
      10,
    );
    const arithmeticMean = f.drumFraction * 40 + (1 - f.drumFraction) * 28;
    expect(f.compensatedC).toBeGreaterThan(arithmeticMean + 0.05);
    expect(f.compensatedC).toBeGreaterThan(28);
    expect(f.compensatedC).toBeLessThan(40);
  });
  it('keeps all extreme supported inputs finite, bounded, and rejects nonphysical inputs', () => {
    for (const angleDeg of [-24, 24])
      for (const sensorC of [15, 35])
        for (const drumC of [34, 40])
          for (const outerWallC of [28, 40]) {
            const f = earMeasure({ angleDeg, sensorC, drumC, outerWallC, innerWallC: outerWallC });
            expect(
              [f.radiance, f.signalMv, f.compensatedC, f.uncompensatedC].every(Number.isFinite),
            ).toBe(true);
            expect(f.compensatedC).toBeGreaterThanOrEqual(Math.min(drumC, outerWallC) - 1e-8);
            expect(f.compensatedC).toBeLessThanOrEqual(Math.max(drumC, outerWallC) + 1e-8);
          }
    for (const bad of [{ angleDeg: 25 }, { angleDeg: NaN }, { sensorC: 100 }, { drumC: Infinity }])
      expect(() => earMeasure(bad)).toThrow(RangeError);
    expect(() => earSpectralRadiance(-273.15, 10e-6)).toThrow(RangeError);
    expect(() => earInvertRadiance(-1)).toThrow(RangeError);
  });
  it('calibration samples share the gain and finite-band model', () => {
    for (const p of EAR_CALIBRATION)
      expect(
        earInvertRadiance(p.signalMv / EAR_IR.gainMvPerRadiance + earBandRadiance(22)),
      ).toBeCloseTo(p.temperatureC, 8);
  });
  it('uses connected thermocouple/ADC geometry and unbent blackbody-to-absorber paths', () => {
    EAR_SIGNAL_ROUTES.forEach((route, i) => {
      expect(route[0]).toEqual(i ? EAR_THERMOPILE_JUNCTIONS.at(-1) : EAR_THERMOPILE_JUNCTIONS[0]);
      expect(route.at(-1)!.x).toBeCloseTo(EAR_ADC.x + EAR_ADC.width, 12);
    });
    EAR_REFERENCE_ROUTES.forEach((route) =>
      expect(route.at(-1)!.x).toBeCloseTo(EAR_ADC.x + EAR_ADC.width, 12),
    );
    for (const offset of [-0.6, 0, 0.6]) {
      const [source, entry, detector] = earCalibrationPath(offset);
      expect(
        (source.x - entry.x) * (detector.y - entry.y) -
          (source.y - entry.y) * (detector.x - entry.x),
      ).toBeCloseTo(0, 12);
      expect(entry.x - detector.x).toBe(EAR_GEOMETRY.guideLengthMm);
      expect(Math.abs(entry.y)).toBeLessThan(EAR_GEOMETRY.apertureRadiusMm);
      expect(source.x).toBeGreaterThan(entry.x);
      expect(entry.x).toBeGreaterThan(detector.x);
    }
  });
  it('reconstructs each shot and physical reading exactly on backward seeks and final hold', () => {
    const snapshots = Array.from({ length: 7 }, (_, chapter) =>
      [0, 0.35, 0.7, 1].map((p) => ({
        shot: earShot(chapter, p),
        frame: earMeasure(earShot(chapter, p).input),
      })),
    ).flat();
    for (const prior of snapshots.toReversed()) {
      const shot = earShot(prior.shot.chapter, prior.shot.progress);
      expect(shot).toEqual(prior.shot);
      expect(earMeasure(shot.input)).toEqual(prior.frame);
    }
    expect(earShot(6, 1).input).toEqual(EAR_DEFAULT);
    expect(earShot(3, 1).input.sensorC).toBe(30);
    expect(earShot(5, 1).input.angleDeg).toBe(20);
    expect(() => earShot(0, NaN)).toThrow(RangeError);
    expect(() => earShot(7, 0.5)).toThrow(RangeError);
  });
});
