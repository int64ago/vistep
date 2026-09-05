import { describe, expect, it } from 'vitest';
import {
  thinLens,
  lensRay,
  circleOfConfusion,
  depthOfField,
  relativeLight,
  airyDiameter,
  cameraShot,
} from './optics';
describe('thin-lens optics', () => {
  it('converges rays from a common object point to the same inverted image', () => {
    const image = thinLens(50, 200);
    expect(image.image).toBeCloseTo(200 / 3);
    for (const h of [-20, -7, 0, 20])
      expect(lensRay(50, 200, 18, h).at(image.image!)).toBeCloseTo(-6);
  });
  it('handles the focal plane and virtual images without invalid rays', () => {
    expect(thinLens(50, 50).image).toBeNull();
    expect(lensRay(50, 50, 0, 12).outgoing).toBeCloseTo(0);
    expect(thinLens(50, 30).image).toBeCloseTo(-75);
    expect(thinLens(50, 30).magnification).toBeCloseTo(2.5);
    expect(thinLens(50, 30).real).toBe(false);
    expect(() => thinLens(0, 100)).toThrow();
  });
  it('places depth-of-field boundaries at the specified blur tolerance', () => {
    for (const n of [2, 4, 8, 16]) {
      const bounds = depthOfField(50, n, 2000);
      for (const distance of [bounds.near, bounds.far])
        expect(circleOfConfusion(50, n, distance, 2000)).toBeCloseTo(0.03, 9);
      expect(circleOfConfusion(50, n, 2000, 2000)).toBeCloseTo(0);
    }
    expect(depthOfField(50, 16, 10000).far).toBe(Infinity);
  });
  it('connects area, defocus diameter and diffraction to the same aperture', () => {
    expect(relativeLight(Math.sqrt(8))).toBeCloseTo(0.5);
    expect(relativeLight(4)).toBe(0.25);
    expect(circleOfConfusion(50, 4, 6000, 2000)).toBeCloseTo(
      circleOfConfusion(50, 2, 6000, 2000) / 2,
    );
    expect(airyDiameter(16)).toBeCloseTo(airyDiameter(8) * 2);
  });
  it('reconstructs chapter state directly for paused seeks', () => {
    expect(cameraShot(5, 1).sensor).toBeCloseTo(thinLens(50, 110).image!);
    expect(cameraShot(7, 0)).toEqual(cameraShot(7, 1));
    for (let c = 0; c < 8; c++)
      for (const p of [0, 0.5, 1])
        expect(Object.values(cameraShot(c, p)).every(Number.isFinite)).toBe(true);
  });
});
