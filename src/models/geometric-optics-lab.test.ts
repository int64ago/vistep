import { expect, it } from 'vitest';
import {
  refractOut,
  cylinderRay,
  cylinderImage,
  chopstickImage,
  slabPins,
  apparentPlate,
} from './geometric-optics-lab';
it('conserves tangential wave vector at refraction and detects TIR', () => {
  const r = refractOut({ x: 0.6, y: 0.8 }, { x: 0, y: 1 }, 1, 1.5)!;
  expect(r.x * 1.5).toBeCloseTo(0.6);
  expect(Math.hypot(r.x, r.y)).toBeCloseTo(1);
  expect(refractOut({ x: 0.9, y: Math.sqrt(0.19) }, { x: 0, y: 1 }, 1.5, 1)).toBeNull();
});
it('cylinder rays cross water, glass and air and actually meet the observer', () => {
  for (const y of [-0.35, 0, 0.35]) {
    const r = cylinderRay({ x: -0.35, y }, 0.025)!;
    expect(r).not.toBeNull();
    expect(Math.hypot(r.water.x, r.water.y)).toBeCloseTo(1);
    expect(Math.hypot(r.glass.x, r.glass.y)).toBeCloseTo(1.06);
    expect(r.eye.y).toBeCloseTo(0.025, 8);
  }
  expect(cylinderImage(0)!.image.y).toBeCloseTo(0, 6);
  expect(chopstickImage(0.2)!.magnification).toBeGreaterThan(1);
});
it('uses the same Snell geometry for pins and inferred index', () => {
  const p = slabPins(45, 1.6);
  expect(p.inferred).toBeCloseTo(1.6);
  expect(p.viewOffset).toBeCloseTo(0);
  expect(slabPins(45, 1.6, 10).viewOffset).not.toBeCloseTo(0);
  expect(slabPins(60).shift).toBeGreaterThan(slabPins(20).shift);
});
it('apparent depth approaches d/n and remains shallower', () => {
  expect(apparentPlate(80, 1.6, 0).apparent).toBe(50);
  expect(apparentPlate(80, 1.6, 25).apparent).toBeLessThan(50);
});
