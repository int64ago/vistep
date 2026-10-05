import { describe, expect, it } from 'vitest';
import {
  MYOPIA_LENSLETS,
  MYOPIA_OPTICS as C,
  MYOPIA_SELECTED_LENSLET,
  MYOPIA_SLICE_LENSLET_MM,
  MYOPIA_TRIAL,
  myopiaOptics,
  myopiaShot,
} from './myopia-lens';
describe('myopia lens paraxial optics', () => {
  it('uses a wide admitted central bundle to distinguish retinal blur from corrected convergence', () => {
    for (const myopiaD of [1, 3, 5])
      for (const kind of ['none', 'single'] as const) {
        const s = myopiaOptics({ kind, myopiaD, angleDeg: 0 });
        const sourceHeights = s.rays.map((ray) => ray.points[1].y);
        sourceHeights.forEach((height, index) =>
          expect(height).toBeCloseTo([-2.6, -1.3, 0, 1.3, 2.6][index], 12),
        );
        expect(s.rays.every((ray) => ray.admitted && ray.points.length === 4)).toBe(true);
        for (const ray of s.rays) {
          expect(Math.abs(ray.points[1].y)).toBeLessThanOrEqual(C.clearDiameterMm / 2);
          expect(Math.abs(ray.points[2].y)).toBeLessThanOrEqual(C.pupilRadiusM * 1000);
        }
      }
    const uncorrected = myopiaOptics({ kind: 'none', myopiaD: 3, angleDeg: 0 }),
      corrected = myopiaOptics({ kind: 'single', myopiaD: 3, angleDeg: 0 });
    const spread = (s: typeof corrected) => {
      const heights = s.rays.map((ray) => ray.points[3].y);
      return Math.max(...heights) - Math.min(...heights);
    };
    expect(spread(uncorrected)).toBeGreaterThan(0.25);
    expect(spread(corrected)).toBeLessThan(1e-12);
  });
  it('vertex-corrected single vision focuses on the retinal plane across the supported range', () => {
    for (const myopiaD of [1, 2, 3, 4, 5])
      for (const angleDeg of [0, 12, 18, 20]) {
        const s = myopiaOptics({ kind: 'single', myopiaD, angleDeg });
        expect(s.baseD / (1 - C.vertexM * s.baseD)).toBeCloseTo(-myopiaD, 12);
        expect(s.foci[0].point.x).toBeCloseTo(s.retinaMm, 12);
        const ends = s.rays.map((r) => r.points.at(-1)!);
        expect(Math.max(...ends.map((p) => p.y)) - Math.min(...ends.map((p) => p.y))).toBeLessThan(
          1e-12,
        );
      }
  });
  it('uncorrected focus stays fixed while increasing myopia moves the receiving plane behind it', () => {
    const a = myopiaOptics({ kind: 'none', myopiaD: 1, angleDeg: 0 });
    const b = myopiaOptics({ kind: 'none', myopiaD: 5, angleDeg: 0 });
    expect(a.foci[0].point.x).toBeCloseTo((1000 * C.vitreousIndex) / C.eyePower, 12);
    expect(b.foci[0].point.x).toBe(a.foci[0].point.x);
    expect(b.retinaMm).toBeGreaterThan(a.retinaMm);
    expect(b.rays[0].points.at(-1)!.y).not.toBe(b.rays[4].points.at(-1)!.y);
  });
  it('lenslet rays physically meet at their computed focus and preserve the clear component', () => {
    for (const addD of [0, 1, 2, 3.5, 4]) {
      const s = myopiaOptics({ kind: 'dims', addD, angleDeg: 18 });
      const f = s.foci[1];
      expect(f.admitted).toBe(true);
      expect(s.foci[0].point.x).toBeCloseTo(s.retinaMm, 12);
      for (const ray of s.rays.filter((r) => r.kind === 'defocus' && r.admitted)) {
        const a = ray.points[2],
          b = ray.points[3];
        expect(a.y + ((b.y - a.y) * (f.point.x - a.x)) / (b.x - a.x)).toBeCloseTo(f.point.y, 11);
      }
      expect(s.defocusMm).toBeGreaterThanOrEqual(-1e-12);
      if (addD > 0) expect(s.defocusMm).toBeGreaterThan(0);
    }
  });
  it('blocks the selected annular bundle at straight-ahead gaze rather than drawing it through the iris', () => {
    const s = myopiaOptics({ kind: 'dims', angleDeg: 0 });
    expect(s.foci[1].admitted).toBe(false);
    expect(
      s.rays.filter((r) => r.kind === 'defocus').every((r) => !r.admitted && r.points.length === 3),
    ).toBe(true);
  });
  it('uses the selected lenslet radial section and checks every ray against the circular-pupil section', () => {
    expect(MYOPIA_SLICE_LENSLET_MM).toBeCloseTo(
      -Math.hypot(MYOPIA_SELECTED_LENSLET.x, MYOPIA_SELECTED_LENSLET.y),
      12,
    );
    for (const angleDeg of [0, 13, 14, 18, 20]) {
      const s = myopiaOptics({ kind: 'dims', angleDeg });
      const rays = s.rays.filter((r) => r.kind === 'defocus');
      expect(rays[2].points[1].y).toBeCloseTo(MYOPIA_SLICE_LENSLET_MM, 12);
      for (const ray of rays)
        expect(ray.admitted).toBe(Math.abs(ray.points[2].y) <= C.pupilRadiusM * 1000);
    }
  });
  it('clips central samples to their actual clear zone while keeping annular samples within the lenslet radius', () => {
    for (const myopiaD of [1, 5])
      for (const kind of ['none', 'single', 'dims'] as const)
        for (const angleDeg of [-20, -18, 0, 18, 20])
          for (const addD of [0, 4]) {
            const s = myopiaOptics({ myopiaD, kind, angleDeg, addD });
            for (const ray of s.rays) {
              const h = ray.points[1].y;
              if (ray.kind === 'clear')
                expect(Math.abs(h)).toBeLessThanOrEqual(C.clearDiameterMm / 2);
              else
                expect(Math.abs(h - MYOPIA_SLICE_LENSLET_MM)).toBeLessThanOrEqual(
                  C.lensletDiameterMm / 2,
                );
              expect(ray.admitted).toBe(Math.abs(ray.points[2].y) <= C.pupilRadiusM * 1000);
              expect(ray.points).toHaveLength(ray.admitted ? 4 : 3);
              expect(ray.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(
                true,
              );
              if (ray.admitted) {
                const focus = s.foci.find((f) => f.kind === ray.kind)!.point,
                  eye = ray.points[2],
                  retina = ray.points[3];
                expect(
                  eye.y + ((retina.y - eye.y) * (focus.x - eye.x)) / (retina.x - eye.x),
                ).toBeCloseTo(focus.y, 11);
              }
            }
            expect(s.foci[0].admitted).toBe(true);
            expect(
              s.foci.every((f) => Number.isFinite(f.point.x) && Number.isFinite(f.point.y)),
            ).toBe(true);
            if (kind === 'dims' && addD === 0) {
              expect(s.foci[1].point.x).toBeCloseTo(s.foci[0].point.x, 12);
              expect(s.foci[1].point.y).toBeCloseTo(s.foci[0].point.y, 12);
              expect(s.defocusMm).toBeCloseTo(0, 12);
            }
          }
    const positive = myopiaOptics({ kind: 'dims', angleDeg: 20 }),
      negative = myopiaOptics({ kind: 'dims', angleDeg: -20 });
    expect(positive.rays.find((ray) => ray.kind === 'clear')!.points[1].y).toBe(-4.5);
    expect(negative.rays.filter((ray) => ray.kind === 'clear').at(-1)!.points[1].y).toBe(4.5);
  });
  it('keeps lenslets inside the announced annulus and out of the clear zone', () => {
    for (const p of MYOPIA_LENSLETS) {
      expect(Math.hypot(p.x, p.y) - C.lensletDiameterMm / 2).toBeGreaterThanOrEqual(
        C.clearDiameterMm / 2,
      );
      expect(Math.hypot(p.x, p.y) + C.lensletDiameterMm / 2).toBeLessThanOrEqual(
        C.treatmentDiameterMm / 2,
      );
    }
  });
  it('retains trial endpoint means without generating individual growth predictions', () => {
    expect(MYOPIA_TRIAL.dims.n + MYOPIA_TRIAL.single.n).toBe(MYOPIA_TRIAL.completed);
    expect(MYOPIA_TRIAL.dims.axialMm).toBe(0.21);
    expect(MYOPIA_TRIAL.single.axialMm).toBe(0.53);
    expect(MYOPIA_TRIAL.dims.axialMm).toBeGreaterThan(0);
  });
  it('reconstructs the same state after reverse chapter seeks and rejects invalid computation', () => {
    const states = Array.from({ length: 7 }, (_, i) => myopiaShot(i, 0.65));
    for (let i = 6; i >= 0; i--) expect(myopiaShot(i, 0.65)).toEqual(states[i]);
    for (const input of [{ myopiaD: NaN }, { myopiaD: 6 }, { addD: Infinity }, { angleDeg: 21 }])
      expect(() => myopiaOptics(input)).toThrow(RangeError);
  });
});
