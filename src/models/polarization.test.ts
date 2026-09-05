import { describe, expect, it } from 'vitest';
import {
  POLARIZATION_DURATION,
  polarizationAxis,
  polarizationField,
  polarizationLayout,
  polarizationSetup,
  polarizationShot,
  polarizationState,
  projectPolarizationField,
  malusTransmission,
  type PolarizationFilter,
} from './polarization';

describe('ideal polarizers: fields, statistics and energy', () => {
  it('passes half of unpolarized intensity for every first-axis direction', () => {
    for (let angle = -360; angle <= 720; angle += 7.5) {
      const s = polarizationSetup(angle, null, null);
      expect(s.output.intensity).toBeCloseTo(0.5, 13);
      expect(s.absorbed).toBeCloseTo(0.5, 13);
      expect(s.output.matrix.yy + s.output.matrix.zz).toBeCloseTo(s.output.intensity, 13);
    }
  });
  it('does not apply the half rule to already linearly polarized light', () => {
    for (const [angle, expected] of [
      [0, 1],
      [30, 0.75],
      [45, 0.5],
      [60, 0.25],
      [90, 0],
      [180, 1],
    ]) {
      expect(polarizationSetup(angle, null, null, 'linear').output.intensity).toBeCloseTo(
        expected,
        12,
      );
    }
  });
  it('applies Malus to the current incoming intensity, not the original source', () => {
    for (let first = 0; first < 180; first += 15) {
      for (let last = 0; last <= 180; last += 3) {
        const s = polarizationSetup(first, null, last);
        expect(s.output.intensity).toBeCloseTo(0.5 * malusTransmission(last - first), 12);
      }
    }
    expect(polarizationSetup(0, null, 90).output.intensity).toBe(0);
  });
  it('restores one eighth with a middle 45-degree axis and never creates energy', () => {
    const s = polarizationSetup(0, 45, 90);
    expect(s.stages.map((stage) => stage.after.intensity)).toEqual(
      expect.arrayContaining([
        expect.closeTo(0.5, 12),
        expect.closeTo(0.25, 12),
        expect.closeTo(0.125, 12),
      ]),
    );
    expect(s.stages.map((stage) => stage.absorbed)).toEqual([
      expect.closeTo(0.5, 12),
      expect.closeTo(0.25, 12),
      expect.closeTo(0.125, 12),
    ]);
    expect(s.absorbed).toBeCloseTo(0.875, 12);
    for (let angle = 0; angle <= 180; angle++) {
      const state = polarizationSetup(0, angle, 90);
      expect(state.output.intensity).toBeCloseTo(Math.sin((angle * Math.PI) / 90) ** 2 / 8, 12);
      expect(state.output.intensity).toBeLessThanOrEqual(0.125 + 1e-13);
      for (const stage of state.stages) {
        expect(stage.after.intensity).toBeLessThanOrEqual(stage.before.intensity);
        expect(stage.absorbed).toBeGreaterThanOrEqual(0);
      }
      expect(state.output.intensity + state.absorbed).toBeCloseTo(1, 13);
    }
  });
  it('conserves energy for arbitrary ordered stacks, darkness, and scaled sources', () => {
    for (let trial = 0; trial < 100; trial++) {
      const filters = Array.from({ length: 7 }, (_, i): PolarizationFilter => ({
        id: 'A',
        x: (i + 1) / 8,
        angle: (trial * 37 + i * 61) % 180,
      }));
      for (const intensity of [0, 0.125, 1, 12]) {
        const s = polarizationState(filters, trial % 2 ? 'linear' : 'unpolarized', 17, intensity);
        expect(s.absorbed + s.output.intensity).toBeCloseTo(intensity, 11);
        expect(s.output.intensity).toBeGreaterThanOrEqual(0);
        expect(s.output.intensity).toBeLessThanOrEqual(intensity);
      }
    }
  });
  it('projects fields orthogonally and preserves a signed amplitude across a half-turn', () => {
    const vector = { y: 0.8, z: -0.3 };
    for (let angle = 0; angle <= 360; angle += 3) {
      const out = projectPolarizationField(vector, angle),
        u = polarizationAxis(angle);
      expect(out.y * u.z - out.z * u.y).toBeCloseTo(0, 12);
      expect((vector.y - out.y) * out.y + (vector.z - out.z) * out.z).toBeCloseTo(0, 12);
      expect(projectPolarizationField(vector, angle + 180).y).toBeCloseTo(out.y, 12);
      expect(projectPolarizationField(vector, angle + 180).z).toBeCloseTo(out.z, 12);
    }
  });
  it('matches rendered electric-field mean squares to the independent intensity matrix', () => {
    const cases = [
      polarizationState([]),
      polarizationSetup(31, null, null),
      polarizationSetup(0, 45, 90),
      polarizationSetup(0, null, 90),
      polarizationSetup(45, 60, 110, 'linear'),
    ];
    for (const s of cases) {
      const count = 2048;
      let yy = 0,
        yz = 0,
        zz = 0;
      for (let n = 0; n < count; n++) {
        const field = polarizationField(s, 1, n / count / 0.08);
        yy += field.y ** 2 / count;
        yz += (field.y * field.z) / count;
        zz += field.z ** 2 / count;
      }
      expect(yy).toBeCloseTo(s.output.matrix.yy, 11);
      expect(yz).toBeCloseTo(s.output.matrix.yz, 11);
      expect(zz).toBeCloseTo(s.output.matrix.zz, 11);
      expect(yy + zz).toBeCloseTo(s.output.intensity, 11);
    }
  });
  it('rejects non-finite inputs, negative power and physically unordered filters', () => {
    expect(() => polarizationState([], 'unpolarized', 0, -1)).toThrow();
    expect(() => polarizationAxis(NaN)).toThrow();
    expect(() => polarizationField(polarizationState([]), 0, Infinity)).toThrow();
    expect(() =>
      polarizationState([
        { id: 'A', x: 0.5, angle: 0 },
        { id: 'B', x: 0.4, angle: 90 },
      ]),
    ).toThrow();
  });
});

