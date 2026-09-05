import { describe, expect, it } from 'vitest';
import {
  microscopeDefaults as defaults,
  microscopeOptics as optics,
  microscopeObjectDistance as u0,
  microscopePropagation,
  microscopeLens,
  microscopeMultiply,
  microscopeTransfer,
  microscopeSystem,
  microscopeRay,
  microscopeBessel,
  microscopeKernel,
  microscopeKernelAt,
  microscopeAxialPeak,
  microscopeField,
  microscopeIntensity,
  microscopeImage,
  microscopeShot,
} from './microscope';

describe('Finite microscope: conjugates, pupil and specimen', () => {
  it('preserves paraxial phase-space area through propagation and both lenses', () => {
    for (const f of [8, 10, 25]) {
      const matrix = microscopeMultiply(
        microscopeLens(f),
        microscopeMultiply(microscopePropagation(160), microscopeLens(8)),
      );
      expect(matrix[0] * matrix[3] - matrix[1] * matrix[2]).toBeCloseTo(1, 12);
    }
    const m = microscopeMultiply(
      microscopePropagation(160),
      microscopeMultiply(microscopeLens(8), microscopePropagation(u0)),
    );
    expect(m[1]).toBeCloseTo(0, 12);
    expect(m[0]).toBeCloseTo(-19, 12);
  });
  it('agrees with independent thin-lens conjugates and all actual pupil rays meet there', () => {
    for (const focus of [-24, 0, 24]) {
      const c = { ...defaults, focus },
        s = microscopeSystem(c);
      expect(1 / s.u + 1 / s.imageDistance).toBeCloseTo(1 / 8, 13);
      for (const y of [-0.04, 0, 0.04])
        for (const a of [-1, -0.3, 0, 0.7, 1]) {
          const ray = microscopeRay(c, y, a);
          expect(ray.atImage.h).toBeCloseTo((-s.imageDistance / s.u) * y, 12);
          expect(ray.points[1].h - ray.points[0].h).toBeCloseTo(ray.incoming * s.u, 12);
          expect(ray.objectiveSlope).toBeCloseTo(ray.incoming - ray.points[1].h / 8, 12);
          expect(ray.outgoingSlope).toBeCloseTo(
            ray.objectiveSlope - ray.points[3].h / s.eyepiece,
            12,
          );
        }
    }
  });
  it('makes the real intermediate image the eyepiece front focal plane at relaxed-eye focus', () => {
    for (const ocular of [10, 20, 25]) {
      const c = { ...defaults, ocular },
        s = microscopeSystem(c);
      expect(s.eyeZ - 160).toBeCloseTo(250 / ocular, 12);
      const rays = [-1, -0.5, 0, 0.5, 1].map((a) => microscopeRay(c, 0.04, a));
      for (const ray of rays) {
        expect(ray.outgoingSlope).toBeCloseTo((19 * 0.04) / s.eyepiece, 12);
        expect(ray.blocked).toBe(false);
      }
      expect(s.visualMagnification).toBeCloseTo(-19 * ocular, 10);
    }
  });
  it('links the geometric blur circle to the same finite pupil and ray matrix', () => {
    for (const focus of [-20, 0, 20]) {
      const c = { ...defaults, focus },
        s = microscopeSystem(c);
      const low = microscopeRay(c, 0, -1),
        high = microscopeRay(c, 0, 1);
      expect(Math.abs(high.points[2].h - low.points[2].h) / 2).toBeCloseTo(s.geometricBlur, 12);
      const output = microscopeTransfer(s.matrix, 0, s.pupil / s.u);
      expect(output.height).toBeCloseTo(high.points[2].h, 12);
    }
  });
  it('evaluates Bessel functions against an independent periodic angular quadrature', () => {
    // Jn(x) = mean cos(nθ − x sin θ), on the complete circle.
    for (const n of [0, 1] as const)
      for (const x of [0, 1, 3.83170597, 13.9, 14, 20, 35.7]) {
        let sum = 0;
        for (let k = 0; k < 4096; k++) {
          const a = (2 * Math.PI * k) / 4096;
          sum += Math.cos(n * a - x * Math.sin(a));
        }
        expect(microscopeBessel(n, x)).toBeCloseTo(sum / 4096, 8);
      }
  });
  it('recovers an Airy pattern and its first zero from the Fresnel pupil integration', () => {
    const kernel = microscopeKernel(0);
    expect(kernel[0]).toBeCloseTo(1, 12);
    for (const v of [0.2, 1, 2, 4, 8, 12, 20, 30]) {
      const expected = ((2 * microscopeBessel(1, v)) / v) ** 2;
      expect(microscopeKernelAt(kernel, v)).toBeCloseTo(expected, 6);
    }
    expect(microscopeKernelAt(kernel, 3.83170597)).toBeLessThan(0.00005);
  });
  it('recovers analytic on-axis defocus and conjugate sign symmetry', () => {
    for (const beta of [0, 0.3, 2, 5, 9]) {
      const positive = microscopeKernel(beta),
        negative = microscopeKernel(-beta);
      expect(positive[0]).toBeCloseTo(microscopeAxialPeak(beta), 6);
      for (let i = 0; i < positive.length; i += 17)
        expect(positive[i]).toBeCloseTo(negative[i], 13);
    }
  });
  it('opens the same objective pupil without changing geometric magnification', () => {
    const low = microscopeSystem({ ...defaults, na: 0.08 }),
      high = microscopeSystem({ ...defaults, na: 0.24 });
    expect(high.pupil / low.pupil).toBeCloseTo(3, 12);
    expect(low.magnification).toBe(high.magnification);
    expect(low.rayleigh / high.rayleigh).toBeCloseTo(3, 12);
    expect(low.depthScale / high.depthScale).toBeCloseTo(9, 12);
    expect((high.na - high.exactSineNA) / high.exactSineNA).toBeLessThan(0.03);
  });
  it('creates a central dip for the same two points at high NA, not merely a label', () => {
    const low = microscopeField({ ...defaults, na: 0.08 }),
      high = microscopeField({ ...defaults, na: 0.24 });
    expect(microscopeIntensity(low, 0, 0)).toBeGreaterThan(microscopeIntensity(low, 1.2, 0));
    expect(microscopeIntensity(high, 0, 0)).toBeLessThan(microscopeIntensity(high, 1.2, 0) * 0.4);
  });
  it('reverses which physical layer is focused when the stage moves 20 µm', () => {
    const a = microscopeField({ ...defaults, na: 0.24, layers: true, focus: 0 });
    const b = microscopeField({ ...defaults, na: 0.24, layers: true, focus: 20 });
    expect(a.points.find((p) => p.z === 0)!.kernel[0]).toBeCloseTo(1, 10);
    expect(b.points.find((p) => p.z === 20)!.kernel[0]).toBeCloseTo(1, 10);
    expect(a.points.find((p) => p.z === 20)!.kernel[0]).toBeLessThan(0.1);
    expect(b.points.find((p) => p.z === 0)!.kernel[0]).toBeLessThan(0.1);
  });
  it('keeps specimen transfer unchanged when the ocular only enlarges angular scale', () => {
    const a = microscopeField({ ...defaults, na: 0.08, ocular: 10 }),
      b = microscopeField({ ...defaults, na: 0.08, ocular: 25 });
    expect(a.span / b.span).toBe(2.5);
    for (const x of [-3, -1, 0, 1, 3])
      expect(microscopeIntensity(a, x, 0)).toBe(microscopeIntensity(b, x, 0));
    const image = microscopeImage(a, 31);
    expect(image.pixels).toHaveLength(31 * 31 * 4);
    const center = microscopeIntensity(a, 0, 0);
    expect(image.pixels[4 * (15 * 31 + 15)]).toBe(
      new Uint8ClampedArray([15 + 223 * Math.min(1, center / 1.25)])[0],
    );
  });
  it('reconstructs every chapter and all supported controls without accumulated history', () => {
    const states = Array.from({ length: 8 }, (_, c) =>
      Array.from({ length: 41 }, (_, i) => microscopeShot(c, i / 40)),
    );
    for (let c = 7; c >= 0; c--)
      for (let i = 40; i >= 0; i--) expect(microscopeShot(c, i / 40)).toEqual(states[c][i]);
    for (const focus of [-24, 24])
      for (const na of [0.08, 0.24])
        for (const ocular of [10, 25])
          for (const layers of [false, true])
            for (const separation of [1, 5]) {
              const config = { ...defaults, focus, na, ocular, layers, separation };
              expect(
                microscopeField(config).points.every((p) => [...p.kernel].every(Number.isFinite)),
              ).toBe(true);
              expect(
                microscopeRay(config, 0.04, 1).points.every((p) => Number.isFinite(p.h + p.z)),
              ).toBe(true);
            }
    expect(optics.wavelength).toBe(0.55);
    expect(() => microscopeSystem({ ...defaults, focus: 100 })).toThrow();
    expect(() => microscopeSystem({ ...defaults, na: 0 })).toThrow();
    expect(() => microscopeRay(defaults, 0, 1.01)).toThrow();
  });
});
