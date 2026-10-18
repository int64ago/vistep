import { it, expect } from 'vitest';
import {
  pheromoneState,
  pheromoneGeometry,
  feedbackState,
  stabilityResponse,
  tankState,
  tankLayout,
  trialRate,
} from './bio-ecosystem-stability';
it('keeps insect bodies behind mesh and gives no directional signal for empty chamber', () => {
  for (const opaque of [false, true])
    for (let i = 0; i <= 100; i++) {
      const a = pheromoneState(i / 100, 240, true, opaque);
      expect(a.male.x - 13).toBeGreaterThan(opaque ? a.exit.x : a.mesh);
      expect(a.dots.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    }
  expect(pheromoneState(1, 240, false, true).response).toBe(0);
  expect(pheromoneState(0.3, 240, true).response).toBe(0);
});
it('routes hidden-source scent through a genuinely bent duct', () => {
  const g = pheromoneGeometry(240, true);
  expect(g.points[1].x).toBe(g.points[2].x);
  expect(g.points[1].y).not.toBe(g.points[2].y);
  expect(g.points[2].y).toBe(g.points[3].y);
});
it('damped feedback reduces deviations instead of resetting populations', () => {
  expect(feedbackState(0).herb).toBe(0.6);
  expect(Math.abs(feedbackState(1).herb)).toBeLessThan(0.01);
  expect(feedbackState(0.1).pred).toBeGreaterThan(0);
});
it('separates resistance amplitude from analytic recovery rate', () => {
  expect(stabilityResponse(0, 0.8, 1).initial).toBeCloseTo(0.6);
  expect(stabilityResponse(4, 0.8, 1, 0.5).value).toBeCloseTo(1 - 0.4 * Math.exp(-2));
  expect(stabilityResponse(0, 0.8, 3).initial).toBeGreaterThan(
    stabilityResponse(0, 0.8, 0).initial,
  );
  expect(stabilityResponse(3, 0.8, 1, 1).value).toBeGreaterThan(
    stabilityResponse(3, 0.8, 1, 0.1).value,
  );
  expect(stabilityResponse(10, 0.8, 1, 0).value).toBeCloseTo(0.6);
});
it('shows a threshold counterexample without universal-recovery assumptions', () => {
  expect(stabilityResponse(20, 0.9, 0, 1, true).value).toBeLessThan(0.02);
  expect(stabilityResponse(20, 0.6, 0, 1, true).value).toBeGreaterThan(0.95);
  expect(stabilityResponse(20, 0.75, 0, 1, true).value).toBeCloseTo(0.25);
});
it('balances internal oxygen exchange and biochemical carbon accounting', () => {
  for (const load of [0, 2, 8])
    for (const light of [0, 1]) {
      const s = tankState(72, light, load);
      expect(s.waterO + s.airO).toBeCloseTo(92 + s.photoTotal - s.respTotal, 8);
      expect(s.inorganicC + s.organicC).toBeCloseTo(132, 8);
      expect(s.waterO).toBeGreaterThanOrEqual(0);
      expect(s.airO).toBeGreaterThanOrEqual(0);
      expect(s.inorganicC).toBeGreaterThanOrEqual(0);
    }
  expect(tankState(24, 0).photoTotal).toBe(0);
  expect(tankState(72, 1, 8).waterO).toBeLessThan(tankState(72, 1, 2).waterO);
});
it('water meets the sloping terrain at the same geometric intersection', () => {
  for (const w of [240, 320, 700]) {
    const g = tankLayout(w);
    expect(
      g.landY + ((g.cross - g.landEdge) / (g.slopeEnd - g.landEdge)) * (g.soilY - g.landY),
    ).toBeCloseTo(g.waterY);
    expect(g.cross).toBeGreaterThan(g.landEdge);
    expect(g.cross).toBeLessThan(g.slopeEnd);
  }
});
it('keeps real response records blank and rejects impossible ratios', () => {
  expect(trialRate('', '10')).toBeNull();
  expect(trialRate('11', '10')).toBeNull();
  expect(trialRate('7', '10')).toBe(0.7);
  expect(trialRate('0', '10')).toBe(0);
});
