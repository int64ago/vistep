import { expect, it } from 'vitest';
import {
  griffithGroups,
  averyState,
  treatments,
  phageDnaPoint,
  phageCoatOffset,
  fractionPositions,
  hersheyChaseEvidence,
} from './bio-genetic-material';
it('distinguishes survival, recovery and selective removal without treating killed S as revived', () => {
  expect(griffithGroups.map((g) => g.mouseSurvives)).toEqual([true, false, true, false]);
  expect(griffithGroups[3]).toMatchObject({ liveS: false, recoveredS: true });
  for (const treatment of treatments) {
    const s = averyState(treatment);
    expect(s.transformed).toBe(treatment !== 'dnase');
    expect(s.components.filter((c) => !c.intact)).toHaveLength(treatment === 'none' ? 0 : 1);
  }
  expect(averyState('none', false).transformed).toBe(false);
});
it('keeps every genome point continuous through the head, tail and membrane interface', () => {
  for (let id = 0; id < 24; id++) {
    const start = phageDnaPoint(id, 0);
    expect(start.y).toBeLessThanOrEqual(103);
    const end = phageDnaPoint(id, 1);
    expect(end.y).toBeGreaterThanOrEqual(200);
    let previous = start;
    for (let k = 1; k <= 2000; k++) {
      const next = phageDnaPoint(id, k / 2000);
      expect(Math.hypot(next.x - previous.x, next.y - previous.y)).toBeLessThan(0.5);
      if (previous.y < 200 && next.y >= 200) expect(next.x).toBeCloseTo(175, 0);
      previous = next;
    }
  }
  expect(phageCoatOffset(0)).toEqual({ x: 0, y: -0 });
  expect(phageCoatOffset(1).x).toBeGreaterThan(0);
});
it('preserves cells and coats, makes omitted blending a real confound, and retains nonzero historical residuals', () => {
  const start = fractionPositions(0),
    end = fractionPositions(1),
    unblended = fractionPositions(1, false);
  expect(start.cells.map((c) => c.id)).toEqual(end.cells.map((c) => c.id));
  expect(end.cells.every((c) => c.y > 230)).toBe(true);
  expect(end.coats.every((c) => c.y < 200)).toBe(true);
  expect(unblended.coats.every((c) => c.y > 200)).toBe(true);
  expect(unblended.interpretable).toBe(false);
  expect(hersheyChaseEvidence.sulfur.releasedByShear).toBe(0.75);
  expect(hersheyChaseEvidence.phosphorus.releasedByShear).toBe(0.15);
  expect(hersheyChaseEvidence.sulfur.progeny.operator).toBe('<');
});
