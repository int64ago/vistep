import { describe, expect, it } from 'vitest';
import { pcaData, pcaFit, pcaProject } from './principal-components';
describe('centered two-dimensional principal components', () => {
  it('recovers the designed rotated Cartesian cloud and its exact population eigenvalues', () => {
    const fit = pcaFit(pcaData());
    expect(fit.mean.x).toBeCloseTo(4, 12);
    expect(fit.mean.y).toBeCloseTo(3, 12);
    expect(fit.lambda1).toBeCloseTo(5, 12);
    expect(fit.lambda2).toBeCloseTo(0.25, 12);
    expect((fit.angle * 180) / Math.PI).toBeCloseTo(30, 10);
    expect(fit.ratio).toBeCloseTo(5 / 5.25, 12);
    const p = pcaProject(fit, fit.angle);
    expect(p.error).toBeCloseTo(0.25, 12);
    expect(p.items.map((p) => Math.round(p.score))).toEqual([-3, -3, -1, -1, 1, 1, 3, 3]);
  });
  it('matches independent angle sweep for minimum orthogonal squared reconstruction error', () => {
    const fit = pcaFit(pcaData()),
      best = pcaProject(fit, fit.angle);
    for (let i = 0; i < 1800; i++) {
      const angle = (i * Math.PI) / 1800,
        u = [Math.cos(angle), Math.sin(angle)],
        independent =
          fit.centered.reduce((sum, p) => sum + (p.x * u[1] - p.y * u[0]) ** 2, 0) /
          fit.centered.length;
      expect(independent + 1e-10).toBeGreaterThanOrEqual(best.error);
      expect(pcaProject(fit, angle).variance + pcaProject(fit, angle).error).toBeCloseTo(
        fit.total,
        10,
      );
    }
  });
  it('is translation invariant but deliberately sensitive to changed coordinate units', () => {
    const base = pcaFit(pcaData()),
      shifted = pcaFit(pcaData().map((p) => ({ x: p.x + 17, y: p.y - 9 }))),
      scaled = pcaFit(pcaData(), 10);
    expect(shifted.lambda1).toBeCloseTo(base.lambda1, 11);
    expect(shifted.angle).toBeCloseTo(base.angle, 11);
    expect(scaled.angle).toBeLessThan(base.angle / 2);
    const u = pcaProject(scaled, scaled.angle).direction,
      C = scaled.covariance;
    expect(C.xx * u.x + C.xy * u.y).toBeCloseTo(scaled.lambda1 * u.x, 10);
    expect(C.xy * u.x + C.yy * u.y).toBeCloseTo(scaled.lambda1 * u.y, 10);
  });
  it('exposes nonunique isotropic directions, zero variance and input boundaries', () => {
    const same = pcaFit(pcaData(true));
    expect(same.degenerate).toBe(true);
    for (const angle of [0, 0.3, 1, 2]) {
      expect(pcaProject(same, angle).variance).toBeCloseTo(0.5, 12);
      expect(pcaProject(same, angle).error).toBeCloseTo(0.5, 12);
    }
    const flat = pcaFit([
      { x: 2, y: 2 },
      { x: 2, y: 2 },
    ]);
    expect(flat.ratio).toBeNull();
    expect(flat.degenerate).toBe(true);
    expect(() => pcaFit([])).toThrow();
    expect(() => pcaFit([{ x: NaN, y: 0 }])).toThrow();
    expect(() => pcaFit(pcaData(), 0)).toThrow();
  });
});
