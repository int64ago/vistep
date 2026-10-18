import { expect, it } from 'vitest';
import { interfacePower, curvedRod, waterJet, corkIndex } from './total-reflection-lab';
it('conserves interface power, including normal incidence and TIR', () => {
  expect(interfacePower(0).R).toBeCloseTo(0.04);
  expect(interfacePower(Math.PI / 3).T).toBe(0);
  for (let i = 0; i < 90; i++)
    expect(
      interfacePower((i * Math.PI) / 180).R + interfacePower((i * Math.PI) / 180).T,
    ).toBeCloseTo(1);
});
it('derives rod reflection normals from the actual boundary', () => {
  const r = curvedRod(1.5);
  expect(r.steps.length).toBeGreaterThan(3);
  for (const s of r.steps) {
    expect(Math.hypot(s.normal.x, s.normal.y)).toBeCloseTo(1);
    expect(s.power).toBeGreaterThan(0);
    expect(s.R).toBeGreaterThanOrEqual(0);
  }
  expect(curvedRod(0.28).steps[0].R).toBeLessThan(curvedRod(1.5).steps[0].R);
});
it('ties a narrowing jet to the ballistic centerline and traces contained rays', () => {
  const a = waterJet(2),
    b = waterJet(1);
  expect(b.center(0.3).y / a.center(0.3).y).toBeCloseTo(4);
  expect(a.steps.length).toBeGreaterThan(2);
  expect(a.steps.every((s) => Number.isFinite(s.to.x + s.to.y + s.angle))).toBe(true);
});
it('derives the cork disappearance condition rather than fitting a visual threshold', () => {
  const c = corkIndex();
  expect(corkIndex(c.boundaryDepth, 20).inferredAtBoundary).toBeCloseTo(1.333);
  expect(corkIndex(10).hidden).toBe(true);
  expect(corkIndex(30).hidden).toBe(false);
});
