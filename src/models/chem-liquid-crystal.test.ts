import { describe, it, expect } from 'vitest';
import {
  historicalState,
  sampleCell,
  microscopic,
  order,
  directorProfile,
  ellipticK,
  fieldCell,
} from './chem-liquid-crystal';
describe('liquid-crystal evidence', () => {
  it('keeps melting and clearing separate', () => {
    expect(historicalState(-0.2).phase).toBe('solid');
    expect(historicalState(0.5).cloudy).toBe(1);
    expect(historicalState(1.2).clear).toBe(1);
  });
  it('preserves sample area and a horizontal liquid surface throughout tilt', () => {
    for (let a = -18; a <= 18; a += 0.5) {
      const q = sampleCell(a);
      expect(q.area).toBeCloseTo(q.target, 7);
      expect(q.fluid.filter((p) => Math.abs(p.y - q.level) < 1e-8)).toHaveLength(2);
    }
  });
  it('keeps all moving identities inside the cell without rod envelopes intersecting', () => {
    for (let n = 0; n <= 200; n++) {
      const p = microscopic(n / 10, 0.5);
      expect(new Set(p.map((v) => v.id)).size).toBe(24);
      for (const a of p) {
        expect(a.x).toBeGreaterThan(24.9);
        expect(a.x).toBeLessThan(295.1);
        expect(a.y).toBeGreaterThan(24.9);
        expect(a.y).toBeLessThan(225.1);
      }
      for (let i = 0; i < 24; i++)
        for (let j = i + 1; j < 24; j++)
          expect(Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y)).toBeGreaterThan(26.9);
    }
  });
  it('distinguishes translational and headless orientational order from actual coordinates', () => {
    const crystal = order(microscopic(0)),
      nematic = order(microscopic(12)),
      isotropic = order(microscopic(20, 1));
    expect(crystal.position).toBeCloseTo(1, 10);
    expect(nematic.position).toBeLessThan(0.6);
    expect(nematic.orientation).toBeGreaterThan(0.9);
    expect(isotropic.orientation).toBeLessThan(1e-12);
  });
  it('solves the anchored director with a threshold and a symmetric interior tilt', () => {
    expect(ellipticK(0.5)).toBeCloseTo(1.685750354812596, 11);
    expect(directorProfile(0.99).amplitude).toBe(0);
    for (const v of [1.01, 1.2, 2, 3]) {
      const p = directorProfile(v);
      expect((2 * ellipticK(p.k)) / Math.PI).toBeCloseTo(v, 6);
      expect(p.at(0)).toBe(0);
      expect(p.at(1)).toBe(0);
      expect(p.at(0.5)).toBeCloseTo(p.amplitude, 8);
      for (let i = 0; i < 20; i++) expect(p.at(i / 20)).toBeCloseTo(p.at(1 - i / 20), 8);
    }
  });
  it('derives optical change from the same nonuniform director profile', () => {
    expect(fieldCell(0).intensity).toBeCloseTo(1, 8);
    expect(fieldCell(0.8).intensity).toBeCloseTo(1, 8);
    expect(fieldCell(3).intensity).toBeLessThan(0.1);
    let prev = 1;
    for (let i = 0; i <= 30; i++) {
      const a = fieldCell(i / 10);
      expect(a.intensity).toBeLessThanOrEqual(prev + 1e-6);
      expect(a.deltaN).toBeGreaterThan(0);
      prev = a.intensity;
    }
  });
});