describe('polarization film reconstruction and drawing coordinates', () => {
  it('has eight distinct chapters in a 176-second film with causal boundary states', () => {
    expect(POLARIZATION_DURATION).toBe(176);
    expect(new Set(Array.from({ length: 8 }, (_, c) => polarizationShot(c, 0).view)).size).toBe(8);
    expect(polarizationShot(3, 1).state.output.intensity).toBeCloseTo(0.125, 12);
    expect(polarizationShot(4, 1).state.output.intensity).toBe(0);
    expect(polarizationShot(5, 0).state.output.intensity).toBe(0);
    expect(polarizationShot(5, 1).state.output.intensity).toBeCloseTo(0.125, 12);
    expect(polarizationShot(7, 1).state.output.intensity).toBeCloseTo(0.125, 12);
    for (let c = 3; c < 7; c++) {
      expect(polarizationShot(c, 1).state.output.intensity).toBeCloseTo(
        polarizationShot(c + 1, 0).state.output.intensity,
        12,
      );
    }
  });
  it('reconstructs the same model and field after shuffled chapter seeks', () => {
    const direct = Array.from({ length: 800 }, (_, i) => {
      const chapter = Math.floor(i / 100),
        p = (i % 100) / 99;
      const shot = polarizationShot(chapter, p);
      return { shot, field: polarizationField(shot.state, 0.92, chapter * 22 + p * 22) };
    });
    for (let i = 799; i >= 0; i--) {
      const chapter = Math.floor(i / 100),
        p = (i % 100) / 99;
      const shot = polarizationShot(chapter, p);
      expect({ shot, field: polarizationField(shot.state, 0.92, chapter * 22 + p * 22) }).toEqual(
        direct[i],
      );
    }
  });
  it('keeps every filter and field sample within desktop and independent narrow compositions', () => {
    for (const width of [240, 256, 288, 358, 620, 800, 1200]) {
      const layout = polarizationLayout(width);
      for (let c = 0; c < 8; c++) {
        for (const p of [0, 0.4, 0.7, 1]) {
          const s = polarizationShot(c, p).state;
          const points = s.stages.flatMap((stage) => layout.ring(stage.x));
          for (let x = 0; x <= 1; x += 0.005) {
            const f = polarizationField(s, x, 22 * (c + p));
            points.push(
              layout.project(x, f.y * (layout.phone ? 23 : 30), f.z * (layout.phone ? 23 : 30)),
            );
          }
          for (const point of points) {
            expect(point.x).toBeGreaterThanOrEqual(0);
            expect(point.x).toBeLessThanOrEqual(width);
            expect(point.y).toBeGreaterThanOrEqual(0);
            expect(point.y).toBeLessThanOrEqual(layout.height);
          }
        }
      }
    }
  });
});
