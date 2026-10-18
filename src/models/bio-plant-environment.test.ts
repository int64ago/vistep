import { it, expect } from 'vitest';
import {
  phytochromeState,
  vernalizationState,
  annualRingLayers,
  statolithPositions,
  tropicGrowth,
} from './bio-plant-environment';
it('conserves photoreceptor states and distinguishes a light signal from downstream change', () => {
  const s = phytochromeState(1, 'red');
  expect(s.active).toBeCloseTo(0.9 - 0.8 * Math.exp(-4), 12);
  expect(s.active + s.inactive).toBe(1);
  expect(phytochromeState(1, 'far-red', 0.9).active).toBeLessThan(s.active);
  expect(phytochromeState(0.1, 'red').downstream).toBe(0);
});
it('retains cold history rather than equating warmth with flowering', () => {
  expect(vernalizationState(0, 1).flowering).toBe(0);
  expect(vernalizationState(1, 1).flowering).toBe(1);
  expect(vernalizationState(1, 0).flowering).toBe(0);
  expect(vernalizationState(1, 1).memory).toBeCloseTo(1 - Math.exp(-3), 12);
});
it('keeps seasonal layers connected without crossing', () => {
  const layers = annualRingLayers(3, 0.8);
  for (const r of layers) {
    expect(r.springOuter).toBeGreaterThanOrEqual(r.inner);
    expect(r.outer).toBeGreaterThanOrEqual(r.springOuter);
  }
  expect(layers[0].outer).toBe(layers[1].inner);
  expect(layers[1].outer).toBe(layers[2].inner);
});
it('keeps statolith identity and sedimentation inside the drawn cell', () => {
  for (let n = 0; n <= 100; n++)
    for (const p of statolithPositions(n / 100)) {
      expect(Math.abs(p.x)).toBeLessThan(80);
      expect(p.y).toBeGreaterThan(-38);
      expect(p.y).toBeLessThan(38);
    }
  expect(statolithPositions(1, false)).toEqual(statolithPositions(0));
});
it('derives root and shoot curvature from opposite differential elongation', () => {
  const r = tropicGrowth(1, 'root'),
    s = tropicGrowth(1, 'shoot');
  expect(r.point(1).y).toBeGreaterThan(0);
  expect(s.point(1).y).toBeCloseTo(-r.point(1).y, 12);
  const integrate = (side: number) => {
    let sum = 0,
      prev = r.point(0, side);
    for (let i = 1; i <= 2000; i++) {
      const q = r.point(i / 2000, side);
      sum += Math.hypot(q.x - prev.x, q.y - prev.y);
      prev = q;
    }
    return sum;
  };
  expect(integrate(1)).toBeCloseTo(r.upperLength, 5);
  expect(integrate(-1)).toBeCloseTo(r.lowerLength, 5);
});
it('distinguishes reduced sensing from a non-growing injured root', () => {
  const intact = tropicGrowth(1),
    decapped = tropicGrowth(1, 'root', false),
    injured = tropicGrowth(1, 'root', false, false);
  expect(decapped.relativeElongation).toBeCloseTo(intact.relativeElongation, 12);
  expect(decapped.angle).toBeGreaterThan(0);
  expect(decapped.angle).toBeLessThan(intact.angle);
  expect(injured.relativeElongation).toBe(0);
});

it('removing the directional gravity signal preserves elongation without bending', () => {
  const f = tropicGrowth(1, 'root', true, true, false);
  expect(f.angle).toBe(0);
  expect(f.relativeElongation).toBeGreaterThan(0);
});

it('retains six distinct statoliths throughout sedimentation', () => {
  for (let n = 0; n <= 100; n++) {
    const a = statolithPositions(n / 100);
    for (let i = 0; i < 6; i++)
      for (let j = i + 1; j < 6; j++)
        expect(Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y)).toBeGreaterThan(14);
  }
});
