import { describe, it, expect } from 'vitest';
import {
  metalLayers,
  norm,
  sub,
  drude,
  thermalResponse,
  velocityDensity,
  graphite,
  graphiteBase,
  central,
  CC,
  layerSpacing,
  orbitalRing,
  conductivity,
  orbitalContour,
} from './chem-metal-and-graphite';
describe('metal and graphite mechanisms', () => {
  it('slides identical close-packed layers without hard-core overlap', () => {
    for (let k = 0; k <= 100; k++) {
      const s = metalLayers(k / 100);
      for (let i = 0; i < s.atoms.length; i++)
        for (let j = i + 1; j < s.atoms.length; j++)
          expect(norm(sub(s.atoms[i].p, s.atoms[j].p))).toBeGreaterThanOrEqual(1 - 1e-10);
      if (k)
        for (const a of s.atoms)
          expect(
            norm(sub(a.p, metalLayers((k - 1) / 100).atoms.find((b) => b.id === a.id)!.p)),
          ).toBeLessThan(0.018);
    }
    expect(metalLayers(0).lift).toBeCloseTo(0);
    expect(metalLayers(1).lift).toBeCloseTo(0);
    expect(metalLayers(0.5).lift).toBeCloseTo(1 - Math.sqrt(3) / 2);
  });
  it('obeys the independent Drude transient, sign and zero-field limits', () => {
    expect(drude(1, 1, 1).velocity).toBeCloseTo(-(1 - Math.exp(-1)));
    expect(drude(100, 2, 0.5).current).toBeCloseTo(1);
    expect(drude(10, 0, 1).current).toBe(0);
    expect(drude(3, -1, 1).velocity).toBeGreaterThan(0);
    const h = 1e-4;
    expect((drude(2 + h, 1, 0.7).velocity - drude(2 - h, 1, 0.7).velocity) / (2 * h)).toBeCloseTo(
      -1 - drude(2, 1, 0.7).velocity / 0.7,
      7,
    );
  });
  it('keeps classical distribution area and reduces current when phonon relaxation time shortens', () => {
    for (const T of [1, 2, 3]) {
      const s = thermalResponse(T);
      let integral = 0;
      for (let i = -2000; i <= 2000; i++)
        integral += velocityDensity(i * 0.01, s.velocity, s.width) * 0.01;
      expect(integral).toBeCloseTo(1, 6);
    }
    expect(thermalResponse(3).current).toBeLessThan(thermalResponse(1).current);
  });
  it('derives planar threefold honeycomb bonds and separated AB sheets', () => {
    const g = graphiteBase,
      ns = g.bonds.filter((b) => b.a === central || b.b === central);
    expect(ns).toHaveLength(3);
    for (const b of g.bonds)
      expect(
        norm(sub(g.atoms.find((a) => a.id === b.a)!.p, g.atoms.find((a) => a.id === b.b)!.p)),
      ).toBeCloseTo(CC, 10);
    const zs = [...new Set(g.atoms.map((a) => a.p.z))].sort((a, b) => a - b);
    expect(zs).toEqual([-layerSpacing, 0, layerSpacing]);
    expect(orbitalRing).toHaveLength(6);
    expect(new Set(orbitalRing).size).toBe(6);
    for (let i = 0; i < 6; i++)
      expect(
        g.bonds.some(
          (b) =>
            [b.a, b.b].includes(orbitalRing[i]) && [b.a, b.b].includes(orbitalRing[(i + 1) % 6]),
        ),
      ).toBe(true);
  });
  it('preserves all intralayer bonds during rigid graphite slip', () => {
    const g = graphite(1.42);
    for (const b of g.bonds)
      expect(
        norm(sub(g.atoms.find((a) => a.id === b.a)!.p, g.atoms.find((a) => a.id === b.b)!.p)),
      ).toBeCloseTo(CC, 10);
    expect(g.atoms.map((a) => a.id)).toEqual(graphiteBase.atoms.map((a) => a.id));
  });
  it('has nonzero transverse conduction and positive Joule dissipation at every angle', () => {
    expect(conductivity(0).longitudinal).toBeCloseTo(1);
    expect(conductivity(90).longitudinal).toBeCloseTo(0.02);
    expect(conductivity(45).longitudinal).toBeCloseTo(0.51);
    for (let a = 0; a <= 180; a++) expect(conductivity(a).longitudinal).toBeGreaterThan(0);
    expect(conductivity(90, 1).longitudinal).toBeCloseTo(1);
  });
  it('keeps p-orbital lobes on opposite sides of the nodal plane', () => {
    const up = orbitalContour(1),
      down = orbitalContour(-1);
    expect(up.length).toBeGreaterThan(10);
    expect(up.every((p) => p.z > 0)).toBe(true);
    expect(down.every((p) => p.z < 0)).toBe(true);
    expect(up.map((p) => p.x)).toEqual(down.map((p) => p.x));
  });
});
